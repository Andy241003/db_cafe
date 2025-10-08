# 🎛️ System Settings - Quick Reference

## 📍 Location
```
Settings → Advanced Tab → System Settings (Right Panel)
```

## ⚙️ Settings

| Setting | Icon | Description | Storage | Default |
|---------|------|-------------|---------|---------|
| **Auto Language Detection** | 🌐 | Tự động phát hiện ngôn ngữ visitor | `settings_json.advanced.autoLanguageDetection` | ✅ ON |
| **Analytics Tracking** | 📊 | Bật/tắt visitor analytics | `settings_json.advanced.analyticsTracking` | ✅ ON |
| **Cache System** | ⚡ | Bật/tắt content caching | `settings_json.advanced.cacheSystem` | ✅ ON |
| **Property Active** | 🏨 | Bật/tắt property hoàn toàn | `is_active` | ✅ ON |

## 🎨 Toggle States

### ON (Enabled)
```
●─────○  Blue background (#3b82f6)
```

### OFF (Disabled)
```
○─────●  Gray background (#e2e8f0)
```

## 💾 Save Data

### API Call
```http
PUT /api/v1/properties/{id}
```

### Request Body
```json
{
  "is_active": true,
  "settings_json": {
    "advanced": {
      "autoLanguageDetection": true,
      "analyticsTracking": true,
      "cacheSystem": true
    }
  }
}
```

## 🔧 Code Snippets

### Toggle Handler
```typescript
const handleToggle = (setting: keyof AdvancedSettings) => {
  setAdvancedSettings(prev => ({
    ...prev,
    [setting]: !prev[setting]
  }));
};
```

### Save Function
```typescript
const saveSystemSettings = async () => {
  await propertiesApi.updateProperty(selectedPropertyId, {
    is_active: advancedSettings.propertyActive,
    settings_json: {
      ...selectedProperty.settings_json,
      advanced: {
        autoLanguageDetection: advancedSettings.autoLanguageDetection,
        analyticsTracking: advancedSettings.analyticsTracking,
        cacheSystem: advancedSettings.cacheSystem
      }
    }
  });
  showSuccess('System settings saved successfully!');
};
```

## 🧪 Quick Test

1. Open: `http://localhost:3000/settings`
2. Click: **Advanced** tab
3. Scroll: Right panel → **System Settings**
4. Toggle: Any setting
5. Click: **Save**
6. Verify: Success message appears

## 📊 Database

### Table: `properties`
```sql
SELECT 
  id,
  property_name,
  is_active,
  JSON_EXTRACT(settings_json, '$.advanced.autoLanguageDetection') as auto_lang,
  JSON_EXTRACT(settings_json, '$.advanced.analyticsTracking') as analytics,
  JSON_EXTRACT(settings_json, '$.advanced.cacheSystem') as cache
FROM properties
WHERE id = ?;
```

## ✅ Status

**Implementation**: ✅ 100% Complete  
**Testing**: ⬜ Pending  
**Documentation**: ✅ Complete  
**Ready to Use**: ✅ Yes

## 📚 Full Docs

- `SYSTEM_SETTINGS_GUIDE.md` - Detailed guide
- `SYSTEM_SETTINGS_SUMMARY.md` - Summary
- `SYSTEM_SETTINGS_QUICK_REF.md` - This file

---

**Last Updated**: 2025-10-08  
**Version**: 1.0.0  
**Status**: Production Ready ✨

