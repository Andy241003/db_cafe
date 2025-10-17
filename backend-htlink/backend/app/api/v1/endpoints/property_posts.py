from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from app.api.deps import get_current_user, SessionDep
from app.models import AdminUser
from app.models.activity_log import ActivityType
from app.utils.activity_logger import log_activity
from app.models.property_posts import (
    PropertyPost,
    PropertyPostCreate,
    PropertyPostUpdate,
    PropertyPostRead,
    PropertyPostTranslationRead,
    PropertyPostTranslation,
    PropertyPostTranslationCreate,
)
from app.crud import property_posts as crud_property_posts

router = APIRouter()


@router.post("/", response_model=PropertyPostRead)
def create_property_post(
    *,
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    post_in: PropertyPostCreate,
) -> PropertyPost:
    """
    Create a new property post with translations.
    """
    # Check if user has access to this property (tenant isolation)
    # This would require additional logic to verify property belongs to user's tenant
    
    post = crud_property_posts.create_property_post(session, post_in)
    
    # Log activity
    log_activity(
        db=session,
        tenant_id=current_user.tenant_id,
        activity_type=ActivityType.CREATE_POST,
        details={
            "message": f"Post '{post.slug}' created by {current_user.email}",
            "user_id": current_user.id,
            "username": current_user.email,
            "post_id": post.id,
            "post_slug": post.slug
        }
    )
    
    return post


@router.get("/", response_model=List[PropertyPostRead])
def read_property_posts(
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    property_id: Optional[int] = Query(None, description="Filter by property ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0, description="Number of posts to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of posts to return"),
) -> List[PropertyPost]:
    """
    Retrieve property posts with optional filters.
    """
    posts = crud_property_posts.get_property_posts(
        session=session,
        property_id=property_id,
        status=status,
        skip=skip,
        limit=limit
    )
    return posts


@router.get("/by-locale", response_model=List[dict])
def read_property_posts_by_locale(
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    property_id: int = Query(..., description="Property ID"),
    locale: str = Query("en", description="Locale code"),
    status: str = Query("published", description="Post status"),
    skip: int = Query(0, ge=0, description="Number of posts to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of posts to return"),
) -> List[dict]:
    """
    Retrieve property posts with translations for a specific locale.
    """
    posts = crud_property_posts.get_property_posts_by_locale(
        session=session,
        property_id=property_id,
        locale=locale,
        status=status,
        skip=skip,
        limit=limit
    )
    return posts


@router.get("/{post_id}", response_model=PropertyPostRead)
def read_property_post(
    *,
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    post_id: int,
) -> PropertyPost:
    """
    Get a specific property post by ID.
    """
    post = crud_property_posts.get_property_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Property post not found")
    return post


@router.put("/{post_id}", response_model=PropertyPostRead)
def update_property_post(
    *,
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    post_id: int,
    post_in: PropertyPostUpdate,
) -> PropertyPost:
    """
    Update a property post.
    """
    post = crud_property_posts.update_property_post(session, post_id, post_in)
    if not post:
        raise HTTPException(status_code=404, detail="Property post not found")
    
    # Log activity
    log_activity(
        db=session,
        tenant_id=current_user.tenant_id,
        activity_type=ActivityType.UPDATE_POST,
        details={
            "message": f"Post '{post.slug}' updated by {current_user.email}",
            "user_id": current_user.id,
            "username": current_user.email,
            "post_id": post.id,
            "post_slug": post.slug
        }
    )
    
    return post


@router.delete("/{post_id}")
def delete_property_post(
    *,
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    post_id: int,
) -> dict:
    """
    Delete a property post.
    """
    # Get post info before deletion for logging
    post = crud_property_posts.get_property_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Property post not found")
    
    post_slug = post.slug
    success = crud_property_posts.delete_property_post(session, post_id)
    
    if success:
        # Log activity
        log_activity(
            db=session,
            tenant_id=current_user.tenant_id,
            activity_type=ActivityType.DELETE_POST,
            details={
                "message": f"Post '{post_slug}' deleted by {current_user.email}",
                "user_id": current_user.id,
                "username": current_user.email,
                "post_id": post_id,
                "post_slug": post_slug
            }
        )
    
    return {"message": "Property post deleted successfully"}


@router.get("/{post_id}/translations", response_model=List[PropertyPostTranslationRead])
def read_property_post_translations(
    *,
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    post_id: int,
) -> List[PropertyPostTranslationRead]:
    """
    Get all translations for a specific property post.
    """
    post = crud_property_posts.get_property_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Property post not found")
    return post.translations


@router.post("/{post_id}/translations", response_model=PropertyPostTranslationRead)
def create_property_post_translation(
    *,
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    post_id: int,
    translation_in: PropertyPostTranslationCreate,
) -> PropertyPostTranslation:
    """
    Create a translation for an existing property post.
    """
    # Verify post exists
    post = crud_property_posts.get_property_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Property post not found")

    # DEBUG log incoming translation
    print(f"[PROPERTY_POSTS] Create translation request for post_id={post_id} locale={translation_in.locale} content_len={len(translation_in.content or '')}", flush=True)

    # Ensure translation for locale doesn't already exist
    existing = session.get(PropertyPostTranslation, (post_id, translation_in.locale))
    if existing:
        raise HTTPException(status_code=400, detail="Translation for this locale already exists")

    db_translation = PropertyPostTranslation(
        post_id=post_id,
        locale=translation_in.locale,
        content=translation_in.content,
    )
    session.add(db_translation)
    session.commit()
    session.refresh(db_translation)

    print(f"[PROPERTY_POSTS] Translation created id=(post_id={db_translation.post_id}, locale={db_translation.locale})", flush=True)
    
    # Log activity
    log_activity(
        db=session,
        tenant_id=current_user.tenant_id,
        activity_type=ActivityType.TRANSLATE_POST,
        details={
            "message": f"Post translation ({translation_in.locale}) created by {current_user.email}",
            "user_id": current_user.id,
            "username": current_user.email,
            "post_id": post_id,
            "locale": translation_in.locale
        }
    )
    
    return db_translation


@router.get("/property/{property_id}/published", response_model=List[dict])
def read_published_posts_for_property(
    *,
    session: SessionDep,
    property_id: int,
    locale: str = Query("en", description="Locale code"),
    skip: int = Query(0, ge=0, description="Number of posts to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of posts to return"),
) -> List[dict]:
    """
    Public endpoint to get published posts for a property (no authentication required).
    This would be used by the frontend to display blog posts.
    """
    posts = crud_property_posts.get_property_posts_by_locale(
        session=session,
        property_id=property_id,
        locale=locale,
        status="published",
        skip=skip,
        limit=limit
    )
    return posts