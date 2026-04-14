-- =====================================================
-- Migration: Sync Cafe Tenant Schema
-- =====================================================
-- Purpose:
-- 1. Align tenant-scoped cafe tables with backend models
-- 2. Restore tenant isolation for cafe settings/page settings
-- 3. Add tenant-aware media columns used by the admin FE
-- 4. Create missing cafe tables referenced by current endpoints
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Ensure at least one tenant exists so we can backfill legacy rows safely.
INSERT INTO `tenants` (`name`, `code`, `default_locale`, `fallback_locale`, `settings_json`, `is_active`, `created_at`, `updated_at`)
SELECT 'Default Cafe', 'default', 'en', 'en', NULL, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `tenants`);

SET @default_tenant_id = (SELECT `id` FROM `tenants` ORDER BY `id` LIMIT 1);

-- =====================================================
-- Shared tables
-- =====================================================

ALTER TABLE `admin_users`
  ADD COLUMN IF NOT EXISTS `tenant_id` bigint NULL DEFAULT NULL AFTER `id`;

UPDATE `admin_users`
SET `tenant_id` = @default_tenant_id
WHERE `tenant_id` IS NULL;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'admin_users'
        AND index_name = 'email'
    ),
    'ALTER TABLE `admin_users` DROP INDEX `email`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE `admin_users`
  ADD UNIQUE KEY `uq_admin_users_tenant_email` (`tenant_id`, `email`),
  ADD KEY `ix_admin_users_tenant_id` (`tenant_id`);

ALTER TABLE `media_files`
  ADD COLUMN IF NOT EXISTS `tenant_id` bigint NULL DEFAULT NULL AFTER `id`,
  ADD COLUMN IF NOT EXISTS `uploader_id` bigint NULL DEFAULT NULL AFTER `tenant_id`,
  ADD COLUMN IF NOT EXISTS `source` varchar(20) NULL DEFAULT 'general' AFTER `alt_text`,
  ADD COLUMN IF NOT EXISTS `entity_type` varchar(50) NULL DEFAULT NULL AFTER `source`,
  ADD COLUMN IF NOT EXISTS `entity_id` bigint NULL DEFAULT NULL AFTER `entity_type`,
  ADD COLUMN IF NOT EXISTS `folder` varchar(100) NULL DEFAULT NULL AFTER `entity_id`;

UPDATE `media_files`
SET `tenant_id` = @default_tenant_id
WHERE `tenant_id` IS NULL;

ALTER TABLE `media_files`
  ADD KEY `idx_media_tenant_kind` (`tenant_id`, `kind`),
  ADD KEY `idx_media_source_folder` (`source`, `folder`),
  ADD KEY `idx_media_entity` (`entity_type`, `entity_id`);

ALTER TABLE `settings`
  ADD COLUMN IF NOT EXISTS `tenant_id` bigint NOT NULL DEFAULT 0 AFTER `id`,
  ADD COLUMN IF NOT EXISTS `property_id` bigint NOT NULL DEFAULT 0 AFTER `tenant_id`;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'settings'
        AND index_name = 'key_name'
    ),
    'ALTER TABLE `settings` DROP INDEX `key_name`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE `settings`
  ADD UNIQUE KEY `uq_settings_tenant_property_key` (`tenant_id`, `property_id`, `key_name`),
  ADD KEY `ix_settings_tenant_property` (`tenant_id`, `property_id`);

-- =====================================================
-- Cafe settings
-- =====================================================

ALTER TABLE `cafe_settings`
  ADD COLUMN IF NOT EXISTS `tenant_id` bigint NULL DEFAULT NULL AFTER `id`;

UPDATE `cafe_settings`
SET `tenant_id` = @default_tenant_id
WHERE `tenant_id` IS NULL;

ALTER TABLE `cafe_settings`
  ADD UNIQUE KEY `uq_cafe_settings_tenant` (`tenant_id`),
  ADD KEY `ix_cafe_settings_tenant_id` (`tenant_id`);

ALTER TABLE `cafe_page_settings`
  ADD COLUMN IF NOT EXISTS `tenant_id` bigint NULL DEFAULT NULL AFTER `id`;

UPDATE `cafe_page_settings`
SET `tenant_id` = @default_tenant_id
WHERE `tenant_id` IS NULL;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'cafe_page_settings'
        AND index_name = 'page_code'
    ),
    'ALTER TABLE `cafe_page_settings` DROP INDEX `page_code`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE `cafe_page_settings`
  ADD UNIQUE KEY `uq_cafe_page_settings_tenant_page_code` (`tenant_id`, `page_code`),
  ADD KEY `ix_cafe_page_settings_tenant_page_code` (`tenant_id`, `page_code`);

