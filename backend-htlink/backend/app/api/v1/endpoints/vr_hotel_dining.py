"""
VR Hotel Dining API Endpoints
Manages dining venues, restaurants, bars, cafes
"""
from typing import Any, Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlmodel import Session, select, func, col, or_, and_
from app.api.deps import get_current_active_superuser, SessionDep, CurrentUser, get_db
from app.models.vr_hotel import VRDining, VRDiningTranslation, VRDiningMedia
from app.models import Property
from pydantic import BaseModel
from datetime import datetime
import json

router = APIRouter()

# ==========================================
# Pydantic Schemas
# ==========================================

class DiningTranslation(BaseModel):
    locale: str
    name: str
    description: Optional[str] = None

class DiningMediaInfo(BaseModel):
    media_id: int
    is_vr360: bool = False
    is_primary: bool = False
    sort_order: int = 100

class DiningCreate(BaseModel):
    code: str
    dining_type: Optional[str] = None
    vr_link: Optional[str] = None
    display_order: int = 0
    translations: List[DiningTranslation] = []
    media: List[DiningMediaInfo] = []

class DiningUpdate(BaseModel):
    code: Optional[str] = None
    dining_type: Optional[str] = None
    vr_link: Optional[str] = None
    display_order: Optional[int] = None
    translations: Optional[List[DiningTranslation]] = None
    media: Optional[List[DiningMediaInfo]] = None

class DiningResponse(BaseModel):
    id: int
    tenant_id: int
    property_id: int
    code: str
    dining_type: Optional[str] = None
    vr_link: Optional[str] = None
    status: str
    display_order: int
    translations: Dict[str, DiningTranslation] = {}
    media: List[DiningMediaInfo] = []
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

def get_dining_with_translations(session: Session, dining_id: int) -> Optional[DiningResponse]:
    """Get dining with all translations and media"""
    dining = session.get(VRDining, dining_id)
    if not dining:
        return None
    
    # Get translations
    translations_query = select(VRDiningTranslation).where(VRDiningTranslation.dining_id == dining_id)
    translations_rows = session.exec(translations_query).all()
    
    translations_dict = {}
    for trans in translations_rows:
        translations_dict[trans.locale] = DiningTranslation(
            locale=trans.locale,
            name=trans.name,
            description=trans.description
        )
    
    # Get media
    media_query = select(VRDiningMedia).where(VRDiningMedia.dining_id == dining_id)
    media_rows = session.exec(media_query).all()
    
    media_list = [
        DiningMediaInfo(
            media_id=m.media_id,
            is_vr360=m.is_vr360 or False,
            is_primary=m.is_primary or False,
            sort_order=m.sort_order or 100
        )
        for m in media_rows
    ]
    
    return DiningResponse(
        id=dining.id,
        tenant_id=dining.tenant_id,
        property_id=dining.property_id,
        code=dining.code,
        dining_type=dining.dining_type,
        vr_link=dining.vr_link,
        status=dining.status or "active",  # status is now a string, not enum
        display_order=dining.display_order,
        translations=translations_dict,
        media=media_list,
        created_at=dining.created_at,
        updated_at=dining.updated_at
    )

# ==========================================
# API Endpoints
# ==========================================

@router.get("/dining", response_model=List[DiningResponse])
def get_dinings(
    session: SessionDep,
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    dining_type: Optional[str] = None
) -> Any:
    """
    Get all dining venues for current property
    """
    check_vr_hotel_access(current_user)
    
    # Get current property
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    property_id = x_property_id
    
    # Build query
    query = select(VRDining).where(
        and_(
            VRDining.tenant_id == current_user.tenant_id,
            VRDining.property_id == property_id
        )
    )
    
    if dining_type:
        query = query.where(VRDining.dining_type == dining_type)
    
    query = query.order_by(VRDining.display_order, VRDining.code).offset(skip).limit(limit)
    
    dinings = session.exec(query).all()
    
    # Get full dining data with translations
    result = []
    for dining in dinings:
        dining_data = get_dining_with_translations(session, dining.id)
        if dining_data:
            result.append(dining_data)
    
    return result


@router.get("/dining/{dining_id}", response_model=DiningResponse)
def get_dining(
    session: SessionDep,
    current_user: CurrentUser,
    dining_id: int,
    x_property_id: Optional[int] = Header(None)
) -> Any:
    """
    Get specific dining venue by ID
    """
    check_vr_hotel_access(current_user)
    
    dining = session.get(VRDining, dining_id)
    if not dining:
        raise HTTPException(status_code=404, detail="Dining venue not found")
    
    # Check ownership
    if dining.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    dining_data = get_dining_with_translations(session, dining_id)
    if not dining_data:
        raise HTTPException(status_code=404, detail="Dining venue not found")
    
    return dining_data


