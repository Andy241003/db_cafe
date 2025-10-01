-- Adminer 5.4.0 MySQL 8.0.43 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `feature_category_translations`;
CREATE TABLE `feature_category_translations` (
  `category_id` bigint NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_desc` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`category_id`,`locale`),
  KEY `fk_cat_tr_locale` (`locale`),
  CONSTRAINT `fk_cat_tr_cat` FOREIGN KEY (`category_id`) REFERENCES `feature_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cat_tr_locale` FOREIGN KEY (`locale`) REFERENCES `locales` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `feature_category_translations` (`category_id`, `locale`, `title`, `short_desc`) VALUES
(1,	'en',	'Facilities',	'Facilities'),
(1,	'vi',	'Cơ sở vật chất',	'Cơ sở vật chất'),
(2,	'en',	'Services',	'Services'),
(2,	'vi',	'Dịch vụ',	'Dịch vụ'),
(3,	'en',	'Entertainment',	'Entertainment'),
(3,	'vi',	'Giải trí',	'Giải trí'),
(4,	'en',	'Activities',	'Activities'),
(4,	'vi',	'Hoạt động',	'Hoạt động');

DROP TABLE IF EXISTS `feature_translations`;
CREATE TABLE `feature_translations` (
  `feature_id` bigint NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_desc` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`feature_id`,`locale`),
  KEY `fk_feat_tr_locale` (`locale`),
  CONSTRAINT `fk_feat_tr_feature` FOREIGN KEY (`feature_id`) REFERENCES `features` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feat_tr_locale` FOREIGN KEY (`locale`) REFERENCES `locales` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(10,	'vi',	'Họp',	NULL);

DROP TABLE IF EXISTS `post_translations`;
CREATE TABLE `post_translations` (
  `post_id` bigint NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(250) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content_html` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `seo_title` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seo_desc` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `og_image_id` bigint DEFAULT NULL,
  PRIMARY KEY (`post_id`,`locale`),
  KEY `fk_pt_locale` (`locale`),
  CONSTRAINT `fk_pt_locale` FOREIGN KEY (`locale`) REFERENCES `locales` (`code`),
  CONSTRAINT `fk_pt_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `post_translations` (`post_id`, `locale`, `title`, `subtitle`, `content_html`, `seo_title`, `seo_desc`, `og_image_id`) VALUES
