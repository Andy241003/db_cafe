-- ====================================
-- VR HOTEL DATABASE MIGRATION
-- Created: 2026-01-08
-- Description: Add VR Hotel functionality to existing Travel Link system
-- ====================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ====================================
-- STEP 1: Extend existing tables
-- ====================================

-- Add VR Hotel enable flag to properties
ALTER TABLE `properties` 
ADD COLUMN `vr_hotel_enabled` TINYINT(1) NOT NULL DEFAULT 0 
COMMENT 'Enable VR Hotel features for this property' 
AFTER `tracking_key`;

ALTER TABLE `properties` 
ADD INDEX `idx_vr_enabled` (`vr_hotel_enabled`);

-- Add VR360 kind to media_files enum
ALTER TABLE `media_files` 
MODIFY COLUMN `kind` ENUM('image','video','file','icon','vr360') NOT NULL;

-- ====================================
-- STEP 2: VR Hotel Settings
-- ====================================

DROP TABLE IF EXISTS `vr_hotel_settings`;
CREATE TABLE `vr_hotel_settings` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenant_id` BIGINT NOT NULL,
  `property_id` BIGINT NOT NULL,
  `hotel_name_vi` VARCHAR(255) DEFAULT NULL,
  `hotel_name_en` VARCHAR(255) DEFAULT NULL,
  `slogan_vi` VARCHAR(255) DEFAULT NULL,
  `slogan_en` VARCHAR(255) DEFAULT NULL,
  `default_language` VARCHAR(10) DEFAULT 'vi',
  `timezone` VARCHAR(60) DEFAULT 'Asia/Ho_Chi_Minh',
  `currency` VARCHAR(10) DEFAULT 'VND',
  `primary_color` VARCHAR(20) DEFAULT '#3b82f6',
  `logo_media_id` BIGINT DEFAULT NULL,
  `favicon_media_id` BIGINT DEFAULT NULL,
  `settings_json` JSON DEFAULT NULL COMMENT 'Additional flexible settings',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vr_settings` (`tenant_id`, `property_id`),
  KEY `idx_vr_settings_tenant` (`tenant_id`),
  KEY `idx_vr_settings_property` (`property_id`),
  CONSTRAINT `fk_vr_settings_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vr_settings_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vr_settings_logo` FOREIGN KEY (`logo_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_vr_settings_favicon` FOREIGN KEY (`favicon_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ====================================
-- STEP 3: VR Hotel Contact
-- ====================================

DROP TABLE IF EXISTS `vr_hotel_contact`;
CREATE TABLE `vr_hotel_contact` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenant_id` BIGINT NOT NULL,
  `property_id` BIGINT NOT NULL,
  `address` VARCHAR(500) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `facebook_url` VARCHAR(255) DEFAULT NULL,
  `instagram_url` VARCHAR(255) DEFAULT NULL,
  `youtube_url` VARCHAR(255) DEFAULT NULL,
  `tripadvisor_url` VARCHAR(255) DEFAULT NULL,
  `map_latitude` DECIMAL(10,8) DEFAULT NULL,
  `map_longitude` DECIMAL(11,8) DEFAULT NULL,
  `google_map_url` VARCHAR(512) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vr_contact` (`tenant_id`, `property_id`),
  CONSTRAINT `fk_vr_contact_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vr_contact_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ====================================
-- STEP 4: VR Hotel SEO
-- ====================================

DROP TABLE IF EXISTS `vr_hotel_seo`;
CREATE TABLE `vr_hotel_seo` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenant_id` BIGINT NOT NULL,
  `property_id` BIGINT NOT NULL,
  `locale` VARCHAR(10) NOT NULL,
  `meta_title` VARCHAR(250) DEFAULT NULL,
  `meta_description` VARCHAR(500) DEFAULT NULL,
  `meta_keywords` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vr_seo` (`tenant_id`, `property_id`, `locale`),
  KEY `fk_vr_seo_locale` (`locale`),
  CONSTRAINT `fk_vr_seo_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vr_seo_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vr_seo_locale` FOREIGN KEY (`locale`) REFERENCES `locales` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ====================================
-- STEP 5: VR Rooms
-- ====================================

DROP TABLE IF EXISTS `vr_rooms`;
CREATE TABLE `vr_rooms` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenant_id` BIGINT NOT NULL,
  `property_id` BIGINT NOT NULL,
  `room_code` VARCHAR(50) NOT NULL COMMENT 'Room number/code',
  `room_type` VARCHAR(50) DEFAULT NULL COMMENT 'deluxe, suite, standard, etc.',
  `floor` INT DEFAULT NULL,
  `bed_type` VARCHAR(50) DEFAULT NULL COMMENT 'king, queen, twin, etc.',
  `capacity` INT DEFAULT NULL COMMENT 'Max guests',
  `size_sqm` DECIMAL(10,2) DEFAULT NULL,
  `price_per_night` DECIMAL(15,2) DEFAULT NULL,
  `status` ENUM('available','occupied','maintenance','inactive') DEFAULT 'available',
  `amenities_json` JSON DEFAULT NULL COMMENT 'Array of amenity codes',
  `attributes_json` JSON DEFAULT NULL COMMENT 'Additional flexible attributes',
  `display_order` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_room_code` (`tenant_id`, `property_id`, `room_code`),
  KEY `idx_room_tenant` (`tenant_id`),
  KEY `idx_room_property` (`property_id`),
  KEY `idx_room_type` (`room_type`),
  KEY `idx_room_status` (`status`),
  KEY `idx_room_order` (`display_order`),
  CONSTRAINT `fk_room_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_room_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `vr_room_translations`;
CREATE TABLE `vr_room_translations` (
  `room_id` BIGINT NOT NULL,
  `locale` VARCHAR(10) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `amenities_text` TEXT DEFAULT NULL COMMENT 'Human-readable amenities list',
  PRIMARY KEY (`room_id`, `locale`),
  KEY `fk_room_tr_locale` (`locale`),
  CONSTRAINT `fk_room_tr_room` FOREIGN KEY (`room_id`) REFERENCES `vr_rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_room_tr_locale` FOREIGN KEY (`locale`) REFERENCES `locales` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `vr_room_media`;
CREATE TABLE `vr_room_media` (
  `room_id` BIGINT NOT NULL,
  `media_id` BIGINT NOT NULL,
  `is_vr360` TINYINT(1) DEFAULT 0,
  `is_primary` TINYINT(1) DEFAULT 0,
  `sort_order` INT DEFAULT 100,
  PRIMARY KEY (`room_id`, `media_id`),
  KEY `fk_room_media_media` (`media_id`),
  CONSTRAINT `fk_room_media_room` FOREIGN KEY (`room_id`) REFERENCES `vr_rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_room_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ====================================
-- STEP 6: VR Dining
-- ====================================

DROP TABLE IF EXISTS `vr_dining`;
CREATE TABLE `vr_dining` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenant_id` BIGINT NOT NULL,
  `property_id` BIGINT NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `dining_type` VARCHAR(50) DEFAULT NULL COMMENT 'restaurant, bar, cafe, lounge',
  `cuisine_types` JSON DEFAULT NULL COMMENT 'Array: vietnamese, international, etc.',
  `capacity` INT DEFAULT NULL,
  `operating_hours` JSON DEFAULT NULL COMMENT 'Breakfast, lunch, dinner times',
  `status` ENUM('active','inactive','closed') DEFAULT 'active',
  `attributes_json` JSON DEFAULT NULL,
  `display_order` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dining_code` (`tenant_id`, `property_id`, `code`),
  KEY `idx_dining_tenant` (`tenant_id`),
  KEY `idx_dining_property` (`property_id`),
  KEY `idx_dining_status` (`status`),
  CONSTRAINT `fk_dining_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dining_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `vr_dining_translations`;
CREATE TABLE `vr_dining_translations` (
  `dining_id` BIGINT NOT NULL,
  `locale` VARCHAR(10) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`dining_id`, `locale`),
  KEY `fk_dining_tr_locale` (`locale`),
  CONSTRAINT `fk_dining_tr_dining` FOREIGN KEY (`dining_id`) REFERENCES `vr_dining` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dining_tr_locale` FOREIGN KEY (`locale`) REFERENCES `locales` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `vr_dining_media`;
CREATE TABLE `vr_dining_media` (
  `dining_id` BIGINT NOT NULL,
  `media_id` BIGINT NOT NULL,
  `is_vr360` TINYINT(1) DEFAULT 0,
  `is_primary` TINYINT(1) DEFAULT 0,
  `sort_order` INT DEFAULT 100,
  PRIMARY KEY (`dining_id`, `media_id`),
  KEY `fk_dining_media_media` (`media_id`),
  CONSTRAINT `fk_dining_media_dining` FOREIGN KEY (`dining_id`) REFERENCES `vr_dining` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dining_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ====================================
-- STEP 7: VR Facilities
-- ====================================

DROP TABLE IF EXISTS `vr_facilities`;
CREATE TABLE `vr_facilities` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenant_id` BIGINT NOT NULL,
  `property_id` BIGINT NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `facility_type` VARCHAR(50) DEFAULT NULL COMMENT 'pool, gym, spa, meeting_room, etc.',
  `operating_hours` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('active','inactive','maintenance') DEFAULT 'active',
  `attributes_json` JSON DEFAULT NULL,
  `display_order` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_facility_code` (`tenant_id`, `property_id`, `code`),
  KEY `idx_facility_tenant` (`tenant_id`),
  KEY `idx_facility_property` (`property_id`),
  KEY `idx_facility_status` (`status`),
  CONSTRAINT `fk_facility_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_facility_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `vr_facility_translations`;
CREATE TABLE `vr_facility_translations` (
  `facility_id` BIGINT NOT NULL,
  `locale` VARCHAR(10) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`facility_id`, `locale`),
  KEY `fk_facility_tr_locale` (`locale`),
  CONSTRAINT `fk_facility_tr_facility` FOREIGN KEY (`facility_id`) REFERENCES `vr_facilities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_facility_tr_locale` FOREIGN KEY (`locale`) REFERENCES `locales` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `vr_facility_media`;
CREATE TABLE `vr_facility_media` (
  `facility_id` BIGINT NOT NULL,
  `media_id` BIGINT NOT NULL,
  `is_vr360` TINYINT(1) DEFAULT 0,
  `is_primary` TINYINT(1) DEFAULT 0,
  `sort_order` INT DEFAULT 100,
  PRIMARY KEY (`facility_id`, `media_id`),
  KEY `fk_facility_media_media` (`media_id`),
  CONSTRAINT `fk_facility_media_facility` FOREIGN KEY (`facility_id`) REFERENCES `vr_facilities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_facility_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ====================================
-- STEP 8: VR Offers/Vouchers
-- ====================================

DROP TABLE IF EXISTS `vr_offers`;
CREATE TABLE `vr_offers` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenant_id` BIGINT NOT NULL,
  `property_id` BIGINT NOT NULL,
  `code` VARCHAR(50) NOT NULL COMMENT 'Voucher code',
  `discount_type` ENUM('percentage','fixed_amount','free_night') DEFAULT 'percentage',
  `discount_value` DECIMAL(15,2) DEFAULT NULL,
  `valid_from` DATE DEFAULT NULL,
  `valid_to` DATE DEFAULT NULL,
  `min_nights` INT DEFAULT 1,
  `max_uses` INT DEFAULT NULL,
  `current_uses` INT DEFAULT 0,
  `applicable_room_types` JSON DEFAULT NULL COMMENT 'Array of room_type values',
  `status` ENUM('active','inactive','expired') DEFAULT 'active',
  `attributes_json` JSON DEFAULT NULL,
  `display_order` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_offer_code` (`tenant_id`, `property_id`, `code`),
  KEY `idx_offer_tenant` (`tenant_id`),
  KEY `idx_offer_property` (`property_id`),
  KEY `idx_offer_dates` (`valid_from`, `valid_to`),
  KEY `idx_offer_status` (`status`),
  CONSTRAINT `fk_offer_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_offer_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `vr_offer_translations`;
CREATE TABLE `vr_offer_translations` (
  `offer_id` BIGINT NOT NULL,
  `locale` VARCHAR(10) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `terms_conditions` TEXT DEFAULT NULL,
  PRIMARY KEY (`offer_id`, `locale`),
  KEY `fk_offer_tr_locale` (`locale`),
  CONSTRAINT `fk_offer_tr_offer` FOREIGN KEY (`offer_id`) REFERENCES `vr_offers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_offer_tr_locale` FOREIGN KEY (`locale`) REFERENCES `locales` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ====================================
-- STEP 9: VR Content (Introduction, Policies, Rules)
-- ====================================

DROP TABLE IF EXISTS `vr_content`;
CREATE TABLE `vr_content` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenant_id` BIGINT NOT NULL,
  `property_id` BIGINT NOT NULL,
  `content_type` ENUM('introduction','policies','rules') NOT NULL,
  `locale` VARCHAR(10) NOT NULL,
  `title` VARCHAR(255) DEFAULT NULL,
  `content_html` MEDIUMTEXT DEFAULT NULL,
  `attributes_json` JSON DEFAULT NULL COMMENT 'Additional metadata',
  `display_order` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_content` (`tenant_id`, `property_id`, `content_type`, `locale`),
  KEY `idx_content_tenant` (`tenant_id`),
  KEY `idx_content_property` (`property_id`),
  KEY `idx_content_type` (`content_type`),
  KEY `fk_content_locale` (`locale`),
  FULLTEXT KEY `ft_content` (`title`, `content_html`),
  CONSTRAINT `fk_content_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_content_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_content_locale` FOREIGN KEY (`locale`) REFERENCES `locales` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ====================================
-- STEP 10: VR Languages (Supported languages per hotel)
-- ====================================

DROP TABLE IF EXISTS `vr_languages`;
CREATE TABLE `vr_languages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenant_id` BIGINT NOT NULL,
  `property_id` BIGINT NOT NULL,
  `locale` VARCHAR(10) NOT NULL,
  `is_default` TINYINT(1) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_language` (`tenant_id`, `property_id`, `locale`),
  KEY `idx_lang_property` (`property_id`),
  KEY `fk_lang_locale` (`locale`),
  CONSTRAINT `fk_lang_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lang_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lang_locale` FOREIGN KEY (`locale`) REFERENCES `locales` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET foreign_key_checks = 1;

-- ====================================
-- MIGRATION COMPLETE
-- ====================================

-- Summary:
-- ✅ Extended properties table with vr_hotel_enabled flag
-- ✅ Extended media_files enum with vr360 type
-- ✅ Created 19 new VR Hotel tables
-- ✅ All tables have tenant_id + property_id for multi-tenancy
-- ✅ Translation pattern follows Travel Link architecture
-- ✅ Media tables reuse existing media_files
-- ✅ JSON fields for flexibility
-- ✅ Proper indexes for performance
-- ✅ Foreign keys for data integrity
