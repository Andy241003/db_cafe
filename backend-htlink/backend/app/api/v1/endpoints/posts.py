from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException

from app import crud
from app.api.deps import SessionDep, CurrentUser, CurrentTenantId
from app.models import Post, PostStatus
from app.schemas import PostCreate, PostResponse, PostUpdate, PostWithTranslationResponse

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
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    property_id: Optional[int] = None,
    feature_id: Optional[int] = None,
    status: Optional[PostStatus] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve posts for tenant, optionally filtered by property, feature, or status.
    """
    try:
        print(f"🔍 GET /posts - tenant_id: {tenant_id}, property_id: {property_id}, feature_id: {feature_id}")
        
        posts = crud.post.get_by_tenant_with_translations(
            session, 
            tenant_id=tenant_id,
            property_id=property_id,
            feature_id=feature_id,
            status=status,
            skip=skip, 
            limit=limit
        )
        
        print(f"✅ Found {len(posts)} posts")
        return posts
        
    except Exception as e:
        print(f"❌ Error in GET /posts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=PostWithTranslationResponse)
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
    
    # Ensure the post is being created in the correct tenant
    post_in.tenant_id = tenant_id
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
    print(f"✏️  UPDATE POST: user_role={current_user.role.upper()}, user_tenant_id={current_user.tenant_id}")
    
    if current_user.role.upper() not in ["OWNER", "ADMIN", "EDITOR"]:
        print(f"❌ UPDATE POST: Role check failed - {current_user.role.upper()} not in [OWNER, ADMIN, EDITOR]")
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    post = crud.post.get(session, id=post_id)
    if not post:
        print(f"❌ UPDATE POST: Post {post_id} not found")
        raise HTTPException(status_code=404, detail="Post not found")
    
    print(f"✏️  UPDATE POST: post_id={post_id}, post_tenant_id={post.tenant_id}, user_tenant_id={current_user.tenant_id}")
    
    # Check if user has access to this post's tenant
    if current_user.tenant_id != post.tenant_id:
        print(f"❌ UPDATE POST: Tenant mismatch - user_tenant_id={current_user.tenant_id} != post_tenant_id={post.tenant_id}")
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    post = crud.post.update(session, db_obj=post, obj_in=post_in)
    
    # Return post with translation data
    post_with_translation = crud.post.get_with_translation(session, post_id=post.id)
    return post_with_translation or post


@router.delete("/{post_id}")
def delete_post(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    post_id: int,
) -> Any:
    """
    Delete post. Editors and above can delete posts.
    """
    print(f"🗑️  DELETE POST: user_role={current_user.role.upper()}, user_tenant_id={current_user.tenant_id}")
    
    if current_user.role.upper() not in ["OWNER", "ADMIN", "EDITOR"]:
        print(f"❌ DELETE POST: Role check failed - {current_user.role.upper()} not in [OWNER, ADMIN, EDITOR]")
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    post = crud.post.get(session, id=post_id)
    if not post:
        print(f"❌ DELETE POST: Post {post_id} not found")
        raise HTTPException(status_code=404, detail="Post not found")
    
    print(f"🗑️  DELETE POST: post_id={post_id}, post_tenant_id={post.tenant_id}, user_tenant_id={current_user.tenant_id}")
    
    # Check if user has access to this post's tenant
    if current_user.tenant_id != post.tenant_id:
        print(f"❌ DELETE POST: Tenant mismatch - user_tenant_id={current_user.tenant_id} != post_tenant_id={post.tenant_id}")
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crud.post.remove(session, id=post_id)
    return {"detail": "Post deleted"}


@router.post("/{post_id}/publish", response_model=PostResponse)
def publish_post(
    *,
    session: SessionDep,
    current_user: CurrentUser,
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
    current_user: CurrentUser,
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