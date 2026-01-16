-- Migration: Add vr_link column to vr_rooms table
-- Date: 2026-01-16
-- Description: Add VR360 link field for each room to store individual room VR tours

ALTER TABLE vr_rooms 
ADD COLUMN vr_link VARCHAR(500) DEFAULT NULL 
COMMENT 'VR360 panorama link for this specific room';

-- Update existing rooms that have vr_link in attributes_json
UPDATE vr_rooms 
SET vr_link = JSON_UNQUOTE(JSON_EXTRACT(attributes_json, '$.vr_link'))
WHERE JSON_EXTRACT(attributes_json, '$.vr_link') IS NOT NULL;

-- Optional: Remove vr_link from attributes_json after migration
-- UPDATE vr_rooms 
-- SET attributes_json = JSON_REMOVE(attributes_json, '$.vr_link')
-- WHERE JSON_EXTRACT(attributes_json, '$.vr_link') IS NOT NULL;
