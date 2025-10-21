from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from app import crud
from app.api.deps import SessionDep, CurrentUser, CurrentTenantId
from app.models import Post, PostStatus, UserRole
from app.models.activity_log import ActivityType
from app.utils.decorators.track_activity import track_activity
from app.schemas import PostCreate, PostResponse, PostUpdate, PostWithTranslationResponse
from app.core.permissions_utils import is_admin_or_owner, can_edit_content

router = APIRouter()


@router.post("/test", response_model=dict)
def create_post_test(
    session: SessionDep,
    title: str,
    content: str,
    property_id: int = 1,
) -> Any:
    """
    Create test post - no auth required
    """
    # Simple test response
    return {
        "success": True,
        "message": f"Test post '{title}' created for property {property_id}",
        "data": {
            "title": title,
            "content": content,
            "property_id": property_id
        }
    }

@router.get("/", response_model=List[PostWithTranslationResponse])
def read_posts(
    request: Request,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    property_id: Optional[int] = None,
    feature_id: Optional[int] = None,
    status: Optional[PostStatus] = None,
    skip: int = 0,
    limit: int = 100,
    include_translations: bool = False,
) -> Any:
    """
    Retrieve posts for tenant, optionally filtered by property, feature, or status.
    """
    try:
        # Debug: show incoming query params and the parsed include_translations flag
        try:
            raw_qs = dict(request.query_params)
        except Exception:
            raw_qs = str(request.query_params)
        # Use flush=True so the container logs show these immediately
        print(f"[POSTS-DEBUG] GET /posts - tenant_id: {tenant_id}, property_id: {property_id}, feature_id: {feature_id}", flush=True)
        print(f"[POSTS-DEBUG] Raw query params: {raw_qs}", flush=True)

        # If the query param is present at all, treat it as a request for all translations.
        # This is robust to different client encodings (include_translations=1, include_translations=true, or presence without value).
        parsed_include = ('include_translations' in request.query_params) or bool(include_translations)
        # Extra debug: show raw QueryParams repr and the explicit get() result
        try:
            qp_repr = repr(request.query_params)
        except Exception:
            qp_repr = str(request.query_params)
        print(f"[POSTS-DEBUG] Parsed include_translations (robust-presence): {parsed_include} (raw_qs keys={list(raw_qs.keys()) if isinstance(raw_qs, dict) else raw_qs})", flush=True)
        print(f"[POSTS-DEBUG] QueryParams repr: {qp_repr}", flush=True)
        print(f"[POSTS-DEBUG] request.query_params.get('include_translations') => {request.query_params.get('include_translations')}", flush=True)

        if parsed_include:
            posts = crud.post.get_by_tenant_with_all_translations(
                session,
                tenant_id=tenant_id,
                property_id=property_id,
                feature_id=feature_id,
                status=status,
                skip=skip,
                limit=limit,
            )
            print(f"[POSTS-DEBUG] Branch: ALL_TRANSLATIONS selected", flush=True)
        else:
            posts = crud.post.get_by_tenant_with_translations(
                session, 
                tenant_id=tenant_id,
                property_id=property_id,
                feature_id=feature_id,
                status=status,
                skip=skip, 
                limit=limit
            )
            print(f"[POSTS-DEBUG] Branch: SINGLE_LOCALE selected", flush=True)

        return posts
        
    except Exception as e:
        print(f"❌ Error in GET /posts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=PostWithTranslationResponse)
@router.post("", response_model=PostWithTranslationResponse)
@track_activity(ActivityType.CREATE_POST, message_template="Post '{post_in.title}' created by {current_user.email}")
def create_post(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    post_in: PostCreate,
) -> Any:
    """
    Create new post. Editors and above can create posts.
    """
    if current_user.role.upper() not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Ensure the post is being created in the user's tenant
    post_in.tenant_id = current_user.tenant_id
    post_in.created_by = current_user.id
    
    post = crud.post.create(session, obj_in=post_in)
    
    # Return post with translation data
    post_with_translation = crud.post.get_with_translation(session, post_id=post.id)
    return post_with_translation or post


@router.get("/{post_id}", response_model=PostResponse)
def read_post(
    post_id: int,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get post by ID.
    """
    post = crud.post.get(session, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user has access to this post's tenant
    if current_user.tenant_id != post.tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return post


@router.put("/{post_id}", response_model=PostWithTranslationResponse)
@track_activity(ActivityType.UPDATE_POST, message_template="Post updated by {current_user.email}")
def update_post(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    post_id: int,
    post_in: PostUpdate,
) -> Any:
    """
    Update post. Editors and above can update posts.
    """
    if current_user.role.upper() not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    post = crud.post.get(session, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user has access to this post's tenant
    if current_user.tenant_id != post.tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    post = crud.post.update(session, db_obj=post, obj_in=post_in)
    
    # Return post with translation data
    post_with_translation = crud.post.get_with_translation(session, post_id=post.id)
    return post_with_translation or post


@router.delete("/{post_id}")
@track_activity(ActivityType.DELETE_POST, message_template="Post deleted by {current_user.email}")
def delete_post(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    post_id: int,
) -> Any:
    """
    Delete post. OWNER, ADMIN, and EDITOR can delete posts.
    """
    # Check permissions - OWNER, ADMIN, EDITOR can delete
    if not can_edit_content(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    post = crud.post.get(session, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user has access to this post's tenant
    if current_user.tenant_id != post.tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crud.post.remove(session, id=post_id)
    return {"detail": "Post deleted"}


@router.post("/{post_id}/publish", response_model=PostResponse)
@track_activity(ActivityType.PUBLISH_POST, message_template="Post published by {current_user.email}")
def publish_post(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    post_id: int,
) -> Any:
    """
    Publish a post. Editors and above can publish posts.
    """
    user_role = current_user.role.upper() if current_user.role else ""
    if user_role not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    post = crud.post.get(session, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user has access to this post's tenant
    if current_user.tenant_id != post.tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    post.status = PostStatus.PUBLISHED
    session.add(post)
    session.commit()
    session.refresh(post)
    
    return post


@router.post("/{post_id}/archive", response_model=PostResponse)
@track_activity(ActivityType.ARCHIVE_POST, message_template="Post archived by {current_user.email}")
def archive_post(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    post_id: int,
) -> Any:
    """
    Archive a post. Editors and above can archive posts.
    """
    user_role = current_user.role.upper() if current_user.role else ""
    if user_role not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    post = crud.post.get(session, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user has access to this post's tenant
    if current_user.tenant_id != post.tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    post.status = PostStatus.ARCHIVED
    session.add(post)
    session.commit()
    session.refresh(post)
    
    return post