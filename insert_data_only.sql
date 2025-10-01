SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- Insert feature category translations
INSERT INTO `feature_category_translations` (`category_id`, `locale`, `title`, `short_desc`) VALUES
(1,	'en',	'Facilities',	'Facilities'),
(1,	'vi',	'Cơ sở vật chất',	'Cơ sở vật chất'),
(2,	'en',	'Services',	'Services'),
(2,	'vi',	'Dịch vụ',	'Dịch vụ'),
(3,	'en',	'Entertainment',	'Entertainment'),
(3,	'vi',	'Giải trí',	'Giải trí'),
(4,	'en',	'Activities',	'Activities'),
(4,	'vi',	'Hoạt động',	'Hoạt động')
ON DUPLICATE KEY UPDATE 
title = VALUES(title),
short_desc = VALUES(short_desc);

-- Insert feature translations
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
(6,	'en',	'Transport',	NULL),
(6,	'vi',	'Đưa đón',	NULL),
(7,	'en',	'Swimming Pool',	NULL),
(7,	'vi',	'Hồ bơi',	NULL),
(8,	'en',	'Gym',	NULL),
(8,	'vi',	'Gym',	NULL),
(9,	'en',	'Game Area',	NULL),
(9,	'vi',	'Khu vui chơi game',	NULL),
(10,	'en',	'Meeting Room',	NULL),
(10,	'vi',	'Phòng họp',	NULL)
ON DUPLICATE KEY UPDATE 
title = VALUES(title),
short_desc = VALUES(short_desc);

-- Insert posts
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
(10,	1,	1,	NULL,	10,	'hop',	'published',	0,	NULL,	'2025-09-30 03:40:20',	NULL,	'2025-09-30 03:40:20',	NULL)
ON DUPLICATE KEY UPDATE 
vr360_url = VALUES(vr360_url),
status = VALUES(status),
pinned = VALUES(pinned),
published_at = VALUES(published_at),
updated_at = VALUES(updated_at);

SET foreign_key_checks = 1;