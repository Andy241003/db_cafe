# Hướng Dẫn Sử Dụng Tính Năng Translation

## Tổng Quan

Hệ thống đã được cập nhật để hỗ trợ đầy đủ tính năng translation cho:
- ✅ **Categories** (Danh mục)
- ✅ **Features** (Tính năng)
- ✅ **Posts** (Bài viết)

Tất cả translations đều được lưu vào database và có thể chỉnh sửa sau.

---

## 1. Translate Category (Danh mục)

### Bước 1: Mở trang Categories
- Vào `/categories` trong admin panel
- Xem danh sách các categories

### Bước 2: Click nút Translate
- Mỗi category card có nút **Translate** (icon 🌐)
- Click vào nút này

### Bước 3: Chọn ngôn ngữ
- Modal sẽ hiển thị với các tab ngôn ngữ: **vi**, **en**, **ja**, **kr**, **fr**
- Click vào tab ngôn ngữ bạn muốn translate
- Nếu đã có translation, nó sẽ được load từ database
- Nếu chưa có, form sẽ trống

### Bước 4: Nhập translation
- **Title**: Tên category bằng ngôn ngữ đích
- **Description**: Mô tả ngắn bằng ngôn ngữ đích

### Bước 5: Lưu translation
- Click **Use Translation**
- Hệ thống sẽ:
  - Tạo translation mới nếu chưa có
  - Hoặc cập nhật translation nếu đã có
- Page sẽ refresh để hiển thị translation mới

---

## 2. Translate Feature Post (Bài viết tính năng)

### Bước 1: Mở trang Features
- Vào `/features` trong admin panel
- Click vào một feature để expand và xem posts

### Bước 2: Click nút Translate trên post
- Mỗi post có nút **Translate** (icon 🌐)
- Click vào nút này

### Bước 3: Chọn ngôn ngữ
- Modal sẽ hiển thị với các language buttons: **🇻🇳 Tiếng Việt**, **🇯🇵 日本語**, **🇬🇧 English**, **🇰🇷 한국어**
- **Lưu ý**: Button của ngôn ngữ gốc (default locale) sẽ bị disable và làm mờ
- Click vào ngôn ngữ bạn muốn translate

### Bước 4: Xem auto-translation
- Hệ thống sẽ tự động translate nội dung bằng AI
- Bạn sẽ thấy:
  - **Original Content**: Nội dung gốc
  - **Translation**: Nội dung đã được translate

### Bước 5: Chỉnh sửa translation (nếu cần)
- **Title**: Có thể edit trực tiếp
- **Content**: Có thể edit trực tiếp
- Click **Regenerate** nếu muốn translate lại

### Bước 6: Lưu translation
- Click **Use Translation**
- Hệ thống sẽ:
  - Tạo translation mới nếu chưa có
  - Hoặc cập nhật translation nếu đã có
- Alert sẽ hiển thị "Translation created/updated successfully!"
- Page sẽ refresh và bạn sẽ thấy post mới với locale đã chọn

---

## 3. Sử Dụng Rich Text Editor

### Khi tạo hoặc edit post:

#### Formatting Text:
- **Bold**: Click nút **B** hoặc Ctrl+B
- **Italic**: Click nút **I** hoặc Ctrl+I
- **Underline**: Click nút **U** hoặc Ctrl+U
- **Strikethrough**: Click nút **S**

#### Headings:
- Chọn từ dropdown: **Paragraph**, **Heading 1**, **Heading 2**, **Heading 3**

#### Lists:
- **Unordered List**: Click nút bullet list
- **Ordered List**: Click nút numbered list
- **Blockquote**: Click nút quote

#### Media:
- **Insert Link**: Click nút link → nhập URL
- **Insert Image**: Click nút image → nhập image URL

#### HTML Mode:
- Click nút **</>** để toggle HTML mode
- Có thể edit HTML trực tiếp
- Click lại để quay về visual mode

---

## 4. Xem Translations

### Trong Features page:
- Sau khi tạo translations, expand feature
- Bạn sẽ thấy nhiều posts với các locale khác nhau:
  - 🇬🇧 **English** - Sunflower Restaurant
  - 🇻🇳 **Tiếng Việt** - Nhà hàng Hướng Dương
  - 🇯🇵 **日本語** - ひまわりレストラン
  - 🇰🇷 **한국어** - 해바라기 레스토랑

### Mỗi post hiển thị:
- **Flag icon**: Biểu tượng cờ của ngôn ngữ
- **Locale name**: Tên ngôn ngữ
- **Title**: Tiêu đề bằng ngôn ngữ đó
- **Excerpt**: Đoạn trích ngắn
- **Status**: Published/Draft/Archived
- **Updated date**: Ngày cập nhật

