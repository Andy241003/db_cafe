-- =====================================================
-- Migration: Cleanup to Cafe-Only System
-- =====================================================
-- Description: Remove VR Hotel, Travel Link tables and service_access field
-- Date: 2026-02-10
-- WARNING: This will DELETE all VR Hotel and Travel Link data!
-- =====================================================

-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- IMPORTANT: BACKUP YOUR DATABASE BEFORE RUNNING THIS!
-- Command: mysqldump -u root -p linkhotel_saas_db > backup_before_cafe_only.sql
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

-- Set safe mode (optional - comment out if you're sure)
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- STEP 1: Drop VR Hotel Tables
-- =====================================================

-- VR Hotel Core Tables
DROP TABLE IF EXISTS `vr_hotel_seo`;
DROP TABLE IF EXISTS `vr_hotel_settings`;

-- Rooms
DROP TABLE IF EXISTS `room_media`;
DROP TABLE IF EXISTS `room_translations`;
DROP TABLE IF EXISTS `rooms`;

-- Facilities
DROP TABLE IF EXISTS `facility_translations`;
DROP TABLE IF EXISTS `facilities`;

-- Services
DROP TABLE IF EXISTS `service_translations`;
DROP TABLE IF EXISTS `services`;

-- Dining
DROP TABLE IF EXISTS `dining_vr_links`;
DROP TABLE IF EXISTS `dining_translations`;
DROP TABLE IF EXISTS `dining`;

-- Offers
DROP TABLE IF EXISTS `offer_translations`;
DROP TABLE IF EXISTS `offers`;

-- Policies & Rules
DROP TABLE IF EXISTS `policy_translations`;
DROP TABLE IF EXISTS `policies`;
DROP TABLE IF EXISTS `rule_translations`;
DROP TABLE IF EXISTS `rules`;

-- Contact
DROP TABLE IF EXISTS `contact_info`;

-- Activities (if exists)
DROP TABLE IF EXISTS `vr_hotel_activities`;

-- =====================================================
-- STEP 2: Drop Travel Link Tables
-- =====================================================

-- Posts & Translations
DROP TABLE IF EXISTS `post_translations`;
DROP TABLE IF EXISTS `posts`;

-- Features
DROP TABLE IF EXISTS `feature_translations`;
DROP TABLE IF EXISTS `features`;

-- Feature Categories
DROP TABLE IF EXISTS `feature_category_translations`;
DROP TABLE IF EXISTS `feature_categories`;

-- Properties (if not used by Cafe)
DROP TABLE IF EXISTS `property_locales`;
DROP TABLE IF EXISTS `properties`;

-- Legacy tables
DROP TABLE IF EXISTS `property_category_translations`;
DROP TABLE IF EXISTS `property_categories`;

-- =====================================================
-- STEP 3: Remove service_access from admin_users
-- =====================================================

ALTER TABLE `admin_users` 
DROP COLUMN IF EXISTS `service_access`;

-- =====================================================
-- STEP 4: Cleanup Media (Optional)
-- =====================================================
-- Remove VR Hotel and Travel Link media files (CAREFUL!)
-- Uncomment only if you want to delete orphaned media:

-- DELETE FROM `media_files` WHERE source = 'vr_hotel';
-- DELETE FROM `media_files` WHERE source = 'travel';

-- Or better: Just update source to 'cafe' for reuse
UPDATE `media_files` 
SET source = 'general' 
WHERE source IN ('vr_hotel', 'travel');

-- =====================================================
-- STEP 5: Re-enable Foreign Keys
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify cleanup was successful:

-- Check remaining tables (should only see Cafe, admin, shared tables)
SHOW TABLES;

-- Check admin_users structure (should NOT have service_access)
DESCRIBE admin_users;

-- Check Cafe tables are intact
SELECT COUNT(*) AS cafe_settings_count FROM cafe_settings;
SELECT COUNT(*) AS cafe_branches_count FROM cafe_branches;
SELECT COUNT(*) AS menu_categories_count FROM menu_categories;
SELECT COUNT(*) AS menu_items_count FROM menu_items;

-- Check media files
SELECT source, COUNT(*) AS count 
FROM media_files 
GROUP BY source;

-- =====================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =====================================================
-- If something goes wrong:
-- 1. Stop the application
-- 2. Restore from backup:
--    mysql -u root -p linkhotel_saas_db < backup_before_cafe_only.sql
-- 3. Fix any issues
-- 4. Try migration again

-- =====================================================
-- POST-MIGRATION TASKS
-- =====================================================
-- 1. Update backend code:
--    - Remove service_access from UserCreate/UserUpdate schemas
--    - Remove requireService prop from ProtectedRoute
--    - Remove getUserServices() API endpoint (optional)
--
-- 2. Test authentication flow
--
-- 3. Test all Cafe pages work correctly
--
-- 4. Remove VR Hotel/Travel Link routes from frontend (already done!)

-- =====================================================
-- DISK SPACE RECLAIM
-- =====================================================
-- After successful migration, optimize tables to reclaim disk space:

OPTIMIZE TABLE admin_users;
OPTIMIZE TABLE media_files;
OPTIMIZE TABLE tenants;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

SELECT '✅ Migration completed successfully!' AS status;
SELECT '⚠️  Remember to update backend models and schemas!' AS reminder;
