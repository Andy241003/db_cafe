from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_tenant_from_header
from app.models import FeatureTranslation, FeatureTranslationCreate, FeatureTranslationUpdate
from app.models import PostTranslation, PostTranslationCreate, PostTranslationUpdate
from app.models import FeatureCategoryTranslation, FeatureCategoryTranslationCreate, FeatureCategoryTranslationUpdate

router = APIRouter()


# Feature Translations
@router.get("/features", response_model=list[FeatureTranslation])
def read_feature_translations(
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: str = get_tenant_from_header(),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve feature translations.
    """
    statement = select(FeatureTranslation).where(
        FeatureTranslation.tenant_id == tenant_code
    ).offset(skip).limit(limit)
    translations = session.exec(statement).all()
    return translations


@router.post("/features", response_model=FeatureTranslation)
def create_feature_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: str = get_tenant_from_header(),
    translation_in: FeatureTranslationCreate,
) -> Any:
    """
    Create new feature translation.
    """
    translation = FeatureTranslation.model_validate(translation_in, update={"tenant_id": tenant_code})
    session.add(translation)
    session.commit()
    session.refresh(translation)
    return translation


@router.put("/features/{translation_id}", response_model=FeatureTranslation)
def update_feature_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: str = get_tenant_from_header(),
    translation_id: int,
    translation_in: FeatureTranslationUpdate,
) -> Any:
    """
    Update a feature translation.
    """
    translation = session.exec(
        select(FeatureTranslation).where(
            FeatureTranslation.id == translation_id,
            FeatureTranslation.tenant_id == tenant_code
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


@router.delete("/features/{translation_id}")
def delete_feature_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: str = get_tenant_from_header(),
    translation_id: int,
) -> Any:
    """
    Delete a feature translation.
    """
    translation = session.exec(
        select(FeatureTranslation).where(
            FeatureTranslation.id == translation_id,
            FeatureTranslation.tenant_id == tenant_code
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
    tenant_code: str = get_tenant_from_header(),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve post translations.
    """
    statement = select(PostTranslation).where(
        PostTranslation.tenant_id == tenant_code
    ).offset(skip).limit(limit)
    translations = session.exec(statement).all()
    return translations


@router.post("/posts", response_model=PostTranslation)
def create_post_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: str = get_tenant_from_header(),
    translation_in: PostTranslationCreate,
) -> Any:
    """
    Create new post translation.
    """
    translation = PostTranslation.model_validate(translation_in, update={"tenant_id": tenant_code})
    session.add(translation)
    session.commit()
    session.refresh(translation)
    return translation


@router.put("/posts/{translation_id}", response_model=PostTranslation)
def update_post_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: str = get_tenant_from_header(),
    translation_id: int,
    translation_in: PostTranslationUpdate,
) -> Any:
    """
    Update a post translation.
    """
    translation = session.exec(
        select(PostTranslation).where(
            PostTranslation.id == translation_id,
            PostTranslation.tenant_id == tenant_code
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
    tenant_code: str = get_tenant_from_header(),
    translation_id: int,
) -> Any:
    """
    Delete a post translation.
    """
    translation = session.exec(
        select(PostTranslation).where(
            PostTranslation.id == translation_id,
            PostTranslation.tenant_id == tenant_code
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
    tenant_code: str = get_tenant_from_header(),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve feature category translations.
    """
    statement = select(FeatureCategoryTranslation).where(
        FeatureCategoryTranslation.tenant_id == tenant_code
    ).offset(skip).limit(limit)
    translations = session.exec(statement).all()
    return translations


@router.post("/feature-categories", response_model=FeatureCategoryTranslation)
def create_feature_category_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: str = get_tenant_from_header(),
    translation_in: FeatureCategoryTranslationCreate,
) -> Any:
    """
    Create new feature category translation.
    """
    translation = FeatureCategoryTranslation.model_validate(translation_in, update={"tenant_id": tenant_code})
    session.add(translation)
    session.commit()
    session.refresh(translation)
    return translation


@router.put("/feature-categories/{translation_id}", response_model=FeatureCategoryTranslation)
def update_feature_category_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: str = get_tenant_from_header(),
    translation_id: int,
    translation_in: FeatureCategoryTranslationUpdate,
) -> Any:
    """
    Update a feature category translation.
    """
    translation = session.exec(
        select(FeatureCategoryTranslation).where(
            FeatureCategoryTranslation.id == translation_id,
            FeatureCategoryTranslation.tenant_id == tenant_code
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


@router.delete("/feature-categories/{translation_id}")
def delete_feature_category_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_code: str = get_tenant_from_header(),
    translation_id: int,
) -> Any:
    """
    Delete a feature category translation.
    """
    translation = session.exec(
        select(FeatureCategoryTranslation).where(
            FeatureCategoryTranslation.id == translation_id,
            FeatureCategoryTranslation.tenant_id == tenant_code
        )
    ).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Feature category translation not found")
    
    session.delete(translation)
    session.commit()
    return {"message": "Feature category translation deleted successfully"}