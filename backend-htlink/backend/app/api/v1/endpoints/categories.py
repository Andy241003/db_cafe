"""
Categories API endpoints for Hotel SaaS
Handles feature categories and their translations
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api.deps import SessionDep, CurrentUser, CurrentTenantId
from app.models import FeatureCategory, FeatureCategoryTranslation, UserRole
from app.models.activity_log import ActivityType
from app.utils.activity_logger import log_activity
from app.schemas.content import (
    FeatureCategoryCreate, FeatureCategoryUpdate, FeatureCategoryResponse,
    FeatureCategoryTranslationCreate, FeatureCategoryTranslationUpdate
)
from app.core.permissions_utils import is_admin_or_owner

router = APIRouter()


@router.get("/", response_model=List[FeatureCategoryResponse])
def list_categories(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    tenant_id: int = 0,  # 0 for system categories
    skip: int = 0,
    limit: int = 100
):
    """List feature categories - requires authentication"""
    # If requesting specific tenant categories, check access
    if tenant_id > 0:
        if current_user.role.upper() != "OWNER" and current_user.tenant_id != tenant_id:
            raise HTTPException(status_code=403, detail="Access denied to this tenant")

    statement = select(FeatureCategory).where(
        FeatureCategory.tenant_id == tenant_id
    ).offset(skip).limit(limit)
    categories = db.exec(statement).all()
    return categories


@router.get("/system", response_model=List[FeatureCategoryResponse])
def list_system_categories(
    *,
    db: SessionDep,
    current_user: CurrentUser
):
    """List system-wide feature categories - requires authentication"""
    statement = select(FeatureCategory).where(
        FeatureCategory.tenant_id == 0,
        FeatureCategory.is_system == True
    )
    categories = db.exec(statement).all()
    return categories


@router.get("/{category_id}", response_model=FeatureCategoryResponse)
def get_category(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    category_id: int
):
    """Get feature category by ID - requires authentication"""
    category = db.get(FeatureCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check tenant access for non-system categories
    if category.tenant_id > 0:
        if current_user.role.upper() != "OWNER" and current_user.tenant_id != category.tenant_id:
            raise HTTPException(status_code=403, detail="Access denied to this category")

    return category


@router.post("/", response_model=FeatureCategoryResponse)
def create_category(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    category_in: FeatureCategoryCreate
):
    """Create new feature category - requires OWNER, ADMIN, or EDITOR role"""
    # Check permissions - OWNER, ADMIN, EDITOR can create
    if current_user.role.upper() not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Set tenant_id from current tenant context
    category_data = category_in.model_dump()
    category_data['tenant_id'] = tenant_id

    category = FeatureCategory(**category_data)
    db.add(category)
    db.commit()
    db.refresh(category)

    # Log activity
    log_activity(
        db=db,
        tenant_id=current_user.tenant_id,
        activity_type=ActivityType.CREATE_CATEGORY,
        details={
            "message": f"Category '{category.slug}' created by {current_user.email}",
            "category_id": category.id,
            "category_slug": category.slug,
            "user_id": current_user.id,
            "username": current_user.email
        }
    )

    return category


@router.put("/{category_id}", response_model=FeatureCategoryResponse)
def update_category(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    category_id: int,
    category_in: FeatureCategoryUpdate
):
    """Update feature category - requires OWNER, ADMIN, or EDITOR role"""
    # Check permissions - OWNER, ADMIN, EDITOR can update
    if current_user.role.upper() not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Use explicit select to force reload all columns including priority
    from sqlmodel import select as sqlmodel_select
    statement = sqlmodel_select(FeatureCategory).where(FeatureCategory.id == category_id)
    category = db.exec(statement).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check tenant access for non-system categories
    if category.tenant_id > 0:
        if current_user.role.upper() != "OWNER" and current_user.tenant_id != category.tenant_id:
            raise HTTPException(status_code=403, detail="Access denied to this category")

    update_data = category_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    db.add(category)
    db.commit()
    db.refresh(category)

    # Log activity
    log_activity(
        db=db,
        tenant_id=current_user.tenant_id,
        activity_type=ActivityType.UPDATE_CATEGORY,
        details={
            "message": f"Category '{category.slug}' updated by {current_user.email}",
            "category_id": category.id,
            "category_slug": category.slug,
            "updated_fields": list(update_data.keys()),
            "user_id": current_user.id,
            "username": current_user.email
        }
    )

    return category


@router.delete("/{category_id}")
def delete_category(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    category_id: int
):
    """Delete feature category - requires OWNER, ADMIN, or EDITOR role"""
    # Check permissions - OWNER, ADMIN, EDITOR can delete
    if current_user.role.upper() not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    category = db.get(FeatureCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check tenant access for non-system categories
    if category.tenant_id > 0:
        if current_user.role.upper() != "OWNER" and current_user.tenant_id != category.tenant_id:
            raise HTTPException(status_code=403, detail="Access denied to this category")

    # Store info before deletion
    category_slug = category.slug

    db.delete(category)
    db.commit()

    # Log activity
    log_activity(
        db=db,
        tenant_id=current_user.tenant_id,
        activity_type=ActivityType.DELETE_CATEGORY,
        details={
            "message": f"Category '{category_slug}' deleted by {current_user.email}",
            "category_id": category_id,
            "category_slug": category_slug,
            "user_id": current_user.id,
            "username": current_user.email
        }
    )

    return {"message": "Category deleted successfully"}


# Category Translations endpoints
@router.get("/{category_id}/translations")
def get_category_translations(
    *, db: SessionDep, category_id: int
):
    """Get all translations for a category"""
    statement = select(FeatureCategoryTranslation).where(
        FeatureCategoryTranslation.category_id == category_id
    )
    translations = db.exec(statement).all()
    return translations


@router.post("/{category_id}/translations")
def create_category_translation(
    *,
    db: SessionDep,
    category_id: int,
    translation_in: FeatureCategoryTranslationCreate
):
    """Create translation for category"""
    # Check if category exists
    category = db.get(FeatureCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if translation already exists
    existing = db.exec(select(FeatureCategoryTranslation).where(
        FeatureCategoryTranslation.category_id == category_id,
        FeatureCategoryTranslation.locale == translation_in.locale
    )).first()

    if existing:
        raise HTTPException(status_code=400, detail=f"Translation for locale '{translation_in.locale}' already exists. Use PUT to update.")

    # Get translation data and ensure category_id from URL is used
    translation_data = translation_in.model_dump(exclude_unset=True)
    # Always use category_id from URL path (override if present in body)
    translation_data['category_id'] = category_id

    translation = FeatureCategoryTranslation(**translation_data)
    db.add(translation)
    db.commit()
    db.refresh(translation)

    return translation


@router.put("/{category_id}/translations/{locale}")
def update_category_translation(
    *,
    db: SessionDep,
    category_id: int,
    locale: str,
    translation_in: FeatureCategoryTranslationUpdate
):
    """Update category translation"""
    statement = select(FeatureCategoryTranslation).where(
        FeatureCategoryTranslation.category_id == category_id,
        FeatureCategoryTranslation.locale == locale
    )
    translation = db.exec(statement).first()
    
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    
    update_data = translation_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(translation, field, value)
    
    db.add(translation)
    db.commit()
    db.refresh(translation)
    return translation
