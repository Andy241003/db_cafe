from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException

from app import crud
from app.api.deps import CurrentUser, SessionDep, TenantUser, get_tenant_from_header
from app.models import AdminUser
from app.schemas import (
    AdminUserCreate, AdminUserResponse, AdminUserUpdate, 
    AdminUserPasswordUpdate
)

router = APIRouter()


@router.get("/me", response_model=AdminUserResponse)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user


@router.put("/me", response_model=AdminUserResponse)
def update_user_me(
    *,
    session: SessionDep,
    user_in: AdminUserUpdate,
    current_user: CurrentUser,
) -> Any:
    """
    Update own user.
    """
    user = crud.admin_user.update(session, db_obj=current_user, obj_in=user_in)
    return user


@router.put("/me/password")
def update_password_me(
    *,
    session: SessionDep,
    body: AdminUserPasswordUpdate,
    current_user: CurrentUser,
) -> Any:
    """
    Update own password.
    """
    if not crud.admin_user.authenticate(
        session, email=current_user.email, password=body.current_password, tenant_id=current_user.tenant_id
    ):
        raise HTTPException(status_code=400, detail="Incorrect password")
    
    crud.admin_user.update_password(session, user=current_user, new_password=body.new_password)
    return {"message": "Password updated successfully"}


@router.get("/", response_model=List[AdminUserResponse])
def read_users(
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: int = Depends(get_tenant_from_header),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve users in tenant. Requires admin or owner role.
    """
    # Check if user has permission to list users
    if current_user.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    users = crud.admin_user.get_multi(session, skip=skip, limit=limit, tenant_id=tenant_id)
    return users


@router.post("/", response_model=AdminUserResponse)
def create_user(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: int = Depends(get_tenant_from_header),
    user_in: AdminUserCreate,
) -> Any:
    """
    Create new user in tenant. Requires admin or owner role.
    """
    # Check if user has permission to create users
    if current_user.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Ensure the user is being created in the correct tenant
    user_in.tenant_id = tenant_id
    
    user = crud.admin_user.create(session, obj_in=user_in)
    return user


@router.put("/{user_id}", response_model=AdminUserResponse)
def update_user(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: int = Depends(get_tenant_from_header),
    user_id: int,
    user_in: AdminUserUpdate,
) -> Any:
    """
    Update a user. Requires admin or owner role.
    """
    # Check if user has permission to update users
    if current_user.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    user = crud.admin_user.get(session, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure user belongs to the same tenant
    if user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="User not in this tenant")
    
    # Non-owners cannot modify owner users
    if current_user.role != "owner" and user.role == "owner":
        raise HTTPException(status_code=403, detail="Cannot modify owner user")
    
    user = crud.admin_user.update(session, db_obj=user, obj_in=user_in)
    return user


@router.get("/{user_id}", response_model=AdminUserResponse)
def read_user(
    user_id: int,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: int = Depends(get_tenant_from_header),
) -> Any:
    """
    Get a specific user by id.
    """
    user = crud.admin_user.get(session, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure user belongs to the same tenant
    if user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="User not in this tenant")
    
    # Users can only see themselves unless they are admin/owner
    if current_user.role not in ["owner", "admin"] and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return user


@router.delete("/{user_id}")
def delete_user(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: int = Depends(get_tenant_from_header),
    user_id: int,
) -> Any:
    """
    Delete a user. Only owners can delete users.
    """
    # Only owners can delete users
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can delete users")
    
    user = crud.admin_user.get(session, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure user belongs to the same tenant
    if user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="User not in this tenant")
    
    # Cannot delete yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    crud.admin_user.remove(session, id=user_id)
    return {"message": "User deleted successfully"}