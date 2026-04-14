from sqlmodel import Session
from typing import Optional
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
        logger.error(f"Failed to log activity {activity_type.value}: {e}")
        # Don't raise exception to avoid breaking main logic
        return None