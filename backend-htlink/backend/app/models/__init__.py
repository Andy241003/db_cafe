from sqlmodel import Field, SQLModel
from sqlalchemy import Column, String, JSON, Text, BigInteger, Enum, DECIMAL
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum as PythonEnum


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


class MediaSource(str, PythonEnum):
    TRAVEL = "travel"
    VR_HOTEL = "vr_hotel"
    GENERAL = "general"


# Stub models for tables NOT in DB (needed for imports to work)
class Plan(SQLModel, table=True):
    __tablename__ = "plans"
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(max_length=50, unique=True)
    name: str = Field(max_length=120)
    features_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Tenant(SQLModel, table=True):
    __tablename__ = "tenants"
    id: Optional[int] = Field(default=None, primary_key=True)
    plan_id: Optional[int] = Field(default=None, foreign_key="plans.id")
    name: str = Field(max_length=200)
    code: str = Field(max_length=80, unique=True)
    default_locale: str = Field(default="en", max_length=10)
    fallback_locale: str = Field(default="en", max_length=10)
    settings_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class Property(SQLModel, table=True):
    __tablename__ = "properties"
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: Optional[int] = Field(default=None, foreign_key="tenants.id")
    property_name: str = Field(max_length=255)
    code: str = Field(max_length=100)
    is_active: bool = Field(default=True)
    tracking_key: Optional[str] = Field(default=None, max_length=64, unique=True)
    default_locale: str = Field(default="en", max_length=10)
    settings_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class PropertyTranslation(SQLModel, table=True):
    __tablename__ = "property_translations"
    id: Optional[int] = Field(default=None, primary_key=True)
    property_id: int = Field(foreign_key="properties.id")
    locale: str = Field(max_length=10)
    property_name: Optional[str] = Field(default=None, max_length=255)
    slogan: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None)
    address: Optional[str] = Field(default=None, max_length=255)
    district: Optional[str] = Field(default=None, max_length=100)
    city: Optional[str] = Field(default=None, max_length=100)
    country: Optional[str] = Field(default=None, max_length=100)
    copyright_text: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class FeatureCategory(SQLModel, table=True):
    __tablename__ = "feature_categories"
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(default=0)
    slug: str = Field(max_length=100)
    icon_key: Optional[str] = Field(default=None, max_length=120)
    priority: int = Field(default=0)
    is_system: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Feature(SQLModel, table=True):
    __tablename__ = "features"
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(default=0)
    category_id: int = Field(foreign_key="feature_categories.id")
    slug: str = Field(max_length=120)
    icon_key: Optional[str] = Field(default=None, max_length=120)
    is_system: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Event(SQLModel, table=True):
    __tablename__ = "events"
    id: Optional[int] = Field(default=None, sa_column=Column(BigInteger, primary_key=True))
    tenant_id: Optional[int] = Field(default=None)
    property_id: Optional[int] = Field(default=None)
    category_id: Optional[int] = Field(default=None)
    feature_id: Optional[int] = Field(default=None)
    post_id: Optional[int] = Field(default=None)
    locale: Optional[str] = Field(default=None, max_length=10)
    event_type: str = Field(max_length=50)
    device: Optional[str] = Field(default=None, max_length=20)
    user_agent: Optional[str] = Field(default=None, max_length=255)
    ip_hash: Optional[str] = Field(default=None, max_length=64)
    url: Optional[str] = Field(default=None, max_length=500)
    referrer: Optional[str] = Field(default=None, max_length=500)
    session_id: Optional[str] = Field(default=None, max_length=100)
    page_title: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AnalyticsSummary(SQLModel, table=True):
    __tablename__ = "analytics_summaries"
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: Optional[int] = Field(default=None)
    property_id: Optional[int] = Field(default=None)
    date: Optional[str] = Field(default=None, max_length=20)
    total_views: int = Field(default=0)
    unique_sessions: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Models that exist in DB
class Locale(SQLModel, table=True):
    __tablename__ = "locales"
    code: str = Field(primary_key=True, max_length=10)
    name: str = Field(max_length=100)
    native_name: str = Field(max_length=100)


