-- Add created_at to all INSERT statements
INSERT INTO locales (code, name, native_name) VALUES
('en','English','English'),
('vi','Vietnamese','Tiếng Việt'),
('ja','Japanese','日本語'),
('ko','Korean','한국어')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

-- Plan + Tenant + Property with created_at
INSERT INTO plans (code, name, created_at) VALUES ('basic','Basic', NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO tenants (plan_id, name, code, default_locale, fallback_locale, is_active, created_at)
VALUES ((SELECT id FROM plans WHERE code='basic'), 'Demo Hotel Chain', 'demo', 'en', 'en', 1, NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO properties (tenant_id, property_name, code, address, city, country, created_at)
VALUES (
  (SELECT id FROM tenants WHERE code='demo'),
  'Hotel Name', 'tabi-tower', '3-1-6 Mita, Minato, Tokyo 108-0068', 'Tokyo', 'Japan', NOW()
)
ON DUPLICATE KEY UPDATE property_name=VALUES(property_name), address=VALUES(address);

-- Categories (system, tenant_id=0) with created_at
INSERT INTO feature_categories (tenant_id, slug, icon_key, is_system, created_at) VALUES
(0,'general','ico_general',1, NOW()),
(0,'services','ico_services',1, NOW()),
(0,'facilities','ico_facilities',1, NOW()),
(0,'activities','ico_activities',1, NOW()),
(0,'transport','ico_transport',1, NOW()),
(0,'wellness','ico_wellness',1, NOW()),
(0,'dining','ico_dining',1, NOW()),
(0,'shopping','ico_shopping',1, NOW()),
(0,'social','ico_social',1, NOW()),
(0,'policies','ico_policies',1, NOW())
ON DUPLICATE KEY UPDATE icon_key=VALUES(icon_key);

-- Sample Features for demo
INSERT INTO features (tenant_id, category_id, slug, icon_key, is_system, title, description, is_active, created_at)
SELECT 0, fc.id, f.slug, f.icon_key, 1, f.title, f.description, 1, NOW()
FROM feature_categories fc
JOIN (
  SELECT 'wifi' AS slug, 'ico_wifi' AS icon_key, 'WiFi Internet' AS title, 'High-speed wireless internet access throughout the property' AS description
  UNION ALL SELECT 'swimming-pool','ico_pool','Swimming Pool','Outdoor swimming pool with sun deck and pool bar'
  UNION ALL SELECT 'restaurant','ico_restaurant','Restaurant','Fine dining restaurant with local and international cuisine'
  UNION ALL SELECT 'spa','ico_beauty_spa','Beauty Spa','Relaxing spa services with professional treatments'
  UNION ALL SELECT 'gym','ico_fitness','Fitness Center','Modern fitness center with latest equipment'
  UNION ALL SELECT 'parking','ico_parking','Parking','Secure parking facilities for guests'
) f ON fc.slug IN ('services', 'facilities', 'dining', 'wellness') AND fc.tenant_id=0
WHERE 
  (f.slug IN ('wifi', 'parking') AND fc.slug='services') OR
  (f.slug IN ('swimming-pool', 'gym') AND fc.slug='facilities') OR
  (f.slug='restaurant' AND fc.slug='dining') OR
  (f.slug='spa' AND fc.slug='wellness')
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description);

-- Admin user with proper role and created_at
INSERT INTO admin_users (tenant_id, email, password_hash, full_name, role, is_active, created_at)
VALUES (
  (SELECT id FROM tenants WHERE code='demo'),
  'admin@travel.link360.vn',
  '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- SecretPassword
  'Demo Admin User',
  'OWNER',
  1,
  NOW()
)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), role=VALUES(role);