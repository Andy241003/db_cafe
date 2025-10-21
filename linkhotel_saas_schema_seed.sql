
-- =====================================================================
-- HotelLink-style SaaS for Hotels/Tourism
-- Minimal, professional multi-tenant schema with 2-level icon grid
-- MySQL 8.x | utf8mb4
-- =====================================================================

/* ---------------------------------------------------------------------
   0) Database & SQL modes
--------------------------------------------------------------------- */
CREATE DATABASE IF NOT EXISTS hotellink360_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE hotellink360_db;

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

/* ---------------------------------------------------------------------
   1) Core SaaS
--------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS plans (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  features_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tenants (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  plan_id BIGINT NULL,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(80) NOT NULL UNIQUE,               -- subdomain code
  default_locale VARCHAR(10) NOT NULL DEFAULT 'en',
  fallback_locale VARCHAR(10) NOT NULL DEFAULT 'en',
  settings_json JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  CONSTRAINT fk_tenants_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS locales (
  code VARCHAR(10) PRIMARY KEY,     -- 'en','vi','ja','ko','zh'...
  name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(180) NOT NULL,
  role ENUM('OWNER','ADMIN','EDITOR','VIEWER') NOT NULL DEFAULT 'EDITOR',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  UNIQUE KEY uq_users_email (tenant_id, email),
  CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS properties (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  property_name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,                     -- duy nhất trong tenant
      slogan VARCHAR(255),
    description TEXT,
    logo_url VARCHAR(255),
    banner_images JSON,
    intro_video_url VARCHAR(255),
    vr360_url VARCHAR(255),

    address VARCHAR(255),
    district VARCHAR(100),
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone_number VARCHAR(50),
    email VARCHAR(100),
    website_url VARCHAR(255),
    zalo_oa_id VARCHAR(50),
    facebook_url VARCHAR(255),
    youtube_url VARCHAR(255),
    tiktok_url VARCHAR(255),
    instagram_url VARCHAR(255),
    google_map_url VARCHAR(512),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),

    primary_color VARCHAR(10),
    secondary_color VARCHAR(10),

    copyright_text VARCHAR(255),
    terms_url VARCHAR(255),
  privacy_url VARCHAR(255),

  timezone VARCHAR(60) NULL,
  default_locale VARCHAR(10) NOT NULL,
  settings_json JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  UNIQUE KEY uq_properties_code (tenant_id, code),
  KEY idx_properties_tenant (tenant_id),
  CONSTRAINT fk_properties_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

/* ---------------------------------------------------------------------
   2) Taxonomy 2-levels: Category (level 1) → Feature (level 2)
      tenant_id = 0 means system-wide seed; >0 means tenant override/custom
--------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS feature_categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL DEFAULT 0,
  slug VARCHAR(100) NOT NULL,
  icon_key VARCHAR(120) NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cat_slug (tenant_id, slug)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS feature_category_translations (
  category_id BIGINT NOT NULL,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(200) NOT NULL,
  short_desc VARCHAR(500) NULL,
  PRIMARY KEY (category_id, locale),
  CONSTRAINT fk_cat_tr_cat FOREIGN KEY (category_id) REFERENCES feature_categories(id) ON DELETE CASCADE,
  CONSTRAINT fk_cat_tr_locale FOREIGN KEY (locale) REFERENCES locales(code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS features (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL DEFAULT 0,
  category_id BIGINT NOT NULL,
  slug VARCHAR(120) NOT NULL,
  icon_key VARCHAR(120) NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_feature_slug (tenant_id, slug),
  KEY idx_feature_category (category_id),
  CONSTRAINT fk_features_category FOREIGN KEY (category_id) REFERENCES feature_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS feature_translations (
  feature_id BIGINT NOT NULL,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(200) NOT NULL,
  short_desc VARCHAR(500) NULL,
  PRIMARY KEY (feature_id, locale),
  CONSTRAINT fk_feat_tr_feature FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  CONSTRAINT fk_feat_tr_locale  FOREIGN KEY (locale)  REFERENCES locales(code)
) ENGINE=InnoDB;

/* ---------------------------------------------------------------------
   3) Per-property display configuration
--------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS property_categories (
  property_id BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 100,
  PRIMARY KEY (property_id, category_id),
  CONSTRAINT fk_prop_cat_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_prop_cat_category FOREIGN KEY (category_id) REFERENCES feature_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS property_features (
  property_id BIGINT NOT NULL,
  feature_id BIGINT NOT NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 100,
  PRIMARY KEY (property_id, feature_id),
  CONSTRAINT fk_prop_feat_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_prop_feat_feature  FOREIGN KEY (feature_id)  REFERENCES features(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

/* ---------------------------------------------------------------------
   4) Content: Posts + i18n
--------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS posts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  property_id BIGINT NOT NULL,
  feature_id BIGINT NOT NULL,
  slug VARCHAR(160) NOT NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  pinned TINYINT(1) NOT NULL DEFAULT 1,
  cover_media_id BIGINT NULL,
  published_at DATETIME NULL,
  created_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  UNIQUE KEY uq_post_slug (tenant_id, property_id, feature_id, slug),
  KEY idx_post_lookup (tenant_id, property_id, feature_id, status, pinned),
  CONSTRAINT fk_posts_tenant   FOREIGN KEY (tenant_id)   REFERENCES tenants(id)    ON DELETE CASCADE,
  CONSTRAINT fk_posts_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_posts_feature  FOREIGN KEY (feature_id)  REFERENCES features(id)   ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS post_translations (
  post_id BIGINT NOT NULL,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(250) NOT NULL,
  subtitle VARCHAR(300) NULL,
  content_html MEDIUMTEXT NOT NULL,
  seo_title VARCHAR(250) NULL,
  seo_desc VARCHAR(300) NULL,
  og_image_id BIGINT NULL,
  PRIMARY KEY (post_id, locale),
  FULLTEXT KEY ft_post_content (title, subtitle, content_html),
  CONSTRAINT fk_pt_post   FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_pt_locale FOREIGN KEY (locale)  REFERENCES locales(code)
) ENGINE=InnoDB;

/* ---------------------------------------------------------------------
   5) Media / Analytics / Settings (compact)
--------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS media_files (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  uploader_id BIGINT NULL,
  kind ENUM('image','video','file','icon') NOT NULL,
  mime_type VARCHAR(120) NULL,
  file_key VARCHAR(255) NOT NULL,
  width INT NULL, height INT NULL, size_bytes BIGINT NULL,
  alt_text VARCHAR(300) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_media_tenant (tenant_id, kind),
  CONSTRAINT fk_media_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS post_media (
  post_id BIGINT NOT NULL,
  media_id BIGINT NOT NULL,
  sort_order INT NOT NULL DEFAULT 100,
  PRIMARY KEY (post_id, media_id),
  CONSTRAINT fk_pm_post  FOREIGN KEY (post_id)  REFERENCES posts(id)       ON DELETE CASCADE,
  CONSTRAINT fk_pm_media FOREIGN KEY (media_id) REFERENCES media_files(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  property_id BIGINT NOT NULL,
  category_id BIGINT NULL,
  feature_id BIGINT NULL,
  post_id BIGINT NULL,
  locale VARCHAR(10) NULL,
  event_type ENUM('page_view','click','share') NOT NULL,
  device ENUM('desktop','tablet','mobile') NULL,
  user_agent VARCHAR(255) NULL,
  ip_hash CHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_events (tenant_id, property_id, event_type, created_at),
  CONSTRAINT fk_ev_tenant   FOREIGN KEY (tenant_id)   REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_ev_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_ev_category FOREIGN KEY (category_id) REFERENCES feature_categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_ev_feature  FOREIGN KEY (feature_id)  REFERENCES features(id)          ON DELETE SET NULL,
  CONSTRAINT fk_ev_post     FOREIGN KEY (post_id)     REFERENCES posts(id)             ON DELETE SET NULL
) ENGINE=InnoDB;

-- enforce non-null defaults for composite-unique on settings
CREATE TABLE IF NOT EXISTS settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL DEFAULT 0,
  property_id BIGINT NOT NULL DEFAULT 0,
  key_name VARCHAR(160) NOT NULL,
  value_json JSON NULL,
  UNIQUE KEY uq_settings2 (tenant_id, property_id, key_name)
) ENGINE=InnoDB;

/* ---------------------------------------------------------------------
   6) Seed data
--------------------------------------------------------------------- */
-- Locales
INSERT INTO locales (code, name, native_name) VALUES
('en','English','English')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES
('vi','Vietnamese','Tiếng Việt')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES
('ja','Japanese','日本語')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES
('ko','Korean','한국어')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

