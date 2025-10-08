# 🎛️ System Settings Guide

## 📋 Overview

Phần **System Settings** trong Settings page cho phép quản lý các cài đặt hệ thống cấp property.

## 🎯 Location

**Path**: Settings → Advanced Tab → System Settings (Right panel)

## ⚙️ Available Settings

### 1. Auto Language Detection
- **Description**: Tự động phát hiện ngôn ngữ ưa thích của visitor
- **Type**: Toggle (ON/OFF)
- **Default**: ON (enabled)
- **Storage**: `settings_json.advanced.autoLanguageDetection`

**Use Case**:
- Khi visitor truy cập website, hệ thống tự động detect browser language
- Hiển thị content theo ngôn ngữ phù hợp
- Fallback về default language nếu không detect được

**Example**:
```javascript
// When enabled:
const browserLang = navigator.language; // 'ja-JP'
const detectedLocale = browserLang.split('-')[0]; // 'ja'
// → Show Japanese content

// When disabled:
// → Always show default language (e.g., 'en')
```

---

### 2. Analytics Tracking
- **Description**: Bật/tắt visitor analytics và tracking
- **Type**: Toggle (ON/OFF)
- **Default**: ON (enabled)
- **Storage**: `settings_json.advanced.analyticsTracking`

**Use Case**:
- Track visitor behavior, page views, clicks
- Collect analytics data for reporting
- Integration với Google Analytics, Mixpanel, etc.

**Example**:
```javascript
// When enabled:
trackPageView('/features');
trackEvent('button_click', { button: 'book_now' });

// When disabled:
// → No tracking calls made
```

---

### 3. Cache System
- **Description**: Bật/tắt content caching để tăng performance
- **Type**: Toggle (ON/OFF)
- **Default**: ON (enabled)
- **Storage**: `settings_json.advanced.cacheSystem`

**Use Case**:
- Cache API responses, images, static content
- Reduce server load
- Faster page load times

**Example**:
```javascript
// When enabled:
const cachedData = localStorage.getItem('features_cache');
if (cachedData && !isExpired(cachedData)) {
  return JSON.parse(cachedData);
}

// When disabled:
// → Always fetch fresh data from API
```

---

### 4. Property Active
- **Description**: Bật/tắt property hoàn toàn
- **Type**: Toggle (ON/OFF)
- **Default**: ON (enabled)
- **Storage**: `is_active` (property field)

**Use Case**:
- Temporarily disable property (maintenance mode)
- Hide property from public listings
- Prevent bookings/access

**Example**:
```javascript
// When enabled (is_active = true):
// → Property visible and accessible

// When disabled (is_active = false):
// → Show "Property is currently unavailable" message
// → Redirect to maintenance page
```

---

## 🎨 UI Design

### Toggle Switch Component

```tsx
<div className={`relative inline-block w-12 h-7 rounded-full cursor-pointer transition-colors ${
  isEnabled ? 'bg-blue-600' : 'bg-slate-200'
}`}>
  <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
    isEnabled ? 'transform translate-x-5' : ''
  }`}></span>
