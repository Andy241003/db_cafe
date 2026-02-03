# VR360 Deeplink Manager

Hệ thống quản lý Deeplink cho Tour VR360 - Tạo link ngắn với Open Graph meta để chia sẻ lên mạng xã hội.

---

## 📋 Mục đích

Khi bạn có một tour VR360 với URL dài và phức tạp như:
```
https://phoenix.trip360.vn/phong-nghi/ROOM2#media=101&yaw=2.5&pitch=0.0&fov=110
```

Hệ thống này giúp bạn tạo **deeplink ngắn gọn**:
```
https://yourdomain.com/phong-deluxe
```

**Lợi ích:**
- ✅ URL ngắn, dễ nhớ, dễ chia sẻ
- ✅ Hiển thị preview đẹp trên Facebook, Zalo, Twitter (Open Graph)
- ✅ Đếm lượt truy cập (views)
- ✅ Quản lý tập trung qua Admin panel

---

## 📁 Cấu trúc thư mục

```
vr360-deeplink-manager/
├── .htaccess              # URL Rewrite (Apache)
├── links.xml              # Database lưu tất cả deeplinks
├── rewrite.php            # Xử lý deeplink, xuất OG meta, redirect
├── links.php              # Trang public hiển thị danh sách links
├── search.php             # Trang tìm kiếm
├── stats.php              # Trang thống kê công khai
├── assets/
│   └── css/
│       └── public-styles.css
├── images/                # Thư mục upload hình ảnh
└── admin/                 # Trang quản trị
    ├── index.php          # Dashboard
    ├── login.php          # Đăng nhập
    ├── logout.php         # Đăng xuất
    ├── items.php          # Danh sách deeplinks
    ├── item-edit.php      # Thêm/sửa deeplink
    ├── import.php         # Import CSV hàng loạt
    ├── upload-image.php   # Upload hình ảnh
    ├── settings.php       # Cấu hình (user/password)
    ├── _auth.php          # Kiểm tra đăng nhập
    ├── _repo.php          # CRUD thao tác với links.xml
    ├── _helpers.php       # Các hàm tiện ích
    ├── _layout_header.php # Header template
    ├── _layout_footer.php # Footer template
    └── assets/css/        # CSS cho admin
```

---

## ⚙️ Cài đặt

### Yêu cầu
- PHP 8.0+
- Apache với mod_rewrite (hoặc Nginx)
- Quyền ghi file cho `links.xml` và thư mục `images/`

### Bước 1: Copy source code
```bash
git clone <repo> /var/www/html/deeplink-manager
# hoặc copy thủ công vào thư mục web
```

### Bước 2: Phân quyền
```bash
chmod 666 links.xml
chmod 777 images/
```

### Bước 3: Cấu hình .htaccess (Apache)
File `.htaccess` đã có sẵn:
```apache
RewriteEngine On

# Bypass real files or directories
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Route single-level slugs to rewrite.php
RewriteRule ^([^/]+)/?$ rewrite.php [L,QSA]
```

### Bước 4: Đổi mật khẩu Admin
Mở file `admin/settings.php`:
```php
define('ADMIN_USER', 'vradmin');
define('ADMIN_PASS_HASH', '$2y$10$...');  // Thay hash mới
```

Tạo hash mới:
```php
echo password_hash('matkhau_moi', PASSWORD_DEFAULT);
```

---

## 🔄 Cơ chế hoạt động

### Luồng xử lý Deeplink

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User truy cập: https://domain.com/phong-deluxe          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. .htaccess rewrite URL → rewrite.php                      │
│    RewriteRule ^([^/]+)/?$ rewrite.php                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. rewrite.php xử lý:                                       │
│    - Lấy slug từ URL: "phong-deluxe"                        │
│    - Tìm trong links.xml                                    │
│    - Tăng views + 1                                         │
│    - Xuất HTML với Open Graph meta                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Trả về HTML với OG meta:                                 │
│    <meta property="og:title" content="Phòng Deluxe">        │
│    <meta property="og:image" content="https://.../img.jpg"> │
│    <meta property="og:description" content="Mô tả...">      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. JavaScript redirect sau 600ms:                           │
│    window.location.href = 'https://tour.vr360.vn/...';      │
└─────────────────────────────────────────────────────────────┘
```

### Tại sao cần delay 600ms?

Khi share link lên Facebook/Zalo, crawler của họ sẽ:
1. Truy cập URL deeplink
2. Đọc Open Graph meta tags
3. Hiển thị preview (tiêu đề, mô tả, hình ảnh)

Delay 600ms đảm bảo crawler đọc được meta trước khi redirect.

---

## 📊 Cấu trúc dữ liệu (links.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<links>
  <link>
    <slug>phong-deluxe</slug>
    <title>Phòng Deluxe Ocean View</title>
    <description>Phòng sang trọng view biển tuyệt đẹp</description>
    <image>https://example.com/images/deluxe.jpg</image>
    <target>https://tour.vr360.vn/room#media=101&yaw=2.5</target>
    <views>150</views>
  </link>
  <!-- Thêm nhiều link khác -->
</links>
```

