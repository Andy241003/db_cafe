"""
VR Hotel Offers API Endpoints
Manages hotel offers, vouchers, and promotions with multi-language support
"""
from typing import Any, Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlmodel import Session, select, and_
from app.api.deps import get_current_active_superuser, SessionDep, CurrentUser, get_db
from app.models.vr_hotel import VROffer, VROfferTranslation
from pydantic import BaseModel
from datetime import datetime, date
import json

router = APIRouter()

# ==========================================
# Pydantic Schemas
# ==========================================

class OfferTranslation(BaseModel):
    locale: str
    title: str
    description: Optional[str] = None
    terms_conditions: Optional[str] = None

class OfferCreate(BaseModel):
    code: str
    discount_type: str = "percentage"  # percentage, fixed_amount, free_night
    discount_value: Optional[float] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    min_nights: int = 1
    applicable_room_types: Optional[List[str]] = None
    status: str = "active"  # active, inactive, expired
    vr_link: Optional[str] = None
    display_order: int = 0
    translations: List[OfferTranslation] = []

class OfferUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    min_nights: Optional[int] = None
    applicable_room_types: Optional[List[str]] = None
    status: Optional[str] = None
    vr_link: Optional[str] = None
    display_order: Optional[int] = None
    translations: Optional[List[OfferTranslation]] = None

class OfferResponse(BaseModel):
    id: int
    tenant_id: int
    property_id: int
    code: str
    discount_type: str
    discount_value: Optional[float] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    min_nights: int
    applicable_room_types: Optional[List[str]] = None
    status: str
    vr_link: Optional[str] = None
    display_order: int
    translations: Dict[str, OfferTranslation] = {}
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

def get_offer_with_translations(session: Session, offer_id: int) -> Optional[OfferResponse]:
    """Get offer with all translations"""
    offer = session.get(VROffer, offer_id)
    if not offer:
        return None
    
    # Get translations
    translations_query = select(VROfferTranslation).where(
        VROfferTranslation.offer_id == offer_id
    )
    translations_rows = session.exec(translations_query).all()
    
    translations_dict = {}
    for trans in translations_rows:
        translations_dict[trans.locale] = OfferTranslation(
            locale=trans.locale,
            title=trans.title,
            description=trans.description,
            terms_conditions=trans.terms_conditions
        )
    
    return OfferResponse(
        id=offer.id,
        tenant_id=offer.tenant_id,
        property_id=offer.property_id,
        code=offer.code,
        discount_type=offer.discount_type,
        discount_value=offer.discount_value,
        valid_from=offer.valid_from,
        valid_to=offer.valid_to,
        min_nights=offer.min_nights,
        applicable_room_types=offer.applicable_room_types,
        status=offer.status,
        vr_link=offer.vr_link,
        display_order=offer.display_order,
        translations=translations_dict,
        created_at=offer.created_at,
        updated_at=offer.updated_at
    )

# ==========================================
# API Endpoints
# ==========================================

@router.get("/offers", response_model=List[OfferResponse])
def get_offers(
    session: SessionDep,
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = None
) -> Any:
    """
    Get all offers for current property
    """
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    property_id = x_property_id
    
    # Build query
    query = select(VROffer).where(
        and_(
            VROffer.tenant_id == current_user.tenant_id,
            VROffer.property_id == property_id
        )
    )
    
    if status:
        query = query.where(VROffer.status == status)
    
    query = query.order_by(VROffer.display_order, VROffer.code).offset(skip).limit(limit)
    
    offers = session.exec(query).all()
    
    # Get full offer data with translations
    result = []
    for offer in offers:
        offer_data = get_offer_with_translations(session, offer.id)
        if offer_data:
            result.append(offer_data)
    
    return result


