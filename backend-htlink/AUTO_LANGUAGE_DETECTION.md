# Auto Language Detection - Complete Implementation

## Overview
Auto Language Detection automatically detects the user's browser language and sets the application locale accordingly. This feature can be enabled/disabled via the Settings page.

## Architecture

### 1. **Utility Function** (`src/utils/languageDetection.ts`)

New centralized utility for language detection:

```typescript
import { autoDetectLanguage } from './utils/languageDetection';

// Auto-detect language based on browser settings
await autoDetectLanguage();
```

**Features:**
- ✅ Checks if Auto Language Detection is enabled in Settings
- ✅ Respects user manual language selection (doesn't override)
- ✅ Uses supported languages from property settings
- ✅ Falls back to default language if browser language not supported
- ✅ Dispatches events to notify other components
- ✅ Implements smart caching to avoid redundant detections

### 2. **App-Level Integration** (`src/App.tsx`)

Auto-detection runs globally when user logs in:

```typescript
// Auto-detect browser language on app mount
useEffect(() => {
  // Only run if user is authenticated
  if (isAuthenticated) {
    autoDetectLanguage().catch(error => {
      console.error('Failed to auto-detect language:', error);
    });
  }
}, [isAuthenticated]); // Run when auth state changes
```

### 3. **Settings Page Integration** (`src/pages/Settings.tsx`)

Toggle in Advanced Settings triggers auto-detection:

```typescript
// If Auto Language Detection was enabled, trigger it now
if (advancedSettings.autoLanguageDetection) {
  console.log('🌐 [Settings] Auto Language Detection enabled, triggering detection...');
  await autoDetectLanguage();
}
```

## How It Works

### Detection Flow:

1. **Check Enable Status**
   ```
   Is Auto Language Detection enabled in Settings?
   → NO: Skip detection
   → YES: Continue
   ```

2. **Check User Selection**
   ```
   Did user manually select a language?
   → YES: Skip detection (respect user choice)
   → NO: Continue
   ```

3. **Get Browser Language**
   ```
   navigator.language → "vi-VN"
   Extract code → "vi"
   ```

4. **Check Supported Languages**
   ```
   Is "vi" in property's supported languages?
   → YES: Use "vi"
   → NO: Use default language (e.g., "en")
   ```

5. **Set Locale**
   ```
   localStorage.setItem('locale', detectedLocale)
   localStorage.setItem('locale_auto_detected', 'true')
   Dispatch 'locale-changed' event
   ```

## LocalStorage Keys

| Key | Description | Example |
|-----|-------------|---------|
| `locale` | Current locale code | `"vi"`, `"en"`, `"ja"` |
| `locale_auto_detected` | Flag if locale was auto-detected | `"true"` or not set |
| `user_selected_locale` | Flag if user manually selected locale | `"true"` or not set |
| `property_settings` | Property settings including supported languages | `{"supportedLanguages": ["en", "vi"]}` |

## User Scenarios

### Scenario 1: First Visit (Auto-Detection Enabled)
```
1. User opens app with browser language = "vi-VN"
2. Auto Language Detection is enabled (default)
3. System detects "vi" from browser
4. "vi" is in supported languages
5. Sets locale to "vi"
6. App displays in Vietnamese
```

### Scenario 2: User Manual Selection
```
1. User clicks language selector
2. Selects "English (EN)"
3. System sets:
   - locale = "en"
   - user_selected_locale = "true"
4. Future auto-detections are skipped
5. App always uses English
```

### Scenario 3: Disabled Auto-Detection
```
1. Admin goes to Settings → Advanced
2. Turns OFF "Auto Language Detection"
3. Saves settings
4. New users will NOT have auto-detection
5. Must manually select language
```

### Scenario 4: Unsupported Browser Language
```
1. User browser language = "ar-SA" (Arabic)
2. Arabic not in supported languages
3. System falls back to default language ("en")
4. App displays in English
```

## Settings Page Configuration

### Toggle Location:
```
Settings → Advanced Tab → System Settings
```

### Toggle UI:
```
┌─────────────────────────────────────────┐
│ System Settings                          │
├─────────────────────────────────────────┤
│                                          │
│ Auto Language Detection          [ON/OFF]│
│ Automatically detect visitor's           │
│ preferred language                       │
│                                          │
│ Analytics Tracking              [ON/OFF] │
│ Enable visitor analytics and tracking    │
│                                          │
│ Cache System                    [ON/OFF] │
│ Enable content caching for better        │
│ performance                              │
│                                          │
│ Property Active                 [ON/OFF] │
│ Enable/disable this property entirely    │
│                                          │
│              [Save]                      │
└─────────────────────────────────────────┘
```

## Storage Location

Settings are stored in:
```json
{
  "settings_json": {
    "advanced": {
      "autoLanguageDetection": true,
      "analyticsTracking": true,
      "cacheSystem": true
    }
  }
}
```

## API Integration

### Database Field:
```sql
properties.settings_json->>'advanced'->>'autoLanguageDetection'
```

### Update via API:
```typescript
await propertiesApi.updateProperty(propertyId, {
  settings_json: {
    ...property.settings_json,
    advanced: {
      autoLanguageDetection: true,
      analyticsTracking: true,
      cacheSystem: true
    }
  }
});
```

## Testing

### Test 1: Enable Auto-Detection
```
1. Go to Settings → Advanced
2. Enable "Auto Language Detection"
3. Click "Save"
4. Open browser console
5. Should see: "🌐 [Settings] Auto Language Detection enabled, triggering detection..."
6. Logout and login again
7. Check localStorage.locale matches browser language
```

### Test 2: Disable Auto-Detection
```
1. Go to Settings → Advanced
2. Disable "Auto Language Detection"
3. Click "Save"
4. Clear localStorage.locale
5. Logout and login again
6. localStorage.locale should NOT be set automatically
7. Must manually select language
```

### Test 3: User Manual Selection Override
```
1. Enable Auto-Detection
2. Browser language = "vi"
3. App detects and sets to "vi" ✅
4. User manually selects "English" from dropdown
5. user_selected_locale = "true" is set
6. Logout and login again
7. App should stay in "English" (not auto-detect to "vi")
```

### Test 4: Unsupported Language
```
1. Change browser language to "Arabic" (ar)
2. Ensure "ar" NOT in supported languages
3. Login
4. Should see: "Browser language: ar-SA → Using locale: en"
5. App displays in default language (English)
```

## Console Logs

### Successful Detection:
```
🌐 [Auto-Detect] Browser language: vi-VN → Using locale: vi
```

### Already Detected:
```
🌐 [Auto-Detect] Already using detected locale: vi
```

### Disabled:
```
🌐 [Auto-Detect] Auto Language Detection is disabled in Settings
```

### User Manual Selection:
```
🌐 [Auto-Detect] Skipping: User manually selected locale
```

### Locale Already Set:
```
🌐 [Auto-Detect] Skipping: Locale already set manually
```

## Migration from Old Code

### Before (Hard-coded in Features.tsx):
```typescript
// Auto-detect browser language and set locale (like modern SaaS apps)
useEffect(() => {
  const existingLocale = localStorage.getItem('locale');
  
  if (!existingLocale) {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    const languageCode = browserLang.split('-')[0].toLowerCase();
    const supportedLanguages = ['en', 'vi', 'ja', 'ko', 'zh', 'fr', 'de', 'es'];
    const detectedLocale = supportedLanguages.includes(languageCode) ? languageCode : 'en';
    
    localStorage.setItem('locale', detectedLocale);
    console.log(`🌐 Auto-detected browser language: ${browserLang} → Using locale: ${detectedLocale}`);
  }
}, []);
```

**Issues:**
- ❌ Hard-coded supported languages
- ❌ No Settings integration
- ❌ Can't be disabled
- ❌ Duplicated in every page
- ❌ No respect for user manual selection

### After (Centralized Utility):
```typescript
import { autoDetectLanguage } from './utils/languageDetection';

// In App.tsx (runs once globally)
useEffect(() => {
  if (isAuthenticated) {
    autoDetectLanguage().catch(error => {
      console.error('Failed to auto-detect language:', error);
    });
  }
}, [isAuthenticated]);
```

**Benefits:**
- ✅ Centralized logic
- ✅ Settings integration
- ✅ Can be enabled/disabled
- ✅ Respects user manual selection
- ✅ Uses property's supported languages
- ✅ Runs globally (not per-page)

## Browser Support

Supported browsers:
- ✅ Chrome/Edge (navigator.language)
- ✅ Firefox (navigator.language)
- ✅ Safari (navigator.language)
- ✅ IE11 (navigator.userLanguage fallback)

## Supported Languages

Default supported languages:
```typescript
['en', 'vi', 'ja', 'ko', 'zh', 'fr', 'de', 'es']
```

Can be customized in Settings → Localization → Supported Languages

## Benefits

1. **User Experience**
   - No manual language selection needed
   - Instant localization on first visit
   - Matches modern SaaS apps (Notion, Linear, Stripe)

2. **Admin Control**
   - Can enable/disable globally
   - Respects user preferences
   - Configurable per property

3. **Developer Experience**
   - Centralized logic
   - Easy to test
   - Well-documented
   - Event-driven architecture

4. **Performance**
   - Runs once on login
   - Smart caching
   - No redundant API calls

## Related Files

- `src/utils/languageDetection.ts` - Main utility
- `src/App.tsx` - Global auto-detection trigger
- `src/pages/Settings.tsx` - Settings UI and save logic
- `src/pages/Features.tsx` - Removed old hard-coded logic
- `backend-htlink/AUTO_LANGUAGE_DETECTION.md` - This documentation

## Future Enhancements

Potential improvements:
- [ ] Detect language from IP geolocation
- [ ] Remember user language across devices (API-based)
- [ ] A/B test different default languages
- [ ] Language preference in user profile
- [ ] Analytics on most-used languages

---

**Status:** ✅ Fully Implemented and Tested
**Version:** 1.0.0
**Last Updated:** October 17, 2025
