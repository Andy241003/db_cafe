-- Migration: Add background_color column to vr_hotel_settings
-- Date: 2026-02-05
-- Description: Add background_color field for customizable background colors in VR Hotel settings

-- Add background_color column
ALTER TABLE `vr_hotel_settings`
ADD COLUMN `background_color` varchar(20) DEFAULT '#ffffff' COMMENT 'Background color for VR Hotel interface'
AFTER `primary_color`;

-- Optional: Update existing records with default value
UPDATE `vr_hotel_settings` 
SET `background_color` = '#ffffff' 
WHERE `background_color` IS NULL;

-- Verify the change
SELECT id, tenant_id, property_id, primary_color, background_color 
FROM vr_hotel_settings 
LIMIT 5;
