# 🌍 Hướng Dẫn Đa Ngôn Ngữ Du Lịch

## 📊 Tổng Quan

Hệ thống hiện hỗ trợ **24 ngôn ngữ** phổ biến của các quốc gia/vùng lãnh thổ có lượng khách du lịch lớn đến Việt Nam.

---

## 🌏 Danh Sách Ngôn Ngữ Theo Khu Vực

### Châu Á (9 ngôn ngữ)

| Mã Code | Tên Tiếng Anh | Tên Bản Địa | Quốc Gia/Vùng | Ghi Chú |
|---------|---------------|-------------|---------------|---------|
| `zh-CN` | Chinese (Simplified) | 中文（简体） | Trung Quốc | Thị trường khách lớn nhất |
| `zh-TW` | Chinese (Traditional) | 中文（繁體） | Đài Loan, Hồng Kông | Khách cao cấp |
| `ko` | Korean | 한국어 | Hàn Quốc | Top 2 khách quốc tế |
| `ja` | Japanese | 日本語 | Nhật Bản | Khách cao cấp, văn hóa |
| `th` | Thai | ภาษาไทย | Thái Lan | Gần gũi văn hóa |
| `ms` | Malay | Bahasa Melayu | Malaysia | Du lịch MICE |
| `id` | Indonesian | Bahasa Indonesia | Indonesia | Thị trường mới nổi |
| `tl` | Filipino (Tagalog) | Tagalog | Philippines | Khách trẻ |
| `yue` | Cantonese | 粵語 | Hồng Kông, Quảng Đông | Song ngữ với Anh |

### Châu Âu (6 ngôn ngữ)

| Mã Code | Tên Tiếng Anh | Tên Bản Địa | Quốc Gia | Ghi Chú |
|---------|---------------|-------------|----------|---------|
| `en` | English | English | Anh, Quốc tế | Ngôn ngữ quốc tế |
| `fr` | French | Français | Pháp | Lịch sử gắn bó |
| `de` | German | Deutsch | Đức | Khách dài ngày |
| `ru` | Russian | Русский | Nga | Du lịch nghỉ dưỡng |
| `es` | Spanish | Español | Tây Ban Nha | Khách trẻ, phượt |
| `it` | Italian | Italiano | Ý | Văn hóa - ẩm thực |

### Châu Mỹ & Châu Đại Dương (5 ngôn ngữ)

| Mã Code | Tên Tiếng Anh | Tên Bản Địa | Quốc Gia | Ghi Chú |
|---------|---------------|-------------|----------|---------|
| `en-US` | English (US) | English (US) | Hoa Kỳ | Chi tiêu cao |
| `en-AU` | English (Australia) | English (AU) | Úc | Khách trẻ, dài ngày |
| `en-CA` | English (Canada) | English (CA) | Canada | Khách cao cấp |
| `fr-CA` | French (Canada) | Français (CA) | Canada | Quebec |
| `pt-BR` | Portuguese (Brazil) | Português (BR) | Brazil | Thị trường mới nổi |

### Trung Đông & Nam Á (3 ngôn ngữ)

| Mã Code | Tên Tiếng Anh | Tên Bản Địa | Quốc Gia | Ghi Chú |
|---------|---------------|-------------|----------|---------|
| `hi` | Hindi | हिन्दी | Ấn Độ | Đang tăng mạnh |
| `ar` | Arabic | العربية | UAE, Trung Đông | Du lịch sang trọng |
| `ta` | Tamil | தமிழ் | Ấn Độ, Singapore | Cộng đồng lớn |

### Việt Nam (1 ngôn ngữ)

| Mã Code | Tên Tiếng Anh | Tên Bản Địa | Ghi Chú |
|---------|---------------|-------------|---------|
| `vi` | Vietnamese | Tiếng Việt | Khách Việt kiều, nội địa |

---

## 🚀 Cách Sử Dụng

### 1. Kiểm Tra Locales Đã Được Thêm

```bash
# Trong Docker
docker-compose exec backend python /app/scripts/add_tourism_locales.py

# Hoặc check trong database
docker-compose exec db mysql -u hotellink360_user -pStrongDBPassword2024! hotellink360_db -e "SELECT * FROM locales ORDER BY code;"
```

### 2. Sử Dụng Trong Admin Panel

#### a. Tạo Property Translations

1. **Vào Properties page** → Chọn property
2. **Click "Translations" tab**
3. **Chọn ngôn ngữ** từ dropdown (24 ngôn ngữ có sẵn)
4. **Nhập nội dung**:
   - Property Name
   - Slogan
   - Description
   - Address
5. **Save**

#### b. Tạo Feature Translations

1. **Vào Features page** → Chọn feature
2. **Click "Add Translation"**
3. **Chọn locale** (ví dụ: `zh-CN` cho Trung Quốc)
4. **Nhập**:
   - Title (Tên tiện nghi)
   - Short Description
5. **Save**

#### c. Tạo Post Translations

1. **Vào Posts page** → Chọn post
2. **Click "Translations"**
3. **Chọn locale**
4. **Nhập**:
   - Title
   - Subtitle
   - Content HTML
   - SEO Title & Description
5. **Publish**

### 3. API Endpoints

#### Get All Locales

```http
GET /api/v1/locales/
Authorization: Bearer {token}
X-Tenant-Code: {tenant_code}
```

**Response:**
```json
[
  {
    "code": "zh-CN",
    "name": "Chinese (Simplified)",
    "native_name": "中文（简体）"
  },
  {
    "code": "ko",
    "name": "Korean",
    "native_name": "한국어"
  }
]
```

#### Get Property with Translations

