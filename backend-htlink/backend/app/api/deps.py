from collections.abc import Generator
from typing import Annotated, Optional

import jwt
from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError, BaseModel
from sqlmodel import Session, select

from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.models import AdminUser, Tenant
from app import crud


class TokenPayload(BaseModel):
    sub: str | None = None


reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/access-token"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> AdminUser:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = crud.admin_user.get(session, id=token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


# Type annotations for dependencies (define early)
CurrentUser = Annotated[AdminUser, Depends(get_current_user)]


def get_current_active_superuser(current_user: AdminUser = Depends(get_current_user)) -> AdminUser:
    """
    Get current active superuser (owner role)
    """
    if current_user.role != "owner":
        raise HTTPException(
            status_code=403, detail="Not enough permissions"
        )
    return current_user


def get_tenant_id_from_header(
    session: SessionDep,
    x_tenant_code: Annotated[str | None, Header()] = None
) -> int:
    """
    Get tenant ID from X-Tenant-Code header
    """
    # If no header provided, use default tenant for development
    if not x_tenant_code:
        x_tenant_code = "demo"
    
    # Look up tenant by code
    tenant = crud.tenant.get_by_code(session, code=x_tenant_code)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return tenant.id


def get_tenant_code_from_header(
    x_tenant_code: Annotated[str | None, Header()] = None
) -> str:
    """
    Get tenant code from X-Tenant-Code header (for use in queries)
    """
    # If no header provided, use default tenant for development
    if not x_tenant_code:
        return "demo"
    return x_tenant_code


def get_current_tenant(request: Request) -> Tenant:
    """
    Get current tenant from request state (set by middleware)
    """
    if not hasattr(request.state, 'tenant'):
        raise HTTPException(
            status_code=500, 
            detail="Tenant not found in request state. Middleware may not be configured."
        )
    return request.state.tenant


def get_current_tenant_id(request: Request) -> int:
    """
    Get current tenant ID from request state
    """
    if not hasattr(request.state, 'tenant_id'):
        raise HTTPException(
            status_code=500, 
            detail="Tenant ID not found in request state. Middleware may not be configured."
        )
    return request.state.tenant_id


def require_tenant_owner_access(
    current_user: AdminUser = Depends(get_current_user),
    current_tenant: Annotated[Tenant, Depends(get_current_tenant)] = None
) -> AdminUser:
    """
    Ensure current user is OWNER of the current tenant
    """
    if current_user.role != "OWNER":
        raise HTTPException(
            status_code=403, 
            detail="Owner access required"
        )
    
    if current_user.tenant_id != current_tenant.id:
        raise HTTPException(
            status_code=403, 
            detail="Access denied to this tenant"
        )
    
    return current_user


def require_tenant_admin_access(
    current_user: AdminUser = Depends(get_current_user),
    current_tenant: Annotated[Tenant, Depends(get_current_tenant)] = None
) -> AdminUser:
    """
    Ensure current user is OWNER or ADMIN of the current tenant
    """
    if current_user.role not in ["OWNER", "ADMIN"]:
        raise HTTPException(
            status_code=403, 
            detail="Admin access required"
        )
    
    if current_user.tenant_id != current_tenant.id:
        raise HTTPException(
            status_code=403, 
            detail="Access denied to this tenant"
        )
    
    return current_user


def require_tenant_editor_access(
    current_user: AdminUser = Depends(get_current_user),
    current_tenant: Annotated[Tenant, Depends(get_current_tenant)] = None
) -> AdminUser:
    """
    Ensure current user has EDITOR+ access to the current tenant
    """
    if current_user.role not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(
            status_code=403, 
            detail="Editor access required"
        )
    
    if current_user.tenant_id != current_tenant.id:
        raise HTTPException(
            status_code=403, 
            detail="Access denied to this tenant"
        )
    
    return current_user


def require_tenant_access(
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    x_tenant_code: Annotated[str | None, Header()] = None
) -> AdminUser:
    """
    Ensure user has access to the requested tenant
    """
    if not x_tenant_code:
        raise HTTPException(status_code=400, detail="Tenant header required")
    
    # Look up tenant by code
    tenant = crud.tenant.get_by_code(session, code=x_tenant_code)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    # Allow superusers to access any tenant, otherwise check user's tenant
    if current_user.role != "owner" and current_user.tenant_id != tenant.id:
        raise HTTPException(
            status_code=403, 
            detail="Access denied to this tenant"
        )
    
    return current_user


# Type annotations for dependencies (additional)
CurrentActiveUser = Annotated[AdminUser, Depends(get_current_user)]
CurrentSuperUser = Annotated[AdminUser, Depends(get_current_active_superuser)]
TenantUser = Annotated[AdminUser, Depends(require_tenant_access)]
TenantId = Annotated[int, Depends(get_tenant_id_from_header)]
TenantCode = Annotated[str, Depends(get_tenant_code_from_header)]

# New improved tenant-aware dependencies
CurrentTenant = Annotated[Tenant, Depends(get_current_tenant)]
CurrentTenantId = Annotated[int, Depends(get_current_tenant_id)]
TenantOwner = Annotated[AdminUser, Depends(require_tenant_owner_access)]
TenantAdmin = Annotated[AdminUser, Depends(require_tenant_admin_access)]
TenantEditor = Annotated[AdminUser, Depends(require_tenant_editor_access)]
