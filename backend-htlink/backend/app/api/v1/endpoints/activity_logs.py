from sqlalchemy.orm import Session
from datetime import datetime
from app.models import ActivityLog, ActivityType

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.db import get_db


router = APIRouter()

def log_activity(
    db: Session,
    tenant_id: int,
    activity_type: ActivityType,
    details: dict
):
    """
    Ghi log hoạt động người dùng vào bảng activity_logs
    """
    log = ActivityLog(
        tenant_id=tenant_id,
        activity_type=activity_type,
        details=details,
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.get("/", response_model=List[ActivityLog])
def get_activity_logs(
    tenant_id: int = Query(...),
    limit: int = Query(10),
    db: Session = Depends(get_db)
):
    """
    Trả về danh sách log mới nhất cho tenant
    """
    logs = (
        db.query(ActivityLog)
        .filter(ActivityLog.tenant_id == tenant_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return logs
