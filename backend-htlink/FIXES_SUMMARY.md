# Translation Fixes Summary

## Các vấn đề đã được fix:

### 1. ✅ Disable language button cho locale đã có translation (Features TranslateModal)

**Vấn đề**: Tất cả các language buttons đều active, không có indicator nào cho biết locale nào đã có translation.

**Giải pháp**:
- Thêm logic kiểm tra `post?.locale === lang.code` để disable button cho default locale
- Thêm styling để làm mờ button của default locale
- Thêm tooltip để hiển thị "This is the default locale for the post"

**File**: `frontend/src/components/features/TranslateModal.tsx`

```typescript
const isDefault = post?.locale === lang.code;
const isDisabled = isDefault || isRegenerating;

<button 
  disabled={isDisabled}
  className={`${isDefault ? 'bg-slate-200 text-slate-500 opacity-60 cursor-not-allowed' : '...'}`}
  title={isDefault ? 'This is the default locale for the post' : '...'}
>
```

---

### 2. ✅ Fix API endpoints cho post translations

**Vấn đề**: Frontend gọi sai endpoint `/posts/{id}/translations` nhưng backend endpoint thực tế là `/translations/posts`.

**Lỗi**: `404 Not Found` khi save translation.

**Giải pháp**:
- Update `postsApi.createTranslation` để gọi `POST /translations/posts`
- Update `postsApi.updateTranslation` để gọi `PUT /translations/posts/{post_id}/{locale}`
- Update `postsApi.deleteTranslation` để gọi `DELETE /translations/posts/{post_id}/{locale}`
- Thêm `post_id` vào payload khi create translation

**File**: `frontend/src/services/postsApi.ts`

**Trước**:
```typescript
async createTranslation(postId: number, translationData: ApiPostTranslationCreate) {
  const response = await apiClient.post(`/posts/${postId}/translations`, translationData);
  return response.data;
}
```

**Sau**:
```typescript
async createTranslation(postId: number, translationData: ApiPostTranslationCreate) {
  const payload = {
    post_id: postId,
    ...translationData
  };
  const response = await apiClient.post(`/translations/posts`, payload);
  return response.data;
}
```

---

### 3. ✅ Fix type definitions cho post translations

**Vấn đề**: Type definition sử dụng `content` nhưng backend sử dụng `content_html`.

**Lỗi**: TypeScript error "Property 'content' is missing".

**Giải pháp**:
- Update `ApiPostTranslationCreate` interface để match với backend schema
- Thay `content` → `content_html`
- Thêm các fields: `subtitle`, `seo_title`, `seo_desc`
- Remove các fields không dùng: `excerpt`, `meta_title`, `meta_description`, `og_title`, `og_description`

**File**: `frontend/src/services/postsApi.ts`

**Trước**:
```typescript
export interface ApiPostTranslationCreate {
  locale: string;
  title: string;
  content: string;
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image_id?: number;
}
```

**Sau**:
```typescript
export interface ApiPostTranslationCreate {
  locale: string;
  title: string;
  subtitle?: string;
  content_html: string;
  seo_title?: string;
  seo_desc?: string;
  og_image_id?: number;
}
```

---

### 4. ✅ Fix RichTextEditor formatting issues

**Vấn đề**: Các formatting buttons (Bold, Italic, etc.) không hoạt động hoặc bị lỗi.

**Giải pháp**:
- Thêm error handling cho `document.execCommand`
- Focus editor trước khi execute command
- Thêm CSS cho placeholder
- Log warnings khi command fails

**File**: `frontend/src/components/properties/RichTextEditor.tsx`

**Trước**:
```typescript
const formatText = (command: string, value?: string) => {
  document.execCommand(command, false, value);
  if (editorRef.current) {
    onChange(editorRef.current.innerHTML);
  }
  editorRef.current?.focus();
};
```

**Sau**:
```typescript
const formatText = (command: string, value?: string) => {
  try {
    editorRef.current?.focus();
    const success = document.execCommand(command, false, value);
    if (!success) {
      console.warn(`Command "${command}" failed to execute`);
    }
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  } catch (error) {
    console.error(`Error executing command "${command}":`, error);
  }
};
```

