from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from app.api.deps import get_current_user, SessionDep
from app.models import AdminUser
from app.models.property_posts import (
    PropertyPost,
    PropertyPostCreate,
    PropertyPostUpdate,
    PropertyPostRead,
    PropertyPostTranslationRead,
    PropertyPostTranslationCreate,
    PropertyPostTranslationUpdate
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
    return post


@router.get("/", response_model=List[dict])
def read_property_posts(
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    property_id: Optional[int] = Query(None, description="Filter by property ID"),
    skip: int = Query(0, ge=0, description="Number of posts to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of posts to return"),
) -> List[dict]:
    """
    Retrieve property posts with list of available locales.
    """
    posts = crud_property_posts.get_property_posts_list(
        session=session,
        property_id=property_id,
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


@router.get("/{post_id}/translations/{locale}", response_model=PropertyPostTranslationRead)
def read_property_post_translation(
    *,
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    post_id: int,
    locale: str,
):
    """
    Get a specific translation for a property post.
    """
    translation = crud_property_posts.get_property_post_translation(session, post_id, locale)
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
@router.get("/{post_id}/translations/{locale}", response_model=PropertyPostTranslationRead)
def read_property_post_translation(
    *,
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    post_id: int,
    locale: str,
):
    """
    Get a specific translation for a property post.
    """
    translation = crud_property_posts.get_property_post_translation(session, post_id, locale)
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    return translation


@router.post("/{post_id}/translations", response_model=PropertyPostTranslationRead)
def create_property_post_translation(
    *,
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    post_id: int,
    translation_in: PropertyPostTranslationCreate,
):
    """
    Create or update a translation for a property post.
    """
    # Check if post exists
    post = crud_property_posts.get_property_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Property post not found")

    # Create or update translation
    translation = crud_property_posts.create_property_post_translation(
        session, post_id, translation_in
    )
    return translation


@router.put("/{post_id}/translations/{locale}", response_model=PropertyPostTranslationRead)
def update_property_post_translation(
    *,
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    post_id: int,
    locale: str,
    translation_in: PropertyPostTranslationUpdate,
):
    """
    Update a translation for a property post.
    """
    translation = crud_property_posts.update_property_post_translation(
        session, post_id, locale, translation_in
    )
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    return translation


@router.delete("/{post_id}/translations/{locale}")
def delete_property_post_translation(
    *,
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    post_id: int,
    locale: str,
):
    """
    Delete a translation for a property post.
    """
    success = crud_property_posts.delete_property_post_translation(session, post_id, locale)
    if not success:
        raise HTTPException(status_code=404, detail="Translation not found")
    return {"message": "Translation deleted successfully"}


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
    success = crud_property_posts.delete_property_post(session, post_id)
    if not success:
        raise HTTPException(status_code=404, detail="Property post not found")
    return {"message": "Property post deleted successfully"}


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