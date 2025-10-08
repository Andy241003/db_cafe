from sqlmodel import Session
from typing import Optional
from app.models.activity_log import ActivityLog, ActivityType
import logging

logger = logging.getLogger(__name__)


def log_activity(
    db: Session,
    tenant_id: int,
    activity_type: ActivityType,
    details: dict = None
) -> Optional[ActivityLog]:
    """
    Log an activity to the database safely.

    Args:
        db: Database session
        tenant_id: Tenant ID
        activity_type: Type of activity
        details: Additional details as dict

    Returns:
        ActivityLog object if successful, None if failed
    """
    try:
        activity_log = ActivityLog(
            tenant_id=tenant_id,
            activity_type=activity_type,
            details=details or {}
        )
        db.add(activity_log)
        db.commit()
        db.refresh(activity_log)
        return activity_log
    except Exception as e:
        logger.error(f"Failed to log activity {activity_type.value}: {e}")
        # Don't raise exception to avoid breaking main logic
        return None