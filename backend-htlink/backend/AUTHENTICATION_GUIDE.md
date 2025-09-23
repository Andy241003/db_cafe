# HotelLink 360 SaaS - Authentication & Authorization System

## Tổng quan

Hệ thống authentication và authorization của HotelLink 360 SaaS sử dụng Role-Based Access Control (RBAC) với 4 level quyền chính:

1. **OWNER** - Chủ sở hữu hệ thống, có toàn quyền
2. **ADMIN** - Quản trị viên, có quyền quản lý hầu hết tính năng
3. **EDITOR** - Biên tập viên, có quyền quản lý nội dung
4. **VIEWER** - Người xem, chỉ có quyền đọc

## Cấu trúc Database

### AdminUser Table
```sql
CREATE TABLE admin_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    email VARCHAR(190) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(180) NOT NULL,
    role ENUM('OWNER', 'ADMIN', 'EDITOR', 'VIEWER') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

### Tenant-Based Multi-tenancy
- Mỗi user thuộc về 1 tenant cụ thể
- OWNER có thể truy cập tất cả tenant
- Các role khác chỉ truy cập tenant của mình

## Permission Matrix

### OWNER (Chủ sở hữu)
- ✅ Quản lý toàn bộ hệ thống
- ✅ Tạo/xóa tenant
- ✅ Quản lý tất cả users (bao gồm OWNER khác)
- ✅ Truy cập analytics toàn hệ thống
- ✅ Cấu hình system settings
- ✅ Toàn quyền trên tất cả resources

### ADMIN (Quản trị viên)
- ✅ Quản lý tenant của mình
- ✅ Tạo/sửa users (không thể tạo OWNER)
- ✅ Quản lý properties
- ✅ Quản lý content (posts, media)
- ✅ Xem analytics
- ✅ Cấu hình tenant settings
- ❌ Không thể xóa users
- ❌ Không thể truy cập tenant khác

### EDITOR (Biên tập viên)
- ✅ Xem thông tin tenant
- ✅ Sửa property information
- ✅ Tạo/sửa/publish content
- ✅ Upload/quản lý media
- ✅ Xem analytics
- ❌ Không thể quản lý users
- ❌ Không thể xóa content
- ❌ Không thể thay đổi settings

### VIEWER (Người xem)
- ✅ Xem tất cả thông tin
- ✅ Xem reports/analytics
- ❌ Không thể tạo/sửa/xóa bất kỳ nội dung nào

## Cách sử dụng

### 1. Basic Authentication Check

```python
from app.api.deps import CurrentUser

@router.get("/protected")
def protected_endpoint(current_user: CurrentUser):
    return {"user_id": current_user.id}
```

### 2. Role-based Access

```python
from app.core.auth_enhanced import OwnerUser, AdminUserDep, EditorUser

@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: OwnerUser):
    # Chỉ OWNER mới được xóa user
    pass

@router.get("/analytics") 
def get_analytics(current_user: AdminUserDep):
    # ADMIN hoặc OWNER mới được xem analytics
    pass
```

### 3. Permission-based Access

```python
from app.core.auth_enhanced import (
    ContentCreateContext,
    PropertyManagementContext,
    UserManagementContext
)

@router.post("/posts")
def create_post(post_data: dict, auth_context: ContentCreateContext):
    # Tự động check quyền tạo content
    pass

@router.put("/properties/{property_id}")
def update_property(property_id: int, auth_context: PropertyManagementContext):
    # Tự động check quyền quản lý property
    pass
```

### 4. Enhanced Auth Context

```python
from app.core.auth_enhanced import AuthContextDep

@router.get("/my-data")
def get_my_data(auth_context: AuthContextDep):
    # Lấy thông tin user
    user = auth_context.user
    
    # Check permissions
    if auth_context.can_perform_action(ResourceType.CONTENT, ActionType.CREATE):
        # User có thể tạo content
        pass
    
    # Check tenant access
    if auth_context.can_access_tenant(tenant_id):
        # User có thể truy cập tenant này
        pass
    
    # Get accessible tenants
    tenants = auth_context.accessible_tenants
```

### 5. Multi-tenant Access với Header

```python
# Client gửi request với header:
# X-Tenant-Code: demo

