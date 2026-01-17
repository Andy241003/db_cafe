"""
VR Hotel Facilities API Endpoints
Manages facilities like pool, gym, spa, meeting rooms
"""
from typing import Any, Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlmodel import Session, select, and_
from app.api.deps import SessionDep, CurrentUser
from app.models.vr_hotel import VRFacility, VRFacilityTranslation, VRFacilityMedia
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# ==========================================
# Pydantic Schemas
# ==========================================

class FacilityTranslation(BaseModel):
    locale: str
    name: str
    description: Optional[str] = None

class FacilityMediaInfo(BaseModel):
    media_id: int
    is_vr360: bool = False
    is_primary: bool = False
    sort_order: int = 100

class FacilityCreate(BaseModel):
    code: str
    facility_type: Optional[str] = None
    operating_hours: Optional[str] = None
    vr_link: Optional[str] = None
    display_order: int = 0
    translations: List[FacilityTranslation] = []
    media: List[FacilityMediaInfo] = []

class FacilityUpdate(BaseModel):
    code: Optional[str] = None
    facility_type: Optional[str] = None
    operating_hours: Optional[str] = None
    vr_link: Optional[str] = None
    display_order: Optional[int] = None
    translations: Optional[List[FacilityTranslation]] = None
    media: Optional[List[FacilityMediaInfo]] = None

class FacilityResponse(BaseModel):
    id: int
    tenant_id: int
    property_id: int
    code: str
    facility_type: Optional[str] = None
    operating_hours: Optional[str] = None
    vr_link: Optional[str] = None
    status: str
    display_order: int
    translations: Dict[str, FacilityTranslation] = {}
    media: List[FacilityMediaInfo] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

# ==========================================
# Helper Functions
# ==========================================

def check_vr_hotel_access(current_user: CurrentUser):
    """Check if user has VR Hotel access"""
    if current_user.service_access not in [1, 2]:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to VR Hotel features"
        )

def get_facility_with_translations(session: Session, facility_id: int) -> Optional[FacilityResponse]:
    """Get facility with all translations and media"""
    facility = session.get(VRFacility, facility_id)
    if not facility:
        return None
    
    # Get translations
    translations_query = select(VRFacilityTranslation).where(VRFacilityTranslation.facility_id == facility_id)
    translations_rows = session.exec(translations_query).all()
    
    translations_dict = {}
    for trans in translations_rows:
        translations_dict[trans.locale] = FacilityTranslation(
            locale=trans.locale,
            name=trans.name,
            description=trans.description
        )
    
    # Get media
    media_query = select(VRFacilityMedia).where(VRFacilityMedia.facility_id == facility_id)
    media_rows = session.exec(media_query).all()
    
    media_list = [
        FacilityMediaInfo(
            media_id=m.media_id,
            is_vr360=m.is_vr360 or False,
            is_primary=m.is_primary or False,
            sort_order=m.sort_order or 100
        )
        for m in media_rows
    ]
    
    return FacilityResponse(
        id=facility.id,
        tenant_id=facility.tenant_id,
        property_id=facility.property_id,
        code=facility.code,
        facility_type=facility.facility_type,
        operating_hours=facility.operating_hours,
        vr_link=facility.vr_link,
        status=facility.status or "active",  # status is now string, not enum
        display_order=facility.display_order,
        translations=translations_dict,
        media=media_list,
        created_at=facility.created_at,
        updated_at=facility.updated_at
    )

# ==========================================
# API Endpoints
# ==========================================

@router.get("/facilities", response_model=List[FacilityResponse])
def get_facilities(
    session: SessionDep,
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    facility_type: Optional[str] = None
) -> Any:
    """Get all facilities for current property"""
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    property_id = x_property_id
    
    # Build query
    query = select(VRFacility).where(
        and_(
            VRFacility.tenant_id == current_user.tenant_id,
            VRFacility.property_id == property_id
        )
    )
    
    if facility_type:
        query = query.where(VRFacility.facility_type == facility_type)
    
    query = query.order_by(VRFacility.display_order, VRFacility.code).offset(skip).limit(limit)
    
    facilities = session.exec(query).all()
    
    # Get full facility data with translations
    result = []
    for facility in facilities:
        facility_data = get_facility_with_translations(session, facility.id)
        if facility_data:
            result.append(facility_data)
    
    return result


@router.get("/facilities/{facility_id}", response_model=FacilityResponse)
def get_facility(
    facility_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None)
) -> Any:
    """Get a specific facility"""
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    facility_data = get_facility_with_translations(session, facility_id)
    
    if not facility_data:
        raise HTTPException(status_code=404, detail="Facility not found")
    
    # Verify ownership
    if facility_data.tenant_id != current_user.tenant_id or facility_data.property_id != x_property_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this facility")
    
    return facility_data


