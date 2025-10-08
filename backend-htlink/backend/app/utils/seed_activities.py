# app/utils/seed_activities.py
from datetime import datetime, timedelta
from sqlmodel import Session
from app.models.activity_log import ActivityLog, ActivityType
from app.core.db import engine
import random

def seed_sample_activities(tenant_id: int = 1, count: int = 20):
    """Seed sample activity logs for testing"""
    
    with Session(engine) as session:
        # Clear existing activities for this tenant
        existing = session.query(ActivityLog).filter(ActivityLog.tenant_id == tenant_id).all()
        for activity in existing:
            session.delete(activity)
        
        # Sample activity data
        activities = [
            {
                "activity_type": ActivityType.CREATE_FEATURE,
                "details": {
                    "feature_name": "WiFi Information",
                    "category_name": "Services",
                    "username": "Admin User",
                    "message": "New feature 'WiFi Information' was added to Services category"
                }
            },
            {
                "activity_type": ActivityType.UPDATE_CATEGORY,
                "details": {
                    "category_name": "Services",
                    "username": "Editor User",
                    "message": "Category 'Services' was updated with new translations"
                }
            },
            {
                "activity_type": ActivityType.CREATE_POST,
                "details": {
                    "post_title": "Hotel Amenities Guide",
                    "username": "Content Manager",
                    "message": "New post 'Hotel Amenities Guide' was created"
                }
            },
            {
                "activity_type": ActivityType.UPLOAD_MEDIA,
                "details": {
                    "filename": "hotel-lobby.jpg",
                    "username": "Editor User",
                    "message": "New image 'hotel-lobby.jpg' was uploaded"
                }
            },
            {
                "activity_type": ActivityType.PUBLISH_POST,
                "details": {
                    "post_title": "Welcome to our hotel",
                    "username": "Admin User",
                    "message": "Post 'Welcome to our hotel' was published"
                }
            },
            {
                "activity_type": ActivityType.CREATE_CATEGORY,
                "details": {
                    "category_name": "Dining",
                    "username": "Admin User",
                    "message": "New category 'Dining' was created"
                }
            },
            {
                "activity_type": ActivityType.UPDATE_FEATURE,
                "details": {
                    "feature_name": "Restaurant Hours",
                    "username": "Manager User",
                    "message": "Feature 'Restaurant Hours' was updated"
                }
            },
            {
                "activity_type": ActivityType.LOGIN,
                "details": {
                    "username": "Admin User",
                    "message": "User logged in"
                }
            },
            {
                "activity_type": ActivityType.CREATE_USER,
                "details": {
                    "username": "System Admin",
                    "new_user": "Staff User",
                    "message": "New user 'Staff User' was created"
                }
            },
            {
                "activity_type": ActivityType.DELETE_FEATURE,
                "details": {
                    "feature_name": "Old Feature",
                    "username": "Admin User",
                    "message": "Feature 'Old Feature' was deleted"
                }
            }
        ]
        
        # Create activities with random timestamps in the last 30 days
        now = datetime.utcnow()
        
        for i in range(count):
            activity_data = activities[i % len(activities)]
            
            # Random time in the last 30 days
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            
            created_at = now - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
            
            activity = ActivityLog(
                tenant_id=tenant_id,
                activity_type=activity_data["activity_type"],
                details=activity_data["details"],
                created_at=created_at
            )
            
            session.add(activity)
        
        session.commit()
        print(f"✅ Created {count} sample activities for tenant {tenant_id}")

if __name__ == "__main__":
    # Run this to seed sample data
    seed_sample_activities(tenant_id=1, count=25)
    print("Sample activities seeded successfully!")