(1,	'en',	'WiFi',	'Free WiFi throughout the hotel',	'<h2>Enjoy seamless connectivity</h2><p>Whether you are working remotely, browsing the web, or video calling, our high-speed WiFi keeps you connected everywhere.</p>',	'WiFi',	'Free high-speed WiFi available throughout the hotel.',	NULL),
(1,	'vi',	'WiFi',	'WiFi miễn phí trong toàn khách sạn',	'<h2>Trải nghiệm kết nối không giới hạn</h2>\r\n<p>Dù bạn đang làm việc từ xa, lướt web hay gọi video call, hệ thống WiFi tốc độ cao của chúng tôi luôn đảm bảo kết nối ổn định và nhanh chóng.</p>\r\n<h3>Tính năng nổi bật</h3>\r\n<ul>\r\n  <li><strong>Băng thông rộng</strong> – tải phim, họp trực tuyến mượt mà.</li>\r\n  <li><strong>Phủ sóng toàn khách sạn</strong> – từ phòng ngủ, sảnh chính đến khu hồ bơi.</li>\r\n  <li><strong>Miễn phí 100%</strong> cho mọi khách lưu trú.</li>\r\n</ul>\r\n<blockquote>“Chúng tôi tin rằng một kỳ nghỉ hoàn hảo bắt đầu bằng kết nối hoàn hảo.”</blockquote>\r\n<h3>Cách kết nối</h3>\r\n<ol>\r\n  <li>Bật WiFi trên thiết bị của bạn.</li>\r\n  <li>Chọn mạng <em>TravelLink78</em> từ danh sách.</li>\r\n  <li>Nhập mật khẩu: <code>TravelLink7801</code>.</li>\r\n  <li>Bắt đầu trải nghiệm internet tốc độ cao.</li>\r\n</ol>\r\n<p>Nếu có bất kỳ khó khăn nào, vui lòng liên hệ <a href=\"#\">lễ tân</a> để được hỗ trợ ngay.</p>',	'WiFi',	'WiFi miễn phí trong toàn khách sạn với tốc độ cao và phủ sóng toàn bộ.',	NULL),
(2,	'en',	'Check-in',	'Fast and convenient check-in process',	'<h2>Experience easy check-in</h2><p>We provide flexible and quick check-in service to make your stay hassle-free.</p>',	'Convenient Check-in',	'Quick, friendly, and professional check-in service.',	NULL),
(2,	'vi',	'Check-in',	'Thủ tục nhận phòng nhanh chóng, tiện lợi',	'<h2>Trải nghiệm check-in dễ dàng</h2>\r\n     <p>Chúng tôi hỗ trợ thủ tục nhận phòng linh hoạt, tiết kiệm thời gian để bạn tận hưởng kỳ nghỉ trọn vẹn.</p>',	'Check-in tiện lợi',	'Thủ tục nhận phòng nhanh chóng, thân thiện và chuyên nghiệp.',	NULL),
(3,	'en',	'TV',	'Entertainment right in your room',	'<h2>Modern flat-screen TV</h2><p>Enjoy a variety of channels and streaming services in the comfort of your room.</p>',	'TV',	'Rooms equipped with modern flat-screen TVs and multiple entertainment options.',	NULL),
(3,	'vi',	'TV',	'Giải trí ngay tại phòng',	'<h2>TV màn hình phẳng hiện đại</h2>\r\n<p>Tận hưởng các kênh truyền hình đa dạng và dịch vụ streaming ngay trong phòng nghỉ của bạn.</p>',	'TV',	'Phòng nghỉ được trang bị TV màn hình phẳng với nhiều kênh giải trí.',	NULL),
(4,	'en',	'Public Bath',	'Relax and recharge your energy',	'<h2>Public bath area</h2><p>A clean and comfortable space to relax and refresh after a long day.</p>',	'Public Bath',	'Comfortable and well-maintained public bath for guests.',	NULL),
(4,	'vi',	'Tắm công cộng',	'Thư giãn và tái tạo năng lượng',	'<h2>Khu vực tắm công cộng</h2>\r\n<p>Không gian sạch sẽ, tiện nghi, giúp bạn thư giãn sau một ngày dài.</p>',	'Tắm công cộng',	'Không gian tắm công cộng thoải mái và tiện nghi cho khách lưu trú.',	NULL),
(5,	'en',	'Restaurant',	'Diverse and exquisite cuisine',	'<h2>Dining experience</h2><p>From traditional Vietnamese dishes to international cuisine, all made with fresh ingredients.</p>',	'Restaurant',	'Our restaurant serves a wide variety of dishes with fresh, quality ingredients.',	NULL),
(5,	'vi',	'Nhà hàng',	'Ẩm thực tinh tế và đa dạng',	'<h2>Trải nghiệm ẩm thực</h2>\r\n<p>Từ món Việt truyền thống đến quốc tế, tất cả đều được chế biến từ nguyên liệu tươi ngon.</p>',	'Nhà hàng',	'Nhà hàng phục vụ thực đơn đa dạng với nguyên liệu tươi ngon.',	NULL),
(6,	'en',	'Shuttle Service',	'Easy and convenient transportation',	'<h2>Airport and city shuttle</h2><p>Book in advance for a smooth and comfortable journey.</p>',	'Shuttle Service',	'Convenient airport and city shuttle service available for guests.',	NULL),
(6,	'vi',	'Dịch vụ đưa đón',	'Di chuyển dễ dàng và tiện lợi',	'<h2>Đưa đón sân bay và thành phố</h2>\r\n<p>Đặt trước dịch vụ đưa đón để hành trình của bạn thêm thuận tiện.</p>',	'Đưa đón',	'Dịch vụ đưa đón sân bay và thành phố tiện lợi cho khách.',	NULL),
(7,	'en',	'Swimming Pool',	'Relaxing outdoor space',	'<h2>Modern swimming pool</h2><p>Unwind at our outdoor pool with beautiful views and a refreshing atmosphere.</p>',	'Swimming Pool',	'Clean, modern outdoor swimming pool with great views.',	NULL),
(7,	'vi',	'Hồ bơi',	'Không gian thư giãn ngoài trời',	'<h2>Hồ bơi hiện đại</h2>\r\n<p>Thư giãn tại hồ bơi ngoài trời với view tuyệt đẹp và không gian trong lành.</p>',	'Hồ bơi',	'Hồ bơi ngoài trời hiện đại, sạch sẽ, có tầm nhìn đẹp.',	NULL),
(8,	'en',	'Gym',	'Stay fit during your holiday',	'<h2>Fully equipped fitness center</h2><p>Work out with modern equipment in a spacious and comfortable environment.</p>',	'Gym',	'Fitness center with modern workout equipment for all guests.',	NULL),
(8,	'vi',	'Gym',	'Giữ dáng trong kỳ nghỉ',	'<h2>Phòng gym đầy đủ thiết bị</h2>\r\n<p>Trang thiết bị hiện đại, không gian thoáng mát, giúp bạn duy trì sức khỏe.</p>',	'Gym',	'Phòng gym với đầy đủ thiết bị tập luyện hiện đại.',	NULL),
(9,	'en',	'Game Zone',	'Fun with family and friends',	'<h2>Exciting games</h2><p>Play video games and board games designed for all ages.</p>',	'Game Zone',	'Entertainment area with fun games and activities for everyone.',	NULL),
(9,	'vi',	'Khu vui chơi game',	'Giải trí cùng bạn bè và gia đình',	'<h2>Trò chơi hấp dẫn</h2>\r\n<p>Tham gia các trò chơi điện tử và boardgame thú vị dành cho mọi lứa tuổi.</p>',	'Game',	'Khu vui chơi với nhiều trò giải trí hấp dẫn cho khách.',	NULL),
(10,	'en',	'Meeting Room',	'Professional space for your work',	'<h2>Meeting & conference rooms</h2><p>Equipped with modern facilities and large capacity, perfect for events and business gatherings.</p>',	'Meeting Room',	'Professional meeting rooms with all necessary amenities.',	NULL),
(10,	'vi',	'Phòng họp',	'Không gian chuyên nghiệp cho công việc',	'<h2>Phòng họp & hội nghị</h2>\r\n<p>Trang thiết bị hiện đại, sức chứa lớn, phù hợp cho các sự kiện và hội thảo.</p>',	'Họp',	'Phòng họp chuyên nghiệp với đầy đủ tiện nghi.',	NULL);

DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `property_id` bigint NOT NULL,
  `vr360_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `feature_id` bigint NOT NULL,
  `slug` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','published','archived') COLLATE utf8mb4_unicode_ci NOT NULL,
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
(1,	1,	1,	NULL,	1,	'wifi',	'published',	0,	NULL,	'2025-09-30 03:19:08',	NULL,	'2025-09-30 03:19:08',	NULL),
(2,	1,	1,	NULL,	2,	'checkin',	'published',	0,	NULL,	'2025-09-30 03:30:08',	NULL,	'2025-09-30 03:30:08',	NULL),
(3,	1,	1,	NULL,	3,	'tv',	'published',	0,	NULL,	'2025-09-30 03:40:20',	NULL,	'2025-09-30 03:40:20',	NULL),
(4,	1,	1,	NULL,	4,	'tam-cong-cong',	'published',	0,	NULL,	'2025-09-30 03:40:20',	NULL,	'2025-09-30 03:40:20',	NULL),
(5,	1,	1,	NULL,	5,	'nha-hang',	'published',	0,	NULL,	'2025-09-30 03:40:20',	NULL,	'2025-09-30 03:40:20',	NULL),
(6,	1,	1,	NULL,	6,	'dua-don',	'published',	0,	NULL,	'2025-09-30 03:40:20',	NULL,	'2025-09-30 03:40:20',	NULL),
(7,	1,	1,	NULL,	7,	'ho-boi',	'published',	0,	NULL,	'2025-09-30 03:40:20',	NULL,	'2025-09-30 03:40:20',	NULL),
(8,	1,	1,	NULL,	8,	'gym',	'published',	0,	NULL,	'2025-09-30 03:40:20',	NULL,	'2025-09-30 03:40:20',	NULL),
(9,	1,	1,	NULL,	9,	'game',	'published',	0,	NULL,	'2025-09-30 03:40:20',	NULL,	'2025-09-30 03:40:20',	NULL),
(10,	1,	1,	NULL,	10,	'hop',	'published',	0,	NULL,	'2025-09-30 03:40:20',	NULL,	'2025-09-30 03:40:20',	NULL);

-- 2025-09-30 05:12:57 UTC
