-- Migration: Add vr_link column to vr_dining table
-- Date: 2026-01-16
-- Description: Add dedicated vr_link column to store VR360 tour links for each dining venue

-- Add vr_link column
ALTER TABLE vr_dining 
ADD COLUMN vr_link VARCHAR(500) DEFAULT NULL 
AFTER operating_hours;

-- Migrate existing vr_link from attributes_json
UPDATE vr_dining
SET vr_link = JSON_UNQUOTE(JSON_EXTRACT(attributes_json, '$.vr_link'))
WHERE attributes_json IS NOT NULL
AND JSON_EXTRACT(attributes_json, '$.vr_link') IS NOT NULL;

-- Optional: Clean up attributes_json (uncomment if needed)
-- UPDATE vr_dining
-- SET attributes_json = JSON_REMOVE(attributes_json, '$.vr_link')
-- WHERE vr_link IS NOT NULL
-- AND attributes_json IS NOT NULL
-- AND JSON_EXTRACT(attributes_json, '$.vr_link') IS NOT NULL;
