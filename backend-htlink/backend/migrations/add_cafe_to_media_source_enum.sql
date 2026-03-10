-- Add 'cafe' to media_files source ENUM for Cafe CMS
-- Date: 2026-02-11

ALTER TABLE media_files 
MODIFY COLUMN source ENUM('travel', 'vr_hotel', 'general', 'cafe') 
DEFAULT 'general' 
COMMENT 'Source module that uploaded this media';
