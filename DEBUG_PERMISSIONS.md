# Debug Permissions Issue

## Vấn đề
- User đang login với role OWNER
- Menu "Users" và "Tenant Settings" không hiện trong sidebar
- Export button hiện "No Permission"

## Nguyên nhân có thể
1. **localStorage không có user data** hoặc user data sai format
2. **user.role không đúng format** (lowercase vs uppercase)
3. **usePermissions hook không parse đúng role**

## Cách debug

### 1. Kiểm tra localStorage trong browser Console (F12):
```javascript
// Kiểm tra user data
console.log('User:', localStorage.getItem('user'));
console.log('Parsed:', JSON.parse(localStorage.getItem('user')));

// Kiểm tra role
const user = JSON.parse(localStorage.getItem('user'));
console.log('Role:', user?.role);
console.log('Role uppercase:', user?.role?.toUpperCase());
```

### 2. Kiểm tra permissions:
```javascript
// Import hook trong console không được, nên xem log từ component
// Xem log "🔐 Sidebar Permissions:" trong console
```

### 3. Các trường hợp có thể:

#### Case 1: localStorage không có 'user'
**Triệu chứng**: `localStorage.getItem('user')` = null
**Giải pháp**: Login lại hoặc set manually:
```javascript
const userData = {
  id: 1,
  email: "owner@example.com",
  full_name: "Owner User",
  role: "OWNER",
  tenant_id: 1
};
localStorage.setItem('user', JSON.stringify(userData));
```

#### Case 2: user.role là lowercase "owner"
**Triệu chứng**: `user.role` = "owner" (lowercase)
**Giải pháp**: usePermissions đã có `.toUpperCase()` nên sẽ tự convert

#### Case 3: user object không có field 'role'
**Triệu chứng**: `user.role` = undefined
**Giải pháp**: Kiểm tra API response khi login, có thể field name khác

## Expected behavior

Với OWNER role, permissions phải là:
```javascript
{
  role: "OWNER",
  isOwner: true,
  isAdmin: false,
  isEditor: false,
  isViewer: false,
  canManageUsers: true,
  canManageTenant: true,
  canExportAnalytics: true,
  // ... all other permissions = true
}
```

## Quick fix

Nếu cần test ngay, chạy trong Console:
```javascript
// Set user data manually
const ownerUser = {
  id: 1,
  email: "owner@botonblue.com",
  full_name: "Owner User",
  role: "OWNER",
  tenant_id: 1
};
localStorage.setItem('user', JSON.stringify(ownerUser));

// Reload page
location.reload();
```

## Files đã thêm debug logs
1. `frontend/src/hooks/usePermissions.ts` - Log user data và role
2. `frontend/src/components/layout/Sidebar.tsx` - Log permissions

Xem console để thấy logs!

