from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException

from app import crud
from app.api.deps import SessionDep, TenantUser, CurrentTenantId
from app.models import Property
from app.schemas import PropertyCreate, PropertyResponse, PropertyUpdate
from app.core.permissions_utils import is_admin_or_owner, is_owner, is_viewer

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
