from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app import crud
from app.api.deps import SessionDep, TenantUser, CurrentTenantId
from app.schemas.content import PostCreate
from app.models import PostStatus

router = APIRouter()

@router.post("/create-intro-post/{property_id}")
def create_intro_post_for_property(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: CurrentTenantId,
    property_id: int,
) -> Any:
    """
    Manually create introduction post for a property.
    """
    # Get the property
    property = crud.property.get(session, id=property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if property.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Property not in this tenant")
    
    try:
        intro_post = PostCreate(
            tenant_id=tenant_id,
            property_id=property.id,
            feature_id=7,  # Using concierge as general introduction feature
            slug=f"{property.code.lower()}-introduction-manual",
            status=PostStatus.DRAFT,
            pinned=True,
            title=f"Welcome to {property.property_name}",
            content_html=f"<h2>Welcome to {property.property_name}</h2><p>We are delighted to welcome you to our property located at {property.address or 'our beautiful location'}.</p><p>Our team is committed to providing you with an exceptional experience during your stay.</p><h3>Contact Information:</h3><ul><li>Phone: {property.phone_number or 'Contact us for phone number'}</li><li>Email: {property.email or 'Contact us for email'}</li>{'<li>Website: <a href=\"' + str(property.website_url) + '\" target=\"_blank\">' + str(property.website_url) + '</a></li>' if property.website_url else ''}</ul><p>We look forward to serving you!</p>",
            locale="en",
            created_by=current_user.id
        )
        
        created_post = crud.post.create(session, obj_in=intro_post)        
        return {
            "success": True,
            "message": f"Created introduction post for {property.property_name}",
            "post_id": created_post.id,
            "property_id": property.id
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not create post: {str(e)}")