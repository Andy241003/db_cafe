-- Seed data only (no CREATE statements)
USE hotellink360_db;

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
INSERT INTO plans (code, name, created_at) VALUES ('basic','Basic', NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO tenants (plan_id, name, code, default_locale, fallback_locale, is_active, created_at)
VALUES ((SELECT id FROM plans WHERE code='basic'), 'Demo Hotel Chain', 'demo', 'en', 'en', 1, NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO properties (tenant_id, property_name, code, address, city, country, timezone, default_locale, is_active, created_at)
VALUES (
  (SELECT id FROM tenants WHERE code='demo'),
  'Hotel Name', 'tabi-tower', '3-1-6 Mita, Minato, Tokyo 108-0068', 'Tokyo', 'Japan', 'Asia/Tokyo', 'en', 1, NOW()
)
ON DUPLICATE KEY UPDATE property_name=VALUES(property_name), address=VALUES(address);

-- Categories (system, tenant_id=0)
INSERT INTO feature_categories (tenant_id, slug, icon_key, is_system, created_at) VALUES
(0,'general','ico_general',1,NOW()),
(0,'services','ico_services',1,NOW()),
(0,'facilities','ico_facilities',1,NOW()),
(0,'activities','ico_activities',1,NOW()),
(0,'transport','ico_transport',1,NOW()),
(0,'wellness','ico_wellness',1,NOW()),
(0,'dining','ico_dining',1,NOW()),
(0,'shopping','ico_shopping',1,NOW()),
(0,'social','ico_social',1,NOW()),
(0,'policies','ico_policies',1,NOW())
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

-- Features (simplified approach)
-- General features
INSERT INTO features (tenant_id, category_id, slug, icon_key, is_system, created_at) VALUES
(0, (SELECT id FROM feature_categories WHERE slug='general' AND tenant_id=0 LIMIT 1), 'check-in', 'ico_checkin', 1, NOW()),
(0, (SELECT id FROM feature_categories WHERE slug='general' AND tenant_id=0 LIMIT 1), 'check-out', 'ico_checkout', 1, NOW()),
(0, (SELECT id FROM feature_categories WHERE slug='general' AND tenant_id=0 LIMIT 1), 'wifi', 'ico_wifi', 1, NOW()),
(0, (SELECT id FROM feature_categories WHERE slug='general' AND tenant_id=0 LIMIT 1), 'air-conditioning', 'ico_aircon', 1, NOW()),
(0, (SELECT id FROM feature_categories WHERE slug='general' AND tenant_id=0 LIMIT 1), 'safe', 'ico_safe', 1, NOW())
ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key);

-- Services features  
INSERT INTO features (tenant_id, category_id, slug, icon_key, is_system, created_at) VALUES
(0, (SELECT id FROM feature_categories WHERE slug='services' AND tenant_id=0 LIMIT 1), 'in-room-dining', 'ico_inroom_dining', 1, NOW()),
(0, (SELECT id FROM feature_categories WHERE slug='services' AND tenant_id=0 LIMIT 1), 'concierge', 'ico_concierge', 1, NOW()),
(0, (SELECT id FROM feature_categories WHERE slug='services' AND tenant_id=0 LIMIT 1), 'parking', 'ico_parking', 1, NOW()),
(0, (SELECT id FROM feature_categories WHERE slug='services' AND tenant_id=0 LIMIT 1), 'restaurant-reservation', 'ico_restaurant', 1, NOW()),
(0, (SELECT id FROM feature_categories WHERE slug='services' AND tenant_id=0 LIMIT 1), 'workspace', 'ico_workspace', 1, NOW())
ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key);

-- Feature translations (English only as baseline)
INSERT INTO feature_translations (feature_id, locale, title)
SELECT id, 'en', UPPER(REPLACE(slug,'-',' ')) FROM features WHERE tenant_id=0
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Enable all categories for demo property
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

-- Create one published pinned post per feature with sample EN content
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

-- Basic settings for demo
INSERT INTO settings (tenant_id, property_id, key_name, value_json)
VALUES
((SELECT id FROM tenants WHERE code='demo'), 0, 'brand', JSON_OBJECT('primary','#0ea5e9','secondary','#111827'))
ON DUPLICATE KEY UPDATE value_json=VALUES(value_json);