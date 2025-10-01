from collections.abc import Generator
from typing import Annotated, Optional
import logging

import jwt
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError, BaseModel
from sqlmodel import Session, select

from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.models import AdminUser
from app import crud

logger = logging.getLogger(__name__)


class TokenPayload(BaseModel):
    sub: str | None = None


def debug_get_token(request: Annotated[any, Depends()]) -> str:
    from fastapi import Request
    from fastapi.security.utils import get_authorization_scheme_param
    
    authorization = request.headers.get("Authorization")
    print(f"DEBUG TOKEN: Authorization header: {authorization}")
    scheme, param = get_authorization_scheme_param(authorization)
    print(f"DEBUG TOKEN: Scheme: {scheme}, Token: {param[:20] if param else 'None'}...")
    if not authorization or scheme.lower() != "bearer":
        print("DEBUG TOKEN: No valid bearer token")
        return None
    return param

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False  # Don't auto-fail if no token
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> AdminUser:
    import sys
    print("🚨🚨🚨 ENTRY POINT: get_current_user function called", flush=True, file=sys.stderr)
    print(f"🔍 DEBUG AUTH: Token received: {token[:30] if token else 'None'}...", flush=True, file=sys.stderr)
    if not token:
        print("🚨 DEBUG AUTH: No token provided", flush=True)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials - no token",
        )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        token_data = TokenPayload(**payload)
        print(f"✅ DEBUG AUTH: Token payload: {payload}", flush=True)
        print(f"🔑 DEBUG AUTH: Token sub: {token_data.sub}, exp: {payload.get('exp', 'No exp')}", flush=True)
        import time
        current_time = int(time.time())
        exp_time = payload.get('exp', 0)
        print(f"⏰ DEBUG AUTH: Current time: {current_time}, Token exp: {exp_time}, Expired: {current_time > exp_time}", flush=True)
    except (InvalidTokenError, ValidationError) as e:
        print(f"❌ DEBUG AUTH: Token validation failed: {e}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = crud.admin_user.get(session, id=token_data.sub)
    if not user:
        print(f"👤 DEBUG AUTH: User not found for id: {token_data.sub}", flush=True)
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        print(f"🚫 DEBUG AUTH: User inactive: {user.email}", flush=True) 
        raise HTTPException(status_code=400, detail="Inactive user")
    print(f"🎉 DEBUG AUTH: User authenticated: {user.email}, role: {user.role}", flush=True)
    return user

def get_current_user_original(session: SessionDep, token: TokenDep) -> AdminUser:
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


def get_current_active_superuser(current_user: AdminUser = Depends(get_current_user)) -> AdminUser:
    """
    Get current active superuser (owner role)
    """
    print("🚨 FUNCTION CALLED: get_current_active_superuser - ENTRY POINT", flush=True)
    print(f"🔐 DEBUG SUPERUSER: User role: {current_user.role}, checking if OWNER", flush=True)
    user_role = current_user.role.upper() if current_user.role else ""
    if user_role != "OWNER":
        print(f"❌ DEBUG SUPERUSER: Role check failed - {user_role} != OWNER", flush=True)
        raise HTTPException(
            status_code=403, detail="Not enough permissions"
        )
    print("✅ DEBUG SUPERUSER: Role check passed, user is OWNER", flush=True)
    return current_user


def get_tenant_from_header(
    session: SessionDep,
    x_tenant_code: Annotated[str | None, Header()] = None
) -> int:
    """
    Get tenant ID from X-Tenant-Code header
    """
    logger.info(f"DEBUG TENANT: Header received: x_tenant_code={x_tenant_code}")
    # If no header provided, use default tenant for development
    if not x_tenant_code:
        x_tenant_code = "demo"
        logger.info(f"DEBUG TENANT: Using default tenant: {x_tenant_code}")
    
    # Look up tenant by code
    tenant = crud.tenant.get_by_code(session, code=x_tenant_code)
    if not tenant:
        logger.info(f"DEBUG TENANT: Tenant not found for code: {x_tenant_code}")
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    logger.info(f"DEBUG TENANT: Found tenant: {tenant.code} (id={tenant.id})")
    return tenant.id


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
    user_role = current_user.role.upper() if current_user.role else ""
    if user_role != "OWNER" and current_user.tenant_id != tenant.id:
        raise HTTPException(
            status_code=403, 
            detail="Access denied to this tenant"
        )
    
    return current_user


CurrentUser = Annotated[AdminUser, Depends(get_current_user)]
CurrentActiveUser = Annotated[AdminUser, Depends(get_current_user)]
CurrentSuperUser = Annotated[AdminUser, Depends(get_current_active_superuser)]
TenantUser = Annotated[AdminUser, Depends(require_tenant_access)]
CurrentTenantId = Annotated[int, Depends(get_tenant_from_header)]
