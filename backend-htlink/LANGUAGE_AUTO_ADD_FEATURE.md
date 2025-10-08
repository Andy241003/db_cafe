# Auto-Add Language Feature

## 📋 Overview

Tính năng tự động thêm ngôn ngữ mới vào hệ thống khi user chọn trong Settings.

## 🎯 Mục Đích

Khi user chọn một ngôn ngữ mới trong phần "Supported Languages" của Settings:
1. ✅ Kiểm tra xem locale đã tồn tại trong database chưa
2. ✅ Nếu chưa tồn tại → Tự động tạo locale mới
3. ✅ Thêm locale vào danh sách supported languages của property
4. ✅ Tất cả các tính năng dịch tự động trong project sẽ theo locale mới này

## 🔧 Implementation

### 1. Backend API (Đã có sẵn)

**Endpoint:** `POST /api/v1/locales/`

```json
{
  "code": "fr",
  "name": "French",
  "native_name": "Français"
}
```

**Response:**
```json
{
  "code": "fr",
  "name": "French",
  "native_name": "Français"
}
```

### 2. Frontend Service

**File:** `frontend/src/services/localesApi.ts`

Đã thêm các methods:
- `getLocales()` - Lấy tất cả locales
- `createLocale(localeData)` - Tạo locale mới
- `getLocale(code)` - Lấy locale theo code

### 3. Settings Component

**File:** `frontend/src/pages/Settings.tsx`

#### State Management:
```typescript
const [existingLocales, setExistingLocales] = useState<string[]>([]);
```

#### Load Existing Locales:
```typescript
const loadExistingLocales = async () => {
  try {
    const locales = await localesApi.getLocales();
    const localeCodes = locales.map(locale => locale.code);
    setExistingLocales(localeCodes);
  } catch (error) {
    console.error('Error loading locales:', error);
  }
};
```

#### Handle Language Toggle:
```typescript
const handleLanguageToggle = async (languageCode: string) => {
  const isCurrentlySelected = localizationSettings.supportedLanguages.includes(languageCode);
  
  if (isCurrentlySelected) {
    // Remove language
    const newSupportedLanguages = localizationSettings.supportedLanguages.filter(
      lang => lang !== languageCode
    );
    setLocalizationSettings(prev => ({
      ...prev,
      supportedLanguages: newSupportedLanguages
    }));
  } else {
    // Add language
    try {
      const language = languages.find(lang => lang.code === languageCode);
      
      // Check if locale exists
      try {
        await localesApi.getLocale(languageCode);
      } catch (error: any) {
        // If not exists (404), create it
        if (error.response?.status === 404) {
          await localesApi.createLocale({
            code: languageCode,
            name: language.name,
            native_name: language.native
          });
          showSuccess(`Language ${language.name} added to system`);
          await loadExistingLocales(); // Reload to update UI
        }
      }
      
      // Add to supported languages
      const newSupportedLanguages = [...localizationSettings.supportedLanguages, languageCode];
      setLocalizationSettings(prev => ({
        ...prev,
        supportedLanguages: newSupportedLanguages
      }));
    } catch (error) {
      console.error('Error adding language:', error);
      showSuccess('Failed to add language. Please try again.');
    }
  }
};
```

### 4. UI Enhancement

**Badge "NEW" cho ngôn ngữ chưa có trong database:**

```tsx
{languages.map((language) => {
  const isSelected = localizationSettings.supportedLanguages.includes(language.code);
  const isInDatabase = existingLocales.includes(language.code);
  const isNew = !isInDatabase;
  
  return (
    <div className="...">
      <div className="flex items-center gap-2">
        <h4>{language.name}</h4>
        {isNew && !isSelected && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded">
            NEW
          </span>
        )}
      </div>
      <div className="text-xs text-slate-500">{language.native}</div>
    </div>
  );
})}
```

## 📝 Supported Languages

Danh sách ngôn ngữ có sẵn trong Settings:

| Code | Name | Native Name | Flag |
|------|------|-------------|------|
| `en` | English | English | 🇺🇸 |
| `vi` | Vietnamese | Tiếng Việt | 🇻🇳 |
| `ja` | Japanese | 日本語 | 🇯🇵 |
| `ko` | Korean | 한국어 | 🇰🇷 |
| `zh` | Chinese (Simplified) | 简体中文 | 🇨🇳 |
| `fr` | French | Français | 🇫🇷 |

