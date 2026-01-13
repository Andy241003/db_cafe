-- ============================================================================
-- Database Optimization Migration Script
-- Date: 2026-01-10
-- Description: Optimize VR Hotel schema by removing duplicate language table,
--              adding foreign keys, indexes, and audit logging
-- Impact: VR Hotel module only - Travel Link unchanged
-- ============================================================================

-- Step 1: Backup existing data
-- IMPORTANT: Run this backup command before migration
-- mysqldump -u root -p hotellink360_db vr_languages > backup_vr_languages_20260110.sql

-- ============================================================================
-- PART 1: Create new property_locales table (replaces vr_languages)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `property_locales` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `property_id` bigint NOT NULL,
  `locale_code` varchar(10) COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'References locales.code',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_property_locale` (`tenant_id`, `property_id`, `locale_code`),
  KEY `idx_tenant_property` (`tenant_id`, `property_id`),
  KEY `idx_locale_code` (`locale_code`),
  KEY `idx_is_default` (`is_default`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_property_locales_tenant` 
    FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_property_locales_property` 
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_property_locales_locale` 
    FOREIGN KEY (`locale_code`) REFERENCES `locales` (`code`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Property-specific locale configuration (replaces vr_languages)';

-- ============================================================================
-- PART 2: Migrate data from vr_languages to property_locales
-- ============================================================================

INSERT INTO `property_locales` 
  (`tenant_id`, `property_id`, `locale_code`, `is_default`, `is_active`, `created_at`)
SELECT 
  vl.`tenant_id`,
  vl.`property_id`,
  vl.`locale`,
  vl.`is_default`,
  vl.`is_active`,
  CURRENT_TIMESTAMP
FROM `vr_languages` vl
WHERE EXISTS (
  -- Only migrate if locale exists in locales table
  SELECT 1 FROM `locales` l WHERE l.`code` = vl.`locale`
)
ON DUPLICATE KEY UPDATE
  `is_default` = VALUES(`is_default`),
  `is_active` = VALUES(`is_active`);

-- Verify migration
SELECT 
  'vr_languages' as source_table,
  COUNT(*) as record_count
FROM `vr_languages`
UNION ALL
SELECT 
  'property_locales' as source_table,
  COUNT(*) as record_count
FROM `property_locales`;

-- ============================================================================
-- PART 3: Drop old vr_languages table
-- ============================================================================

-- CAUTION: Only run after verifying data migration
-- Uncomment the line below when ready
-- DROP TABLE IF EXISTS `vr_languages`;

-- ============================================================================
-- PART 4: Add missing foreign key constraints to existing tables
-- ============================================================================

-- VR Hotel Posts - Add locale FK
ALTER TABLE `vr_hotel_posts`
  ADD CONSTRAINT `fk_vr_hotel_posts_locale` 
    FOREIGN KEY (`locale`) REFERENCES `locales` (`code`) ON DELETE RESTRICT;

-- VR Hotel Rooms - Add locale FK
ALTER TABLE `vr_hotel_rooms`
  ADD CONSTRAINT `fk_vr_hotel_rooms_locale` 
    FOREIGN KEY (`locale`) REFERENCES `locales` (`code`) ON DELETE RESTRICT;

-- VR Hotel Service Translations - Add locale FK
ALTER TABLE `vr_hotel_service_translations`
  ADD CONSTRAINT `fk_vr_service_translations_locale` 
    FOREIGN KEY (`locale`) REFERENCES `locales` (`code`) ON DELETE RESTRICT;

-- VR Hotel Facility Translations - Add locale FK
ALTER TABLE `vr_hotel_facility_translations`
  ADD CONSTRAINT `fk_vr_facility_translations_locale` 
    FOREIGN KEY (`locale`) REFERENCES `locales` (`code`) ON DELETE RESTRICT;

-- ============================================================================
-- PART 5: Add performance indexes
-- ============================================================================

-- Properties table indexes
ALTER TABLE `properties`
  ADD INDEX `idx_tenant_active` (`tenant_id`, `is_active`),
  ADD INDEX `idx_service_access` (`service_access`);

-- VR Hotel Posts indexes
ALTER TABLE `vr_hotel_posts`
  ADD INDEX `idx_property_locale_status` (`property_id`, `locale`, `status`),
  ADD INDEX `idx_created_at` (`created_at`);

-- VR Hotel Rooms indexes
ALTER TABLE `vr_hotel_rooms`
  ADD INDEX `idx_property_locale` (`property_id`, `locale`),
  ADD INDEX `idx_is_active` (`is_active`);

-- Activity Logs indexes (for better analytics performance)
ALTER TABLE `activity_logs`
  ADD INDEX `idx_tenant_property_created` (`tenant_id`, `property_id`, `created_at`),
  ADD INDEX `idx_event_type_created` (`event_type`, `created_at`);

-- Posts indexes (Travel Link)
ALTER TABLE `posts`
  ADD INDEX `idx_property_status_published` (`property_id`, `status`, `published_at`);

-- ============================================================================
-- PART 6: Optimize data types for better performance
-- ============================================================================

-- Change service_access from INT to TINYINT (saves space)
ALTER TABLE `users`
  MODIFY COLUMN `service_access` tinyint NOT NULL DEFAULT '0' 
  COMMENT '0=Travel Link, 1=VR Hotel, 2=Both';

-- Change boolean-like fields to TINYINT(1)
ALTER TABLE `vr_hotel_settings`
  MODIFY COLUMN `show_booking_widget` tinyint(1) NOT NULL DEFAULT '1',
  MODIFY COLUMN `enable_online_booking` tinyint(1) NOT NULL DEFAULT '1',
  MODIFY COLUMN `show_contact_form` tinyint(1) NOT NULL DEFAULT '1';

-- ============================================================================
-- PART 7: Create audit log table for VR Hotel operations
-- ============================================================================

CREATE TABLE IF NOT EXISTS `vr_audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `property_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `action` varchar(50) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN, etc.',
  `entity_type` varchar(50) NOT NULL COMMENT 'room, post, service, facility, etc.',
  `entity_id` bigint DEFAULT NULL,
  `old_values` json DEFAULT NULL COMMENT 'Previous state before change',
  `new_values` json DEFAULT NULL COMMENT 'New state after change',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_property` (`tenant_id`, `property_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_action_created` (`action`, `created_at`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_vr_audit_logs_tenant` 
    FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vr_audit_logs_property` 
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vr_audit_logs_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit trail for VR Hotel administrative actions';

-- ============================================================================
-- PART 8: Add helpful views for reporting
-- ============================================================================

-- View: Property locale summary
CREATE OR REPLACE VIEW `v_property_locale_summary` AS
SELECT 
  p.`id` AS property_id,
  p.`name` AS property_name,
  p.`tenant_id`,
  t.`name` AS tenant_name,
  COUNT(pl.`id`) AS locale_count,
  GROUP_CONCAT(
    CASE WHEN pl.`is_active` = 1 
    THEN CONCAT(pl.`locale_code`, IF(pl.`is_default` = 1, ' (default)', '')) 
    END 
    ORDER BY pl.`is_default` DESC, pl.`locale_code` 
    SEPARATOR ', '
  ) AS active_locales
FROM `properties` p
LEFT JOIN `property_locales` pl ON p.`id` = pl.`property_id`
LEFT JOIN `tenants` t ON p.`tenant_id` = t.`id`
WHERE p.`service_access` IN (1, 2) -- VR Hotel properties only
GROUP BY p.`id`, p.`name`, p.`tenant_id`, t.`name`;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check migration success
SELECT 
  'Migration Summary' AS info,
  (SELECT COUNT(*) FROM property_locales) AS property_locales_count,
  (SELECT COUNT(*) FROM vr_audit_logs) AS audit_logs_count,
  (SELECT COUNT(*) FROM v_property_locale_summary) AS vr_hotel_properties;

-- Check foreign key constraints
SELECT 
  TABLE_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'hotellink360_db'
  AND REFERENCED_TABLE_NAME IS NOT NULL
  AND TABLE_NAME IN ('property_locales', 'vr_hotel_posts', 'vr_hotel_rooms')
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- Check indexes
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ', ') AS columns
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'hotellink360_db'
  AND TABLE_NAME IN ('property_locales', 'properties', 'vr_hotel_posts', 'activity_logs')
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

/*
-- Only use if migration fails

-- Restore vr_languages from backup
-- mysql -u root -p hotellink360_db < backup_vr_languages_20260110.sql

-- Drop new table
DROP TABLE IF EXISTS `property_locales`;

-- Drop audit log
DROP TABLE IF EXISTS `vr_audit_logs`;

-- Drop view
DROP VIEW IF EXISTS `v_property_locale_summary`;

-- Remove foreign keys
ALTER TABLE `vr_hotel_posts` DROP FOREIGN KEY IF EXISTS `fk_vr_hotel_posts_locale`;
ALTER TABLE `vr_hotel_rooms` DROP FOREIGN KEY IF EXISTS `fk_vr_hotel_rooms_locale`;
ALTER TABLE `vr_hotel_service_translations` DROP FOREIGN KEY IF EXISTS `fk_vr_service_translations_locale`;
ALTER TABLE `vr_hotel_facility_translations` DROP FOREIGN KEY IF EXISTS `fk_vr_facility_translations_locale`;

-- Remove indexes
ALTER TABLE `properties` 
  DROP INDEX IF EXISTS `idx_tenant_active`,
  DROP INDEX IF EXISTS `idx_service_access`;
  
ALTER TABLE `vr_hotel_posts` 
  DROP INDEX IF EXISTS `idx_property_locale_status`,
  DROP INDEX IF EXISTS `idx_created_at`;
  
ALTER TABLE `vr_hotel_rooms` 
  DROP INDEX IF EXISTS `idx_property_locale`,
  DROP INDEX IF EXISTS `idx_is_active`;
  
ALTER TABLE `activity_logs` 
  DROP INDEX IF EXISTS `idx_tenant_property_created`,
  DROP INDEX IF EXISTS `idx_event_type_created`;
  
ALTER TABLE `posts` 
  DROP INDEX IF EXISTS `idx_property_status_published`;
*/

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
