# ✅ DANH SÁCH SỬA CHỮA PHÂN QUYỀN
## Permission Fix Checklist - Hotel Link 360 SaaS

---

## 🔴 PRIORITY 1 - CRITICAL (Sửa ngay)

### 1. Settings API - Thêm Authentication
**File:** `backend/app/api/v1/endpoints/settings.py`

- [ ] Thêm `CurrentUser` dependency cho tất cả endpoints
- [ ] Thêm role check cho POST/PUT/DELETE (chỉ OWNER, ADMIN)
- [ ] Thêm tenant access check

**Endpoints cần sửa:**
```python
# GET endpoints - cần authentication
- GET /settings/
- GET /settings/tenant/{tenant_id}
- GET /settings/property/{tenant_id}/{property_id}
- GET /settings/key/{key_name}

# POST/PUT/DELETE - cần authentication + role check (OWNER, ADMIN)
- POST /settings/
- PUT /settings/{setting_id}
- DELETE /settings/{setting_id}
```

**Code mẫu:**
```python
from app.api.deps import CurrentUser, CurrentTenantId

@router.get("/", response_model=List[SettingResponse])
def list_settings(
    *,
    db: SessionDep,
    current_user: CurrentUser,  # ← Thêm
    tenant_id: CurrentTenantId,  # ← Thêm
    skip: int = 0,
    limit: int = 100
):
    # Check tenant access
    if current_user.role != UserRole.OWNER and current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")
    ...
```

---

### 2. Categories API - Thêm Authentication cho GET
**File:** `backend/app/api/v1/endpoints/categories.py`

- [ ] Thêm `CurrentUser` dependency cho GET endpoints
- [ ] Thêm role check cho POST/PUT/DELETE (OWNER, ADMIN, EDITOR)

**Endpoints cần sửa:**
```python
# GET endpoints - cần authentication
- GET /categories/
- GET /categories/system
- GET /categories/{category_id}

# POST/PUT/DELETE - cần role check
- POST /categories/  # OWNER, ADMIN, EDITOR
- PUT /categories/{category_id}  # OWNER, ADMIN, EDITOR
- DELETE /categories/{category_id}  # OWNER, ADMIN only
```

**Code mẫu:**
```python
@router.get("/", response_model=List[FeatureCategoryResponse])
def list_categories(
    *,
    db: SessionDep,
    current_user: CurrentUser,  # ← Thêm
    tenant_id: int = 0,
    skip: int = 0,
    limit: int = 100
):
    ...

@router.post("/", response_model=FeatureCategoryResponse)
def create_category(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    category_in: FeatureCategoryCreate
):
    # Check permissions
    if current_user.role.upper() not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    ...
```

---

### 3. Analytics API - Thêm Authentication
**File:** `backend/app/api/v1/endpoints/analytics.py`

- [ ] Thêm authentication cho `/stats`
- [ ] Thêm authentication cho `/realtime`
- [ ] Giảm restriction cho `/summary/{period}` (cho phép tất cả roles)
- [ ] Giảm restriction cho `/properties/{id}/stats` (cho phép tất cả roles)

**Endpoints cần sửa:**
```python
# Cần thêm authentication
- GET /analytics/stats
- GET /analytics/realtime

# Cần giảm restriction (từ OWNER only → All authenticated)
- GET /analytics/summary/{period}
- GET /analytics/properties/{property_id}/stats
- GET /analytics/dashboard-stats
```

**Code mẫu:**
```python
@router.get("/stats")
def get_analytics_stats(
    session: SessionDep,
    current_user: CurrentUser,  # ← Thêm
    days: int = 30
):
    """Get analytics statistics - requires authentication"""
    tenant_id = current_user.tenant_id
    # ... rest of code
    
@router.get("/summary/{period}")
def get_analytics_summary(
    period: str,
    session: SessionDep,
    current_user: CurrentUser,  # ← Thay đổi từ CurrentSuperUser
    days: int = 30,
):
    """Get analytics summary - all authenticated users can access"""
    tenant_id = current_user.tenant_id
    # ... rest of code
```

---

## 🟠 PRIORITY 2 - HIGH (Sửa trong tuần)

### 4. Posts API - Thêm Role-based Permission Check
**File:** `backend/app/api/v1/endpoints/posts.py`

- [ ] Thêm role check cho POST (OWNER, ADMIN, EDITOR)
- [ ] Thêm role check cho PUT (OWNER, ADMIN, EDITOR)
- [ ] Thêm role check cho DELETE (OWNER, ADMIN only)
- [ ] Thêm role check cho PUBLISH action (OWNER, ADMIN, EDITOR)

