#!/usr/bin/env python3
"""
Test script for Activity Tracking & Analytics system
"""
import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlmodel import Session, create_engine
from app.core.config import settings
from app.models.activity_log import ActivityType, ActivityLog
from app.utils.activity_logger import log_activity

def test_activity_logging():
    """Test the activity logging functionality"""
    print("🧪 Testing Activity Logging System...")

    # Create database engine
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI), echo=False)

    with Session(engine) as session:
        # Test logging different activity types
        activities = [
            (ActivityType.LOGIN, {"message": "User test@example.com logged in", "user_id": 1, "username": "test@example.com"}),
            (ActivityType.CREATE_FEATURE, {"message": "Feature 'WiFi' created", "feature_name": "WiFi"}),
            (ActivityType.UPDATE_USER, {"message": "User profile updated", "user_id": 1}),
            (ActivityType.DELETE_POST, {"message": "Post deleted", "post_id": 123}),
        ]

        for activity_type, details in activities:
            log = log_activity(
                db=session,
                tenant_id=1,  # demo tenant
                activity_type=activity_type,
                details=details
            )

            if log:
                print(f"✅ Logged {activity_type.value}: {log.details.get('message', 'No message')}")
            else:
                print(f"❌ Failed to log {activity_type.value}")

        # Query and display recent logs
        print("\n📋 Recent Activity Logs:")
        from sqlmodel import select
        logs = session.exec(
            select(ActivityLog)
            .where(ActivityLog.tenant_id == 1)
            .order_by(ActivityLog.created_at.desc())
            .limit(5)
        ).all()

        for log in logs:
            print(f"  - {log.activity_type.value}: {log.details.get('message', 'N/A')} ({log.created_at})")

    print("🎉 Activity logging test completed!")

if __name__ == "__main__":
    test_activity_logging()