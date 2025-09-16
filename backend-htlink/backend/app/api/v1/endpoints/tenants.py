from typing import Any, List

from fastapi import APIRouter, HTTPException, Depends

from app import crud
from app.api.deps import CurrentUser, SessionDep, CurrentSuperUser
from app.models import Tenant
from app.schemas import TenantCreate, TenantResponse, TenantUpdate

router = APIRouter()


@router.get("/", response_model=List[TenantResponse])
def read_tenants(
    session: SessionDep,
    current_user: CurrentSuperUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve tenants. Only superusers can access this.
    """
    tenants = crud.tenant.get_multi(session, skip=skip, limit=limit)
    return tenants


@router.post("/", response_model=TenantResponse)
def create_tenant(
    *,
    session: SessionDep,
    current_user: CurrentSuperUser,
    tenant_in: TenantCreate,
) -> Any:
    """
    Create new tenant. Only superusers can create tenants.
    """
    # Check if tenant code already exists
    existing_tenant = crud.tenant.get_by_code(session, code=tenant_in.code)
    if existing_tenant:
        raise HTTPException(
            status_code=400,
            detail="Tenant with this code already exists",
        )
    
    tenant = crud.tenant.create(session, obj_in=tenant_in)
    return tenant


@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    *,
    session: SessionDep,
    current_user: CurrentSuperUser,
    tenant_id: int,
    tenant_in: TenantUpdate,
) -> Any:
    """
    Update a tenant. Only superusers can update tenants.
    """
    tenant = crud.tenant.get(session, id=tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # If updating code, check it doesn't conflict
    if tenant_in.code and tenant_in.code != tenant.code:
        existing_tenant = crud.tenant.get_by_code(session, code=tenant_in.code)
        if existing_tenant:
            raise HTTPException(
                status_code=400,
                detail="Tenant with this code already exists",
            )
    
    tenant = crud.tenant.update(session, db_obj=tenant, obj_in=tenant_in)
    return tenant


@router.get("/{tenant_id}", response_model=TenantResponse)
def read_tenant(
    tenant_id: int,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get tenant by ID. Superusers can access any tenant, regular users only their own.
    """
    tenant = crud.tenant.get(session, id=tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Check access permissions
    if current_user.role != "owner" and current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return tenant


@router.delete("/{tenant_id}")
def delete_tenant(
    *,
    session: SessionDep,
    current_user: CurrentSuperUser,
    tenant_id: int,
) -> Any:
    """
    Delete a tenant. Only superusers can delete tenants.
    """
    tenant = crud.tenant.get(session, id=tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    crud.tenant.remove(session, id=tenant_id)
    return {"message": "Tenant deleted successfully"}