"""
Settings API endpoints for Hotel SaaS
Handles tenant and property settings
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.db import get_db
from app.models import Setting
from app.schemas.content import SettingCreate, SettingUpdate, SettingResponse

router = APIRouter()


@router.get("/", response_model=List[SettingResponse])
def list_settings(
    *,
    db: Session = Depends(get_db),
    tenant_id: int = 0,
    property_id: int = 0,
    skip: int = 0,
    limit: int = 100
):
    """List settings for tenant/property"""
    statement = select(Setting).where(
        Setting.tenant_id == tenant_id,
        Setting.property_id == property_id
    ).offset(skip).limit(limit)
    settings = db.exec(statement).all()
    return settings


@router.get("/tenant/{tenant_id}", response_model=List[SettingResponse])
def get_tenant_settings(*, db: Session = Depends(get_db), tenant_id: int):
    """Get all tenant-level settings"""
    statement = select(Setting).where(
        Setting.tenant_id == tenant_id,
        Setting.property_id == 0
    )
    settings = db.exec(statement).all()
    return settings


@router.get("/property/{tenant_id}/{property_id}", response_model=List[SettingResponse])
def get_property_settings(
    *, db: Session = Depends(get_db), tenant_id: int, property_id: int
):
    """Get all property-level settings"""
    statement = select(Setting).where(
        Setting.tenant_id == tenant_id,
        Setting.property_id == property_id
    )
    settings = db.exec(statement).all()
    return settings


@router.get("/key/{key_name}")
def get_setting_by_key(
    *,
    db: Session = Depends(get_db),
    key_name: str,
    tenant_id: int = 0,
    property_id: int = 0
):
    """Get specific setting by key"""
    statement = select(Setting).where(
        Setting.key_name == key_name,
        Setting.tenant_id == tenant_id,
        Setting.property_id == property_id
    )
    setting = db.exec(statement).first()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    return setting


@router.post("/", response_model=SettingResponse)
def create_setting(*, db: Session = Depends(get_db), setting_in: SettingCreate):
    """Create new setting"""
    # Check if setting already exists
    existing = db.exec(
        select(Setting).where(
            Setting.key_name == setting_in.key_name,
            Setting.tenant_id == setting_in.tenant_id,
            Setting.property_id == setting_in.property_id
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Setting with this key already exists for this tenant/property"
        )
    
    setting = Setting(**setting_in.model_dump())
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


@router.put("/{setting_id}", response_model=SettingResponse)
def update_setting(
    *, db: Session = Depends(get_db), setting_id: int, setting_in: SettingUpdate
):
    """Update setting"""
    setting = db.get(Setting, setting_id)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    update_data = setting_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(setting, field, value)
    
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


@router.put("/key/{key_name}")
def update_setting_by_key(
    *,
    db: Session = Depends(get_db),
    key_name: str,
    tenant_id: int = 0,
    property_id: int = 0,
    value_json: Dict[str, Any]
):
    """Update setting by key (upsert)"""
    statement = select(Setting).where(
        Setting.key_name == key_name,
        Setting.tenant_id == tenant_id,
        Setting.property_id == property_id
    )
    setting = db.exec(statement).first()
    
    if setting:
        # Update existing
        setting.value_json = value_json
        db.add(setting)
    else:
        # Create new
        setting = Setting(
            key_name=key_name,
            tenant_id=tenant_id,
            property_id=property_id,
            value_json=value_json
        )
        db.add(setting)
    
    db.commit()
    db.refresh(setting)
    return setting


@router.delete("/{setting_id}")
def delete_setting(*, db: Session = Depends(get_db), setting_id: int):
    """Delete setting"""
    setting = db.get(Setting, setting_id)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    db.delete(setting)
    db.commit()
    return {"message": "Setting deleted successfully"}


# Bulk operations
@router.post("/bulk")
def bulk_update_settings(
    *,
    db: Session = Depends(get_db),
    tenant_id: int,
    property_id: int = 0,
    settings: Dict[str, Any]
):
    """Bulk update settings for tenant/property"""
    updated_settings = []
    
    for key_name, value in settings.items():
        # Find existing or create new
        statement = select(Setting).where(
            Setting.key_name == key_name,
            Setting.tenant_id == tenant_id,
            Setting.property_id == property_id
        )
        setting = db.exec(statement).first()
        
        if setting:
            setting.value_json = value
        else:
            setting = Setting(
                key_name=key_name,
                tenant_id=tenant_id,
                property_id=property_id,
                value_json=value
            )
        
        db.add(setting)
        updated_settings.append(setting)
    
    db.commit()
    for setting in updated_settings:
        db.refresh(setting)
    
    return {
        "message": f"Updated {len(updated_settings)} settings",
        "settings": updated_settings
    }