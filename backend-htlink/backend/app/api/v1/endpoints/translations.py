from typing import Any

from fastapi import APIRouter, HTTPException, Body
from sqlmodel import select
from pydantic import BaseModel

from app import crud
from app.api.deps import CurrentUser, SessionDep, CurrentTenantId
from app.models import FeatureTranslation, FeatureTranslationCreate, FeatureTranslationUpdate
from app.models import PostTranslation, PostTranslationCreate, PostTranslationUpdate
from app.models import FeatureCategoryTranslation, FeatureCategoryTranslationCreate, FeatureCategoryTranslationUpdate
from app.models import PropertyTranslation
from app.schemas import PropertyTranslationCreate, PropertyTranslationUpdate, PropertyTranslationResponse
from app.models.activity_log import ActivityType
from app.utils.decorators.track_activity import track_activity

router = APIRouter()


# Request model for translation endpoint
class TranslateRequest(BaseModel):
    texts: list[str]
    target: str = 'en'
    source: str = 'auto'
    is_html: bool = False
    concurrent: int = 8
    prefer_deepl: bool = True
    apply_glossary: bool = True


@router.post('/translate')
async def translate_batch_endpoint(request: TranslateRequest = Body(...)):
    """
    Enhanced translation endpoint with DeepL/Google Cloud support.
    
    Features:
    - DeepL API for best quality (if DEEPL_API_KEY is set)
    - Google Cloud Translation (if GOOGLE_CLOUD_API_KEY is set)
    - Falls back to free Google Translate
    - Smart chunking for long texts
    - Hotel industry glossary (25+ terms)
    
    This endpoint is public and does not require authentication.
    """
    # Basic input validation
    if not isinstance(request.texts, list) or not all(isinstance(t, str) for t in request.texts):
        raise HTTPException(status_code=400, detail='`texts` must be a list of strings')

    try:
        # Try enhanced translation first
        from app.services.enhanced_translation import translate_batch_enhanced
        
        print(f"[TRANSLATE] 🚀 Enhanced: {len(request.texts)} texts → {request.target} (html={request.is_html}, glossary={request.apply_glossary})", flush=True)
        
        results = await translate_batch_enhanced(
            texts=request.texts,
            target=request.target,
            source=request.source,
            is_html=request.is_html,
            concurrent=request.concurrent,
            prefer_deepl=request.prefer_deepl,
            apply_glossary=request.apply_glossary
        )
        
        print(f"[TRANSLATE] ✅ Complete: {len(results)} results", flush=True)
        return results
        
    except ImportError:
        # Fallback to old service
        print("[TRANSLATE] ⚠️ Enhanced unavailable, using fallback", flush=True)
        from app.services.universal_translation import translate_batch
        
        results = await translate_batch(
            request.texts, 
            target=request.target, 
            source=request.source, 
            is_html=request.is_html, 
            concurrent=request.concurrent
        )
        return results
        
    except Exception as e:
        print(f"[TRANSLATE] ❌ Error: {e}", flush=True)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


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
@track_activity(ActivityType.CREATE_TRANSLATION, message_template="Feature translation created by {current_user.email}")
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


@router.get("/features/{feature_id}/{locale}", response_model=FeatureTranslation)
def get_feature_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    feature_id: int,
    locale: str,
) -> Any:
    """
    Get a feature translation by feature ID and locale.
    """
    # Verify feature belongs to current tenant or is a system feature
    from app.models import Feature
    feature = session.exec(select(Feature).where(
        Feature.id == feature_id
    )).first()
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")

    # Check if feature belongs to tenant or is system-wide
    if feature.tenant_id != tenant_id and feature.tenant_id != 0:
        raise HTTPException(status_code=403, detail="Access denied")

    translation = session.exec(
        select(FeatureTranslation).where(
            FeatureTranslation.feature_id == feature_id,
            FeatureTranslation.locale == locale
        )
    ).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Feature translation not found")

    return translation


