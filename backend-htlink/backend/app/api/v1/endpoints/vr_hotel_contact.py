from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from app.api.deps import SessionDep, CurrentUser
from app.models.vr_hotel import VRHotelContact
from pydantic import BaseModel
from datetime import datetime
import json


router = APIRouter()


# Pydantic Schemas
class ContactResponse(BaseModel):
    isDisplaying: bool = True
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[Dict[str, str]] = None
    socialMedia: Optional[Dict[str, str]] = None
    mapCoordinates: Optional[str] = None
    workingHours: Optional[Dict[str, str]] = None
    vr360Link: Optional[str] = None
    vrTitle: Optional[str] = None
    content: Optional[Dict[str, Any]] = None


class ContactUpdate(BaseModel):
    isDisplaying: Optional[bool] = True
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[Dict[str, str]] = None
    socialMedia: Optional[Dict[str, str]] = None
    mapCoordinates: Optional[str] = None
    workingHours: Optional[Dict[str, str]] = None
    vr360Link: Optional[str] = None
    vrTitle: Optional[str] = None
    content: Optional[Dict[str, Any]] = None


# Permission check helper
def check_vr_hotel_access(current_user: CurrentUser):
    """Check if user has VR Hotel access"""
    if current_user.service_access not in [1, 2]:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to VR Hotel features"
        )


@router.get("/contact", response_model=ContactResponse)
def get_contact(
    session: SessionDep,
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None)
):
    """Get contact information"""
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    contact = session.exec(
        select(VRHotelContact)
        .where(
            VRHotelContact.tenant_id == current_user.tenant_id,
            VRHotelContact.property_id == x_property_id
        )
    ).first()
    
    if not contact:
        # Return default empty values
        return ContactResponse(
            isDisplaying=True,
            phone=None,
            email=None,
            website=None,
            address={},
            socialMedia={},
            mapCoordinates=None,
            workingHours={},
            vr360Link=None,
            vrTitle=None,
            content={}
        )
    
    # Parse JSON fields
    address = {}
    if contact.address_json:
        try:
            address = json.loads(contact.address_json) if isinstance(contact.address_json, str) else contact.address_json
        except:
            address = {}
    
    social_media = {}
    if contact.social_media_json:
        try:
            social_media = json.loads(contact.social_media_json) if isinstance(contact.social_media_json, str) else contact.social_media_json
        except:
            social_media = {}
    
    working_hours = {}
    if contact.working_hours_json:
        try:
            working_hours = json.loads(contact.working_hours_json) if isinstance(contact.working_hours_json, str) else contact.working_hours_json
        except:
            working_hours = {}
    
    content = {}
    if contact.content_json:
        try:
            content = json.loads(contact.content_json) if isinstance(contact.content_json, str) else contact.content_json
        except:
            content = {}
    
    return ContactResponse(
        isDisplaying=contact.is_displaying if contact.is_displaying is not None else True,
        phone=contact.phone,
        email=contact.email,
        website=contact.website,
        address=address,
        socialMedia=social_media,
        mapCoordinates=contact.map_coordinates,
        workingHours=working_hours,
        vr360Link=contact.vr360_link,
        vrTitle=contact.vr_title,
        content=content
    )


@router.put("/contact", response_model=ContactResponse)
def update_contact(
    data: ContactUpdate,
    session: SessionDep,
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None)
):
    """Create or update contact information"""
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    contact = session.exec(
        select(VRHotelContact)
        .where(
            VRHotelContact.tenant_id == current_user.tenant_id,
            VRHotelContact.property_id == x_property_id
        )
    ).first()
    
    if not contact:
        # Create new contact
        contact = VRHotelContact(
            tenant_id=current_user.tenant_id,
            property_id=x_property_id,
            is_displaying=data.isDisplaying if data.isDisplaying is not None else True,
            phone=data.phone,
            email=data.email,
            website=data.website,
            address_json=json.dumps(data.address) if data.address else None,
            social_media_json=json.dumps(data.socialMedia) if data.socialMedia else None,
            map_coordinates=data.mapCoordinates,
            working_hours_json=json.dumps(data.workingHours) if data.workingHours else None,
            vr360_link=data.vr360Link,
            vr_title=data.vrTitle,
            content_json=json.dumps(data.content) if data.content else None
        )
        session.add(contact)
    else:
        # Update existing contact
        if data.isDisplaying is not None:
            contact.is_displaying = data.isDisplaying
        if data.phone is not None:
            contact.phone = data.phone
        if data.email is not None:
            contact.email = data.email
        if data.website is not None:
            contact.website = data.website
        if data.address is not None:
            contact.address_json = json.dumps(data.address)
        if data.socialMedia is not None:
            contact.social_media_json = json.dumps(data.socialMedia)
        if data.mapCoordinates is not None:
            contact.map_coordinates = data.mapCoordinates
        if data.workingHours is not None:
            contact.working_hours_json = json.dumps(data.workingHours)
        if data.vr360Link is not None:
            contact.vr360_link = data.vr360Link
        if data.vrTitle is not None:
            contact.vr_title = data.vrTitle
        if data.content is not None:
            contact.content_json = json.dumps(data.content)
        
        contact.updated_at = datetime.utcnow()
    
    session.commit()
    session.refresh(contact)
    
    # Parse JSON fields for response
    address = {}
    if contact.address_json:
        try:
            address = json.loads(contact.address_json) if isinstance(contact.address_json, str) else contact.address_json
        except:
            address = {}
    
    social_media = {}
    if contact.social_media_json:
        try:
            social_media = json.loads(contact.social_media_json) if isinstance(contact.social_media_json, str) else contact.social_media_json
        except:
            social_media = {}
    
    working_hours = {}
    if contact.working_hours_json:
        try:
            working_hours = json.loads(contact.working_hours_json) if isinstance(contact.working_hours_json, str) else contact.working_hours_json
        except:
            working_hours = {}
    
    content = {}
    if contact.content_json:
        try:
            content = json.loads(contact.content_json) if isinstance(contact.content_json, str) else contact.content_json
        except:
            content = {}
    
    return ContactResponse(
        isDisplaying=contact.is_displaying if contact.is_displaying is not None else True,
        phone=contact.phone,
        email=contact.email,
        website=contact.website,
        address=address,
        socialMedia=social_media,
        mapCoordinates=contact.map_coordinates,
        workingHours=working_hours,
        vr360Link=contact.vr360_link,
        vrTitle=contact.vr_title,
        content=content
    )
