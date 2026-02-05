"""
VR Hotel Models

SQLModel definitions for VR Hotel management system
"""
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Enum, DECIMAL, BigInteger, Date
from sqlalchemy.dialects.mysql import MEDIUMTEXT
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from enum import Enum as PythonEnum


# ==========================================
# Enums for VR Hotel
# ==========================================

class RoomStatus(str, PythonEnum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"
    INACTIVE = "inactive"


# DiningStatus enum removed - now using VARCHAR(20) to avoid SQLAlchemy enum caching issues
# Valid values: 'active', 'inactive', 'closed'


# FacilityStatus enum removed - now using VARCHAR(20) to avoid SQLAlchemy enum caching issues
# Valid values: 'active', 'inactive', 'maintenance'


class OfferDiscountType(str, PythonEnum):
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    FREE_NIGHT = "free_night"


class OfferStatus(str, PythonEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"


class VRContentType(str, PythonEnum):
    INTRODUCTION = "introduction"
    POLICIES = "policies"
    RULES = "rules"


# ==========================================
# VR Hotel Settings
# ==========================================

class VRHotelSettings(SQLModel, table=True):
    """
    VR Hotel Settings - Only VR-specific configuration
    Basic info (name, address, contact) is read from properties table
    """
    __tablename__ = "vr_hotel_settings"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    
    # VR-specific branding
    primary_color: str = Field(default="#3b82f6", max_length=20)
    background_color: str = Field(default="#ffffff", max_length=20)
    
    # Contact & Booking
    booking_url: Optional[str] = Field(default=None, max_length=500)
    messenger_url: Optional[str] = Field(default=None, max_length=500)
    phone_number: Optional[str] = Field(default=None, max_length=50)  # Zalo OA ID / Phone Number
    
    # VR-specific media
    logo_media_id: Optional[int] = Field(default=None, foreign_key="media_files.id")
    favicon_media_id: Optional[int] = Field(default=None, foreign_key="media_files.id")
    
    # VR-specific settings (SEO, etc.) as JSON
    settings_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class VRHotelContact(SQLModel, table=True):
    __tablename__ = "vr_hotel_contact"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    
    # Display control
    is_displaying: Optional[bool] = Field(default=True)
    
    # Basic contact information
    phone: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=100)
    website: Optional[str] = Field(default=None, max_length=255)
    
    # Multi-language JSON fields
    address_json: Optional[str] = Field(default=None, sa_column=Column(JSON))
    social_media_json: Optional[str] = Field(default=None, sa_column=Column(JSON))
    working_hours_json: Optional[str] = Field(default=None, sa_column=Column(JSON))
    content_json: Optional[str] = Field(default=None, sa_column=Column(JSON))
    
    # Map & VR360
    map_coordinates: Optional[str] = Field(default=None, max_length=100)
    vr360_link: Optional[str] = Field(default=None, max_length=255)
    vr_title: Optional[str] = Field(default=None, max_length=255)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class VRHotelSEO(SQLModel, table=True):
    __tablename__ = "vr_hotel_seo"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    locale: str = Field(foreign_key="locales.code", max_length=10)
    
    # SEO fields
    meta_title: Optional[str] = Field(default=None, max_length=250)
    meta_description: Optional[str] = Field(default=None, max_length=500)
    meta_keywords: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


# ==========================================
# VR Rooms
# ==========================================

class VRRoom(SQLModel, table=True):
    __tablename__ = "vr_rooms"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    
    # Room identification
    room_code: str = Field(max_length=50)  # Room number/code
    room_type: Optional[str] = Field(default=None, max_length=50)  # deluxe, suite, standard
    floor: Optional[int] = Field(default=None)
    
    # Room details
    bed_type: Optional[str] = Field(default=None, max_length=50)  # king, queen, twin
    capacity: Optional[int] = Field(default=None)  # Max guests
    size_sqm: Optional[float] = Field(default=None, sa_column=Column(DECIMAL(10, 2)))
    price_per_night: Optional[float] = Field(default=None, sa_column=Column(DECIMAL(15, 2)))
    
    # VR360 link for this room
    vr_link: Optional[str] = Field(default=None, max_length=500)
    
    # Booking URL for this room
    booking_url: Optional[str] = Field(default=None, max_length=500)
    
    # Status and attributes
    status: str = Field(default="available", max_length=20)
    amenities_json: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    attributes_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    display_order: int = Field(default=0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class VRRoomTranslation(SQLModel, table=True):
    __tablename__ = "vr_room_translations"
    
    room_id: int = Field(foreign_key="vr_rooms.id", primary_key=True)
    locale: str = Field(foreign_key="locales.code", primary_key=True, max_length=10)
    
    name: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    amenities_text: Optional[str] = Field(default=None, sa_column=Column(Text))


class VRRoomMedia(SQLModel, table=True):
    __tablename__ = "vr_room_media"
    
    room_id: int = Field(foreign_key="vr_rooms.id", primary_key=True)
    media_id: int = Field(foreign_key="media_files.id", primary_key=True)
    
    is_vr360: bool = Field(default=False)
    is_primary: bool = Field(default=False)
    sort_order: int = Field(default=100)


# ==========================================
# VR Dining
# ==========================================

class VRDining(SQLModel, table=True):
    __tablename__ = "vr_dining"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    
    code: str = Field(max_length=50)
    dining_type: Optional[str] = Field(default=None, max_length=50)  # restaurant, bar, cafe, lounge
    cuisine_types: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    capacity: Optional[int] = Field(default=None)
    operating_hours: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    vr_link: Optional[str] = Field(default=None, max_length=500)
    booking_url: Optional[str] = Field(default=None, max_length=500)
    
    # Changed from ENUM to VARCHAR(20) to avoid SQLAlchemy enum caching issues
    status: str = Field(default="active", max_length=20)  # active, inactive, closed
    attributes_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    display_order: int = Field(default=0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class VRDiningTranslation(SQLModel, table=True):
    __tablename__ = "vr_dining_translations"
    
    dining_id: int = Field(foreign_key="vr_dining.id", primary_key=True)
    locale: str = Field(foreign_key="locales.code", primary_key=True, max_length=10)
    
    name: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))


class VRDiningMedia(SQLModel, table=True):
    __tablename__ = "vr_dining_media"
    
    dining_id: int = Field(foreign_key="vr_dining.id", primary_key=True)
    media_id: int = Field(foreign_key="media_files.id", primary_key=True)
    
    is_vr360: bool = Field(default=False)
    is_primary: bool = Field(default=False)
    sort_order: int = Field(default=100)


# ==========================================
# VR Facilities
# ==========================================

class VRFacility(SQLModel, table=True):
    __tablename__ = "vr_facilities"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    
    code: str = Field(max_length=50)
    facility_type: Optional[str] = Field(default=None, max_length=50)  # pool, gym, spa, meeting_room
    operating_hours: Optional[str] = Field(default=None, max_length=255)
    vr_link: Optional[str] = Field(default=None, max_length=500)
    
    # Changed from ENUM to VARCHAR(20) to avoid SQLAlchemy enum caching issues
    status: str = Field(default="active", max_length=20)  # active, inactive, maintenance
    attributes_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    display_order: int = Field(default=0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class VRFacilityTranslation(SQLModel, table=True):
    __tablename__ = "vr_facility_translations"
    
    facility_id: int = Field(foreign_key="vr_facilities.id", primary_key=True)
    locale: str = Field(foreign_key="locales.code", primary_key=True, max_length=10)
    
    name: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))


