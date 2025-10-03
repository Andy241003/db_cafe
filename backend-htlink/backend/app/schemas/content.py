from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models import PostStatus, EventType, DeviceType, MediaKind


# Feature Category schemas
class FeatureCategoryBase(BaseModel):
    slug: str = Field(max_length=100)
    icon_key: Optional[str] = Field(None, max_length=120)
    is_system: bool = False


class FeatureCategoryCreate(FeatureCategoryBase):
    tenant_id: int = 0  # 0 means system-wide


class FeatureCategoryUpdate(BaseModel):
    slug: Optional[str] = Field(None, max_length=100)
    icon_key: Optional[str] = Field(None, max_length=120)


class FeatureCategoryResponse(FeatureCategoryBase):
    id: int
    tenant_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Feature Category Translation schemas
class FeatureCategoryTranslationBase(BaseModel):
    locale: str = Field(max_length=10)
    title: str = Field(max_length=200)
    short_desc: Optional[str] = Field(None, max_length=500)


class FeatureCategoryTranslationCreate(FeatureCategoryTranslationBase):
    category_id: int


class FeatureCategoryTranslationUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    short_desc: Optional[str] = Field(None, max_length=500)


class FeatureCategoryTranslationResponse(FeatureCategoryTranslationBase):
    category_id: int
    
    class Config:
        from_attributes = True


# Feature schemas
class FeatureBase(BaseModel):
    slug: str = Field(max_length=120)
    icon_key: Optional[str] = Field(None, max_length=120)
    is_system: bool = False


class FeatureCreate(FeatureBase):
    tenant_id: int = 0  # 0 means system-wide
    category_id: int


class FeatureUpdate(BaseModel):
    slug: Optional[str] = Field(None, max_length=120)
    icon_key: Optional[str] = Field(None, max_length=120)
    category_id: Optional[int] = None
    is_system: Optional[bool] = None


class FeatureResponse(FeatureBase):
    id: int
    tenant_id: int
    category_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Feature Translation schemas
class FeatureTranslationBase(BaseModel):
    locale: str = Field(max_length=10)
    title: str = Field(max_length=200)
    short_desc: Optional[str] = Field(None, max_length=500)


class FeatureTranslationCreate(FeatureTranslationBase):
    feature_id: int


class FeatureTranslationUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    short_desc: Optional[str] = Field(None, max_length=500)


class FeatureTranslationResponse(FeatureTranslationBase):
    feature_id: int
    
    class Config:
        from_attributes = True


# Property Category schemas
class PropertyCategoryBase(BaseModel):
    is_enabled: bool = True
    sort_order: int = 100


class PropertyCategoryCreate(PropertyCategoryBase):
    property_id: int
    category_id: int


class PropertyCategoryUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    sort_order: Optional[int] = None


class PropertyCategoryResponse(PropertyCategoryBase):
    property_id: int
    category_id: int
    
    class Config:
        from_attributes = True


# Property Feature schemas
class PropertyFeatureBase(BaseModel):
    is_enabled: bool = True
    sort_order: int = 100


class PropertyFeatureCreate(PropertyFeatureBase):
    property_id: int
    feature_id: int


class PropertyFeatureUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    sort_order: Optional[int] = None


class PropertyFeatureResponse(PropertyFeatureBase):
    property_id: int
    feature_id: int
    
    class Config:
        from_attributes = True


# Post schemas
class PostBase(BaseModel):
    slug: str = Field(max_length=160)
    status: PostStatus = PostStatus.DRAFT
    pinned: bool = True
    cover_media_id: Optional[int] = None
    published_at: Optional[datetime] = None


class PostCreate(PostBase):
    tenant_id: int
    property_id: int
    feature_id: int
    created_by: Optional[int] = None
    
    # Translation fields for default locale
    title: str = Field(max_length=250)
    content_html: str
    locale: str = Field(default="en", max_length=10)


