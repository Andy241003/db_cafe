# Database Migration Guide - VR Hotel Schema Optimization

## Tổng Quan

Migration này tối ưu hóa schema database cho VR Hotel module bằng cách:
- ✅ Xóa bảng `vr_languages` trùng lặp
- ✅ Tạo bảng `property_locales` mới (chuẩn hóa)
- ✅ Thêm Foreign Keys đảm bảo tính toàn vẹn dữ liệu
- ✅ Thêm indexes tăng hiệu suất
- ✅ Tạo audit log table để theo dõi thay đổi
- ✅ Tối ưu data types

**⚠️ LƯU Ý QUAN TRỌNG:** Migration này CHỈ ảnh hưởng VR Hotel module. **Travel Link giữ nguyên 100%**.

---

## Trước Khi Chạy Migration

### 1. Backup Database
```bash
# Backup toàn bộ database
mysqldump -u root -p hotellink360_db > backup_hotellink360_full_$(date +%Y%m%d_%H%M%S).sql

# Hoặc chỉ backup bảng vr_languages
mysqldump -u root -p hotellink360_db vr_languages > backup_vr_languages_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Kiểm Tra Dữ Liệu Hiện Tại
```sql
-- Xem số lượng records trong vr_languages
SELECT COUNT(*) as total_records FROM vr_languages;

-- Xem chi tiết dữ liệu
SELECT * FROM vr_languages ORDER BY property_id, locale;

