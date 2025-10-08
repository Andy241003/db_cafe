-- Add missing locales to fix translation errors
-- Run this SQL script if you get locale-related errors

-- For MySQL/MariaDB:
INSERT INTO locales (code, name, native_name) VALUES 
('en', 'English', 'English'),
('vi', 'Vietnamese', 'Tiếng Việt'),
('ja', 'Japanese', '日本語'),
('kr', 'Korean', '한국어'),
('fr', 'French', 'Français'),
('zh', 'Chinese', '中文'),
('es', 'Spanish', 'Español'),
('de', 'German', 'Deutsch')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- For PostgreSQL:
-- INSERT INTO locales (code, name, native_name) VALUES 
-- ('en', 'English', 'English'),
-- ('vi', 'Vietnamese', 'Tiếng Việt'),
-- ('ja', 'Japanese', '日本語'),
-- ('kr', 'Korean', '한국어'),
-- ('fr', 'French', 'Français'),
-- ('zh', 'Chinese', '中文'),
-- ('es', 'Spanish', 'Español'),
-- ('de', 'German', 'Deutsch')
-- ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Verify locales were added:
SELECT * FROM locales ORDER BY code;

