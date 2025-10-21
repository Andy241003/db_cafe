from typing import List, Optional
import re
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


def _extract_title_from_content(html_content: str) -> tuple[str, str]:
    """Extract title from <h2> tag at the beginning of content"""
    if not html_content:
        return '', ''
    
    # Match <h2>Title</h2> at the start (with optional whitespace)
    match = re.match(r'^\s*<h2>(.*?)</h2>\s*', html_content, re.IGNORECASE | re.DOTALL)
    if match:
        title = match.group(1).strip()
        # Keep full content including h2 for backward compatibility
        return title, html_content
    
    return '', html_content


@router.post("/", response_model=PropertyPostRead)
def create_property_post(
    *,
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    post_in: PropertyPostCreate,
) -> PropertyPost:
    """
    Create a new property post. OWNER, ADMIN, and EDITOR can create posts.
    """
    # Check permissions - OWNER, ADMIN, EDITOR can create
    if current_user.role.upper() not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if user has access to this property (tenant isolation)
    # This would require additional logic to verify property belongs to user's tenant
    
    post = crud_property_posts.create_property_post(session, post_in)
    
    # Log activity
    log_activity(
        db=session,
        tenant_id=current_user.tenant_id,
        activity_type=ActivityType.CREATE_POST,
        details={
            "message": f"Property post #{post.id} created by {current_user.email}",
            "user_id": current_user.id,
            "username": current_user.email,
            "post_id": post.id,
            "property_id": post.property_id
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
) -> List[dict]:
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
    
    # Convert to dict and add extracted title for each translation
    result = []
    for post in posts:
        post_dict = {
            "id": post.id,
            "property_id": post.property_id,
            "status": post.status,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "translations": []
        }
        
        for translation in post.translations:
            title, content = _extract_title_from_content(translation.content or '')
            trans_dict = {
                "post_id": translation.post_id,
                "locale": translation.locale,
                "content": translation.content,
                "title": title,
                "created_at": translation.created_at,
                "updated_at": translation.updated_at
            }
            post_dict["translations"].append(trans_dict)
        
        result.append(post_dict)
    
    return result


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
) -> dict:
    """
    Get a specific property post by ID.
    """
    post = crud_property_posts.get_property_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Property post not found")
    
    # Convert to dict and add extracted title for each translation
    post_dict = {
        "id": post.id,
        "property_id": post.property_id,
        "status": post.status,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
        "translations": []
    }
    
    for translation in post.translations:
        title, content = _extract_title_from_content(translation.content or '')
        trans_dict = {
            "post_id": translation.post_id,
            "locale": translation.locale,
            "content": translation.content,
            "title": title,
            "created_at": translation.created_at,
            "updated_at": translation.updated_at
        }
        post_dict["translations"].append(trans_dict)
    
    return post_dict


@router.put("/{post_id}", response_model=PropertyPostRead)
def update_property_post(
    *,
    session: SessionDep,
    current_user: AdminUser = Depends(get_current_user),
    post_id: int,
    post_in: PropertyPostUpdate,
) -> PropertyPost:
    """
    Update a property post. OWNER, ADMIN, and EDITOR can update posts.
    """
    # Check permissions - OWNER, ADMIN, EDITOR can update
    if current_user.role.upper() not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    post = crud_property_posts.update_property_post(session, post_id, post_in)
    if not post:
        raise HTTPException(status_code=404, detail="Property post not found")
    
    # Log activity
    log_activity(
        db=session,
        tenant_id=current_user.tenant_id,
        activity_type=ActivityType.UPDATE_POST,
        details={
            "message": f"Property post #{post.id} updated by {current_user.email}",
            "user_id": current_user.id,
            "username": current_user.email,
            "post_id": post.id,
            "property_id": post.property_id
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
    Delete a property post. OWNER, ADMIN, and EDITOR can delete posts.
    """
    # Check permissions - OWNER, ADMIN, EDITOR can delete
    if current_user.role.upper() not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get post info before deletion for logging
    post = crud_property_posts.get_property_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Property post not found")
    
    property_id = post.property_id
    success = crud_property_posts.delete_property_post(session, post_id)
    
    if success:
        # Log activity
        log_activity(
            db=session,
            tenant_id=current_user.tenant_id,
            activity_type=ActivityType.DELETE_POST,
            details={
                "message": f"Property post #{post_id} deleted by {current_user.email}",
                "user_id": current_user.id,
                "username": current_user.email,
                "post_id": post_id,
                "property_id": property_id
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
    Create a translation for an existing property post. OWNER, ADMIN, and EDITOR can create translations.
    """
    # Check permissions - OWNER, ADMIN, EDITOR can create translations
    if current_user.role.upper() not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Verify post exists
    post = crud_property_posts.get_property_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Property post not found")

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