class AdminUser(SQLModel, table=True):
    __tablename__ = "admin_users"
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: Optional[int] = Field(default=None, foreign_key="tenants.id")
    email: str = Field(max_length=190)
    password_hash: str = Field(max_length=255)
    full_name: str = Field(max_length=180)
    role: UserRole = Field(default=UserRole.EDITOR)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class MediaFile(SQLModel, table=True):
    __tablename__ = "media_files"
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    uploader_id: Optional[int] = Field(default=None, foreign_key="admin_users.id")
    kind: str
    mime_type: Optional[str] = Field(default=None, max_length=120)
    file_key: str = Field(max_length=255)
    original_filename: Optional[str] = Field(default=None, max_length=255)
    width: Optional[int] = None
    height: Optional[int] = None
    size_bytes: Optional[int] = None
    alt_text: Optional[str] = Field(default=None, max_length=300)
    source: Optional[str] = Field(default="general", sa_column=Column(String(20)))
    entity_type: Optional[str] = Field(default=None, sa_column=Column(String(50)))
    entity_id: Optional[int] = Field(default=None)
    folder: Optional[str] = Field(default=None, sa_column=Column(String(100)))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Setting(SQLModel, table=True):
    __tablename__ = "settings"
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(default=0)
    property_id: int = Field(default=0)
    key_name: str = Field(max_length=160)
    value_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))


# Translation models for translatable content
class FeatureCategoryTranslation(SQLModel, table=True):
    __tablename__ = "feature_category_translations"
    id: Optional[int] = Field(default=None, primary_key=True)
    category_id: int = Field(foreign_key="feature_categories.id")
    locale: str = Field(max_length=10)
    title: str = Field(max_length=200)
    short_desc: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FeatureTranslation(SQLModel, table=True):
    __tablename__ = "feature_translations"
    id: Optional[int] = Field(default=None, primary_key=True)
    feature_id: int = Field(foreign_key="features.id")
    locale: str = Field(max_length=10)
    title: str = Field(max_length=200)
    short_desc: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Junction/relationship models between properties and categories/features
class PropertyCategory(SQLModel, table=True):
    __tablename__ = "property_categories"
    id: Optional[int] = Field(default=None, primary_key=True)
    property_id: int = Field(foreign_key="properties.id")
    category_id: int = Field(foreign_key="feature_categories.id")
    is_enabled: bool = Field(default=True)
    sort_order: int = Field(default=100)


class PropertyFeature(SQLModel, table=True):
    __tablename__ = "property_features"
    id: Optional[int] = Field(default=None, primary_key=True)
    property_id: int = Field(foreign_key="properties.id")
    feature_id: int = Field(foreign_key="features.id")
    is_enabled: bool = Field(default=True)
    sort_order: int = Field(default=100)


# Post models
class Post(SQLModel, table=True):
    __tablename__ = "posts"
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    property_id: int = Field(foreign_key="properties.id")
    feature_id: int = Field(foreign_key="features.id")
    slug: str = Field(max_length=160)
    vr360_url: Optional[str] = Field(default=None, max_length=255)
    status: str = Field(default="DRAFT", max_length=50)
    pinned: bool = Field(default=True)
    cover_media_id: Optional[int] = Field(default=None, foreign_key="media_files.id")
    published_at: Optional[datetime] = Field(default=None)
    created_by: Optional[int] = Field(default=None, foreign_key="admin_users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class PostTranslation(SQLModel, table=True):
    __tablename__ = "post_translations"
    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="posts.id")
    locale: str = Field(max_length=10)
    title: str = Field(max_length=250)
    subtitle: Optional[str] = Field(default=None, max_length=300)
    content_html: str
    seo_title: Optional[str] = Field(default=None, max_length=250)
    seo_desc: Optional[str] = Field(default=None, max_length=300)
    og_image_id: Optional[int] = Field(default=None, foreign_key="media_files.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class PostMedia(SQLModel, table=True):
    __tablename__ = "post_media"
    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="posts.id")
    media_id: int = Field(foreign_key="media_files.id")
    sort_order: int = Field(default=100)


# Schema models for API
class AdminUserCreate(SQLModel):
    email: str
    password: str
    full_name: str
    role: UserRole = UserRole.EDITOR


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
