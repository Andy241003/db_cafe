"""
VR Hotel Policies API endpoints

Handles VR Hotel Policies page content management
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from pydantic import BaseModel
from datetime import datetime

from app.core.db import get_db
from app.api.deps import CurrentUser, SessionDep
from app.models import UserRole
from app.models.vr_hotel import VRHotelPolicies

router = APIRouter()


# ==========================================
# Pydantic Schemas for Request/Response
# ==========================================

class PoliciesContent(BaseModel):
    """Single language Policies content"""
    title: str
    shortDescription: str
    detailedContent: str


class PoliciesResponse(BaseModel):
    """VR Hotel Policies Response"""
    isDisplaying: bool = True
    content: Dict[str, PoliciesContent]  # {locale: content}
    vr360Link: Optional[str] = None
    vrTitle: Optional[str] = None


class PoliciesUpdate(BaseModel):
    """VR Hotel Policies Update"""
    isDisplaying: Optional[bool] = None
    content: Optional[Dict[str, Dict[str, str]]] = None  # {locale: {title, shortDescription, detailedContent}}
    vr360Link: Optional[str] = None
    vrTitle: Optional[str] = None


# ==========================================
# Helper Functions
# ==========================================

def get_tenant_and_property(
    x_tenant_code: Optional[str],
    x_property_id: Optional[int],
    current_user: CurrentUser
) -> tuple[int, int]:
    """Extract tenant_id and property_id from headers or user context"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    tenant_id = current_user.tenant_id
    
    if not x_property_id:
        raise HTTPException(
            status_code=400, 
            detail="X-Property-Id header is required for VR Hotel operations"
        )
    
    return tenant_id, x_property_id


def check_vr_hotel_access(current_user: CurrentUser):
    """Check if user has access to VR Hotel service"""
    if current_user.service_access not in [1, 2]:  # 1 = VR Hotel only, 2 = Both services
        raise HTTPException(
            status_code=403, 
            detail="No access to VR Hotel service. Please contact administrator."
        )


# ==========================================
# API Endpoints
# ==========================================

@router.get("/policies", response_model=PoliciesResponse)
def get_vr_hotel_Policies(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    x_tenant_code: Optional[str] = Header(None),
    x_property_id: Optional[int] = Header(None)
):
    """
    Get VR Hotel Policies content for a property
    
    Requires headers:
    - X-Tenant-Code: Tenant code
    - X-Property-Id: Property ID
    
    Returns:
    - isDisplaying: Display toggle status
    - content: Multi-language content object
    - vr360Link: VR360 tour link
    - vrTitle: VR360 section title
    """
    tenant_id, property_id = get_tenant_and_property(x_tenant_code, x_property_id, current_user)
    
    # Check user has access to VR Hotel
    check_vr_hotel_access(current_user)
    
    # Query Policies data
    statement = select(VRHotelPolicies).where(
        VRHotelPolicies.tenant_id == tenant_id,
        VRHotelPolicies.property_id == property_id
    )
    Policies = db.exec(statement).first()
    
    # If no data exists, return default structure
    if not Policies:
        return PoliciesResponse(
            isDisplaying=True,
            content={},
            vr360Link=None,
            vrTitle=None
        )
    
    # Return existing data
    return PoliciesResponse(
        isDisplaying=Policies.is_displaying,
        content=Policies.content_json or {},
        vr360Link=Policies.vr360_link,
        vrTitle=Policies.vr_title
    )


@router.put("/policies", response_model=PoliciesResponse)
def update_vr_hotel_Policies(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    data: PoliciesUpdate,
    x_tenant_code: Optional[str] = Header(None),
    x_property_id: Optional[int] = Header(None)
):
    """
    Update VR Hotel Policies content for a property
    
    Requires headers:
    - X-Tenant-Code: Tenant code
    - X-Property-Id: Property ID
    
    Body:
    - isDisplaying: Display toggle (optional)
    - content: Multi-language content object (optional)
    - vr360Link: VR360 tour link (optional)
    - vrTitle: VR360 section title (optional)
    """
    tenant_id, property_id = get_tenant_and_property(x_tenant_code, x_property_id, current_user)
    
    # Check user has access to VR Hotel
    check_vr_hotel_access(current_user)
    
    # Query existing Policies data
    statement = select(VRHotelPolicies).where(
        VRHotelPolicies.tenant_id == tenant_id,
        VRHotelPolicies.property_id == property_id
    )
    Policies = db.exec(statement).first()
    
    # Create new record if doesn't exist
    if not Policies:
        Policies = VRHotelPolicies(
            tenant_id=tenant_id,
            property_id=property_id,
            is_displaying=True,
            content_json={}
        )
        db.add(Policies)
    
    # Update fields if provided
    if data.isDisplaying is not None:
        Policies.is_displaying = data.isDisplaying
    
    if data.content is not None:
        Policies.content_json = data.content
    
    if data.vr360Link is not None:
        Policies.vr360_link = data.vr360Link
    
    if data.vrTitle is not None:
        Policies.vr_title = data.vrTitle
    
    # Update timestamp
    Policies.updated_at = datetime.utcnow()
    
    # Commit changes
    db.commit()
    db.refresh(Policies)
    
    # Return updated data
    return PoliciesResponse(
        isDisplaying=Policies.is_displaying,
        content=Policies.content_json or {},
        vr360Link=Policies.vr360_link,
        vrTitle=Policies.vr_title
    )