-- Plan + Tenant + Property
INSERT INTO plans (code, name) VALUES ('basic','Basic')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO tenants (plan_id, name, code, default_locale, fallback_locale)
VALUES ((SELECT id FROM plans WHERE code='basic'), 'Demo Hotel Chain', 'demo', 'en', 'en')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO properties (tenant_id, name, code, address, city, country, timezone, default_locale)
VALUES (
  (SELECT id FROM tenants WHERE code='demo'),
  'Hotel Name', 'tabi-tower', '3-1-6 Mita, Minato, Tokyo 108-0068', 'Tokyo', 'Japan', 'Asia/Tokyo', 'en'
)
ON DUPLICATE KEY UPDATE name=VALUES(name), address=VALUES(address);

-- Categories (system, tenant_id=0)
INSERT INTO feature_categories (tenant_id, slug, icon_key, is_system) VALUES
(0,'general','ico_general',1),
(0,'services','ico_services',1),
(0,'facilities','ico_facilities',1),
(0,'activities','ico_activities',1),
(0,'transport','ico_transport',1),
(0,'wellness','ico_wellness',1),
(0,'dining','ico_dining',1),
(0,'shopping','ico_shopping',1),
(0,'social','ico_social',1),
(0,'policies','ico_policies',1)
ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key);