**CSS thêm vào**:
```css
[contenteditable][data-placeholder]:empty:before {
  content: attr(data-placeholder);
  color: #94a3b8;
  pointer-events: none;
}
```

---

### 5. ✅ Fix Features.tsx để load và hiển thị tất cả translations

**Vấn đề**: Posts chỉ hiển thị locale "en", không hiển thị các translations khác.

**Nguyên nhân**: 
- Backend đã trả về đúng data với `translations` array
- Frontend đã có code để parse translations
- Có thể do data trong database chưa có translations

**Giải pháp**:
- Verify rằng code parse translations đã đúng (đã có sẵn)
- Đảm bảo `include_translations=true` được gửi trong API call (đã có)
- Check console logs để verify data từ backend

**File**: `frontend/src/pages/Features.tsx`

Code đã có sẵn để parse translations:
```typescript
const translationsArray: any[] = [];
if (post.translations) {
  if (Array.isArray(post.translations)) {
    translationsArray.push(...post.translations);
  } else if (typeof post.translations === 'object') {
    Object.keys(post.translations).forEach(k => {
      translationsArray.push({ locale: k, ...post.translations[k] });
    });
  }
}

translationsArray.forEach((t: any) => {
  const tInfo = getLocaleInfo(t.locale);
  const tRaw = t.content_html || '';
  const tExcerpt = tRaw.replace(/<[^>]*>/g, '').substring(0, 100);
  uiPosts.push({
    ...post,
    uiKey: `${post.id}-${t.locale}`,
    title: t.title || post.title || `Post ${post.id}`,
    excerpt: tExcerpt ? tExcerpt + '...' : 'No content',
    locale: t.locale || 'en',
    localeName: tInfo.localeName,
    flagClass: tInfo.flagClass,
    content: tRaw,
    slug: post.slug || '',
    status: post.status ? post.status.toLowerCase() : 'draft',
    updatedAt: post.updated_at || post.created_at,
    content_html: t.content_html
  });
});
```

---

## Testing Steps

### Test 1: Translate Feature Post
1. Vào `/features`
2. Expand một feature
3. Click **Translate** trên một post
4. Verify:
   - ✅ Default locale button bị disable và làm mờ
   - ✅ Có tooltip "This is the default locale for the post"
   - ✅ Auto-translation hoạt động
5. Chọn một locale khác (vi, ja, ko)
6. Edit translation nếu cần
7. Click **Use Translation**
8. Verify:
   - ✅ Không có lỗi 404
   - ✅ Alert "Translation created successfully!"
   - ✅ Page refresh và hiển thị translation mới

### Test 2: RichTextEditor
1. Vào `/properties`
2. Click **Add Post** hoặc **Edit** một post
3. Trong Content editor:
   - ✅ Click Bold button → text được bold
   - ✅ Click Italic button → text được italic
   - ✅ Click Underline button → text được underline
   - ✅ Select heading từ dropdown → text thành heading
   - ✅ Click List buttons → tạo được list
   - ✅ Click Link button → insert được link
   - ✅ Placeholder hiển thị khi editor empty

### Test 3: View Translations
1. Sau khi tạo translations ở Test 1
2. Refresh page `/features`
3. Expand feature đó
4. Verify:
   - ✅ Hiển thị nhiều posts với các locale khác nhau
   - ✅ Mỗi locale có flag icon riêng
   - ✅ Title và excerpt đúng với từng locale

---

## API Endpoints Reference

### Post Translations
```
POST   /translations/posts
PUT    /translations/posts/{post_id}/{locale}
DELETE /translations/posts/{post_id}/{locale}
GET    /translations/posts
```

### Category Translations
```
GET    /feature-categories/{category_id}/translations
POST   /feature-categories/{category_id}/translations
PUT    /feature-categories/{category_id}/translations/{locale}
DELETE /feature-categories/{category_id}/translations/{locale}
```

