from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app import crud
from app.api.deps import CurrentUser, SessionDep, CurrentTenantId
from app.models import Locale, LocaleCreate, LocaleUpdate

router = APIRouter()


@router.get("/", response_model=list[Locale])
def read_locales(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve locales.
    """
    statement = select(Locale).offset(skip).limit(limit)
    locales = session.exec(statement).all()
    return locales


@router.post("/", response_model=Locale)
def create_locale(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    locale_in: LocaleCreate,
) -> Any:
    """
    Create new locale.
    """
    # Check if locale already exists
    locale = session.exec(select(Locale).where(Locale.code == locale_in.code)).first()
    if locale:
        raise HTTPException(
            status_code=400,
            detail="The locale with this code already exists in the system.",
        )
    
    locale = Locale.model_validate(locale_in)
    session.add(locale)
    session.commit()
    session.refresh(locale)
    return locale


@router.put("/{code}", response_model=Locale)
def update_locale(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    code: str,
    locale_in: LocaleUpdate,
) -> Any:
    """
    Update a locale.
    """
    locale = session.exec(select(Locale).where(Locale.code == code)).first()
    if not locale:
        raise HTTPException(status_code=404, detail="Locale not found")
    
    locale_data = locale_in.model_dump(exclude_unset=True)
    locale.sqlmodel_update(locale_data)
    session.add(locale)
    session.commit()
    session.refresh(locale)
    return locale


@router.get("/{code}", response_model=Locale)
def read_locale(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    code: str,
) -> Any:
    """
    Get locale by code.
    """
    locale = session.exec(select(Locale).where(Locale.code == code)).first()
    if not locale:
        raise HTTPException(status_code=404, detail="Locale not found")
    return locale


@router.delete("/{code}")
def delete_locale(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    code: str,
) -> Any:
    """
    Delete a locale.
    """
    locale = session.exec(select(Locale).where(Locale.code == code)).first()
    if not locale:
        raise HTTPException(status_code=404, detail="Locale not found")
    
    session.delete(locale)
    session.commit()
    return {"message": "Locale deleted successfully"}