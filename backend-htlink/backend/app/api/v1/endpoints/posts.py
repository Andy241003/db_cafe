from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException

from app import crud
from app.api.deps import SessionDep, TenantUser, get_tenant_from_header
from app.models import Post, PostStatus
from app.schemas import PostCreate, PostResponse, PostUpdate

router = APIRouter()


@router.get("/", response_model=List[PostResponse])
def read_posts(
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: int = Depends(get_tenant_from_header),
    property_id: Optional[int] = None,
    feature_id: Optional[int] = None,
    status: Optional[PostStatus] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve posts for tenant, optionally filtered by property, feature, or status.
    """
    posts = crud.post.get_by_tenant(
        session, 
        tenant_id=tenant_id,
        property_id=property_id,
        feature_id=feature_id,
        status=status,
        skip=skip, 
        limit=limit
    )
    return posts


@router.post("/", response_model=PostResponse)
def create_post(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: int = Depends(get_tenant_from_header),
    post_in: PostCreate,
) -> Any:
    """
    Create new post. Editors and above can create posts.
    """
    if current_user.role not in ["owner", "admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Ensure the post is being created in the correct tenant
    post_in.tenant_id = tenant_id
    post_in.created_by = current_user.id
    
    post = crud.post.create(session, obj_in=post_in)
    return post


@router.get("/{post_id}", response_model=PostResponse)
def read_post(
    post_id: int,
    session: SessionDep,
    current_user: TenantUser,
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


@router.put("/{post_id}", response_model=PostResponse)
def update_post(
    *,
    session: SessionDep,
    current_user: TenantUser,
    post_id: int,
    post_in: PostUpdate,
) -> Any:
    """
    Update post. Editors and above can update posts.
    """
    if current_user.role not in ["owner", "admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    post = crud.post.get(session, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user has access to this post's tenant
    if current_user.tenant_id != post.tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    post = crud.post.update(session, db_obj=post, obj_in=post_in)
    return post


@router.delete("/{post_id}")
def delete_post(
    *,
    session: SessionDep,
    current_user: TenantUser,
    post_id: int,
) -> Any:
    """
    Delete post. Editors and above can delete posts.
    """
    if current_user.role not in ["owner", "admin", "editor"]:
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
def publish_post(
    *,
    session: SessionDep,
    current_user: TenantUser,
    post_id: int,
) -> Any:
    """
    Publish a post. Editors and above can publish posts.
    """
    if current_user.role not in ["owner", "admin", "editor"]:
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
def archive_post(
    *,
    session: SessionDep,
    current_user: TenantUser,
    post_id: int,
) -> Any:
    """
    Archive a post. Editors and above can archive posts.
    """
    if current_user.role not in ["owner", "admin", "editor"]:
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