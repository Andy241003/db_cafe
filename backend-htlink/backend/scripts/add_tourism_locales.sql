-- Add Tourism Locales
-- Thêm 25+ ngôn ngữ phổ biến của các quốc gia/vùng lãnh thổ có lượng khách du lịch lớn đến Việt Nam
-- 
-- Cách dùng:
--   mysql -u hotellink360_user -p hotellink360_db < add_tourism_locales.sql
-- 
-- Hoặc trong Docker:
--   docker-compose exec db mysql -u hotellink360_user -pStrongDBPassword2024! hotellink360_db < /path/to/add_tourism_locales.sql

USE hotellink360_db;

-- 🌏 Châu Á - Nguồn khách lớn nhất của Việt Nam
INSERT INTO locales (code, name, native_name) VALUES 
('zh-CN', 'Chinese (Simplified)', '中文（简体）')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('zh-TW', 'Chinese (Traditional)', '中文（繁體）')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('ko', 'Korean', '한국어')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('ja', 'Japanese', '日本語')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('th', 'Thai', 'ภาษาไทย')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('ms', 'Malay', 'Bahasa Melayu')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('id', 'Indonesian', 'Bahasa Indonesia')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('tl', 'Filipino (Tagalog)', 'Tagalog')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('yue', 'Cantonese', '粵語')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

-- 🌍 Châu Âu
INSERT INTO locales (code, name, native_name) VALUES 
('en', 'English', 'English')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('fr', 'French', 'Français')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('de', 'German', 'Deutsch')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('ru', 'Russian', 'Русский')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('es', 'Spanish', 'Español')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('it', 'Italian', 'Italiano')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

-- 🌎 Châu Mỹ & Châu Đại Dương
INSERT INTO locales (code, name, native_name) VALUES 
('en-US', 'English (US)', 'English (US)')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('en-AU', 'English (Australia)', 'English (AU)')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('en-CA', 'English (Canada)', 'English (CA)')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('fr-CA', 'French (Canada)', 'Français (CA)')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('pt-BR', 'Portuguese (Brazil)', 'Português (BR)')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

-- 🌍 Trung Đông & Nam Á
INSERT INTO locales (code, name, native_name) VALUES 
('hi', 'Hindi', 'हिन्दी')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('ar', 'Arabic', 'العربية')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

INSERT INTO locales (code, name, native_name) VALUES 
('ta', 'Tamil', 'தமிழ்')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

-- 🇻🇳 Việt Nam
INSERT INTO locales (code, name, native_name) VALUES 
('vi', 'Vietnamese', 'Tiếng Việt')
ON DUPLICATE KEY UPDATE name=VALUES(name), native_name=VALUES(native_name);

-- Verify all locales were added
SELECT '✅ All tourism locales added successfully!' AS status;
SELECT COUNT(*) AS total_locales FROM locales;

-- Display all locales
SELECT 
    code,
    name,
    native_name
FROM locales 
ORDER BY 
    CASE 
        WHEN code IN ('zh-CN', 'zh-TW', 'ko', 'ja', 'th', 'ms', 'id', 'tl', 'yue') THEN 1
        WHEN code IN ('en', 'fr', 'de', 'ru', 'es', 'it') THEN 2
        WHEN code IN ('en-US', 'en-AU', 'en-CA', 'fr-CA', 'pt-BR') THEN 3
        WHEN code IN ('hi', 'ar', 'ta') THEN 4
        WHEN code = 'vi' THEN 5
        ELSE 6
    END,
    code;

