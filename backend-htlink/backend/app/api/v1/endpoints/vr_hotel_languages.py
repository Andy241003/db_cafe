"""
VR Hotel Languages API
Manage languages for VR Hotel properties
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Header
from sqlmodel import select
from pydantic import BaseModel

from app.api.deps import SessionDep, CurrentUser
from app.models.vr_hotel import PropertyLocale

router = APIRouter()


# ==========================================
# Request/Response Schemas
# ==========================================

class VRLanguageResponse(BaseModel):
    id: int
    tenant_id: int
    property_id: int
    locale_code: str
    is_default: bool
    is_active: bool
    
    class Config:
        from_attributes = True


class VRLanguageCreate(BaseModel):
    locale_code: str


# ==========================================
# Helper Functions
# ==========================================

def get_tenant_and_property(
    x_tenant_code: Optional[str] = Header(None),
    x_property_id: Optional[int] = Header(None),
    current_user: CurrentUser = None
) -> tuple[int, int]:
    """Extract tenant_id and property_id from headers"""
    tenant_id = current_user.tenant_id
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    return tenant_id, x_property_id


# ==========================================
# API Endpoints
# ==========================================

@router.get("/languages", response_model=List[VRLanguageResponse])
def get_vr_hotel_languages(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    x_tenant_code: Optional[str] = Header(None),
    x_property_id: Optional[int] = Header(None)
):
    """Get all languages for a VR Hotel property"""
    tenant_id, property_id = get_tenant_and_property(x_tenant_code, x_property_id, current_user)
    
    # Check user has access to VR Hotel
    if current_user.service_access not in [1, 2]:
        raise HTTPException(status_code=403, detail="No access to VR Hotel service")
    
    # Get all languages for this property
    stmt = select(PropertyLocale).where(
        PropertyLocale.tenant_id == tenant_id,
        PropertyLocale.property_id == property_id
    ).order_by(PropertyLocale.is_default.desc(), PropertyLocale.locale_code)
    
    languages = db.exec(stmt).all()
    return languages


@router.post("/languages", response_model=VRLanguageResponse)
def add_vr_hotel_language(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    language_in: VRLanguageCreate,
    x_tenant_code: Optional[str] = Header(None),
    x_property_id: Optional[int] = Header(None)
):
    """Add a new language to VR Hotel property"""
    tenant_id, property_id = get_tenant_and_property(x_tenant_code, x_property_id, current_user)
    
    # Check user has access to VR Hotel
    if current_user.service_access not in [1, 2]:
        raise HTTPException(status_code=403, detail="No access to VR Hotel service")
    
    # Check if language already exists
    existing = db.exec(
        select(PropertyLocale).where(
            PropertyLocale.tenant_id == tenant_id,
            PropertyLocale.property_id == property_id,
            PropertyLocale.locale_code == language_in.locale_code
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Language '{language_in.locale_code}' already exists for this property")
    
    # Create new language
    new_language = PropertyLocale(
        tenant_id=tenant_id,
        property_id=property_id,
        locale_code=language_in.locale_code,
        is_default=False,  # Only VI is default
        is_active=True
    )
    
    db.add(new_language)
    db.commit()
    db.refresh(new_language)
    
    return new_language


@router.delete("/languages/{locale}")
def remove_vr_hotel_language(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    locale: str,
    x_tenant_code: Optional[str] = Header(None),
    x_property_id: Optional[int] = Header(None)
):
    """Remove a language from VR Hotel property"""
    tenant_id, property_id = get_tenant_and_property(x_tenant_code, x_property_id, current_user)
    
    # Check user has access to VR Hotel
    if current_user.service_access not in [1, 2]:
        raise HTTPException(status_code=403, detail="No access to VR Hotel service")
    
    # Find the language
    language = db.exec(
        select(PropertyLocale).where(
            PropertyLocale.tenant_id == tenant_id,
            PropertyLocale.property_id == property_id,
            PropertyLocale.locale_code == locale
        )
    ).first()
    
    if not language:
        raise HTTPException(status_code=404, detail=f"Language '{locale}' not found")
    
    # Cannot remove default language (VI)
    if language.is_default:
        raise HTTPException(status_code=400, detail="Cannot remove the default language")
    
    # Delete the language
    db.delete(language)
    db.commit()
    
    return {"message": f"Language '{locale}' removed successfully"}