class VRFacilityMedia(SQLModel, table=True):
    __tablename__ = "vr_facility_media"
    
    facility_id: int = Field(foreign_key="vr_facilities.id", primary_key=True)
    media_id: int = Field(foreign_key="media_files.id", primary_key=True)
    
    is_vr360: bool = Field(default=False)
    is_primary: bool = Field(default=False)
    sort_order: int = Field(default=100)


# ==========================================
# VR Services
# ==========================================

class VRService(SQLModel, table=True):
    __tablename__ = "vr_services"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    
    code: str = Field(max_length=50)
    service_type: Optional[str] = Field(default=None, max_length=50)
    availability: Optional[str] = Field(default=None, max_length=255)
    price_info: Optional[str] = Field(default=None, max_length=255)
    vr_link: Optional[str] = Field(default=None, max_length=500)
    booking_url: Optional[str] = Field(default=None, max_length=500)
    
    status: str = Field(default="active", max_length=20)
    attributes_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    display_order: int = Field(default=0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class VRServiceTranslation(SQLModel, table=True):
    __tablename__ = "vr_service_translations"
    
    service_id: int = Field(foreign_key="vr_services.id", primary_key=True)
    locale: str = Field(foreign_key="locales.code", primary_key=True, max_length=10)
    
    name: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))


