"""
Permission system for HotelLink 360 SaaS

This module provides role-based access control (RBAC) for different resources
and operations based on user roles: OWNER, ADMIN, EDITOR, VIEWER
"""
from typing import List, Dict, Any, Optional, Callable
from functools import wraps
from enum import Enum

from fastapi import HTTPException, status, Depends
from sqlmodel import Session

from app.models import AdminUser, UserRole, Tenant, Property
from app.api.deps import get_current_user, SessionDep


class ResourceType(str, Enum):
    """Define different resource types in the system"""
    TENANT = "tenant"
    PROPERTY = "property"
    USER = "user"
    PLAN = "plan"
    CONTENT = "content"
    MEDIA = "media"
    ANALYTICS = "analytics"
    SETTINGS = "settings"


class ActionType(str, Enum):
    """Define different actions that can be performed"""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    MANAGE = "manage"  # Full control
    PUBLISH = "publish"
    ARCHIVE = "archive"


class PermissionMatrix:
    """
    Define permissions matrix for each role
    Based on the hotel SaaS schema structure
    """
    
    PERMISSIONS: Dict[UserRole, Dict[ResourceType, List[ActionType]]] = {
        UserRole.OWNER: {
            # Owner has full access to everything
            ResourceType.TENANT: [ActionType.MANAGE, ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
            ResourceType.PROPERTY: [ActionType.MANAGE, ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
            ResourceType.USER: [ActionType.MANAGE, ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
            ResourceType.PLAN: [ActionType.READ, ActionType.UPDATE],
            ResourceType.CONTENT: [ActionType.MANAGE, ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.PUBLISH, ActionType.ARCHIVE],
            ResourceType.MEDIA: [ActionType.MANAGE, ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
            ResourceType.ANALYTICS: [ActionType.READ],
            ResourceType.SETTINGS: [ActionType.MANAGE, ActionType.READ, ActionType.UPDATE],
        },
        
        UserRole.ADMIN: {
            # Admin can manage most things except tenant-level settings
            ResourceType.TENANT: [ActionType.READ, ActionType.UPDATE],
            ResourceType.PROPERTY: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
            ResourceType.USER: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],  # Cannot delete users
            ResourceType.PLAN: [ActionType.READ],
            ResourceType.CONTENT: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.PUBLISH, ActionType.ARCHIVE],
            ResourceType.MEDIA: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
            ResourceType.ANALYTICS: [ActionType.READ],
            ResourceType.SETTINGS: [ActionType.READ, ActionType.UPDATE],
        },
        
        UserRole.EDITOR: {
            # Editor can manage content but limited property access
            ResourceType.TENANT: [ActionType.READ],
            ResourceType.PROPERTY: [ActionType.READ, ActionType.UPDATE],
            ResourceType.USER: [ActionType.READ],
            ResourceType.PLAN: [ActionType.READ],
            ResourceType.CONTENT: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.PUBLISH],
            ResourceType.MEDIA: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],
            ResourceType.ANALYTICS: [ActionType.READ],
            ResourceType.SETTINGS: [ActionType.READ],
        },
        
        UserRole.VIEWER: {
            # Viewer has read-only access
            ResourceType.TENANT: [ActionType.READ],
            ResourceType.PROPERTY: [ActionType.READ],
            ResourceType.USER: [ActionType.READ],
            ResourceType.PLAN: [ActionType.READ],
            ResourceType.CONTENT: [ActionType.READ],
            ResourceType.MEDIA: [ActionType.READ],
            ResourceType.ANALYTICS: [ActionType.READ],
            ResourceType.SETTINGS: [ActionType.READ],
        },
    }


class PermissionChecker:
    """Permission checker utility class"""
    
    @staticmethod
    def has_permission(
        user_role: UserRole, 
        resource: ResourceType, 
        action: ActionType
    ) -> bool:
        """Check if a user role has permission for a resource action"""
        role_permissions = PermissionMatrix.PERMISSIONS.get(user_role, {})
        resource_permissions = role_permissions.get(resource, [])
        
        # Check for specific action or MANAGE permission
        return action in resource_permissions or ActionType.MANAGE in resource_permissions
    
    @staticmethod
    def check_tenant_access(user: AdminUser, tenant_id: int) -> bool:
        """Check if user has access to specific tenant"""
        # Owner can access any tenant
        if user.role == UserRole.OWNER:
            return True
        
        # Other roles must belong to the same tenant
        return user.tenant_id == tenant_id
    
    @staticmethod
    def check_property_access(
        user: AdminUser, 
        property_tenant_id: int,
        session: Optional[Session] = None
    ) -> bool:
        """Check if user has access to specific property"""
        # Owner can access any property
        if user.role == UserRole.OWNER:
            return True
        
        # Other roles must belong to the same tenant as the property
        return user.tenant_id == property_tenant_id
    
    @staticmethod
    def get_accessible_tenant_ids(user: AdminUser) -> List[int]:
        """Get list of tenant IDs user can access"""
        if user.role == UserRole.OWNER:
            # Owner can access all tenants (would need to query DB for full list)
            return []  # Return empty to indicate "all tenants"
        else:
            return [user.tenant_id]


def require_permission(resource: ResourceType, action: ActionType):
    """
    Decorator to require specific permission for an endpoint
    
    Usage:
    @require_permission(ResourceType.PROPERTY, ActionType.CREATE)
    def create_property(current_user: CurrentUser, ...):
        ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract current_user from kwargs
            current_user = None
            for key, value in kwargs.items():
                if isinstance(value, AdminUser):
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if not PermissionChecker.has_permission(current_user.role, resource, action):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required: {action.value} on {resource.value}"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def require_tenant_permission(
    resource: ResourceType, 
    action: ActionType,
    tenant_id_param: str = "tenant_id"
):
    """
    Decorator to require permission on a specific tenant
    
    Usage:
    @require_tenant_permission(ResourceType.PROPERTY, ActionType.CREATE)
    def create_property(tenant_id: int, current_user: CurrentUser, ...):
        ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract current_user and tenant_id from kwargs
            current_user = None
            tenant_id = None
            
            for key, value in kwargs.items():
                if isinstance(value, AdminUser):
                    current_user = value
                elif key == tenant_id_param and isinstance(value, int):
                    tenant_id = value
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if not tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tenant ID required"
                )
            
            # Check basic permission
            if not PermissionChecker.has_permission(current_user.role, resource, action):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required: {action.value} on {resource.value}"
                )
            
            # Check tenant access
            if not PermissionChecker.check_tenant_access(current_user, tenant_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this tenant"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


# Dependency functions for FastAPI
def require_owner_role(current_user: AdminUser = Depends(get_current_user)) -> AdminUser:
    """Dependency to require OWNER role"""
    if current_user.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner role required"
        )
    return current_user


def require_admin_role(current_user: AdminUser = Depends(get_current_user)) -> AdminUser:
    """Dependency to require ADMIN role or higher"""
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role or higher required"
        )
    return current_user


def require_editor_role(current_user: AdminUser = Depends(get_current_user)) -> AdminUser:
    """Dependency to require EDITOR role or higher"""
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Editor role or higher required"
        )
    return current_user


def check_resource_permission(
    resource: ResourceType,
    action: ActionType,
    current_user: AdminUser = Depends(get_current_user)
):
    """Dependency function to check resource permission"""
    if not PermissionChecker.has_permission(current_user.role, resource, action):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required: {action.value} on {resource.value}"
        )
    return current_user