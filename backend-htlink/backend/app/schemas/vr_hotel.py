"""
Pydantic schemas for VR Hotel
Separate from SQLModel models for clear API contracts
Following Travel Link pattern
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime


# ==========================================
# VR Hotel Settings Schemas
# ==========================================

class VRHotelSettingsBase(BaseModel):
    hotel_name_vi: Optional[str] = None
    hotel_name_en: Optional[str] = None
    slogan_vi: Optional[str] = None
    slogan_en: Optional[str] = None
    default_language: Optional[str] = Field(default="vi", max_length=10)
    timezone: Optional[str] = Field(default="Asia/Ho_Chi_Minh", max_length=50)
    currency: Optional[str] = Field(default="VND", max_length=3)
    primary_color: Optional[str] = Field(default="#1a365d", max_length=50)
    logo_media_id: Optional[int] = None
    favicon_media_id: Optional[int] = None
    settings_json: Optional[Dict[str, Any]] = None


class VRHotelSettingsCreate(VRHotelSettingsBase):
    tenant_id: int
    property_id: int


class VRHotelSettingsUpdate(VRHotelSettingsBase):
    pass


class VRHotelSettingsResponse(VRHotelSettingsBase):
    id: int
    tenant_id: int
    property_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Contact info (flattened from VRHotelContact)
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    youtube_url: Optional[str] = None
    tripadvisor_url: Optional[str] = None
    map_latitude: Optional[float] = None
    map_longitude: Optional[float] = None
    google_map_url: Optional[str] = None
    
    # SEO (per locale)
    seo: Optional[Dict[str, Dict[str, str]]] = None  # {locale: {meta_title, meta_description, meta_keywords}}

    class Config:
        from_attributes = True


# ==========================================
# VR Room Schemas
# ==========================================

class VRRoomBase(BaseModel):
    room_type_code: str = Field(..., max_length=100)
    max_occupancy: Optional[int] = None
    bed_type: Optional[str] = Field(None, max_length=100)
    room_size: Optional[float] = None
    price_per_night: Optional[float] = None
    vr360_url: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = Field(default="available", max_length=20)
    display_order: Optional[int] = Field(default=0)


class VRRoomCreate(VRRoomBase):
    tenant_id: int
    property_id: int


class VRRoomUpdate(VRRoomBase):
    room_type_code: Optional[str] = None


class VRRoomTranslationData(BaseModel):
    locale: str
    name: str
    description: Optional[str] = None
    amenities: Optional[str] = None


class VRRoomResponse(VRRoomBase):
    id: int
    tenant_id: int
    property_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    translations: List[VRRoomTranslationData] = []
    
    class Config:
        from_attributes = True


# ==========================================
# VR Dining Schemas
# ==========================================

class VRDiningBase(BaseModel):
    dining_code: str = Field(..., max_length=100)
    cuisine_type: Optional[str] = Field(None, max_length=100)
    opening_hours: Optional[str] = Field(None, max_length=200)
    status: Optional[str] = Field(default="active", max_length=20)
    display_order: Optional[int] = Field(default=0)


class VRDiningCreate(VRDiningBase):
    tenant_id: int
    property_id: int


class VRDiningUpdate(VRDiningBase):
    dining_code: Optional[str] = None


class VRDiningTranslationData(BaseModel):
    locale: str
    name: str
    description: Optional[str] = None
    menu_highlights: Optional[str] = None


class VRDiningResponse(VRDiningBase):
    id: int
    tenant_id: int
    property_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    translations: List[VRDiningTranslationData] = []
    
    class Config:
        from_attributes = True


# ==========================================
# VR Facility Schemas
# ==========================================

class VRFacilityBase(BaseModel):
    facility_code: str = Field(..., max_length=100)
    category: Optional[str] = Field(None, max_length=100)
    icon_name: Optional[str] = Field(None, max_length=100)
    is_premium: Optional[bool] = Field(default=False)
    display_order: Optional[int] = Field(default=0)


class VRFacilityCreate(VRFacilityBase):
    tenant_id: int
    property_id: int


class VRFacilityUpdate(VRFacilityBase):
    facility_code: Optional[str] = None


class VRFacilityTranslationData(BaseModel):
    locale: str
    name: str
    description: Optional[str] = None


class VRFacilityResponse(VRFacilityBase):
    id: int
    tenant_id: int
    property_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    translations: List[VRFacilityTranslationData] = []
    
    class Config:
        from_attributes = True


# ==========================================
# VR Offer Schemas
# ==========================================

class VROfferBase(BaseModel):
    offer_code: str = Field(..., max_length=100)
    discount_type: Optional[str] = Field(None, max_length=50)
    discount_value: Optional[float] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    is_active: Optional[bool] = Field(default=True)
    display_order: Optional[int] = Field(default=0)


class VROfferCreate(VROfferBase):
    tenant_id: int
    property_id: int


class VROfferUpdate(VROfferBase):
    offer_code: Optional[str] = None


class VROfferTranslationData(BaseModel):
    locale: str
    title: str
    description: Optional[str] = None
    terms_conditions: Optional[str] = None


class VROfferResponse(VROfferBase):
    id: int
    tenant_id: int
    property_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    translations: List[VROfferTranslationData] = []
    
    class Config:
        from_attributes = True
