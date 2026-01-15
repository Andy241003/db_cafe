"""
VR Hotel Rooms API Endpoints
Manages room listings, details, and VR360 content
"""
from typing import Any, Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlmodel import Session, select, func, col, or_, and_
from app.api.deps import get_current_active_superuser, SessionDep, CurrentUser, get_db
from app.models.vr_hotel import VRRoom, VRRoomTranslation, VRRoomMedia
from app.models import Property
from pydantic import BaseModel
from datetime import datetime
import json

router = APIRouter()

# ==========================================
# Pydantic Schemas
# ==========================================

class RoomTranslation(BaseModel):
    locale: str
    name: str
    description: Optional[str] = None
    amenities_text: Optional[str] = None

class RoomMediaInfo(BaseModel):
    media_id: int
    is_vr360: bool = False
    is_primary: bool = False
    sort_order: int = 100

class RoomCreate(BaseModel):
    room_code: str
    room_type: Optional[str] = None
    floor: Optional[int] = None
    bed_type: Optional[str] = None
    capacity: Optional[int] = None
    size_sqm: Optional[float] = None
    price_per_night: Optional[float] = None
    status: str = "available"
    amenities_json: Optional[List] = None
    attributes_json: Optional[Dict] = None
    display_order: int = 0
    translations: List[RoomTranslation] = []
    media: List[RoomMediaInfo] = []

class RoomUpdate(BaseModel):
    room_code: Optional[str] = None
    room_type: Optional[str] = None
    floor: Optional[int] = None
    bed_type: Optional[str] = None
    capacity: Optional[int] = None
    size_sqm: Optional[float] = None
    price_per_night: Optional[float] = None
    status: Optional[str] = None
    amenities_json: Optional[List] = None
    attributes_json: Optional[Dict] = None
    display_order: Optional[int] = None
    translations: Optional[List[RoomTranslation]] = None
    media: Optional[List[RoomMediaInfo]] = None

class RoomResponse(BaseModel):
    id: int
    tenant_id: int
    property_id: int
    room_code: str
    room_type: Optional[str] = None
    floor: Optional[int] = None
    bed_type: Optional[str] = None
    capacity: Optional[int] = None
    size_sqm: Optional[float] = None
    price_per_night: Optional[float] = None
    status: str
    amenities_json: Optional[List] = None
    attributes_json: Optional[Dict] = None
    display_order: int
    translations: Dict[str, RoomTranslation] = {}
    media: List[RoomMediaInfo] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

# ==========================================
# Helper Functions
# ==========================================

def check_vr_hotel_access(current_user: CurrentUser):
    """Check if user has VR Hotel access (service_access = 1 or 2)"""
    if current_user.service_access not in [1, 2]:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to VR Hotel features"
        )

def get_room_with_translations(session: Session, room_id: int) -> Optional[RoomResponse]:
    """Get room with all translations and media"""
    room = session.get(VRRoom, room_id)
    if not room:
        return None
    
    # Get translations
    translations_query = select(VRRoomTranslation).where(VRRoomTranslation.room_id == room_id)
    translations_rows = session.exec(translations_query).all()
    
    translations_dict = {}
    for trans in translations_rows:
        translations_dict[trans.locale] = RoomTranslation(
            locale=trans.locale,
            name=trans.name,
            description=trans.description,
            amenities_text=trans.amenities_text
        )
    
    # Get media
    media_query = select(VRRoomMedia).where(VRRoomMedia.room_id == room_id)
    media_rows = session.exec(media_query).all()
    
    media_list = [
        RoomMediaInfo(
            media_id=m.media_id,
            is_vr360=m.is_vr360 or False,
            is_primary=m.is_primary or False,
            sort_order=m.sort_order or 100
        )
        for m in media_rows
    ]
    
    return RoomResponse(
        id=room.id,
        tenant_id=room.tenant_id,
        property_id=room.property_id,
        room_code=room.room_code,
        room_type=room.room_type,
        floor=room.floor,
        bed_type=room.bed_type,
        capacity=room.capacity,
        size_sqm=room.size_sqm,
        price_per_night=room.price_per_night,
        status=room.status,
        amenities_json=room.amenities_json,
        attributes_json=room.attributes_json,
        display_order=room.display_order,
        translations=translations_dict,
        media=media_list,
        created_at=room.created_at,
        updated_at=room.updated_at
    )

# ==========================================
# API Endpoints
# ==========================================

@router.get("/rooms", response_model=List[RoomResponse])
def get_rooms(
    session: SessionDep,
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    room_type: Optional[str] = None,
    status: Optional[str] = None
) -> Any:
    """
    Get all rooms for current property
    """
    check_vr_hotel_access(current_user)
    
    # Get current property
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    property_id = x_property_id
    
    # Build query
    query = select(VRRoom).where(
        and_(
            VRRoom.tenant_id == current_user.tenant_id,
            VRRoom.property_id == property_id
        )
    )
    
    if room_type:
        query = query.where(VRRoom.room_type == room_type)
    
    if status:
        query = query.where(VRRoom.status == status)
    
    query = query.order_by(VRRoom.display_order, VRRoom.room_code).offset(skip).limit(limit)
    
    rooms = session.exec(query).all()
    
    # Get full room data with translations
    result = []
    for room in rooms:
        room_data = get_room_with_translations(session, room.id)
        if room_data:
            result.append(room_data)
    
    return result


