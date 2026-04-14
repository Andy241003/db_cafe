-- =====================================================================
-- CAFE SINGLE-TENANT SYSTEM - SIMPLIFIED MIGRATION
-- =====================================================================
-- Database: hotellink360_db (hoặc cafe_db)
-- Created: 2026-04-02
-- Description: Simplified database schema for SINGLE CAFE
--              No multi-tenant, no plans, just pure cafe management
-- =====================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
SET foreign_key_checks = 0;

-- =====================================================================
-- SECTION 1: CORE TABLES (Simplified - No Tenant)
-- =====================================================================

-- Admin Users (Simple)
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('OWNER','ADMIN','EDITOR','VIEWER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ADMIN',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Locales (Languages support)
CREATE TABLE IF NOT EXISTS `locales` (
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `native_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Files (Centralized)
CREATE TABLE IF NOT EXISTS `media_files` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `kind` enum('image','video','file','icon') COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `size_bytes` bigint DEFAULT NULL,
  `alt_text` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_filename` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_media_kind` (`kind`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings (Simple Key-Value)
CREATE TABLE IF NOT EXISTS `settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `key_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `value_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resource_id` bigint DEFAULT NULL,
  `details_json` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_logs_user` (`user_id`),
  KEY `idx_activity_logs_created_at` (`created_at`),
  CONSTRAINT `fk_activity_logs_user` FOREIGN KEY (`user_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 2: CAFE CORE TABLES (NO tenant_id)
-- =====================================================================

-- Cafe Settings (The Cafe's Main Configuration)
CREATE TABLE IF NOT EXISTS `cafe_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cafe_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slogan` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `primary_color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#6f4e37',
  `secondary_color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#d4a574',
  `background_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff',
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `facebook_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `youtube_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tiktok_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zalo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `booking_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `messenger_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_media_id` bigint DEFAULT NULL,
  `favicon_media_id` bigint DEFAULT NULL,
  `cover_image_media_id` bigint DEFAULT NULL,
  `meta_title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_keywords` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_image_media_id` bigint DEFAULT NULL,
  `business_hours` json DEFAULT NULL COMMENT 'Mon-Sun opening hours',
  `settings_json` json DEFAULT NULL,
  `default_locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cafe_settings_logo` (`logo_media_id`),
  KEY `fk_cafe_settings_favicon` (`favicon_media_id`),
  KEY `fk_cafe_settings_cover` (`cover_image_media_id`),
  KEY `fk_cafe_settings_meta_image` (`meta_image_media_id`),
  CONSTRAINT `fk_cafe_settings_logo` FOREIGN KEY (`logo_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cafe_settings_favicon` FOREIGN KEY (`favicon_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cafe_settings_cover` FOREIGN KEY (`cover_image_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cafe_settings_meta_image` FOREIGN KEY (`meta_image_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Page Settings
CREATE TABLE IF NOT EXISTS `cafe_page_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `page_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE COMMENT 'home, about, menu, events, careers, contact',
  `is_displaying` tinyint(1) NOT NULL DEFAULT '1',
  `vr360_link` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vr_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `settings_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 3: CAFE BRANCHES (Locations)
-- =====================================================================

CREATE TABLE IF NOT EXISTS `cafe_branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  `google_maps_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_image_media_id` bigint DEFAULT NULL,
  `vr360_link` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '0',
  `attributes_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cafe_branches_primary_image` (`primary_image_media_id`),
  CONSTRAINT `fk_cafe_branches_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 4: CAFE MENU
-- =====================================================================

CREATE TABLE IF NOT EXISTS `cafe_menu_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon_media_id` bigint DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cafe_menu_categories_icon` (`icon_media_id`),
  CONSTRAINT `fk_cafe_menu_categories_icon` FOREIGN KEY (`icon_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_menu_category_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_category_locale` (`category_id`,`locale`),
  KEY `ix_locale` (`locale`),
  CONSTRAINT `fk_cat_translations_category` FOREIGN KEY (`category_id`) REFERENCES `cafe_menu_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_menu_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `price` decimal(10,2) DEFAULT NULL,
  `original_price` decimal(10,2) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available' COMMENT 'available, unavailable, out_of_stock',
  `sizes` json DEFAULT NULL COMMENT 'Available sizes with prices',
  `tags` json DEFAULT NULL COMMENT 'Tags like vegetarian, spicy, etc.',
  `calories` int DEFAULT NULL,
  `primary_image_media_id` bigint DEFAULT NULL,
  `is_bestseller` tinyint(1) NOT NULL DEFAULT '0',
  `is_new` tinyint(1) NOT NULL DEFAULT '0',
  `is_seasonal` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '0',
  `attributes_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_category_id` (`category_id`),
  KEY `fk_cafe_menu_items_primary_image` (`primary_image_media_id`),
  CONSTRAINT `fk_cafe_menu_items_category` FOREIGN KEY (`category_id`) REFERENCES `cafe_menu_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_menu_items_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_menu_item_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ingredients` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_item_locale` (`item_id`,`locale`),
  KEY `ix_locale` (`locale`),
  CONSTRAINT `fk_item_translations_item` FOREIGN KEY (`item_id`) REFERENCES `cafe_menu_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_menu_item_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `media_id` bigint NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_item_id` (`item_id`),
  KEY `ix_media_id` (`media_id`),
  CONSTRAINT `fk_item_media_item` FOREIGN KEY (`item_id`) REFERENCES `cafe_menu_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_item_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 5: CAFE EVENTS
-- =====================================================================

CREATE TABLE IF NOT EXISTS `cafe_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `start_time` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `end_time` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `location_text` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registration_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_participants` int DEFAULT NULL,
  `primary_image_media_id` bigint DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'upcoming' COMMENT 'upcoming, ongoing, completed, cancelled',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '0',
  `attributes_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_status` (`status`),
  KEY `ix_dates` (`start_date`,`end_date`),
  KEY `fk_cafe_events_branch` (`branch_id`),
  KEY `fk_cafe_events_image` (`primary_image_media_id`),
  CONSTRAINT `fk_cafe_events_branch` FOREIGN KEY (`branch_id`) REFERENCES `cafe_branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cafe_events_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_event_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `details` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_event_locale` (`event_id`,`locale`),
  CONSTRAINT `fk_event_translations_event` FOREIGN KEY (`event_id`) REFERENCES `cafe_events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_event_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `media_id` bigint NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_event_id` (`event_id`),
  KEY `ix_media_id` (`media_id`),
  CONSTRAINT `fk_event_media_event` FOREIGN KEY (`event_id`) REFERENCES `cafe_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_event_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 6: CAFE CAREERS
-- =====================================================================

CREATE TABLE IF NOT EXISTS `cafe_careers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `position` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employment_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'full-time, part-time, contract, internship',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_range` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `application_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `application_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_image_media_id` bigint DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open' COMMENT 'open, closed, filled',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '0',
  `deadline` date DEFAULT NULL,
  `attributes_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_status` (`status`),
  KEY `ix_display_order` (`display_order`),
  CONSTRAINT `fk_cafe_careers_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_career_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `career_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `requirements` text COLLATE utf8mb4_unicode_ci,
  `benefits` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_career_locale` (`career_id`,`locale`),
  CONSTRAINT `fk_career_translations_career` FOREIGN KEY (`career_id`) REFERENCES `cafe_careers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 7: CAFE PROMOTIONS
-- =====================================================================

CREATE TABLE IF NOT EXISTS `cafe_promotions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `promotion_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'discount, combo, voucher, seasonal',
  `discount_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'percentage, fixed_amount',
  `discount_value` decimal(10,2) DEFAULT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `min_order_value` decimal(10,2) DEFAULT NULL,
  `max_discount` decimal(10,2) DEFAULT NULL,
  `usage_limit` int DEFAULT NULL COMMENT 'Total times this promotion can be used',
  `usage_count` int NOT NULL DEFAULT '0' COMMENT 'How many times it has been used',
  `primary_image_media_id` bigint DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT 'active, inactive, expired',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '0',
  `attributes_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_status` (`status`),
  KEY `ix_valid_dates` (`valid_from`,`valid_to`),
  CONSTRAINT `fk_cafe_promotions_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_promotion_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `promotion_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `terms_and_conditions` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_promo_locale` (`promotion_id`,`locale`),
  CONSTRAINT `fk_promo_translations_promo` FOREIGN KEY (`promotion_id`) REFERENCES `cafe_promotions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 8: CAFE SPACES
-- =====================================================================

CREATE TABLE IF NOT EXISTS `cafe_spaces` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `primary_image_media_id` bigint DEFAULT NULL,
  `amenities_json` json DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `area_size` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '0',
  `attributes_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_display_order` (`display_order`),
  CONSTRAINT `fk_cafe_spaces_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_space_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `space_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_space_locale` (`space_id`,`locale`),
  CONSTRAINT `fk_space_translations_space` FOREIGN KEY (`space_id`) REFERENCES `cafe_spaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 9: CAFE CONTENT SECTIONS
-- =====================================================================

CREATE TABLE IF NOT EXISTS `cafe_content_sections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'feature, value, service, etc.',
  `page_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'home, about',
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_media_id` bigint DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '0',
  `attributes_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_page_section` (`page_code`,`section_type`),
  KEY `ix_display_order` (`display_order`),
  CONSTRAINT `fk_cafe_content_sections_image` FOREIGN KEY (`image_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cafe_content_section_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_content_locale` (`section_id`,`locale`),
  CONSTRAINT `fk_content_translations_section` FOREIGN KEY (`section_id`) REFERENCES `cafe_content_sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 10: SEED DATA
-- =====================================================================

-- Insert default locales
INSERT INTO `locales` (`code`, `name`, `native_name`) VALUES
('en', 'English', 'English'),
('vi', 'Vietnamese', 'Tiếng Việt'),
('ja', 'Japanese', '日本語'),
('ko', 'Korean', '한국어'),
('zh', 'Chinese', '中文')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `native_name` = VALUES(`native_name`);

-- Insert default admin user (you can change this)
INSERT INTO `admin_users` (`email`, `password_hash`, `full_name`, `role`, `is_active`) VALUES
('admin@cafe.local', '$2b$12$abcdefghijklmnopqrstuvwxyz', 'Cafe Administrator', 'OWNER', 1)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- Insert default cafe settings
INSERT INTO `cafe_settings` (`cafe_name`, `primary_color`, `secondary_color`, `background_color`, `default_locale`, `is_active`) VALUES
('My Cafe', '#6f4e37', '#d4a574', '#ffffff', 'en', 1)
ON DUPLICATE KEY UPDATE `cafe_name` = VALUES(`cafe_name`);

-- Insert default page settings
INSERT INTO `cafe_page_settings` (`page_code`, `is_displaying`) VALUES
('home', 1),
('about', 1),
('menu', 1),
('events', 1),
('careers', 1),
('contact', 1),
('gallery', 1),
('branches', 1)
ON DUPLICATE KEY UPDATE `is_displaying` = VALUES(`is_displaying`);

-- =====================================================================
-- FINALIZE
-- =====================================================================

SET foreign_key_checks = 1;

SELECT 'Cafe Single-Tenant migration completed successfully!' AS message;
SELECT CONCAT('Total tables created: ', COUNT(*)) AS total_tables
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name LIKE 'cafe_%' OR table_name IN ('admin_users', 'locales', 'media_files', 'settings', 'activity_logs');
