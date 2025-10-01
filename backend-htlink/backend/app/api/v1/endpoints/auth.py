from datetime import timedelta
from typing import Any

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlmodel import select

from app.api.deps import SessionDep
from app.core import security
from app.core.config import settings
from app.models import AdminUser, Tenant
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