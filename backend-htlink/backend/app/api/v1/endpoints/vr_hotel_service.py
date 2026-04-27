from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlmodel import Session, select
from app.api.deps import SessionDep, CurrentUser
from app.models.vr_hotel import VRService, VRServiceTranslation, VRServiceMedia
from pydantic import BaseModel
from datetime import datetime


router = APIRouter()


# Pydantic Schemas
class ServiceTranslation(BaseModel):
    locale: str
    name: str
    description: Optional[str] = None


class ServiceMediaInfo(BaseModel):
    media_id: int
    is_vr360: bool = False
    is_primary: bool = False
    sort_order: int = 100


class ServiceCreate(BaseModel):
    code: str
    service_type: Optional[str] = None
    availability: Optional[str] = None
    price_info: Optional[str] = None
    vr_link: Optional[str] = None
    booking_url: Optional[str] = None
    status: str = "active"
    translations: List[ServiceTranslation]
    media_ids: Optional[List[int]] = []
    primary_media_id: Optional[int] = None
    vr360_media_ids: Optional[List[int]] = []
    display_order: int = 0


class ServiceUpdate(BaseModel):
    code: Optional[str] = None
    service_type: Optional[str] = None
    availability: Optional[str] = None
    price_info: Optional[str] = None
    vr_link: Optional[str] = None
    booking_url: Optional[str] = None
    status: Optional[str] = None
    translations: Optional[List[ServiceTranslation]] = None
    media_ids: Optional[List[int]] = None
    primary_media_id: Optional[int] = None
    vr360_media_ids: Optional[List[int]] = None
    display_order: Optional[int] = None


class ServiceResponse(BaseModel):
    id: int
    tenant_id: int
    property_id: int
    code: str
    service_type: Optional[str] = None
    availability: Optional[str] = None
    price_info: Optional[str] = None
    vr_link: Optional[str] = None
    booking_url: Optional[str] = None
    status: str
    translations: Dict[str, ServiceTranslation]
    media: List[ServiceMediaInfo]
    display_order: int
    created_at: datetime
    updated_at: Optional[datetime] = None



# Permission check helper
def check_vr_hotel_access(current_user: CurrentUser):
    """Check if user has VR Hotel access"""
    if current_user.service_access not in [1, 2]:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to VR Hotel features"
        )

def get_service_with_translations(service: VRService, session: Session) -> ServiceResponse:
    """Helper to build service response"""
    translations_dict = {}
    translations = session.exec(
        select(VRServiceTranslation)
        .where(VRServiceTranslation.service_id == service.id)
    ).all()
    
    for trans in translations:
        translations_dict[trans.locale] = ServiceTranslation(
            locale=trans.locale,
            name=trans.name,
            description=trans.description
        )
    
    media_list = []
    media_query = session.exec(
        select(VRServiceMedia)
        .where(VRServiceMedia.service_id == service.id)
        .order_by(VRServiceMedia.sort_order)
    ).all()
    
    for media_rel in media_query:
        media_list.append(ServiceMediaInfo(
            media_id=media_rel.media_id,
            is_vr360=media_rel.is_vr360 or False,
            is_primary=media_rel.is_primary or False,
            sort_order=media_rel.sort_order or 100
        ))
    
    return ServiceResponse(
        id=service.id,
        tenant_id=service.tenant_id,
        property_id=service.property_id,
        code=service.code,
        service_type=service.service_type,
        availability=service.availability,
        price_info=service.price_info,
        vr_link=service.vr_link,
        booking_url=service.booking_url,
        status=service.status or "active",
        translations=translations_dict,
        media=media_list,
        display_order=service.display_order,
        created_at=service.created_at,
        updated_at=service.updated_at
    )


@router.get("/services", response_model=List[ServiceResponse])
def get_services(
    session: SessionDep,
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None)
):
    """Get all services"""
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    services = session.exec(
        select(VRService)
        .where(
            VRService.tenant_id == current_user.tenant_id,
            VRService.property_id == x_property_id
        )
        .order_by(VRService.display_order, VRService.code)
    ).all()
    
    return [get_service_with_translations(s, session) for s in services]


@router.get("/services/{service_id}", response_model=ServiceResponse)
def get_service(
    service_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None)
):
    """Get single service"""
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    service = session.get(VRService, service_id)
    if not service or service.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Service not found")
    return get_service_with_translations(service, session)


