-- Migration: Create vr_hotel_policies table
-- Date: 2026-01-17
-- Description: Add Policies & Rules management for VR Hotel

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `vr_hotel_policies`;
CREATE TABLE `vr_hotel_policies` (
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
  UNIQUE KEY `uq_vr_policies` (`tenant_id`,`property_id`),
  KEY `idx_vr_policies_tenant` (`tenant_id`),
  KEY `idx_vr_policies_property` (`property_id`),
  KEY `idx_vr_policies_display` (`is_displaying`),
  CONSTRAINT `fk_vr_policies_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vr_policies_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='VR Hotel Policies & Rules page content with multi-language support';
