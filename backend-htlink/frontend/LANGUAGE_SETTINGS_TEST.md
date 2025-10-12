# 🌍 Hướng Dẫn Test Language Settings

## Mục đích
Đảm bảo phần "Add Language" trong CategoryModal chỉ hiển thị các ngôn ngữ được **active** trong Settings > Localization > Supported Languages.

---

## ✅ Các thay đổi đã thực hiện

### 1. **CategoryModal.tsx**
- Lọc `availableLocales` dựa trên `propertySettings.supportedLanguages`
- Dropdown "Add Language" chỉ hiển thị ngôn ngữ từ `availableLocales`
- Thêm console.log để debug

### 2. **usePropertySettings.ts**
- Đọc `supportedLanguages` từ `property.settings_json.localization.supportedLanguages`
- Thêm event listener để reload khi Settings thay đổi
- Thêm nhiều console.log để debug

### 3. **Settings.tsx**
- Khi save Localization Settings, dispatch event `propertyChanged`
- Log ra `supportedLanguages` khi lưu

---

## 🧪 Cách Test

### Bước 1: Kiểm tra Settings page
1. Mở **Settings > Localization**
2. Xem phần **Supported Languages**
3. Bật/tắt các ngôn ngữ (ví dụ: chỉ bật EN, VI, JA)
4. Click **Save** button
5. **Mở Console** và kiểm tra log:
   ```
   💾 [Settings] Saving localization settings: { supportedLanguages: ['en', 'vi', 'ja'], ... }
   ✅ [Settings] Property changed event dispatched
   ```

### Bước 2: Kiểm tra CategoryModal
1. Đi đến **Categories** page
2. Click **"+ Add Category"** hoặc **Edit** một category
3. **Mở Console** và kiểm tra logs:
   ```
   🔍 [usePropertySettings] Loading settings for property ID: 1
   📦 [usePropertySettings] Property data: { ... }
   🌍 [usePropertySettings] Localization data: { supportedLanguages: ['en', 'vi', 'ja'], ... }
   ✅ [usePropertySettings] Final settings loaded: { supportedLanguages: ['en', 'vi', 'ja'], ... }
   
   📚 [CategoryModal] All locales from API: ['en', 'vi', 'ja', 'ko', 'fr', ...]
   ⚙️ [CategoryModal] Property settings: { supportedLanguages: ['en', 'vi', 'ja'], ... }
   🎯 [CategoryModal] Filtered locales: ['en', 'vi', 'ja']
   ✅ [CategoryModal] Final available locales: ['en', 'vi', 'ja']
   ```

4. Click button **"+ Add Language"**
5. **Kiểm tra dropdown** - chỉ hiển thị ngôn ngữ đã bật trong Settings (EN, VI, JA)

### Bước 3: Thay đổi Supported Languages
1. Quay lại **Settings > Localization**
2. Bật thêm ngôn ngữ mới (ví dụ: Korean, French)
3. Click **Save**
4. Đóng và mở lại **CategoryModal**
5. Kiểm tra dropdown "Add Language" có hiển thị ngôn ngữ mới không

---

## 🐛 Troubleshooting

### Vấn đề: Dropdown vẫn hiển thị tất cả ngôn ngữ
**Nguyên nhân:**
- `selected_property_id` chưa được set trong localStorage
- Settings chưa lưu đúng vào `settings_json.localization.supportedLanguages`

**Cách fix:**
1. Kiểm tra Console log:
   ```javascript
   localStorage.getItem('selected_property_id')
   ```
2. Nếu null, chọn property trong Settings dropdown
3. Kiểm tra API response từ `/api/v1/properties/{id}`:
   ```javascript
   property.settings_json?.localization?.supportedLanguages
   ```

### Vấn đề: CategoryModal không reload sau khi save Settings
**Nguyên nhân:**
- Event `propertyChanged` không được dispatch

**Cách fix:**
1. Kiểm tra Console log khi save Settings:
   ```
   ✅ [Settings] Property changed event dispatched
   ```
2. Nếu không thấy, Settings.tsx chưa được update
3. Đóng và mở lại CategoryModal để force reload

---

## 📋 Checklist Test

- [ ] Settings page hiển thị danh sách ngôn ngữ đầy đủ
- [ ] Bật/tắt ngôn ngữ và Save thành công
- [ ] Console log hiển thị `supportedLanguages` đúng khi save
- [ ] CategoryModal load được settings từ property
- [ ] Console log hiển thị filtered locales = supported languages
- [ ] Dropdown "Add Language" chỉ hiển thị ngôn ngữ đã bật
- [ ] Thay đổi Settings và CategoryModal reload đúng

---

## 🎯 Kết quả mong đợi

**Trước:** Dropdown "Add Language" hiển thị TẤT CẢ ngôn ngữ trong database (EN, VI, JA, KO, FR, ...)

**Sau:** Dropdown "Add Language" CHỈ hiển thị ngôn ngữ được bật trong Settings > Supported Languages

**Ví dụ:**
- Settings: supportedLanguages = `['en', 'vi', 'ja']`
- CategoryModal dropdown: Chỉ hiển thị English, Vietnamese, Japanese
- KO, FR không xuất hiện trong dropdown

---

## 💡 Tips

1. **Luôn mở Console** khi test để xem logs
2. **Refresh page** sau khi save Settings để đảm bảo data mới
3. Nếu vẫn không hoạt động, check:
   - Token hết hạn chưa?
   - Property có được select chưa?
   - API `/properties/{id}` trả về data đúng chưa?

---

## 📞 Support

Nếu gặp vấn đề, cung cấp:
1. Screenshot Console logs
2. API response từ `/api/v1/properties/{id}`
3. Giá trị của `localStorage.getItem('selected_property_id')`
