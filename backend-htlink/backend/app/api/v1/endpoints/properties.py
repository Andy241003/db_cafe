from typing import Any, List
import logging

from fastapi import APIRouter, Depends, HTTPException

from app import crud
from app.api.deps import SessionDep, TenantUser, CurrentTenantId
from app.models import Property
from app.schemas import PropertyCreate, PropertyResponse, PropertyUpdate
from app.core.permissions_utils import is_admin_or_owner, is_owner, is_viewer

logger = logging.getLogger(__name__)

router = APIRouter()


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
    # Debug logging
    print(f"Creating property with data: {property_in.model_dump()}")
    
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
def update_property(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: CurrentTenantId,
    property_id: int,
    property_in: PropertyUpdate,
) -> Any:
    """
    Update a property. Requires editor role or above.
    """
    # Check permissions
    if is_viewer(current_user):
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
