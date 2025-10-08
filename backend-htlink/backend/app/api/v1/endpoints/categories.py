"""
Categories API endpoints for Hotel SaaS
Handles feature categories and their translations
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api.deps import SessionDep, CurrentUser, CurrentTenantId
from app.models import FeatureCategory, FeatureCategoryTranslation
from app.models.activity_log import ActivityType
from app.utils.activity_logger import log_activity
from app.schemas.content import (
    FeatureCategoryCreate, FeatureCategoryUpdate, FeatureCategoryResponse,
    FeatureCategoryTranslationCreate, FeatureCategoryTranslationUpdate
)

router = APIRouter()


@router.get("/", response_model=List[FeatureCategoryResponse])
def list_categories(
    *,
    db: SessionDep,
    tenant_id: int = 0,  # 0 for system categories
    skip: int = 0,
    limit: int = 100
):
    """List feature categories"""
    statement = select(FeatureCategory).where(
        FeatureCategory.tenant_id == tenant_id
    ).offset(skip).limit(limit)
    categories = db.exec(statement).all()
    return categories


@router.get("/system", response_model=List[FeatureCategoryResponse])
def list_system_categories(*, db: SessionDep):
    """List system-wide feature categories"""
    statement = select(FeatureCategory).where(
        FeatureCategory.tenant_id == 0,
        FeatureCategory.is_system == True
    )
    categories = db.exec(statement).all()
    return categories


@router.get("/{category_id}", response_model=FeatureCategoryResponse)
def get_category(*, db: SessionDep, category_id: int):
    """Get feature category by ID"""
    category = db.get(FeatureCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.post("/", response_model=FeatureCategoryResponse)
def create_category(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    category_in: FeatureCategoryCreate
):
    """Create new feature category"""
    print(f"🔥 CREATE_CATEGORY called by {current_user.email}")
    category = FeatureCategory(**category_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    print(f"✅ Category created: {category.slug} (ID: {category.id})")

    # Log activity
    try:
        print(f"📝 Logging activity for category {category.slug}...")
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
        print(f"✅ Activity logged successfully")
    except Exception as e:
        print(f"❌ Error logging activity: {e}")
        import traceback
        traceback.print_exc()

    return category


@router.put("/{category_id}", response_model=FeatureCategoryResponse)
def update_category(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    category_id: int,
    category_in: FeatureCategoryUpdate
):
    """Update feature category"""
    category = db.get(FeatureCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

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
    """Delete feature category"""
    category = db.get(FeatureCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

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
    try:
        print(f"🔥 CREATE CATEGORY TRANSLATION called", flush=True)
        print(f"   Category ID: {category_id}", flush=True)
        print(f"   Translation data: {translation_in.model_dump()}", flush=True)

        # Check if category exists
        category = db.get(FeatureCategory, category_id)
        if not category:
            print(f"❌ Category {category_id} not found", flush=True)
            raise HTTPException(status_code=404, detail="Category not found")

        print(f"✅ Category found: {category.id}, slug: {category.slug}", flush=True)

        # Check if translation already exists
        existing = db.exec(select(FeatureCategoryTranslation).where(
            FeatureCategoryTranslation.category_id == category_id,
            FeatureCategoryTranslation.locale == translation_in.locale
        )).first()

        if existing:
            print(f"⚠️  Translation already exists for category {category_id}, locale {translation_in.locale}", flush=True)
            raise HTTPException(status_code=400, detail=f"Translation for locale '{translation_in.locale}' already exists. Use PUT to update.")

        # Get translation data and ensure category_id from URL is used
        translation_data = translation_in.model_dump(exclude_unset=True)
        # Always use category_id from URL path (override if present in body)
        translation_data['category_id'] = category_id

        print(f"📦 Creating translation with data: {translation_data}", flush=True)

        translation = FeatureCategoryTranslation(**translation_data)
        db.add(translation)
        db.commit()
        db.refresh(translation)

        print(f"✅ Category translation created successfully", flush=True)
        return translation
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating category translation: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


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