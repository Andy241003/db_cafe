"""
Cafe Services API

Endpoints for managing cafe/hotel services:
- Room service
- Laundry
- Concierge
- Airport transfer
- Spa service
- Tour booking
- Car rental
- Babysitting
- etc.
"""
from fastapi import APIRouter, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.cafe import (
    CafeService,
    CafeServiceTranslation,
    CafeServiceMedia
)
from app.api.deps import CurrentUser, SessionDep

router = APIRouter(prefix="/cafe/services", tags=["cafe_services"])


# ==========================================
# Schemas
# ==========================================

class ServiceTranslationSchema(BaseModel):
    locale: str
    name: str
    description: Optional[str] = None


class ServiceCreateUpdate(BaseModel):
    code: str
    service_type: str
    availability: Optional[str] = None
    price_information: Optional[str] = None
    vr360_tour_url: Optional[str] = None
    booking_url: Optional[str] = None
    primary_image_media_id: Optional[int] = None
    is_active: bool = True
    display_order: int = 0
    translations: List[ServiceTranslationSchema] = []


class ServiceResponse(BaseModel):
    id: int
    code: str
    service_type: str
    availability: Optional[str] = None
    price_information: Optional[str] = None
    vr360_tour_url: Optional[str] = None
    booking_url: Optional[str] = None
    primary_image_media_id: Optional[int] = None
    is_active: bool
    display_order: int
    translations: List[ServiceTranslationSchema]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# CRUD Operations
# ==========================================

@router.get("", response_model=List[ServiceResponse])
def get_services(
    current_user: CurrentUser,
    db: SessionDep,
    is_active: Optional[bool] = None,
    service_type: Optional[str] = None
):
    """Get all services"""
    statement = select(CafeService).where(
        CafeService.tenant_id == current_user.tenant_id
    )
    
    if is_active is not None:
        statement = statement.where(CafeService.is_active == is_active)
    
    if service_type:
        statement = statement.where(CafeService.service_type == service_type)
    
    statement = statement.order_by(CafeService.display_order, CafeService.created_at)
    services = db.exec(statement).all()
    
    result = []
    for service in services:
        trans_stmt = select(CafeServiceTranslation).where(
            CafeServiceTranslation.service_id == service.id
        )
        translations = db.exec(trans_stmt).all()
        
        result.append(ServiceResponse(
            **service.model_dump(),
            translations=[
                ServiceTranslationSchema(
                    locale=t.locale,
                    name=t.name,
                    description=t.description
                ) for t in translations
            ]
        ))
    
    return result


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(
    service_id: int,
    current_user: CurrentUser,
    db: SessionDep
):
    """Get a specific service"""
    service = db.get(CafeService, service_id)
    if not service or service.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Service not found")
    
    trans_stmt = select(CafeServiceTranslation).where(
        CafeServiceTranslation.service_id == service_id
    )
    translations = db.exec(trans_stmt).all()
    
    return ServiceResponse(
        **service.model_dump(),
        translations=[
            ServiceTranslationSchema(
                locale=t.locale,
                name=t.name,
                description=t.description
            ) for t in translations
        ]
    )


