# app/models/analytics.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional
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
    DELETE_MEDIA = "delete_media"
    CREATE_USER = "create_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"
    SYSTEM_UPDATE = "system_update"

class PageView(SQLModel, table=True):
    """Track page views for analytics"""
    __tablename__ = "page_views"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    user_id: Optional[int] = Field(default=None, foreign_key="admin_users.id")
    page_path: str = Field(max_length=255)
    ip_address: Optional[str] = Field(default=None, max_length=45)
    user_agent: Optional[str] = Field(default=None, max_length=500)
    referrer: Optional[str] = Field(default=None, max_length=500)
    session_id: Optional[str] = Field(default=None, max_length=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    tenant: "Tenant" = Relationship(back_populates="page_views")
    user: Optional["AdminUser"] = Relationship(back_populates="page_views")

class ActivityLog(SQLModel, table=True):
    """Track user activities for audit trail"""
    __tablename__ = "activity_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    user_id: Optional[int] = Field(default=None, foreign_key="admin_users.id")
    activity_type: ActivityType
    entity_type: Optional[str] = Field(default=None, max_length=50)  # category, feature, user, etc.
    entity_id: Optional[int] = Field(default=None)
    description: str = Field(max_length=500)
    metadata: Optional[str] = Field(default=None)  # JSON string for extra data
    ip_address: Optional[str] = Field(default=None, max_length=45)
    user_agent: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    tenant: "Tenant" = Relationship(back_populates="activity_logs")
    user: Optional["AdminUser"] = Relationship(back_populates="activity_logs")

class AnalyticsSummary(SQLModel, table=True):
    """Daily/Monthly analytics summary for performance"""
    __tablename__ = "analytics_summary"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    date: datetime = Field(index=True)
    period_type: str = Field(max_length=10)  # daily, monthly
    total_page_views: int = Field(default=0)
    unique_visitors: int = Field(default=0)
    total_activities: int = Field(default=0)
    categories_created: int = Field(default=0)
    features_created: int = Field(default=0)
    users_active: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    tenant: "Tenant" = Relationship(back_populates="analytics_summaries")