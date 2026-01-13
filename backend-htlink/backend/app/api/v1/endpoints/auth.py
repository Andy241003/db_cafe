from datetime import timedelta
from typing import Any

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlmodel import select

from app.api.deps import SessionDep, get_current_user, CurrentUser
from app.core import security
from app.core.config import settings
from app.core.security import get_client_ip
from app.models import AdminUser, Tenant
from app.models.activity_log import ActivityType
from app.utils.activity_logger import log_activity
from app import crud


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_info: dict[str, Any]
    tenant_info: dict[str, Any]


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


router = APIRouter()


@router.post("/login")
def login(
    request: Request,
    session: SessionDep,
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Login endpoint with username/password authentication
    
    POST /api/v1/auth/login
    Form data:
    - username: admin@travel.link360.vn  
    - password: admin123
    
    Backend automatically finds the correct tenant for the user
    Returns access token for external apps to use
    """
    # Find user across all tenants
    user = None
    tenant = None
    
    # Get all tenants and try to find user in each one
    all_tenants = session.exec(select(Tenant)).all()
    
    for t in all_tenants:
        # Try to authenticate user in this tenant
        temp_user = crud.admin_user.authenticate(
            db=session,
            email=form_data.username,
            password=form_data.password,
            tenant_id=t.id
        )
        
        if temp_user:
            user = temp_user
            tenant = t
            break
    
    if not user or not tenant:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=400, 
            detail="Inactive user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=str(user.id), 
        expires_delta=access_token_expires
    )
    
    # Get client IP
    client_ip = get_client_ip(request)
    
    # Log successful login with IP
    log_activity(
        db=session,
        tenant_id=tenant.id,
        activity_type=ActivityType.LOGIN,
        details={
            "message": f"User {user.email} logged in from {client_ip}",
            "user_id": user.id,
            "username": user.email
        },
        ip_address=client_ip
    )
    
    # Return token with user info
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active
        },
        "tenant_info": {
            "id": tenant.id,
            "name": tenant.name,
            "code": tenant.code
        }
    }


@router.get("/auto-token", response_model=Token)
def auto_generate_token_for_docs(
    session: SessionDep,
    tenant_code: str = "demo"
) -> Token:
    """
    Auto-generate token for API docs "Authorize" button
    This saves token to localStorage for external apps to use
    """
    # Get tenant by code
    tenant = session.exec(
        select(Tenant).where(Tenant.code == tenant_code)
    ).first()
    
    if not tenant:
        raise HTTPException(status_code=400, detail=f"Tenant '{tenant_code}' not found")
    
    # Get default admin user for this tenant
    user = session.exec(
        select(AdminUser).where(
            AdminUser.email == settings.FIRST_SUPERUSER,
            AdminUser.tenant_id == tenant.id
        )
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Default admin user not found")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Default admin user is inactive")
    
    # Create token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.post("/logout")
def logout(
    request: Request,
    session: SessionDep,
    current_user: CurrentUser,
):
    """
    Logout endpoint - logs the logout activity
    
    POST /api/v1/auth/logout
    Requires valid authentication token
    """
    # Get client IP
    client_ip = get_client_ip(request)
    
    # Log logout activity with IP
    log_activity(
        db=session,
        tenant_id=current_user.tenant_id,
        activity_type=ActivityType.LOGOUT,
        details={
            "message": f"User {current_user.email} logged out from {client_ip}",
            "user_id": current_user.id,
            "username": current_user.email
        },
        ip_address=client_ip
    )
    
    # In a stateless JWT system, logout is handled client-side by discarding the token
    # No server-side session cleanup needed
    return {"message": "Successfully logged out"}


@router.get("/me/services")
def get_user_services(
    session: SessionDep,
    current_user: CurrentUser
):
    """
    Get current user's service access configuration
    
    Returns:
    - service_access: 0 = Travel Link only, 1 = VR Hotel only, 2 = Both services
    - available_services: List of available service codes
    
    GET /api/v1/auth/me/services
    Requires valid authentication token
    """
    # Get service access value (0, 1, or 2)
    service_access = current_user.service_access or 0
    
    # Map service_access to available services
    service_map = {
        0: ["travel-link"],           # Travel Link only
        1: ["vr-hotel"],              # VR Hotel only
        2: ["travel-link", "vr-hotel"]  # Both services
    }
    
    available_services = service_map.get(service_access, ["travel-link"])
    
    return {
        "service_access": service_access,
        "available_services": available_services,
        "user_id": current_user.id,
        "email": current_user.email
    }