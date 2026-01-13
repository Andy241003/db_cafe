-- Migration: Add vr_hotel_introductions table
-- Description: Create dedicated table for VR Hotel Introduction page content
-- Date: 2026-01-13

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- Drop table if exists (for development)
DROP TABLE IF EXISTS `vr_hotel_introductions`;

-- Create vr_hotel_introductions table
CREATE TABLE `vr_hotel_introductions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `property_id` bigint NOT NULL,
  `is_displaying` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Toggle display on/off',
  `vr360_link` varchar(500) DEFAULT NULL COMMENT 'VR360 tour link',
  `vr_title` varchar(255) DEFAULT NULL COMMENT 'VR360 section title',
  `content_json` json NOT NULL COMMENT 'Multi-language content: {"vi": {"title": "", "shortDescription": "", "detailedContent": ""}, "en": {...}}',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vr_intro` (`tenant_id`, `property_id`),
  KEY `idx_vr_intro_tenant` (`tenant_id`),
  KEY `idx_vr_intro_property` (`property_id`),
  KEY `idx_vr_intro_display` (`is_displaying`),
  CONSTRAINT `fk_vr_intro_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vr_intro_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='VR Hotel Introduction page content with multi-language support';

SET foreign_key_checks = 1;

-- Migration completed successfully
