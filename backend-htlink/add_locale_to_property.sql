-- ============================================================================
-- Script: Add Locale to Property
-- Usage: Add specific languages to property_locales table
-- ============================================================================

-- Example: Add Spanish (es) and French (fr) to Property 10
-- Replace property_id = 10 with your property ID

-- Get current tenant_id for property
SET @property_id = 10;
SET @tenant_id = (SELECT tenant_id FROM properties WHERE id = @property_id);

-- Add Spanish (es)
INSERT INTO property_locales (tenant_id, property_id, locale_code, is_default, is_active, created_at)
SELECT @tenant_id, @property_id, 'es', 0, 1, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM property_locales 
    WHERE property_id = @property_id AND locale_code = 'es'
);

-- Add French (fr)
INSERT INTO property_locales (tenant_id, property_id, locale_code, is_default, is_active, created_at)
SELECT @tenant_id, @property_id, 'fr', 0, 1, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM property_locales 
    WHERE property_id = @property_id AND locale_code = 'fr'
);

-- Add Japanese (ja)
INSERT INTO property_locales (tenant_id, property_id, locale_code, is_default, is_active, created_at)
SELECT @tenant_id, @property_id, 'ja', 0, 1, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM property_locales 
    WHERE property_id = @property_id AND locale_code = 'ja'
);

-- Verify results
SELECT 
    pl.id,
    pl.property_id,
    p.property_name,
    pl.locale_code,
    l.name as locale_name,
    l.native_name,
    pl.is_default,
    pl.is_active
FROM property_locales pl
JOIN properties p ON pl.property_id = p.id
JOIN locales l ON pl.locale_code = l.code
WHERE pl.property_id = @property_id
ORDER BY pl.is_default DESC, pl.locale_code;

-- ============================================================================
-- Available Locale Codes:
-- ============================================================================
-- ar   - Arabic (العربية)
-- de   - German (Deutsch)
-- en   - English
-- es   - Spanish (Español)
-- fr   - French (Français)
-- hi   - Hindi (हिन्दी)
-- id   - Indonesian (Bahasa Indonesia)
-- it   - Italian (Italiano)
-- ja   - Japanese (日本語)
-- ko   - Korean (한국어)
-- ms   - Malay (Bahasa Melayu)
-- pt   - Portuguese (Português)
-- ru   - Russian (Русский)
-- ta   - Tamil (தமிழ்)
-- th   - Thai (ภาษาไทย)
-- tl   - Filipino/Tagalog
-- vi   - Vietnamese (Tiếng Việt)
-- yue  - Cantonese (粵語)
-- zh   - Chinese Simplified (中文)
-- zh-TW - Chinese Traditional (繁體中文)
