-- =====================================================================
-- CAFE MANAGEMENT SYSTEM - COMPLETE MIGRATION
-- =====================================================================
-- Database: hotellink360_db
-- Created: 2026-03-10
-- Description: Comprehensive database schema for Cafe Management System
--              Includes multi-tenant support, multilingual content, menu management,
--              events, careers, promotions, spaces, and content sections
-- =====================================================================

-- =====================================================================
-- SECTION 1: DATABASE CONFIGURATION
-- =====================================================================

CREATE DATABASE IF NOT EXISTS hotellink360_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE hotellink360_db;

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
SET foreign_key_checks = 0;

-- =====================================================================
-- SECTION 2: CORE SAAS TABLES
-- =====================================================================

-- Plans table (subscription plans)
CREATE TABLE IF NOT EXISTS `plans` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `features_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tenants table (multi-tenant support)
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `plan_id` bigint DEFAULT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `default_locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `fallback_locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `settings_json` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `fk_tenants_plan` (`plan_id`),
  CONSTRAINT `fk_tenants_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Locales table (supported languages)
CREATE TABLE IF NOT EXISTS `locales` (
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `native_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin users table
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('OWNER','ADMIN','EDITOR','VIEWER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EDITOR',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`tenant_id`,`email`),
  KEY `fk_users_tenant` (`tenant_id`),
  CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media files table (centralized media management)
CREATE TABLE IF NOT EXISTS `media_files` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `uploader_id` bigint DEFAULT NULL,
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
  KEY `idx_media_tenant` (`tenant_id`,`kind`),
  CONSTRAINT `fk_media_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings table (key-value configuration)
CREATE TABLE IF NOT EXISTS `settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL DEFAULT '0',
  `property_id` bigint NOT NULL DEFAULT '0',
  `key_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value_json` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_settings2` (`tenant_id`,`property_id`,`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity logs table
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resource_id` bigint DEFAULT NULL,
  `details_json` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_logs_tenant` (`tenant_id`),
  KEY `idx_activity_logs_user` (`user_id`),
  KEY `idx_activity_logs_created_at` (`created_at`),
  CONSTRAINT `fk_activity_logs_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 3: CAFE CORE TABLES
-- =====================================================================

-- Cafe Settings (main configuration)
CREATE TABLE IF NOT EXISTS `cafe_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `cafe_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slogan` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#6f4e37',
  `secondary_color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#d4a574',
  `background_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff',
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facebook_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `youtube_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tiktok_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  `business_hours` json DEFAULT NULL,
  `settings_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_settings_tenant_id` (`tenant_id`),
  CONSTRAINT `fk_cafe_settings_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_settings_logo` FOREIGN KEY (`logo_media_id`) REFERENCES `media_files` (`id`),
  CONSTRAINT `fk_cafe_settings_favicon` FOREIGN KEY (`favicon_media_id`) REFERENCES `media_files` (`id`),
  CONSTRAINT `fk_cafe_settings_cover` FOREIGN KEY (`cover_image_media_id`) REFERENCES `media_files` (`id`),
  CONSTRAINT `fk_cafe_settings_meta_image_media_id` FOREIGN KEY (`meta_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Page Settings (per-page configuration)
CREATE TABLE IF NOT EXISTS `cafe_page_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `page_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'home, about, menu, events, careers, contact',
  `is_displaying` tinyint(1) NOT NULL DEFAULT '1',
  `vr360_link` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vr_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `settings_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_page_settings_tenant_id` (`tenant_id`),
  KEY `ix_cafe_page_settings_page_code` (`page_code`),
  CONSTRAINT `fk_cafe_page_settings_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 4: CAFE BRANCHES (LOCATIONS)
-- =====================================================================

-- Cafe Branches
CREATE TABLE IF NOT EXISTS `cafe_branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
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
  UNIQUE KEY `uq_cafe_branches_tenant_code` (`tenant_id`,`code`),
  KEY `ix_cafe_branches_tenant_id` (`tenant_id`),
  KEY `ix_cafe_branches_code` (`code`),
  CONSTRAINT `fk_cafe_branches_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_branches_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Branch Translations
CREATE TABLE IF NOT EXISTS `cafe_branch_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_branch_translations_branch_locale` (`branch_id`,`locale`),
  KEY `ix_cafe_branch_translations_branch_id` (`branch_id`),
  KEY `ix_cafe_branch_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_branch_translations_branch` FOREIGN KEY (`branch_id`) REFERENCES `cafe_branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Branch Media
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
  CONSTRAINT `fk_cafe_branch_media_branch` FOREIGN KEY (`branch_id`) REFERENCES `cafe_branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_branch_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 5: CAFE MENU MANAGEMENT
-- =====================================================================

-- Cafe Menu Categories
CREATE TABLE IF NOT EXISTS `cafe_menu_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon_media_id` bigint DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_menu_categories_tenant_code` (`tenant_id`,`code`),
  KEY `ix_cafe_menu_categories_tenant_id` (`tenant_id`),
  KEY `ix_cafe_menu_categories_code` (`code`),
  KEY `fk_cafe_menu_categories_icon_media` (`icon_media_id`),
  CONSTRAINT `fk_cafe_menu_categories_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_menu_categories_icon_media` FOREIGN KEY (`icon_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Menu Category Translations
CREATE TABLE IF NOT EXISTS `cafe_menu_category_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_menu_category_translations_category_locale` (`category_id`,`locale`),
  KEY `ix_cafe_menu_category_translations_category_id` (`category_id`),
  KEY `ix_cafe_menu_category_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_menu_category_translations_category` FOREIGN KEY (`category_id`) REFERENCES `cafe_menu_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Menu Items
CREATE TABLE IF NOT EXISTS `cafe_menu_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `category_id` int NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
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
  UNIQUE KEY `uq_cafe_menu_items_tenant_code` (`tenant_id`,`code`),
  KEY `ix_cafe_menu_items_tenant_id` (`tenant_id`),
  KEY `ix_cafe_menu_items_category_id` (`category_id`),
  KEY `ix_cafe_menu_items_code` (`code`),
  KEY `ix_cafe_menu_items_status` (`status`),
  CONSTRAINT `fk_cafe_menu_items_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_menu_items_category` FOREIGN KEY (`category_id`) REFERENCES `cafe_menu_categories` (`id`),
  CONSTRAINT `fk_cafe_menu_items_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Menu Item Translations
CREATE TABLE IF NOT EXISTS `cafe_menu_item_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ingredients` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_menu_item_translations_item_locale` (`item_id`,`locale`),
  KEY `ix_cafe_menu_item_translations_item_id` (`item_id`),
  KEY `ix_cafe_menu_item_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_menu_item_translations_item` FOREIGN KEY (`item_id`) REFERENCES `cafe_menu_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Menu Item Media
CREATE TABLE IF NOT EXISTS `cafe_menu_item_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `media_id` bigint NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_menu_item_media_item_id` (`item_id`),
  KEY `ix_cafe_menu_item_media_media_id` (`media_id`),
  CONSTRAINT `fk_cafe_menu_item_media_item` FOREIGN KEY (`item_id`) REFERENCES `cafe_menu_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_menu_item_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 6: CAFE EVENTS
-- =====================================================================

-- Cafe Events
CREATE TABLE IF NOT EXISTS `cafe_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
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
  UNIQUE KEY `uq_cafe_events_tenant_code` (`tenant_id`,`code`),
  KEY `ix_cafe_events_tenant_id` (`tenant_id`),
  KEY `ix_cafe_events_code` (`code`),
  KEY `ix_cafe_events_status` (`status`),
  KEY `ix_cafe_events_dates` (`start_date`,`end_date`),
  CONSTRAINT `fk_cafe_events_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_events_branch` FOREIGN KEY (`branch_id`) REFERENCES `cafe_branches` (`id`),
  CONSTRAINT `fk_cafe_events_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Event Translations
CREATE TABLE IF NOT EXISTS `cafe_event_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `details` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_event_translations_event_locale` (`event_id`,`locale`),
  KEY `ix_cafe_event_translations_event_id` (`event_id`),
  KEY `ix_cafe_event_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_event_translations_event` FOREIGN KEY (`event_id`) REFERENCES `cafe_events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Event Media
CREATE TABLE IF NOT EXISTS `cafe_event_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `media_id` bigint NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_event_media_event_id` (`event_id`),
  KEY `ix_cafe_event_media_media_id` (`media_id`),
  CONSTRAINT `fk_cafe_event_media_event` FOREIGN KEY (`event_id`) REFERENCES `cafe_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_event_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 7: CAFE CAREERS
-- =====================================================================

-- Cafe Careers
CREATE TABLE IF NOT EXISTS `cafe_careers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
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
  UNIQUE KEY `uq_cafe_careers_tenant_code` (`tenant_id`,`code`),
  KEY `ix_cafe_careers_tenant_id` (`tenant_id`),
  KEY `ix_cafe_careers_code` (`code`),
  KEY `ix_cafe_careers_status` (`status`),
  KEY `ix_cafe_careers_display_order` (`display_order`),
  CONSTRAINT `fk_cafe_careers_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_careers_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Career Translations
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
  UNIQUE KEY `uq_cafe_career_translations_career_locale` (`career_id`,`locale`),
  KEY `ix_cafe_career_translations_career_id` (`career_id`),
  KEY `ix_cafe_career_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_career_translations_career` FOREIGN KEY (`career_id`) REFERENCES `cafe_careers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Career Media
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
  CONSTRAINT `fk_cafe_career_media_career` FOREIGN KEY (`career_id`) REFERENCES `cafe_careers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_career_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 8: CAFE PROMOTIONS
-- =====================================================================

-- Cafe Promotions
CREATE TABLE IF NOT EXISTS `cafe_promotions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
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
  UNIQUE KEY `uq_cafe_promotions_tenant_code` (`tenant_id`,`code`),
  KEY `ix_cafe_promotions_tenant_id` (`tenant_id`),
  KEY `ix_cafe_promotions_code` (`code`),
  KEY `ix_cafe_promotions_status` (`status`),
  KEY `ix_cafe_promotions_valid_dates` (`valid_from`,`valid_to`),
  KEY `ix_cafe_promotions_display_order` (`display_order`),
  CONSTRAINT `fk_cafe_promotions_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_promotions_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Promotion Translations
CREATE TABLE IF NOT EXISTS `cafe_promotion_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `promotion_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `terms_and_conditions` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_promotion_translations_promotion_locale` (`promotion_id`,`locale`),
  KEY `ix_cafe_promotion_translations_promotion_id` (`promotion_id`),
  KEY `ix_cafe_promotion_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_promotion_translations_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `cafe_promotions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Promotion Media
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
  CONSTRAINT `fk_cafe_promotion_media_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `cafe_promotions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_promotion_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 9: CAFE SPACES
-- =====================================================================

-- Cafe Spaces
CREATE TABLE IF NOT EXISTS `cafe_spaces` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
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
  UNIQUE KEY `uq_cafe_spaces_tenant_code` (`tenant_id`,`code`),
  KEY `ix_cafe_spaces_tenant_id` (`tenant_id`),
  KEY `ix_cafe_spaces_code` (`code`),
  KEY `ix_cafe_spaces_display_order` (`display_order`),
  CONSTRAINT `fk_cafe_spaces_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_spaces_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Space Translations
CREATE TABLE IF NOT EXISTS `cafe_space_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `space_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_space_translations_space_locale` (`space_id`,`locale`),
  KEY `ix_cafe_space_translations_space_id` (`space_id`),
  KEY `ix_cafe_space_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_space_translations_space` FOREIGN KEY (`space_id`) REFERENCES `cafe_spaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Space Media
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
  CONSTRAINT `fk_cafe_space_media_space` FOREIGN KEY (`space_id`) REFERENCES `cafe_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_space_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 10: CAFE CONTENT SECTIONS
-- =====================================================================

-- Cafe Content Sections (for Home/About pages)
CREATE TABLE IF NOT EXISTS `cafe_content_sections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
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
  KEY `ix_cafe_content_sections_tenant_id` (`tenant_id`),
  KEY `ix_cafe_content_sections_page_code` (`page_code`),
  KEY `ix_cafe_content_sections_section_type` (`section_type`),
  KEY `ix_cafe_content_sections_display_order` (`display_order`),
  KEY `ix_cafe_content_sections_page_section` (`page_code`,`section_type`),
  CONSTRAINT `fk_cafe_content_sections_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_content_sections_image` FOREIGN KEY (`image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Content Section Translations
CREATE TABLE IF NOT EXISTS `cafe_content_section_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_content_section_translations_section_locale` (`section_id`,`locale`),
  KEY `ix_cafe_content_section_translations_section_id` (`section_id`),
  KEY `ix_cafe_content_section_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_content_section_translations_section` FOREIGN KEY (`section_id`) REFERENCES `cafe_content_sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SECTION 11: SEED DATA
-- =====================================================================

-- Insert default locales
INSERT INTO `locales` (`code`, `name`, `native_name`) VALUES
('en', 'English', 'English'),
('vi', 'Vietnamese', 'Tiếng Việt'),
('ja', 'Japanese', '日本語'),
('ko', 'Korean', '한국어'),
('zh', 'Chinese', '中文')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `native_name` = VALUES(`native_name`);

-- Insert default plan
INSERT INTO `plans` (`code`, `name`, `features_json`) VALUES
('basic', 'Basic Plan', '{"max_branches": 5, "max_menu_items": 100, "analytics": true}'),
('premium', 'Premium Plan', '{"max_branches": 20, "max_menu_items": 500, "analytics": true, "advanced_features": true}'),
('enterprise', 'Enterprise Plan', '{"max_branches": -1, "max_menu_items": -1, "analytics": true, "advanced_features": true, "white_label": true}')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `features_json` = VALUES(`features_json`);

-- =====================================================================
-- RESTORE FOREIGN KEY CHECKS
-- =====================================================================

SET foreign_key_checks = 1;

-- =====================================================================
-- COMPLETION MESSAGE
-- =====================================================================

SELECT 'Cafe Management System migration completed successfully!' AS message;
SELECT CONCAT('Total tables created: ', COUNT(*)) AS total_tables
FROM information_schema.tables 
WHERE table_schema = 'hotellink360_db' 
  AND table_name LIKE 'cafe_%';
