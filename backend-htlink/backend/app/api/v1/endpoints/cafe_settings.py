"""
Cafe Settings API endpoints

Handles cafe settings, contact, branding, and page configurations
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel

from app.core.db import get_db
from app.api.deps import CurrentUser, SessionDep
from app.models import UserRole
from app.models.cafe import CafeSettings, CafePageSettings

router = APIRouter()


# ==========================================
# Pydantic Schemas
# ==========================================

class CafeSettingsResponse(BaseModel):
    """Cafe Settings Response (Contact fields moved to /cafe/contact)"""
    id: Optional[int] = None
    tenant_id: int
    cafe_name: str
    slogan: Optional[str] = None
    primary_color: str = "#6f4e37"
    secondary_color: str = "#d4a574"
    background_color: str = "#ffffff"
    logo_media_id: Optional[int] = None
    favicon_media_id: Optional[int] = None
    cover_image_media_id: Optional[int] = None
    meta_image_media_id: Optional[int] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    settings_json: Optional[Dict[str, Any]] = None


class CafeSettingsUpdate(BaseModel):
    """Cafe Settings Update (Contact fields moved to /cafe/contact)"""
    cafe_name: Optional[str] = None
    slogan: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    background_color: Optional[str] = None
    logo_media_id: Optional[int] = None
    favicon_media_id: Optional[int] = None
    cover_image_media_id: Optional[int] = None
    meta_image_media_id: Optional[int] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    settings_json: Optional[Dict[str, Any]] = None


class CafePageSettingsResponse(BaseModel):
    """Cafe Page Settings Response"""
    id: Optional[int] = None
    tenant_id: int
    page_code: str
    is_displaying: bool = True
    vr360_link: Optional[str] = None
    vr_title: Optional[str] = None
    settings_json: Optional[Dict[str, Any]] = None


class CafePageSettingsUpdate(BaseModel):
    """Cafe Page Settings Update"""
    page_code: str
    is_displaying: Optional[bool] = None
    vr360_link: Optional[str] = None
    vr_title: Optional[str] = None
    settings_json: Optional[Dict[str, Any]] = None


# ==========================================
# API Endpoints
# ==========================================

@router.get("/", response_model=CafeSettingsResponse)
def get_cafe_settings(
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Get cafe settings for current tenant
    """
    statement = select(CafeSettings).where(CafeSettings.tenant_id == current_user.tenant_id)
    settings = db.exec(statement).first()
    
    if not settings:
        # Return default settings if not exists
        return CafeSettingsResponse(
            tenant_id=current_user.tenant_id,
            cafe_name="My Cafe",
            primary_color="#6f4e37",
            secondary_color="#d4a574",
            background_color="#ffffff"
        )
    
    return settings


@router.post("/", response_model=CafeSettingsResponse)
def create_or_update_cafe_settings(
    settings_data: CafeSettingsUpdate,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Create or update cafe settings
    """
    # Check if settings already exist
    statement = select(CafeSettings).where(CafeSettings.tenant_id == current_user.tenant_id)
    existing = db.exec(statement).first()
    
    if existing:
        # Update existing settings
        for key, value in settings_data.model_dump(exclude_unset=True).items():
            if hasattr(existing, key):
                setattr(existing, key, value)
                # Mark JSON fields as modified
                if key in ['business_hours', 'settings_json']:
                    flag_modified(existing, key)
        
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new settings with defaults for required fields
        settings_dict = settings_data.model_dump(exclude_unset=True)
        
        # Ensure cafe_name has a default value if not provided
        if 'cafe_name' not in settings_dict or settings_dict.get('cafe_name') is None:
            settings_dict['cafe_name'] = 'My Cafe'
        
        new_settings = CafeSettings(
            tenant_id=current_user.tenant_id,
            **settings_dict
        )
        db.add(new_settings)
        db.commit()
        db.refresh(new_settings)
        return new_settings


@router.get("/pages", response_model=list[CafePageSettingsResponse])
def get_cafe_page_settings(
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Get all page settings for current tenant
    """
    statement = select(CafePageSettings).where(
        CafePageSettings.tenant_id == current_user.tenant_id
    )
    page_settings = db.exec(statement).all()
    return page_settings


@router.get("/pages/{page_code}", response_model=CafePageSettingsResponse)
def get_page_setting(
    page_code: str,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Get specific page setting
    """
    statement = select(CafePageSettings).where(
        CafePageSettings.tenant_id == current_user.tenant_id,
        CafePageSettings.page_code == page_code
    )
    page_setting = db.exec(statement).first()
    
    if not page_setting:
        raise HTTPException(status_code=404, detail="Page setting not found")
    
    return page_setting


@router.post("/pages", response_model=CafePageSettingsResponse)
def create_or_update_page_setting(
    page_data: CafePageSettingsUpdate,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Create or update page setting
    """
    statement = select(CafePageSettings).where(
        CafePageSettings.tenant_id == current_user.tenant_id,
        CafePageSettings.page_code == page_data.page_code
    )
    existing = db.exec(statement).first()
    
    if existing:
        # Update
        for key, value in page_data.model_dump(exclude_unset=True).items():
            if hasattr(existing, key) and key != 'page_code':
                setattr(existing, key, value)
                if key == 'settings_json':
                    flag_modified(existing, key)
        
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create
        new_page = CafePageSettings(
            tenant_id=current_user.tenant_id,
            **page_data.model_dump(exclude_unset=True)
        )
        db.add(new_page)
        db.commit()
        db.refresh(new_page)
        return new_page


@router.delete("/pages/{page_code}")
def delete_page_setting(
    page_code: str,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Delete page setting
    """
    statement = select(CafePageSettings).where(
        CafePageSettings.tenant_id == current_user.tenant_id,
        CafePageSettings.page_code == page_code
    )
    page_setting = db.exec(statement).first()
    
    if not page_setting:
        raise HTTPException(status_code=404, detail="Page setting not found")
    
    db.delete(page_setting)
    db.commit()
    
    return {"success": True, "message": "Page setting deleted"}
