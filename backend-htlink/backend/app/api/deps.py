from collections.abc import Generator
from typing import Annotated
import logging

import jwt
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError, BaseModel
from sqlmodel import Session

from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.models import AdminUser
from app import crud

logger = logging.getLogger(__name__)


class TokenPayload(BaseModel):
    sub: str | None = None


reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> AdminUser:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials - no token",
        )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
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
    user_role = current_user.role.upper() if current_user.role else ""
    if user_role != "OWNER":
        raise HTTPException(
            status_code=403, detail="Not enough permissions"
        )
    return current_user


def get_tenant_from_header(
    session: SessionDep,
    x_tenant_code: Annotated[str | None, Header()] = None
) -> int:
    """
    Get tenant ID from X-Tenant-Code header
    """
    logger.info(f"DEBUG TENANT: Header received: x_tenant_code={x_tenant_code}")
    if not x_tenant_code:
        x_tenant_code = "demo"
        logger.info(f"DEBUG TENANT: Using default tenant: {x_tenant_code}")

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

    tenant = crud.tenant.get_by_code(session, code=x_tenant_code)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

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