-- Category translations (EN + VI)
INSERT INTO feature_category_translations (category_id, locale, title) VALUES
((SELECT id FROM feature_categories WHERE slug='general'   AND tenant_id=0),'en','General'),
((SELECT id FROM feature_categories WHERE slug='services'  AND tenant_id=0),'en','Services'),
((SELECT id FROM feature_categories WHERE slug='facilities'AND tenant_id=0),'en','Facilities'),
((SELECT id FROM feature_categories WHERE slug='activities'AND tenant_id=0),'en','Activities'),
((SELECT id FROM feature_categories WHERE slug='transport' AND tenant_id=0),'en','Transport'),
((SELECT id FROM feature_categories WHERE slug='wellness'  AND tenant_id=0),'en','Wellness & Spa'),
((SELECT id FROM feature_categories WHERE slug='dining'    AND tenant_id=0),'en','Dining & Lounge'),
((SELECT id FROM feature_categories WHERE slug='shopping'  AND tenant_id=0),'en','Shopping & Duty Free'),
((SELECT id FROM feature_categories WHERE slug='social'    AND tenant_id=0),'en','Social & Links'),
((SELECT id FROM feature_categories WHERE slug='policies'  AND tenant_id=0),'en','Terms & Policies')
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO feature_category_translations (category_id, locale, title) VALUES
((SELECT id FROM feature_categories WHERE slug='general'   AND tenant_id=0),'vi','Chung'),
((SELECT id FROM feature_categories WHERE slug='services'  AND tenant_id=0),'vi','Dịch vụ'),
((SELECT id FROM feature_categories WHERE slug='facilities'AND tenant_id=0),'vi','Tiện ích'),
((SELECT id FROM feature_categories WHERE slug='activities'AND tenant_id=0),'vi','Hoạt động'),
((SELECT id FROM feature_categories WHERE slug='transport' AND tenant_id=0),'vi','Di chuyển'),
((SELECT id FROM feature_categories WHERE slug='wellness'  AND tenant_id=0),'vi','Sức khoẻ & Spa'),
((SELECT id FROM feature_categories WHERE slug='dining'    AND tenant_id=0),'vi','Ẩm thực & Lounge'),
((SELECT id FROM feature_categories WHERE slug='shopping'  AND tenant_id=0),'vi','Mua sắm & Thuế'),
((SELECT id FROM feature_categories WHERE slug='social'    AND tenant_id=0),'vi','Mạng xã hội & Liên kết'),
((SELECT id FROM feature_categories WHERE slug='policies'  AND tenant_id=0),'vi','Điều khoản & Chính sách')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Features (icons) based on the provided UI list
-- Map each feature to a category via SELECT subqueries

