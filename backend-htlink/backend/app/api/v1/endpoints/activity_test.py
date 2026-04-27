from fastapi import APIRouter
from typing import List
from app.core.db import engine
from sqlmodel import Session, select
from app.models.activity_log import ActivityLog

router = APIRouter()

@router.get("/")
def get_activities():
    """Simple endpoint to get activity logs from database"""
    try:
        with Session(engine) as session:
            # Get recent activity logs for tenant_id=1
            query = select(ActivityLog).where(ActivityLog.tenant_id == 1)
            query = query.order_by(ActivityLog.created_at.desc())
            query = query.limit(10)
            
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
            
            return {
                "success": True,
                "count": len(result),
                "data": result
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

