from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app import crud
from app.api.deps import CurrentUser, SessionDep, CurrentTenantId
from app.models import FeatureCategory, FeatureCategoryCreate, FeatureCategoryUpdate, ActivityType
from app.utils.activity_logger import log_activity

router = APIRouter()


@router.get("/", response_model=list[FeatureCategory])
def read_property_categories(
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: CurrentTenantId,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve property categories.
    """
    statement = select(FeatureCategory).where(
        FeatureCategory.tenant_id == tenant_code
    ).offset(skip).limit(limit)
    categories = session.exec(statement).all()
    return categories


@router.post("/", response_model=FeatureCategory)
def create_property_category(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: CurrentTenantId,
    category_in: FeatureCategoryCreate,
) -> Any:
    """
    Create new property category.
    """
    category = FeatureCategory.model_validate(category_in, update={"tenant_id": tenant_code})
    session.add(category)
    session.commit()
    session.refresh(category)

    # Log activity
    try:
        log_activity(
            db=session,
            tenant_id=tenant_code,
            activity_type=ActivityType.CREATE_CATEGORY,
            details={
                "message": f"Property category '{category.slug}' created by {current_user.email}",
                "category_id": category.id,
                "category_slug": category.slug,
                "user_id": current_user.id,
                "username": current_user.email
            }
        )
    except Exception as e:
        print(f"❌ Error logging activity: {e}")

    return category


@router.put("/{category_id}", response_model=FeatureCategory)
def update_property_category(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: CurrentTenantId,
    category_id: int,
    category_in: FeatureCategoryUpdate,
) -> Any:
    """
    Update a property category.
    """
    category = session.exec(
        select(FeatureCategory).where(
            FeatureCategory.id == category_id,
            FeatureCategory.tenant_id == tenant_code
        )
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Property category not found")

    category_data = category_in.model_dump(exclude_unset=True)
    category.sqlmodel_update(category_data)
    session.add(category)
    session.commit()
    session.refresh(category)

    # Log activity
    try:
        log_activity(
            db=session,
            tenant_id=tenant_code,
            activity_type=ActivityType.UPDATE_CATEGORY,
            details={
                "message": f"Property category '{category.slug}' updated by {current_user.email}",
                "category_id": category.id,
                "category_slug": category.slug,
                "user_id": current_user.id,
                "username": current_user.email
            }
        )
    except Exception as e:
        print(f"❌ Error logging activity: {e}")

    return category


@router.get("/{category_id}", response_model=FeatureCategory)
def read_property_category(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: CurrentTenantId,
    category_id: int,
) -> Any:
    """
    Get property category by ID.
    """
    category = session.exec(
        select(FeatureCategory).where(
            FeatureCategory.id == category_id,
            FeatureCategory.tenant_id == tenant_code
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
    tenant_code: CurrentTenantId,
    category_id: int,
) -> Any:
    """
    Delete a property category.
    """
    category = session.exec(
        select(FeatureCategory).where(
            FeatureCategory.id == category_id,
            FeatureCategory.tenant_id == tenant_code
        )
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Property category not found")

    # Store category info before deletion
    category_slug = category.slug

    session.delete(category)
    session.commit()

    # Log activity
    try:
        log_activity(
            db=session,
            tenant_id=tenant_code,
            activity_type=ActivityType.DELETE_CATEGORY,
            details={
                "message": f"Property category '{category_slug}' deleted by {current_user.email}",
                "category_id": category_id,
                "category_slug": category_slug,
                "user_id": current_user.id,
                "username": current_user.email
            }
        )
    except Exception as e:
        print(f"❌ Error logging activity: {e}")

    return {"message": "Property category deleted successfully"}