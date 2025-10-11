#!/usr/bin/env python3
"""
Seed Analytics Data Script

Tạo sample analytics data để test Analytics page

Cách dùng:
    python seed_analytics_data.py

Hoặc chạy trong Docker:
    docker-compose exec backend python seed_analytics_data.py
"""

import sys
import random
from datetime import datetime, timedelta
from sqlmodel import Session, select

# Add app to path
sys.path.insert(0, '/app')

from app.core.db import engine
from app.models import Property, Event, EventType, DeviceType
import hashlib


def hash_ip(ip: str) -> str:
    """Hash IP address for privacy"""
    return hashlib.sha256(ip.encode()).hexdigest()[:64]


def generate_random_ip() -> str:
    """Generate random IP address"""
    return f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}"


def seed_analytics_data(num_events: int = 500, days_back: int = 30):
    """
    Seed analytics data
    
    Args:
        num_events: Number of events to create
        days_back: How many days back to create events
    """
    
    print(f"🚀 Starting Analytics Data Seeding...")
    print(f"📊 Creating {num_events} events over {days_back} days")
    
    with Session(engine) as session:
        # Get first property (or create one if none exists)
        property_obj = session.exec(select(Property)).first()
        
        if not property_obj:
            print("❌ No properties found! Please create a property first.")
            print("\nTo create a property:")
            print("1. Go to Properties page in admin panel")
            print("2. Click 'Add Property'")
            print("3. Fill in the details and save")
            print("\nOr run this SQL:")
            print("""
INSERT INTO properties (property_name, tracking_key, tenant_id, created_at)
VALUES ('Boton Blue Hotel & Spa', 'boton_blue_tracking', 1, CURRENT_TIMESTAMP);
            """)
            return
        
        print(f"✅ Using property: {property_obj.property_name}")
        print(f"🔑 Tracking key: {property_obj.tracking_key}")
        
        # Event types distribution (weighted)
        event_types = [
            (EventType.PAGE_VIEW, 70),  # 70% page views
            (EventType.CLICK, 25),       # 25% clicks
            (EventType.SHARE, 5)         # 5% shares
        ]
        
        # Device types distribution (weighted)
        device_types = [
            (DeviceType.DESKTOP, 50),    # 50% desktop
            (DeviceType.MOBILE, 40),     # 40% mobile
            (DeviceType.TABLET, 10)      # 10% tablet
        ]
        
        # User agents
        user_agents = {
            DeviceType.DESKTOP: [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
            ],
            DeviceType.MOBILE: [
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
                'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'
            ],
            DeviceType.TABLET: [
                'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
                'Mozilla/5.0 (Linux; Android 13; SM-X900) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
            ]
        }
        
        # Generate unique IPs for realistic unique visitor count
        unique_ips = [generate_random_ip() for _ in range(num_events // 3)]
        
        events_created = 0
        
        for i in range(num_events):
            # Random date within the last N days
            days_ago = random.randint(0, days_back)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            
            created_at = datetime.utcnow() - timedelta(
                days=days_ago,
                hours=hours_ago,
                minutes=minutes_ago
            )
            
            # Weighted random selection for event type
            event_type = random.choices(
                [et for et, _ in event_types],
                weights=[w for _, w in event_types]
            )[0]
            
            # Weighted random selection for device type
            device = random.choices(
                [dt for dt, _ in device_types],
                weights=[w for _, w in device_types]
            )[0]
            
            # Random user agent based on device
            user_agent = random.choice(user_agents[device])
            
            # Random IP (reuse some IPs to simulate returning visitors)
            ip = random.choice(unique_ips)
            ip_hash = hash_ip(ip)
            
            # Create event
            event = Event(
                tenant_id=property_obj.tenant_id,
                property_id=property_obj.id,
                event_type=event_type,
                device=device,
                user_agent=user_agent,
                ip_hash=ip_hash,
                created_at=created_at
            )
            
            session.add(event)
            events_created += 1
            
            # Commit in batches for better performance
            if (i + 1) % 100 == 0:
                session.commit()
                print(f"✅ Progress: {i + 1}/{num_events} events created")
        
        # Final commit
        session.commit()
        
        print("\n" + "=" * 60)
        print("📊 ANALYTICS DATA SEEDING COMPLETE")
        print("=" * 60)
        print(f"✅ Created: {events_created} events")
        print(f"🏨 Property: {property_obj.property_name}")
        print(f"📅 Date range: {days_back} days back from today")
        print(f"👥 Unique IPs: {len(unique_ips)}")
        print("=" * 60)
        
        # Show distribution
        print("\n📊 Event Distribution:")
        for event_type, weight in event_types:
            count = session.exec(
                select(Event).where(
                    Event.property_id == property_obj.id,
                    Event.event_type == event_type
                )
            ).all()
            print(f"  {event_type.value}: {len(count)} events (~{weight}%)")
        
        print("\n📱 Device Distribution:")
        for device_type, weight in device_types:
            count = session.exec(
                select(Event).where(
                    Event.property_id == property_obj.id,
                    Event.device == device_type
                )
            ).all()
            print(f"  {device_type.value}: {len(count)} events (~{weight}%)")
        
        print("\n💡 Next steps:")
        print("1. Go to Analytics page in admin panel")
        print("2. Refresh the page (Ctrl + R)")
        print("3. You should see charts and stats populated with data")
        print("\n🎉 Done!")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Seed analytics data')
    parser.add_argument(
        '--events',
        type=int,
        default=500,
        help='Number of events to create (default: 500)'
    )
    parser.add_argument(
        '--days',
        type=int,
        default=30,
        help='Number of days back to create events (default: 30)'
    )
    
    args = parser.parse_args()
    
    try:
        seed_analytics_data(num_events=args.events, days_back=args.days)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

