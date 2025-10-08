from functools import wraps
from typing import Callable, Any, Optional
from fastapi import Request, Response
from sqlmodel import Session
from app.models.activity_log import ActivityType
from app.utils.activity_logger import log_activity
from app.api.deps import get_current_user, SessionDep
import logging
import json
from datetime import datetime, date

logger = logging.getLogger(__name__)


class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime objects"""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


def _make_json_serializable(obj):
    """Convert object to JSON-serializable format"""
    try:
        return json.loads(json.dumps(obj, cls=DateTimeEncoder))
    except (TypeError, ValueError):
        return str(obj)


def track_activity(
    activity_type: ActivityType,
    message_template: Optional[str] = None
):
    """
    Decorator to track activity after successful route execution.

    Args:
        activity_type: The type of activity to log
        message_template: Template string with placeholders like {user}, {name}, etc.
                         If None, defaults to "{activity_type} performed by {user}"
    """
    def decorator(func: Callable) -> Callable:
        import asyncio
        import inspect

        # Check if function is async
        is_async = asyncio.iscoroutinefunction(func)

        if is_async:
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                # Try to find Session and current_user in kwargs
                db = kwargs.get('db') or kwargs.get('session')
                current_user = kwargs.get('current_user')

                # Execute the original function
                try:
                    result = await func(*args, **kwargs)

                    # Only log if response is successful (2xx)
                    if hasattr(result, 'status_code'):
                        if 200 <= result.status_code < 300:
                            await _log_activity_safe(db, current_user, activity_type, message_template, kwargs)
                    else:
                        # Assume success if no status_code (direct return)
                        await _log_activity_safe(db, current_user, activity_type, message_template, kwargs)

                    return result

                except Exception as e:
                    # Re-raise the original exception
                    raise e

            return async_wrapper
        else:
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                # Try to find Session and current_user in kwargs
                db = kwargs.get('db') or kwargs.get('session')
                current_user = kwargs.get('current_user')

                # Execute the original function
                try:
                    result = func(*args, **kwargs)

                    # Only log if response is successful (2xx)
                    if hasattr(result, 'status_code'):
                        if 200 <= result.status_code < 300:
                            # Can't await in sync function, so skip logging
                            pass
                    else:
                        # Assume success if no status_code (direct return)
                        # Can't await in sync function, so skip logging
                        pass

                    return result

                except Exception as e:
                    # Re-raise the original exception
                    raise e

            return sync_wrapper
    return decorator


async def _log_activity_safe(db: Session, current_user, activity_type: ActivityType, message_template: str, kwargs: dict):
    """Safely log activity without breaking main logic"""
    try:
        if not db or not current_user:
            return

        tenant_id = getattr(current_user, 'tenant_id', None)
        username = getattr(current_user, 'email', 'unknown')  # Use email as username

        if not tenant_id:
            return

        # Build message
        if message_template:
            message = message_template.format(
                user=username,
                **kwargs  # Allow other kwargs to be used in template
            )
        else:
            message = f"{activity_type.value.replace('_', ' ')} performed by {username}"

        details = {
            "message": message,
            "user_id": getattr(current_user, 'id', None),
            "username": username
        }

        # Add any relevant data from kwargs to details
        # Exclude current_user since we already extracted info from it
        excluded_keys = {'current_user', 'session', 'db', 'tenant_id'}
        for key, value in kwargs.items():
            if key in excluded_keys:
                continue
                
            if hasattr(value, 'model_dump'):  # Pydantic v2 models
                try:
                    details[key] = _make_json_serializable(value.model_dump())
                except:
                    details[key] = str(value)
            elif hasattr(value, 'dict'):  # Pydantic v1 models
                try:
                    details[key] = _make_json_serializable(value.dict())
                except:
                    details[key] = str(value)
            elif isinstance(value, (str, int, float, bool)):
                details[key] = value
            elif isinstance(value, (datetime, date)):
                details[key] = value.isoformat()
            else:
                # Try to make it JSON serializable
                try:
                    details[key] = _make_json_serializable(value)
                except:
                    details[key] = str(value)

        log_activity(db, tenant_id, activity_type, details)

    except Exception as e:
        logger.error(f"Failed to track activity {activity_type.value}: {e}")
        # Don't raise - activity logging should never break main functionality