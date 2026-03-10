"""
Cafe Events API endpoints

Handles cafe events management with multi-language support
"""
from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel

from app.core.db import get_db
from app.api.deps import CurrentUser, SessionDep
from app.models.cafe import (
    CafeEvent,
    CafeEventTranslation,
    CafeEventMedia,
    EventStatus
)

router = APIRouter()


# ==========================================
# Pydantic Schemas
# ==========================================

class EventTranslationSchema(BaseModel):
    """Event translation schema"""
    locale: str
    title: str
    description: Optional[str] = None
    details: Optional[str] = None


class EventMediaSchema(BaseModel):
    """Event media schema"""
    media_id: int
    is_primary: bool = False
    sort_order: int = 0


class CafeEventResponse(BaseModel):
    """Cafe Event Response"""
    id: int
    tenant_id: int
    code: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    branch_id: Optional[int] = None
    location_text: Optional[str] = None
    registration_url: Optional[str] = None
    max_participants: Optional[int] = None
    primary_image_media_id: Optional[int] = None
    status: str = "upcoming"
    is_featured: bool = False
    display_order: int = 0
    attributes_json: Optional[dict] = None
    translations: List[EventTranslationSchema] = []
    media: List[EventMediaSchema] = []


class CafeEventCreate(BaseModel):
    """Cafe Event Create"""
    code: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    branch_id: Optional[int] = None
    location_text: Optional[str] = None
    registration_url: Optional[str] = None
    max_participants: Optional[int] = None
    primary_image_media_id: Optional[int] = None
    status: str = "upcoming"
    is_featured: bool = False
    display_order: int = 0
    attributes_json: Optional[dict] = None
    translations: List[EventTranslationSchema]
    media_ids: Optional[List[int]] = None


class CafeEventUpdate(BaseModel):
    """Cafe Event Update"""
    code: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    branch_id: Optional[int] = None
    location_text: Optional[str] = None
    registration_url: Optional[str] = None
    max_participants: Optional[int] = None
    primary_image_media_id: Optional[int] = None
    status: Optional[str] = None
    is_featured: Optional[bool] = None
    display_order: Optional[int] = None
    attributes_json: Optional[dict] = None
    translations: Optional[List[EventTranslationSchema]] = None
    media_ids: Optional[List[int]] = None


# ==========================================
# Helper Functions
# ==========================================

def get_event_with_relations(event_id: int, db: Session) -> dict:
    """Get event with all relations"""
    event = db.get(CafeEvent, event_id)
    if not event:
        return None
    
    trans_stmt = select(CafeEventTranslation).where(
        CafeEventTranslation.event_id == event_id
    )
    translations = db.exec(trans_stmt).all()
    
    media_stmt = select(CafeEventMedia).where(
        CafeEventMedia.event_id == event_id
    ).order_by(CafeEventMedia.sort_order)
    media = db.exec(media_stmt).all()
    
    return {
        **event.model_dump(),
        "translations": [
            EventTranslationSchema(
                locale=t.locale,
                title=t.title,
                description=t.description,
                details=t.details
            ) for t in translations
        ],
        "media": [
            EventMediaSchema(
                media_id=m.media_id,
                is_primary=m.is_primary,
                sort_order=m.sort_order
            ) for m in media
        ]
    }


# ==========================================
# API Endpoints
# ==========================================

@router.get("/", response_model=List[CafeEventResponse])
def get_events(
    current_user: CurrentUser,
    db: SessionDep,
    status: Optional[str] = None,
    is_featured: Optional[bool] = None
):
    """Get all events"""
    statement = select(CafeEvent).where(
        CafeEvent.tenant_id == current_user.tenant_id
    )
    
    if status:
        statement = statement.where(CafeEvent.status == status)
    
    if is_featured is not None:
        statement = statement.where(CafeEvent.is_featured == is_featured)
    
    statement = statement.order_by(CafeEvent.start_date.desc(), CafeEvent.display_order)
    events = db.exec(statement).all()
    
    result = []
    for event in events:
        event_data = get_event_with_relations(event.id, db)
        if event_data:
            result.append(CafeEventResponse(**event_data))
    
    return result


@router.get("/{event_id}", response_model=CafeEventResponse)
def get_event(
    event_id: int,
    current_user: CurrentUser,
    db: SessionDep
):
    """Get specific event"""
    event = db.get(CafeEvent, event_id)
    
    if not event or event.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event_data = get_event_with_relations(event_id, db)
    return CafeEventResponse(**event_data)


@router.post("/", response_model=CafeEventResponse)
def create_event(
    event_data: CafeEventCreate,
    current_user: CurrentUser,
    db: SessionDep
):
    """Create new event"""
    existing = db.exec(
        select(CafeEvent).where(CafeEvent.code == event_data.code)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Event code already exists")
    
    new_event = CafeEvent(
        tenant_id=current_user.tenant_id,
        **event_data.model_dump(exclude={'translations', 'media_ids'})
    )
    
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    # Add translations
    for trans in event_data.translations:
        translation = CafeEventTranslation(
            event_id=new_event.id,
            locale=trans.locale,
            title=trans.title,
            description=trans.description,
            details=trans.details
        )
        db.add(translation)
    
    # Add media
    if event_data.media_ids:
        for idx, media_id in enumerate(event_data.media_ids):
            event_media = CafeEventMedia(
                event_id=new_event.id,
                media_id=media_id,
                sort_order=idx
            )
            db.add(event_media)
    
    db.commit()
    
    event_full = get_event_with_relations(new_event.id, db)
    return CafeEventResponse(**event_full)


@router.put("/{event_id}", response_model=CafeEventResponse)
def update_event(
    event_id: int,
    event_data: CafeEventUpdate,
    current_user: CurrentUser,
    db: SessionDep
):
    """Update event"""
    event = db.get(CafeEvent, event_id)
    
    if not event or event.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Event not found")
    
    for key, value in event_data.model_dump(
        exclude_unset=True,
        exclude={'translations', 'media_ids'}
    ).items():
        if value is not None:
            setattr(event, key, value)
            if key == 'attributes_json':
                flag_modified(event, key)
    
    db.add(event)
    
    if event_data.translations is not None:
        for existing_trans in db.exec(
            select(CafeEventTranslation).where(CafeEventTranslation.event_id == event_id)
        ).all():
            db.delete(existing_trans)
        
        for trans in event_data.translations:
            translation = CafeEventTranslation(
                event_id=event_id,
                locale=trans.locale,
                title=trans.title,
                description=trans.description,
                details=trans.details
            )
            db.add(translation)
    
    if event_data.media_ids is not None:
        for existing_media in db.exec(
            select(CafeEventMedia).where(CafeEventMedia.event_id == event_id)
        ).all():
            db.delete(existing_media)
        
        for idx, media_id in enumerate(event_data.media_ids):
            event_media = CafeEventMedia(
                event_id=event_id,
                media_id=media_id,
                sort_order=idx
            )
            db.add(event_media)
    
    db.commit()
    
    event_full = get_event_with_relations(event_id, db)
    return CafeEventResponse(**event_full)


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    current_user: CurrentUser,
    db: SessionDep
):
    """Delete event"""
    event = db.get(CafeEvent, event_id)
    
    if not event or event.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    
    return {"success": True, "message": "Event deleted"}
