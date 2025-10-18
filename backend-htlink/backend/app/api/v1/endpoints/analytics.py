# app/api/v1/endpoints/analytics.py
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any, Union
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from sqlmodel import Session, select, func, and_, or_
from sqlalchemy import distinct
from pydantic import BaseModel, Field
import json
import hashlib
import asyncio
import uuid
from urllib.parse import urlparse

from app.api.deps import SessionDep, CurrentUser
from app.models import Tenant, Property, Event, AnalyticsSummary, EventType, DeviceType, UserRole
from app.models.activity_log import ActivityLog  # Only for admin activity stats, NOT for analytics tracking
from app.core.security import get_client_ip

router = APIRouter()

# Pydantic Models for Analytics Tracking
class TrackingRequest(BaseModel):
    tracking_key: str = Field(..., max_length=64)
    event_type: EventType = Field(default=EventType.PAGE_VIEW)
    device: Optional[DeviceType] = Field(default=DeviceType.DESKTOP)
    user_agent: Optional[str] = Field(default=None, max_length=255)
    url: Optional[str] = Field(default=None, max_length=500)
    referrer: Optional[str] = Field(default=None, max_length=500)
    session_id: Optional[str] = Field(default=None, max_length=100)
    page_title: Optional[str] = Field(default=None, max_length=500)

class AnalyticsStatsResponse(BaseModel):
    total_page_views: int
    unique_visitors: int  
    total_events: int
    properties_count: int
    period_start: datetime
    period_end: datetime

class RealtimeStatsResponse(BaseModel):
    active_users_15min: int
    page_views_5min: int
    events_1min: int

# Helper functions
def hash_ip(ip_address: str) -> str:
    """Hash IP address for privacy"""
    return hashlib.sha256(ip_address.encode()).hexdigest()[:64]

def detect_device_from_user_agent(user_agent: str) -> DeviceType:
    """Detect device type from user agent"""
    if not user_agent:
        return DeviceType.DESKTOP
    
    user_agent_lower = user_agent.lower()
    
    if any(mobile_indicator in user_agent_lower for mobile_indicator in 
           ['mobile', 'android', 'iphone', 'ipod', 'windows phone']):
        return DeviceType.MOBILE
    elif any(tablet_indicator in user_agent_lower for tablet_indicator in 
             ['ipad', 'tablet', 'kindle']):
        return DeviceType.TABLET
    else:
        return DeviceType.DESKTOP

async def update_analytics_summary(session: Session, tenant_id: int, event_date: date):
    """Update daily analytics summary for a tenant"""
    try:
        # Check if summary exists for this date
        existing_summary = session.exec(
            select(AnalyticsSummary).where(
                and_(
                    AnalyticsSummary.tenant_id == tenant_id,
                    AnalyticsSummary.date == event_date,
                    AnalyticsSummary.period_type == "daily"
                )
            )
        ).first()
        
        # Calculate stats for the day
        start_of_day = datetime.combine(event_date, datetime.min.time())
        end_of_day = datetime.combine(event_date, datetime.max.time())
        
        total_page_views = session.exec(
            select(func.count(Event.id)).where(
                and_(
                    Event.tenant_id == tenant_id,
                    Event.event_type == EventType.PAGE_VIEW,
                    Event.created_at >= start_of_day,
                    Event.created_at <= end_of_day
                )
            )
        ).first() or 0
        
        unique_visitors = session.exec(
            select(func.count(distinct(Event.ip_hash))).where(
                and_(
                    Event.tenant_id == tenant_id,
                    Event.created_at >= start_of_day,
                    Event.created_at <= end_of_day
                )
            )
        ).first() or 0
        
        total_activities = session.exec(
            select(func.count(Event.id)).where(
                and_(
                    Event.tenant_id == tenant_id,
                    Event.created_at >= start_of_day,
                    Event.created_at <= end_of_day
                )
            )
        ).first() or 0
        
        if existing_summary:
            # Update existing summary
            existing_summary.total_page_views = total_page_views
            existing_summary.unique_visitors = unique_visitors
            existing_summary.total_activities = total_activities
            existing_summary.updated_at = datetime.utcnow()
        else:
            # Create new summary
            new_summary = AnalyticsSummary(
                tenant_id=tenant_id,
                date=start_of_day,
                period_type="daily",
                total_page_views=total_page_views,
                unique_visitors=unique_visitors,
                total_activities=total_activities
            )
            session.add(new_summary)
        
        session.commit()
        
    except Exception as e:
        session.rollback()
        print(f"Error updating analytics summary: {e}")

