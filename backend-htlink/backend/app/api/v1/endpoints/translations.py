from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app import crud
from app.api.deps import CurrentUser, SessionDep, CurrentTenantId
from app.models import FeatureTranslation, FeatureTranslationCreate, FeatureTranslationUpdate
from app.models import PostTranslation, PostTranslationCreate, PostTranslationUpdate
from app.models import FeatureCategoryTranslation, FeatureCategoryTranslationCreate, FeatureCategoryTranslationUpdate

router = APIRouter()


# Feature Translations
@router.get("/features", response_model=list[FeatureTranslation])
def read_feature_translations(
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve feature translations for features belonging to current tenant.
    """
    from app.models import Feature
    statement = select(FeatureTranslation).join(Feature).where(
        Feature.tenant_id == tenant_id
    ).offset(skip).limit(limit)
    translations = session.exec(statement).all()
    return translations


@router.post("/features", response_model=FeatureTranslation)
def create_feature_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    translation_in: FeatureTranslationCreate,
) -> Any:
    """
    Create new feature translation.
    """
    # Verify feature belongs to current tenant
    from app.models import Feature
    feature = session.exec(select(Feature).where(
        Feature.id == translation_in.feature_id,
        Feature.tenant_id == tenant_id
    )).first()
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    translation = FeatureTranslation.model_validate(translation_in)
    session.add(translation)
    session.commit()
    session.refresh(translation)
    return translation


@router.put("/features/{feature_id}/{locale}", response_model=FeatureTranslation)
def update_feature_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    feature_id: int,
    locale: str,
    translation_in: FeatureTranslationUpdate,
) -> Any:
    """
    Update a feature translation.
    """
    # Verify feature belongs to current tenant
    from app.models import Feature
    feature = session.exec(select(Feature).where(
        Feature.id == feature_id,
        Feature.tenant_id == tenant_id
    )).first()
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    translation = session.exec(
        select(FeatureTranslation).where(
            FeatureTranslation.feature_id == feature_id,
            FeatureTranslation.locale == locale
        )
    ).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Feature translation not found")
    
    translation_data = translation_in.model_dump(exclude_unset=True)
    translation.sqlmodel_update(translation_data)
    session.add(translation)
    session.commit()
    session.refresh(translation)
    return translation


@router.delete("/features/{feature_id}/{locale}")
def delete_feature_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    feature_id: int,
    locale: str,
) -> Any:
    """
    Delete a feature translation.
    """
    # Verify feature belongs to current tenant
    from app.models import Feature
    feature = session.exec(select(Feature).where(
        Feature.id == feature_id,
        Feature.tenant_id == tenant_id
    )).first()
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    translation = session.exec(
        select(FeatureTranslation).where(
            FeatureTranslation.feature_id == feature_id,
            FeatureTranslation.locale == locale
        )
    ).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Feature translation not found")
    
    session.delete(translation)
    session.commit()
    return {"message": "Feature translation deleted successfully"}


# Post Translations
@router.get("/posts", response_model=list[PostTranslation])
def read_post_translations(
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve post translations for posts belonging to current tenant.
    """
    from app.models import Post
    statement = select(PostTranslation).join(Post).where(
        Post.tenant_id == tenant_id
    ).offset(skip).limit(limit)
    translations = session.exec(statement).all()
    return translations


@router.post("/posts", response_model=PostTranslation)
def create_post_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    translation_in: PostTranslationCreate,
) -> Any:
    """
    Create new post translation.
    """
    translation = PostTranslation.model_validate(translation_in, update={"tenant_id": tenant_id})
    session.add(translation)
    session.commit()
    session.refresh(translation)
    return translation


