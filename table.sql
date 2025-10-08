-- Adminer 5.4.0 MySQL 8.0.43 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `activity_type` varchar(50) DEFAULT NULL,
  `details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `admin_users`;
CREATE TABLE `admin_users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(180) NOT NULL,
  `role` enum('OWNER','ADMIN','EDITOR','VIEWER') NOT NULL DEFAULT 'EDITOR',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`tenant_id`,`email`),
  CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `admin_users` (`id`, `tenant_id`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(4,	1,	'admin@travel.link360.vn',	'$2b$12$xJIwuSA3.QcsCh2V/PAZSeE8BByIfCfYGREgYC9s4aYBRzlDY/xFm',	'Production Admin User',	'OWNER',	1,	'2025-10-01 09:50:39',	NULL),
(5,	1,	'test@test.com',	'$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',	'Test User',	'OWNER',	1,	'2025-10-01 09:54:50',	NULL),
(7,	4,	'admin@botonblue.com',	'$2b$12$hgga6SeO5FZ00TgJqyryNOqvlFOLHB/jiMpoqWJZbY5qRnn7XnCy.',	'Boton Blue Admin',	'OWNER',	1,	'2025-10-03 05:14:35',	NULL),
(8,	4,	'admin1@botonblue.com',	'$2b$12$hlhtoICg7YFrlRcV4pJLC.a6YER6ektQbuG1suL.o4z8HgBQEQZvG',	'Boton 1',	'EDITOR',	1,	'2025-10-03 09:10:28',	NULL);

DROP TABLE IF EXISTS `alembic_version`;
CREATE TABLE `alembic_version` (
  `version_num` varchar(255) NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `analytics_summary`;
CREATE TABLE `analytics_summary` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `date` date DEFAULT NULL,
  `period_type` varchar(10) DEFAULT NULL,
  `total_page_views` int DEFAULT '0',
  `unique_visitors` int DEFAULT '0',
  `total_activities` int DEFAULT '0',
  `categories_created` int DEFAULT '0',
  `features_created` int DEFAULT '0',
  `users_active` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `property_id` bigint NOT NULL,
  `category_id` bigint DEFAULT NULL,
  `feature_id` bigint DEFAULT NULL,
  `post_id` bigint DEFAULT NULL,
  `locale` varchar(10) DEFAULT NULL,
  `event_type` enum('page_view','click','share') NOT NULL,
  `device` enum('desktop','tablet','mobile') DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip_hash` char(64) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_events` (`tenant_id`,`property_id`,`event_type`,`created_at`),
  KEY `fk_ev_property` (`property_id`),
  KEY `fk_ev_category` (`category_id`),
  KEY `fk_ev_feature` (`feature_id`),
  KEY `fk_ev_post` (`post_id`),
  CONSTRAINT `fk_ev_category` FOREIGN KEY (`category_id`) REFERENCES `feature_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ev_feature` FOREIGN KEY (`feature_id`) REFERENCES `features` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ev_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ev_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ev_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `feature_categories`;
CREATE TABLE `feature_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL DEFAULT '0',
  `slug` varchar(100) NOT NULL,
  `icon_key` varchar(120) DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cat_slug` (`tenant_id`,`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `feature_categories` (`id`, `tenant_id`, `slug`, `icon_key`, `is_system`, `created_at`) VALUES
(1,	1,	'co-so-vat-chat-co-ban',	'fas fa-layer-group',	1,	'2025-10-01 08:50:44'),
(2,	1,	'dich-vu',	NULL,	1,	'2025-10-01 08:50:44'),
(3,	1,	'giai-tri',	NULL,	1,	'2025-10-01 08:50:44'),
(4,	1,	'hoat-dong',	NULL,	1,	'2025-10-01 08:50:44'),
(70,	4,	'dining',	'utensils',	1,	'2025-10-07 09:37:02'),
(71,	4,	'recreation-amenities',	'gamepad',	1,	'2025-10-07 09:42:41'),
(72,	4,	'rooms',	'building',	1,	'2025-10-07 09:52:47');

DROP TABLE IF EXISTS `feature_category_translations`;
CREATE TABLE `feature_category_translations` (
  `category_id` bigint NOT NULL,
  `locale` varchar(10) NOT NULL,
  `title` varchar(200) NOT NULL,
  `short_desc` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`category_id`,`locale`),
  KEY `fk_cat_tr_locale` (`locale`),
  CONSTRAINT `fk_cat_tr_cat` FOREIGN KEY (`category_id`) REFERENCES `feature_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cat_tr_locale` FOREIGN KEY (`locale`) REFERENCES `locales` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `feature_category_translations` (`category_id`, `locale`, `title`, `short_desc`) VALUES
(1,	'en',	'Facilities',	'Facilities'),
(1,	'vi',	'Cơ sở vật chất',	'Cơ sở vật chất'),
(2,	'en',	'Services',	'Services'),
(2,	'vi',	'Dịch vụ',	'Dịch vụ'),
(3,	'en',	'Entertainment',	'Entertainment'),
(3,	'vi',	'Giải trí',	'Giải trí'),
(4,	'en',	'Activities',	'Activities'),
(4,	'vi',	'Hoạt động',	'Hoạt động'),
(70,	'en',	'Dining',	'Dining & Restaurants'),
(70,	'vi',	'Ẩm thực',	'Ẩm thực & Nhà hàng'),
(71,	'en',	'Recreation & Amenities',	'Relaxation and premium facilities.'),
(71,	'vi',	'Giải trí & Tiện ích',	'Giải trí & Tiện ích'),
(72,	'en',	'Rooms',	'Luxurious accommodation with stunning views.'),
(72,	'vi',	'Phòng',	'Phòng');

DROP TABLE IF EXISTS `feature_translations`;
CREATE TABLE `feature_translations` (
  `feature_id` bigint NOT NULL,
  `locale` varchar(10) NOT NULL,
  `title` varchar(200) NOT NULL,
  `short_desc` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`feature_id`,`locale`),
  KEY `fk_feat_tr_locale` (`locale`),
  CONSTRAINT `fk_feat_tr_feature` FOREIGN KEY (`feature_id`) REFERENCES `features` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feat_tr_locale` FOREIGN KEY (`locale`) REFERENCES `locales` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `feature_translations` (`feature_id`, `locale`, `title`, `short_desc`) VALUES
(1,	'en',	'WiFi',	NULL),
(1,	'vi',	'WiFi',	NULL),
(2,	'en',	'Check-in',	NULL),
(2,	'vi',	'Check-in',	NULL),
(3,	'en',	'TV',	NULL),
(3,	'vi',	'TV',	NULL),
(4,	'en',	'Public Bath',	NULL),
(4,	'vi',	'Tắm công cộng',	NULL),
(5,	'en',	'Restaurant',	NULL),
(5,	'vi',	'Nhà hàng',	NULL),
(6,	'en',	'Shuttle Service',	NULL),
(6,	'vi',	'Đưa đón',	NULL),
(7,	'en',	'Swimming Pool',	NULL),
(7,	'vi',	'Hồ bơi',	NULL),
(8,	'en',	'Gym',	NULL),
(8,	'vi',	'Gym',	NULL),
(9,	'en',	'Game Room',	NULL),
(9,	'vi',	'Game',	NULL),
(10,	'en',	'Meeting Room',	NULL),
(10,	'vi',	'Họp',	NULL),
(40,	'en',	'Guangdong Restaurant',	'Authentic Cantonese cuisine experience.'),
(40,	'vi',	'Nhà hàng Quảng Đông',	'Thưởng thức ẩm thực Quảng Đông truyền thống.'),
(41,	'en',	'Asian Restaurant',	'A journey through Asian flavors.'),
(41,	'vi',	'Nhà hàng Châu Á',	'Tinh hoa ẩm thực Á Đông.'),
(42,	'en',	'Sunflower Restaurant',	'Warm atmosphere with Asian & Western dishes.'),
(42,	'vi',	'Nhà hàng Sunflower',	'Không gian ấm cúng, phục vụ món Âu và Á.'),
(43,	'en',	'Titan Sky Lounge',	'Enjoy cocktails with a premium skyline view.'),
(43,	'vi',	'Titan Sky Lounge',	'Thưởng thức cocktail trong không gian sang trọng.'),
(44,	'en',	'Souvenir Counter',	'A curated selection of local gifts and keepsakes.'),
(44,	'vi',	'Quầy lưu niệm',	'Nơi bạn tìm thấy những món quà tinh tế mang đậm dấu ấn địa phương.'),
(45,	'en',	'Infinity Pool & Bar',	'Relax by the infinity pool with refreshing cocktails.'),
(45,	'vi',	'Hồ bơi & Quầy bar vô cực',	'Thả mình dưới làn nước trong xanh và thưởng thức đồ uống mát lạnh.'),
(46,	'en',	'Spa Area',	'A serene spa offering rejuvenating treatments.'),
(46,	'vi',	'Khu vực Spa',	'Trải nghiệm chăm sóc cơ thể và tinh thần trong không gian yên tĩnh.'),
(47,	'en',	'Fitness Centre',	'State-of-the-art gym for your wellness routine.'),
(47,	'vi',	'Trung tâm thể hình',	'Trang bị hiện đại giúp bạn duy trì lối sống năng động.'),
(48,	'en',	'Meetings & Events',	'Perfect venues for conferences and celebrations.'),
(48,	'vi',	'Hội nghị & Sự kiện',	'Không gian lý tưởng cho các cuộc họp và sự kiện quan trọng.'),
(49,	'en',	'Blue Ocean Beach',	'A pristine beachfront with stunning ocean views.'),
(49,	'vi',	'Bãi biển Blue Ocean',	'Tận hưởng khung cảnh biển tuyệt đẹp và bãi cát trắng mịn.'),
(50,	'en',	'Superior Mountain',	'A serene mountain-view room for peaceful relaxation.'),
(50,	'vi',	'Superior Mountain',	'Phòng hướng núi thanh bình, thích hợp cho kỳ nghỉ yên tĩnh.'),
(51,	'en',	'Superior Ocean',	'Elegant room with panoramic ocean views.'),
(51,	'vi',	'Superior Ocean',	'Phòng hướng biển với tầm nhìn bao quát đại dương.'),
(52,	'en',	'Deluxe',	'Spacious and stylish with refined comfort.'),
(52,	'vi',	'Deluxe',	'Không gian sang trọng và tiện nghi hiện đại.'),
(53,	'en',	'Deluxe Ocean',	'Luxurious ocean-facing room with sunrise view.'),
(53,	'vi',	'Deluxe Ocean',	'Phòng sang trọng hướng biển, đón ánh bình minh mỗi sớm mai.'),
(54,	'en',	'Pacific Double',	'A cozy double room ideal for couples.'),
(54,	'vi',	'Pacific Double',	'Phòng đôi thoải mái, lý tưởng cho các cặp đôi.'),
(55,	'en',	'Pacific Triple',	'Triple-bed room perfect for families.'),
(55,	'vi',	'Pacific Triple',	'Phòng ba giường phù hợp cho gia đình nhỏ.'),
(56,	'en',	'Asian Suite',	'Elegant suite inspired by Asian aesthetics.'),
(56,	'vi',	'Asian Suite',	'Phong cách Á Đông tinh tế và ấm cúng.'),
(57,	'en',	'European Suite',	'Modern suite with luxurious European design.'),
(57,	'vi',	'European Suite',	'Thiết kế châu Âu sang trọng và hiện đại.'),
(58,	'en',	'Presidential Suite',	'The most luxurious suite for ultimate comfort.'),
(58,	'vi',	'Presidential Suite',	'Phòng Tổng thống đẳng cấp cao nhất của khách sạn.');

DROP TABLE IF EXISTS `features`;
CREATE TABLE `features` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL DEFAULT '0',
  `category_id` bigint NOT NULL,
  `slug` varchar(120) NOT NULL,
  `icon_key` varchar(120) DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_feature_slug` (`tenant_id`,`slug`),
  KEY `idx_feature_category` (`category_id`),
  CONSTRAINT `fk_features_category` FOREIGN KEY (`category_id`) REFERENCES `feature_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `features` (`id`, `tenant_id`, `category_id`, `slug`, `icon_key`, `is_system`, `created_at`) VALUES
(1,	1,	1,	'wifi',	'wifi',	1,	'2025-10-01 08:51:21'),
(2,	1,	1,	'check-in',	'check-in',	1,	'2025-10-01 08:51:21'),
(3,	1,	1,	'tv',	'tv',	1,	'2025-10-01 08:51:21'),
(4,	1,	1,	'tam-cong-cong',	'hot-tub-person',	1,	'2025-10-01 08:51:21'),
(5,	1,	2,	'nha-hang',	'nha-hang',	1,	'2025-10-01 08:51:21'),
(6,	1,	2,	'dua-don',	'car',	1,	'2025-10-01 08:51:21'),
(7,	1,	3,	'ho-boi',	'water-ladder',	1,	'2025-10-01 08:51:21'),
(8,	1,	3,	'gym',	'dumbbell',	1,	'2025-10-01 08:51:21'),
(9,	1,	4,	'game',	'game',	1,	'2025-10-01 08:51:21'),
(10,	1,	4,	'hop',	'handshake',	1,	'2025-10-01 08:51:21'),
(40,	4,	70,	'guangdong-restaurant',	'utensils',	1,	'2025-10-07 09:37:02'),
(41,	4,	70,	'asian-restaurant',	'utensils',	1,	'2025-10-07 09:37:02'),
(42,	4,	70,	'sunflower-restaurant',	'utensils',	1,	'2025-10-07 09:37:02'),
(43,	4,	70,	'titan-sky-lounge',	'cocktail',	1,	'2025-10-07 09:37:02'),
(44,	4,	71,	'souvenir-counter',	'gift',	1,	'2025-10-07 09:42:41'),
(45,	4,	71,	'infinity-pool-bar',	'swimming-pool',	1,	'2025-10-07 09:42:41'),
(46,	4,	71,	'spa-area',	'spa',	1,	'2025-10-07 09:42:41'),
(47,	4,	71,	'fitness-centre',	'dumbbell',	1,	'2025-10-07 09:42:41'),
(48,	4,	71,	'meetings-events',	'users',	1,	'2025-10-07 09:42:41'),
(49,	4,	71,	'blue-ocean-beach',	'umbrella-beach',	1,	'2025-10-07 09:42:41'),
(50,	4,	72,	'superior-mountain',	'bed',	1,	'2025-10-07 09:52:47'),
(51,	4,	72,	'superior-ocean',	'bed',	1,	'2025-10-07 09:52:47'),
(52,	4,	72,	'deluxe',	'bed',	1,	'2025-10-07 09:52:47'),
(53,	4,	72,	'deluxe-ocean',	'bed',	1,	'2025-10-07 09:52:47'),
(54,	4,	72,	'pacific-double',	'bed',	1,	'2025-10-07 09:52:47'),
(55,	4,	72,	'pacific-triple',	'bed',	1,	'2025-10-07 09:52:47'),
(56,	4,	72,	'asian-suite',	'bed',	1,	'2025-10-07 09:52:47'),
(57,	4,	72,	'european-suite',	'bed',	1,	'2025-10-07 09:52:47'),
(58,	4,	72,	'presidential-suite',	'bed',	1,	'2025-10-07 09:52:47');

DROP TABLE IF EXISTS `locales`;
CREATE TABLE `locales` (
  `code` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `native_name` varchar(100) NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `locales` (`code`, `name`, `native_name`) VALUES
('en',	'English',	'English'),
('ja',	'Japanese',	'日本語'),
('ko',	'Korean',	'한국어'),
('vi',	'Vietnamese',	'Tiếng Việt');

DROP TABLE IF EXISTS `media_files`;
CREATE TABLE `media_files` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `uploader_id` bigint DEFAULT NULL,
  `kind` enum('image','video','file','icon') NOT NULL,
  `mime_type` varchar(120) DEFAULT NULL,
  `file_key` varchar(255) NOT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `size_bytes` bigint DEFAULT NULL,
  `alt_text` varchar(300) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_media_tenant` (`tenant_id`,`kind`),
  CONSTRAINT `fk_media_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `media_files` (`id`, `tenant_id`, `uploader_id`, `kind`, `mime_type`, `file_key`, `width`, `height`, `size_bytes`, `alt_text`, `created_at`) VALUES
(17,	1,	4,	'image',	'image/png',	'd7ab2c21-c343-405f-bb58-419d5695b35b.png',	NULL,	NULL,	197342,	NULL,	'2025-10-04 10:18:02'),
(22,	4,	7,	'image',	'image/png',	'e27b341c-64c2-49db-a9c0-5622250ea842.png',	NULL,	NULL,	2387967,	NULL,	'2025-10-07 09:02:26');

DROP TABLE IF EXISTS `page_views`;
CREATE TABLE `page_views` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `path` varchar(500) DEFAULT NULL,
  `referrer` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `plans`;
CREATE TABLE `plans` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(120) NOT NULL,
  `features_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `plans` (`id`, `code`, `name`, `features_json`, `created_at`) VALUES
(1,	'basic',	'Basic',	NULL,	'2025-10-01 08:08:10');

DROP TABLE IF EXISTS `post_media`;
CREATE TABLE `post_media` (
  `post_id` bigint NOT NULL,
  `media_id` bigint NOT NULL,
  `sort_order` int NOT NULL DEFAULT '100',
  PRIMARY KEY (`post_id`,`media_id`),
  KEY `fk_pm_media` (`media_id`),
  CONSTRAINT `fk_pm_media` FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pm_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `post_translations`;
CREATE TABLE `post_translations` (
  `post_id` bigint NOT NULL,
  `locale` varchar(10) NOT NULL,
  `title` varchar(250) NOT NULL,
  `subtitle` varchar(300) DEFAULT NULL,
  `content_html` mediumtext NOT NULL,
  `seo_title` varchar(250) DEFAULT NULL,
  `seo_desc` varchar(300) DEFAULT NULL,
  `og_image_id` bigint DEFAULT NULL,
  PRIMARY KEY (`post_id`,`locale`),
  KEY `fk_pt_locale` (`locale`),
  FULLTEXT KEY `ft_post_content` (`title`,`subtitle`,`content_html`),
  CONSTRAINT `fk_pt_locale` FOREIGN KEY (`locale`) REFERENCES `locales` (`code`),
  CONSTRAINT `fk_pt_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `post_translations` (`post_id`, `locale`, `title`, `subtitle`, `content_html`, `seo_title`, `seo_desc`, `og_image_id`) VALUES
(29,	'en',	'Wi-Fi Access',	'Complimentary Wi-Fi throughout the hotel',	'<h2>Experience Unlimited Connectivity</h2>\r\n                <p>Whether you\'re working remotely, browsing the web, or making video calls, our high-speed Wi-Fi system ensures a stable and fast connection.</p>\r\n                <h3>Key Features</h3>\r\n                <ul>\r\n                    <li><strong>Broad Bandwidth</strong> – smooth streaming and conferencing.</li>\r\n                    <li><strong>Hotel-wide Coverage</strong> – from your room and lobby to the pool area.</li>\r\n                    <li><strong>100% Complimentary</strong> for all staying guests.</li>\r\n                </ul>\r\n                <blockquote>“We believe a perfect stay starts with a perfect connection.”</blockquote>\r\n                <h3>How to Connect</h3>\r\n                <ol>\r\n                    <li>Turn on Wi-Fi on your device.</li>\r\n                    <li>Select the <em>TravelLink78</em> network from the list.</li>\r\n                    <li>Enter the password: <code>TravelLink7801</code>.</li>\r\n                    <li>Start enjoying high-speed internet.</li>\r\n                </ol>\r\n                <p>If you encounter any difficulties, please contact the <a href=\"#\">front desk</a> for immediate assistance.</p>',	NULL,	NULL,	NULL),
(29,	'vi',	'Wi-Fi',	'WiFi miễn phí trong toàn khách sạn',	'<h2>Trải nghiệm kết nối không giới hạn </h2>\r\n                <p>Dù bạn đang làm việc từ xa, lướt web hay gọi video call, hệ thống WiFi tốc độ cao của chúng tôi luôn đảm bảo kết nối ổn định và nhanh chóng.</p>\r\n                <h3>Tính năng nổi bật</h3>\r\n                <ul>\r\n                    <li><strong>Băng thông rộng</strong> – tải phim, họp trực tuyến mượt mà.</li>\r\n                    <li><strong>Phủ sóng toàn khách sạn</strong> – từ phòng ngủ, sảnh chính đến khu hồ bơi.</li>\r\n                    <li><strong>Miễn phí 100%</strong> cho mọi khách lưu trú.</li>\r\n                </ul>\r\n                <blockquote>“Chúng tôi tin rằng một kỳ nghỉ hoàn hảo bắt đầu bằng kết nối hoàn hảo.”</blockquote>\r\n                <h3>Cách kết nối</h3>\r\n                <ol>\r\n                    <li>Bật WiFi trên thiết bị của bạn.</li>\r\n                    <li>Chọn mạng <em>TravelLink78</em> từ danh sách.</li>\r\n                    <li>Nhập mật khẩu: <code>TravelLink7801</code>.</li>\r\n                    <li>Bắt đầu trải nghiệm internet tốc độ cao.</li>\r\n                </ol>\r\n                <p>Nếu có bất kỳ khó khăn nào, vui lòng liên hệ <a href=\"#\">lễ tân</a> để được hỗ trợ ngay.</p>',	NULL,	NULL,	NULL),
(52,	'en',	'Guangdong Restaurant',	'Authentic Cantonese Cuisine',	'<h2>Experience the Art of Cantonese Dining</h2>\r\n<p>Step into <strong>Guangdong Restaurant</strong> and immerse yourself in the heart of traditional Cantonese cuisine. Our menu features classic dim sum, expertly roasted meats, and fresh seafood prepared with refined techniques that highlight the natural flavors of every ingredient. With its elegant interior and attentive service, it is a true celebration of China’s culinary heritage.</p>\r\n\r\n<h3>Highlights</h3>\r\n<ul>\r\n  <li><strong>Traditional Dim Sum</strong> – steamed, fried, and baked varieties made fresh daily.</li>\r\n  <li><strong>Signature Roasts</strong> – from crispy roast duck to honey-glazed pork.</li>\r\n  <li><strong>Fresh Seafood</strong> – selected daily and cooked to perfection.</li>\r\n  <li><strong>Elegant Ambience</strong> – perfect for family gatherings or business lunches.</li>\r\n</ul>\r\n\r\n<blockquote>“A refined taste of Cantonese excellence, crafted with passion.”</blockquote>\r\n\r\n<h3>Dining Experience</h3>\r\n<ol>\r\n  <li>Begin with handcrafted dim sum and traditional Chinese tea.</li>\r\n  <li>Explore our curated menu of signature roasts and seafood dishes.</li>\r\n  <li>Enjoy personalized service from our dedicated culinary team.</li>\r\n  <li>Conclude with a sweet Cantonese dessert to complete your meal.</li>\r\n</ol>\r\n\r\n<p>Reserve your table by contacting our <a href=\"#\">restaurant team</a> for an unforgettable dining journey.</p>',	NULL,	NULL,	NULL),
(52,	'vi',	'Nhà hàng Quảng Đông',	'Ẩm thực Quảng Đông chính hiệu',	'<h2>Trải nghiệm tinh hoa ẩm thực Quảng Đông</h2>\r\n<p>Chào mừng bạn đến với <strong>Nhà hàng Quảng Đông</strong> – nơi tôn vinh nghệ thuật ẩm thực Quảng Đông chính thống. Tại đây, bạn sẽ được thưởng thức các món dim sum truyền thống, thịt quay đặc trưng và hải sản tươi sống được chế biến tinh tế, giữ trọn vị ngọt tự nhiên của nguyên liệu. Mỗi món ăn là sự kết hợp hoàn hảo giữa hương vị, màu sắc và cách trình bày tinh xảo.</p>\r\n\r\n<h3>Điểm nổi bật</h3>\r\n<ul>\r\n  <li><strong>Dim sum truyền thống</strong> – hấp, chiên và nướng, chế biến mới mỗi ngày.</li>\r\n  <li><strong>Món quay đặc trưng</strong> – vịt quay da giòn, xá xíu mật ong, thịt heo quay.</li>\r\n  <li><strong>Hải sản tươi sống</strong> – chọn lựa kỹ lưỡng, nấu đúng chuẩn vị Quảng Đông.</li>\r\n  <li><strong>Không gian sang trọng</strong> – lý tưởng cho bữa tiệc gia đình hay gặp gỡ đối tác.</li>\r\n</ul>\r\n\r\n<blockquote>“Tinh tế, đậm đà, và mang linh hồn ẩm thực Quảng Đông.”</blockquote>\r\n\r\n<h3>Trải nghiệm dùng bữa</h3>\r\n<ol>\r\n  <li>Bắt đầu bằng món dim sum và trà truyền thống Trung Hoa.</li>\r\n  <li>Khám phá thực đơn đặc sắc với các món quay và hải sản cao cấp.</li>\r\n  <li>Tận hưởng sự phục vụ tận tâm và chuyên nghiệp từ đội ngũ đầu bếp.</li>\r\n  <li>Kết thúc bằng món tráng miệng ngọt ngào đặc trưng Quảng Đông.</li>\r\n</ol>\r\n\r\n<p>Liên hệ <a href=\"#\">đội ngũ nhà hàng</a> để đặt bàn và tận hưởng trải nghiệm ẩm thực tinh hoa.</p>',	NULL,	NULL,	NULL),
(53,	'en',	'Asian Restaurant',	'A Fusion of Asian Delights',	'<h2>Asian Restaurant</h2>\r\n<p>Experience the authentic taste of Asia in a warm and elegant atmosphere. Our Asian Restaurant unites flavors from Japan, Thailand, Vietnam, and China — each dish crafted by skilled chefs using fresh, local ingredients and traditional techniques.</p>\r\n\r\n<h3>Highlights</h3>\r\n<ul>\r\n  <li><strong>Diverse Asian Menu</strong> – from sushi and dim sum to spicy curries and grilled seafood.</li>\r\n  <li><strong>Authentic Flavors</strong> – recipes prepared with heritage and passion.</li>\r\n  <li><strong>Modern Oriental Décor</strong> – blending comfort with cultural charm.</li>\r\n  <li><strong>Perfect for Every Occasion</strong> – family dinners, romantic dates, or business lunches.</li>\r\n</ul>\r\n\r\n<blockquote>“A flavorful journey through the heart of Asia.”</blockquote>\r\n\r\n<h3>Dining Experience</h3>\r\n<ol>\r\n  <li>Browse our extensive menu of Asian specialties.</li>\r\n  <li>Pair your meal with premium tea or wine selections.</li>\r\n  <li>Enjoy the live kitchen performance by our chefs.</li>\r\n  <li>Savor every bite in a cozy, refined setting.</li>\r\n</ol>\r\n\r\n<p>For table reservations, please contact our <a href=\"#\">restaurant staff</a>.</p>\r\n',	NULL,	NULL,	NULL),
(53,	'vi',	'Nhà hàng Châu Á',	'Hòa quyện tinh hoa ẩm thực châu Á',	'<h2>Nhà hàng Châu Á</h2>\r\n<p>Thưởng thức hương vị đặc trưng của châu Á trong không gian ấm cúng và tinh tế. Nhà hàng Á mang đến sự hòa quyện giữa ẩm thực Nhật, Thái, Việt và Trung – mỗi món ăn được chế biến tỉ mỉ bởi đầu bếp tài hoa, sử dụng nguyên liệu tươi ngon cùng công thức truyền thống.</p>\r\n\r\n<h3>Điểm nổi bật</h3>\r\n<ul>\r\n  <li><strong>Thực đơn phong phú</strong> – từ sushi, dimsum đến cà ri cay và hải sản nướng.</li>\r\n  <li><strong>Hương vị nguyên bản</strong> – đậm đà, cân bằng giữa truyền thống và hiện đại.</li>\r\n  <li><strong>Không gian Á Đông sang trọng</strong> – ấm cúng nhưng vẫn hiện đại.</li>\r\n  <li><strong>Phù hợp mọi dịp</strong> – bữa tối gia đình, hẹn hò lãng mạn hay buổi gặp mặt đối tác.</li>\r\n</ul>\r\n\r\n<blockquote>“Hành trình ẩm thực đậm sắc hương châu Á.”</blockquote>\r\n\r\n<h3>Trải nghiệm dùng bữa</h3>\r\n<ol>\r\n  <li>Khám phá thực đơn đa dạng mang phong vị châu Á.</li>\r\n  <li>Kết hợp món ăn cùng trà hoặc rượu vang cao cấp.</li>\r\n  <li>Thưởng thức màn trình diễn nấu ăn trực tiếp từ bếp trưởng.</li>\r\n  <li>Cảm nhận sự tinh tế trong từng hương vị.</li>\r\n</ol>\r\n\r\n<p>Liên hệ <a href=\"#\">nhân viên nhà hàng</a> để đặt bàn trước.</p>\r\n',	NULL,	NULL,	NULL),
(54,	'en',	'Sunflower Restaurant',	'Bright & Elegant All-Day Dining',	'<h2>Sunflower Restaurant</h2>\r\n<p>Bathe in sunlight while enjoying a delightful meal at our Sunflower Restaurant. Known for its bright and cheerful ambiance, this all-day dining venue offers both local favorites and international cuisines prepared with seasonal ingredients.</p>\r\n\r\n<h3>Highlights</h3>\r\n<ul>\r\n  <li><strong>All-Day Dining</strong> – breakfast, lunch, and dinner served with variety.</li>\r\n  <li><strong>Garden-Inspired Design</strong> – open, airy, and filled with natural light.</li>\r\n  <li><strong>Signature Dishes</strong> – chef’s specials change weekly to reflect freshness.</li>\r\n  <li><strong>Family-Friendly Space</strong> – comfortable for couples and large groups alike.</li>\r\n</ul>\r\n\r\n<blockquote>“Where every meal feels like sunshine.”</blockquote>\r\n\r\n<h3>Dining Experience</h3>\r\n<ol>\r\n  <li>Start your day with our vibrant breakfast buffet.</li>\r\n  <li>Enjoy international lunch with local touches.</li>\r\n  <li>Dine under soft lights with cozy evening vibes.</li>\r\n  <li>Ask our staff for wine or dessert pairings.</li>\r\n</ol>\r\n\r\n<p>Reserve your spot now through our <a href=\"#\">front desk</a> or call for table availability.</p>\r\n',	NULL,	NULL,	NULL),
(54,	'vi',	'Nhà hàng Sunflower',	'Không gian ẩm thực cả ngày tươi sáng và thanh lịch',	'<h2>Nhà hàng Sunflower</h2>\r\n<p>Đắm mình trong ánh nắng rực rỡ khi thưởng thức bữa ăn tại Sunflower Restaurant. Với không gian tươi sáng, tràn ngập sức sống, nhà hàng phục vụ suốt ngày – từ bữa sáng nhẹ nhàng, bữa trưa phong phú đến bữa tối ấm cúng đầy hương vị.</p>\r\n\r\n<h3>Điểm nổi bật</h3>\r\n<ul>\r\n  <li><strong>Phục vụ cả ngày</strong> – đa dạng thực đơn cho mọi khung giờ.</li>\r\n  <li><strong>Không gian ngập ánh sáng</strong> – lấy cảm hứng từ hoa hướng dương và thiên nhiên.</li>\r\n  <li><strong>Món đặc trưng của bếp trưởng</strong> – thay đổi theo mùa, luôn tươi mới.</li>\r\n  <li><strong>Phù hợp cho gia đình & nhóm bạn</strong> – rộng rãi, thoải mái.</li>\r\n</ul>\r\n\r\n<blockquote>“Nơi mỗi bữa ăn đều tràn đầy ánh nắng.”</blockquote>\r\n\r\n<h3>Trải nghiệm dùng bữa</h3>\r\n<ol>\r\n  <li>Bắt đầu ngày mới với buffet sáng đa dạng.</li>\r\n  <li>Thưởng thức bữa trưa phong cách quốc tế pha chút hương Việt.</li>\r\n  <li>Thư giãn với bữa tối ấm cúng và ánh đèn nhẹ nhàng.</li>\r\n  <li>Gọi thêm rượu hoặc món tráng miệng do nhân viên gợi ý.</li>\r\n</ol>\r\n\r\n<p>Liên hệ <a href=\"#\">quầy lễ tân</a> để đặt bàn hoặc kiểm tra chỗ trống.</p>\r\n',	NULL,	NULL,	NULL),
(55,	'en',	'Titan Sky Lounge',	'Panoramic Views & Signature Cocktails',	'<h2>Titan Sky Lounge</h2>\r\n<p>Elevate your evenings at Titan Sky Lounge – where panoramic views meet crafted cocktails. Located on the hotel’s rooftop, this exclusive lounge offers a sophisticated escape above the city lights, perfect for both intimate gatherings and after-dinner relaxation.</p>\r\n\r\n<h3>Highlights</h3>\r\n<ul>\r\n  <li><strong>Signature Cocktails</strong> – creative blends inspired by coastal flavors.</li>\r\n  <li><strong>Rooftop Views</strong> – enjoy stunning ocean and city panoramas.</li>\r\n  <li><strong>Live Music Nights</strong> – soft tunes set the perfect mood.</li>\r\n  <li><strong>Elegant Ambiance</strong> – chic seating and candlelit décor.</li>\r\n</ul>\r\n\r\n<blockquote>“Sip. Chill. Watch the night unfold.”</blockquote>\r\n\r\n<h3>Experience the Lounge</h3>\r\n<ol>\r\n  <li>Choose your favorite drink from our signature list.</li>\r\n  <li>Relax in the rooftop breeze as music fills the air.</li>\r\n  <li>Take photos with the mesmerizing skyline backdrop.</li>\r\n  <li>End your night with a toast under the stars.</li>\r\n</ol>\r\n\r\n<p>Open daily from 5:00 PM till midnight. For group reservations, contact our <a href=\"#\">concierge desk</a>.</p>\r\n',	NULL,	NULL,	NULL),
(55,	'vi',	'Titan Sky Lounge',	'Tầm nhìn toàn cảnh và cocktail đặc trưng',	'<h2>Titan Sky Lounge</h2>\r\n<p>Đón hoàng hôn và thưởng thức đêm đầy cảm xúc tại Titan Sky Lounge – nơi giao hòa giữa tầm nhìn toàn cảnh và những ly cocktail được pha chế tinh tế. Nằm trên tầng thượng khách sạn, đây là không gian lý tưởng để thư giãn, trò chuyện hay tận hưởng những buổi tối đáng nhớ.</p>\r\n\r\n<h3>Điểm nổi bật</h3>\r\n<ul>\r\n  <li><strong>Cocktail đặc trưng</strong> – pha chế sáng tạo, lấy cảm hứng từ hương vị biển.</li>\r\n  <li><strong>Tầm nhìn toàn cảnh</strong> – bao quát thành phố và biển xanh.</li>\r\n  <li><strong>Âm nhạc sống động</strong> – mang đến không khí thư giãn, sang trọng.</li>\r\n  <li><strong>Không gian tinh tế</strong> – ánh nến dịu nhẹ, nội thất hiện đại.</li>\r\n</ul>\r\n\r\n<blockquote>“Thưởng thức – Thư giãn – Ngắm nhìn đêm buông.”</blockquote>\r\n\r\n<h3>Trải nghiệm Lounge</h3>\r\n<ol>\r\n  <li>Chọn loại cocktail yêu thích từ menu đặc biệt.</li>\r\n  <li>Thả mình trong gió rooftop cùng giai điệu nhẹ nhàng.</li>\r\n  <li>Ghi lại khoảnh khắc bên ánh đèn thành phố.</li>\r\n  <li>Kết thúc đêm với ly rượu vang dưới trời sao.</li>\r\n</ol>\r\n\r\n<p>Mở cửa hàng ngày từ 17:00 đến nửa đêm. Liên hệ <a href=\"#\">bộ phận lễ tân</a> để đặt bàn nhóm hoặc sự kiện riêng.</p>\r\n',	NULL,	NULL,	NULL),
(56,	'en',	'Welcome to The Malibu',	NULL,	'<h2>Welcome to The Malibu</h2><p>We are delighted to welcome you to our property located at 456 River Bank, Hoi An.</p><p>Our team is committed to providing you with an exceptional experience during your stay.</p><h3>Contact Information:</h3><ul><li>Phone: 0933282050</li><li>Email: donghkti10@gmail.com</li><li>Website: <a href=\"https://the-malibu.trip360.vn\" target=\"_blank\">https://the-malibu.trip360.vn</a></li></ul><p>We look forward to serving you!</p>',	NULL,	NULL,	NULL),
(57,	'en',	'Souvenir Counter',	'Find unique gifts and keepsakes',	'<p>Discover our souvenir counter with hundreds of unique items, from local crafts to exclusive keepsakes perfect for every traveler.</p>',	'Souvenir Counter - Hotel',	'Shop unique souvenirs and gifts at our hotel.',	NULL),
(57,	'vi',	'Quầy Quà Lưu Niệm',	'Nơi bạn tìm thấy những món quà đặc sắc',	'<p>Khám phá quầy quà lưu niệm của chúng tôi với hàng trăm món đồ thú vị, từ quà tặng địa phương đến các sản phẩm thủ công tinh xảo.</p>',	'Quầy Quà Lưu Niệm - Khách sạn',	'Mua sắm quà lưu niệm độc đáo tại khách sạn của chúng tôi.',	NULL),
(58,	'en',	'Infinity Pool Bar',	'Enjoy exquisite drinks by the infinity pool',	'<p>Relax by the infinity pool and savor signature cocktails while enjoying the luxurious atmosphere and breathtaking views.</p>',	'Infinity Pool Bar - Hotel',	'Experience cocktails and infinity pool luxury.',	NULL),
(58,	'vi',	'Infinity Pool Bar',	'Thưởng thức đồ uống tuyệt vời trên hồ bơi vô cực',	'<p>Thư giãn bên hồ bơi vô cực và nhâm nhi cocktail đặc sắc, hòa mình vào không gian sang trọng với tầm nhìn tuyệt đẹp.</p>',	'Infinity Pool Bar - Khách sạn',	'Tận hưởng cocktail và không gian hồ bơi vô cực.',	NULL),
(59,	'en',	'Spa Area',	'Relax and rejuvenate',	'<p>Immerse yourself in professional spa treatments, from relaxing massages to premium skincare, rejuvenating your body and mind.</p>',	'Spa Area - Hotel',	'Enjoy top-notch spa services at our hotel.',	NULL),
(59,	'vi',	'Khu Spa',	'Thư giãn và tái tạo năng lượng',	'<p>Đắm mình trong các liệu pháp spa chuyên nghiệp, từ massage thư giãn đến chăm sóc da cao cấp, giúp bạn phục hồi và sảng khoái.</p>',	'Spa Area - Khách sạn',	'Tận hưởng dịch vụ spa đẳng cấp tại khách sạn.',	NULL),
(60,	'en',	'Fitness Centre',	'Stay fit during your stay',	'<p>Our fully-equipped gym allows you to maintain your workout routine and stay healthy while traveling.</p>',	'Fitness Centre - Hotel',	'Workout with modern equipment at our hotel gym.',	NULL),
(60,	'vi',	'Phòng Tập Gym',	'Duy trì sức khỏe trong kỳ nghỉ',	'<p>Trang bị đầy đủ máy móc hiện đại, phòng tập của chúng tôi giúp bạn duy trì thói quen luyện tập và sức khỏe ngay cả khi đi du lịch.</p>',	'Fitness Centre - Khách sạn',	'Tập luyện với thiết bị hiện đại tại phòng gym của khách sạn.',	NULL),
(61,	'en',	'Meetings & Events',	'Professional spaces for all occasions',	'<p>From corporate meetings to elegant weddings, our event spaces are flexible, fully-equipped, and supported by attentive service.</p>',	'Meetings & Events - Hotel',	'Host professional events at our hotel.',	NULL),
(61,	'vi',	'Hội Nghị & Sự Kiện',	'Không gian chuyên nghiệp cho mọi sự kiện',	'<p>Từ hội nghị công ty đến tiệc cưới sang trọng, không gian sự kiện của chúng tôi linh hoạt, trang bị đầy đủ thiết bị và phục vụ tận tình.</p>',	'Meetings & Events - Khách sạn',	'Tổ chức sự kiện chuyên nghiệp tại khách sạn.',	NULL),
(62,	'en',	'Blue Ocean Beach',	'Relax on the stunning beach',	'<p>Sink your feet into soft white sands and enjoy crystal-clear waters, Blue Ocean Beach offers an unforgettable beach experience for all guests.</p>',	'Blue Ocean Beach - Hotel',	'Relax and enjoy the stunning beach.',	NULL),
(62,	'vi',	'Bãi Biển Blue Ocean',	'Thư giãn trên bãi biển tuyệt đẹp',	'<p>Thả mình trên cát trắng mịn và tận hưởng làn nước trong xanh, bãi biển Blue Ocean mang đến trải nghiệm nghỉ dưỡng tuyệt vời cho mọi du khách.</p>',	'Blue Ocean Beach - Khách sạn',	'Nghỉ dưỡng và tận hưởng bãi biển tuyệt đẹp.',	NULL);

DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `property_id` bigint NOT NULL,
  `vr360_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `feature_id` bigint NOT NULL,
  `slug` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DRAFT','PUBLISHED','ARCHIVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `pinned` tinyint(1) NOT NULL,
  `cover_media_id` bigint DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_post_slug` (`tenant_id`,`property_id`,`feature_id`,`slug`),
  KEY `fk_posts_property` (`property_id`),
  KEY `fk_posts_feature` (`feature_id`),
  KEY `idx_post_lookup` (`tenant_id`,`property_id`,`feature_id`,`status`,`pinned`),
  CONSTRAINT `fk_posts_feature` FOREIGN KEY (`feature_id`) REFERENCES `features` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_posts_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_posts_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `posts` (`id`, `tenant_id`, `property_id`, `vr360_url`, `feature_id`, `slug`, `status`, `pinned`, `cover_media_id`, `published_at`, `created_by`, `created_at`, `updated_at`) VALUES
(29,	1,	2,	NULL,	1,	'wifi',	'PUBLISHED',	1,	NULL,	NULL,	4,	'2025-10-02 13:56:15',	NULL),
(52,	4,	4,	NULL,	40,	'guangdong-restaurant',	'PUBLISHED',	1,	NULL,	NULL,	7,	'2025-10-07 10:25:29',	NULL),
(53,	4,	4,	NULL,	41,	'asian-restaurant',	'PUBLISHED',	1,	NULL,	NULL,	7,	'2025-10-07 10:26:33',	NULL),
(54,	4,	4,	NULL,	42,	'sunflower-restaurant',	'PUBLISHED',	1,	NULL,	NULL,	7,	'2025-10-07 10:26:40',	NULL),
(55,	4,	4,	NULL,	43,	'titan-sky-lounge',	'PUBLISHED',	1,	NULL,	NULL,	7,	'2025-10-07 10:26:46',	NULL),
(56,	4,	9,	NULL,	7,	'the-malibu-introduction',	'DRAFT',	1,	NULL,	NULL,	7,	'2025-10-07 10:42:55',	NULL),
(57,	4,	4,	NULL,	44,	'souvenir-counter',	'PUBLISHED',	1,	NULL,	NULL,	7,	'2025-10-07 10:49:10',	NULL),
(58,	4,	4,	NULL,	45,	'infinity-pool-bar',	'PUBLISHED',	1,	NULL,	NULL,	7,	'2025-10-07 10:49:10',	NULL),
(59,	4,	4,	NULL,	46,	'spa-area',	'PUBLISHED',	1,	NULL,	NULL,	7,	'2025-10-07 10:49:10',	NULL),
(60,	4,	4,	NULL,	47,	'fitness-centre',	'PUBLISHED',	1,	NULL,	NULL,	7,	'2025-10-07 10:49:10',	NULL),
(61,	4,	4,	NULL,	48,	'meetings-events',	'PUBLISHED',	1,	NULL,	NULL,	7,	'2025-10-07 10:49:10',	NULL),
(62,	4,	4,	NULL,	49,	'blue-ocean-beach',	'PUBLISHED',	1,	NULL,	NULL,	7,	'2025-10-07 10:49:10',	NULL);

DROP TABLE IF EXISTS `properties`;
CREATE TABLE `properties` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `property_name` varchar(255) NOT NULL,
  `code` varchar(100) NOT NULL,
  `slogan` varchar(255) DEFAULT NULL,
  `description` text,
  `logo_url` varchar(255) DEFAULT NULL,
  `banner_images` json DEFAULT NULL,
  `intro_video_url` varchar(255) DEFAULT NULL,
  `vr360_url` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `phone_number` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `website_url` varchar(255) DEFAULT NULL,
  `zalo_oa_id` varchar(50) DEFAULT NULL,
  `facebook_url` varchar(255) DEFAULT NULL,
  `youtube_url` varchar(255) DEFAULT NULL,
  `tiktok_url` varchar(255) DEFAULT NULL,
  `instagram_url` varchar(255) DEFAULT NULL,
  `google_map_url` varchar(512) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `primary_color` varchar(100) DEFAULT NULL,
  `secondary_color` varchar(100) DEFAULT NULL,
  `copyright_text` varchar(255) DEFAULT NULL,
  `terms_url` varchar(255) DEFAULT NULL,
  `privacy_url` varchar(255) DEFAULT NULL,
  `timezone` varchar(60) DEFAULT NULL,
  `default_locale` varchar(10) NOT NULL,
  `settings_json` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `tracking_key` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_properties_code` (`tenant_id`,`code`),
  KEY `idx_properties_tenant` (`tenant_id`),
  CONSTRAINT `fk_properties_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `properties` (`id`, `tenant_id`, `property_name`, `code`, `slogan`, `description`, `logo_url`, `banner_images`, `intro_video_url`, `vr360_url`, `address`, `district`, `city`, `country`, `postal_code`, `phone_number`, `email`, `website_url`, `zalo_oa_id`, `facebook_url`, `youtube_url`, `tiktok_url`, `instagram_url`, `google_map_url`, `latitude`, `longitude`, `primary_color`, `secondary_color`, `copyright_text`, `terms_url`, `privacy_url`, `timezone`, `default_locale`, `settings_json`, `is_active`, `created_at`, `updated_at`, `tracking_key`) VALUES
(2,	1,	'Travel Link',	'TL-001',	'Khách sạn cao cấp',	'<h2>Dịch vụ đẳng cấp</h2><p>Nằm tại trung tâm TP Hồ Chí Minh, Travel Link là một khách sạn 5 sao kết hợp hoàn hảo giữa phong cách truyền thống và tiện nghi hiện đại.</p><h3>Tiện ích và dịch vụ</h3><ul><li><strong>Phòng cao cấp</strong> - rộng rãi với tầm nhìn thành phố</li><li><strong>Nhà hàng sang trọng</strong> - ẩm thực đa dạng</li><li><strong>Spa & Wellness</strong> - thư giãn tối đa</li><li><strong>Trung tâm hội nghị</strong> - hoạt động 24/7</li><li><strong>Dịch vụ lễ tân</strong> - hỗ trợ chuyên nghiệp</li></ul><blockquote>\"Sứ mệnh của chúng tôi là mang đến trải nghiệm đặc biệt cho từng khách hàng\"</blockquote><h3>Vị trí thuận tiện</h3><p>Vị trí đắc địa tại trung tâm, khách dễ dàng di chuyển đến các địa điểm du lịch và khu thương mại. Chỉ 5 phút đi bộ đến ga tàu điện</p>',	'https://example.com/logo.png',	'[\"https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2080&q=80\", \"https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=2072&q=80\"]',	'https://youtube.com/watch?v=intro_link',	'https://vr360view.premierpearlhotel.vn/?nocache=20250924134326',	'78 Huyền Trân Công Chúa, Phường Tam Thắng, TP Hồ Chí Minh',	'Quận 1',	'Hồ Chí Minh',	'Việt Nam',	'700000',	'03-4275-1510',	'info@hotellink.vn',	'https://hotellink.vn',	'zalo12345',	'https://facebook.com/travellink',	'https://youtube.com/travellink',	NULL,	'https://instagram.com/travellink',	'https://maps.app.goo.gl/YourGoogleMapLink',	10.77690000,	106.70090000,	'#007AFF',	'#3b82f6',	'© 2025 Travel Link. All rights reserved.',	'https://hotellink.vn/terms',	'https://hotellink.vn/privacy',	'Asia/Ho_Chi_Minh',	'vi',	'{}',	1,	'2025-10-01 09:03:01',	NULL,	NULL),
(3,	1,	'Travel Link',	'TL-002',	'Luxury Hotel',	'<h2>Premium Services</h2><p>Located in the heart of Ho Chi Minh City, Travel Link is a 5-star hotel that perfectly combines traditional style with modern comforts.</p>',	'https://example.com/logo.png',	'[\"https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2080&q=80\", \"https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?auto=format&fit=crop&w=2070&q=80\"]',	'https://youtube.com/watch?v=intro_link',	'https://vr360view.premierpearlhotel.vn/?nocache=20250924134326',	'78 Huyen Tran Cong Chua, Tam Thang Ward, Ho Chi Minh City',	'District 1',	'Ho Chi Minh City',	'Vietnam',	'700000',	'03-4275-1510',	'info@hotellink.vn',	'https://hotellink.vn',	'zalo12345',	'https://facebook.com/travellink',	'https://youtube.com/travellink',	NULL,	'https://instagram.com/travellink',	'https://maps.app.goo.gl/YourGoogleMapLink',	10.77690000,	106.70090000,	'#007AFF',	'#3b82f6',	'© 2025 Travel Link. All rights reserved.',	'https://hotellink.vn/terms',	'https://hotellink.vn/privacy',	'Asia/Ho_Chi_Minh',	'en',	'{}',	1,	'2025-10-01 09:03:01',	NULL,	NULL),
(4,	4,	'Boton Blue Hotel & Spa ',	'boton-blue1',	'Luxury Seaside Hotel & Spa',	'<h2>Premium Seaside Services</h2><p>Located on Pham Van Dong Street in Nha Trang, Boton Blue Hotel & Spa offers a luxurious seaside retreat with breathtaking ocean views. The hotel combines modern architecture, elegant design, and international-standard hospitality services to create an unforgettable stay for every guest.</p>',	'https://botonblue.com/logo.png',	'[\"https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2080&q=80\", \"https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=2072&q=80\", \"https://botonblue.com/images/banner2.jpg\"]',	'https://youtube.com/watch?v=botonblue_intro',	'https://botonblue.com/',	'06 Pham Van Dong Street, Vinh Hoa Ward, Nha Trang City, Khanh Hoa, Vietnam',	'Vinh Hoa',	'Nha Trang',	'Vietnam',	'650000',	'+84-258-3836-868',	'info@botonblue.com',	'https://botonblue.trip360.vn/',	'zalo_botonblue',	'https://facebook.com/botonbluehotel',	'https://youtube.com/botonbluehotel',	'https://tiktok.com/@botonbluehotel',	'https://instagram.com/botonbluehotel',	'https://maps.app.goo.gl/BotonBlueHotel',	12.27950000,	109.19670000,	'#0e4c94',	'#0e4c94',	'© 2025 Boton Blue Hotel & Spa.',	'https://botonblue.com/terms',	'https://botonblue.com/privacy',	'Asia/Ho_Chi_Minh',	'en',	'{\"contact\": {\"city\": \"\", \"address\": \"06 Pham Van Dong Street, Vinh Hoa Ward, Nha Trang City, Khanh Hoa, Vietnam\", \"country\": \"\", \"district\": \"\", \"latitude\": \"\", \"zaloOaId\": \"\", \"longitude\": \"\", \"tiktokUrl\": \"\", \"postalCode\": \"\", \"websiteUrl\": \"https://botonblue.trip360.vn/\", \"youtubeUrl\": \"\", \"facebookUrl\": \"\", \"phoneNumber\": \"+84-258-3836-868\", \"emailAddress\": \"info@botonblue.com\", \"googleMapUrl\": \"\", \"instagramUrl\": \"\"}, \"advanced\": {\"vr360Url\": \"\", \"debugMode\": false, \"cacheSystem\": true, \"bannerImages\": [], \"cacheEnabled\": true, \"introVideoUrl\": \"\", \"propertyActive\": true, \"maintenanceMode\": false, \"analyticsEnabled\": true, \"analyticsTracking\": true, \"notificationsEnabled\": true, \"autoLanguageDetection\": true}, \"branding\": {\"logoUrl\": \"https://example.com/logo.png\", \"termsUrl\": \"https://example.com/terms\", \"privacyUrl\": \"https://example.com/privacy\", \"primaryColor\": \"#1357c3\", \"copyrightText\": \"© 2024 Your Hotel Name\", \"secondaryColor\": \"#3e4e65\"}, \"localization\": {\"timezone\": \"Asia/Ho_Chi_Minh\", \"dateFormat\": \"DD/MM/YYYY\", \"defaultLanguage\": \"en\", \"fallbackLanguage\": \"en\", \"supportedLanguages\": [\"en\", \"vi\"]}}',	1,	'2025-10-03 07:03:36',	'2025-10-03 17:21:46',	NULL),
(8,	4,	'Boton Blue Hotel & Spa',	'boton-blue2',	'Khách sạn & Spa sang trọng bên bờ biển',	'<h2>Dịch vụ nghỉ dưỡng cao cấp</h2><p>Nằm trên đường Phạm Văn Đồng tại thành phố Nha Trang, Boton Blue Hotel & Spa mang đến một kỳ nghỉ sang trọng với tầm nhìn hướng biển ngoạn mục. Khách sạn kết hợp hài hòa giữa kiến trúc hiện đại, thiết kế tinh tế và dịch vụ tiêu chuẩn quốc tế để mang lại trải nghiệm đáng nhớ cho mỗi du khách.</p>',	'https://botonblue.com/logo.png',	'[\"https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2080&q=80\", \"https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=2072&q=80\", \"https://botonblue.com/images/banner2.jpg\"]',	'https://youtube.com/watch?v=botonblue_intro',	'https://botonblue.com/',	'Số 06 Phạm Văn Đồng, phường Vĩnh Hòa, thành phố Nha Trang, Khánh Hòa, Việt Nam',	'Vĩnh Hòa',	'Nha Trang',	'Việt Nam',	'650000',	'0258-3836-868',	'info@botonblue.com',	'https://botonblue.trip360.vn/',	'zalo_botonblue',	'https://facebook.com/botonbluehotel',	'https://youtube.com/botonbluehotel',	'https://tiktok.com/@botonbluehotel',	'https://instagram.com/botonbluehotel',	'https://maps.app.goo.gl/BotonBlueHotel',	12.27950000,	109.19670000,	'#0e4c94',	'#0e4c94',	'© 2025 Boton Blue Hotel & Spa.',	'https://botonblue.com/terms',	'https://botonblue.com/privacy',	'Asia/Ho_Chi_Minh',	'vi',	'{}',	1,	'2025-10-03 10:44:20',	'2025-10-03 17:22:38',	NULL),
(9,	4,	'The Malibu',	'the-malibu',	NULL,	'<p>Enter a description for the new hotel here.</p>',	NULL,	'[]',	NULL,	'https://tabi-tower.com/vr-tour',	'456 River Bank, Hoi An',	NULL,	NULL,	NULL,	NULL,	'0933282050',	'donghkti10@gmail.com',	'https://the-malibu.trip360.vn',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'linear-gradient(135deg, #3b82f6, #1d4ed8)',	NULL,	NULL,	NULL,	NULL,	NULL,	'en',	'null',	1,	'2025-10-07 10:42:55',	NULL,	NULL);

DROP TABLE IF EXISTS `property_categories`;
CREATE TABLE `property_categories` (
  `property_id` bigint NOT NULL,
  `category_id` bigint NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '100',
  PRIMARY KEY (`property_id`,`category_id`),
  KEY `fk_prop_cat_category` (`category_id`),
  CONSTRAINT `fk_prop_cat_category` FOREIGN KEY (`category_id`) REFERENCES `feature_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prop_cat_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `property_features`;
CREATE TABLE `property_features` (
  `property_id` bigint NOT NULL,
  `feature_id` bigint NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '100',
  PRIMARY KEY (`property_id`,`feature_id`),
  KEY `fk_prop_feat_feature` (`feature_id`),
  CONSTRAINT `fk_prop_feat_feature` FOREIGN KEY (`feature_id`) REFERENCES `features` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prop_feat_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `property_post_translations`;
CREATE TABLE `property_post_translations` (
  `post_id` bigint NOT NULL,
  `locale` varchar(10) NOT NULL,
  `content` longtext,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`,`locale`),
  CONSTRAINT `fk_post_translations_post` FOREIGN KEY (`post_id`) REFERENCES `property_posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `property_post_translations` (`post_id`, `locale`, `content`, `created_at`, `updated_at`) VALUES
(1,	'vi',	'<h2>Dịch vụ đẳng cấp</h2>\r\n                <p>Nằm tại trung tâm TP Hồ Chí Minh, Travel Link là một khách sạn 5 sao kết hợp hoàn hảo giữa phong cách truyền thống và tiện nghi hiện đại.</p>\r\n                \r\n                <h3>Tiện ích và dịch vụ</h3>\r\n                <ul>\r\n                    <li><strong>Phòng cao cấp</strong> - rộng rãi với tầm nhìn thành phố</li>\r\n                    <li><strong>Nhà hàng sang trọng</strong> - ẩm thực đa dạng</li>\r\n                    <li><strong>Spa & Wellness</strong> - thư giãn tối đa</li>\r\n                    <li><strong>Trung tâm hội nghị</strong> - hoạt động 24/7</li>\r\n                    <li><strong>Dịch vụ lễ tân</strong> - hỗ trợ chuyên nghiệp</li>\r\n                </ul>\r\n                \r\n                <blockquote>\r\n                    \"Sứ mệnh của chúng tôi là mang đến trải nghiệm đặc biệt cho từng khách hàng\"\r\n                </blockquote>\r\n                \r\n                <h3>Vị trí thuận tiện</h3>\r\n                <p>Vị trí đắc địa tại trung tâm, khách dễ dàng di chuyển đến các địa điểm du lịch và khu thương mại. Chỉ 10 phút đi bộ đến ga tàu điện</p>',	'2025-10-01 10:17:46',	'2025-10-03 17:32:53'),
(2,	'en',	'<h2>World-Class Service</h2>\r\n                <p>Located in the heart of Ho Chi Minh City, Travel Link is a 5-star hotel that perfectly blends traditional style with modern amenities.</p>\r\n                \r\n                <h3>Amenities and Services</h3>\r\n                <ul>\r\n                    <li><strong>Premium Rooms</strong> - spacious with city views</li>\r\n                    <li><strong>Luxury Restaurant</strong> - diverse cuisine</li>\r\n                    <li><strong>Spa & Wellness</strong> - maximum relaxation</li>\r\n                    <li><strong>Conference Center</strong> - operates 24/7</li>\r\n                    <li><strong>Reception Service</strong> - professional support</li>\r\n                </ul>\r\n                \r\n                <blockquote>\r\n                    \"Our mission is to bring a special experience to every customer\"\r\n                </blockquote>\r\n                \r\n                <h3>Convenient Location</h3>\r\n                <p>Strategically located in the center, guests can easily travel to tourist spots and commercial areas. Only a 5-minute walk to the train station</p>',	'2025-10-01 10:17:46',	'2025-10-03 14:41:22'),
(3,	'vi',	'<h2>Dịch vụ đẳng cấp</h2>\r\n<p>Nằm ven bờ biển tuyệt đẹp, Boton Blue Hotel & Spa mang đến không gian nghỉ dưỡng sang trọng và tinh tế. Khách sạn được thiết kế theo phong cách hiện đại pha lẫn nét Á Đông độc đáo, tạo nên sự cân bằng hoàn hảo giữa nghệ thuật kiến trúc và tiện nghi bậc nhất. Mỗi căn phòng đều có tầm nhìn hướng biển, nội thất cao cấp cùng các tiện ích thông minh, mang lại trải nghiệm thư giãn trọn vẹn.</p>\r\n\r\n<h3>Tiện ích & Dịch vụ</h3>\r\n<ul>\r\n  <li>Hồ bơi vô cực hướng biển, mang đến không gian thư giãn và check-in tuyệt đẹp.</li>\r\n  <li>Spa & chăm sóc sức khỏe cao cấp với các liệu trình trị liệu độc quyền.</li>\r\n  <li>Hệ thống nhà hàng sang trọng phục vụ ẩm thực Á – Âu, cùng buffet hải sản tươi ngon.</li>\r\n  <li>Sky Bar đẳng cấp với tầm nhìn toàn cảnh vịnh biển, là nơi lý tưởng để thưởng thức cocktail và ngắm hoàng hôn.</li>\r\n  <li>Phòng hội nghị & sự kiện hiện đại, đáp ứng mọi nhu cầu từ hội thảo đến tiệc cưới.</li>\r\n  <li>Phòng Gym với trang thiết bị chuyên nghiệp, hoạt động 24/7.</li>\r\n  <li>Dịch vụ đưa đón sân bay và tour tham quan thành phố, mang lại sự thuận tiện tối đa cho du khách.</li>\r\n</ul>\r\n\r\n<p>Boton Blue không chỉ là một nơi lưu trú, mà còn là điểm đến lý tưởng để tận hưởng kỳ nghỉ trọn vẹn bên gia đình, bạn bè hay chuyến công tác đáng nhớ.</p>',	'2025-10-01 10:17:46',	'2025-10-03 14:55:20'),
(4,	'en',	'<h2>World-Class Service</h2>\r\n<p>Overlooking the pristine coastline, Boton Blue Hotel & Spa offers a sanctuary of luxury and elegance. Designed with a harmonious blend of contemporary style and Asian influences, the hotel creates an atmosphere of sophistication and comfort. Each room features panoramic ocean views, premium furnishings, and smart amenities, ensuring a truly relaxing and memorable stay.</p>\r\n\r\n<h3>Amenities & Services</h3>\r\n<ul>\r\n  <li>Infinity pool overlooking the sea, the perfect place to relax and capture stunning photos.</li>\r\n  <li>Luxury spa & wellness center with exclusive signature treatments.</li>\r\n  <li>Fine dining restaurants offering a fusion of Asian and European cuisine, plus a fresh seafood buffet.</li>\r\n  <li>Sky Bar with breathtaking panoramic views, ideal for enjoying cocktails at sunset.</li>\r\n  <li>State-of-the-art conference and event facilities, from business meetings to grand weddings.</li>\r\n  <li>Fully equipped 24/7 fitness center.</li>\r\n  <li>Airport shuttle and city tour services for ultimate convenience.</li>\r\n</ul>\r\n\r\n<p>Boton Blue is more than just a hotel – it is a destination where guests can embrace a luxurious lifestyle, whether for a family holiday, a romantic getaway, or a successful business trip.</p>',	'2025-10-01 10:17:46',	'2025-10-03 14:55:25');

DROP TABLE IF EXISTS `property_posts`;
CREATE TABLE `property_posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `property_id` bigint NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_property_posts_property_id` (`property_id`),
  CONSTRAINT `fk_property_posts_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `property_posts` (`id`, `property_id`, `status`, `created_at`, `updated_at`) VALUES
(1,	2,	'published',	'2025-10-01 10:15:23',	'2025-10-03 17:25:46'),
(2,	3,	'published',	'2025-10-01 10:15:23',	'2025-10-03 14:40:16'),
(3,	8,	'published',	'2025-10-01 10:15:23',	'2025-10-04 01:40:27'),
(4,	4,	'published',	'2025-10-01 10:15:23',	'2025-10-04 01:40:33');

DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL DEFAULT '0',
  `property_id` bigint NOT NULL DEFAULT '0',
  `key_name` varchar(160) NOT NULL,
  `value_json` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_settings2` (`tenant_id`,`property_id`,`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `settings` (`id`, `tenant_id`, `property_id`, `key_name`, `value_json`) VALUES
(1,	1,	0,	'brand',	'{\"primary\": \"#0ea5e9\", \"secondary\": \"#111827\"}'),
(4,	1,	1,	'i18n',	'{\"fallback\": \"en\", \"auto_detect\": true, \"cookie_name\": \"lang\"}');

DROP TABLE IF EXISTS `tenants`;
CREATE TABLE `tenants` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `plan_id` bigint DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `code` varchar(80) NOT NULL,
  `default_locale` varchar(10) NOT NULL DEFAULT 'en',
  `fallback_locale` varchar(10) NOT NULL DEFAULT 'en',
  `settings_json` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `fk_tenants_plan` (`plan_id`),
  CONSTRAINT `fk_tenants_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `tenants` (`id`, `plan_id`, `name`, `code`, `default_locale`, `fallback_locale`, `settings_json`, `is_active`, `created_at`, `updated_at`) VALUES
(1,	1,	'Demo Hotel Chain',	'demo',	'en',	'en',	NULL,	1,	'2025-10-01 08:08:10',	NULL),
(4,	1,	'Boton Blue Hotel & Spa',	'boton_blue',	'vi',	'en',	NULL,	1,	'2025-10-03 05:13:26',	NULL);

-- 2025-10-08 02:06:03 UTC