# ✅ Migration Complete: Property Locales as Single Source of Truth

## 🎯 Summary

Successfully migrated from dual storage (settings_json + vr_languages) to **Single Source of Truth** using `property_locales` table.

---

## 📦 Changes Made

### 1. **Backend API** ([properties.py](d:\db_travellink\hotel-link\backend-htlink\backend\app\api\v1\endpoints\properties.py))

Added unified property locales endpoints:
- `GET /properties/{id}/locales` - Get all locales for a property
- `POST /properties/{id}/locales` - Add a new locale
- `DELETE /properties/{id}/locales/{code}` - Remove a locale (soft delete)
- `PUT /properties/{id}/locales/{code}/default` - Set default locale

### 2. **Frontend API Client** ([propertyLocalesApi.ts](d:\db_travellink\hotel-link\backend-htlink\frontend\src\services\propertyLocalesApi.ts))

New unified API service for both Travel Link and VR Hotel:
```typescript
propertyLocalesApi.getLocales(propertyId)
propertyLocalesApi.addLocale(propertyId, { locale_code })
propertyLocalesApi.removeLocale(propertyId, localeCode)
propertyLocalesApi.setDefaultLocale(propertyId, localeCode)
propertyLocalesApi.syncLocales(propertyId, supportedLanguages)
```

### 3. **Settings Page** ([Settings.tsx](d:\db_travellink\hotel-link\backend-htlink\frontend\src\pages\Settings.tsx))

Updated to:
- Load supported languages from `property_locales` table instead of `settings_json`
- Save using `propertyLocalesApi.syncLocales()` instead of manual sync
- Only store timezone, dateFormat, fallbackLanguage in `settings_json` (non-language configs)
- Removed dependency on `vrHotelApi`

### 4. **Migration Script** ([migrate_languages_to_property_locales.sql](d:\db_travellink\hotel-link\backend-htlink\backend\migrations\migrate_languages_to_property_locales.sql))

- Migrates data from `settings_json.localization.supportedLanguages` to `property_locales`
- Verification queries included
- Rollback script provided

---

## 🗄️ Database Changes

### Current State:
```
property_locales table:
- Property 2: en, vi
- Property 3: en, vi  
- Property 8: vi (default), en, ja, ko, ms, fr
- Property 10: en, vi, zh
```

### Schema:
```sql
property_locales (
  id bigint PRIMARY KEY,
  tenant_id bigint FK → tenants(id),
  property_id bigint FK → properties(id),
  locale_code varchar(10) FK → locales(code),
  is_default tinyint(1),
  is_active tinyint(1),
  created_at timestamp,
  updated_at timestamp
)
```

---

## ✅ Benefits

### Before (Dual Storage):
❌ Data stored in 2 places: `settings_json` + `vr_languages`
❌ Required sync logic  
❌ Risk of data inconsistency
❌ Complex maintenance

### After (Single Source):
✅ Data stored in 1 place: `property_locales`
✅ No sync logic needed
✅ Data integrity with Foreign Keys
✅ Simple and clean
✅ Better performance with indexes
✅ Works for both Travel Link and VR Hotel

---

## 🧪 Testing

### Test Endpoints:

```bash
# Get locales for property 10
curl -X GET "http://localhost:8000/api/v1/properties/10/locales" \
  -H "Authorization: Bearer $TOKEN"

# Add Japanese
curl -X POST "http://localhost:8000/api/v1/properties/10/locales" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"locale_code": "ja"}'

# Set default locale
curl -X PUT "http://localhost:8000/api/v1/properties/10/locales/vi/default" \
  -H "Authorization: Bearer $TOKEN"
```

### Test UI:

1. Go to http://localhost:5173/settings?tab=localization
2. Select/deselect languages
3. Click Save
4. Verify API returns correct languages:
   ```sql
   SELECT * FROM property_locales WHERE property_id = 10;
   ```

---

## 📝 Migration Status

- ✅ Backend API created
- ✅ Frontend API service created  
- ✅ Settings page updated
- ✅ Migration script created
- ✅ Data migrated for existing properties
- ✅ Backend restarted successfully
- ✅ No compilation errors

---

## 🔄 What's Next (Optional)

1. **Remove old data from settings_json** (after verification):
   ```sql
   UPDATE properties 
   SET settings_json = JSON_REMOVE(settings_json, '$.localization.supportedLanguages')
   WHERE JSON_EXTRACT(settings_json, '$.localization.supportedLanguages') IS NOT NULL;
   ```

2. **Remove VR Hotel Languages API** (deprecated):
   - Keep for backward compatibility or remove if not used

3. **Update other components**:
   - CategoryModal
   - PostEditor
   - Any component using localStorage 'property_settings'

---

## 📚 Documentation

**API Endpoints:**
- Properties Locales: `/api/v1/properties/{id}/locales`
- Old VR Hotel API (deprecated): `/api/v1/vr-hotel/languages`

**Database Tables:**
- **Primary**: `property_locales` (Single Source of Truth)
- **Deprecated**: `vr_languages` (removed in migration)

**Frontend Services:**
- **Use**: `propertyLocalesApi` for all locale management
- **Avoid**: `vrHotelApi.languages` (deprecated)

---

**Migration Date:** 2026-01-10
**Impact:** Both Travel Link and VR Hotel
**Breaking Changes:** None (backward compatible)
**Rollback:** Available in migration script
