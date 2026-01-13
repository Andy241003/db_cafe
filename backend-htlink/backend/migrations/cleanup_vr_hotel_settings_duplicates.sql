-- ============================================================================
-- Migration: Remove Duplicate Fields from vr_hotel_settings
-- Date: 2026-01-12
-- Description: Remove fields that duplicate data from properties table
--              Keep only VR-specific fields (logo, favicon, primary_color, SEO)
-- ============================================================================

USE hotellink360_db;

-- Step 1: Backup current table
CREATE TABLE IF NOT EXISTS vr_hotel_settings_backup_20260112 AS 
SELECT * FROM vr_hotel_settings;

-- Step 2: Drop columns that duplicate properties table data
-- These fields will be read from properties table instead

ALTER TABLE vr_hotel_settings
  DROP COLUMN IF EXISTS hotel_name_vi,
  DROP COLUMN IF EXISTS hotel_name_en,
  DROP COLUMN IF EXISTS slogan_vi,
  DROP COLUMN IF EXISTS slogan_en,
  DROP COLUMN IF EXISTS default_language,
  DROP COLUMN IF EXISTS timezone,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS website,
  DROP COLUMN IF EXISTS facebook_url,
  DROP COLUMN IF EXISTS instagram_url,
  DROP COLUMN IF EXISTS youtube_url,
  DROP COLUMN IF EXISTS tripadvisor_url;

-- Step 3: Verify remaining structure
-- Should only have: id, tenant_id, property_id, primary_color, 
--                   logo_media_id, favicon_media_id, settings_json, 
--                   created_at, updated_at

SHOW COLUMNS FROM vr_hotel_settings;

-- Step 4: Verification query
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'hotellink360_db'
  AND TABLE_NAME = 'vr_hotel_settings'
ORDER BY ORDINAL_POSITION;

-- ============================================================================
-- Expected Final Structure:
-- ============================================================================
-- id                bigint       PK AUTO_INCREMENT
-- tenant_id         bigint       FK -> tenants(id)
-- property_id       bigint       FK -> properties(id)
-- primary_color     varchar(20)  DEFAULT '#3b82f6'
-- logo_media_id     bigint       FK -> media_files(id), NULL
-- favicon_media_id  bigint       FK -> media_files(id), NULL
-- settings_json     json         NULL (for SEO, flexible settings)
-- created_at        datetime     DEFAULT CURRENT_TIMESTAMP
-- updated_at        datetime     ON UPDATE CURRENT_TIMESTAMP
-- ============================================================================

-- ============================================================================
-- Rollback Script (if needed):
-- ============================================================================
-- DROP TABLE IF EXISTS vr_hotel_settings;
-- RENAME TABLE vr_hotel_settings_backup_20260112 TO vr_hotel_settings;
-- ============================================================================

-- ============================================================================
-- Data Migration Notes:
-- ============================================================================
-- Removed fields can now be accessed from properties table:
-- - hotel_name_vi/en   → properties.property_name
-- - slogan_vi/en       → properties.slogan, properties.description
-- - default_language   → properties.default_locale
-- - timezone           → properties.timezone
-- - address/phone/email → properties.address, properties.phone_number, properties.email
-- - social media URLs  → properties.facebook_url, instagram_url, youtube_url
--
-- VR-specific fields retained:
-- - primary_color      → VR Hotel brand color (may differ from property)
-- - logo_media_id      → VR Hotel logo (may differ from property)
-- - favicon_media_id   → VR Hotel favicon
-- - settings_json      → VR-specific SEO and flexible settings
-- ============================================================================
