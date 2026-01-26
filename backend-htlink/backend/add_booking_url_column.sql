-- Migration: Add booking_url column to vr_rooms table
-- Date: 2026-01-26
-- Description: Adds booking_url field to store direct booking links for rooms

-- Check if column exists (optional verification step)
SELECT COUNT(*) as column_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'vr_rooms'
AND COLUMN_NAME = 'booking_url';

-- Add the column
ALTER TABLE vr_rooms
ADD COLUMN booking_url VARCHAR(500) NULL
AFTER vr_link;

-- Verify the column was added
DESCRIBE vr_rooms;
