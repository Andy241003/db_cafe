# app/api/v1/endpoints/analytics.py
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select, func, and_, or_
from sqlalchemy import distinct

from app.api.deps import SessionDep, get_current_active_superuser, get_tenant_from_header
from app.models import AdminUser, Tenant, PageView, ActivityLog, AnalyticsSummary, ActivityType
from app.core.security import get_client_ip
import json

router = APIRouter()

@router.post("/page-view")
def track_page_view(
    request: Request,
    session: SessionDep,
    page_path: str,
    referrer: Optional[str] = None,
    session_id: Optional[str] = None,
    current_user: AdminUser = Depends(get_current_active_superuser),
    tenant: Tenant = Depends(get_tenant_from_header)
):
    """Track a page view for analytics"""
    
    page_view = PageView(
        tenant_id=tenant.id,
        user_id=current_user.id,
        page_path=page_path,
        ip_address=get_client_ip(request),
        user_agent=str(request.headers.get("user-agent", "")),
        referrer=referrer,
        session_id=session_id
    )
    
    session.add(page_view)
    session.commit()
    
    return {"success": True, "message": "Page view tracked"}

@router.post("/activity")
def log_activity(
    request: Request,
    session: SessionDep,
    activity_type: ActivityType,
    description: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    extra_data: Optional[Dict[str, Any]] = None,
    current_user: AdminUser = Depends(get_current_active_superuser),
    tenant: Tenant = Depends(get_tenant_from_header)
):
    """Log user activity for audit trail"""
    
    activity = ActivityLog(
        tenant_id=tenant.id,
        user_id=current_user.id,
        activity_type=activity_type,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        extra_data=json.dumps(extra_data) if extra_data else None,
        ip_address=get_client_ip(request),
        user_agent=str(request.headers.get("user-agent", ""))
    )
    
    session.add(activity)
    session.commit()
    
    return {"success": True, "message": "Activity logged"}

@router.get("/dashboard-stats")
def get_dashboard_stats(
    session: SessionDep,
    days: int = 30,
    tenant: Tenant = Depends(get_tenant_from_header),
    current_user: AdminUser = Depends(get_current_active_superuser)
):
    """Get dashboard statistics for the last N days"""
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Page views stats
    total_page_views = session.exec(
        select(func.count(PageView.id))
        .where(
            and_(
                PageView.tenant_id == tenant.id,
                PageView.created_at >= start_date
            )
        )
    ).first() or 0
    
    # Unique visitors
    unique_visitors = session.exec(
        select(func.count(distinct(PageView.ip_address)))
        .where(
            and_(
                PageView.tenant_id == tenant.id,
                PageView.created_at >= start_date
            )
        )
    ).first() or 0
    
    # Categories created this month
    from app.models import FeatureCategory
    categories_this_month = session.exec(
        select(func.count(FeatureCategory.id))
        .where(
            and_(
                FeatureCategory.tenant_id == tenant.id,
                FeatureCategory.created_at >= start_date
            )
        )
    ).first() or 0
    
    # Features created this month  
    from app.models import Feature
    features_this_month = session.exec(
        select(func.count(Feature.id))
        .where(
            and_(
                Feature.tenant_id == tenant.id,
                Feature.created_at >= start_date
            )
        )
    ).first() or 0
    
    # Calculate growth percentages
    prev_start = start_date - timedelta(days=days)
    prev_page_views = session.exec(
        select(func.count(PageView.id))
        .where(
            and_(
                PageView.tenant_id == tenant.id,
                PageView.created_at >= prev_start,
                PageView.created_at < start_date
            )
        )
    ).first() or 0
    
    page_views_growth = 0
    if prev_page_views > 0:
        page_views_growth = round(((total_page_views - prev_page_views) / prev_page_views) * 100, 1)
    
    return {
        "total_page_views": total_page_views,
        "page_views_growth": page_views_growth,
        "unique_visitors": unique_visitors,
        "categories_this_month": categories_this_month,
        "features_this_month": features_this_month,
        "period_days": days
    }

@router.get("/recent-activities")
def get_recent_activities(
    session: SessionDep,
    limit: int = 10,
    tenant: Tenant = Depends(get_tenant_from_header),
    current_user: AdminUser = Depends(get_current_active_superuser)
):
    """Get recent activities for dashboard"""
    
    activities = session.exec(
        select(ActivityLog, AdminUser.full_name)
        .join(AdminUser, ActivityLog.user_id == AdminUser.id, isouter=True)
        .where(ActivityLog.tenant_id == tenant.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
    ).all()
    
    result = []
    for activity, user_name in activities:
        # Format time ago
        time_diff = datetime.utcnow() - activity.created_at
        if time_diff.days > 0:
            time_ago = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
        elif time_diff.seconds > 3600:
            hours = time_diff.seconds // 3600
            time_ago = f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif time_diff.seconds > 60:
            minutes = time_diff.seconds // 60
            time_ago = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            time_ago = "Just now"
        
        # Map activity types to icons and colors
        icon_map = {
            ActivityType.CREATE_CATEGORY: {"icon": "fas fa-plus", "bg": "#eff6ff", "color": "#2563eb"},
            ActivityType.UPDATE_CATEGORY: {"icon": "fas fa-edit", "bg": "#f0fdf4", "color": "#16a34a"},
            ActivityType.DELETE_CATEGORY: {"icon": "fas fa-trash", "bg": "#fef2f2", "color": "#dc2626"},
            ActivityType.CREATE_FEATURE: {"icon": "fas fa-puzzle-piece", "bg": "#eff6ff", "color": "#2563eb"},
            ActivityType.UPDATE_FEATURE: {"icon": "fas fa-edit", "bg": "#f0fdf4", "color": "#16a34a"},
            ActivityType.DELETE_FEATURE: {"icon": "fas fa-trash", "bg": "#fef2f2", "color": "#dc2626"},
            ActivityType.UPLOAD_MEDIA: {"icon": "fas fa-image", "bg": "#fef3c7", "color": "#d97706"},
            ActivityType.CREATE_USER: {"icon": "fas fa-user-plus", "bg": "#fce7f3", "color": "#be185d"},
            ActivityType.LOGIN: {"icon": "fas fa-sign-in-alt", "bg": "#f3f4f6", "color": "#6b7280"},
            ActivityType.SYSTEM_UPDATE: {"icon": "fas fa-cog", "bg": "#f3e8ff", "color": "#7c3aed"}
        }
        
        icon_info = icon_map.get(activity.activity_type, {"icon": "fas fa-info", "bg": "#f3f4f6", "color": "#6b7280"})
        
        result.append({
            "id": str(activity.id),
            "type": activity.activity_type.value,
            "text": activity.description,
            "time": time_ago,
            "user_name": user_name or "System",
            "icon": icon_info["icon"],
            "iconBg": icon_info["bg"],
            "iconColor": icon_info["color"]
        })
    
    return result
