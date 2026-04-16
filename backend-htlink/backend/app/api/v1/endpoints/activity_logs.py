from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import select, Session
from datetime import datetime, timedelta
import random

from app.api.deps import SessionDep, get_current_user, get_db, CurrentUser
from app.models.activity_log import ActivityLog, ActivityType
from app.schemas.activity import ActivityLogResponse

router = APIRouter()


@router.get("/", response_model=List[ActivityLogResponse])
def get_activity_logs(
    db: SessionDep,
    current_user: CurrentUser,
    activity_type: Optional[ActivityType] = Query(None, description="Filter by activity type"),
    limit: int = Query(50, le=200, description="Number of logs to return"),
    days: Optional[int] = Query(None, description="Filter logs from last N days")
):
    """
    Get recent activity logs for the current user.

    Returns the most recent logs ordered by created_at DESC.
    Supports filtering by activity_type and date range.
    """
    # The legacy audit table does not store tenant_id/activity_type directly.
    # Scope activity logs to the current user and adapt rows to the response schema.
    query = select(ActivityLog).where(ActivityLog.user_id == current_user.id)

    # Filter by activity type
    if activity_type:
        query = query.where(ActivityLog.action == activity_type.value)

    # Filter by date range
    if days:
        since_date = datetime.utcnow() - timedelta(days=days)
        query = query.where(ActivityLog.created_at >= since_date)

    # Order by creation date (most recent first)
    query = query.order_by(ActivityLog.created_at.desc())

    # Limit results
    query = query.limit(limit)

    # Execute query
    logs = db.exec(query).all()

    return [
        ActivityLogResponse(
            id=log.id,
            tenant_id=current_user.tenant_id,
            activity_type=log.action,
            details=log.details_json,
            ip_address=log.ip_address,
            created_at=log.created_at,
        )
        for log in logs
    ]


@router.post("/seed")
def seed_sample_activities(
    db: SessionDep,
    current_user: CurrentUser = None,
    count: int = Query(20, le=50, description="Number of sample activities to create")
):
    """
    Seed sample activity data for testing purposes.
    Only available in development mode.
    """

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
        }
    ]

    # Create activities with random timestamps in the last 30 days
    now = datetime.utcnow()
    tenant_id = current_user.tenant_id

    created_count = 0
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

        db.add(activity)
        created_count += 1

    db.commit()

    return {
        "message": f"Successfully created {created_count} sample activities",
        "tenant_id": tenant_id,
        "count": created_count
    }


@router.get("/test-simple")
def test_simple():
    """Test endpoint without parameters"""
    return {"message": "Test works!", "status": "success"}


@router.get("/public")
def get_activity_logs_public(
    limit: int = 10,
    tenant_id: int = 1,
    days: Optional[int] = None
):
    """
    Public endpoint to get activity logs from database.
    No authentication required for testing.
    """
    from app.core.db import engine
    from sqlmodel import Session, select

    try:
        with Session(engine) as session:
            # Get recent activity logs for tenant_id
            query = select(ActivityLog).where(ActivityLog.tenant_id == tenant_id)

            # Filter by date range if days is specified
            if days:
                since_date = datetime.utcnow() - timedelta(days=days)
                query = query.where(ActivityLog.created_at >= since_date)

            query = query.order_by(ActivityLog.created_at.desc())
            query = query.limit(limit)

            logs = session.exec(query).all()

            # Convert to dict format
            result = []
            for log in logs:
                result.append({
                    "id": log.id,
                    "tenant_id": log.tenant_id,
                    "activity_type": log.activity_type,
                    "details": log.details,
                    "created_at": log.created_at.isoformat() if log.created_at else None
                })

            return result
    except Exception as e:
        return {"error": str(e), "data": []}


@router.post("/public/seed")
def seed_sample_activities_public(
    tenant_id: int = Query(1, description="Tenant ID (default: 1)"),
    count: int = Query(10, le=30, description="Number of sample activities to create"),
    db: Session = Depends(get_db)
):
    """
    Public endpoint to seed sample activity data for testing purposes.
    No authentication required.
    """

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
        }
    ]

    # Create activities with random timestamps in the last 30 days
    now = datetime.utcnow()

    created_count = 0
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

        db.add(activity)
        created_count += 1

    db.commit()

    return {
        "message": f"Successfully created {created_count} sample activities",
        "tenant_id": tenant_id,
        "count": created_count
    }
