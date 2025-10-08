# Category Activity Log Testing Guide

## Tóm tắt thay đổi

Đã cập nhật Category CRUD endpoints để tự động ghi log vào `activity_logs` table khi:
- ✅ **CREATE** category
- ✅ **UPDATE** category  
- ✅ **DELETE** category

## Các thay đổi đã thực hiện

### 1. File `backend/app/api/v1/endpoints/categories.py`

**Thay đổi:**
- Thêm `current_user: CurrentUser` parameter vào các endpoint CREATE, UPDATE, DELETE
- Thay thế decorator `@track_activity` bằng việc gọi trực tiếp `log_activity()` function
- Mỗi operation sẽ tự động tạo activity log với thông tin chi tiết

**Ví dụ log details:**

```python
# CREATE
{
    "message": "Category 'wifi' created by admin@example.com",
    "category_id": 123,
    "category_slug": "wifi",
    "user_id": 1,
    "username": "admin@example.com"
}

# UPDATE
{
    "message": "Category 'wifi' updated by admin@example.com",
    "category_id": 123,
    "category_slug": "wifi",
    "updated_fields": ["icon_key", "is_system"],
    "user_id": 1,
    "username": "admin@example.com"
}

# DELETE
{
    "message": "Category 'wifi' deleted by admin@example.com",
    "category_id": 123,
    "category_slug": "wifi",
    "user_id": 1,
    "username": "admin@example.com"
}
```

## Cách test

### 1. Test CREATE Category

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/categories/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "test-category",
    "icon_key": "test-icon",
    "is_system": false,
    "tenant_id": 1
  }'
```

**Kiểm tra log:**
```bash
curl "http://localhost:8000/api/v1/activity-logs/public?limit=5&tenant_id=1"
```

Bạn sẽ thấy log với `activity_type: "create_category"`

### 2. Test UPDATE Category

**Request:**
```bash
curl -X PUT "http://localhost:8000/api/v1/categories/123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "updated-category",
    "icon_key": "updated-icon"
  }'
```

**Kiểm tra log:**
```bash
curl "http://localhost:8000/api/v1/activity-logs/public?limit=5&tenant_id=1"
```

Bạn sẽ thấy log với `activity_type: "update_category"` và `updated_fields` trong details

### 3. Test DELETE Category

**Request:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/categories/123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Kiểm tra log:**
```bash
curl "http://localhost:8000/api/v1/activity-logs/public?limit=5&tenant_id=1"
```

Bạn sẽ thấy log với `activity_type: "delete_category"`

## Test qua Frontend

### 1. Mở Categories Management Page

Vào trang quản lý categories trong admin panel

### 2. Thực hiện các thao tác

- **Create**: Tạo category mới
- **Update**: Sửa category
- **Delete**: Xóa category

### 3. Kiểm tra Activity Logs

- Vào Dashboard → Recent Activity
- Hoặc vào Activities page (View All)
- Bạn sẽ thấy các activity logs tương ứng với các thao tác vừa thực hiện

## Kiểm tra trong Database

```sql
-- Xem tất cả activity logs cho tenant_id = 1
SELECT * FROM activity_logs 
WHERE tenant_id = 1 
ORDER BY created_at DESC 
LIMIT 10;

-- Xem chỉ category activities
SELECT * FROM activity_logs 
WHERE tenant_id = 1 
  AND activity_type IN ('create_category', 'update_category', 'delete_category')
ORDER BY created_at DESC;

-- Xem chi tiết của một log
SELECT 
  id,
  activity_type,
  JSON_EXTRACT(details, '$.message') as message,
  JSON_EXTRACT(details, '$.category_slug') as category_slug,
  JSON_EXTRACT(details, '$.username') as username,
  created_at
FROM activity_logs 
WHERE activity_type LIKE '%category%'
ORDER BY created_at DESC;
```

## Lưu ý

1. **Authentication Required**: Các endpoint CREATE, UPDATE, DELETE đều yêu cầu authentication. Bạn cần login và có JWT token.

2. **Tenant Isolation**: Activity logs được lưu theo `tenant_id` của user đang thực hiện action.

3. **Error Handling**: Nếu việc ghi log thất bại, nó sẽ không làm gián đoạn operation chính (category vẫn được tạo/sửa/xóa thành công).

4. **Activity Types**: Các activity types được định nghĩa trong `ActivityType` enum:
   - `CREATE_CATEGORY`
   - `UPDATE_CATEGORY`
   - `DELETE_CATEGORY`

## Troubleshooting

### Không thấy logs trong activity_logs table

1. Kiểm tra xem user có `tenant_id` không:
```python
print(current_user.tenant_id)
```

2. Kiểm tra xem `log_activity()` có được gọi không (thêm print statement):
```python
print(f"Logging activity: {activity_type}")
log_activity(...)
```

3. Kiểm tra database connection và permissions

### Logs không hiển thị trong Frontend

1. Kiểm tra API endpoint `/api/v1/activity-logs/public` có hoạt động không
2. Kiểm tra browser console có lỗi không
3. Kiểm tra `transformActivityLogs()` function trong `api.ts`

## Next Steps

Bạn có thể áp dụng pattern tương tự cho các modules khác:
- Features CRUD
- Properties CRUD
- Posts CRUD
- Users CRUD
- Settings CRUD

Chỉ cần:
1. Thêm `current_user: CurrentUser` parameter
2. Gọi `log_activity()` sau khi operation thành công
3. Truyền đúng `ActivityType` và details

