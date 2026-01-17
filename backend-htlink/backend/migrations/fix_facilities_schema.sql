-- Fix facilities schema: Add vr_link and convert status enum to VARCHAR
-- This prevents SQLAlchemy enum caching issues

USE hotellink360_db;

-- Add vr_link column
ALTER TABLE vr_facilities 
ADD COLUMN vr_link VARCHAR(500) DEFAULT NULL 
AFTER operating_hours;

-- Convert status from ENUM to VARCHAR
ALTER TABLE vr_facilities 
MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';

-- Add CHECK constraint for status values
ALTER TABLE vr_facilities 
ADD CONSTRAINT chk_facility_status 
CHECK (status IN ('active', 'inactive', 'maintenance'));

-- Verify changes
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'hotellink360_db'
AND TABLE_NAME = 'vr_facilities'
AND COLUMN_NAME IN ('vr_link', 'status');
