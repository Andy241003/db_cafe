from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Enum, DECIMAL, BigInteger, SmallInteger
from sqlalchemy.dialects.mysql import LONGTEXT, MEDIUMTEXT
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum as PythonEnum
import enum


class UserRole(str, PythonEnum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    EDITOR = "EDITOR"
    VIEWER = "VIEWER"


class PostStatus(str, PythonEnum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class EventType(str, PythonEnum):
    PAGE_VIEW = "page_view"
    CLICK = "click"
    SHARE = "share"


class DeviceType(str, PythonEnum):
    DESKTOP = "desktop"
    TABLET = "tablet"
    MOBILE = "mobile"


class MediaKind(str, PythonEnum):
    IMAGE = "image"
    VIDEO = "video"
    FILE = "file"
    ICON = "icon"


# Plan model
class Plan(SQLModel, table=True):
    __tablename__ = "plans"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(max_length=50, unique=True)
    name: str = Field(max_length=120)
    features_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    tenants: List["Tenant"] = Relationship(back_populates="plan")


# Tenant model
class Tenant(SQLModel, table=True):
    __tablename__ = "tenants"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    plan_id: Optional[int] = Field(foreign_key="plans.id")
    name: str = Field(max_length=200)
    code: str = Field(max_length=80, unique=True)
    default_locale: str = Field(default="en", max_length=10)
    fallback_locale: str = Field(default="en", max_length=10)
    settings_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    plan: Optional[Plan] = Relationship(back_populates="tenants")
    admin_users: List["AdminUser"] = Relationship(back_populates="tenant")
    properties: List["Property"] = Relationship(back_populates="tenant")
    posts: List["Post"] = Relationship(back_populates="tenant")
    media_files: List["MediaFile"] = Relationship(back_populates="tenant")
    events: List["Event"] = Relationship(back_populates="tenant")
    # Analytics relationships
    page_views: List["PageView"] = Relationship(back_populates="tenant")
    activity_logs: List["ActivityLog"] = Relationship(back_populates="tenant")
    analytics_summaries: List["AnalyticsSummary"] = Relationship(back_populates="tenant")


# Locale model
class Locale(SQLModel, table=True):
    __tablename__ = "locales"
    
    code: str = Field(primary_key=True, max_length=10)
    name: str = Field(max_length=100)
    native_name: str = Field(max_length=100)


# AdminUser model
class AdminUser(SQLModel, table=True):
    __tablename__ = "admin_users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    email: str = Field(max_length=190)
    password_hash: str = Field(max_length=255)
    full_name: str = Field(max_length=180)
    role: UserRole = Field(default=UserRole.EDITOR)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    tenant: Tenant = Relationship(back_populates="admin_users")
    # Analytics relationships
    page_views: List["PageView"] = Relationship(back_populates="user")
    activity_logs: List["ActivityLog"] = Relationship(back_populates="user")


# Property model
class Property(SQLModel, table=True):
    __tablename__ = "properties"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    property_name: str = Field(max_length=255)
    code: str = Field(max_length=100)
    
    # Basic info
    slogan: Optional[str] = Field(max_length=255)
    description: Optional[str] = Field(sa_column=Column(Text))
    logo_url: Optional[str] = Field(max_length=255)
    banner_images: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    intro_video_url: Optional[str] = Field(max_length=255)
    vr360_url: Optional[str] = Field(max_length=255)
    
    # Contact & Location
    address: Optional[str] = Field(max_length=255)
    district: Optional[str] = Field(max_length=100)
    city: Optional[str] = Field(max_length=100)
    country: Optional[str] = Field(max_length=100)
    postal_code: Optional[str] = Field(max_length=20)
    phone_number: Optional[str] = Field(max_length=50)
    email: Optional[str] = Field(max_length=100)
    website_url: Optional[str] = Field(max_length=255)
    zalo_oa_id: Optional[str] = Field(max_length=50)
    facebook_url: Optional[str] = Field(max_length=255)
    youtube_url: Optional[str] = Field(max_length=255)
    tiktok_url: Optional[str] = Field(max_length=255)
    instagram_url: Optional[str] = Field(max_length=255)
    google_map_url: Optional[str] = Field(max_length=512)
    latitude: Optional[float] = Field(sa_column=Column(DECIMAL(10, 8)))
    longitude: Optional[float] = Field(sa_column=Column(DECIMAL(11, 8)))
    
    # Branding
    primary_color: Optional[str] = Field(max_length=255)  # Support CSS gradients
    secondary_color: Optional[str] = Field(max_length=255)
    
    # Legal
    copyright_text: Optional[str] = Field(max_length=255)
    terms_url: Optional[str] = Field(max_length=255)
    privacy_url: Optional[str] = Field(max_length=255)
    
    # Settings
    timezone: Optional[str] = Field(max_length=60)
    default_locale: str = Field(max_length=10)
    settings_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    tenant: Tenant = Relationship(back_populates="properties")


# Feature Category model
class FeatureCategory(SQLModel, table=True):
    __tablename__ = "feature_categories"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(default=0)  # 0 means system-wide
    slug: str = Field(max_length=100)
    icon_key: Optional[str] = Field(max_length=120)
    is_system: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Feature Category Translation model
class FeatureCategoryTranslation(SQLModel, table=True):
    __tablename__ = "feature_category_translations"
    
    category_id: int = Field(foreign_key="feature_categories.id", primary_key=True)
    locale: str = Field(foreign_key="locales.code", primary_key=True, max_length=10)
    title: str = Field(max_length=200)
    short_desc: Optional[str] = Field(max_length=500)


# Feature model
class Feature(SQLModel, table=True):
    __tablename__ = "features"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(default=0)  # 0 means system-wide
    category_id: int = Field(foreign_key="feature_categories.id")
    slug: str = Field(max_length=120)
    icon_key: Optional[str] = Field(max_length=120)
    is_system: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Feature Translation model
class FeatureTranslation(SQLModel, table=True):
    __tablename__ = "feature_translations"
    
    feature_id: int = Field(foreign_key="features.id", primary_key=True)
    locale: str = Field(foreign_key="locales.code", primary_key=True, max_length=10)
    title: str = Field(max_length=200)
    short_desc: Optional[str] = Field(max_length=500)


# Property Category (junction table for property -> categories)
class PropertyCategory(SQLModel, table=True):
    __tablename__ = "property_categories"
    
    property_id: int = Field(foreign_key="properties.id", primary_key=True)
    category_id: int = Field(foreign_key="feature_categories.id", primary_key=True)
    is_enabled: bool = Field(default=True)
    sort_order: int = Field(default=100)


# Property Feature (junction table for property -> features)
class PropertyFeature(SQLModel, table=True):
    __tablename__ = "property_features"
    
    property_id: int = Field(foreign_key="properties.id", primary_key=True)
    feature_id: int = Field(foreign_key="features.id", primary_key=True)
    is_enabled: bool = Field(default=True)
    sort_order: int = Field(default=100)


# Post model
class Post(SQLModel, table=True):
    __tablename__ = "posts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    property_id: int = Field(foreign_key="properties.id")
    feature_id: int = Field(foreign_key="features.id")
    slug: str = Field(max_length=160)
    status: PostStatus = Field(default=PostStatus.DRAFT)
    pinned: bool = Field(default=True)
    cover_media_id: Optional[int] = Field(foreign_key="media_files.id")
    published_at: Optional[datetime] = Field(default=None)
    created_by: Optional[int] = Field(foreign_key="admin_users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    tenant: Tenant = Relationship(back_populates="posts")
    property: Property = Relationship()
    feature: Feature = Relationship()


# Post Translation model
class PostTranslation(SQLModel, table=True):
    __tablename__ = "post_translations"
    
    post_id: int = Field(foreign_key="posts.id", primary_key=True)
    locale: str = Field(foreign_key="locales.code", primary_key=True, max_length=10)
    title: str = Field(max_length=250)
    subtitle: Optional[str] = Field(max_length=300)
    content_html: str = Field(sa_column=Column(MEDIUMTEXT))
    seo_title: Optional[str] = Field(max_length=250)
    seo_desc: Optional[str] = Field(max_length=300)
    og_image_id: Optional[int] = Field(foreign_key="media_files.id")


# Media File model
class MediaFile(SQLModel, table=True):
    __tablename__ = "media_files"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    uploader_id: Optional[int] = Field(foreign_key="admin_users.id")
    kind: MediaKind
    mime_type: Optional[str] = Field(max_length=120)
    file_key: str = Field(max_length=255)
    width: Optional[int] = None
    height: Optional[int] = None
    size_bytes: Optional[int] = None
    alt_text: Optional[str] = Field(max_length=300)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    tenant: Tenant = Relationship(back_populates="media_files")


# Post Media (junction table for post -> media)
class PostMedia(SQLModel, table=True):
    __tablename__ = "post_media"
    
    post_id: int = Field(foreign_key="posts.id", primary_key=True)
    media_id: int = Field(foreign_key="media_files.id", primary_key=True)
    sort_order: int = Field(default=100)


# Event model
class Event(SQLModel, table=True):
    __tablename__ = "events"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    property_id: int = Field(foreign_key="properties.id")
    category_id: Optional[int] = Field(foreign_key="feature_categories.id")
    feature_id: Optional[int] = Field(foreign_key="features.id")
    post_id: Optional[int] = Field(foreign_key="posts.id")
    locale: Optional[str] = Field(max_length=10)
    event_type: EventType
    device: Optional[DeviceType] = None
    user_agent: Optional[str] = Field(max_length=255)
    ip_hash: Optional[str] = Field(max_length=64)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    tenant: Tenant = Relationship(back_populates="events")
    property: Property = Relationship()


# Settings model
class Setting(SQLModel, table=True):
    __tablename__ = "settings"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(default=0)
    property_id: int = Field(default=0)
    key_name: str = Field(max_length=160)
    value_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))


# Schema models for API
class AdminUserCreate(SQLModel):
    email: str
    password: str
    full_name: str
    role: UserRole = UserRole.EDITOR
    tenant_id: int


class AdminUserUpdate(SQLModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class LocaleCreate(SQLModel):
    code: str
    name: str
    native_name: str


class LocaleUpdate(SQLModel):
    name: Optional[str] = None
    native_name: Optional[str] = None


class FeatureTranslationCreate(SQLModel):
    feature_id: int
    locale: str
    title: str
    short_desc: Optional[str] = None


class FeatureTranslationUpdate(SQLModel):
    title: Optional[str] = None
    short_desc: Optional[str] = None


class PostTranslationCreate(SQLModel):
    post_id: int
    locale: str
    title: str
    subtitle: Optional[str] = None
    content_html: str
    seo_title: Optional[str] = None
    seo_desc: Optional[str] = None
    og_image_id: Optional[int] = None


class PostTranslationUpdate(SQLModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content_html: Optional[str] = None
    seo_title: Optional[str] = None
    seo_desc: Optional[str] = None
    og_image_id: Optional[int] = None


class FeatureCategoryTranslationCreate(SQLModel):
    category_id: int
    locale: str
    title: str
    short_desc: Optional[str] = None


class FeatureCategoryTranslationUpdate(SQLModel):
    title: Optional[str] = None
    short_desc: Optional[str] = None


class FeatureCategoryCreate(SQLModel):
    slug: str
    icon_key: Optional[str] = None
    is_system: bool = False


class FeatureCategoryUpdate(SQLModel):
    slug: Optional[str] = None
    icon_key: Optional[str] = None
    is_system: Optional[bool] = None


class PropertyCategoryCreate(SQLModel):
    property_id: int
    category_id: int
    is_enabled: bool = True
    sort_order: int = 100


class PropertyCategoryUpdate(SQLModel):
    is_enabled: Optional[bool] = None
    sort_order: Optional[int] = None


# Analytics & Activity Tracking Models
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
    tenant: Tenant = Relationship(back_populates="page_views")
    user: Optional[AdminUser] = Relationship(back_populates="page_views")

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
    extra_data: Optional[str] = Field(default=None)  # JSON string for extra data
    ip_address: Optional[str] = Field(default=None, max_length=45)
    user_agent: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    tenant: Tenant = Relationship(back_populates="activity_logs")
    user: Optional[AdminUser] = Relationship(back_populates="activity_logs")

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
    tenant: Tenant = Relationship(back_populates="analytics_summaries")

# Import all models to ensure they are registered
__all__ = [
    "Plan", "Tenant", "Locale", "AdminUser", "Property",
    "FeatureCategory", "FeatureCategoryTranslation", 
    "Feature", "FeatureTranslation",
    "PropertyCategory", "PropertyFeature",
    "Post", "PostTranslation", "MediaFile", "PostMedia",
    "Event", "Setting",
    "UserRole", "PostStatus", "EventType", "DeviceType", "MediaKind",
    # Analytics models
    "ActivityType", "PageView", "ActivityLog", "AnalyticsSummary",
    "AdminUserCreate", "AdminUserUpdate",
    "LocaleCreate", "LocaleUpdate",
    "FeatureTranslationCreate", "FeatureTranslationUpdate",
    "PostTranslationCreate", "PostTranslationUpdate",
    "FeatureCategoryTranslationCreate", "FeatureCategoryTranslationUpdate",
    "FeatureCategoryCreate", "FeatureCategoryUpdate",
    "PropertyCategoryCreate", "PropertyCategoryUpdate"
]