### Giải thích các trường:

| Trường | Mô tả | Ví dụ |
|--------|-------|-------|
| `slug` | URL ngắn (không dấu, không khoảng trắng) | `phong-deluxe` |
| `title` | Tiêu đề hiển thị OG | `Phòng Deluxe Ocean View` |
| `description` | Mô tả ngắn OG | `Phòng sang trọng...` |
| `image` | URL hình ảnh OG (recommend: 1200x630px) | `https://.../img.jpg` |
| `target` | URL đích redirect | `https://tour.vr360.vn/...` |
| `views` | Số lượt truy cập | `150` |

---

## 🔧 API / Các hàm chính

### admin/_repo.php - CRUD Operations

```php
// Đọc tất cả links
$items = repo_all();
// Return: [['slug'=>'...', 'title'=>'...', ...], ...]

// Thêm/cập nhật link
repo_upsert([
  'slug' => 'phong-deluxe',
  'title' => 'Phòng Deluxe',
  'description' => 'Mô tả...',
  'image' => 'https://...',
  'target' => 'https://tour...'
]);

// Xóa link
repo_delete('phong-deluxe');

// Tìm link theo slug
$xml = repo_load();
$link = repo_find_by_slug($xml, 'phong-deluxe');
```

### admin/_helpers.php - Utility Functions

```php
// Tạo slug từ tiêu đề
$slug = slugify('Phòng Deluxe Ocean View');
// Return: "phong-deluxe-ocean-view"

// Sanitize input
$clean = sanitize($_POST['title']);

// Kiểm tra CSRF token
csrf_check();

// Tạo CSRF token
$token = csrf_token();
```

---

## 🎯 Hướng dẫn sử dụng

### 1. Đăng nhập Admin
```
URL: https://yourdomain.com/admin/
User: vradmin
Pass: (xem settings.php)
```

### 2. Thêm Deeplink mới
1. Vào **Quản lý Deeplinks** → **Thêm mới**
2. Điền:
   - **Slug**: `tour-hanoi` (URL ngắn)
   - **Tiêu đề**: `Tour VR360 Hà Nội`
   - **Mô tả**: `Khám phá Hà Nội 360 độ`
   - **Hình ảnh**: Upload hoặc paste URL
   - **Target URL**: `https://tour.vr360.vn/hanoi#media=1`
3. Nhấn **Lưu**

### 3. Import CSV hàng loạt
File CSV format:
```csv
title,target,description,image,slug
Tour Hà Nội,https://tour.vn/hanoi,Mô tả...,https://.../img.jpg,tour-hanoi
Tour Sài Gòn,https://tour.vn/saigon,Mô tả...,https://.../img2.jpg,tour-saigon
```

### 4. Chia sẻ link
Sau khi tạo, bạn có thể share:
```
https://yourdomain.com/tour-hanoi
```

---

## 🔗 Tích hợp với VR360 Tour

### Target URL format

Target có thể là:

**1. URL đầy đủ:**
```
https://phoenix.trip360.vn/phong-nghi/ROOM2
```

**2. URL với hash parameters (vị trí camera):**
```
https://phoenix.trip360.vn/tour#media=101&yaw=2.5&pitch=0.0&fov=110
```

**3. Chỉ hash (nếu tour cùng domain):**
```
#media=101&yaw=2.5&pitch=0.0&fov=110
```

### Các parameter phổ biến:
- `media`: ID của scene/phòng
- `yaw`: Góc xoay ngang (radian)
- `pitch`: Góc xoay dọc (radian)
- `fov`: Field of view (độ rộng góc nhìn)

---

## 🛡️ Bảo mật

- Mật khẩu admin được hash bằng `password_hash()` (bcrypt)
- Có CSRF protection cho các form
- Input được sanitize trước khi lưu
- File `links.xml` được backup trước khi thay đổi

---

## 📝 Troubleshooting

### 1. URL Rewrite không hoạt động
- Kiểm tra mod_rewrite đã bật chưa: `a2enmod rewrite`
- Kiểm tra AllowOverride trong Apache config

### 2. Không ghi được links.xml
```bash
chmod 666 links.xml
chown www-data:www-data links.xml
```

### 3. Hình ảnh OG không hiển thị
- Đảm bảo URL hình ảnh là HTTPS
- Kích thước recommend: 1200x630 pixels
- Test với [Facebook Debugger](https://developers.facebook.com/tools/debug/)

---

## 📄 License

MIT License - Sử dụng tự do cho mục đích cá nhân và thương mại.
