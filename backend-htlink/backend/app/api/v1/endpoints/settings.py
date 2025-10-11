"""
Settings API endpoints for Hotel SaaS
Handles tenant and property settings
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.db import get_db
from app.api.deps import CurrentUser, SessionDep, CurrentTenantId
from app.models import Setting, UserRole
from app.models.activity_log import ActivityType
from app.schemas.content import SettingCreate, SettingUpdate, SettingResponse
from app.core.permissions_utils import is_admin_or_owner
from app.utils.activity_logger import log_activity

router = APIRouter()


@router.get("/", response_model=List[SettingResponse])
def list_settings(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    property_id: int = 0,
    skip: int = 0,
    limit: int = 100
):
    """List settings for tenant/property - requires authentication"""
    # Check tenant access
    if current_user.role != UserRole.OWNER and current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied to this tenant")

    statement = select(Setting).where(
        Setting.tenant_id == tenant_id,
        Setting.property_id == property_id
    ).offset(skip).limit(limit)
    settings = db.exec(statement).all()
    return settings


@router.get("/tenant/{tenant_id}", response_model=List[SettingResponse])
def get_tenant_settings(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    tenant_id: int
):
    """Get all tenant-level settings - requires authentication"""
    # Check tenant access
    if current_user.role != UserRole.OWNER and current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied to this tenant")

    statement = select(Setting).where(
        Setting.tenant_id == tenant_id,
        Setting.property_id == 0
    )
    settings = db.exec(statement).all()
    return settings


@router.get("/property/{tenant_id}/{property_id}", response_model=List[SettingResponse])
def get_property_settings(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    tenant_id: int,
    property_id: int
):
    """Get all property-level settings - requires authentication"""
    # Check tenant access
    if current_user.role != UserRole.OWNER and current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied to this tenant")

    statement = select(Setting).where(
        Setting.tenant_id == tenant_id,
        Setting.property_id == property_id
    )
    settings = db.exec(statement).all()
    return settings


@router.get("/key/{key_name}")
def get_setting_by_key(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    key_name: str,
    tenant_id: int = 0,
    property_id: int = 0
):
    """Get specific setting by key - requires authentication"""
    # Check tenant access
    if tenant_id > 0:
        if current_user.role != UserRole.OWNER and current_user.tenant_id != tenant_id:
            raise HTTPException(status_code=403, detail="Access denied to this tenant")

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
def create_setting(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    setting_in: SettingCreate
):
    """Create new setting - requires OWNER or ADMIN role"""
    # Check permissions
    if not is_admin_or_owner(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Check if setting already exists
    existing = db.exec(
        select(Setting).where(
            Setting.key_name == setting_in.key_name,
            Setting.tenant_id == tenant_id,
            Setting.property_id == setting_in.property_id
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Setting with this key already exists for this tenant/property"
        )

    # Set tenant_id from current tenant context
    setting_data = setting_in.model_dump()
    setting_data['tenant_id'] = tenant_id

    setting = Setting(**setting_data)
    db.add(setting)
    db.commit()
    db.refresh(setting)

    # Log activity
    log_activity(
        db=db,
        tenant_id=tenant_id,
        activity_type=ActivityType.USER_CREATE_SETTINGS,
        details={
            "message": f"Setting '{setting.key_name}' created by {current_user.email}",
            "setting_id": setting.id,
            "setting_key": setting.key_name,
            "user_id": current_user.id,
            "username": current_user.email
        }
    )

    return setting


@router.put("/{setting_id}", response_model=SettingResponse)
def update_setting(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    setting_id: int,
    setting_in: SettingUpdate
):
    """Update setting - requires OWNER or ADMIN role"""
    # Check permissions
    if not is_admin_or_owner(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    setting = db.get(Setting, setting_id)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    # Check tenant access
    if current_user.role != UserRole.OWNER and current_user.tenant_id != setting.tenant_id:
        raise HTTPException(status_code=403, detail="Access denied to this tenant")

    update_data = setting_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(setting, field, value)

    db.add(setting)
    db.commit()
    db.refresh(setting)

    # Log activity
    log_activity(
        db=db,
        tenant_id=setting.tenant_id,
        activity_type=ActivityType.USER_UPDATE_SETTINGS,
        details={
            "message": f"Setting '{setting.key_name}' updated by {current_user.email}",
            "setting_id": setting.id,
            "setting_key": setting.key_name,
            "user_id": current_user.id,
            "username": current_user.email
        }
    )

    return setting


@router.put("/key/{key_name}")
def update_setting_by_key(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    key_name: str,
    tenant_id: int = 0,
    property_id: int = 0,
    value_json: Dict[str, Any]
):
    """Update setting by key (upsert) - requires OWNER or ADMIN role"""
    # Check permissions
    if not is_admin_or_owner(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Check tenant access
    if tenant_id > 0:
        if current_user.role != UserRole.OWNER and current_user.tenant_id != tenant_id:
            raise HTTPException(status_code=403, detail="Access denied to this tenant")

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
def delete_setting(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    setting_id: int
):
    """Delete setting - requires OWNER role only"""
    # Check permissions - only OWNER can delete settings
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Only OWNER can delete settings")

    setting = db.get(Setting, setting_id)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    # Check tenant access
    if current_user.tenant_id != setting.tenant_id:
        raise HTTPException(status_code=403, detail="Access denied to this tenant")

    # Save info before delete
    setting_key = setting.key_name
    tenant_id = setting.tenant_id

    db.delete(setting)
    db.commit()

    # Log activity
    log_activity(
        db=db,
        tenant_id=tenant_id,
        activity_type=ActivityType.USER_DELETE_SETTINGS,
        details={
            "message": f"Setting '{setting_key}' deleted by {current_user.email}",
            "setting_id": setting_id,
            "setting_key": setting_key,
            "user_id": current_user.id,
            "username": current_user.email
        }
    )

    return {"message": "Setting deleted successfully"}


# Bulk operations
@router.post("/bulk")
def bulk_update_settings(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    tenant_id: int,
    property_id: int = 0,
    settings: Dict[str, Any]
):
    """Bulk update settings for tenant/property - requires OWNER or ADMIN role"""
    # Check permissions
    if not is_admin_or_owner(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Check tenant access
    if current_user.role != UserRole.OWNER and current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied to this tenant")

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