**Code mẫu:**
```python
from app.core.permissions_utils import is_admin_or_owner

@router.post("/", response_model=PostResponse)
def create_post(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    post_in: PostCreate,
):
    # Check permissions - OWNER, ADMIN, EDITOR can create
    if current_user.role.upper() not in ["OWNER", "ADMIN", "EDITOR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    ...

@router.delete("/{post_id}")
def delete_post(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    post_id: int,
):
    # Check permissions - only OWNER, ADMIN can delete
    if not is_admin_or_owner(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    ...
```

---

### 5. Chuẩn hóa Role Checking
**Files:** Tất cả API endpoints

- [ ] Tạo helper functions trong `permissions_utils.py`
- [ ] Thay thế tất cả role checks bằng helper functions
- [ ] Sử dụng `UserRole` enum thay vì string

**Tạo helpers:**
```python
# backend/app/core/permissions_utils.py

def can_create_content(user: AdminUser) -> bool:
    """Check if user can create content (OWNER, ADMIN, EDITOR)"""
    return user.role in [UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR]

def can_delete_content(user: AdminUser) -> bool:
    """Check if user can delete content (OWNER, ADMIN)"""
    return user.role in [UserRole.OWNER, UserRole.ADMIN]

def can_manage_users(user: AdminUser) -> bool:
    """Check if user can manage users (OWNER, ADMIN)"""
    return user.role in [UserRole.OWNER, UserRole.ADMIN]

def can_manage_settings(user: AdminUser) -> bool:
    """Check if user can manage settings (OWNER, ADMIN)"""
    return user.role in [UserRole.OWNER, UserRole.ADMIN]

def is_viewer_only(user: AdminUser) -> bool:
    """Check if user is viewer only"""
    return user.role == UserRole.VIEWER
```

**Sử dụng:**
```python
from app.core.permissions_utils import can_create_content, can_delete_content

@router.post("/")
def create_something(current_user: CurrentUser, ...):
    if not can_create_content(current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    ...
```

---

## 🟡 PRIORITY 3 - MEDIUM (Sửa trong tháng)

### 6. Frontend - Role-based UI Restrictions

#### 6.1. Tạo Permission Hook
**File:** `frontend/src/hooks/usePermissions.ts`

```typescript
import { useAuth } from './useAuth';

export type UserRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export const usePermissions = () => {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase() as UserRole;

  return {
    // User management
    canManageUsers: ['OWNER', 'ADMIN'].includes(role),
    canCreateUser: ['OWNER', 'ADMIN'].includes(role),
    canDeleteUser: role === 'OWNER',
    
    // Content management
    canCreateContent: ['OWNER', 'ADMIN', 'EDITOR'].includes(role),
    canEditContent: ['OWNER', 'ADMIN', 'EDITOR'].includes(role),
    canDeleteContent: ['OWNER', 'ADMIN'].includes(role),
    canPublishContent: ['OWNER', 'ADMIN', 'EDITOR'].includes(role),
    
    // Property management
    canCreateProperty: ['OWNER', 'ADMIN'].includes(role),
    canEditProperty: ['OWNER', 'ADMIN'].includes(role),
    canDeleteProperty: ['OWNER', 'ADMIN'].includes(role),
    
    // Media management
    canUploadMedia: ['OWNER', 'ADMIN', 'EDITOR'].includes(role),
    canDeleteMedia: ['OWNER', 'ADMIN'].includes(role),
    
    // Settings
    canManageSettings: ['OWNER', 'ADMIN'].includes(role),
    canManageTenant: role === 'OWNER',
    
    // Analytics
    canViewAnalytics: true, // All roles can view
    canExportAnalytics: ['OWNER', 'ADMIN'].includes(role),
    
    // General
    isOwner: role === 'OWNER',
    isAdmin: role === 'ADMIN',
    isEditor: role === 'EDITOR',
    isViewer: role === 'VIEWER',
    role,
  };
};
```

#### 6.2. Sử dụng trong Components

**Example: Analytics Page**
```typescript
// frontend/src/pages/Analytics.tsx
import { usePermissions } from '../hooks/usePermissions';

const Analytics: React.FC = () => {
  const { canExportAnalytics, isViewer } = usePermissions();
  
  return (
    <div>
      {/* Chỉ hiện nút Export cho OWNER, ADMIN */}
      {canExportAnalytics && (
        <button onClick={handleExportData}>
          Export
        </button>
      )}
      
      {/* Hiện thông báo cho Viewer */}
      {isViewer && (
        <div className="alert alert-info">
          You have read-only access to analytics
        </div>
      )}
    </div>
  );
};
```

**Example: Users Page**
```typescript
// frontend/src/pages/Users.tsx
const Users: React.FC = () => {
  const { canManageUsers, canDeleteUser } = usePermissions();
  
  // Redirect nếu không có quyền
  if (!canManageUsers) {
    return <Navigate to="/" />;
  }
  
  return (
    <div>
      {/* Chỉ hiện nút Delete cho OWNER */}
      {canDeleteUser && (
        <button onClick={handleDelete}>Delete</button>
      )}
    </div>
  );
};
```