@router.get("/offers/{offer_id}", response_model=OfferResponse)
def get_offer(
    session: SessionDep,
    current_user: CurrentUser,
    offer_id: int,
    x_property_id: Optional[int] = Header(None)
) -> Any:
    """
    Get specific offer by ID
    """
    check_vr_hotel_access(current_user)
    
    offer = session.get(VROffer, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Check ownership
    if offer.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    offer_data = get_offer_with_translations(session, offer_id)
    if not offer_data:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    return offer_data


@router.post("/offers", response_model=OfferResponse, status_code=201)
def create_offer(
    session: SessionDep,
    current_user: CurrentUser,
    offer_in: OfferCreate,
    x_property_id: Optional[int] = Header(None)
) -> Any:
    """
    Create new offer
    """
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    property_id = x_property_id
    
    # Check for duplicate code
    existing = session.exec(
        select(VROffer).where(
            and_(
                VROffer.tenant_id == current_user.tenant_id,
                VROffer.property_id == property_id,
                VROffer.code == offer_in.code
            )
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Offer code already exists")
    
    # Create offer
    offer = VROffer(
        tenant_id=current_user.tenant_id,
        property_id=property_id,
        code=offer_in.code,
        discount_type=offer_in.discount_type,
        discount_value=offer_in.discount_value,
        valid_from=offer_in.valid_from,
        valid_to=offer_in.valid_to,
        min_nights=offer_in.min_nights,
        applicable_room_types=offer_in.applicable_room_types,
        status=offer_in.status,
        vr_link=offer_in.vr_link,
        display_order=offer_in.display_order
    )
    
    session.add(offer)
    session.flush()  # Get the ID before commit
    
    # Add translations
    if offer_in.translations:
        for trans in offer_in.translations:
            translation = VROfferTranslation(
                offer_id=offer.id,
                locale=trans.locale,
                title=trans.title,
                description=trans.description,
                terms_conditions=trans.terms_conditions
            )
            session.add(translation)
    
    session.commit()
    session.refresh(offer)
    
    # Return full offer with translations
    offer_data = get_offer_with_translations(session, offer.id)
    return offer_data


@router.put("/offers/{offer_id}", response_model=OfferResponse)
def update_offer(
    session: SessionDep,
    current_user: CurrentUser,
    offer_id: int,
    offer_in: OfferUpdate,
    x_property_id: Optional[int] = Header(None)
) -> Any:
    """
    Update existing offer
    """
    check_vr_hotel_access(current_user)
    
    offer = session.get(VROffer, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Check ownership
    if offer.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check for duplicate code if changing it
    if offer_in.code and offer_in.code != offer.code:
        existing = session.exec(
            select(VROffer).where(
                and_(
                    VROffer.tenant_id == current_user.tenant_id,
                    VROffer.property_id == offer.property_id,
                    VROffer.code == offer_in.code
                )
            )
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Offer code already exists")
    
    # Update fields
    if offer_in.code is not None:
        offer.code = offer_in.code
    if offer_in.discount_type is not None:
        offer.discount_type = offer_in.discount_type
    if offer_in.discount_value is not None:
        offer.discount_value = offer_in.discount_value
    if offer_in.valid_from is not None:
        offer.valid_from = offer_in.valid_from
    if offer_in.valid_to is not None:
        offer.valid_to = offer_in.valid_to
    if offer_in.min_nights is not None:
        offer.min_nights = offer_in.min_nights
    if offer_in.applicable_room_types is not None:
        offer.applicable_room_types = offer_in.applicable_room_types
    if offer_in.status is not None:
        offer.status = offer_in.status
    if offer_in.vr_link is not None:
        offer.vr_link = offer_in.vr_link
    if offer_in.display_order is not None:
        offer.display_order = offer_in.display_order
    
    offer.updated_at = datetime.utcnow()
    
    # Update translations
    if offer_in.translations is not None:
        # Delete existing translations
        session.exec(
            select(VROfferTranslation).where(
                VROfferTranslation.offer_id == offer_id
            )
        )
        delete_query = (
            select(VROfferTranslation)
            .where(VROfferTranslation.offer_id == offer_id)
        )
        for item in session.exec(delete_query).all():
            session.delete(item)
        
        # Add new translations
        for trans in offer_in.translations:
            translation = VROfferTranslation(
                offer_id=offer.id,
                locale=trans.locale,
                title=trans.title,
                description=trans.description,
                terms_conditions=trans.terms_conditions
            )
            session.add(translation)
    
    session.add(offer)
    session.commit()
    session.refresh(offer)
    
    # Return full offer with translations
    offer_data = get_offer_with_translations(session, offer.id)
    return offer_data


@router.delete("/offers/{offer_id}", status_code=204)
def delete_offer(
    session: SessionDep,
    current_user: CurrentUser,
    offer_id: int,
    x_property_id: Optional[int] = Header(None)
) -> None:
    """
    Delete offer
    """
    check_vr_hotel_access(current_user)
    
    offer = session.get(VROffer, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Check ownership
    if offer.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete translations first (cascading)
    session.delete(offer)
    session.commit()

