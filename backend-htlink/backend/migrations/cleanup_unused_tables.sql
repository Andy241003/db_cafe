-- Migration: Cleanup unused VR Hotel and Travel Link tables
-- Created: 2026-02-10
-- Description: Remove VR Hotel and Travel Link modules, keep only Cafe system
-- WARNING: THIS CANNOT BE UNDONE! Make sure you have a backup!

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- DROP VR HOTEL TABLES
-- ============================================

-- Audit logs
DROP TABLE IF EXISTS `vr_audit_logs`;

-- VR Hotel Settings
DROP TABLE IF EXISTS `vr_hotel_settings_backup_20260112`;
DROP TABLE IF EXISTS `vr_hotel_settings`;
DROP TABLE IF EXISTS `vr_hotel_seo`;
DROP TABLE IF EXISTS `vr_hotel_contact`;
DROP TABLE IF EXISTS `vr_hotel_policies`;
DROP TABLE IF EXISTS `vr_hotel_rules`;
DROP TABLE IF EXISTS `vr_hotel_introductions`;

-- Languages
DROP TABLE IF EXISTS `vr_languages`;

-- Content
DROP TABLE IF EXISTS `vr_content`;

-- Offers
DROP TABLE IF EXISTS `vr_offer_translations`;
DROP TABLE IF EXISTS `vr_offers`;

-- Services
DROP TABLE IF EXISTS `vr_service_media`;
DROP TABLE IF EXISTS `vr_service_translations`;
DROP TABLE IF EXISTS `vr_services`;

-- Facilities
DROP TABLE IF EXISTS `vr_facility_media`;
DROP TABLE IF EXISTS `vr_facility_translations`;
DROP TABLE IF EXISTS `vr_facilities`;

-- Dining
DROP TABLE IF EXISTS `vr_dining_media`;
DROP TABLE IF EXISTS `vr_dining_translations`;
DROP TABLE IF EXISTS `vr_dining`;

-- Rooms
DROP TABLE IF EXISTS `vr_room_media`;
DROP TABLE IF EXISTS `vr_room_translations`;
DROP TABLE IF EXISTS `vr_rooms`;

-- ============================================
-- DROP TRAVEL LINK TABLES
-- ============================================

-- Analytics & Activity
DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `analytics_summary`;

-- Events (Travel events, not Cafe events)
DROP TABLE IF EXISTS `events`;

-- Posts & Media
DROP TABLE IF EXISTS `post_media`;
DROP TABLE IF EXISTS `post_translations`;
DROP TABLE IF EXISTS `posts`;

-- Property Posts
DROP TABLE IF EXISTS `property_post_translations`;
DROP TABLE IF EXISTS `property_posts`;

-- Property Features & Categories
DROP TABLE IF EXISTS `property_features`;
DROP TABLE IF EXISTS `property_categories`;

-- Features
DROP TABLE IF EXISTS `feature_translations`;
DROP TABLE IF EXISTS `features`;

-- Feature Categories
DROP TABLE IF EXISTS `feature_category_translations`;
DROP TABLE IF EXISTS `feature_categories`;

-- Property Locales & Translations
DROP TABLE IF EXISTS `property_locales`;
DROP TABLE IF EXISTS `property_translation`;

-- Properties
DROP TABLE IF EXISTS `properties`;

-- Settings
DROP TABLE IF EXISTS `settings`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this, you should have:
-- - 24 cafe_* tables
-- - 6 core tables (tenants, admin_users, locales, media_files, plans, alembic_version)
-- Total: ~30 tables