-- General
INSERT INTO features (tenant_id, category_id, slug, icon_key, is_system)
SELECT 0, fc.id, f.slug, f.icon_key, 1 FROM feature_categories fc
JOIN (
  SELECT 'check-in' slug, 'ico_checkin' icon_key UNION ALL
  SELECT 'check-out','ico_checkout' UNION ALL
  SELECT 'how-to-translate','ico_translate' UNION ALL
  SELECT 'evacuation-plan','ico_evacuation' UNION ALL
  SELECT 'floor-guide','ico_floor_guide' UNION ALL
  SELECT 'accommodation-terms','ico_terms' UNION ALL
  SELECT 'official-website','ico_official' UNION ALL
  SELECT 'q-and-a','ico_qa' UNION ALL
  SELECT 'safe','ico_safe' UNION ALL
  SELECT 'tv-remote','ico_tv_remote' UNION ALL
  SELECT 'air-conditioning','ico_aircon' UNION ALL
  SELECT 'x-info','ico_x'        -- placeholder for "X" icon
) f ON fc.slug='general' AND fc.tenant_id=0
ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key);

-- Services
INSERT INTO features (tenant_id, category_id, slug, icon_key, is_system)
SELECT 0, fc.id, f.slug, f.icon_key, 1 FROM feature_categories fc
JOIN (
  SELECT 'in-room-dining','ico_inroom_dining' UNION ALL
  SELECT 'wifi','ico_wifi' UNION ALL
  SELECT 'remote-controller','ico_remote' UNION ALL
  SELECT 'coupon','ico_coupon' UNION ALL
  SELECT 'survey','ico_survey' UNION ALL
  SELECT 'local-events','ico_local_events' UNION ALL
  SELECT 'coin-laundry','ico_coin_laundry' UNION ALL
  SELECT 'conference-room','ico_conference' UNION ALL
  SELECT 'courier-service','ico_courier' UNION ALL
  SELECT 'concierge','ico_concierge' UNION ALL
  SELECT 'vending-machines','ico_vending' UNION ALL
  SELECT 'nursing-room','ico_nursing' UNION ALL
  SELECT 'parking','ico_parking' UNION ALL
  SELECT 'self-organized-tour','ico_self_tour' UNION ALL
  SELECT 'tea-lounge','ico_tea_lounge' UNION ALL
  SELECT 'restaurant-reservation','ico_restaurant' UNION ALL
  SELECT 'morning-call','ico_morning_call' UNION ALL
  SELECT 'workspace','ico_workspace' UNION ALL
  SELECT 'locker-room','ico_locker' UNION ALL
  SELECT 'rental-space','ico_rental_space' UNION ALL
  SELECT 'drink-corner','ico_drink_corner'
) f ON fc.slug='services' AND fc.tenant_id=0
ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key);

