-- Migration: Add cafe_careers and cafe_promotions tables
-- Created: 2026-02-10
-- Description: Add database tables for Careers and Promotions with translation support

-- ============================================
-- CAREERS TABLES
-- ============================================

-- Main Careers table
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
  UNIQUE KEY `uq_cafe_careers_tenant_code` (`tenant_id`, `code`),
  KEY `ix_cafe_careers_tenant_id` (`tenant_id`),
  KEY `ix_cafe_careers_code` (`code`),
  KEY `ix_cafe_careers_status` (`status`),
  KEY `ix_cafe_careers_display_order` (`display_order`),
  KEY `fk_cafe_careers_primary_image` (`primary_image_media_id`),
  CONSTRAINT `fk_cafe_careers_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_careers_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Career translations table
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
  UNIQUE KEY `uq_cafe_career_translations_career_locale` (`career_id`, `locale`),
  KEY `ix_cafe_career_translations_career_id` (`career_id`),
  KEY `ix_cafe_career_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_career_translations_career` FOREIGN KEY (`career_id`) REFERENCES `cafe_careers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Career media table
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

-- ============================================
-- PROMOTIONS TABLES
-- ============================================

-- Main Promotions table
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
  UNIQUE KEY `uq_cafe_promotions_tenant_code` (`tenant_id`, `code`),
  KEY `ix_cafe_promotions_tenant_id` (`tenant_id`),
  KEY `ix_cafe_promotions_code` (`code`),
  KEY `ix_cafe_promotions_status` (`status`),
  KEY `ix_cafe_promotions_valid_dates` (`valid_from`, `valid_to`),
  KEY `ix_cafe_promotions_display_order` (`display_order`),
  KEY `fk_cafe_promotions_primary_image` (`primary_image_media_id`),
  CONSTRAINT `fk_cafe_promotions_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_promotions_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Promotion translations table
CREATE TABLE IF NOT EXISTS `cafe_promotion_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `promotion_id` int NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `terms_and_conditions` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_promotion_translations_promotion_locale` (`promotion_id`, `locale`),
  KEY `ix_cafe_promotion_translations_promotion_id` (`promotion_id`),
  KEY `ix_cafe_promotion_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_promotion_translations_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `cafe_promotions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Promotion media table
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
