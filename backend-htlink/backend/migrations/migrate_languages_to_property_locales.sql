-- ============================================================================
-- Migration: Move language data from settings_json to property_locales
-- Date: 2026-01-10
-- Description: Migrate supported languages from properties.settings_json 
--              to property_locales table (Single Source of Truth)
-- ============================================================================

-- Step 1: Backup current data
-- Run before migration: mysqldump -u root -p hotellink360_db properties > backup_properties_before_locale_migration.sql

-- Step 2: Insert languages from settings_json to property_locales
INSERT INTO property_locales (tenant_id, property_id, locale_code, is_default, is_active, created_at)
SELECT 
    p.tenant_id,
    p.id as property_id,
    JSON_UNQUOTE(JSON_EXTRACT(lang.value, '$')) as locale_code,
    (JSON_UNQUOTE(JSON_EXTRACT(lang.value, '$')) = p.default_locale) as is_default,
    1 as is_active,
    NOW() as created_at
FROM properties p
CROSS JOIN JSON_TABLE(
    COALESCE(
        JSON_EXTRACT(p.settings_json, '$.localization.supportedLanguages'),
        '["en", "vi"]'  -- Default if no languages set
    ),
    '$[*]' COLUMNS(value JSON PATH '$')
) as lang
WHERE NOT EXISTS (
    -- Avoid duplicates
    SELECT 1 FROM property_locales pl
    WHERE pl.property_id = p.id 
    AND pl.locale_code = JSON_UNQUOTE(JSON_EXTRACT(lang.value, '$'))
)
ORDER BY p.id;

-- Step 3: Verify migration
SELECT 
    'Before Migration (settings_json)' as source,
    p.id as property_id,
    p.property_name,
    JSON_EXTRACT(p.settings_json, '$.localization.supportedLanguages') as languages
FROM properties p
WHERE JSON_EXTRACT(p.settings_json, '$.localization.supportedLanguages') IS NOT NULL
UNION ALL
SELECT 
    'After Migration (property_locales)' as source,
    pl.property_id,
    p.property_name,
    GROUP_CONCAT(pl.locale_code ORDER BY pl.locale_code) as languages
FROM property_locales pl
JOIN properties p ON pl.property_id = p.id
WHERE pl.is_active = 1
GROUP BY pl.property_id, p.property_name
ORDER BY property_id, source DESC;

-- Step 4: Clean up settings_json (remove supportedLanguages)
-- IMPORTANT: Only run after verifying data migration is successful
/*
UPDATE properties 
SET settings_json = JSON_REMOVE(settings_json, '$.localization.supportedLanguages')
WHERE JSON_EXTRACT(settings_json, '$.localization.supportedLanguages') IS NOT NULL;
*/

-- Step 5: Verification queries
-- Check count of properties with locales
SELECT 
    'Properties with locales' as metric,
    COUNT(DISTINCT property_id) as count
FROM property_locales
WHERE is_active = 1
UNION ALL
SELECT 
    'Total active locales' as metric,
    COUNT(*) as count
FROM property_locales
WHERE is_active = 1;

-- Check properties with default locale
SELECT 
    p.id,
    p.property_name,
    p.default_locale,
    COUNT(pl.id) as locale_count,
    GROUP_CONCAT(
        CONCAT(pl.locale_code, IF(pl.is_default = 1, ' (default)', ''))
        ORDER BY pl.is_default DESC, pl.locale_code
    ) as locales
FROM properties p
LEFT JOIN property_locales pl ON p.id = pl.property_id AND pl.is_active = 1
GROUP BY p.id, p.property_name, p.default_locale
HAVING locale_count > 0
ORDER BY p.id;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

/*
-- Restore from backup
-- mysql -u root -p hotellink360_db < backup_properties_before_locale_migration.sql

-- Or manually delete migrated locales
DELETE FROM property_locales 
WHERE created_at >= '2026-01-10 00:00:00'  -- Adjust date/time as needed
AND id > 4;  -- Keep existing manually created locales

-- Restore settings_json from backup if needed
*/

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
