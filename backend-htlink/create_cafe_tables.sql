-- Cafe Settings
CREATE TABLE IF NOT EXISTS `cafe_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `cafe_name` varchar(255) NOT NULL,
  `slogan` varchar(500) DEFAULT NULL,
  `primary_color` varchar(20) NOT NULL DEFAULT '#6f4e37',
  `secondary_color` varchar(20) NOT NULL DEFAULT '#d4a574',
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `facebook_url` varchar(255) DEFAULT NULL,
  `instagram_url` varchar(255) DEFAULT NULL,
  `youtube_url` varchar(255) DEFAULT NULL,
  `tiktok_url` varchar(255) DEFAULT NULL,
  `logo_media_id` int DEFAULT NULL,
  `favicon_media_id` int DEFAULT NULL,
  `cover_image_media_id` int DEFAULT NULL,
  `business_hours` json DEFAULT NULL,
  `settings_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_settings_tenant_id` (`tenant_id`),
  CONSTRAINT `fk_cafe_settings_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_settings_logo` FOREIGN KEY (`logo_media_id`) REFERENCES `media_files` (`id`),
  CONSTRAINT `fk_cafe_settings_favicon` FOREIGN KEY (`favicon_media_id`) REFERENCES `media_files` (`id`),
  CONSTRAINT `fk_cafe_settings_cover` FOREIGN KEY (`cover_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Page Settings
CREATE TABLE IF NOT EXISTS `cafe_page_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `page_code` varchar(50) NOT NULL,
  `is_displaying` tinyint(1) NOT NULL DEFAULT '1',
  `vr360_link` varchar(1000) DEFAULT NULL,
  `vr_title` varchar(255) DEFAULT NULL,
  `settings_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_page_settings_tenant_id` (`tenant_id`),
  KEY `ix_cafe_page_settings_page_code` (`page_code`),
  CONSTRAINT `fk_cafe_page_settings_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Branches
CREATE TABLE IF NOT EXISTS `cafe_branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `code` varchar(50) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  `google_maps_url` varchar(1000) DEFAULT NULL,
  `primary_image_media_id` int DEFAULT NULL,
  `vr360_link` varchar(1000) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '0',
  `attributes_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_branches_code` (`code`),
  KEY `ix_cafe_branches_tenant_id` (`tenant_id`),
  KEY `ix_cafe_branches_code` (`code`),
  CONSTRAINT `fk_cafe_branches_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_branches_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Branch Translations
CREATE TABLE IF NOT EXISTS `cafe_branch_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `locale` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `description` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_branch_translations_branch_id` (`branch_id`),
  KEY `ix_cafe_branch_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_branch_translations_branch` FOREIGN KEY (`branch_id`) REFERENCES `cafe_branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Branch Media
CREATE TABLE IF NOT EXISTS `cafe_branch_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `media_id` int NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_branch_media_branch_id` (`branch_id`),
  KEY `ix_cafe_branch_media_media_id` (`media_id`),
  CONSTRAINT `fk_cafe_branch_media_branch` FOREIGN KEY (`branch_id`) REFERENCES `cafe_branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_branch_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Menu Categories
CREATE TABLE IF NOT EXISTS `cafe_menu_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `code` varchar(50) NOT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_menu_categories_code` (`code`),
  KEY `ix_cafe_menu_categories_tenant_id` (`tenant_id`),
  KEY `ix_cafe_menu_categories_code` (`code`),
  CONSTRAINT `fk_cafe_menu_categories_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Menu Category Translations
CREATE TABLE IF NOT EXISTS `cafe_menu_category_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `locale` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_menu_category_translations_category_id` (`category_id`),
  KEY `ix_cafe_menu_category_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_menu_category_translations_category` FOREIGN KEY (`category_id`) REFERENCES `cafe_menu_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Menu Items
CREATE TABLE IF NOT EXISTS `cafe_menu_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `category_id` int NOT NULL,
  `code` varchar(50) NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `original_price` decimal(10,2) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'available',
  `sizes` json DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `calories` int DEFAULT NULL,
  `primary_image_media_id` int DEFAULT NULL,
  `is_bestseller` tinyint(1) NOT NULL DEFAULT '0',
  `is_new` tinyint(1) NOT NULL DEFAULT '0',
  `is_seasonal` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '0',
  `attributes_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_menu_items_code` (`code`),
  KEY `ix_cafe_menu_items_tenant_id` (`tenant_id`),
  KEY `ix_cafe_menu_items_category_id` (`category_id`),
  KEY `ix_cafe_menu_items_code` (`code`),
  CONSTRAINT `fk_cafe_menu_items_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_menu_items_category` FOREIGN KEY (`category_id`) REFERENCES `cafe_menu_categories` (`id`),
  CONSTRAINT `fk_cafe_menu_items_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Menu Item Translations