class PostUpdate(BaseModel):
    slug: Optional[str] = Field(None, max_length=160)
    status: Optional[PostStatus] = None
    pinned: Optional[bool] = None
    cover_media_id: Optional[int] = None
    published_at: Optional[datetime] = None
    
    # Translation fields for updating content
    title: Optional[str] = Field(None, max_length=250)
    content_html: Optional[str] = None
    locale: Optional[str] = Field(None, max_length=10)


class PostResponse(PostBase):
    id: int
    tenant_id: int
    property_id: int
    feature_id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PostWithTranslationResponse(PostResponse):
    # Include default translation fields
    title: Optional[str] = None
    content_html: Optional[str] = None
    locale: Optional[str] = None


# Post Translation schemas
class PostTranslationBase(BaseModel):
    locale: str = Field(max_length=10)
    title: str = Field(max_length=250)
    subtitle: Optional[str] = Field(None, max_length=300)
    content_html: str
    seo_title: Optional[str] = Field(None, max_length=250)
    seo_desc: Optional[str] = Field(None, max_length=300)
    og_image_id: Optional[int] = None


class PostTranslationCreate(PostTranslationBase):
    post_id: int


class PostTranslationUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=250)
    subtitle: Optional[str] = Field(None, max_length=300)
    content_html: Optional[str] = None
    seo_title: Optional[str] = Field(None, max_length=250)
    seo_desc: Optional[str] = Field(None, max_length=300)
    og_image_id: Optional[int] = None


class PostTranslationResponse(PostTranslationBase):
    post_id: int
    
    class Config:
        from_attributes = True


# Media File schemas
class MediaFileBase(BaseModel):
    kind: str  # Temporarily use str instead of MediaKind enum
    mime_type: Optional[str] = Field(None, max_length=120)
    file_key: str = Field(max_length=255)
    width: Optional[int] = None
    height: Optional[int] = None
    size_bytes: Optional[int] = None
    alt_text: Optional[str] = Field(None, max_length=300)


class MediaFileCreate(MediaFileBase):
    tenant_id: int
    uploader_id: Optional[int] = None


class MediaFileUpdate(BaseModel):
    mime_type: Optional[str] = Field(None, max_length=120)
    alt_text: Optional[str] = Field(None, max_length=300)


class MediaFileResponse(MediaFileBase):
    id: int
    tenant_id: int
    uploader_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Post Media schemas
class PostMediaBase(BaseModel):
    sort_order: int = 100


class PostMediaCreate(PostMediaBase):
    post_id: int
    media_id: int


class PostMediaUpdate(BaseModel):
    sort_order: Optional[int] = None


class PostMediaResponse(PostMediaBase):
    post_id: int
    media_id: int
    
    class Config:
        from_attributes = True


# Event schemas
class EventBase(BaseModel):
    locale: Optional[str] = Field(None, max_length=10)
    event_type: EventType
    device: Optional[DeviceType] = None
    user_agent: Optional[str] = Field(None, max_length=255)
    ip_hash: Optional[str] = Field(None, max_length=64)


class EventCreate(EventBase):
    tenant_id: int
    property_id: int
    category_id: Optional[int] = None
    feature_id: Optional[int] = None
    post_id: Optional[int] = None


class EventResponse(EventBase):
    id: int
    tenant_id: int
    property_id: int
    category_id: Optional[int] = None
    feature_id: Optional[int] = None
    post_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Settings schemas
class SettingBase(BaseModel):
    key_name: str = Field(max_length=160)
    value_json: Optional[Dict[str, Any]] = None


class SettingCreate(SettingBase):
    tenant_id: int = 0
    property_id: int = 0


class SettingUpdate(BaseModel):
    value_json: Optional[Dict[str, Any]] = None


class SettingResponse(SettingBase):
    id: int
    tenant_id: int
    property_id: int
    
    class Config:
        from_attributes = True