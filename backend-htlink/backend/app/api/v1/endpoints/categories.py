"""
Categories API endpoints for Hotel SaaS
Handles feature categories and their translations
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.db import get_db
from app.models import FeatureCategory, FeatureCategoryTranslation
from app.schemas.content import (
    FeatureCategoryCreate, FeatureCategoryUpdate, FeatureCategoryResponse,
    FeatureCategoryTranslationCreate, FeatureCategoryTranslationUpdate
)

router = APIRouter()


@router.get("/", response_model=List[FeatureCategoryResponse])
def list_categories(
    *,
    db: Session = Depends(get_db),
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
def list_system_categories(*, db: Session = Depends(get_db)):
    """List system-wide feature categories"""
    statement = select(FeatureCategory).where(
        FeatureCategory.tenant_id == 0,
        FeatureCategory.is_system == True
    )
    categories = db.exec(statement).all()
    return categories


@router.get("/{category_id}", response_model=FeatureCategoryResponse)
def get_category(*, db: Session = Depends(get_db), category_id: int):
    """Get feature category by ID"""
    category = db.get(FeatureCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.post("/", response_model=FeatureCategoryResponse)
def create_category(
    *, db: Session = Depends(get_db), category_in: FeatureCategoryCreate
):
    """Create new feature category"""
    category = FeatureCategory(**category_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=FeatureCategoryResponse)
def update_category(
    *,
    db: Session = Depends(get_db),
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
    return category


@router.delete("/{category_id}")
def delete_category(*, db: Session = Depends(get_db), category_id: int):
    """Delete feature category"""
    category = db.get(FeatureCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}


# Category Translations endpoints
@router.get("/{category_id}/translations")
def get_category_translations(
    *, db: Session = Depends(get_db), category_id: int
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
    db: Session = Depends(get_db),
    category_id: int,
    translation_in: FeatureCategoryTranslationCreate
):
    """Create translation for category"""
    # Check if category exists
    category = db.get(FeatureCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    translation = FeatureCategoryTranslation(
        category_id=category_id,
        **translation_in.model_dump()
    )
    db.add(translation)
    db.commit()
    db.refresh(translation)
    return translation


@router.put("/{category_id}/translations/{locale}")
def update_category_translation(
    *,
    db: Session = Depends(get_db),
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