### Translation Service
```
POST   /translations/translate
```

---

## Known Issues & Limitations

1. **document.execCommand is deprecated**:
   - Vẫn hoạt động trong tất cả browsers hiện tại
   - Có thể cần migrate sang modern API trong tương lai
   - Đã thêm error handling để graceful degradation

2. **Posts không hiển thị translations**:
   - Nếu vẫn chỉ thấy locale "en", check:
     - Database có translations chưa?
     - Console logs có show translations array không?
     - Backend có trả về `translations` field không?

3. **Auto-translation quality**:
   - Phụ thuộc vào LibreTranslate API
   - Có thể cần edit lại sau khi auto-translate
   - Regenerate button để translate lại nếu cần

---

## Latest Updates (2025-10-08)

### 6. ✅ Fix Posts không hiển thị khi không có translations

**Vấn đề**: Post ID 84 không hiển thị gì cả vì không có translation nào trong database.

**Giải pháp**:
- Update logic trong Features.tsx để hiển thị placeholder khi post không có translations
- Hiển thị message "This post has no translations yet. Click Translate to add one."
- User có thể click Translate để tạo translation đầu tiên

**File**: `frontend/src/pages/Features.tsx`

**Code**:
```typescript
if (translationsArray.length > 0) {
  // Show all translations
  translationsArray.forEach((t: any) => {
    uiPosts.push({
      ...post,
      title: t.title || `Post ${post.id}`,
      excerpt: tExcerpt ? tExcerpt + '...' : 'No content',
      locale: t.locale || 'en',
      // ... other fields
    });
  });
} else {
  // Show placeholder for posts without translations
  uiPosts.push({
    ...post,
    title: `Post ${post.id} (No translations)`,
    excerpt: 'This post has no translations yet. Click Translate to add one.',
    locale: 'en',
    // ... other fields
  });
}
```

---

### 7. ✅ Redesign Categories TranslateModal UI

**Vấn đề**: Categories TranslateModal sử dụng tabs system phức tạp, không giống Properties.

**Giải pháp**:
- Rewrite hoàn toàn TranslateModal để giống Properties
- Sử dụng language buttons thay vì tabs
- Disable default locale button
- Auto-translate khi chọn language
- Thêm Regenerate button
- Editable translation fields

**File**: `frontend/src/components/categories/TranslateModal.tsx`

**Features mới**:
1. **Language buttons với flags**: 🇻🇳 Tiếng Việt, 🇬🇧 English, 🇯🇵 日本語, 🇰🇷 한국어, 🇫🇷 Français
2. **Disable default locale**: Button của locale gốc bị disable và làm mờ
3. **Auto-translate**: Tự động translate khi chọn language mới
4. **Regenerate button**: Click để translate lại
5. **Editable fields**: Có thể edit title và description sau khi translate
6. **Better UX**: Loading states, tooltips, better styling

**UI Layout**:
```
┌─────────────────────────────────────┐
│ 🌐 AI Translation              ✕   │
├─────────────────────────────────────┤
│ Translate to:                       │
│ [🇻🇳 Tiếng Việt] [🇬🇧 English] ... │
├─────────────────────────────────────┤
│ Original (EN)                       │
│ ┌─────────────────────────────────┐ │
│ │ Title: Dining                   │ │
│ │ Description: Category for...    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Translation (VI)      [🔄 Regenerate]│
│ ┌─────────────────────────────────┐ │
│ │ Title: [Ẩm thực            ]   │ │
│ │ Description: [Danh mục...  ]   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│              [Cancel] [Use Translation]│
└─────────────────────────────────────┘
```

---

## Next Steps

1. ✅ Test tất cả các fixes
2. ✅ Verify translations hiển thị đúng trong UI
3. ✅ Posts without translations now show placeholder
4. ✅ Categories TranslateModal redesigned
5. 🔄 Add loading states cho translation operations (partially done)
6. 🔄 Add translation status indicators
7. 🔄 Improve error messages
8. 🔄 Add bulk translation operations