class VRServiceMedia(SQLModel, table=True):
    __tablename__ = "vr_service_media"
    
    service_id: int = Field(foreign_key="vr_services.id", primary_key=True)
    media_id: int = Field(foreign_key="media_files.id", primary_key=True)
    
    is_vr360: bool = Field(default=False)
    is_primary: bool = Field(default=False)
    sort_order: int = Field(default=100)


# ==========================================
# VR Offers/Vouchers
# ==========================================

class VROffer(SQLModel, table=True):
    __tablename__ = "vr_offers"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    
    code: str = Field(max_length=50)  # Voucher code
    discount_type: OfferDiscountType = Field(default=OfferDiscountType.PERCENTAGE)
    discount_value: Optional[float] = Field(default=None, sa_column=Column(DECIMAL(15, 2)))
    
    valid_from: Optional[date] = Field(default=None)
    valid_to: Optional[date] = Field(default=None)
    min_nights: int = Field(default=1)
    max_uses: Optional[int] = Field(default=None)
    current_uses: int = Field(default=0)
    
    applicable_room_types: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    status: OfferStatus = Field(default=OfferStatus.ACTIVE)
    vr_link: Optional[str] = Field(default=None, max_length=500)  # VR360 link for this offer
    attributes_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    display_order: int = Field(default=0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class VROfferTranslation(SQLModel, table=True):
    __tablename__ = "vr_offer_translations"
    
    offer_id: int = Field(foreign_key="vr_offers.id", primary_key=True)
    locale: str = Field(foreign_key="locales.code", primary_key=True, max_length=10)
    
    title: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    terms_conditions: Optional[str] = Field(default=None, sa_column=Column(Text))


# ==========================================
# VR Content (Introduction, Policies, Rules)
# ==========================================

class VRContent(SQLModel, table=True):
    __tablename__ = "vr_content"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    content_type: VRContentType = Field(index=True)
    locale: str = Field(foreign_key="locales.code", max_length=10)
    
    title: Optional[str] = Field(default=None, max_length=255)
    content_html: Optional[str] = Field(default=None, sa_column=Column(MEDIUMTEXT))
    attributes_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    display_order: int = Field(default=0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


# ==========================================
# VR Hotel Introductions
# ==========================================

class VRHotelIntroduction(SQLModel, table=True):
    """
    VR Hotel Introduction page content with multi-language support
    Stores all introduction content in a single JSON field for simplicity
    """
    __tablename__ = "vr_hotel_introductions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    
    # Display toggle
    is_displaying: bool = Field(default=True)
    
    # VR360 settings
    vr360_link: Optional[str] = Field(default=None, max_length=500)
    vr_title: Optional[str] = Field(default=None, max_length=255)
    
    # Multi-language content stored as JSON
    # Format: {"vi": {"title": "", "shortDescription": "", "detailedContent": ""}, "en": {...}}
    content_json: Dict[str, Any] = Field(sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class VRHotelPolicies(SQLModel, table=True):
    """
    VR Hotel Policies & Rules page content with multi-language support
    Stores all policies content in a single JSON field for simplicity
    """
    __tablename__ = "vr_hotel_policies"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    
    # Display toggle
    is_displaying: bool = Field(default=True)
    
    # VR360 settings
    vr360_link: Optional[str] = Field(default=None, max_length=500)
    vr_title: Optional[str] = Field(default=None, max_length=255)
    
    # Multi-language content stored as JSON
    # Format: {"vi": {"title": "", "shortDescription": "", "detailedContent": ""}, "en": {...}}
    content_json: Dict[str, Any] = Field(sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class VRHotelRules(SQLModel, table=True):
    """
    VR Hotel House Rules page content with multi-language support
    Stores all house rules content in a single JSON field for simplicity
    """
    __tablename__ = "vr_hotel_rules"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    
    # Display toggle
    is_displaying: bool = Field(default=True)
    
    # VR360 settings
    vr360_link: Optional[str] = Field(default=None, max_length=500)
    vr_title: Optional[str] = Field(default=None, max_length=255)
    
    # Multi-language content stored as JSON
    # Format: {"vi": {"title": "", "shortDescription": "", "detailedContent": ""}, "en": {...}}
    content_json: Dict[str, Any] = Field(sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


# ==========================================
# Property Locales (VR Hotel Language Configuration)
# ==========================================

class PropertyLocale(SQLModel, table=True):
    """
    Property-specific locale configuration
    Replaces the old vr_languages table
    """
    __tablename__ = "property_locales"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    locale_code: str = Field(foreign_key="locales.code", max_length=10)
    
    is_default: bool = Field(default=False)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Backward compatibility alias (deprecated)
VRLanguage = PropertyLocale