-- Facilities
INSERT INTO features (tenant_id, category_id, slug, icon_key, is_system)
SELECT 0, fc.id, f.slug, f.icon_key, 1 FROM feature_categories fc
JOIN (
  SELECT 'amenities','ico_amenities' UNION ALL
  SELECT 'public-bath','ico_public_bath' UNION ALL
  SELECT 'sauna','ico_sauna' UNION ALL
  SELECT 'pool','ico_pool' UNION ALL
  SELECT 'fitness','ico_fitness' UNION ALL
  SELECT 'original-goods','ico_goods' UNION ALL
  SELECT 'seminar','ico_seminar'
) f ON fc.slug='facilities' AND fc.tenant_id=0
ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key);

-- Activities
INSERT INTO features (tenant_id, category_id, slug, icon_key, is_system)
SELECT 0, fc.id, f.slug, f.icon_key, 1 FROM feature_categories fc
JOIN (
  SELECT 'playground','ico_playground' UNION ALL
  SELECT 'recommended-activity','ico_recommended' UNION ALL
  SELECT 'sightseeing','ico_sightseeing' UNION ALL
  SELECT 'camp','ico_camp' UNION ALL
  SELECT 'cable-car','ico_cablecar' UNION ALL
  SELECT 'weather','ico_weather' UNION ALL
  SELECT 'yoga','ico_yoga' UNION ALL
  SELECT 'bar-lounge','ico_bar_lounge'
) f ON fc.slug='activities' AND fc.tenant_id=0
ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key);

-- Transport
INSERT INTO features (tenant_id, category_id, slug, icon_key, is_system)
SELECT 0, fc.id, f.slug, f.icon_key, 1 FROM feature_categories fc
JOIN (
  SELECT 'access','ico_access' UNION ALL
  SELECT 'shuttle-bus','ico_shuttle_bus' UNION ALL
  SELECT 'flight-service','ico_flight' UNION ALL
  SELECT 'car-rental','ico_car_rental' UNION ALL
  SELECT 'bicycle-rental','ico_bicycle' 
) f ON fc.slug='transport' AND fc.tenant_id=0
ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key);

-- Wellness
INSERT INTO features (tenant_id, category_id, slug, icon_key, is_system)
SELECT 0, fc.id, f.slug, f.icon_key, 1 FROM feature_categories fc
JOIN (
  SELECT 'beauty-spa','ico_beauty_spa' UNION ALL
  SELECT 'massage','ico_massage' UNION ALL
  SELECT 'nursing-room','ico_nursing_dup'  -- sometimes appears in wellness too
) f ON fc.slug='wellness' AND fc.tenant_id=0
ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key);

-- Dining
INSERT INTO features (tenant_id, category_id, slug, icon_key, is_system)
SELECT 0, fc.id, f.slug, f.icon_key, 1 FROM feature_categories fc
JOIN (
  SELECT 'bar-lounge','ico_bar_lounge_dup' UNION ALL
  SELECT 'halal-food','ico_halal' UNION ALL
  SELECT 'ice-treat','ico_icetreat' UNION ALL
  SELECT 'in-room-dining','ico_inroom_dining_dup'
) f ON fc.slug='dining' AND fc.tenant_id=0
ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key);

-- Shopping
INSERT INTO features (tenant_id, category_id, slug, icon_key, is_system)
SELECT 0, fc.id, f.slug, f.icon_key, 1 FROM feature_categories fc
JOIN (
  SELECT 'convenience-store','ico_convenience' UNION ALL
  SELECT 'duty-free','ico_dutyfree' UNION ALL
  SELECT 'kimono-rental','ico_kimono_rental' 
) f ON fc.slug='shopping' AND fc.tenant_id=0
ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key);

-- Social & Links
INSERT INTO features (tenant_id, category_id, slug, icon_key, is_system)
SELECT 0, fc.id, f.slug, f.icon_key, 1 FROM feature_categories fc
JOIN (
  SELECT 'instagram','ico_instagram' UNION ALL
  SELECT 'facebook','ico_facebook' UNION ALL
  SELECT 'line','ico_line'
) f ON fc.slug='social' AND fc.tenant_id=0
ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key);

