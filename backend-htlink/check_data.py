#!/usr/bin/env python3

import sys
import os
sys.path.append('/app')

from sqlalchemy import create_engine, func, text
from sqlalchemy.orm import sessionmaker
import json

# Database connection
DATABASE_URL = "mysql+pymysql://hotel_user:hotel_password@db:3306/hotel_saas?charset=utf8mb4"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

print("=== Raw Events Query ===")
result = db.execute(text("SELECT * FROM events LIMIT 5"))
for row in result:
    print(f"ID: {row.id}, Type: {row.event_type}, Device: {row.device}, Tenant: {row.tenant_id}, Created: {row.created_at}")

print(f"\n=== Total Events Count ===")
count = db.execute(text("SELECT COUNT(*) as total FROM events")).scalar()
print(f"Total events: {count}")

print(f"\n=== Events by Date ===")
daily_result = db.execute(text("""
    SELECT DATE(created_at) as date, COUNT(*) as count 
    FROM events 
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 10
"""))
for row in daily_result:
    print(f"{row.date}: {row.count} events")

print(f"\n=== Device Distribution ===")
device_result = db.execute(text("""
    SELECT device, COUNT(*) as count 
    FROM events 
    GROUP BY device
"""))
for row in device_result:
    print(f"{row.device}: {row.count} events")

print(f"\n=== Event Types ===")
type_result = db.execute(text("""
    SELECT event_type, COUNT(*) as count 
    FROM events 
    GROUP BY event_type
"""))
for row in type_result:
    print(f"{row.event_type}: {row.count} events")

print(f"\n=== Unique Visitors (IP Hashes) ===")
unique_ips = db.execute(text("SELECT COUNT(DISTINCT ip_hash) as unique_count FROM events")).scalar()
print(f"Unique IP hashes: {unique_ips}")

db.close()