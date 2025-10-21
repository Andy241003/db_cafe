from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select

from app import crud
from app.api.deps import SessionDep, CurrentUser, CurrentTenantId
from app.models import Feature, FeatureCategory
from app.models.activity_log import ActivityType
from app.utils.activity_logger import log_activity
from app.schemas import (
    FeatureCategoryCreate,
    FeatureCategoryResponse,
    FeatureCategoryUpdate,
    FeatureCreate,
    FeatureResponse,
    FeatureUpdate
)

router = APIRouter()

# Feature Categories endpoints
@router.get("/categories", response_model=List[FeatureCategoryResponse])
def read_feature_categories(
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    skip: int = 0,
    limit: int = 100,
    include_system: bool = True,
) -> Any:
    """
    Retrieve feature categories for tenant, including system-wide categories.
    """
    categories = crud.feature_category.get_by_tenant(
        session, tenant_id=tenant_id if not include_system else 0, 
        skip=skip, limit=limit, include_system=include_system
    )
    return categories


@router.post("/categories/", response_model=FeatureCategoryResponse)
def create_feature_category(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    category_in: FeatureCategoryCreate,
) -> Any:
    """
    Create new feature category. Owners, admins, and editors can create categories.
    """
    user_role = current_user.role.upper() if current_user.role else ""
    if user_role not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    category_in.tenant_id = tenant_id
    category = crud.feature_category.create(session, obj_in=category_in)
    return category


@router.get("/categories/{category_id}", response_model=FeatureCategoryResponse)
def read_feature_category(
    category_id: int,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get feature category by ID.
    """
    category = crud.feature_category.get(session, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.put("/categories/{category_id}", response_model=FeatureCategoryResponse)
def update_feature_category(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    category_id: int,
    category_in: FeatureCategoryUpdate,
) -> Any:
    """
    Update feature category. Owners, admins, and editors can update.
    """
    user_role = current_user.role.upper() if current_user.role else ""
    if user_role not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    category = crud.feature_category.get(session, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category = crud.feature_category.update(session, db_obj=category, obj_in=category_in)
    
    return category


# Features endpoints
@router.get("/", response_model=List[FeatureResponse])
def read_features(
    session: SessionDep,
    current_user: CurrentUser,
    category_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    include_system: bool = True,
) -> Any:
    """
    Retrieve features for tenant, optionally filtered by category.
    """
    from app.models import FeatureTranslation

    # Get user's tenant features
    features = crud.feature.get_by_tenant(
        session,
        tenant_id=current_user.tenant_id,
        category_id=category_id,
        skip=skip,
        limit=limit,
        include_system=include_system
    )

    # Load translations for each feature
    features_with_translations = []
    for feature in features:
        feature_dict = feature.model_dump() if hasattr(feature, 'model_dump') else feature.dict()

        # Load translations
        translations = session.exec(
            select(FeatureTranslation).where(FeatureTranslation.feature_id == feature.id)
        ).all()

        # Convert to dict keyed by locale
        translations_dict = {}
        for trans in translations:
            translations_dict[trans.locale] = {
                "title": trans.title,
                "short_desc": trans.short_desc
            }

        feature_dict['translations'] = translations_dict
        features_with_translations.append(feature_dict)

    return features_with_translations


@router.post("/test", response_model=FeatureResponse)  
def create_feature_test(
    *,
    session: SessionDep,
    feature_in: FeatureCreate,
) -> Any:
    """
    Test endpoint for creating features without auth checks
    """
    feature_in.tenant_id = 1  # Hardcode tenant for testing
    feature = crud.feature.create(session, obj_in=feature_in)
    return feature

@router.post("/", response_model=FeatureResponse)
def create_feature(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    feature_in: FeatureCreate,
) -> Any:
    """
    Create new feature. Owners, admins, and editors can create features.
    """
    # Fix role check - database has "OWNER" but code expects "owner"
    user_role = current_user.role.upper() if current_user.role else ""
    if user_role not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    feature_in.tenant_id = tenant_id
    feature = crud.feature.create(session, obj_in=feature_in)
    
    # Log activity
    log_activity(
        db=session,
        tenant_id=tenant_id,
        activity_type=ActivityType.CREATE_FEATURE,
        details={
            "message": f"Feature '{feature.slug}' created by {current_user.email}",
            "user_id": current_user.id,
            "username": current_user.email,
            "feature_id": feature.id,
            "feature_slug": feature.slug
        }
    )
    
    return feature


@router.get("/{feature_id}", response_model=FeatureResponse)
def read_feature(
    feature_id: int,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get feature by ID.
    """
    feature = crud.feature.get(session, id=feature_id)
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    return feature


@router.put("/{feature_id}", response_model=FeatureResponse)
def update_feature(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    feature_id: int,
    feature_in: FeatureUpdate,
) -> Any:
    """
    Update feature. Owners, admins, and editors can update features.
    """
    # Fix role check - database has "OWNER" but code expects "owner"
    user_role = current_user.role.upper() if current_user.role else ""
    if user_role not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    feature = crud.feature.get(session, id=feature_id)
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    # Store old slug before update
    old_slug = feature.slug
    
    feature = crud.feature.update(session, db_obj=feature, obj_in=feature_in)
    
    # If slug changed, update all posts of this feature
    if feature_in.slug and feature_in.slug != old_slug:
        from sqlmodel import select
        from app.models import Post
        
        posts_to_update = session.exec(
            select(Post).where(Post.feature_id == feature_id)
        ).all()
        
        for post in posts_to_update:
            post.slug = feature_in.slug
            session.add(post)
        
        session.commit()
        session.refresh(feature)
    
    # Log activity
    log_activity(
        db=session,
        tenant_id=current_user.tenant_id,
        activity_type=ActivityType.UPDATE_FEATURE,
        details={
            "message": f"Feature '{feature.slug}' updated by {current_user.email}",
            "user_id": current_user.id,
            "username": current_user.email,
            "feature_id": feature.id,
            "feature_slug": feature.slug
        }
    )
    
    return feature


@router.delete("/{feature_id}")
def delete_feature(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    feature_id: int,
) -> Any:
    """
    Delete feature. Owners, admins, and editors can delete features.
    """
    # Fix role check - database has "OWNER" but code expects "owner"
    user_role = current_user.role.upper() if current_user.role else ""
    if user_role not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    feature = crud.feature.get(session, id=feature_id)
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")

    feature_slug = feature.slug  # Save before deletion
    crud.feature.remove(session, id=feature_id)
    
    # Log activity
    log_activity(
        db=session,
        tenant_id=current_user.tenant_id,
        activity_type=ActivityType.DELETE_FEATURE,
        details={
            "message": f"Feature '{feature_slug}' deleted by {current_user.email}",
            "user_id": current_user.id,
            "username": current_user.email,
            "feature_id": feature_id,
            "feature_slug": feature_slug
        }
    )
    
    return {"detail": "Feature deleted"}