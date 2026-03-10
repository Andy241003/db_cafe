-- Migration: Add Cafe Spaces and Content Sections tables
-- Date: 2026-02-10

-- ==========================================
-- Cafe Spaces
-- ==========================================

-- Cafe Spaces (main table)
CREATE TABLE IF NOT EXISTS `cafe_spaces` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `code` varchar(50) NOT NULL,
  `primary_image_media_id` bigint DEFAULT NULL,
  `amenities_json` json DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `area_size` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '0',
  `attributes_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_spaces_tenant_code` (`tenant_id`, `code`),
  KEY `ix_cafe_spaces_tenant_id` (`tenant_id`),
  KEY `ix_cafe_spaces_code` (`code`),
  CONSTRAINT `fk_cafe_spaces_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_spaces_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Space Translations
CREATE TABLE IF NOT EXISTS `cafe_space_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `space_id` int NOT NULL,
  `locale` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_space_translations_space_locale` (`space_id`, `locale`),
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

-- ==========================================
-- Cafe Content Sections (for Home/About)
-- ==========================================

-- Cafe Content Sections (features, values, etc.)
CREATE TABLE IF NOT EXISTS `cafe_content_sections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `section_type` varchar(50) NOT NULL COMMENT 'feature, value, service, etc.',
  `page_code` varchar(50) NOT NULL COMMENT 'home, about',
  `icon` varchar(100) DEFAULT NULL,
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
  CONSTRAINT `fk_cafe_content_sections_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_content_sections_image` FOREIGN KEY (`image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Content Section Translations
CREATE TABLE IF NOT EXISTS `cafe_content_section_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_id` int NOT NULL,
  `locale` varchar(10) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `content` longtext,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_content_section_translations_section_locale` (`section_id`, `locale`),
  KEY `ix_cafe_content_section_translations_section_id` (`section_id`),
  KEY `ix_cafe_content_section_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_content_section_translations_section` FOREIGN KEY (`section_id`) REFERENCES `cafe_content_sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Indexes
-- ==========================================

-- Additional indexes for performance
CREATE INDEX `ix_cafe_spaces_display_order` ON `cafe_spaces` (`display_order`);
CREATE INDEX `ix_cafe_content_sections_display_order` ON `cafe_content_sections` (`display_order`);
CREATE INDEX `ix_cafe_content_sections_page_section` ON `cafe_content_sections` (`page_code`, `section_type`);
