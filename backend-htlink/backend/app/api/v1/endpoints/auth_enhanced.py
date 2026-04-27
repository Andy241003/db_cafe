"""
Enhanced Authentication API endpoints with role-based permissions

This demonstrates how to use the new permission system
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlmodel import select

from app.core.auth_enhanced import (
    AuthContextDep, 
    TenantContextDep,
    OwnerUser,
    AdminUserDep,
    EditorUser,
    UserManagementContext,
    PropertyManagementContext,
    ContentCreateContext,
    AnalyticsContext
)
from app.core.permissions import ResourceType, ActionType
from app.models import AdminUser, Tenant, Property, UserRole
from app.schemas import AdminUserResponse, TenantResponse, PropertyResponse
from app.api.deps import SessionDep
from app import crud


router = APIRouter()


@router.get("/me", response_model=AdminUserResponse)
def get_current_user_info(auth_context: AuthContextDep) -> AdminUserResponse:
    """Get current user information with enhanced context"""
    return AdminUserResponse.model_validate(auth_context.user)


@router.get("/my-permissions")
def get_my_permissions(auth_context: AuthContextDep):
    """Get current user's permissions"""
    permissions = {}
    
    for resource in ResourceType:
        permissions[resource.value] = {}
        for action in ActionType:
            permissions[resource.value][action.value] = auth_context.can_perform_action(resource, action)
    
    return {
        "user_role": auth_context.user.role.value,
        "tenant_id": auth_context.user.tenant_id,
        "permissions": permissions,
        "accessible_tenants": [
            {"id": t.id, "name": t.name, "code": t.code}
            for t in auth_context.accessible_tenants
        ]
    }


@router.get("/tenants", response_model=List[TenantResponse])
def list_accessible_tenants(auth_context: AuthContextDep):
    """List tenants user can access"""
    # This automatically filters based on user role
    tenants = auth_context.accessible_tenants
    return [TenantResponse.model_validate(t) for t in tenants]


@router.get("/tenants/{tenant_id}/users", response_model=List[AdminUserResponse])
def list_tenant_users(
    tenant_id: int,
    auth_context: UserManagementContext,  # Requires user management permission
    limit: int = Query(default=20, le=100)
):
    """List users in a tenant - requires user management permission"""
    # Check tenant access
    auth_context.require_tenant_access(tenant_id)
    
    # Get users in the tenant
    users = auth_context.session.exec(
        select(AdminUser)
        .where(AdminUser.tenant_id == tenant_id)
        .where(AdminUser.is_active == True)
        .limit(limit)
    ).all()
    
    return [AdminUserResponse.model_validate(user) for user in users]


@router.post("/tenants/{tenant_id}/users", response_model=AdminUserResponse)
def create_tenant_user(
    tenant_id: int,
    user_data: dict,  # Would use proper schema
    auth_context: UserManagementContext  # Requires user management permission
):
    """Create a new user in tenant - requires user management permission"""
    # Check tenant access
    auth_context.require_tenant_access(tenant_id)
    
    # Only owners can create other owners
    if user_data.get("role") == UserRole.OWNER.value:
        if auth_context.user.role != UserRole.OWNER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owners can create other owners"
            )
    
    # Create user (simplified - would use proper CRUD)
    return {"message": "User would be created here"}


@router.get("/tenants/{tenant_id}/properties", response_model=List[PropertyResponse])
def list_tenant_properties(
    tenant_id: int,
    auth_context: TenantContextDep,  # Validates tenant access
    limit: int = Query(default=20, le=100)
):
    """List properties in a tenant"""
    # Check if user can read properties
    auth_context.require_permission(ResourceType.PROPERTY, ActionType.READ)
    auth_context.require_tenant_access(tenant_id)
    
    properties = auth_context.session.exec(
        select(Property)
        .where(Property.tenant_id == tenant_id)
        .limit(limit)
    ).all()
    
    return [PropertyResponse.model_validate(prop) for prop in properties]


@router.post("/tenants/{tenant_id}/properties", response_model=PropertyResponse)
def create_property(
    tenant_id: int,
    property_data: dict,  # Would use proper schema
    auth_context: PropertyManagementContext  # Requires property management permission
):
    """Create a property in tenant - requires property management permission"""
    auth_context.require_tenant_access(tenant_id)
    
    # Create property logic here
    return {"message": "Property would be created here"}


@router.get("/analytics/dashboard")
def get_analytics_dashboard(
    auth_context: AnalyticsContext,  # Requires analytics access
    tenant_id: Optional[int] = Query(None)
):
    """Get analytics dashboard - requires analytics permission"""
    if tenant_id:
        auth_context.require_tenant_access(tenant_id)
        # Return tenant-specific analytics
        accessible_tenants = [tenant_id]
    else:
        # Return analytics for all accessible tenants
        accessible_tenants = [t.id for t in auth_context.accessible_tenants]
    
    return {
        "message": "Analytics dashboard data",
        "user_role": auth_context.user.role.value,
        "accessible_tenants": accessible_tenants,
        "analytics_data": {
            "total_properties": 0,
            "total_posts": 0,
            "total_views": 0
        }
    }


@router.get("/content/posts")
def list_posts(
    auth_context: AuthContextDep,
    tenant_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None)
):
    """List posts with content read permission"""
    auth_context.require_permission(ResourceType.CONTENT, ActionType.READ)
    
    if tenant_id:
        auth_context.require_tenant_access(tenant_id)
        accessible_tenants = [tenant_id]
    else:
        accessible_tenants = [t.id for t in auth_context.accessible_tenants]
    
    return {
        "message": "Posts would be listed here",
        "accessible_tenants": accessible_tenants,
        "filter_status": status
    }


@router.post("/content/posts")
def create_post(
    post_data: dict,  # Would use proper schema
    auth_context: ContentCreateContext  # Requires content creation permission
):
    """Create a post - requires content creation permission"""
    tenant_id = post_data.get("tenant_id")
    if tenant_id:
        auth_context.require_tenant_access(tenant_id)
    
    return {"message": "Post would be created here"}


@router.delete("/admin/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: OwnerUser  # Only owners can delete users
):
    """Delete a user - only owners allowed"""
    # Additional logic to prevent self-deletion, etc.
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    return {"message": "User would be deleted here"}


@router.put("/admin/system-settings")
def update_system_settings(
    settings_data: dict,
    current_user: OwnerUser  # Only owners can modify system settings
):
    """Update system settings - only owners allowed"""
    return {"message": "System settings would be updated here"}


@router.get("/admin/system-health")
def check_system_health(
    current_user: AdminUserDep  # Admin role or higher required
):
    """Check system health - admin role required"""
    return {
        "status": "healthy",
        "database": "connected",
        "cache": "connected",
        "services": "running"
    }
