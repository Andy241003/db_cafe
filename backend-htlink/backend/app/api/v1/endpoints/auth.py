from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_tenant_from_header
from app.core import security
from app.core.config import settings
from app.schemas import AdminUserResponse


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class NewPassword(BaseModel):
    token: str
    new_password: str


router = APIRouter()


@router.post("/access-token")
def login_access_token(
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    tenant_id: int | None = Depends(get_tenant_from_header)
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.admin_user.authenticate(
        session, 
        email=form_data.username, 
        password=form_data.password,
        tenant_id=tenant_id
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            subject=str(user.id), expires_delta=access_token_expires
        )
    )


@router.post("/test-token", response_model=AdminUserResponse)
def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token
    """
    return current_user


@router.post("/password-recovery/{email}")
def recover_password(email: str, session: SessionDep) -> Any:
    """
    Password Recovery
    """
    user = crud.admin_user.get_by_email(session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    
    # TODO: Send password recovery email
    # For now, just return a success message
    return {"message": "Password recovery email sent"}


@router.post("/reset-password/")
def reset_password(session: SessionDep, body: NewPassword) -> Any:
    """
    Reset password
    """
    # TODO: Implement token verification for password reset
    # For now, this is a placeholder
    raise HTTPException(
        status_code=400,
        detail="Password reset not implemented yet"
    )