CREATE TABLE IF NOT EXISTS `cafe_menu_item_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `locale` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `ingredients` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_menu_item_translations_item_id` (`item_id`),
  KEY `ix_cafe_menu_item_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_menu_item_translations_item` FOREIGN KEY (`item_id`) REFERENCES `cafe_menu_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Menu Item Media
CREATE TABLE IF NOT EXISTS `cafe_menu_item_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `media_id` int NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_menu_item_media_item_id` (`item_id`),
  KEY `ix_cafe_menu_item_media_media_id` (`media_id`),
  CONSTRAINT `fk_cafe_menu_item_media_item` FOREIGN KEY (`item_id`) REFERENCES `cafe_menu_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_menu_item_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Events
CREATE TABLE IF NOT EXISTS `cafe_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `code` varchar(50) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `start_time` varchar(10) DEFAULT NULL,
  `end_time` varchar(10) DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `location_text` varchar(500) DEFAULT NULL,
  `registration_url` varchar(1000) DEFAULT NULL,
  `max_participants` int DEFAULT NULL,
  `primary_image_media_id` int DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'upcoming',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '0',
  `attributes_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_events_code` (`code`),
  KEY `ix_cafe_events_tenant_id` (`tenant_id`),
  KEY `ix_cafe_events_code` (`code`),
  CONSTRAINT `fk_cafe_events_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_events_branch` FOREIGN KEY (`branch_id`) REFERENCES `cafe_branches` (`id`),
  CONSTRAINT `fk_cafe_events_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Event Translations
CREATE TABLE IF NOT EXISTS `cafe_event_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `locale` varchar(10) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `details` longtext,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_event_translations_event_id` (`event_id`),
  KEY `ix_cafe_event_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_event_translations_event` FOREIGN KEY (`event_id`) REFERENCES `cafe_events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Event Media
CREATE TABLE IF NOT EXISTS `cafe_event_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `media_id` int NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_event_media_event_id` (`event_id`),
  KEY `ix_cafe_event_media_media_id` (`media_id`),
  CONSTRAINT `fk_cafe_event_media_event` FOREIGN KEY (`event_id`) REFERENCES `cafe_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_event_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Careers
CREATE TABLE IF NOT EXISTS `cafe_careers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `code` varchar(50) NOT NULL,
  `job_type` varchar(50) DEFAULT NULL,
  `experience_required` varchar(100) DEFAULT NULL,
  `salary_min` decimal(12,2) DEFAULT NULL,
  `salary_max` decimal(12,2) DEFAULT NULL,
  `salary_text` varchar(100) DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `application_url` varchar(1000) DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  `display_order` int NOT NULL DEFAULT '0',
  `is_urgent` tinyint(1) NOT NULL DEFAULT '0',
  `attributes_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_careers_code` (`code`),
  KEY `ix_cafe_careers_tenant_id` (`tenant_id`),
  KEY `ix_cafe_careers_code` (`code`),
  CONSTRAINT `fk_cafe_careers_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_careers_branch` FOREIGN KEY (`branch_id`) REFERENCES `cafe_branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Career Translations
CREATE TABLE IF NOT EXISTS `cafe_career_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `career_id` int NOT NULL,
  `locale` varchar(10) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `requirements` text,
  `benefits` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_career_translations_career_id` (`career_id`),
  KEY `ix_cafe_career_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_career_translations_career` FOREIGN KEY (`career_id`) REFERENCES `cafe_careers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Promotions
CREATE TABLE IF NOT EXISTS `cafe_promotions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `code` varchar(50) NOT NULL,
  `promotion_type` varchar(20) NOT NULL DEFAULT 'percentage',
  `discount_value` decimal(10,2) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `applicable_menu_items` json DEFAULT NULL,
  `applicable_categories` json DEFAULT NULL,
  `applicable_branches` json DEFAULT NULL,
  `min_purchase_amount` decimal(12,2) DEFAULT NULL,
  `primary_image_media_id` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '0',
  `attributes_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cafe_promotions_code` (`code`),
  KEY `ix_cafe_promotions_tenant_id` (`tenant_id`),
  KEY `ix_cafe_promotions_code` (`code`),
  CONSTRAINT `fk_cafe_promotions_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_cafe_promotions_primary_image` FOREIGN KEY (`primary_image_media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Promotion Translations
CREATE TABLE IF NOT EXISTS `cafe_promotion_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `promotion_id` int NOT NULL,
  `locale` varchar(10) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `terms_and_conditions` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_promotion_translations_promotion_id` (`promotion_id`),
  KEY `ix_cafe_promotion_translations_locale` (`locale`),
  CONSTRAINT `fk_cafe_promotion_translations_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `cafe_promotions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cafe Promotion Media
CREATE TABLE IF NOT EXISTS `cafe_promotion_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `promotion_id` int NOT NULL,
  `media_id` int NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cafe_promotion_media_promotion_id` (`promotion_id`),
  KEY `ix_cafe_promotion_media_media_id` (`media_id`),
  CONSTRAINT `fk_cafe_promotion_media_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `cafe_promotions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cafe_promotion_media_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