-- Policies / notices
INSERT INTO features (tenant_id, category_id, slug, icon_key, is_system)
SELECT 0, fc.id, f.slug, f.icon_key, 1 FROM feature_categories fc
JOIN (
  SELECT 'covid-measures','ico_covid' UNION ALL
  SELECT 'facility-congestion','ico_congestion' UNION ALL
  SELECT 'pet-friendly','ico_petfriendly' 
) f ON fc.slug='policies' AND fc.tenant_id=0
ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key);

-- Feature translations (English only as baseline; extend to VI/JA as needed)
INSERT INTO feature_translations (feature_id, locale, title)
SELECT id, 'en', UPPER(REPLACE(slug,'-',' ')) FROM features WHERE tenant_id=0
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Minimal VI translations for common items (optional)
INSERT INTO feature_translations (feature_id, locale, title) 
SELECT id, 'vi',
  CASE slug
    WHEN 'check-in' THEN 'Nhận phòng'
    WHEN 'check-out' THEN 'Trả phòng'
    WHEN 'wifi' THEN 'Wi‑Fi'
    WHEN 'in-room-dining' THEN 'Ăn uống tại phòng'
    WHEN 'amenities' THEN 'Tiện nghi'
    WHEN 'public-bath' THEN 'Phòng tắm công cộng'
    WHEN 'sauna' THEN 'Xông hơi'
    WHEN 'pool' THEN 'Hồ bơi'
    WHEN 'fitness' THEN 'Phòng gym'
    WHEN 'access' THEN 'Chỉ đường'
    WHEN 'shuttle-bus' THEN 'Xe đưa đón'
    WHEN 'car-rental' THEN 'Thuê xe'
    WHEN 'bicycle-rental' THEN 'Thuê xe đạp'
    WHEN 'beauty-spa' THEN 'Spa làm đẹp'
    WHEN 'massage' THEN 'Massage'
    WHEN 'restaurant-reservation' THEN 'Đặt bàn nhà hàng'
    WHEN 'convenience-store' THEN 'Cửa hàng tiện lợi'
    WHEN 'duty-free' THEN 'Miễn thuế'
    WHEN 'instagram' THEN 'Instagram'
    WHEN 'facebook' THEN 'Facebook'
    WHEN 'line' THEN 'LINE'
    WHEN 'q-and-a' THEN 'Hỏi đáp'
    WHEN 'evacuation-plan' THEN 'Sơ đồ thoát hiểm'
    ELSE UPPER(REPLACE(slug,'-',' '))
  END
FROM features WHERE tenant_id=0
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Enable all categories for demo property with sensible order
INSERT INTO property_categories (property_id, category_id, is_enabled, sort_order)
SELECT p.id, fc.id, 1,
  CASE fc.slug
    WHEN 'general' THEN 10
    WHEN 'services' THEN 20
    WHEN 'facilities' THEN 30
    WHEN 'activities' THEN 40
    WHEN 'transport' THEN 50
    WHEN 'wellness' THEN 60
    WHEN 'dining' THEN 70
    WHEN 'shopping' THEN 80
    WHEN 'social' THEN 90
    WHEN 'policies' THEN 100
    ELSE 999
  END
FROM properties p
JOIN tenants t ON t.id = p.tenant_id AND t.code='demo'
JOIN feature_categories fc ON fc.tenant_id=0
WHERE p.code='tabi-tower'
ON DUPLICATE KEY UPDATE is_enabled=VALUES(is_enabled), sort_order=VALUES(sort_order);

-- Enable all system features for demo property
INSERT INTO property_features (property_id, feature_id, is_enabled, sort_order)
SELECT p.id, f.id, 1, 100
FROM properties p
JOIN tenants t ON t.id = p.tenant_id AND t.code='demo'
JOIN features f ON f.tenant_id=0
WHERE p.code='tabi-tower'
ON DUPLICATE KEY UPDATE is_enabled=VALUES(is_enabled);

