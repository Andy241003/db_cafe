# 🧪 Test Plan: Language Auto-Add Feature

## 📋 Test Environment

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Database**: MySQL (locales table)

## 🎯 Test Objectives

1. Verify locale auto-creation when selecting new language
2. Verify UI updates correctly
3. Verify database changes
4. Verify error handling

---

## Test Case 1: Add New Language (French)

### Prerequisites:
- French locale does NOT exist in database
- User is logged in with Editor/Admin/Owner role

### Steps:
1. Navigate to Settings page: `http://localhost:3000/settings`
2. Click on "Localization" tab
3. Scroll to "Supported Languages" section
4. Observe French language card:
   - Should have badge "NEW" (green background)
   - Should NOT be checked
5. Click on French language card
6. Wait for API call to complete

### Expected Results:
- ✅ Success message appears: "Language French added to system"
- ✅ French card is now checked (blue border, blue background)
- ✅ Badge "NEW" disappears after page reload
- ✅ Console shows:
  ```
  📝 Creating new locale: fr
  ✅ Locale fr created successfully
  📋 Existing locales: ['en', 'vi', 'ja', 'ko', 'fr']
  ```

### Database Verification:
```sql
SELECT * FROM locales WHERE code = 'fr';
-- Should return: code='fr', name='French', native_name='Français'
```

### API Calls:
```
1. GET /api/v1/locales/fr → 404 Not Found
2. POST /api/v1/locales/ → 200 OK
   Body: {"code": "fr", "name": "French", "native_name": "Français"}
3. GET /api/v1/locales/ → 200 OK (reload list)
```

---

## Test Case 2: Add Existing Language (English)

### Prerequisites:
- English locale already exists in database
- User is logged in

### Steps:
1. Navigate to Settings → Localization
2. Observe English language card:
   - Should NOT have badge "NEW"
   - May or may not be checked
3. If not checked, click on English card

### Expected Results:
- ✅ English card is checked immediately
- ✅ NO success message appears
- ✅ NO API call to create locale
- ✅ Console shows:
  ```
  ✅ Locale en already exists
  ```

### API Calls:
```
1. GET /api/v1/locales/en → 200 OK (locale exists)
```

---

## Test Case 3: Remove Language

### Prerequisites:
- At least one language is checked
- User is logged in

### Steps:
1. Navigate to Settings → Localization
2. Click on a checked language card

### Expected Results:
- ✅ Language card is unchecked
- ✅ NO API call to delete locale
- ✅ Locale still exists in database
- ✅ Only removed from `supportedLanguages` array

### Database Verification:
```sql
SELECT * FROM locales;
-- All locales should still exist
```

---

## Test Case 4: Add Multiple Languages

### Prerequisites:
- Multiple languages with "NEW" badge available
- User is logged in

### Steps:
1. Navigate to Settings → Localization
2. Click on French (NEW)
3. Wait for success message
4. Click on Chinese (NEW)
5. Wait for success message

### Expected Results:
- ✅ Both languages are checked
- ✅ Two success messages appear
- ✅ Both locales created in database
- ✅ Both badges "NEW" disappear after reload

### Database Verification:
```sql
SELECT * FROM locales WHERE code IN ('fr', 'zh');
-- Should return 2 rows
```

---

## Test Case 5: Save Settings

### Prerequisites:
- At least one new language selected
- User is logged in

### Steps:
1. Navigate to Settings → Localization
2. Select French (NEW)
3. Click "Save" button at bottom
4. Wait for save to complete

### Expected Results:
- ✅ Settings saved successfully
- ✅ Property settings updated with new supported languages
- ✅ Success message: "Settings saved successfully"

### Database Verification:
```sql
SELECT settings_json FROM properties WHERE id = ?;
-- Should contain: {"supportedLanguages": ["en", "vi", "ja", "ko", "fr"]}
```

---

## Test Case 6: Error Handling - API Failure

### Prerequisites:
- Backend is running
- User is logged in

### Steps:
1. Stop backend server temporarily
2. Navigate to Settings → Localization
3. Click on French (NEW)
4. Wait for error

### Expected Results:
- ✅ Error message appears: "Failed to add language. Please try again."
- ✅ Language card is NOT checked
- ✅ Console shows error details

---