#### 6.3. Ẩn Menu Items theo Role
**File:** `frontend/src/components/layout/Sidebar.tsx`

```typescript
import { usePermissions } from '../../hooks/usePermissions';

const Sidebar: React.FC = () => {
  const { canManageUsers, canManageSettings, canManageTenant } = usePermissions();
  
  return (
    <nav>
      {/* Tất cả user đều thấy */}
      <MenuItem to="/" icon="dashboard">Dashboard</MenuItem>
      <MenuItem to="/analytics" icon="chart">Analytics</MenuItem>
      
      {/* Chỉ OWNER, ADMIN, EDITOR */}
      <MenuItem to="/properties" icon="hotel">Properties</MenuItem>
      <MenuItem to="/categories" icon="category">Categories</MenuItem>
      <MenuItem to="/features" icon="star">Features</MenuItem>
      
      {/* Chỉ OWNER, ADMIN */}
      {canManageUsers && (
        <MenuItem to="/users" icon="users">Users</MenuItem>
      )}
      
      {canManageSettings && (
        <MenuItem to="/settings" icon="settings">Settings</MenuItem>
      )}
      
      {/* Chỉ OWNER */}
      {canManageTenant && (
        <MenuItem to="/tenant-settings" icon="building">Tenant Settings</MenuItem>
      )}
    </nav>
  );
};
```

---

### 7. Thêm Permission Error Messages

**File:** `frontend/src/components/PermissionDenied.tsx`

```typescript
import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface Props {
  requiredRole?: string;
  action?: string;
}

export const PermissionDenied: React.FC<Props> = ({ requiredRole, action }) => {
  const { role } = usePermissions();
  
  return (
    <div className="permission-denied">
      <h2>Access Denied</h2>
      <p>
        Your role ({role}) does not have permission to {action || 'perform this action'}.
        {requiredRole && ` Required role: ${requiredRole}`}
      </p>
      <button onClick={() => window.history.back()}>Go Back</button>
    </div>
  );
};
```

---

### 8. Viết Tests cho Permission System

**File:** `backend/tests/test_permissions.py`

```python
import pytest
from app.core.permissions import PermissionChecker, ResourceType, ActionType
from app.models import UserRole

def test_owner_has_all_permissions():
    """Test OWNER has all permissions"""
    assert PermissionChecker.has_permission(
        UserRole.OWNER, ResourceType.USER, ActionType.DELETE
    )
    assert PermissionChecker.has_permission(
        UserRole.OWNER, ResourceType.TENANT, ActionType.MANAGE
    )

def test_admin_cannot_delete_users():
    """Test ADMIN cannot delete users"""
    assert not PermissionChecker.has_permission(
        UserRole.ADMIN, ResourceType.USER, ActionType.DELETE
    )

def test_editor_cannot_delete_content():
    """Test EDITOR cannot delete content"""
    assert not PermissionChecker.has_permission(
        UserRole.EDITOR, ResourceType.CONTENT, ActionType.DELETE
    )

def test_viewer_can_only_read():
    """Test VIEWER can only read"""
    assert PermissionChecker.has_permission(
        UserRole.VIEWER, ResourceType.ANALYTICS, ActionType.READ
    )
    assert not PermissionChecker.has_permission(
        UserRole.VIEWER, ResourceType.CONTENT, ActionType.CREATE
    )
```

---

## 📋 CHECKLIST TỔNG HỢP

### Backend API
- [ ] Settings API - Thêm authentication (12 endpoints)
- [ ] Categories API - Thêm authentication (6 endpoints)
- [ ] Analytics API - Sửa authentication (5 endpoints)
- [ ] Posts API - Thêm role checks (4 endpoints)
- [ ] Chuẩn hóa role checking (tất cả files)

### Frontend
- [ ] Tạo usePermissions hook
- [ ] Thêm role-based UI cho Analytics page
- [ ] Thêm role-based UI cho Users page
- [ ] Thêm role-based UI cho Settings page
- [ ] Thêm role-based UI cho Tenant Settings page
- [ ] Ẩn menu items theo role
- [ ] Thêm PermissionDenied component

### Testing
- [ ] Viết unit tests cho PermissionChecker
- [ ] Viết integration tests cho API endpoints
- [ ] Viết E2E tests cho frontend permissions

### Documentation
- [ ] Cập nhật AUTHENTICATION_GUIDE.md
- [ ] Tạo PERMISSION_MATRIX.md
- [ ] Thêm examples vào README.md

---

**Tổng số tasks:** 35  
**Ước tính thời gian:** 3-5 ngày làm việc  
**Mức độ ưu tiên:** CRITICAL → HIGH → MEDIUM