from app.core.auth_enhanced import TenantContextDep

@router.get("/tenant-data")
def get_tenant_data(auth_context: TenantContextDep):
    # Tự động validate tenant access
    tenant = auth_context.tenant  # Tenant từ header
    return {"tenant": tenant.name}
```

### 6. Decorators cho Custom Permissions

```python
from app.core.permissions import require_permission, ResourceType, ActionType

@router.post("/custom-action")
@require_permission(ResourceType.CONTENT, ActionType.PUBLISH)
def custom_action(current_user: CurrentUser):
    # Chỉ user có quyền publish content mới được gọi
    pass
```

## API Endpoints Mẫu

### Authentication
- `POST /api/v1/login/access-token` - Đăng nhập
- `GET /api/v1/auth/me` - Thông tin user hiện tại
- `GET /api/v1/auth/my-permissions` - Quyền của user hiện tại

### User Management (Admin+)
- `GET /api/v1/tenants/{tenant_id}/users` - Danh sách users
- `POST /api/v1/tenants/{tenant_id}/users` - Tạo user mới
- `PUT /api/v1/users/{user_id}` - Cập nhật user
- `DELETE /api/v1/users/{user_id}` - Xóa user (Owner only)

### Property Management
- `GET /api/v1/tenants/{tenant_id}/properties` - Danh sách properties
- `POST /api/v1/tenants/{tenant_id}/properties` - Tạo property
- `PUT /api/v1/properties/{property_id}` - Cập nhật property

### Content Management
- `GET /api/v1/content/posts` - Danh sách posts
- `POST /api/v1/content/posts` - Tạo post
- `PUT /api/v1/content/posts/{post_id}/publish` - Publish post

### Analytics (Admin+)
- `GET /api/v1/analytics/dashboard` - Dashboard analytics
- `GET /api/v1/analytics/reports` - Detailed reports

## Security Features

### 1. JWT Token-based Authentication
- Access token có thời hạn (configurable)
- Refresh token support (nếu cần)

### 2. Multi-tenant Isolation
- User chỉ truy cập được tenant của mình (trừ OWNER)
- Data isolation hoàn toàn giữa các tenant

### 3. Granular Permissions
- Permissions được check ở multiple levels:
  - Resource level (tenant, property, content, etc.)
  - Action level (create, read, update, delete, manage)
  - Context level (tenant access, property ownership)

### 4. Audit Trail (Future)
- Log tất cả operations quan trọng
- Track user activities

## Best Practices

### 1. Always use type annotations
```python
def my_endpoint(current_user: CurrentUser) -> dict:
    pass
```

### 2. Use specific permission dependencies
```python
# Good
def create_content(auth_context: ContentCreateContext):
    pass

# Less specific
def create_content(current_user: CurrentUser):
    # Manual permission check required
    pass
```

### 3. Handle tenant context properly
```python
@router.get("/data")
def get_data(auth_context: AuthContextDep, tenant_id: int = Query(...)):
    # Always validate tenant access
    auth_context.require_tenant_access(tenant_id)
    pass
```

### 4. Use proper error handling
```python
from fastapi import HTTPException, status

if not has_permission:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient permissions"
    )
```

## Testing

### 1. Create test users with different roles
```python
def test_owner_can_delete_user():
    owner_user = create_test_user(role=UserRole.OWNER)
    # Test owner permissions

def test_editor_cannot_delete_user():
    editor_user = create_test_user(role=UserRole.EDITOR)
    # Test editor limitations
```

### 2. Test multi-tenant isolation
```python
def test_user_cannot_access_other_tenant():
    user_tenant_1 = create_test_user(tenant_id=1)
    # Try to access tenant 2 data - should fail
```

## Migration & Deployment

### 1. Database Migration
- Tạo admin user đầu tiên với role OWNER
- Set up default tenant
- Migrate existing users nếu có

### 2. Environment Variables
```env
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
FIRST_SUPERUSER=admin@example.com  
FIRST_SUPERUSER_PASSWORD=changethis
```

Hệ thống này cung cấp authentication và authorization mạnh mẽ, linh hoạt cho HotelLink 360 SaaS với khả năng mở rộng tốt cho tương lai.