-- =====================================================
-- Cafe core tenant columns
-- =====================================================

ALTER TABLE `cafe_branches`
  ADD COLUMN IF NOT EXISTS `tenant_id` bigint NULL DEFAULT NULL AFTER `id`;
UPDATE `cafe_branches` SET `tenant_id` = @default_tenant_id WHERE `tenant_id` IS NULL;
SET @sql = (
  SELECT IF(EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'cafe_branches' AND index_name = 'code'
  ), 'ALTER TABLE `cafe_branches` DROP INDEX `code`', 'SELECT 1')
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
ALTER TABLE `cafe_branches`
  ADD UNIQUE KEY `uq_cafe_branches_tenant_code` (`tenant_id`, `code`),
  ADD KEY `ix_cafe_branches_tenant_id` (`tenant_id`);

ALTER TABLE `cafe_menu_categories`
  ADD COLUMN IF NOT EXISTS `tenant_id` bigint NULL DEFAULT NULL AFTER `id`;
UPDATE `cafe_menu_categories` SET `tenant_id` = @default_tenant_id WHERE `tenant_id` IS NULL;
SET @sql = (
  SELECT IF(EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'cafe_menu_categories' AND index_name = 'code'
  ), 'ALTER TABLE `cafe_menu_categories` DROP INDEX `code`', 'SELECT 1')
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
ALTER TABLE `cafe_menu_categories`
  ADD UNIQUE KEY `uq_cafe_menu_categories_tenant_code` (`tenant_id`, `code`),
  ADD KEY `ix_cafe_menu_categories_tenant_id` (`tenant_id`);

ALTER TABLE `cafe_menu_items`
  ADD COLUMN IF NOT EXISTS `tenant_id` bigint NULL DEFAULT NULL AFTER `id`;
UPDATE `cafe_menu_items` SET `tenant_id` = @default_tenant_id WHERE `tenant_id` IS NULL;
SET @sql = (
  SELECT IF(EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'cafe_menu_items' AND index_name = 'code'
  ), 'ALTER TABLE `cafe_menu_items` DROP INDEX `code`', 'SELECT 1')
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
ALTER TABLE `cafe_menu_items`
  ADD UNIQUE KEY `uq_cafe_menu_items_tenant_code` (`tenant_id`, `code`),
  ADD KEY `ix_cafe_menu_items_tenant_id` (`tenant_id`);

ALTER TABLE `cafe_events`
  ADD COLUMN IF NOT EXISTS `tenant_id` bigint NULL DEFAULT NULL AFTER `id`;
UPDATE `cafe_events` SET `tenant_id` = @default_tenant_id WHERE `tenant_id` IS NULL;
SET @sql = (
  SELECT IF(EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'cafe_events' AND index_name = 'code'
  ), 'ALTER TABLE `cafe_events` DROP INDEX `code`', 'SELECT 1')
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
ALTER TABLE `cafe_events`
  ADD UNIQUE KEY `uq_cafe_events_tenant_code` (`tenant_id`, `code`),
  ADD KEY `ix_cafe_events_tenant_id` (`tenant_id`);

ALTER TABLE `cafe_careers`
  ADD COLUMN IF NOT EXISTS `tenant_id` bigint NULL DEFAULT NULL AFTER `id`;
UPDATE `cafe_careers` SET `tenant_id` = @default_tenant_id WHERE `tenant_id` IS NULL;
SET @sql = (
  SELECT IF(EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'cafe_careers' AND index_name = 'code'
  ), 'ALTER TABLE `cafe_careers` DROP INDEX `code`', 'SELECT 1')
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
ALTER TABLE `cafe_careers`
  ADD UNIQUE KEY `uq_cafe_careers_tenant_code` (`tenant_id`, `code`),
  ADD KEY `ix_cafe_careers_tenant_id` (`tenant_id`);

ALTER TABLE `cafe_promotions`
  ADD COLUMN IF NOT EXISTS `tenant_id` bigint NULL DEFAULT NULL AFTER `id`;
UPDATE `cafe_promotions` SET `tenant_id` = @default_tenant_id WHERE `tenant_id` IS NULL;
SET @sql = (
  SELECT IF(EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'cafe_promotions' AND index_name = 'code'
  ), 'ALTER TABLE `cafe_promotions` DROP INDEX `code`', 'SELECT 1')
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
ALTER TABLE `cafe_promotions`
  ADD UNIQUE KEY `uq_cafe_promotions_tenant_code` (`tenant_id`, `code`),
  ADD KEY `ix_cafe_promotions_tenant_id` (`tenant_id`);

