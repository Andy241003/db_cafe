from typing import Any, List
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from app import crud
from app.api.deps import SessionDep, TenantUser, CurrentTenantId
from app.models import Property
from app.models.vr_hotel import PropertyLocale
from app.models.activity_log import ActivityType
from app.utils.decorators.track_activity import track_activity
from app.schemas import PropertyCreate, PropertyResponse, PropertyUpdate
from app.core.permissions_utils import is_admin_or_owner, is_owner, is_viewer

logger = logging.getLogger(__name__)

router = APIRouter()


# ==========================================
# Property Locale Schemas
# ==========================================

class PropertyLocaleResponse(BaseModel):
    id: int
    tenant_id: int
    property_id: int
    locale_code: str
    is_default: bool
    is_active: bool
    
    class Config:
        from_attributes = True


class PropertyLocaleCreate(BaseModel):
    locale_code: str
    is_default: bool = False
    is_active: bool = True


@router.get("/", response_model=List[PropertyResponse])
def read_properties(
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: CurrentTenantId,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve properties in tenant.
    """
    properties = crud.property.get_by_tenant(
        session, tenant_id=tenant_id, skip=skip, limit=limit
    )
    
    return properties


@router.post("/", response_model=PropertyResponse)
@track_activity(ActivityType.CREATE_PROPERTY, message_template="Property '{property_in.property_name}' created by {current_user.email}")
def create_property(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: CurrentTenantId,
    property_in: PropertyCreate,
) -> Any:
    """
    Create new property in tenant. Requires admin or owner role.
    """
    # Check permissions
    if not is_admin_or_owner(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Ensure the property is being created in the correct tenant
    property_in.tenant_id = tenant_id
    
    # Check if property code already exists in tenant
    existing_property = crud.property.get_by_code(
        session, code=property_in.code, tenant_id=tenant_id
    )
    if existing_property:
        raise HTTPException(
            status_code=400,
            detail="Property with this code already exists in tenant",
        )
    
    property = crud.property.create(session, obj_in=property_in)
    logger.info(f"Property created with ID: {property.id}")
    
    # Auto-create an introduction post for the new property
    try:
        from app.schemas.content import PostCreate
        from app.models import PostStatus
        
        logger.info(f"Starting to create introduction post for property {property.property_name}")
        logger.info(f"Property ID: {property.id}, Tenant ID: {tenant_id}, User ID: {current_user.id}")
        
        # Build website link if available
        website_link = ""
        if property.website_url:
            website_link = f'<li>Website: <a href="{property.website_url}" target="_blank">{property.website_url}</a></li>'
        
        # Build content HTML
        content_html = (
            f"<h2>Welcome to {property.property_name}</h2>"
            f"<p>We are delighted to welcome you to our property located at {property.address or 'our beautiful location'}.</p>"
            f"<p>Our team is committed to providing you with an exceptional experience during your stay.</p>"
            f"<h3>Contact Information:</h3>"
            f"<ul>"
            f"<li>Phone: {property.phone_number or 'Contact us for phone number'}</li>"
            f"<li>Email: {property.email or 'Contact us for email'}</li>"
            f"{website_link}"
            f"</ul>"
            f"<p>We look forward to serving you!</p>"
        )
        
        intro_post = PostCreate(
            tenant_id=tenant_id,
            property_id=property.id,
            feature_id=7,  # Using concierge as general introduction feature
            slug=f"{property.code.lower()}-introduction",
            status=PostStatus.DRAFT,
            pinned=True,
            title=f"Welcome to {property.property_name}",
            content_html=content_html,
            locale="en",
            created_by=current_user.id
        )
        
        logger.info(f"PostCreate object created successfully")
        
        created_post = crud.post.create(session, obj_in=intro_post)
        logger.info(f"SUCCESS: Auto-created introduction post with ID {created_post.id} for property {property.property_name}")
        
        # Refresh session to make sure post is created
        session.commit()
        
    except Exception as e:
        logger.error(f"Could not create introduction post: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Don't fail the property creation if post creation fails
        pass
    
    return property


@router.get("/{property_id}", response_model=PropertyResponse)
def read_property(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: CurrentTenantId,
    property_id: int,
) -> Any:
    """
    Get property by ID.
    """
    property = crud.property.get(session, id=property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Ensure property belongs to the same tenant
    if property.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Property not in this tenant")
    
    return property


@router.put("/{property_id}", response_model=PropertyResponse)
@track_activity(ActivityType.UPDATE_PROPERTY, message_template="Property updated by {current_user.email}")
def update_property(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: CurrentTenantId,
    property_id: int,
    property_in: PropertyUpdate,
) -> Any:
    """
    Update a property. OWNER, ADMIN, and EDITOR can update properties.
    """
    # Check permissions - OWNER, ADMIN, EDITOR can update
    if current_user.role.upper() not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    property = crud.property.get(session, id=property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Ensure property belongs to the same tenant
    if property.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Property not in this tenant")
    
    # If updating code, check it doesn't conflict
    if property_in.code and property_in.code != property.code:
        existing_property = crud.property.get_by_code(
            session, code=property_in.code, tenant_id=tenant_id
        )
        if existing_property:
            raise HTTPException(
                status_code=400,
                detail="Property with this code already exists in tenant",
            )
    
    property = crud.property.update(session, db_obj=property, obj_in=property_in)
    return property


@router.delete("/{property_id}")
@track_activity(ActivityType.DELETE_PROPERTY, message_template="Property deleted by {current_user.email}")
def delete_property(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: CurrentTenantId,
    property_id: int,
) -> Any:
    """
    Delete a property. Only owners can delete properties.
    """
    # Only owners can delete properties
    if not is_owner(current_user):
        raise HTTPException(status_code=403, detail="Only owners can delete properties")
    
    property = crud.property.get(session, id=property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Ensure property belongs to the same tenant
    if property.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Property not in this tenant")
    
    crud.property.remove(session, id=property_id)
    return {"message": "Property deleted successfully"}


@router.get("/by-code/{property_code}", response_model=PropertyResponse)
def read_property_by_code(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: CurrentTenantId,
    property_code: str,
) -> Any:
    """
    Get property by code.
    """
    property = crud.property.get_by_code(
        session, code=property_code, tenant_id=tenant_id
    )
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return property


# ==========================================
# Property Locales Endpoints
# ==========================================

@router.get("/{property_id}/locales", response_model=List[PropertyLocaleResponse])
def get_property_locales(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: CurrentTenantId,
    property_id: int,
) -> Any:
    """
    Get all locales configured for a property.
    """
    # Verify property exists and belongs to tenant
    property = crud.property.get(session, id=property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if property.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Property not in this tenant")
    
    # Get all locales for this property
    stmt = select(PropertyLocale).where(
        PropertyLocale.tenant_id == tenant_id,
        PropertyLocale.property_id == property_id,
        PropertyLocale.is_active == True
    ).order_by(PropertyLocale.is_default.desc(), PropertyLocale.locale_code)
    
    locales = session.exec(stmt).all()
    return locales


@router.post("/{property_id}/locales", response_model=PropertyLocaleResponse)
@track_activity(ActivityType.UPDATE_PROPERTY, message_template="Locale '{locale_in.locale_code}' added to property by {current_user.email}")
def add_property_locale(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: CurrentTenantId,
    property_id: int,
    locale_in: PropertyLocaleCreate,
) -> Any:
    """
    Add a new locale to a property.
    """
    # Check permissions
    if not is_admin_or_owner(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Verify property exists and belongs to tenant
    property = crud.property.get(session, id=property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if property.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Property not in this tenant")
    
    # Verify locale exists in locales table
    from app.models import Locale
    locale_exists = session.exec(
        select(Locale).where(Locale.code == locale_in.locale_code)
    ).first()
    if not locale_exists:
        raise HTTPException(
            status_code=400,
            detail=f"Locale '{locale_in.locale_code}' does not exist. Available locales: en, vi, zh, ja, ko, th, fr, de, etc."
        )
    
    # Check if locale already exists
    existing = session.exec(
        select(PropertyLocale).where(
            PropertyLocale.tenant_id == tenant_id,
            PropertyLocale.property_id == property_id,
            PropertyLocale.locale_code == locale_in.locale_code
        )
    ).first()
    
    if existing:
        # If exists but inactive, reactivate it
        if not existing.is_active:
            existing.is_active = True
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing
        raise HTTPException(
            status_code=400, 
            detail=f"Locale '{locale_in.locale_code}' already exists for this property"
        )
    
    # Create new locale
    new_locale = PropertyLocale(
        tenant_id=tenant_id,
        property_id=property_id,
        locale_code=locale_in.locale_code,
        is_default=locale_in.is_default,
        is_active=locale_in.is_active
    )
    
    session.add(new_locale)
    session.commit()
    session.refresh(new_locale)
    
    return new_locale


@router.delete("/{property_id}/locales/{locale_code}")
@track_activity(ActivityType.UPDATE_PROPERTY, message_template="Locale '{locale_code}' removed from property by {current_user.email}")
def remove_property_locale(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: CurrentTenantId,
    property_id: int,
    locale_code: str,
) -> Any:
    """
    Remove a locale from a property (soft delete by setting is_active=False).
    """
    # Check permissions
    if not is_admin_or_owner(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Verify property exists and belongs to tenant
    property = crud.property.get(session, id=property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if property.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Property not in this tenant")
    
    # Find the locale
    locale = session.exec(
        select(PropertyLocale).where(
            PropertyLocale.tenant_id == tenant_id,
            PropertyLocale.property_id == property_id,
            PropertyLocale.locale_code == locale_code
        )
    ).first()
    
    if not locale:
        raise HTTPException(status_code=404, detail=f"Locale '{locale_code}' not found")
    
    # Don't allow removing default locale
    if locale.is_default:
        raise HTTPException(
            status_code=400, 
            detail="Cannot remove the default locale. Set another locale as default first."
        )
    
    # Soft delete
    locale.is_active = False
    session.add(locale)
    session.commit()
    
    return {"message": f"Locale '{locale_code}' removed successfully"}


@router.put("/{property_id}/locales/{locale_code}/default")
@track_activity(ActivityType.UPDATE_PROPERTY, message_template="Locale '{locale_code}' set as default for property by {current_user.email}")
def set_default_locale(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: CurrentTenantId,
    property_id: int,
    locale_code: str,
) -> Any:
    """
    Set a locale as the default for a property.
    """
    # Check permissions
    if not is_admin_or_owner(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Verify property exists and belongs to tenant
    property = crud.property.get(session, id=property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if property.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Property not in this tenant")
    
    # Find the locale
    locale = session.exec(
        select(PropertyLocale).where(
            PropertyLocale.tenant_id == tenant_id,
            PropertyLocale.property_id == property_id,
            PropertyLocale.locale_code == locale_code,
            PropertyLocale.is_active == True
        )
    ).first()
    
    if not locale:
        raise HTTPException(status_code=404, detail=f"Active locale '{locale_code}' not found")
    
    # Unset other default locales
    stmt = select(PropertyLocale).where(
        PropertyLocale.tenant_id == tenant_id,
        PropertyLocale.property_id == property_id,
        PropertyLocale.is_default == True
    )
    current_defaults = session.exec(stmt).all()
    
    for default_locale in current_defaults:
        default_locale.is_default = False
        session.add(default_locale)
    
    # Set new default
    locale.is_default = True
    session.add(locale)
    
    # Also update property default_locale
    property.default_locale = locale_code
    session.add(property)
    
    session.commit()
    session.refresh(locale)
    
    return {"message": f"Locale '{locale_code}' set as default successfully"}