@router.post("/services", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_data: ServiceCreate,
    session: SessionDep,
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None)
):
    """Create new service"""
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    existing = session.exec(
        select(VRService).where(
            VRService.tenant_id == current_user.tenant_id,
            VRService.property_id == x_property_id,
            VRService.code == service_data.code
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Service code already exists")
    
    service = VRService(
        tenant_id=current_user.tenant_id,
        property_id=x_property_id,
        code=service_data.code,
        service_type=service_data.service_type,
        availability=service_data.availability,
        price_info=service_data.price_info,
        vr_link=service_data.vr_link,
        booking_url=service_data.booking_url,
        status=service_data.status,
        display_order=service_data.display_order
    )
    
    session.add(service)
    session.commit()
    service_id = service.id
    
    translations_dict = {}
    for trans in service_data.translations:
        translation = VRServiceTranslation(
            service_id=service_id,
            locale=trans.locale,
            name=trans.name,
            description=trans.description
        )
        session.add(translation)
        
        translations_dict[trans.locale] = ServiceTranslation(
            locale=trans.locale,
            name=trans.name,
            description=trans.description
        )
    
    media_list = []
    if service_data.media_ids:
        for idx, media_id in enumerate(service_data.media_ids):
            is_primary = (media_id == service_data.primary_media_id)
            is_vr360 = (media_id in (service_data.vr360_media_ids or []))
            
            service_media = VRServiceMedia(
                service_id=service_id,
                media_id=media_id,
                is_primary=is_primary,
                is_vr360=is_vr360,
                sort_order=idx * 10
            )
            session.add(service_media)
            
            media_list.append(ServiceMediaInfo(
                media_id=media_id,
                is_vr360=is_vr360,
                is_primary=is_primary,
                sort_order=idx * 10
            ))
    
    session.commit()
    session.refresh(service)
    
    return ServiceResponse(
        id=service_id,
        tenant_id=service.tenant_id,
        property_id=service.property_id,
        code=service_data.code,
        service_type=service_data.service_type,
        availability=service_data.availability,
        price_info=service_data.price_info,
        vr_link=service_data.vr_link,
        status=service_data.status,
        translations=translations_dict,
        media=media_list,
        display_order=service_data.display_order,
        created_at=service.created_at,
        updated_at=service.updated_at
    )


@router.put("/services/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    service_data: ServiceUpdate,
    session: SessionDep,
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None)
):
    """Update service"""
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    service = session.get(VRService, service_id)
    if not service or service.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check for duplicate code if changing
    if service_data.code is not None and service_data.code != service.code:
        existing = session.exec(
            select(VRService).where(
                VRService.tenant_id == current_user.tenant_id,
                VRService.property_id == service.property_id,
                VRService.code == service_data.code,
                VRService.id != service_id
            )
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Service code already exists")
    
    # Update basic fields using model_dump
    update_data = service_data.model_dump(exclude_unset=True, exclude={"translations", "media_ids", "primary_media_id", "vr360_media_ids"})
    for field, value in update_data.items():
        # Convert empty strings to None for optional URL fields
        if field in ['booking_url', 'vr_link'] and value == '':
            value = None
        setattr(service, field, value)
    
    service.updated_at = datetime.utcnow()
    session.add(service)
    
    if service_data.translations is not None:
        existing_trans = session.exec(
            select(VRServiceTranslation).where(VRServiceTranslation.service_id == service_id)
        ).all()
        for trans in existing_trans:
            session.delete(trans)
        
        for trans in service_data.translations:
            translation = VRServiceTranslation(
                service_id=service_id,
                locale=trans.locale,
                name=trans.name,
                description=trans.description
            )
            session.add(translation)
    
    if service_data.media_ids is not None:
        existing_media = session.exec(
            select(VRServiceMedia).where(VRServiceMedia.service_id == service_id)
        ).all()
        for media in existing_media:
            session.delete(media)
        
        for idx, media_id in enumerate(service_data.media_ids):
            is_primary = (media_id == service_data.primary_media_id)
            is_vr360 = (media_id in (service_data.vr360_media_ids or []))
            
            service_media = VRServiceMedia(
                service_id=service_id,
                media_id=media_id,
                is_primary=is_primary,
                is_vr360=is_vr360,
                sort_order=idx
            )
            session.add(service_media)
    
    session.commit()
    return get_service_with_translations(service, session)


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None)
):
    """Delete service"""
    check_vr_hotel_access(current_user)
    
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    service = session.get(VRService, service_id)
    if not service or service.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Service not found")
    
    translations = session.exec(
        select(VRServiceTranslation).where(VRServiceTranslation.service_id == service_id)
    ).all()
    for trans in translations:
        session.delete(trans)
    
    media = session.exec(
        select(VRServiceMedia).where(VRServiceMedia.service_id == service_id)
    ).all()
    for m in media:
        session.delete(m)
    
    session.delete(service)
    session.commit()
    return None