## Test Case 7: Error Handling - Duplicate Locale

### Prerequisites:
- French locale already exists in database
- User is logged in

### Steps:
1. Navigate to Settings → Localization
2. Click on French (should NOT have NEW badge)

### Expected Results:
- ✅ French is checked immediately
- ✅ NO attempt to create duplicate locale
- ✅ NO error message

---

## Test Case 8: UI State After Reload

### Prerequisites:
- French locale was created in previous session
- User is logged in

### Steps:
1. Navigate to Settings → Localization
2. Observe French language card

### Expected Results:
- ✅ French card does NOT have "NEW" badge
- ✅ French may or may not be checked (depends on property settings)
- ✅ `existingLocales` state includes 'fr'

---

## Test Case 9: Translation Features Integration

### Prerequisites:
- French locale was added
- User is logged in

### Steps:
1. Navigate to Features page
2. Click Edit on any feature
3. Open translation modal
4. Check available locales

### Expected Results:
- ✅ French appears in locale dropdown
- ✅ Can create French translation
- ✅ Translation API recognizes French locale

---

## Test Case 10: Permission Check

### Prerequisites:
- User is logged in with different roles

### Test with each role:
- ✅ **Owner**: Can add languages
- ✅ **Admin**: Can add languages
- ✅ **Editor**: Can add languages
- ❌ **Viewer**: Should not have access to Settings

---

## 📊 Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: Add New Language | ⬜ | |
| TC2: Add Existing Language | ⬜ | |
| TC3: Remove Language | ⬜ | |
| TC4: Add Multiple Languages | ⬜ | |
| TC5: Save Settings | ⬜ | |
| TC6: API Failure | ⬜ | |
| TC7: Duplicate Locale | ⬜ | |
| TC8: UI After Reload | ⬜ | |
| TC9: Translation Integration | ⬜ | |
| TC10: Permission Check | ⬜ | |

---

## 🐛 Known Issues

(To be filled during testing)

---

## 📝 Test Data

### Initial Locales (Default):
```json
[
  {"code": "en", "name": "English", "native_name": "English"},
  {"code": "vi", "name": "Vietnamese", "native_name": "Tiếng Việt"},
  {"code": "ja", "name": "Japanese", "native_name": "日本語"},
  {"code": "ko", "name": "Korean", "native_name": "한국어"}
]
```

### Languages Available in UI:
```json
[
  {"code": "en", "name": "English", "native": "English", "flag": "🇺🇸"},
  {"code": "vi", "name": "Vietnamese", "native": "Tiếng Việt", "flag": "🇻🇳"},
  {"code": "ja", "name": "Japanese", "native": "日本語", "flag": "🇯🇵"},
  {"code": "ko", "name": "Korean", "native": "한국어", "flag": "🇰🇷"},
  {"code": "zh", "name": "Chinese (Simplified)", "native": "简体中文", "flag": "🇨🇳"},
  {"code": "fr", "name": "French", "native": "Français", "flag": "🇫🇷"}
]
```

---

## 🔍 Debugging Tips

### Check Console Logs:
```javascript
// Should see these logs when adding new language:
📝 Creating new locale: fr
✅ Locale fr created successfully
📋 Existing locales: ['en', 'vi', 'ja', 'ko', 'fr']
```

### Check Network Tab:
```
POST /api/v1/locales/
Status: 200 OK
Response: {"code": "fr", "name": "French", "native_name": "Français"}
```

### Check Database:
```sql
-- Check locales table
SELECT * FROM locales ORDER BY code;

-- Check property settings
SELECT id, property_name, settings_json 
FROM properties 
WHERE id = ?;
```

### Check State:
```javascript
// In React DevTools, check Settings component state:
existingLocales: ['en', 'vi', 'ja', 'ko', 'fr']
localizationSettings.supportedLanguages: ['en', 'vi', 'fr']
```

---

## ✅ Test Completion Checklist

- [ ] All test cases executed
- [ ] All test cases passed
- [ ] No console errors
- [ ] Database verified
- [ ] API calls verified
- [ ] UI behaves correctly
- [ ] Error handling works
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Ready for production

---

**Tester**: _______________  
**Date**: _______________  
**Environment**: _______________  
**Result**: ⬜ PASS / ⬜ FAIL