@router.post("/dining", response_model=DiningResponse, status_code=201)
def create_dining(
    session: SessionDep,
    current_user: CurrentUser,
    dining_in: DiningCreate,
    x_property_id: Optional[int] = Header(None)
) -> Any:
    """
    Create new dining venue
    """
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    property_id = x_property_id
    
    # Check for duplicate code
    existing = session.exec(
        select(VRDining).where(
            and_(
                VRDining.tenant_id == current_user.tenant_id,
                VRDining.property_id == property_id,
                VRDining.code == dining_in.code
            )
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Dining code already exists")
    
    # Create dining (status will use database default 'active')
    dining = VRDining(
        tenant_id=current_user.tenant_id,
        property_id=property_id,
        code=dining_in.code,
        dining_type=dining_in.dining_type,
        vr_link=dining_in.vr_link,
        display_order=dining_in.display_order
    )
    
    session.add(dining)
    session.commit()
    # Don't refresh to avoid enum cache issue - get ID directly
    dining_id = dining.id
    
    # Add translations
    for trans in dining_in.translations:
        translation = VRDiningTranslation(
            dining_id=dining_id,
            locale=trans.locale,
            name=trans.name,
            description=trans.description
        )
        session.add(translation)
    
    # Add media
    for media in dining_in.media:
        dining_media = VRDiningMedia(
            dining_id=dining_id,
            media_id=media.media_id,
            is_vr360=media.is_vr360,
            is_primary=media.is_primary,
            sort_order=media.sort_order
        )
        session.add(dining_media)
    
    session.commit()
    
    # Build response manually to avoid query issues with enum
    translations_dict = {}
    for trans in dining_in.translations:
        translations_dict[trans.locale] = DiningTranslation(
            locale=trans.locale,
            name=trans.name,
            description=trans.description
        )
    
    media_list = [
        DiningMediaInfo(
            media_id=m.media_id,
            is_vr360=m.is_vr360,
            is_primary=m.is_primary,
            sort_order=m.sort_order
        )
        for m in dining_in.media
    ]
    
    return DiningResponse(
        id=dining_id,
        tenant_id=current_user.tenant_id,
        property_id=property_id,
        code=dining_in.code,
        dining_type=dining_in.dining_type,
        vr_link=dining_in.vr_link,
        status='active',  # Use lowercase to match database
        display_order=dining_in.display_order,
        translations=translations_dict,
        media=media_list,
        created_at=datetime.utcnow(),
        updated_at=None
    )


@router.put("/dining/{dining_id}", response_model=DiningResponse)
def update_dining(
    session: SessionDep,
    current_user: CurrentUser,
    dining_id: int,
    dining_in: DiningUpdate,
    x_property_id: Optional[int] = Header(None)
) -> Any:
    """
    Update dining venue
    """
    check_vr_hotel_access(current_user)
    
    dining = session.get(VRDining, dining_id)
    if not dining:
        raise HTTPException(status_code=404, detail="Dining venue not found")
    
    # Check ownership
    if dining.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update fields
    if dining_in.code is not None:
        # Check for duplicate code
        existing = session.exec(
            select(VRDining).where(
                and_(
                    VRDining.tenant_id == current_user.tenant_id,
                    VRDining.property_id == dining.property_id,
                    VRDining.code == dining_in.code,
                    VRDining.id != dining_id
                )
            )
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Dining code already exists")
        
        dining.code = dining_in.code
    
    if dining_in.dining_type is not None:
        dining.dining_type = dining_in.dining_type
    
    if dining_in.vr_link is not None:
        dining.vr_link = dining_in.vr_link
    
    if dining_in.display_order is not None:
        dining.display_order = dining_in.display_order
    
    dining.updated_at = datetime.utcnow()
    
    # Update translations
    if dining_in.translations is not None:
        # Delete existing translations
        session.exec(
            select(VRDiningTranslation).where(VRDiningTranslation.dining_id == dining_id)
        ).all()
        
        for trans_row in session.exec(
            select(VRDiningTranslation).where(VRDiningTranslation.dining_id == dining_id)
        ).all():
            session.delete(trans_row)
        
        # Add new translations
        for trans in dining_in.translations:
            translation = VRDiningTranslation(
                dining_id=dining.id,
                locale=trans.locale,
                name=trans.name,
                description=trans.description
            )
            session.add(translation)
    
    # Update media
    if dining_in.media is not None:
        # Delete existing media
        for media_row in session.exec(
            select(VRDiningMedia).where(VRDiningMedia.dining_id == dining_id)
        ).all():
            session.delete(media_row)
        
        # Add new media
        for media in dining_in.media:
            dining_media = VRDiningMedia(
                dining_id=dining.id,
                media_id=media.media_id,
                is_vr360=media.is_vr360,
                is_primary=media.is_primary,
                sort_order=media.sort_order
            )
            session.add(dining_media)
    
    session.add(dining)
    session.commit()
    session.refresh(dining)
    
    # Return full dining data
    return get_dining_with_translations(session, dining.id)


@router.delete("/dining/{dining_id}", status_code=204)
def delete_dining(
    session: SessionDep,
    current_user: CurrentUser,
    dining_id: int,
    x_property_id: Optional[int] = Header(None)
) -> None:
    """
    Delete dining venue
    """
    check_vr_hotel_access(current_user)
    
    dining = session.get(VRDining, dining_id)
    if not dining:
        raise HTTPException(status_code=404, detail="Dining venue not found")
    
    # Check ownership
    if dining.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete translations
    for trans in session.exec(
        select(VRDiningTranslation).where(VRDiningTranslation.dining_id == dining_id)
    ).all():
        session.delete(trans)
    
    # Delete media associations
    for media in session.exec(
        select(VRDiningMedia).where(VRDiningMedia.dining_id == dining_id)
    ).all():
        session.delete(media)
    
    # Delete dining
    session.delete(dining)
    session.commit()