</div>
```

### Visual States

**Enabled (ON)**:
```
┌──────────────┐
│ ●────────○   │  Blue background, toggle on right
└──────────────┘
```

**Disabled (OFF)**:
```
┌──────────────┐
│ ○────────●   │  Gray background, toggle on left
└──────────────┘
```

---

## 💾 Data Storage

### Database Schema

**Table**: `properties`

```sql
CREATE TABLE properties (
  id INT PRIMARY KEY,
  property_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,  -- Property Active toggle
  settings_json JSON,                -- Other settings
  ...
);
```

### settings_json Structure

```json
{
  "advanced": {
    "autoLanguageDetection": true,
    "analyticsTracking": true,
    "cacheSystem": true
  },
  "branding": { ... },
  "localization": { ... },
  "contact": { ... }
}
```

---

## 🔄 Workflow

### 1. Load Settings

```typescript
// When property is selected
const loadPropertySettings = (property: ApiProperty) => {
  const advancedData = property.settings_json?.advanced || {};
  
  setAdvancedSettings({
    propertyActive: property.is_active,
    autoLanguageDetection: advancedData.autoLanguageDetection ?? true,
    analyticsTracking: advancedData.analyticsTracking ?? true,
    cacheSystem: advancedData.cacheSystem ?? true,
    introVideoUrl: property.intro_video_url || '',
    vr360Url: property.vr360_url || '',
    bannerImages: property.banner_images || []
  });
};
```

### 2. Toggle Setting

```typescript
const handleToggle = (setting: keyof AdvancedSettings) => {
  setAdvancedSettings(prev => ({
    ...prev,
    [setting]: !prev[setting]
  }));
};
```

### 3. Save Settings

```typescript
const saveSystemSettings = async () => {
  const propertyUpdateData = {
    is_active: advancedSettings.propertyActive,
    settings_json: {
      ...selectedProperty.settings_json,
      advanced: {
        autoLanguageDetection: advancedSettings.autoLanguageDetection,
        analyticsTracking: advancedSettings.analyticsTracking,
        cacheSystem: advancedSettings.cacheSystem
      }
    }
  };

  await propertiesApi.updateProperty(selectedPropertyId, propertyUpdateData);
  showSuccess('System settings saved successfully!');
};
```

---

## 🧪 Testing

### Test Case 1: Toggle Auto Language Detection

**Steps**:
1. Go to Settings → Advanced
2. Find "Auto Language Detection" toggle
3. Click to toggle OFF
4. Click "Save"
5. Reload page

**Expected**:
- ✅ Toggle switches to OFF state (gray)
- ✅ Success message appears
- ✅ Database updated: `settings_json.advanced.autoLanguageDetection = false`
- ✅ After reload, toggle remains OFF

---

### Test Case 2: Toggle Property Active

**Steps**:
1. Go to Settings → Advanced
2. Find "Property Active" toggle
3. Click to toggle OFF
4. Click "Save"
5. Check property status

**Expected**:
- ✅ Toggle switches to OFF state
- ✅ Success message appears
- ✅ Database updated: `is_active = false`
- ✅ Property hidden from public listings

---

### Test Case 3: Save Multiple Settings

**Steps**:
1. Toggle OFF: Auto Language Detection
2. Toggle OFF: Analytics Tracking
3. Keep ON: Cache System
4. Keep ON: Property Active
5. Click "Save"

**Expected**:
- ✅ All toggles saved correctly
- ✅ Database reflects all changes
- ✅ Success message appears

---

## 🔐 Permissions

- ✅ **Owner**: Full access to all settings
- ✅ **Admin**: Full access to all settings
- ✅ **Editor**: Full access to all settings
- ❌ **Viewer**: Read-only (no access to Settings page)

---

## 📊 API Endpoints

### Update Property Settings

```http
PUT /api/v1/properties/{property_id}
Authorization: Bearer {token}
X-Tenant-Code: {tenant_code}

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

**Response**:
```json
{
  "id": 1,
  "property_name": "Tabi Tower Hotel",
  "is_active": true,
  "settings_json": {
    "advanced": {
      "autoLanguageDetection": true,
      "analyticsTracking": true,
      "cacheSystem": true
    }
  },
  ...
}
```

---

## 🎯 Best Practices

### 1. Default Values
Always provide sensible defaults:
```typescript
autoLanguageDetection: advancedData.autoLanguageDetection ?? true
```

### 2. Confirmation for Critical Settings
Show confirmation dialog when disabling Property Active:
```typescript
if (setting === 'propertyActive' && !currentValue) {
  if (!confirm('Are you sure you want to disable this property?')) {
    return;
  }
}
```

### 3. Visual Feedback
Always show success/error messages after save:
```typescript
showSuccess('System settings saved successfully!');
```

---

## 🚀 Future Enhancements

1. **Maintenance Mode**
   - Separate toggle for maintenance mode
   - Custom maintenance page message
   - Scheduled maintenance windows

2. **Advanced Analytics**
   - Choose analytics provider (Google Analytics, Mixpanel, etc.)
   - Custom tracking events
   - Analytics dashboard

3. **Cache Configuration**
   - Cache duration settings
   - Cache invalidation rules
   - Cache statistics

4. **A/B Testing**
   - Enable/disable A/B testing
   - Configure test variants
   - View test results

---

## ✅ Summary

| Setting | Type | Storage | Default | Impact |
|---------|------|---------|---------|--------|
| Auto Language Detection | Boolean | settings_json | true | Language detection |
| Analytics Tracking | Boolean | settings_json | true | Tracking enabled |
| Cache System | Boolean | settings_json | true | Caching enabled |
| Property Active | Boolean | is_active | true | Property visibility |

**Status**: ✅ FULLY IMPLEMENTED

**Files**:
- `frontend/src/pages/Settings.tsx` (lines 1951-2023)
- Functions: `handleToggle()`, `saveSystemSettings()`
- State: `advancedSettings`

**Ready to use!** 🎉

