# Translation Implementation Guide

## Tổng quan

Đã implement đầy đủ chức năng translation cho **Categories**, **Features**, và **Posts** để lưu và load translations từ database thông qua API.

## Các thay đổi chính

### 1. Categories Translation

#### File mới:
- **`frontend/src/services/categoriesApi.ts`**: API service cho category translations
  - `getCategoryTranslations(categoryId)`: Lấy tất cả translations của category
  - `createCategoryTranslation(categoryId, data)`: Tạo translation mới
  - `updateCategoryTranslation(categoryId, locale, data)`: Cập nhật translation
  - `deleteCategoryTranslation(categoryId, locale)`: Xóa translation

#### File đã cập nhật:
- **`frontend/src/pages/Categories.tsx`**:
  - `handleAcceptTranslation`: Implement API call để lưu translation vào database
  - Kiểm tra translation đã tồn tại để quyết định create/update
  - Refresh data sau khi lưu thành công

- **`frontend/src/components/categories/TranslateModal.tsx`**:
  - Load translations từ API khi mở modal
  - Hiển thị translations đã lưu trong database
  - Fallback về data từ props nếu API call thất bại

### 2. Features Translation

#### File đã cập nhật:
- **`frontend/src/pages/Features.tsx`**:
  - `handleTranslate`: Implement API call để lưu post translation
  - Sử dụng `postsApi.createTranslation` và `postsApi.updateTranslation`
  - Refresh và reload posts sau khi lưu translation thành công
  - Update UI để hiển thị translation mới

- **`frontend/src/components/features/TranslateModal.tsx`**:
  - Sử dụng `translationsApi.translateBatch` để auto-translate
  - Load existing translations từ `post.translations`
  - Implement regenerate function với API thực sự
  - Không còn sử dụng mock data

### 3. API Endpoints được sử dụng

#### Categories:
```
GET    /feature-categories/{category_id}/translations
POST   /feature-categories/{category_id}/translations
PUT    /feature-categories/{category_id}/translations/{locale}
DELETE /feature-categories/{category_id}/translations/{locale}
```

#### Posts (Features):
```
GET    /posts/{post_id}/translations
POST   /posts/{post_id}/translations
PUT    /posts/{post_id}/translations/{locale}
DELETE /posts/{post_id}/translations/{locale}
```

#### Translation Service:
```
POST   /translations/translate
```

## Cách sử dụng

### 1. Translate Category

1. Vào trang **Categories** (`/categories`)
2. Click nút **Translate** trên category card
3. Chọn ngôn ngữ target (vi, en, ja, kr, fr)
4. Xem translation được load từ database (nếu đã có)
5. Chỉnh sửa translation nếu cần
6. Click **Use Translation** để lưu vào database

### 2. Translate Feature Post

1. Vào trang **Features** (`/features`)
2. Expand một feature để xem posts
3. Click nút **Translate** trên post
4. Chọn ngôn ngữ target
5. Hệ thống sẽ:
   - Load translation từ database nếu đã có
   - Hoặc auto-translate bằng API nếu chưa có
6. Click **Regenerate** để translate lại nếu cần
7. Click **Use Translation** để lưu vào database

### 3. Translate Property Post

1. Vào trang **Properties** (`/properties`)
2. Expand một property để xem posts
3. Click nút **Translate** trên post
4. Chọn ngôn ngữ target
5. Hệ thống sẽ auto-translate và tạo post mới với locale đã chọn
6. Click **Accept & Save** để lưu

## Luồng dữ liệu

### Categories Translation Flow:
```
User clicks Translate
  ↓
TranslateModal opens
  ↓
Load translations from API: GET /feature-categories/{id}/translations
  ↓
Display existing translations or empty form
  ↓
User edits and clicks "Use Translation"
  ↓
Check if translation exists
  ↓
If exists: PUT /feature-categories/{id}/translations/{locale}
If not: POST /feature-categories/{id}/translations
  ↓
Refresh page to show updated data
```

### Features Translation Flow:
```
User clicks Translate on post
  ↓
TranslateModal opens
  ↓
Check post.translations for existing translation
  ↓
If exists: Display existing translation
If not: Auto-translate using POST /translations/translate
  ↓
User can regenerate or edit
  ↓
User clicks "Use Translation"
  ↓
Check if translation exists
  ↓
If exists: PUT /posts/{id}/translations/{locale}
If not: POST /posts/{id}/translations
  ↓
Refresh features and reload posts
  ↓
UI updates to show new translation
```

## Debugging

### Check if translations are loaded:
1. Mở DevTools Console
2. Xem logs khi mở TranslateModal:
   - Categories: `"Loaded category translations from API:"`
   - Features: `"=== SAVING TRANSLATION ==="`

### Check API calls:
1. Mở DevTools Network tab
2. Filter by "translations" hoặc "feature-categories"
3. Xem request/response để debug

### Common issues:

#### Translation không hiển thị:
- Check API response có trả về translations không
- Check console logs để xem có error không
- Verify backend có data trong database

#### Translation không lưu được:
- Check API endpoint có đúng không
- Check request payload có đúng format không
- Check backend logs để xem error message
- Verify user có permission để create/update translations

## Testing

### Test Categories Translation:
1. Tạo một category mới
2. Click Translate
3. Chọn ngôn ngữ và nhập translation
4. Save và verify trong database
5. Mở lại TranslateModal để verify translation được load

### Test Features Translation:
1. Tạo một feature và post
2. Click Translate trên post
3. Verify auto-translation hoạt động
4. Save translation
5. Refresh page và verify translation hiển thị trong posts list

## Database Schema

### feature_category_translations:
```sql
category_id (PK, FK)
locale (PK, FK)
title
short_desc
```

### post_translations:
```sql
post_id (PK, FK)
locale (PK, FK)
title
subtitle
content_html
seo_title
seo_desc
og_image_id
```

## Next Steps

1. ✅ Implement translation cho Categories
2. ✅ Implement translation cho Features/Posts
3. ✅ Load translations từ database
4. ✅ Auto-translate với API
5. 🔄 Add loading states và better error handling
6. 🔄 Add translation status indicators
7. 🔄 Add bulk translation operations
8. 🔄 Add translation history/versioning

## Notes

- Tất cả translations đều được lưu vào database
- Auto-translation sử dụng LibreTranslate API
- Mỗi entity có thể có nhiều translations (multi-locale support)
- Translations được load khi mở modal để đảm bảo data mới nhất
- UI tự động refresh sau khi save translation thành công