@router.get("/rooms/{room_id}", response_model=RoomResponse)
def get_room(
    session: SessionDep,
    current_user: CurrentUser,
    room_id: int,
    x_property_id: Optional[int] = Header(None)
) -> Any:
    """
    Get specific room by ID
    """
    check_vr_hotel_access(current_user)
    
    room = session.get(VRRoom, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check ownership
    if room.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    room_data = get_room_with_translations(session, room_id)
    if not room_data:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return room_data


@router.post("/rooms", response_model=RoomResponse, status_code=201)
def create_room(
    session: SessionDep,
    current_user: CurrentUser,
    room_in: RoomCreate,
    x_property_id: Optional[int] = Header(None)
) -> Any:
    """
    Create new room
    """
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    property_id = x_property_id
    
    # Check for duplicate room_code
    existing = session.exec(
        select(VRRoom).where(
            and_(
                VRRoom.tenant_id == current_user.tenant_id,
                VRRoom.property_id == property_id,
                VRRoom.room_code == room_in.room_code
            )
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Room code already exists")
    
    # Create room
    room = VRRoom(
        tenant_id=current_user.tenant_id,
        property_id=property_id,
        room_code=room_in.room_code,
        room_type=room_in.room_type,
        floor=room_in.floor,
        bed_type=room_in.bed_type,
        capacity=room_in.capacity,
        size_sqm=room_in.size_sqm,
        price_per_night=room_in.price_per_night,
        status=room_in.status,
        amenities_json=room_in.amenities_json,
        attributes_json=room_in.attributes_json,
        display_order=room_in.display_order
    )
    
    session.add(room)
    session.commit()
    session.refresh(room)
    
    # Add translations
    for trans in room_in.translations:
        translation = VRRoomTranslation(
            room_id=room.id,
            locale=trans.locale,
            name=trans.name,
            description=trans.description,
            amenities_text=trans.amenities_text
        )
        session.add(translation)
    
    # Add media
    for media in room_in.media:
        room_media = VRRoomMedia(
            room_id=room.id,
            media_id=media.media_id,
            is_vr360=media.is_vr360,
            is_primary=media.is_primary,
            sort_order=media.sort_order
        )
        session.add(room_media)
    
    session.commit()
    
    return get_room_with_translations(session, room.id)


@router.put("/rooms/{room_id}", response_model=RoomResponse)
def update_room(
    session: SessionDep,
    current_user: CurrentUser,
    room_id: int,
    room_in: RoomUpdate,
    x_property_id: Optional[int] = Header(None)
) -> Any:
    """
    Update room
    """
    check_vr_hotel_access(current_user)
    
    room = session.get(VRRoom, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update basic fields
    update_data = room_in.model_dump(exclude_unset=True, exclude={"translations", "media"})
    for field, value in update_data.items():
        setattr(room, field, value)
    
    session.add(room)
    
    # Update translations
    if room_in.translations is not None:
        # Delete existing translations
        session.exec(
            select(VRRoomTranslation).where(VRRoomTranslation.room_id == room_id)
        ).all()
        for trans in session.exec(select(VRRoomTranslation).where(VRRoomTranslation.room_id == room_id)):
            session.delete(trans)
        
        # Add new translations
        for trans in room_in.translations:
            translation = VRRoomTranslation(
                room_id=room.id,
                locale=trans.locale,
                name=trans.name,
                description=trans.description,
                amenities_text=trans.amenities_text
            )
            session.add(translation)
    
    # Update media
    if room_in.media is not None:
        # Delete existing media
        for media in session.exec(select(VRRoomMedia).where(VRRoomMedia.room_id == room_id)):
            session.delete(media)
        
        # Add new media
        for media in room_in.media:
            room_media = VRRoomMedia(
                room_id=room.id,
                media_id=media.media_id,
                is_vr360=media.is_vr360,
                is_primary=media.is_primary,
                sort_order=media.sort_order
            )
            session.add(room_media)
    
    session.commit()
    session.refresh(room)
    
    return get_room_with_translations(session, room.id)


@router.delete("/rooms/{room_id}", status_code=204)
def delete_room(
    session: SessionDep,
    current_user: CurrentUser,
    room_id: int,
    x_property_id: Optional[int] = Header(None)
) -> None:
    """
    Delete room (cascade deletes translations and media)
    """
    check_vr_hotel_access(current_user)
    
    room = session.get(VRRoom, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    session.delete(room)
    session.commit()