@router.put("/features/{feature_id}/{locale}", response_model=FeatureTranslation)
@track_activity(ActivityType.UPDATE_TRANSLATION, message_template="Feature translation updated by {current_user.email}")
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
@track_activity(ActivityType.DELETE_TRANSLATION, message_template="Feature translation deleted by {current_user.email}")
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
    try:
        from app.models import Post
        statement = select(PostTranslation).join(Post).where(
            Post.tenant_id == tenant_id
        ).offset(skip).limit(limit)
        translations = session.exec(statement).all()
        return translations
    except Exception as e:
        # Handle any errors gracefully
        print(f"⚠️  PostTranslation error: {str(e)}", flush=True)
        return []


@router.post("/posts", response_model=PostTranslation)
@track_activity(ActivityType.CREATE_TRANSLATION, message_template="Post translation created by {current_user.email}")
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
    try:
        print(f"🔥 CREATE POST TRANSLATION called", flush=True)
        print(f"   User: {current_user.email}", flush=True)
        print(f"   Tenant ID: {tenant_id}", flush=True)
        print(f"   Translation data: {translation_in.model_dump()}", flush=True)

        # Verify post belongs to current tenant
        from app.models import Post
        post = session.exec(select(Post).where(
            Post.id == translation_in.post_id,
            Post.tenant_id == tenant_id
        )).first()

        if not post:
            print(f"❌ Post {translation_in.post_id} not found for tenant {tenant_id}", flush=True)
            raise HTTPException(status_code=404, detail=f"Post {translation_in.post_id} not found or does not belong to your tenant")

        print(f"✅ Post found: {post.id}, tenant: {post.tenant_id}", flush=True)

        # Check if translation already exists
        existing = session.exec(select(PostTranslation).where(
            PostTranslation.post_id == translation_in.post_id,
            PostTranslation.locale == translation_in.locale
        )).first()

        if existing:
            print(f"⚠️  Translation already exists for post {translation_in.post_id}, locale {translation_in.locale}", flush=True)
            raise HTTPException(status_code=400, detail=f"Translation for locale '{translation_in.locale}' already exists. Use PUT to update.")

        translation = PostTranslation.model_validate(translation_in)
        session.add(translation)
        session.commit()
        session.refresh(translation)

        print(f"✅ Translation created successfully", flush=True)
        return translation
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating post translation: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/posts/{post_id}/{locale}", response_model=PostTranslation)
@track_activity(ActivityType.UPDATE_TRANSLATION, message_template="Post translation updated by {current_user.email}")
def update_post_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    post_id: int,
    locale: str,
    translation_in: PostTranslationUpdate,
) -> Any:
    """
    Update a post translation.
    """
    # Verify post belongs to current tenant
    from app.models import Post
    post = session.exec(select(Post).where(
        Post.id == post_id,
        Post.tenant_id == tenant_id
    )).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    translation = session.exec(
        select(PostTranslation).where(
            PostTranslation.post_id == post_id,
            PostTranslation.locale == locale
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


@router.delete("/posts/{post_id}/{locale}")
@track_activity(ActivityType.DELETE_TRANSLATION, message_template="Post translation deleted by {current_user.email}")
def delete_post_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    post_id: int,
    locale: str,
) -> Any:
    """
    Delete a post translation.
    """
    # Verify post belongs to current tenant
    from app.models import Post
    post = session.exec(select(Post).where(
        Post.id == post_id,
        Post.tenant_id == tenant_id
    )).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    translation = session.exec(
        select(PostTranslation).where(
            PostTranslation.post_id == post_id,
            PostTranslation.locale == locale
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
@track_activity(ActivityType.CREATE_TRANSLATION, message_template="Feature category translation created by {current_user.email}")
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
    print(f"🔥 CREATE FEATURE CATEGORY TRANSLATION called", flush=True)
    print(f"   Tenant ID: {tenant_id}", flush=True)
    print(f"   Translation data: {translation_in.model_dump()}", flush=True)

    # Verify category belongs to current tenant OR is a system category (tenant_id=0)
    from app.models import FeatureCategory
    from sqlmodel import or_
    category = session.exec(select(FeatureCategory).where(
        FeatureCategory.id == translation_in.category_id,
        or_(
            FeatureCategory.tenant_id == tenant_id,
            FeatureCategory.tenant_id == 0  # Allow system categories
        )
    )).first()

    print(f"   Category found: {category}", flush=True)
    if category:
        print(f"   Category details: id={category.id}, slug={category.slug}, tenant_id={category.tenant_id}", flush=True)

    if not category:
        print(f"❌ Category not found for id={translation_in.category_id}, tenant_id={tenant_id}", flush=True)
        raise HTTPException(status_code=404, detail="Feature category not found")

    try:
        translation = FeatureCategoryTranslation.model_validate(translation_in)
        print(f"✅ Translation validated: {translation}", flush=True)
        session.add(translation)
        session.commit()
        session.refresh(translation)
        print(f"✅ Translation created successfully", flush=True)
        return translation
    except Exception as e:
        print(f"❌ Error creating translation: {e}", flush=True)
        import traceback
        traceback.print_exc()
        raise


@router.put("/feature-categories/{category_id}/{locale}", response_model=FeatureCategoryTranslation)
@track_activity(ActivityType.UPDATE_TRANSLATION, message_template="Feature category translation updated by {current_user.email}")
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
    # Verify category belongs to current tenant OR is a system category (tenant_id=0)
    from app.models import FeatureCategory
    from sqlmodel import or_
    category = session.exec(select(FeatureCategory).where(
        FeatureCategory.id == category_id,
        or_(
            FeatureCategory.tenant_id == tenant_id,
            FeatureCategory.tenant_id == 0  # Allow system categories
        )
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
@track_activity(ActivityType.DELETE_TRANSLATION, message_template="Feature category translation deleted by {current_user.email}")
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


# Property Translations
@router.get("/properties", response_model=list[PropertyTranslationResponse])
def read_property_translations(
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve property translations for properties belonging to current tenant.
    """
    from app.models import Property
    statement = select(PropertyTranslation).join(Property).where(
        Property.tenant_id == tenant_id
    ).offset(skip).limit(limit)
    translations = session.exec(statement).all()
    return translations


@router.post("/properties", response_model=PropertyTranslationResponse)
@track_activity(ActivityType.CREATE_TRANSLATION, message_template="Property translation created by {current_user.email}")
def create_property_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    translation_in: PropertyTranslationCreate,
) -> Any:
    """
    Create new property translation.
    """
    # Verify property belongs to current tenant
    from app.models import Property
    property = session.exec(select(Property).where(
        Property.id == translation_in.property_id,
        Property.tenant_id == tenant_id
    )).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    translation = crud.property_translation.create_translation(
        session, property_id=translation_in.property_id, obj_in=translation_in
    )
    return translation


@router.get("/properties/{property_id}/{locale}", response_model=PropertyTranslationResponse)
def get_property_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    property_id: int,
    locale: str,
) -> Any:
    """
    Get a property translation by property ID and locale.
    """
    # Verify property belongs to current tenant
    from app.models import Property
    property = session.exec(select(Property).where(
        Property.id == property_id,
        Property.tenant_id == tenant_id
    )).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    translation = crud.property_translation.get_by_property_and_locale(
        session, property_id=property_id, locale=locale
    )
    if not translation:
        raise HTTPException(status_code=404, detail="Property translation not found")

    return translation


@router.put("/properties/{property_id}/{locale}", response_model=PropertyTranslationResponse)
@track_activity(ActivityType.UPDATE_TRANSLATION, message_template="Property translation updated by {current_user.email}")
def update_property_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    property_id: int,
    locale: str,
    translation_in: PropertyTranslationUpdate,
) -> Any:
    """
    Update a property translation.
    """
    # Verify property belongs to current tenant
    from app.models import Property
    property = session.exec(select(Property).where(
        Property.id == property_id,
        Property.tenant_id == tenant_id
    )).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    translation = crud.property_translation.update_translation(
        session, property_id=property_id, locale=locale, obj_in=translation_in
    )
    return translation


@router.delete("/properties/{property_id}/{locale}")
@track_activity(ActivityType.DELETE_TRANSLATION, message_template="Property translation deleted by {current_user.email}")
def delete_property_translation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    property_id: int,
    locale: str,
) -> Any:
    """
    Delete a property translation.
    """
    # Verify property belongs to current tenant
    from app.models import Property
    property = session.exec(select(Property).where(
        Property.id == property_id,
        Property.tenant_id == tenant_id
    )).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    crud.property_translation.delete_translation(
        session, property_id=property_id, locale=locale
    )
    return {"message": "Property translation deleted successfully"}