@router.put("/posts/{translation_id}", response_model=PostTranslation)
def update_post_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    translation_id: int,
    translation_in: PostTranslationUpdate,
) -> Any:
    """
    Update a post translation.
    """
    translation = session.exec(
        select(PostTranslation).where(
            PostTranslation.id == translation_id,
            PostTranslation.tenant_id == tenant_id
        )
    ).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Post translation not found")
    
    translation_data = translation_in.model_dump(exclude_unset=True)
    translation.sqlmodel_update(translation_data)
    session.add(translation)
    session.commit()
    session.refresh(translation)
    return translation


@router.delete("/posts/{translation_id}")
def delete_post_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    translation_id: int,
) -> Any:
    """
    Delete a post translation.
    """
    translation = session.exec(
        select(PostTranslation).where(
            PostTranslation.id == translation_id,
            PostTranslation.tenant_id == tenant_id
        )
    ).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Post translation not found")
    
    session.delete(translation)
    session.commit()
    return {"message": "Post translation deleted successfully"}


# Feature Category Translations
@router.get("/feature-categories", response_model=list[FeatureCategoryTranslation])
def read_feature_category_translations(
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve feature category translations for categories belonging to current tenant.
    """
    try:
        from app.models import FeatureCategory
        statement = select(FeatureCategoryTranslation).join(FeatureCategory).where(
            FeatureCategory.tenant_id == tenant_id
        ).offset(skip).limit(limit)
        translations = session.exec(statement).all()
        return translations
    except Exception as e:
        # Table might not exist yet - return empty list
        print(f"⚠️  FeatureCategoryTranslation table not found: {str(e)}", flush=True)
        return []


@router.post("/feature-categories", response_model=FeatureCategoryTranslation)
def create_feature_category_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    translation_in: FeatureCategoryTranslationCreate,
) -> Any:
    """
    Create new feature category translation.
    """
    # Verify category belongs to current tenant
    from app.models import FeatureCategory
    category = session.exec(select(FeatureCategory).where(
        FeatureCategory.id == translation_in.category_id,
        FeatureCategory.tenant_id == tenant_id
    )).first()
    if not category:
        raise HTTPException(status_code=404, detail="Feature category not found")
    
    translation = FeatureCategoryTranslation.model_validate(translation_in)
    session.add(translation)
    session.commit()
    session.refresh(translation)
    return translation


@router.put("/feature-categories/{category_id}/{locale}", response_model=FeatureCategoryTranslation)
def update_feature_category_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    category_id: int,
    locale: str,
    translation_in: FeatureCategoryTranslationUpdate,
) -> Any:
    """
    Update a feature category translation.
    """
    # Verify category belongs to current tenant
    from app.models import FeatureCategory
    category = session.exec(select(FeatureCategory).where(
        FeatureCategory.id == category_id,
        FeatureCategory.tenant_id == tenant_id
    )).first()
    if not category:
        raise HTTPException(status_code=404, detail="Feature category not found")
    
    translation = session.exec(
        select(FeatureCategoryTranslation).where(
            FeatureCategoryTranslation.category_id == category_id,
            FeatureCategoryTranslation.locale == locale
        )
    ).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Feature category translation not found")
    
    translation_data = translation_in.model_dump(exclude_unset=True)
    translation.sqlmodel_update(translation_data)
    session.add(translation)
    session.commit()
    session.refresh(translation)
    return translation


@router.delete("/feature-categories/{category_id}/{locale}")
def delete_feature_category_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    category_id: int,
    locale: str,
) -> Any:
    """
    Delete a feature category translation.
    """
    # Verify category belongs to current tenant
    from app.models import FeatureCategory
    category = session.exec(select(FeatureCategory).where(
        FeatureCategory.id == category_id,
        FeatureCategory.tenant_id == tenant_id
    )).first()
    if not category:
        raise HTTPException(status_code=404, detail="Feature category not found")
    
    translation = session.exec(
        select(FeatureCategoryTranslation).where(
            FeatureCategoryTranslation.category_id == category_id,
            FeatureCategoryTranslation.locale == locale
        )
    ).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Feature category translation not found")
    
    session.delete(translation)
    session.commit()
    return {"message": "Feature category translation deleted successfully"}
