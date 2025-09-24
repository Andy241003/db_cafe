"""
Example Multi-Tenant Endpoint
Demonstrates how to use the new multi-tenant system
"""
from typing import Any, List
from fastapi import APIRouter, HTTPException, Request
from sqlmodel import select

from app.api.deps import (
    SessionDep, CurrentUser, CurrentTenant, CurrentTenantId,
    TenantOwner, TenantAdmin, TenantEditor
)
from app.models import Property, Tenant, AdminUser


router = APIRouter()


@router.get("/tenant-info")
def get_tenant_info(
    current_tenant: CurrentTenant,
    current_user: CurrentUser,
) -> Any:
    """
    Get current tenant information (accessible by any authenticated user)
    """
    return {
        "tenant": {
            "id": current_tenant.id,
            "name": current_tenant.name, 
            "code": current_tenant.code,
            "default_locale": current_tenant.default_locale,
            "is_active": current_tenant.is_active
        },
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "tenant_id": current_user.tenant_id
        }
    }


@router.get("/properties-count") 
def get_properties_count(
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
) -> Any:
    """
    Count properties in current tenant (any authenticated user)
    """
    count = session.exec(
        select(Property).where(Property.tenant_id == tenant_id)
    ).all()
    
    return {
        "tenant_id": tenant_id,
        "properties_count": len(count),
        "user_role": current_user.role
    }


@router.post("/admin-action")
def admin_only_action(
    session: SessionDep,
    current_admin: TenantAdmin,  # Requires OWNER or ADMIN role
    tenant_id: CurrentTenantId,
) -> Any:
    """
    Action that requires ADMIN+ permissions in current tenant
    """
    return {
        "message": "Admin action executed successfully",
        "tenant_id": tenant_id,
        "admin_user": {
            "id": current_admin.id,
            "email": current_admin.email,
            "role": current_admin.role
        }
    }


@router.post("/owner-action")
def owner_only_action(
    session: SessionDep,
    current_owner: TenantOwner,  # Requires OWNER role only
    tenant_id: CurrentTenantId,
) -> Any:
    """
    Action that requires OWNER permissions in current tenant
    """
    return {
        "message": "Owner action executed successfully", 
        "tenant_id": tenant_id,
        "owner_user": {
            "id": current_owner.id,
            "email": current_owner.email,
            "role": current_owner.role
        }
    }


@router.get("/editor-dashboard")
def editor_dashboard(
    session: SessionDep,
    current_editor: TenantEditor,  # Requires EDITOR+ permissions
    tenant_id: CurrentTenantId,
) -> Any:
    """
    Dashboard data for editors and above
    """
    # Get properties count
    properties = session.exec(
        select(Property).where(Property.tenant_id == tenant_id)
    ).all()
    
    # Get other tenant users
    users = session.exec(
        select(AdminUser).where(AdminUser.tenant_id == tenant_id)
    ).all()
    
    return {
        "tenant_id": tenant_id,
        "properties_count": len(properties),
        "users_count": len(users),
        "current_user": {
            "id": current_editor.id,
            "email": current_editor.email,
            "role": current_editor.role
        },
        "properties": [
            {
                "id": prop.id,
                "name": prop.property_name,
                "code": prop.code,
                "is_active": prop.is_active
            } for prop in properties
        ]
    }


@router.get("/cross-tenant-access")
def cross_tenant_access_example(
    request: Request,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Example of how to handle cross-tenant access
    (Only OWNER role can access other tenants)
    """
    current_tenant = request.state.tenant
    
    if current_user.role != "OWNER":
        raise HTTPException(
            status_code=403,
            detail="Only OWNER can access cross-tenant data"
        )
    
    # OWNER can see all tenants
    all_tenants = session.exec(select(Tenant)).all()
    
    return {
        "current_tenant": {
            "id": current_tenant.id,
            "code": current_tenant.code,
            "name": current_tenant.name
        },
        "accessible_tenants": [
            {
                "id": t.id,
                "code": t.code, 
                "name": t.name,
                "is_active": t.is_active
            } for t in all_tenants
        ],
        "user": {
            "role": current_user.role,
            "email": current_user.email
        }
    }