ALTER TABLE `cafe_spaces`
  ADD COLUMN IF NOT EXISTS `tenant_id` bigint NULL DEFAULT NULL AFTER `id`;
UPDATE `cafe_spaces` SET `tenant_id` = @default_tenant_id WHERE `tenant_id` IS NULL;
SET @sql = (
  SELECT IF(EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'cafe_spaces' AND index_name = 'code'
  ), 'ALTER TABLE `cafe_spaces` DROP INDEX `code`', 'SELECT 1')
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
ALTER TABLE `cafe_spaces`
  ADD UNIQUE KEY `uq_cafe_spaces_tenant_code` (`tenant_id`, `code`),
  ADD KEY `ix_cafe_spaces_tenant_id` (`tenant_id`);

ALTER TABLE `cafe_content_sections`
  ADD COLUMN IF NOT EXISTS `tenant_id` bigint NULL DEFAULT NULL AFTER `id`;
UPDATE `cafe_content_sections` SET `tenant_id` = @default_tenant_id WHERE `tenant_id` IS NULL;
ALTER TABLE `cafe_content_sections`
  ADD KEY `ix_cafe_content_sections_tenant_id` (`tenant_id`);

-- =====================================================
-- Missing cafe tables used by current backend endpoints
-- =====================================================

CREATE TABLE IF NOT EXISTS `cafe_branch_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `locale` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_branch_translations_branch_locale` (`branch_id`, `locale`),
  KEY `ix_cafe_branch_translations_branch_id` (`branch_id`),
  KEY `ix_cafe_branch_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_branch_translations_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `cafe_branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_branch_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `media_id` bigint NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_branch_media_branch_id` (`branch_id`),
  KEY `ix_cafe_branch_media_media_id` (`media_id`),
  CONSTRAINT `fk_cafe_branch_media_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `cafe_branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_branch_media_media`
    FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_career_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `career_id` int NOT NULL,
  `media_id` bigint NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_career_media_career_id` (`career_id`),
  KEY `ix_cafe_career_media_media_id` (`media_id`),
  CONSTRAINT `fk_cafe_career_media_career`
    FOREIGN KEY (`career_id`) REFERENCES `cafe_careers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_career_media_media`
    FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_promotion_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `promotion_id` int NOT NULL,
  `media_id` bigint NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_promotion_media_promotion_id` (`promotion_id`),
  KEY `ix_cafe_promotion_media_media_id` (`media_id`),
  CONSTRAINT `fk_cafe_promotion_media_promotion`
    FOREIGN KEY (`promotion_id`) REFERENCES `cafe_promotions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_promotion_media_media`
    FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_space_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `space_id` int NOT NULL,
  `media_id` bigint NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_space_media_space_id` (`space_id`),
  KEY `ix_cafe_space_media_media_id` (`media_id`),
  CONSTRAINT `fk_cafe_space_media_space`
    FOREIGN KEY (`space_id`) REFERENCES `cafe_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_space_media_media`
    FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `code` varchar(50) NOT NULL,
  `service_type` varchar(50) NOT NULL,
  `availability` varchar(255) DEFAULT NULL,
  `price_information` varchar(255) DEFAULT NULL,
  `vr360_tour_url` varchar(1000) DEFAULT NULL,
  `booking_url` varchar(1000) DEFAULT NULL,
  `primary_image_media_id` bigint DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_services_tenant_code` (`tenant_id`, `code`),
  KEY `ix_cafe_services_tenant_id` (`tenant_id`),
  KEY `ix_cafe_services_service_type` (`service_type`),
  KEY `ix_cafe_services_display_order` (`display_order`),
  CONSTRAINT `fk_cafe_services_primary_image`
    FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_service_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service_id` int NOT NULL,
  `locale` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_service_translations_service_locale` (`service_id`, `locale`),
  KEY `ix_cafe_service_translations_service_id` (`service_id`),
  KEY `ix_cafe_service_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_service_translations_service`
    FOREIGN KEY (`service_id`) REFERENCES `cafe_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_service_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service_id` int NOT NULL,
  `media_id` bigint NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_service_media_service_id` (`service_id`),
  KEY `ix_cafe_service_media_media_id` (`media_id`),
  CONSTRAINT `fk_cafe_service_media_service`
    FOREIGN KEY (`service_id`) REFERENCES `cafe_services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_service_media_media`
    FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