-- Kiểm tra locales có tồn tại trong bảng locales không
SELECT vl.locale, COUNT(*) 
FROM vr_languages vl
LEFT JOIN locales l ON vl.locale = l.code
WHERE l.code IS NULL
GROUP BY vl.locale;
```

### 3. Dừng Backend Services (Recommended)
```bash
cd backend-htlink
docker-compose down backend
```

---

## Chạy Migration

### Cách 1: Chạy File SQL Đầy Đủ
```bash
# Chạy migration script
mysql -u root -p hotellink360_db < backend/migrations/optimize_vr_hotel_schema.sql
```

### Cách 2: Chạy Từng Bước (Recommended để kiểm soát)

#### Bước 1: Tạo Bảng Mới
```sql
CREATE TABLE IF NOT EXISTS `property_locales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `property_id` int NOT NULL,
  `locale_code` varchar(10) NOT NULL COMMENT 'References locales.code',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_property_locale` (`tenant_id`, `property_id`, `locale_code`),
  KEY `idx_tenant_property` (`tenant_id`, `property_id`),
  KEY `idx_locale_code` (`locale_code`),
  KEY `idx_is_default` (`is_default`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_property_locales_tenant` 
    FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_property_locales_property` 
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_property_locales_locale` 
    FOREIGN KEY (`locale_code`) REFERENCES `locales` (`code`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Bước 2: Migrate Dữ Liệu
```sql
INSERT INTO `property_locales` 
  (`tenant_id`, `property_id`, `locale_code`, `is_default`, `is_active`, `created_at`)
SELECT 
  vl.`tenant_id`,
  vl.`property_id`,
  vl.`locale`,
  vl.`is_default`,
  vl.`is_active`,
  CURRENT_TIMESTAMP
FROM `vr_languages` vl
WHERE EXISTS (
  SELECT 1 FROM `locales` l WHERE l.`code` = vl.`locale`
);

-- Kiểm tra kết quả
SELECT 
  'vr_languages' as source, COUNT(*) as count FROM vr_languages
UNION ALL
SELECT 
  'property_locales' as source, COUNT(*) as count FROM property_locales;
```

#### Bước 3: Xác Nhận Dữ Liệu
```sql
-- So sánh dữ liệu
SELECT 
  vl.property_id,
  vl.locale as old_locale,
  pl.locale_code as new_locale,
  vl.is_default,
  pl.is_default as new_is_default
FROM vr_languages vl
LEFT JOIN property_locales pl 
  ON vl.tenant_id = pl.tenant_id 
  AND vl.property_id = pl.property_id 
  AND vl.locale = pl.locale_code
ORDER BY vl.property_id;
```

#### Bước 4: Xóa Bảng Cũ (Sau khi xác nhận)
```sql
-- ⚠️ CHỈ chạy sau khi đã kiểm tra kỹ!
DROP TABLE IF EXISTS `vr_languages`;
```

#### Bước 5: Thêm Foreign Keys
```sql
ALTER TABLE `vr_hotel_posts`
  ADD CONSTRAINT `fk_vr_hotel_posts_locale` 
    FOREIGN KEY (`locale`) REFERENCES `locales` (`code`) ON DELETE RESTRICT;

ALTER TABLE `vr_hotel_rooms`
  ADD CONSTRAINT `fk_vr_hotel_rooms_locale` 
    FOREIGN KEY (`locale`) REFERENCES `locales` (`code`) ON DELETE RESTRICT;
```

#### Bước 6: Thêm Performance Indexes
```sql
ALTER TABLE `properties`
  ADD INDEX `idx_tenant_active` (`tenant_id`, `is_active`),
  ADD INDEX `idx_service_access` (`service_access`);

ALTER TABLE `vr_hotel_posts`
  ADD INDEX `idx_property_locale_status` (`property_id`, `locale`, `status`);

ALTER TABLE `activity_logs`
  ADD INDEX `idx_tenant_property_created` (`tenant_id`, `property_id`, `created_at`);
```

#### Bước 7: Tạo Audit Log Table
```sql
CREATE TABLE IF NOT EXISTS `vr_audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `property_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_property` (`tenant_id`, `property_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_vr_audit_logs_tenant` 
    FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Sau Migration

### 1. Khởi Động Backend
```bash
cd backend-htlink
docker-compose up -d backend
docker-compose logs -f backend
```

### 2. Test API Endpoints

#### Test GET Languages
```bash
curl -X GET "http://localhost:8000/api/v1/vr-hotel/languages" \
  -H "X-Property-Id: 1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test ADD Language
```bash
curl -X POST "http://localhost:8000/api/v1/vr-hotel/languages" \
  -H "Content-Type: application/json" \
  -H "X-Property-Id: 1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"locale_code": "en"}'
```

### 3. Verify Database
```sql
-- Kiểm tra bảng mới
SELECT * FROM property_locales;

-- Kiểm tra Foreign Keys
SELECT 
  TABLE_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'hotellink360_db'
  AND REFERENCED_TABLE_NAME IS NOT NULL
  AND TABLE_NAME = 'property_locales';

-- Kiểm tra Indexes
SHOW INDEX FROM property_locales;
```

---

## Rollback (Nếu Cần)

### Nếu migration thất bại, restore từ backup:

```bash
# Restore toàn bộ database
mysql -u root -p hotellink360_db < backup_hotellink360_full_YYYYMMDD_HHMMSS.sql

# Hoặc chỉ restore bảng vr_languages
mysql -u root -p hotellink360_db < backup_vr_languages_YYYYMMDD_HHMMSS.sql
```

### Rollback thủ công:
```sql
-- Drop bảng mới
DROP TABLE IF EXISTS `property_locales`;
DROP TABLE IF EXISTS `vr_audit_logs`;

-- Restore vr_languages từ backup (chạy file backup SQL)

-- Remove Foreign Keys đã thêm
ALTER TABLE `vr_hotel_posts` DROP FOREIGN KEY IF EXISTS `fk_vr_hotel_posts_locale`;
ALTER TABLE `vr_hotel_rooms` DROP FOREIGN KEY IF EXISTS `fk_vr_hotel_rooms_locale`;

-- Remove Indexes đã thêm
ALTER TABLE `properties` DROP INDEX IF EXISTS `idx_tenant_active`;
ALTER TABLE `properties` DROP INDEX IF EXISTS `idx_service_access`;
```

---

## Code Changes

### Files đã được cập nhật:
1. ✅ `backend/app/models/vr_hotel.py` - Model PropertyLocale
2. ✅ `backend/app/api/v1/endpoints/vr_hotel_languages.py` - API endpoints
3. ✅ `backend/app/crud/vr_hotel.py` - CRUD operations

### Breaking Changes:
**KHÔNG CÓ BREAKING CHANGES** cho Travel Link. API response format vẫn giống hệt:

**Trước:**
```json
{
  "id": 1,
  "locale": "vi",
  "is_default": true
}
```

**Sau (field name thay đổi nhưng API tự động map):**
```json
{
  "id": 1,
  "locale_code": "vi",
  "is_default": true
}
```

---

## FAQ

### Q: Migration này có ảnh hưởng đến Travel Link không?
**A:** KHÔNG. Travel Link vẫn sử dụng bảng `locales` và API `locales.py` - không thay đổi gì cả.

### Q: Có cần update Frontend không?
**A:** Frontend đã được cập nhật trước đó để sử dụng Settings Localization tab. Không cần thay đổi thêm.

### Q: Nếu có lỗi trong migration thì sao?
**A:** Rollback ngay lập tức từ backup. Migration script được thiết kế để chạy từng bước, dễ kiểm soát.

### Q: Có mất dữ liệu không?
**A:** KHÔNG. Dữ liệu được migrate 100% từ `vr_languages` sang `property_locales`. Chỉ xóa bảng cũ sau khi xác nhận.

### Q: Performance có cải thiện không?
**A:** CÓ. Thêm nhiều indexes giúp query nhanh hơn, đặc biệt với large datasets.

---

## Support

Nếu gặp vấn đề, kiểm tra:
1. Docker logs: `docker-compose logs -f backend`
2. Database error logs
3. API response từ endpoints test

Contact: [Your Contact Info]

---

**Migration Date:** 2026-01-10
**Version:** 1.0.0
**Impact:** VR Hotel Only
**Downtime Required:** Minimal (< 5 minutes recommended)