@router.post("", response_model=ServiceResponse)
def create_service(
    service_data: ServiceCreateUpdate,
    current_user: CurrentUser,
    db: SessionDep
):
    """Create a new service"""
    # Check if code already exists
    existing = db.exec(
        select(CafeService).where(
            CafeService.tenant_id == current_user.tenant_id,
            CafeService.code == service_data.code
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Service code already exists")
    
    # Create service
    service = CafeService(
        tenant_id=current_user.tenant_id,
        code=service_data.code,
        service_type=service_data.service_type,
        availability=service_data.availability,
        price_information=service_data.price_information,
        vr360_tour_url=service_data.vr360_tour_url,
        booking_url=service_data.booking_url,
        primary_image_media_id=service_data.primary_image_media_id,
        is_active=service_data.is_active,
        display_order=service_data.display_order
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    
    # Add translations
    for trans_data in service_data.translations:
        translation = CafeServiceTranslation(
            service_id=service.id,
            locale=trans_data.locale,
            name=trans_data.name,
            description=trans_data.description
        )
        db.add(translation)
    
    db.commit()
    
    return get_service(service.id, current_user, db)


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    service_data: ServiceCreateUpdate,
    current_user: CurrentUser,
    db: SessionDep
):
    """Update a service"""
    service = db.get(CafeService, service_id)
    if not service or service.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if code is being changed and if new code already exists
    if service_data.code != service.code:
        existing = db.exec(
            select(CafeService).where(
                CafeService.tenant_id == current_user.tenant_id,
                CafeService.code == service_data.code,
                CafeService.id != service_id
            )
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Service code already exists")
    
    # Update service fields
    service.code = service_data.code
    service.service_type = service_data.service_type
    service.availability = service_data.availability
    service.price_information = service_data.price_information
    service.vr360_tour_url = service_data.vr360_tour_url
    service.booking_url = service_data.booking_url
    service.primary_image_media_id = service_data.primary_image_media_id
    service.is_active = service_data.is_active
    service.display_order = service_data.display_order
    service.updated_at = datetime.utcnow()
    
    db.add(service)
    db.commit()
    
    # Update translations
    db.exec(
        select(CafeServiceTranslation).where(
            CafeServiceTranslation.service_id == service_id
        )
    ).delete()
    
    for trans_data in service_data.translations:
        translation = CafeServiceTranslation(
            service_id=service.id,
            locale=trans_data.locale,
            name=trans_data.name,
            description=trans_data.description
        )
        db.add(translation)
    
    db.commit()
    
    return get_service(service_id, current_user, db)


@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    current_user: CurrentUser,
    db: SessionDep
):
    """Delete a service"""
    service = db.get(CafeService, service_id)
    if not service or service.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Delete related translations and media entries
    db.exec(
        select(CafeServiceTranslation).where(
            CafeServiceTranslation.service_id == service_id
        )
    ).delete()
    
    db.exec(
        select(CafeServiceMedia).where(
            CafeServiceMedia.service_id == service_id
        )
    ).delete()
    
    db.delete(service)
    db.commit()
    
    return {"message": "Service deleted successfully"}


@router.patch("/{service_id}/reorder")
def reorder_services(
    service_id: int,
    current_user: CurrentUser,
    db: SessionDep,
    new_order: int = Query(...)
):
    """Update service display order"""
    service = db.get(CafeService, service_id)
    if not service or service.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service.display_order = new_order
    service.updated_at = datetime.utcnow()
    db.add(service)
    db.commit()
    db.refresh(service)
    
    return {"id": service.id, "display_order": service.display_order}


# ==========================================
# Service Media Management
# ==========================================

@router.post("/{service_id}/media/{media_id}")
def add_service_media(
    service_id: int,
    media_id: int,
    current_user: CurrentUser,
    db: SessionDep,
    is_primary: bool = False,
    sort_order: int = 0
):
    """Add media to a service"""
    service = db.get(CafeService, service_id)
    if not service or service.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if media already added
    existing = db.exec(
        select(CafeServiceMedia).where(
            CafeServiceMedia.service_id == service_id,
            CafeServiceMedia.media_id == media_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Media already added to this service")
    
    # If marking as primary, unmark other primary media
    if is_primary:
        db.exec(
            select(CafeServiceMedia).where(
                CafeServiceMedia.service_id == service_id,
                CafeServiceMedia.is_primary == True
            )
        ).delete()
        service.primary_image_media_id = media_id
    
    media = CafeServiceMedia(
        service_id=service_id,
        media_id=media_id,
        is_primary=is_primary,
        sort_order=sort_order
    )
    db.add(media)
    db.commit()
    
    return {"message": "Media added successfully"}


@router.delete("/{service_id}/media/{media_id}")
def remove_service_media(
    service_id: int,
    media_id: int,
    current_user: CurrentUser,
    db: SessionDep
):
    """Remove media from a service"""
    service = db.get(CafeService, service_id)
    if not service or service.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Service not found")
    
    media = db.exec(
        select(CafeServiceMedia).where(
            CafeServiceMedia.service_id == service_id,
            CafeServiceMedia.media_id == media_id
        )
    ).first()
    
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    db.delete(media)
    
    # If was primary, unset primary_image_media_id
    if media.is_primary:
        service.primary_image_media_id = None
    
    db.commit()
    
    return {"message": "Media removed successfully"}


@router.get("/{service_id}/media")
def get_service_media(
    service_id: int,
    current_user: CurrentUser,
    db: SessionDep
):
    """Get all media for a service"""
    service = db.get(CafeService, service_id)
    if not service or service.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Service not found")
    
    media_list = db.exec(
        select(CafeServiceMedia).where(
            CafeServiceMedia.service_id == service_id
        ).order_by(CafeServiceMedia.sort_order)
    ).all()
    
    return media_list
