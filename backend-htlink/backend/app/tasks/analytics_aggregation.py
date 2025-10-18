# app/tasks/analytics_aggregation.py
"""
Analytics Data Aggregation Task

This task runs daily to:
1. Aggregate old events into daily summaries
2. Delete events older than 90 days (keep only summaries)
3. Reduce database size while maintaining historical data

Run this task with: 
- Cron: 0 2 * * * (every day at 2 AM)
- Or manually: python -m app.tasks.analytics_aggregation
"""

from datetime import datetime, timedelta
from sqlmodel import Session, select, func, and_
from app.core.db import engine
from app.models import Event, AnalyticsSummary, EventType, DeviceType
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def aggregate_events_to_summary(session: Session, date: datetime.date, tenant_id: int):
    """
    Aggregate all events for a specific date and tenant into analytics_summary table
    """
    start_of_day = datetime.combine(date, datetime.min.time())
    end_of_day = datetime.combine(date, datetime.max.time())
    
    # Check if summary already exists
    existing = session.exec(
        select(AnalyticsSummary).where(
            and_(
                AnalyticsSummary.tenant_id == tenant_id,
                AnalyticsSummary.date == date
            )
        )
    ).first()
    
    if existing:
        logger.info(f"Summary already exists for {date}, tenant {tenant_id}")
        return existing
    
    # Aggregate page views
    page_views = session.exec(
        select(func.count(Event.id)).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.event_type == EventType.PAGE_VIEW,
                Event.created_at >= start_of_day,
                Event.created_at <= end_of_day
            )
        )
    ).one()
    
    # Aggregate unique visitors (distinct IP hashes)
    unique_visitors = session.exec(
        select(func.count(func.distinct(Event.ip_hash))).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.created_at >= start_of_day,
                Event.created_at <= end_of_day,
                Event.ip_hash.isnot(None)
            )
        )
    ).one()
    
    # Aggregate clicks
    clicks = session.exec(
        select(func.count(Event.id)).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.event_type == EventType.CLICK,
                Event.created_at >= start_of_day,
                Event.created_at <= end_of_day
            )
        )
    ).one()
    
    # Aggregate shares
    shares = session.exec(
        select(func.count(Event.id)).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.event_type == EventType.SHARE,
                Event.created_at >= start_of_day,
                Event.created_at <= end_of_day
            )
        )
    ).one()
    
    # Device breakdown
    device_stats = session.exec(
        select(
            Event.device,
            func.count(Event.id).label('count')
        ).where(
            and_(
                Event.tenant_id == tenant_id,
                Event.created_at >= start_of_day,
                Event.created_at <= end_of_day
            )
        ).group_by(Event.device)
    ).all()
    
    device_breakdown = {str(row.device): row.count for row in device_stats}
    
    # Create summary
    summary = AnalyticsSummary(
        tenant_id=tenant_id,
        date=date,
        total_page_views=page_views or 0,
        unique_visitors=unique_visitors or 0,
        total_clicks=clicks or 0,
        total_shares=shares or 0,
        device_breakdown=device_breakdown,
        created_at=datetime.utcnow()
    )
    
    session.add(summary)
    session.commit()
    session.refresh(summary)
    
    logger.info(f"Created summary for {date}, tenant {tenant_id}: {page_views} views, {unique_visitors} visitors")
    return summary


def delete_old_events(session: Session, days_to_keep: int = 90):
    """
    Delete events older than specified days (keep summaries)
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
    
    # Count events to delete
    count = session.exec(
        select(func.count(Event.id)).where(
            Event.created_at < cutoff_date
        )
    ).one()
    
    if count == 0:
        logger.info("No old events to delete")
        return 0
    
    # Delete old events
    deleted = session.exec(
        select(Event).where(Event.created_at < cutoff_date)
    ).all()
    
    for event in deleted:
        session.delete(event)
    
    session.commit()
    
    logger.info(f"Deleted {len(deleted)} events older than {days_to_keep} days")
    return len(deleted)


def run_daily_aggregation():
    """
    Main aggregation task - run this daily
    """
    logger.info("Starting daily analytics aggregation...")
    
    with Session(engine) as session:
        # Get list of tenants
        tenants = session.exec(
            select(Event.tenant_id).distinct()
        ).all()
        
        logger.info(f"Found {len(tenants)} tenants with events")
        
        # Aggregate yesterday's data
        yesterday = (datetime.utcnow() - timedelta(days=1)).date()
        
        for tenant_id in tenants:
            try:
                aggregate_events_to_summary(session, yesterday, tenant_id)
            except Exception as e:
                logger.error(f"Failed to aggregate for tenant {tenant_id}: {e}")
        
        # Delete events older than 90 days
        deleted_count = delete_old_events(session, days_to_keep=90)
        
    logger.info(f"Daily aggregation complete. Deleted {deleted_count} old events")


def backfill_summaries(start_date: datetime.date, end_date: datetime.date):
    """
    Backfill summaries for a date range (for initial setup)
    
    Usage:
    from datetime import date
    from app.tasks.analytics_aggregation import backfill_summaries
    backfill_summaries(date(2025, 10, 1), date(2025, 10, 17))
    """
    logger.info(f"Backfilling summaries from {start_date} to {end_date}")
    
    with Session(engine) as session:
        tenants = session.exec(
            select(Event.tenant_id).distinct()
        ).all()
        
        current_date = start_date
        while current_date <= end_date:
            for tenant_id in tenants:
                try:
                    aggregate_events_to_summary(session, current_date, tenant_id)
                except Exception as e:
                    logger.error(f"Failed to backfill {current_date}, tenant {tenant_id}: {e}")
            
            current_date += timedelta(days=1)
    
    logger.info("Backfill complete")


if __name__ == "__main__":
    # Run aggregation
    run_daily_aggregation()
