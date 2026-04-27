"""
Events API endpoints for Hotel SaaS
Handles analytics events (page_view, click, share)
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from datetime import datetime
import hashlib

from app.core.db import get_db
from app.models import Event, EventType, DeviceType
from app.schemas.content import EventCreate, EventResponse

router = APIRouter()


def get_client_ip_hash(request: Request) -> str:
    """Get hashed client IP for privacy"""
    client_ip = request.client.host
    return hashlib.sha256(client_ip.encode()).hexdigest()


def detect_device_type(user_agent: str) -> DeviceType:
    """Simple device detection from user agent"""
    if not user_agent:
        return DeviceType.DESKTOP
    
    user_agent_lower = user_agent.lower()
    if any(mobile in user_agent_lower for mobile in ['mobile', 'android', 'iphone']):
        return DeviceType.MOBILE
    elif 'tablet' in user_agent_lower or 'ipad' in user_agent_lower:
        return DeviceType.TABLET
    else:
        return DeviceType.DESKTOP


@router.post("/", response_model=EventResponse)
def log_event(
    *,
    db: Session = Depends(get_db),
    event_in: EventCreate,
    request: Request
):
    """Log an analytics event"""
    user_agent = request.headers.get("user-agent", "")
    device = detect_device_type(user_agent)
    ip_hash = get_client_ip_hash(request)
    
    event = Event(
        tenant_id=event_in.tenant_id,
        property_id=event_in.property_id,
        category_id=event_in.category_id,
        feature_id=event_in.feature_id,
        post_id=event_in.post_id,
        locale=event_in.locale,
        event_type=event_in.event_type,
        device=device,
        user_agent=user_agent[:255],  # Truncate if too long
        ip_hash=ip_hash,
        created_at=datetime.utcnow()
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/", response_model=List[EventResponse])
def list_events(
    *,
    db: Session = Depends(get_db),
    tenant_id: int,
    property_id: Optional[int] = None,
    event_type: Optional[EventType] = None,
    skip: int = 0,
    limit: int = 100
):
    """List analytics events for a tenant"""
    statement = select(Event).where(Event.tenant_id == tenant_id)
    
    if property_id:
        statement = statement.where(Event.property_id == property_id)
    if event_type:
        statement = statement.where(Event.event_type == event_type)
    
    statement = statement.order_by(Event.created_at.desc()).offset(skip).limit(limit)
    events = db.exec(statement).all()
    return events


@router.get("/stats/summary")
def get_event_stats(
    *,
    db: Session = Depends(get_db),
    tenant_id: int,
    property_id: Optional[int] = None,
    days: int = 7
):
    """Get event statistics summary"""
    # This would be a more complex query in real implementation
    # For now, return basic counts
    
    from sqlalchemy import func, text
    from datetime import datetime, timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    query = select(
        Event.event_type,
        func.count(Event.id).label('count')
    ).where(
        Event.tenant_id == tenant_id,
        Event.created_at >= cutoff_date
    ).group_by(Event.event_type)
    
    if property_id:
        query = query.where(Event.property_id == property_id)
    
    results = db.exec(query).all()
    
    stats = {
        "period_days": days,
        "total_events": sum(r.count for r in results),
        "by_type": {r.event_type: r.count for r in results}
    }
    
    return stats


@router.get("/stats/popular-content")
def get_popular_content(
    *,
    db: Session = Depends(get_db),
    tenant_id: int,
    property_id: Optional[int] = None,
    days: int = 7,
    limit: int = 10
):
    """Get most popular content by views"""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    query = select(
        Event.feature_id,
        Event.post_id,
        func.count(Event.id).label('views')
    ).where(
        Event.tenant_id == tenant_id,
        Event.event_type == EventType.PAGE_VIEW,
        Event.created_at >= cutoff_date,
        Event.post_id.isnot(None)
    ).group_by(Event.feature_id, Event.post_id).order_by(
        func.count(Event.id).desc()
    ).limit(limit)
    
    if property_id:
        query = query.where(Event.property_id == property_id)
    
    results = db.exec(query).all()
    
    return [
        {
            "feature_id": r.feature_id,
            "post_id": r.post_id,
            "views": r.views
        }
        for r in results
    ]
