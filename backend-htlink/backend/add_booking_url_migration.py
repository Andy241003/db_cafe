"""
Migration script to add booking_url column to vr_rooms table

Usage:
    python add_booking_url_migration.py
    
Or run the SQL directly in your database:
    ALTER TABLE vr_rooms ADD COLUMN booking_url VARCHAR(500) NULL AFTER vr_link;
"""
import os
import sys

def generate_sql():
    """Generate SQL migration script"""
    sql = """
-- Migration: Add booking_url column to vr_rooms table
-- Date: 2026-01-26

-- Check if column exists (run this first to verify)
SELECT COUNT(*) as column_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'vr_rooms'
AND COLUMN_NAME = 'booking_url';

-- Add the column (run this if column doesn't exist)
ALTER TABLE vr_rooms
ADD COLUMN booking_url VARCHAR(500) NULL
AFTER vr_link;

-- Verify the column was added
DESCRIBE vr_rooms;
"""
    return sql

if __name__ == "__main__":
    print("=" * 70)
    print("DATABASE MIGRATION: Add booking_url to vr_rooms table")
    print("=" * 70)
    print()
    print("Run this SQL in your database:")
    print()
    print(generate_sql())
    print()
    print("=" * 70)
    print("Or run it using Docker:")
    print("docker exec -it <mysql_container> mysql -u <user> -p <database>")
    print("=" * 70)