-- Create one published pinned post per feature with sample EN/VI content
INSERT INTO posts (tenant_id, property_id, feature_id, slug, status, pinned, published_at, created_at)
SELECT t.id AS tenant_id, p.id AS property_id, f.id AS feature_id, f.slug AS slug,
       'published' AS status, 1 AS pinned, NOW(), NOW()
FROM tenants t
JOIN properties p ON p.tenant_id = t.id AND p.code='tabi-tower'
JOIN features f ON f.tenant_id=0
WHERE t.code='demo'
ON DUPLICATE KEY UPDATE status='published', pinned=1, published_at=NOW();

-- Post translations EN
INSERT INTO post_translations (post_id, locale, title, subtitle, content_html, seo_title, seo_desc)
SELECT po.id, 'en',
       CONCAT(UPPER(REPLACE(f.slug,'-',' ')), ' – Information'),
       NULL,
       CONCAT('<h2>', UPPER(REPLACE(f.slug,'-',' ')), '</h2><p>Sample content for feature <strong>', f.slug, '</strong>. Replace with real hotel information.</p>'),
       UPPER(REPLACE(f.slug,'-',' ')),
       CONCAT('Details for ', f.slug)
FROM posts po
JOIN features f ON f.id = po.feature_id
JOIN properties p ON p.id = po.property_id AND p.code='tabi-tower'
JOIN tenants t ON t.id = po.tenant_id AND t.code='demo'
ON DUPLICATE KEY UPDATE title=VALUES(title), content_html=VALUES(content_html), seo_title=VALUES(seo_title), seo_desc=VALUES(seo_desc);

-- Post translations VI
INSERT INTO post_translations (post_id, locale, title, subtitle, content_html, seo_title, seo_desc)
SELECT po.id, 'vi',
       CONCAT(
         CASE f.slug
           WHEN 'check-in' THEN 'Hướng dẫn Nhận phòng'
           WHEN 'check-out' THEN 'Hướng dẫn Trả phòng'
           WHEN 'wifi' THEN 'Wi‑Fi'
           ELSE UPPER(REPLACE(f.slug,'-',' '))
         END
       ),
       NULL,
       CONCAT('<h2>', UPPER(REPLACE(f.slug,'-',' ')), '</h2><p>Nội dung mẫu cho mục <strong>', f.slug, '</strong>. Hãy thay bằng thông tin thật của khách sạn.</p>'),
       CONCAT('Thông tin ', f.slug),
       CONCAT('Chi tiết về ', f.slug)
FROM posts po
JOIN features f ON f.id = po.feature_id
JOIN properties p ON p.id = po.property_id AND p.code='tabi-tower'
JOIN tenants t ON t.id = po.tenant_id AND t.code='demo'
ON DUPLICATE KEY UPDATE title=VALUES(title), content_html=VALUES(content_html), seo_title=VALUES(seo_title), seo_desc=VALUES(seo_desc);

-- Basic settings for demo
INSERT INTO settings (tenant_id, property_id, key_name, value_json)
VALUES
((SELECT id FROM tenants WHERE code='demo'), 0, 'brand', JSON_OBJECT('primary','#0ea5e9','secondary','#111827'))
ON DUPLICATE KEY UPDATE value_json=VALUES(value_json);

INSERT INTO settings (tenant_id, property_id, key_name, value_json)
VALUES
((SELECT id FROM tenants WHERE code='demo'),
 (SELECT id FROM properties WHERE code='tabi-tower' AND tenant_id=(SELECT id FROM tenants WHERE code='demo')),
 'i18n', JSON_OBJECT('auto_detect', true, 'cookie_name','lang', 'fallback','en'))
ON DUPLICATE KEY UPDATE value_json=VALUES(value_json);

/* ---------------------------------------------------------------------
   END OF FILE
--------------------------------------------------------------------- */