```http
GET /api/v1/properties/{property_id}?locale=zh-CN
Authorization: Bearer {token}
X-Tenant-Code: {tenant_code}
```

#### Get Posts by Locale

```http
GET /api/v1/property-posts/by-locale?property_id=1&locale=ko&status=published
Authorization: Bearer {token}
X-Tenant-Code: {tenant_code}
```

---

## 📝 Best Practices

### 1. Ưu Tiên Ngôn Ngữ

Thứ tự ưu tiên dựa trên lượng khách:

1. **Tiếng Anh** (`en`) - Bắt buộc, ngôn ngữ quốc tế
2. **Tiếng Trung giản thể** (`zh-CN`) - Thị trường lớn nhất
3. **Tiếng Hàn** (`ko`) - Top 2
4. **Tiếng Nhật** (`ja`) - Khách cao cấp
5. **Tiếng Việt** (`vi`) - Khách nội địa
6. **Các ngôn ngữ khác** - Tùy theo thị trường mục tiêu

### 2. Nội Dung Cần Dịch

#### Mức Độ 1 - Bắt Buộc:
- ✅ Property Name & Slogan
- ✅ Property Description
- ✅ Feature Names (Tiện nghi)
- ✅ Contact Information

#### Mức Độ 2 - Quan Trọng:
- ✅ Posts/News (Tin tức, khuyến mãi)
- ✅ Feature Descriptions
- ✅ Legal Pages (Terms, Privacy)

#### Mức Độ 3 - Tùy Chọn:
- ✅ Detailed Blog Posts
- ✅ Staff Bios
- ✅ FAQ

### 3. Chất Lượng Dịch Thuật

#### ✅ Nên:
- Sử dụng dịch vụ dịch thuật chuyên nghiệp
- Kiểm tra bởi người bản xứ
- Giữ nguyên tên riêng (tên khách sạn, địa danh)
- Sử dụng thuật ngữ du lịch chuẩn

#### ❌ Không Nên:
- Dùng Google Translate trực tiếp
- Dịch máy móc, không tự nhiên
- Bỏ qua văn hóa địa phương
- Dịch sai thuật ngữ chuyên ngành

### 4. SEO Đa Ngôn Ngữ

```json
{
  "locale": "zh-CN",
  "seo_title": "越南岘港五星级酒店 - Boton Blue Hotel",
  "seo_desc": "岘港市中心豪华五星级酒店，提供海景房、无边泳池、水疗中心。立即预订享受优惠！",
  "og_image": "https://example.com/images/hotel-zh.jpg"
}
```

---

## 🔧 Troubleshooting

### Lỗi: "Locale not found"

**Nguyên nhân**: Locale chưa được thêm vào database

**Giải pháp**:
```bash
docker-compose exec backend python /app/scripts/add_tourism_locales.py
```

### Lỗi: "Translation already exists"

**Nguyên nhân**: Đã có translation cho locale này

**Giải pháp**: Sử dụng PUT endpoint để update thay vì POST

### Lỗi: Font không hiển thị đúng

**Nguyên nhân**: Thiếu font hỗ trợ Unicode

**Giải pháp**: Thêm Google Fonts vào frontend:
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC&family=Noto+Sans+KR&family=Noto+Sans+JP&display=swap" rel="stylesheet">
```

---

## 📊 Thống Kê & Analytics

### Theo Dõi Ngôn Ngữ Phổ Biến

```sql
-- Top 10 ngôn ngữ được xem nhiều nhất
SELECT 
    locale,
    COUNT(*) as views
FROM page_views
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY locale
ORDER BY views DESC
LIMIT 10;
```

### Tỷ Lệ Chuyển Đổi Theo Ngôn Ngữ

```sql
-- Conversion rate by locale
SELECT 
    locale,
    COUNT(DISTINCT user_id) as visitors,
    COUNT(DISTINCT CASE WHEN event_type = 'booking' THEN user_id END) as bookings,
    ROUND(COUNT(DISTINCT CASE WHEN event_type = 'booking' THEN user_id END) * 100.0 / COUNT(DISTINCT user_id), 2) as conversion_rate
FROM events
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY locale
ORDER BY conversion_rate DESC;
```

---

## 🎯 Roadmap

### Phase 1 - Hoàn Thành ✅
- [x] Thêm 24 ngôn ngữ phổ biến
- [x] API endpoints cho translations
- [x] Admin panel support

### Phase 2 - Đang Triển Khai 🚧
- [ ] Auto-detect user language
- [ ] Language switcher UI
- [ ] RTL support (Arabic)
- [ ] Translation management dashboard

### Phase 3 - Tương Lai 🔮
- [ ] AI-powered translation suggestions
- [ ] Translation memory
- [ ] Glossary management
- [ ] Translation workflow (draft → review → publish)

---

## 📚 Tài Liệu Tham Khảo

- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
- [BCP 47 Language Tags](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)
- [Unicode CLDR](https://cldr.unicode.org/)
- [Google Fonts - Noto Sans](https://fonts.google.com/noto)

---

## 💡 Tips & Tricks

### 1. Fallback Language

Nếu translation không tồn tại, hệ thống sẽ fallback về:
1. Tenant default locale (thường là `en`)
2. Property default locale
3. English (`en`)

### 2. Partial Translations

Có thể dịch một phần:
- Dịch property info trước
- Sau đó dịch features
- Cuối cùng dịch posts

### 3. Bulk Import

Sử dụng CSV/Excel để import hàng loạt translations:
```bash
docker-compose exec backend python /app/scripts/import_translations.py --file translations.csv
```

---

**Cần hỗ trợ?** Liên hệ: support@hotellink360.com

