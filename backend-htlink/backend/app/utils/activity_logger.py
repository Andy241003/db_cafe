from sqlmodel import Session
from typing import Optional, Any
from app.models.activity_log import ActivityLog, ActivityType
import logging

logger = logging.getLogger(__name__)


def log_activity(
    db: Session,
    activity_type: ActivityType,
    details: dict = None,
    ip_address: str = None
) -> Optional[ActivityLog]:
    """
    Log an activity to the database safely.

    Args:
        db: Database session
        activity_type: Type of activity
        details: Additional details as dict
        ip_address: Optional IP address for tracking

    Returns:
        ActivityLog object if successful, None if failed
    """
    try:
        activity_details = details or {}

        # Extract user_id from details if provided
        user_id = activity_details.get('user_id')

        # Create activity log entry matching actual table schema
        # Note: Using action instead of activity_type, and user_id instead of tenant_id
        activity_log = ActivityLog(
            user_id=user_id,
            action=activity_type.value,  # Convert enum to string
            resource_type="auth",  # Default for login/logout
            resource_id=None,
            details_json=activity_details,
            ip_address=ip_address,
            user_agent=None  # Could be added later if needed
        )
        db.add(activity_log)
        db.commit()
        db.refresh(activity_log)
        return activity_log
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to log activity {activity_type.value}: {e}")
        # Don't raise exception to avoid breaking main logic
        return None


def log_user_activity(
    db: Session,
    current_user: Any,
    activity_type: ActivityType,
    message: str,
    *,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    extra_details: Optional[dict] = None,
) -> Optional[ActivityLog]:
    """
    Convenience wrapper for activity logs tied to the current authenticated user.
    """
    try:
        activity_details = dict(extra_details or {})
        activity_details.setdefault("message", message)
        activity_details.setdefault("user_id", getattr(current_user, "id", None))
        activity_details.setdefault("username", getattr(current_user, "email", "unknown"))

        activity_log = ActivityLog(
            user_id=getattr(current_user, "id", None),
            action=activity_type.value,
            resource_type=resource_type,
            resource_id=resource_id,
            details_json=activity_details,
            ip_address=ip_address,
            user_agent=None,
        )
        db.add(activity_log)
        db.commit()
        db.refresh(activity_log)
        return activity_log
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to log user activity {activity_type.value}: {e}")
        return None
