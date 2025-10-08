-- Add French locale if missing
INSERT INTO locales (code, name, native_name) VALUES ('fr', 'French', 'Français')
ON DUPLICATE KEY UPDATE name='French';

-- Verify
SELECT * FROM locales ORDER BY code;