# Analytics Tracking Endpoints

@router.get("/test")
async def test_connection():
    """Test endpoint to verify API connectivity"""
    return {"status": "ok", "message": "Analytics API is connected"}

@router.get("/public-stats")
def get_public_analytics_stats(
    session: SessionDep,
    days: int = 30,
    tenant_id: int = 4  # Default to tenant 4 (Boton Blue) for demo
):
    """
    PUBLIC endpoint for analytics stats (NO AUTH REQUIRED)
    Used for demo/testing purposes
    In production, use /stats endpoint with authentication
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Total page views
    total_page_views = session.exec(
        select(func.count(Event.id)).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.event_type == EventType.PAGE_VIEW,
                Event.created_at >= start_date
            )
        )
    ).first() or 0
    
    # Unique visitors
    unique_visitors = session.exec(
        select(func.count(distinct(Event.ip_hash))).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.created_at >= start_date
            )
        )
    ).first() or 0
    
    # Total events
    total_events = session.exec(
        select(func.count(Event.id)).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.created_at >= start_date
            )
        )
    ).first() or 0
    
    # Properties count
    properties_count = session.exec(
        select(func.count(Property.id)).where(Property.tenant_id == tenant_id)
    ).first() or 0
    
    # Page views by day (for chart)
    page_views_by_day = session.exec(
        select(
            func.date(Event.created_at).label('date'),
            func.count(Event.id).label('views')
        ).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.event_type == EventType.PAGE_VIEW,
                Event.created_at >= start_date
            )
        ).group_by(func.date(Event.created_at)).order_by(func.date(Event.created_at))
    ).all()

    # Popular pages (based on URL if available, otherwise event type)
    popular_pages = session.exec(
        select(
            Event.url,
            func.count(Event.id).label('views')
        ).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.event_type == EventType.PAGE_VIEW,
                Event.created_at >= start_date,
                Event.url.isnot(None)
            )
        ).group_by(Event.url).order_by(func.count(Event.id).desc()).limit(10)
    ).all()

    # If no URLs, fallback to event types
    if not popular_pages:
        popular_pages = session.exec(
            select(
                Event.event_type,
                func.count(Event.id).label('views')
            ).where(
                and_(
                    Event.tenant_id == tenant_id,
                    Event.created_at >= start_date
                )
            ).group_by(Event.event_type).order_by(func.count(Event.id).desc()).limit(5)
        ).all()

    # Traffic sources (device breakdown)
    traffic_sources = session.exec(
        select(
            Event.device,
            func.count(Event.id).label('views')
        ).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.event_type == EventType.PAGE_VIEW,
                Event.created_at >= start_date
            )
        ).group_by(Event.device).order_by(func.count(Event.id).desc()).limit(5)
    ).all()

    # Popular features (click events with feature names from features table)
    # First, try to get feature names from feature_id with translation
    from app.models import Feature, FeatureTranslation
    from sqlalchemy import case
    
    popular_features_with_names = session.exec(
        select(
            FeatureTranslation.title.label('name'),
            func.count(Event.id).label('clicks')
        ).join(
            Feature, Event.feature_id == Feature.id
        ).join(
            FeatureTranslation, and_(
                FeatureTranslation.feature_id == Feature.id,
                FeatureTranslation.locale == 'vi'  # Default to Vietnamese
            )
        ).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.event_type == EventType.CLICK,
                Event.created_at >= start_date,
                Event.feature_id.isnot(None)
            )
        ).group_by(FeatureTranslation.title).order_by(func.count(Event.id).desc()).limit(10)
    ).all()
    
    # If no features found, fallback to device breakdown
    if not popular_features_with_names:
        popular_features = session.exec(
            select(
                Event.device,
                func.count(Event.id).label('clicks')
            ).where(
                and_(
                    Event.tenant_id == tenant_id,
                    Event.event_type == EventType.CLICK,
                    Event.created_at >= start_date
                )
            ).group_by(Event.device).order_by(func.count(Event.id).desc()).limit(5)
        ).all()
    else:
        popular_features = popular_features_with_names

    return {
        "total_page_views": total_page_views,
        "unique_visitors": unique_visitors,
        "total_events": total_events,
        "properties_count": properties_count,
        "period_start": start_date.isoformat(),
        "period_end": end_date.isoformat(),
        "page_views_by_day": [
            {"date": str(row.date), "views": row.views} for row in page_views_by_day
        ],
        "popular_pages": [
            {"event_type": getattr(row, 'url', None) or getattr(row, 'event_type', 'Unknown'), "views": row.views} for row in popular_pages
        ],
        "traffic_sources": [
            {"device": row.device or "unknown", "views": row.views} for row in traffic_sources
        ],
        "popular_features": [
            {
                "feature": getattr(row, 'name', None) or (f"{getattr(row, 'device', 'unknown')} Device" if hasattr(row, 'device') else "Unknown"),
                "clicks": row.clicks,
                "ctr": round((row.clicks / total_events * 100), 1) if total_events > 0 else 0
            } for row in popular_features
        ]
    }

@router.post("/track")
async def track_analytics_event(
    request: Request,
    session: SessionDep,
    background_tasks: BackgroundTasks,
    tracking_data: TrackingRequest
):
    """
    Track analytics events from hotel websites (PUBLIC ENDPOINT - NO AUTH)
    """
    try:
        # Find property by tracking_key
        property_obj = session.exec(
            select(Property).where(Property.tracking_key == tracking_data.tracking_key)
        ).first()
        
        if not property_obj:
            raise HTTPException(status_code=404, detail="Invalid tracking key")
        
        # Get client IP and hash it for privacy
        client_ip = get_client_ip(request)
        ip_hash = hash_ip(client_ip)
        
        # Auto-detect device if not provided
        device = tracking_data.device
        if not device and tracking_data.user_agent:
            device = detect_device_from_user_agent(tracking_data.user_agent)
        
        # Create event record in events table with FULL tracking data
        event = Event(
            tenant_id=property_obj.tenant_id,
            property_id=property_obj.id,
            event_type=tracking_data.event_type,
            device=device,
            user_agent=tracking_data.user_agent,
            ip_hash=ip_hash,  # ✅ IP address (hashed for privacy)
            url=tracking_data.url,  # ✅ URL of the page
            referrer=tracking_data.referrer,  # ✅ Traffic source
            session_id=tracking_data.session_id,  # ✅ Session ID
            page_title=tracking_data.page_title  # ✅ Page title
        )
        
        session.add(event)
        session.commit()
        session.refresh(event)
        
        # Update analytics summary in background
        background_tasks.add_task(
            update_analytics_summary, 
            session, 
            property_obj.tenant_id, 
            datetime.utcnow().date()
        )
        
        return {
            "success": True,
            "event_id": event.id,
            "message": "Event tracked successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        print(f"Analytics tracking error: {e}")
        raise HTTPException(status_code=500, detail="Failed to track event")

# Dashboard Analytics Endpoints (Require Authentication)

@router.get("/stats")
def get_analytics_stats(
    session: SessionDep,
    current_user: CurrentUser,
    days: int = 30
):
    """Get analytics statistics for tenant dashboard - requires authentication"""

    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Use current user's tenant_id
    tenant_id = current_user.tenant_id
    
    # Total page views
    total_page_views = session.exec(
        select(func.count(Event.id)).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.event_type == EventType.PAGE_VIEW,
                Event.created_at >= start_date
            )
        )
    ).first() or 0
    
    # Unique visitors
    unique_visitors = session.exec(
        select(func.count(distinct(Event.ip_hash))).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.created_at >= start_date
            )
        )
    ).first() or 0
    
    # Total events
    total_events = session.exec(
        select(func.count(Event.id)).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.created_at >= start_date
            )
        )
    ).first() or 0
    
    # Properties count
    properties_count = session.exec(
        select(func.count(Property.id)).where(Property.tenant_id == tenant_id)
    ).first() or 0
    
    # Page views by day (for chart)
    page_views_by_day = session.exec(
        select(
            func.date(Event.created_at).label('date'),
            func.count(Event.id).label('views')
        ).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.event_type == EventType.PAGE_VIEW,
                Event.created_at >= start_date
            )
        ).group_by(func.date(Event.created_at)).order_by(func.date(Event.created_at))
    ).all()

    # Popular pages (based on event type breakdown)
    popular_pages = session.exec(
        select(
            Event.event_type,
            func.count(Event.id).label('views')
        ).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.created_at >= start_date
            )
        ).group_by(Event.event_type).order_by(func.count(Event.id).desc()).limit(5)
    ).all()

    # Traffic sources (device breakdown)
    traffic_sources = session.exec(
        select(
            Event.device,
            func.count(Event.id).label('views')
        ).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.event_type == EventType.PAGE_VIEW,
                Event.created_at >= start_date
            )
        ).group_by(Event.device).order_by(func.count(Event.id).desc()).limit(5)
    ).all()

    # Popular features (click events by device)
    popular_features = session.exec(
        select(
            Event.device,
            func.count(Event.id).label('clicks')
        ).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.event_type == EventType.CLICK,
                Event.created_at >= start_date
            )
        ).group_by(Event.device).order_by(func.count(Event.id).desc()).limit(5)
    ).all()

    return {
        "total_page_views": total_page_views,
        "unique_visitors": unique_visitors,
        "total_events": total_events,
        "properties_count": properties_count,
        "period_start": start_date.isoformat(),
        "period_end": end_date.isoformat(),
        "page_views_by_day": [
            {"date": str(row.date), "views": row.views} for row in page_views_by_day
        ],
        "popular_pages": [
            {"event_type": row.event_type, "views": row.views} for row in popular_pages
        ],
        "traffic_sources": [
            {"device": row.device or "unknown", "views": row.views} for row in traffic_sources
        ],
        "popular_features": [
            {"device": row.device or "unknown", "clicks": row.clicks} for row in popular_features
        ]
    }

@router.get("/realtime")
def get_realtime_stats(
    session: SessionDep,
    current_user: CurrentUser
):
    """Get real-time analytics statistics - requires authentication"""

    now = datetime.utcnow()

    # Use current user's tenant_id
    tenant_id = current_user.tenant_id
    
    # Active users in last 15 minutes
    active_users_15min = session.exec(
        select(func.count(distinct(Event.ip_hash))).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.created_at >= now - timedelta(minutes=15)
            )
        )
    ).first() or 0
    
    # Page views in last 5 minutes
    page_views_5min = session.exec(
        select(func.count(Event.id)).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.event_type == EventType.PAGE_VIEW,
                Event.created_at >= now - timedelta(minutes=5)
            )
        )
    ).first() or 0
    
    # Events in last 1 minute
    events_1min = session.exec(
        select(func.count(Event.id)).where(
            and_(
                Event.tenant_id == tenant_id,  
                Event.created_at >= now - timedelta(minutes=1)
            )
        )
    ).first() or 0
    
    return {
        "active_users_15min": active_users_15min,
        "page_views_5min": page_views_5min,
        "events_1min": events_1min
    }

@router.get("/summary/{period}")
def get_analytics_summary(
    period: str,
    session: SessionDep,
    current_user: CurrentUser,
    days: int = 30
):
    """Get analytics summary data (daily/monthly) - all authenticated users can access"""

    if period not in ["daily", "monthly"]:
        raise HTTPException(status_code=400, detail="Period must be 'daily' or 'monthly'")

    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)

    # Use current user's tenant_id
    tenant_id = current_user.tenant_id

    summaries = session.exec(
        select(AnalyticsSummary).where(
            and_(
                AnalyticsSummary.tenant_id == tenant_id,
                AnalyticsSummary.period_type == period,
                AnalyticsSummary.date >= start_date,
                AnalyticsSummary.date <= end_date
            )
        ).order_by(AnalyticsSummary.date)
    ).all()
    
    return {
        "period": period,
        "start_date": start_date,
        "end_date": end_date,
        "data": [
            {
                "date": summary.date.isoformat(),
                "total_page_views": summary.total_page_views,
                "unique_visitors": summary.unique_visitors,
                "total_activities": summary.total_activities
            }
            for summary in summaries
        ]
    }

@router.get("/properties/{property_id}/stats")
def get_property_analytics(
    property_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    days: int = 30
):
    """Get analytics for a specific property - all authenticated users can access"""

    # Verify property exists and user has access
    property_obj = session.get(Property, property_id)

    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")

    # Check tenant access
    if current_user.role != UserRole.OWNER and current_user.tenant_id != property_obj.tenant_id:
        raise HTTPException(status_code=403, detail="Access denied to this property")
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get property-specific stats
    stats = session.exec(
        select(
            Event.event_type,
            Event.device,
            func.count(Event.id).label('count')
        ).where(
            and_(
                Event.property_id == property_id,
                Event.created_at >= start_date
            )
        ).group_by(Event.event_type, Event.device)
    ).all()
    
    return {
        "property_id": property_id,
        "property_name": property_obj.property_name,
        "period_days": days,
        "stats": [
            {
                "event_type": stat.event_type.value,
                "device": stat.device.value if stat.device else None,
                "count": stat.count
            }
            for stat in stats
        ]
    }

@router.get("/test")
def test_analytics_endpoint():
    """Simple test endpoint to verify analytics routes are working"""
    return {"message": "Analytics endpoint is working!", "timestamp": datetime.utcnow()}

@router.get("/embed-script/{property_id}")
def get_embed_script_demo(
    property_id: int,
    session: SessionDep
):
    """Generate embed script code for a property - Demo endpoint (no auth)"""
    
    # Get property info (for demo, use tenant_id = 1)
    property_obj = session.exec(
        select(Property).where(Property.id == property_id)
    ).first()
    
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Generate embed script
    script_content = f'''<!-- Hotel Analytics Tracking Script -->
<script>
(function() {{
  'use strict';
  
  const CONFIG = {{
    API_BASE_URL: 'https://travel.link360.vn/api/v1/analytics',
    TRACKING_KEY: '{property_obj.tracking_key}',
    PROPERTY_NAME: '{property_obj.property_name}',
    DEBUG: false
  }};

  const getDeviceType = () => {{
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }};

  const trackEvent = async (eventType, additionalData = {{}}) => {{
    try {{
      const eventData = {{
        tracking_key: CONFIG.TRACKING_KEY,
        event_type: eventType,
        device: getDeviceType(),
        user_agent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer || undefined,
        ...additionalData
      }};

      await fetch(`${{CONFIG.API_BASE_URL}}/track`, {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify(eventData)
      }});
    }} catch (error) {{
      if (CONFIG.DEBUG) console.error('Analytics error:', error);
    }}
  }};

  // Auto-track page view
  trackEvent('page_view');
  
  // Track clicks on important elements
  document.addEventListener('click', (event) => {{
    const element = event.target.closest('a, button');
    if (element) {{
      trackEvent('click', {{
        element_text: element.textContent?.trim().substring(0, 100) || '',
        element_href: element.href || ''
      }});
    }}
  }});

  // Expose global tracking function
  window.HotelAnalytics = {{ track: trackEvent }};
}})();
</script>'''

    return {
        "property_id": property_id,
        "property_name": property_obj.property_name,
        "tracking_key": property_obj.tracking_key,
        "embed_script": script_content,
        "instructions": "Copy the script above and paste it before the </body> tag on your website pages"
    }

class SimpleTrackingRequest(BaseModel):
    tracking_key: str

@router.post("/track-simple")  
async def track_simple(session: SessionDep, request: SimpleTrackingRequest):
    """Simple tracking test without enum issues"""
    try:
        # Just find property - no event creation yet
        property_obj = session.exec(
            select(Property).where(Property.tracking_key == request.tracking_key)
        ).first()
        
        if not property_obj:
            return {"error": "Invalid tracking key"}
            
        return {
            "success": True,
            "property_name": property_obj.property_name,
            "tenant_id": property_obj.tenant_id
        }
    except Exception as e:
        return {"error": str(e)}

class DashboardStatsResponse(BaseModel):
    total_page_views: int = 0
    page_views_growth: float = 0.0
    unique_visitors: int = 0
    categories_this_month: int = 0
    features_this_month: int = 0
    period_days: int = 30

@router.get("/dashboard-stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    session: SessionDep,
    current_user: CurrentUser,
    days: int = 30
):
    """Get dashboard statistics for the current tenant - all authenticated users can access"""
    try:
        tenant_id = current_user.tenant_id
        period_start = datetime.utcnow() - timedelta(days=days)
        previous_period_start = datetime.utcnow() - timedelta(days=days*2)
        previous_period_end = datetime.utcnow() - timedelta(days=days)

        # Get page views for current period
        current_views = session.exec(
            select(func.count(Event.id)).where(
                and_(
                    Event.tenant_id == tenant_id,
                    Event.event_type == EventType.PAGE_VIEW,
                    Event.created_at >= period_start
                )
            )
        ).first() or 0

        # Get page views for previous period
        previous_views = session.exec(
            select(func.count(Event.id)).where(
                and_(
                    Event.tenant_id == tenant_id,
                    Event.event_type == EventType.PAGE_VIEW,
                    Event.created_at >= previous_period_start,
                    Event.created_at < previous_period_end
                )
            )
        ).first() or 0

        # Calculate growth percentage
        page_views_growth = 0.0
        if previous_views > 0:
            page_views_growth = ((current_views - previous_views) / previous_views) * 100

        # Get unique visitors (approximated by unique IPs)
        unique_visitors = session.exec(
            select(func.count(distinct(Event.ip_hash))).where(
                and_(
                    Event.tenant_id == tenant_id,
                    Event.created_at >= period_start
                )
            )
        ).first() or 0

        # Get categories created this month
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        categories_this_month = session.exec(
            select(func.count(ActivityLog.id)).where(
                and_(
                    ActivityLog.tenant_id == tenant_id,
                    ActivityLog.activity_type == "create_category",
                    ActivityLog.created_at >= month_start
                )
            )
        ).first() or 0

        # Get features created this month
        features_this_month = session.exec(
            select(func.count(ActivityLog.id)).where(
                and_(
                    ActivityLog.tenant_id == tenant_id,
                    ActivityLog.activity_type == "create_feature",
                    ActivityLog.created_at >= month_start
                )
            )
        ).first() or 0

        return DashboardStatsResponse(
            total_page_views=current_views,
            page_views_growth=round(page_views_growth, 1),
            unique_visitors=unique_visitors,
            categories_this_month=categories_this_month,
            features_this_month=features_this_month,
            period_days=days
        )

    except Exception as e:
        # Return default stats if analytics data is not available
        return DashboardStatsResponse(
            total_page_views=0,
            page_views_growth=0.0,
            unique_visitors=0,
            categories_this_month=0,
            features_this_month=0,
            period_days=days
        )


@router.post("/aggregate")
async def trigger_aggregation(
    current_user: CurrentUser,
    session: SessionDep,
    days_back: int = 7
):
    """
    Manually trigger analytics aggregation (OWNER/ADMIN only)
    
    This will:
    1. Create daily summaries for the last N days
    2. Delete events older than 90 days
    
    Use this for:
    - Initial setup
    - Manual cleanup
    - Testing aggregation logic
    """
    # Check permissions
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only OWNER and ADMIN can trigger aggregation")
    
    from app.tasks.analytics_aggregation import aggregate_events_to_summary, delete_old_events
    
    try:
        # Get tenants with events
        tenants = session.exec(
            select(Event.tenant_id).distinct()
        ).all()
        
        summaries_created = 0
        
        # Aggregate for each day
        for days_ago in range(days_back, -1, -1):
            target_date = (datetime.utcnow() - timedelta(days=days_ago)).date()
            
            for tenant_id in tenants:
                try:
                    aggregate_events_to_summary(session, target_date, tenant_id)
                    summaries_created += 1
                except Exception as e:
                    print(f"Failed to aggregate {target_date}, tenant {tenant_id}: {e}")
        
        # Delete old events
        deleted_count = delete_old_events(session, days_to_keep=90)
        
        return {
            "status": "success",
            "message": f"Aggregation complete",
            "summaries_created": summaries_created,
            "events_deleted": deleted_count,
            "tenants_processed": len(tenants)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Aggregation failed: {str(e)}")



