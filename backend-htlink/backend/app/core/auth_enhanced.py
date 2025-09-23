"""
Enhanced authentication dependencies for HotelLink 360 SaaS

This module provides enhanced authentication and authorization
dependencies with role-based access control
"""
from typing import Annotated, Optional, List
from fastapi import Depends, HTTPException, status, Header
from sqlmodel import Session, select

from app.api.deps import get_current_user, SessionDep
from app.models import AdminUser as AdminUserModel, UserRole, Tenant, Property
from app.core.permissions import (
    PermissionChecker, 
    ResourceType, 
    ActionType,
    require_owner_role,
    require_admin_role, 
    require_editor_role
)


class AuthContext:
    """Authentication context with enhanced user information"""
    
    def __init__(
        self,
        user: AdminUserModel,
        session: Session,
        tenant_code: Optional[str] = None
    ):
        self.user = user
        self.session = session
        self.tenant_code = tenant_code
        self._tenant: Optional[Tenant] = None
        self._accessible_tenants: Optional[List[Tenant]] = None
    
    @property
    def tenant(self) -> Optional[Tenant]:
        """Get current tenant"""
        if not self._tenant and self.tenant_code:
            self._tenant = self.session.exec(
                select(Tenant).where(Tenant.code == self.tenant_code)
            ).first()
        return self._tenant
    
    @property 
    def accessible_tenants(self) -> List[Tenant]:
        """Get list of tenants user can access"""
        if self._accessible_tenants is None:
            if self.user.role == UserRole.OWNER:
                # Owner can access all active tenants
                self._accessible_tenants = list(self.session.exec(
                    select(Tenant).where(Tenant.is_active == True)
                ).all())
            else:
                # Other roles only access their own tenant
                user_tenant = self.session.get(Tenant, self.user.tenant_id)
                self._accessible_tenants = [user_tenant] if user_tenant else []
        
        return self._accessible_tenants
    
    def can_access_tenant(self, tenant_id: int) -> bool:
        """Check if user can access specific tenant"""
        return PermissionChecker.check_tenant_access(self.user, tenant_id)
    
    def can_perform_action(self, resource: ResourceType, action: ActionType) -> bool:
        """Check if user can perform action on resource"""
        return PermissionChecker.has_permission(self.user.role, resource, action)
    
    def require_permission(self, resource: ResourceType, action: ActionType):
        """Require specific permission or raise exception"""
        if not self.can_perform_action(resource, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {action.value} on {resource.value}"
            )
    
    def require_tenant_access(self, tenant_id: int):
        """Require access to specific tenant or raise exception"""
        if not self.can_access_tenant(tenant_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this tenant"
            )


def get_auth_context(
    session: SessionDep,
    current_user: AdminUserModel = Depends(get_current_user),
    x_tenant_code: Annotated[str | None, Header(alias="X-Tenant-Code")] = None
) -> AuthContext:
    """Get enhanced authentication context"""
    return AuthContext(
        user=current_user,
        session=session,
        tenant_code=x_tenant_code
    )


def get_tenant_context(
    auth_context: AuthContext = Depends(get_auth_context)
) -> AuthContext:
    """Get authentication context with tenant validation"""
    if auth_context.tenant_code and not auth_context.tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    if auth_context.tenant and not auth_context.can_access_tenant(auth_context.tenant.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this tenant"
        )
    
    return auth_context


def require_property_access(
    property_id: int,
    auth_context: AuthContext = Depends(get_auth_context)
) -> AuthContext:
    """Require access to specific property"""
    property_obj = auth_context.session.get(Property, property_id)
    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    if not PermissionChecker.check_property_access(
        auth_context.user, 
        property_obj.tenant_id,
        auth_context.session
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this property"
        )
    
    return auth_context


# Enhanced dependency aliases
AuthContextDep = Annotated[AuthContext, Depends(get_auth_context)]
TenantContextDep = Annotated[AuthContext, Depends(get_tenant_context)]
OwnerUser = Annotated[AdminUserModel, Depends(require_owner_role)]
AdminUserDep = Annotated[AdminUserModel, Depends(require_admin_role)]
EditorUser = Annotated[AdminUserModel, Depends(require_editor_role)]


# Permission-based dependencies for common operations
def require_content_create_permission(
    auth_context: AuthContext = Depends(get_auth_context)
) -> AuthContext:
    """Require permission to create content"""
    auth_context.require_permission(ResourceType.CONTENT, ActionType.CREATE)
    return auth_context


def require_user_management_permission(
    auth_context: AuthContext = Depends(get_auth_context)
) -> AuthContext:
    """Require permission to manage users"""
    auth_context.require_permission(ResourceType.USER, ActionType.MANAGE)
    return auth_context


def require_property_management_permission(
    auth_context: AuthContext = Depends(get_auth_context)
) -> AuthContext:
    """Require permission to manage properties"""
    auth_context.require_permission(ResourceType.PROPERTY, ActionType.MANAGE)
    return auth_context


def require_analytics_access(
    auth_context: AuthContext = Depends(get_auth_context)
) -> AuthContext:
    """Require permission to access analytics"""
    auth_context.require_permission(ResourceType.ANALYTICS, ActionType.READ)
    return auth_context


# Dependency aliases for enhanced context
ContentCreateContext = Annotated[AuthContext, Depends(require_content_create_permission)]
UserManagementContext = Annotated[AuthContext, Depends(require_user_management_permission)]
PropertyManagementContext = Annotated[AuthContext, Depends(require_property_management_permission)]
AnalyticsContext = Annotated[AuthContext, Depends(require_analytics_access)]