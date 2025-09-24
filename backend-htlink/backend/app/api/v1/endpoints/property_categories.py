from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_tenant_from_header
from app.models import PropertyCategory, PropertyCategoryCreate, PropertyCategoryUpdate

router = APIRouter()


@router.get("/", response_model=list[PropertyCategory])
def read_property_categories(
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: str = get_tenant_from_header(),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve property categories.
    """
    statement = select(PropertyCategory).where(
        PropertyCategory.tenant_id == tenant_code
    ).offset(skip).limit(limit)
    categories = session.exec(statement).all()
    return categories


@router.post("/", response_model=PropertyCategory)
def create_property_category(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: str = get_tenant_from_header(),
    category_in: PropertyCategoryCreate,
) -> Any:
    """
    Create new property category.
    """
    category = PropertyCategory.model_validate(category_in, update={"tenant_id": tenant_code})
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@router.put("/{category_id}", response_model=PropertyCategory)
def update_property_category(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: str = get_tenant_from_header(),
    category_id: int,
    category_in: PropertyCategoryUpdate,
) -> Any:
    """
    Update a property category.
    """
    category = session.exec(
        select(PropertyCategory).where(
            PropertyCategory.id == category_id,
            PropertyCategory.tenant_id == tenant_code
        )
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Property category not found")
    
    category_data = category_in.model_dump(exclude_unset=True)
    category.sqlmodel_update(category_data)
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@router.get("/{category_id}", response_model=PropertyCategory)
def read_property_category(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: str = get_tenant_from_header(),
    category_id: int,
) -> Any:
    """
    Get property category by ID.
    """
    category = session.exec(
        select(PropertyCategory).where(
            PropertyCategory.id == category_id,
            PropertyCategory.tenant_id == tenant_code
        )
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Property category not found")
    return category


@router.delete("/{category_id}")
def delete_property_category(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: str = get_tenant_from_header(),
    category_id: int,
) -> Any:
    """
    Delete a property category.
    """
    category = session.exec(
        select(PropertyCategory).where(
            PropertyCategory.id == category_id,
            PropertyCategory.tenant_id == tenant_code
        )
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Property category not found")
    
    session.delete(category)
    session.commit()
    return {"message": "Property category deleted successfully"}