@router.post("/facilities", response_model=FacilityResponse)
def create_facility(
    session: SessionDep,
    current_user: CurrentUser,
    facility_in: FacilityCreate,
    x_property_id: Optional[int] = Header(None)
) -> Any:
    """Create new facility"""
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    property_id = x_property_id
    
    # Check for duplicate code
    existing = session.exec(
        select(VRFacility).where(
            and_(
                VRFacility.tenant_id == current_user.tenant_id,
                VRFacility.property_id == property_id,
                VRFacility.code == facility_in.code
            )
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Facility code already exists")
    
    # Create facility
    facility = VRFacility(
        tenant_id=current_user.tenant_id,
        property_id=property_id,
        code=facility_in.code,
        facility_type=facility_in.facility_type,
        operating_hours=facility_in.operating_hours,
        vr_link=facility_in.vr_link,
        display_order=facility_in.display_order
    )
    
    session.add(facility)
    session.commit()
    facility_id = facility.id
    
    # Add translations
    for trans in facility_in.translations:
        facility_trans = VRFacilityTranslation(
            facility_id=facility_id,
            locale=trans.locale,
            name=trans.name,
            description=trans.description
        )
        session.add(facility_trans)
    
    # Add media
    for media in facility_in.media:
        facility_media = VRFacilityMedia(
            facility_id=facility_id,
            media_id=media.media_id,
            is_vr360=media.is_vr360,
            is_primary=media.is_primary,
            sort_order=media.sort_order
        )
        session.add(facility_media)
    
    session.commit()
    
    # Build manual response to avoid enum issues
    translations_dict = {}
    for trans in facility_in.translations:
        translations_dict[trans.locale] = FacilityTranslation(
            locale=trans.locale,
            name=trans.name,
            description=trans.description
        )
    
    media_list = [
        FacilityMediaInfo(
            media_id=m.media_id,
            is_vr360=m.is_vr360,
            is_primary=m.is_primary,
            sort_order=m.sort_order
        )
        for m in facility_in.media
    ]
    
    return FacilityResponse(
        id=facility_id,
        tenant_id=current_user.tenant_id,
        property_id=property_id,
        code=facility_in.code,
        facility_type=facility_in.facility_type,
        operating_hours=facility_in.operating_hours,
        vr_link=facility_in.vr_link,
        status="active",
        display_order=facility_in.display_order,
        translations=translations_dict,
        media=media_list,
        created_at=datetime.utcnow(),
        updated_at=None
    )


@router.put("/facilities/{facility_id}", response_model=FacilityResponse)
def update_facility(
    facility_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    facility_in: FacilityUpdate,
    x_property_id: Optional[int] = Header(None)
) -> Any:
    """Update facility"""
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    # Get existing facility
    facility = session.get(VRFacility, facility_id)
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    
    # Verify ownership
    if facility.tenant_id != current_user.tenant_id or facility.property_id != x_property_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this facility")
    
    # Update basic fields
    if facility_in.code is not None:
        facility.code = facility_in.code
    if facility_in.facility_type is not None:
        facility.facility_type = facility_in.facility_type
    if facility_in.operating_hours is not None:
        facility.operating_hours = facility_in.operating_hours
    if facility_in.vr_link is not None:
        facility.vr_link = facility_in.vr_link
    if facility_in.display_order is not None:
        facility.display_order = facility_in.display_order
    
    facility.updated_at = datetime.utcnow()
    
    # Update translations
    if facility_in.translations is not None:
        # Delete existing translations
        session.exec(
            select(VRFacilityTranslation).where(VRFacilityTranslation.facility_id == facility_id)
        )
        for trans_row in session.exec(
            select(VRFacilityTranslation).where(VRFacilityTranslation.facility_id == facility_id)
        ).all():
            session.delete(trans_row)
        
        # Add new translations
        for trans in facility_in.translations:
            facility_trans = VRFacilityTranslation(
                facility_id=facility_id,
                locale=trans.locale,
                name=trans.name,
                description=trans.description
            )
            session.add(facility_trans)
    
    # Update media
    if facility_in.media is not None:
        # Delete existing media
        for media_row in session.exec(
            select(VRFacilityMedia).where(VRFacilityMedia.facility_id == facility_id)
        ).all():
            session.delete(media_row)
        
        # Add new media
        for media in facility_in.media:
            facility_media = VRFacilityMedia(
                facility_id=facility_id,
                media_id=media.media_id,
                is_vr360=media.is_vr360,
                is_primary=media.is_primary,
                sort_order=media.sort_order
            )
            session.add(facility_media)
    
    session.add(facility)
    session.commit()
    
    # Return updated facility
    return get_facility_with_translations(session, facility_id)


@router.delete("/facilities/{facility_id}")
def delete_facility(
    facility_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None)
) -> Any:
    """Delete facility"""
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    # Get existing facility
    facility = session.get(VRFacility, facility_id)
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    
    # Verify ownership
    if facility.tenant_id != current_user.tenant_id or facility.property_id != x_property_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this facility")
    
    # Delete translations (CASCADE)
    for trans_row in session.exec(
        select(VRFacilityTranslation).where(VRFacilityTranslation.facility_id == facility_id)
    ).all():
        session.delete(trans_row)
    
    # Delete media (CASCADE)
    for media_row in session.exec(
        select(VRFacilityMedia).where(VRFacilityMedia.facility_id == facility_id)
    ).all():
        session.delete(media_row)
    
    # Delete facility
    session.delete(facility)
    session.commit()
    
    return {"message": "Facility deleted successfully"}
