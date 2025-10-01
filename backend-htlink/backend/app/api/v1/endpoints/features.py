from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException

from app import crud
from app.api.deps import SessionDep, CurrentUser, CurrentTenantId
from app.models import Feature, FeatureCategory
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


@router.post("/categories", response_model=FeatureCategoryResponse)
def create_feature_category(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    category_in: FeatureCategoryCreate,
) -> Any:
    """
    Create new feature category. Only admins and owners can create categories.
    """
    if current_user.role not in ["owner", "admin"]:
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
    Update feature category. Only admins and owners can update.
    """
    if current_user.role not in ["owner", "admin"]:
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
    # Get user's tenant features
    features = crud.feature.get_by_tenant(
        session, 
        tenant_id=current_user.tenant_id,
        category_id=category_id,
        skip=skip, 
        limit=limit,
        include_system=include_system
    )
    return features


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
    Create new feature. Only owners and admins can create features.
    """
    # Fix role check - database has "OWNER" but code expects "owner"
    user_role = current_user.role.upper() if current_user.role else ""
    if user_role not in ["OWNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    feature_in.tenant_id = tenant_id
    feature = crud.feature.create(session, obj_in=feature_in)
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
    Update feature. Only owners and admins can update features.
    """
    # Fix role check - database has "OWNER" but code expects "owner"
    user_role = current_user.role.upper() if current_user.role else ""
    if user_role not in ["OWNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    feature = crud.feature.get(session, id=feature_id)
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    feature = crud.feature.update(session, db_obj=feature, obj_in=feature_in)
    return feature


@router.delete("/{feature_id}")
def delete_feature(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    feature_id: int,
) -> Any:
    """
    Delete feature. Only owners and admins can delete features.
    """
    # Fix role check - database has "OWNER" but code expects "owner"
    user_role = current_user.role.upper() if current_user.role else ""
    if user_role not in ["OWNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    feature = crud.feature.get(session, id=feature_id)
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    crud.feature.remove(session, id=feature_id)
    return {"detail": "Feature deleted"}