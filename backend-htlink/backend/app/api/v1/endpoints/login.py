from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app import crud
from app.api.deps import SessionDep, CurrentTenantId
from app.core import security
from app.core.config import settings
from app.schemas import Token


router = APIRouter()


@router.post("/access-token", response_model=Token)
def login_access_token(
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    tenant_id: CurrentTenantId,
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