from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.activity_log import ActivityType


class ActivityLogBase(BaseModel):
    tenant_id: int
    activity_type: ActivityType
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime


class ActivityLogResponse(ActivityLogBase):
    id: int
    
    class Config:
        from_attributes = True
