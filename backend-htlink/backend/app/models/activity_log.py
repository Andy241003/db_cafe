from sqlmodel import Field, SQLModel, Column
from sqlalchemy import DateTime, JSON
from datetime import datetime
from typing import Optional, Dict, Any
import enum


class ActivityType(str, enum.Enum):
    LOGIN = "login"
    LOGOUT = "logout"

    CREATE_CATEGORY = "create_category"
    UPDATE_CATEGORY = "update_category"
    DELETE_CATEGORY = "delete_category"

    CREATE_FEATURE = "create_feature"
    UPDATE_FEATURE = "update_feature"
    DELETE_FEATURE = "delete_feature"

    UPLOAD_MEDIA = "upload_media"
    UPDATE_MEDIA = "update_media"
    DELETE_MEDIA = "delete_media"

    CREATE_USER = "create_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"

    CREATE_POST = "create_post"
    UPDATE_POST = "update_post"
    DELETE_POST = "delete_post"
    PUBLISH_POST = "publish_post"
    ARCHIVE_POST = "archive_post"

    CREATE_PROPERTY = "create_property"
    UPDATE_PROPERTY = "update_property"
    DELETE_PROPERTY = "delete_property"

    USER_CREATE_SETTINGS = "user_create_settings"
    USER_UPDATE_SETTINGS = "user_update_settings"
    USER_DELETE_SETTINGS = "user_delete_settings"

    CREATE_TRANSLATION = "create_translation"
    UPDATE_TRANSLATION = "update_translation"
    DELETE_TRANSLATION = "delete_translation"

    ANALYTICS_EVENT = "analytics_event"
    SYSTEM_UPDATE = "system_update"


class ActivityLog(SQLModel, table=True):
    """Track user activities for audit trail"""
    __tablename__ = "activity_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    activity_type: ActivityType = Field(default=ActivityType.SYSTEM_UPDATE)
    details: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())


class AnalyticsSummary(SQLModel, table=True):
    """Daily/Monthly analytics summary for performance"""
    __tablename__ = "analytics_summary"

    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    date: datetime = Field(sa_column=Column(DateTime, index=True))
    period_type: str = Field(max_length=10)  # daily, monthly
    total_page_views: int = Field(default=0)
    unique_visitors: int = Field(default=0)
    total_activities: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)