---

## 5. Troubleshooting

### Vấn đề: Translation không lưu được
**Lỗi**: `404 Not Found` hoặc `500 Internal Server Error`

**Giải pháp**:
1. Check console logs trong DevTools
2. Verify backend đang chạy
3. Check API endpoint có đúng không
4. Verify user có permission để create/update translations

### Vấn đề: Posts chỉ hiển thị locale "en"
**Nguyên nhân**: Chưa có translations trong database

**Giải pháp**:
1. Tạo translations bằng cách click **Translate** trên post
2. Chọn locale và save
3. Refresh page để xem translations mới

### Vấn đề: Auto-translation không hoạt động
**Nguyên nhân**: LibreTranslate API không available hoặc timeout

**Giải pháp**:
1. Check backend logs
2. Verify LibreTranslate service đang chạy
3. Nhập translation manually
4. Click **Regenerate** để thử lại

### Vấn đề: Rich Text Editor không format được
**Nguyên nhân**: Browser không support hoặc selection không đúng

**Giải pháp**:
1. Click vào editor để focus
2. Select text trước khi format
3. Check console logs để xem error
4. Thử refresh page

### Vấn đề: Button của default locale không disable
**Nguyên nhân**: Code chưa được update

**Giải pháp**:
1. Verify file `TranslateModal.tsx` đã được update
2. Clear browser cache
3. Refresh page

---

## 6. Tips & Best Practices

### Khi translate:
1. ✅ **Review auto-translation**: AI translation không phải lúc nào cũng perfect, nên review và edit lại
2. ✅ **Consistent terminology**: Sử dụng thuật ngữ nhất quán trong tất cả translations
3. ✅ **Cultural adaptation**: Không chỉ translate từng từ, mà adapt cho văn hóa địa phương
4. ✅ **Test thoroughly**: Test translations trên nhiều devices và browsers

### Khi sử dụng Rich Text Editor:
1. ✅ **Use semantic HTML**: Sử dụng headings đúng cấp độ (H1, H2, H3)
2. ✅ **Keep it simple**: Không over-format, giữ cho content dễ đọc
3. ✅ **Preview before save**: Xem preview trước khi save
4. ✅ **Use HTML mode for advanced**: Nếu cần custom HTML, dùng HTML mode

### Khi quản lý translations:
1. ✅ **Keep translations up-to-date**: Khi update content gốc, nhớ update translations
2. ✅ **Track translation status**: Biết locale nào đã có translation, locale nào chưa
3. ✅ **Backup regularly**: Backup database thường xuyên
4. ✅ **Version control**: Có thể implement translation versioning trong tương lai

---

## 7. Keyboard Shortcuts

### Rich Text Editor:
- **Ctrl+B**: Bold
- **Ctrl+I**: Italic
- **Ctrl+U**: Underline
- **Ctrl+Z**: Undo
- **Ctrl+Y**: Redo
- **Ctrl+K**: Insert link (trong một số browsers)

### General:
- **Esc**: Đóng modal
- **Enter**: Submit form (trong một số trường hợp)

---

## 8. FAQ

**Q: Có thể translate sang bao nhiêu ngôn ngữ?**
A: Hiện tại hỗ trợ: Vietnamese (vi), English (en), Japanese (ja), Korean (ko), French (fr). Có thể thêm ngôn ngữ khác trong tương lai.

**Q: Translation có được lưu tự động không?**
A: Không, bạn phải click **Use Translation** hoặc **Accept & Save** để lưu.

**Q: Có thể xóa translation không?**
A: Hiện tại chưa có UI để xóa, nhưng có thể implement trong tương lai.

**Q: Auto-translation có tốn phí không?**
A: Tùy thuộc vào LibreTranslate service bạn sử dụng. Nếu self-hosted thì free.

**Q: Có thể bulk translate nhiều posts cùng lúc không?**
A: Chưa có tính năng này, nhưng có thể implement trong tương lai.

**Q: Translation có ảnh hưởng đến SEO không?**
A: Có, mỗi translation có thể có `seo_title` và `seo_desc` riêng để optimize cho từng ngôn ngữ.

---

## 9. Support

Nếu gặp vấn đề:
1. Check console logs trong DevTools (F12)
2. Check backend logs
3. Xem file `FIXES_SUMMARY.md` để biết chi tiết technical
4. Xem file `TRANSLATION_IMPLEMENTATION.md` để hiểu architecture

---

**Chúc bạn sử dụng tốt! 🎉**

