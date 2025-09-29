# Hotel Link Authentication API Demo

## Hệ thống Multitenant Authentication

Hệ thống này hỗ trợ authentication cho nhiều tenant khác nhau.

### 1. Authentication Endpoint
```
POST /api/v1/auth/access-token
```

### 2. Headers yêu cầu:
- `Content-Type: application/x-www-form-urlencoded`
- `X-Tenant-Domain: [tenant_code]` - Mã tenant (ví dụ: "demo")

### 3. Body (form-data):
- `username`: Email của user
- `password`: Mật khẩu

### 4. Tenant và Users có sẵn:

#### Tenant: "demo"
- **Admin User**: 
  - Email: `admin@travel.link360.vn`
  - Password: `admin123`
  - Role: OWNER

- **Test User**:
  - Email: `test@demo.com` 
  - Password: `test123`
  - Role: ADMIN

### 5. Ví dụ sử dụng:

#### PowerShell:
```powershell
# Lấy access token
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/access-token" -Method POST -Headers @{"Content-Type"="application/x-www-form-urlencoded"; "X-Tenant-Domain"="demo"} -Body "username=test@demo.com&password=test123"

$token = $response.access_token

# Sử dụng token để gọi API
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users/me" -Method GET -Headers @{"Authorization"="Bearer $token"; "X-Tenant-Domain"="demo"}
```

#### cURL:
```bash
# Lấy access token
curl -X POST "http://localhost:8000/api/v1/auth/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Tenant-Domain: demo" \
  -d "username=test@demo.com&password=test123"

# Sử dụng token
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Tenant-Domain: demo"
```

### 6. Response Format:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 7. Sử dụng Token:
Với mỗi API call tiếp theo, bạn cần include:
- `Authorization: Bearer {access_token}`
- `X-Tenant-Domain: {tenant_code}`

### 8. API Endpoints có sẵn:
- `GET /api/v1/users/me` - Thông tin user hiện tại
- `GET /api/v1/properties/` - Danh sách properties
- `GET /api/v1/features/` - Danh sách features  
- `GET /api/v1/posts/` - Danh sách posts
- `GET /api/v1/property-categories/` - Danh sách property categories
- `GET /api/v1/translations/` - Danh sách translations

### 9. Multitenant Architecture:
- Mỗi tenant có dữ liệu riêng biệt
- Users chỉ có thể truy cập dữ liệu của tenant họ thuộc về
- Tenant được xác định qua header `X-Tenant-Domain`

### 10. Bảo mật:
- JWT tokens có thời gian hết hạn
- Passwords được hash bằng bcrypt
- API kiểm tra quyền truy cập tenant cho mỗi request