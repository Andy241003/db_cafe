-- ==========================================
-- VR Hotel Settings Migrations
-- Date: 2026-02-05
-- Description: Combined migrations for VR Hotel improvements
-- ==========================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ==========================================
-- Migration 1: Add background_color to vr_hotel_settings
-- ==========================================

-- Check if column exists before adding
SET @dbname = DATABASE();
SET @tablename = 'vr_hotel_settings';
SET @columnname = 'background_color';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT "Column already exists" AS message;',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` varchar(20) DEFAULT "#ffffff" COMMENT "Background color for VR Hotel interface" AFTER `primary_color`;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update existing records with default value
UPDATE `vr_hotel_settings` 
SET `background_color` = '#ffffff' 
WHERE `background_color` IS NULL;


-- ==========================================
-- Migration 2: Add meta_image_media_id to vr_hotel_seo
-- ==========================================

-- Check if column exists before adding
SET @tablename = 'vr_hotel_seo';
SET @columnname = 'meta_image_media_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT "Column already exists" AS message;',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` bigint DEFAULT NULL COMMENT "Meta image for social sharing (Open Graph, Twitter Card)" AFTER `meta_keywords`;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add foreign key constraint if not exists
SET @fkname = 'fk_vr_seo_meta_image';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'vr_hotel_seo'
      AND CONSTRAINT_NAME = @fkname
  ) > 0,
  'SELECT "Foreign key already exists" AS message;',
  CONCAT('ALTER TABLE `vr_hotel_seo` 
    ADD KEY `fk_vr_seo_meta_image` (`meta_image_media_id`),
    ADD CONSTRAINT `fk_vr_seo_meta_image` FOREIGN KEY (`meta_image_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;


-- ==========================================
-- Verification
-- ==========================================

-- Verify vr_hotel_settings structure
SELECT 
    'vr_hotel_settings' AS table_name,
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_DEFAULT,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'vr_hotel_settings'
  AND COLUMN_NAME IN ('primary_color', 'background_color')
ORDER BY ORDINAL_POSITION;

-- Verify vr_hotel_seo structure
SELECT 
    'vr_hotel_seo' AS table_name,
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_DEFAULT,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'vr_hotel_seo'
  AND COLUMN_NAME IN ('meta_keywords', 'meta_image_media_id')
ORDER BY ORDINAL_POSITION;

-- Sample data check
SELECT 
    id, 
    tenant_id, 
    property_id, 
    primary_color, 
    background_color,
    logo_media_id,
    favicon_media_id
FROM vr_hotel_settings 
LIMIT 3;

SELECT 
    id, 
    tenant_id, 
    property_id, 
    locale,
    meta_title,
    meta_image_media_id
FROM vr_hotel_seo 
LIMIT 3;

SET foreign_key_checks = 1;

-- Migration completed successfully!
SELECT 'VR Hotel Settings migrations completed successfully!' AS status;