## 🔄 Workflow

### Khi User Chọn Ngôn Ngữ Mới:

1. **User clicks** vào language card (ví dụ: French)

2. **Frontend checks** xem locale `fr` đã tồn tại chưa:
   ```
   GET /api/v1/locales/fr
   ```

3. **Nếu 404 (Not Found)**:
   - Tạo locale mới:
     ```
     POST /api/v1/locales/
     {
       "code": "fr",
       "name": "French",
       "native_name": "Français"
     }
     ```
   - Hiển thị success message: "Language French added to system"
   - Reload danh sách locales để update UI

4. **Add vào supported languages**:
   - Update `localizationSettings.supportedLanguages`
   - Khi save settings, locale này sẽ được lưu vào property settings

5. **Tất cả tính năng dịch tự động** sẽ nhận biết locale mới:
   - Translation API sẽ dịch sang French
   - Feature translations sẽ có French option
   - Post translations sẽ có French option
   - Property translations sẽ có French option

## 🎨 UI/UX

### Before Selection:
```
┌─────────────────────────────────┐
│ 🇫🇷  French          [NEW]      │
│     Français                    │
│                            ☐    │
└─────────────────────────────────┘
```

### After Selection (Creating):
```
┌─────────────────────────────────┐
│ 🇫🇷  French                     │
│     Français                    │
│                            ☑    │
└─────────────────────────────────┘

✅ Language French added to system
```

### After Reload:
```
┌─────────────────────────────────┐
│ 🇫🇷  French                     │
│     Français                    │
│                            ☑    │
└─────────────────────────────────┘
```
(Badge "NEW" biến mất vì locale đã có trong database)

## 🔐 Permissions

- ✅ Requires authentication
- ✅ User phải có quyền Editor, Admin, hoặc Owner
- ✅ Locale được tạo là system-wide (không phụ thuộc tenant)

## 📊 Database Impact

### Locales Table:
```sql
CREATE TABLE `locales` (
  `code` varchar(10) PRIMARY KEY,
  `name` varchar(100) NOT NULL,
  `native_name` varchar(100) NOT NULL
);
```

### Khi tạo locale mới:
```sql
INSERT INTO locales (code, name, native_name)
VALUES ('fr', 'French', 'Français');
```

## 🧪 Testing

### Test Case 1: Add New Language
1. Go to Settings → Localization
2. Click on "French" (có badge NEW)
3. Verify:
   - ✅ Success message appears
   - ✅ French is checked
   - ✅ Badge "NEW" disappears after reload
   - ✅ Locale exists in database

### Test Case 2: Add Existing Language
1. Go to Settings → Localization
2. Click on "English" (không có badge NEW)
3. Verify:
   - ✅ English is checked immediately
   - ✅ No API call to create locale
   - ✅ No success message

### Test Case 3: Remove Language
1. Go to Settings → Localization
2. Click on checked language
3. Verify:
   - ✅ Language is unchecked
   - ✅ Locale vẫn tồn tại trong database (không bị xóa)

## 🚀 Benefits

1. **User-Friendly**: User không cần biết về database hay API
2. **Automatic**: Locale tự động được tạo khi cần
3. **Consistent**: Tất cả tính năng dịch đều nhận biết locale mới
4. **Safe**: Không xóa locale khi uncheck (chỉ remove khỏi supported list)
5. **Visual Feedback**: Badge "NEW" giúp user biết locale nào chưa có

## 📝 Notes

- Locale được tạo là **system-wide**, không phụ thuộc tenant
- Khi uncheck language, locale **không bị xóa** khỏi database
- Chỉ remove khỏi `supportedLanguages` của property
- Các translations đã tạo cho locale đó vẫn được giữ nguyên

## 🔮 Future Enhancements

1. **Bulk Add**: Cho phép chọn nhiều languages cùng lúc
2. **Custom Languages**: Cho phép user thêm custom language codes
3. **Language Priority**: Sắp xếp thứ tự ưu tiên của languages
4. **Auto-Translate**: Tự động dịch content khi thêm language mới
5. **Language Analytics**: Thống kê usage của từng language

## ✅ Checklist

- [x] Backend API endpoints
- [x] Frontend service methods
- [x] Settings component logic
- [x] UI with NEW badge
- [x] Success messages
- [x] Error handling
- [x] Reload after creation
- [x] Documentation

**Feature is ready to use! 🎉**

