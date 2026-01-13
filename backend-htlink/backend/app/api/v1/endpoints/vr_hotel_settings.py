"""
VR Hotel Settings API endpoints

Handles VR Hotel settings, contact, and SEO management
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.db import get_db
from app.api.deps import CurrentUser, SessionDep
from app.models import UserRole
from app.models.vr_hotel import VRHotelSettings, VRHotelContact, VRHotelSEO

router = APIRouter()


# ==========================================
# Pydantic Schemas for Request/Response
# ==========================================

class VRSettingsResponse(BaseModel):
    """
    VR Hotel Settings Response - Only VR-specific fields
    Basic info (name, contact) should be read from properties table
    """
    # VR-specific branding
    primary_color: str = "#3b82f6"
    
    # VR-specific media
    logo_media_id: Optional[int] = None
    favicon_media_id: Optional[int] = None
    
    # VR-specific settings (SEO)
    seo: Optional[Dict[str, Dict[str, str]]] = None  # {locale: {title, description, keywords}}


class VRSettingsUpdate(BaseModel):
    """
    VR Hotel Settings Update - Only VR-specific fields
    """
    # VR-specific branding
    primary_color: Optional[str] = None
    
    # VR-specific media
    logo_media_id: Optional[int] = None
    favicon_media_id: Optional[int] = None
    
    # VR-specific SEO
    seo: Optional[Dict[str, Dict[str, str]]] = None


# ==========================================
# Helper Functions
# ==========================================

def get_tenant_and_property(
    x_tenant_code: Optional[str],
    x_property_id: Optional[int],
    current_user: CurrentUser
) -> tuple[int, int]:
    """Extract tenant_id and property_id from headers or user context"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    tenant_id = current_user.tenant_id
    
    if not x_property_id:
        raise HTTPException(
            status_code=400, 
            detail="X-Property-Id header is required for VR Hotel operations"
        )
    
    return tenant_id, x_property_id


# ==========================================
# API Endpoints
# ==========================================

@router.get("/settings", response_model=VRSettingsResponse)
def get_vr_hotel_settings(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    x_tenant_code: Optional[str] = Header(None),
    x_property_id: Optional[int] = Header(None)
):
    """
    Get VR Hotel settings for a property (VR-specific only)
    Basic info should be read from properties table
    
    Requires headers:
    - X-Tenant-Code: Tenant code
    - X-Property-Id: Property ID
    """
    tenant_id, property_id = get_tenant_and_property(x_tenant_code, x_property_id, current_user)
    
    # Check user has access to VR Hotel (service_access = 1 or 2)
    if current_user.service_access not in [1, 2]:
        raise HTTPException(status_code=403, detail="No access to VR Hotel service")
    
    # Get VR-specific settings
    settings = db.exec(
        select(VRHotelSettings).where(
            VRHotelSettings.tenant_id == tenant_id,
            VRHotelSettings.property_id == property_id
        )
    ).first()
    
    # Get SEO for all locales
    seo_records = db.exec(
        select(VRHotelSEO).where(
            VRHotelSEO.tenant_id == tenant_id,
            VRHotelSEO.property_id == property_id
        )
    ).all()
    
    # Build SEO dict with comprehension
    seo_dict = {
        seo.locale: {
            "meta_title": seo.meta_title,
            "meta_description": seo.meta_description,
            "meta_keywords": seo.meta_keywords
        }
        for seo in seo_records
    } if seo_records else None
    
    # Return VR-specific settings only
    return VRSettingsResponse(
        primary_color=settings.primary_color if settings else "#3b82f6",
        logo_media_id=settings.logo_media_id if settings else None,
        favicon_media_id=settings.favicon_media_id if settings else None,
        seo=seo_dict
    )


@router.put("/settings", response_model=VRSettingsResponse)
def update_vr_hotel_settings(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    settings_in: VRSettingsUpdate,
    x_tenant_code: Optional[str] = Header(None),
    x_property_id: Optional[int] = Header(None)
):
    """
    Update VR Hotel settings for a property
    
    Requires headers:
    - X-Tenant-Code: Tenant code
    - X-Property-Id: Property ID
    
    Requires ADMIN or OWNER role
    """
    tenant_id, property_id = get_tenant_and_property(x_tenant_code, x_property_id, current_user)
    
    # Check permissions
    if current_user.service_access not in [1, 2]:
        raise HTTPException(status_code=403, detail="No access to VR Hotel service")
    
    if current_user.role not in [UserRole.ADMIN, UserRole.OWNER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get or create settings
    settings = db.exec(
        select(VRHotelSettings).where(
            VRHotelSettings.tenant_id == tenant_id,
            VRHotelSettings.property_id == property_id
        )
    ).first()
    
    if not settings:
        settings = VRHotelSettings(tenant_id=tenant_id, property_id=property_id)
        db.add(settings)
    
    # Update VR-specific settings fields only
    update_data = settings_in.model_dump(exclude_unset=True, exclude={"seo"})
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    # Update or create SEO records
    if settings_in.seo:
        for locale, seo_data in settings_in.seo.items():
            seo = db.exec(
                select(VRHotelSEO).where(
                    VRHotelSEO.tenant_id == tenant_id,
                    VRHotelSEO.property_id == property_id,
                    VRHotelSEO.locale == locale
                )
            ).first()
            
            if not seo:
                seo = VRHotelSEO(
                    tenant_id=tenant_id,
                    property_id=property_id,
                    locale=locale
                )
                db.add(seo)
            
            # Update SEO fields
            for key, value in seo_data.items():
                if key in ["meta_title", "meta_description", "meta_keywords"]:
                    setattr(seo, key, value)
    
    db.commit()
    db.refresh(settings)
    
    # Return updated data
    return get_vr_hotel_settings(
        db=db, 
        current_user=current_user,
        x_tenant_code=x_tenant_code,
        x_property_id=x_property_id
    )
