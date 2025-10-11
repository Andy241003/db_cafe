# 📊 MA TRẬN PHÂN QUYỀN CHI TIẾT
## Hotel Link 360 SaaS - Detailed Permission Matrix

---

## 🎭 ROLES OVERVIEW

| Role | Level | Description |
|------|-------|-------------|
| **OWNER** | 4 (Highest) | Full system access, tenant & user management |
| **ADMIN** | 3 | Property & content management, user control |
| **EDITOR** | 2 | Content creation/editing only |
| **VIEWER** | 1 (Lowest) | Read-only access |

---

## 📦 RESOURCES & ACTIONS

### Resources (8 types):
1. **TENANT** - Tenant/organization management
2. **PROPERTY** - Hotel properties
3. **USER** - User accounts & roles
4. **PLAN** - Subscription plans
5. **CONTENT** - Posts, categories, features
6. **MEDIA** - Images, videos, files
7. **ANALYTICS** - Statistics & reports
8. **SETTINGS** - System configuration

### Actions (7 types):
- **CREATE** - Tạo mới
- **READ** - Xem/đọc
- **UPDATE** - Cập nhật
- **DELETE** - Xóa
- **MANAGE** - Quản lý toàn bộ (bao gồm tất cả actions)
- **PUBLISH** - Xuất bản (content)
- **ARCHIVE** - Lưu trữ (content)

---

## 🔴 OWNER - Full System Access

### ✅ Tenant Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ✅ Yes | Tạo tenant mới |
| READ | ✅ Yes | Xem tất cả tenants |
| UPDATE | ✅ Yes | Sửa tenant settings |
| DELETE | ✅ Yes | Xóa tenant |
| MANAGE | ✅ Yes | Full control |

### ✅ Property Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ✅ Yes | Tạo property mới |
| READ | ✅ Yes | Xem tất cả properties |
| UPDATE | ✅ Yes | Sửa property info |
| DELETE | ✅ Yes | Xóa property |
| MANAGE | ✅ Yes | Full control |

### ✅ User Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ✅ Yes | Tạo user mới (tất cả roles) |
| READ | ✅ Yes | Xem tất cả users |
| UPDATE | ✅ Yes | Sửa user info & roles |
| DELETE | ✅ Yes | Xóa users |
| MANAGE | ✅ Yes | Full control |

### ✅ Content Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ✅ Yes | Tạo posts, categories, features |
| READ | ✅ Yes | Xem tất cả content |
| UPDATE | ✅ Yes | Sửa content |
| DELETE | ✅ Yes | Xóa content |
| PUBLISH | ✅ Yes | Publish posts |
| ARCHIVE | ✅ Yes | Archive posts |
| MANAGE | ✅ Yes | Full control |

### ✅ Media Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ✅ Yes | Upload files |
| READ | ✅ Yes | Xem media library |
| UPDATE | ✅ Yes | Sửa metadata |
| DELETE | ✅ Yes | Xóa files |
| MANAGE | ✅ Yes | Full control |

### ✅ Analytics
| Action | Permission | Notes |
|--------|-----------|-------|
| READ | ✅ Yes | Xem tất cả analytics |

### ✅ Settings
| Action | Permission | Notes |
|--------|-----------|-------|
| READ | ✅ Yes | Xem settings |
| UPDATE | ✅ Yes | Sửa settings |
| MANAGE | ✅ Yes | Full control |

### ✅ Plan Management
| Action | Permission | Notes |
|--------|-----------|-------|
| READ | ✅ Yes | Xem plans |
| UPDATE | ✅ Yes | Thay đổi subscription |

---

## 🟠 ADMIN - Property & Content Management

### ⚠️ Tenant Management (Limited)
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ❌ No | Không thể tạo tenant |
| READ | ✅ Yes | Xem tenant info |
| UPDATE | ✅ Yes | Sửa một số settings (không phải tenant config) |
| DELETE | ❌ No | Không thể xóa tenant |
| MANAGE | ❌ No | |

### ✅ Property Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ✅ Yes | Tạo property mới |
| READ | ✅ Yes | Xem properties |
| UPDATE | ✅ Yes | Sửa property info |
| DELETE | ✅ Yes | Xóa property |
| MANAGE | ❌ No | Không có MANAGE permission |

### ⚠️ User Management (Limited)
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ✅ Yes | Tạo user mới (trừ OWNER) |
| READ | ✅ Yes | Xem users |
| UPDATE | ✅ Yes | Sửa user info |
| DELETE | ❌ No | **Không thể xóa users** |
| MANAGE | ❌ No | |

### ✅ Content Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ✅ Yes | Tạo posts, categories, features |
| READ | ✅ Yes | Xem content |
| UPDATE | ✅ Yes | Sửa content |
| DELETE | ✅ Yes | Xóa content |
| PUBLISH | ✅ Yes | Publish posts |
| ARCHIVE | ✅ Yes | Archive posts |
| MANAGE | ❌ No | |

### ✅ Media Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ✅ Yes | Upload files |
| READ | ✅ Yes | Xem media |
| UPDATE | ✅ Yes | Sửa metadata |
| DELETE | ✅ Yes | Xóa files |
| MANAGE | ❌ No | |

### ✅ Analytics
| Action | Permission | Notes |
|--------|-----------|-------|
| READ | ✅ Yes | Xem analytics |

### ⚠️ Settings (Limited)
| Action | Permission | Notes |
|--------|-----------|-------|
| READ | ✅ Yes | Xem settings |
| UPDATE | ✅ Yes | Sửa settings (không phải tenant-level) |
| MANAGE | ❌ No | |

### ✅ Plan Management
| Action | Permission | Notes |
|--------|-----------|-------|
| READ | ✅ Yes | Xem plans |
| UPDATE | ❌ No | Không thể thay đổi subscription |

---

## 🟡 EDITOR - Content Creation/Editing

### ❌ Tenant Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ❌ No | |
| READ | ✅ Yes | Chỉ xem tenant info |
| UPDATE | ❌ No | |
| DELETE | ❌ No | |
| MANAGE | ❌ No | |

### ⚠️ Property Management (Limited)
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ❌ No | Không thể tạo property |
| READ | ✅ Yes | Xem properties |
| UPDATE | ✅ Yes | Sửa property info |
| DELETE | ❌ No | Không thể xóa |
| MANAGE | ❌ No | |

### ❌ User Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ❌ No | |
| READ | ✅ Yes | Chỉ xem users |
| UPDATE | ❌ No | |
| DELETE | ❌ No | |
| MANAGE | ❌ No | |

### ⚠️ Content Management (Limited)
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ✅ Yes | Tạo posts, categories, features |
| READ | ✅ Yes | Xem content |
| UPDATE | ✅ Yes | Sửa content |
| DELETE | ❌ No | **Không thể xóa content** |
| PUBLISH | ✅ Yes | Publish posts |
| ARCHIVE | ❌ No | **Không thể archive** |
| MANAGE | ❌ No | |

### ⚠️ Media Management (Limited)
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ✅ Yes | Upload files |
| READ | ✅ Yes | Xem media |
| UPDATE | ✅ Yes | Sửa metadata |
| DELETE | ❌ No | **Không thể xóa files** |
| MANAGE | ❌ No | |

### ✅ Analytics
| Action | Permission | Notes |
|--------|-----------|-------|
| READ | ✅ Yes | Xem analytics |

### ❌ Settings
| Action | Permission | Notes |
|--------|-----------|-------|
| READ | ✅ Yes | Chỉ xem settings |
| UPDATE | ❌ No | |
| MANAGE | ❌ No | |

### ✅ Plan Management
| Action | Permission | Notes |
|--------|-----------|-------|
| READ | ✅ Yes | Xem plans |
| UPDATE | ❌ No | |

---

## 🟢 VIEWER - Read-Only Access

### ❌ Tenant Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ❌ No | |
| READ | ✅ Yes | Chỉ xem |
| UPDATE | ❌ No | |
| DELETE | ❌ No | |
| MANAGE | ❌ No | |

### ❌ Property Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ❌ No | |
| READ | ✅ Yes | Chỉ xem |
| UPDATE | ❌ No | |
| DELETE | ❌ No | |
| MANAGE | ❌ No | |

### ❌ User Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ❌ No | |
| READ | ✅ Yes | Chỉ xem |
| UPDATE | ❌ No | |
| DELETE | ❌ No | |
| MANAGE | ❌ No | |

### ❌ Content Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ❌ No | |
| READ | ✅ Yes | Chỉ xem |
| UPDATE | ❌ No | |
| DELETE | ❌ No | |
| PUBLISH | ❌ No | |
| ARCHIVE | ❌ No | |
| MANAGE | ❌ No | |

### ❌ Media Management
| Action | Permission | Notes |
|--------|-----------|-------|
| CREATE | ❌ No | |
| READ | ✅ Yes | Chỉ xem |
| UPDATE | ❌ No | |
| DELETE | ❌ No | |
| MANAGE | ❌ No | |

### ✅ Analytics
| Action | Permission | Notes |
|--------|-----------|-------|
| READ | ✅ Yes | Xem analytics |

### ❌ Settings
| Action | Permission | Notes |
|--------|-----------|-------|
| READ | ✅ Yes | Chỉ xem |
| UPDATE | ❌ No | |
| MANAGE | ❌ No | |

### ✅ Plan Management
| Action | Permission | Notes |
|--------|-----------|-------|
| READ | ✅ Yes | Xem plans |
| UPDATE | ❌ No | |

---

## 📊 QUICK REFERENCE TABLE

| Resource | OWNER | ADMIN | EDITOR | VIEWER |
|----------|-------|-------|--------|--------|
| **Tenant** | MANAGE | READ, UPDATE | READ | READ |
| **Property** | MANAGE | CREATE, READ, UPDATE, DELETE | READ, UPDATE | READ |
| **User** | MANAGE | CREATE, READ, UPDATE | READ | READ |
| **Content** | MANAGE | CREATE, READ, UPDATE, DELETE, PUBLISH, ARCHIVE | CREATE, READ, UPDATE, PUBLISH | READ |
| **Media** | MANAGE | CREATE, READ, UPDATE, DELETE | CREATE, READ, UPDATE | READ |
| **Analytics** | READ | READ | READ | READ |
| **Settings** | MANAGE | READ, UPDATE | READ | READ |
| **Plan** | READ, UPDATE | READ | READ | READ |

---

## 🎯 USE CASES

### Scenario 1: Tạo một bài post mới
- ✅ **OWNER**: Có thể tạo
- ✅ **ADMIN**: Có thể tạo
- ✅ **EDITOR**: Có thể tạo
- ❌ **VIEWER**: Không thể tạo

### Scenario 2: Xóa một property
- ✅ **OWNER**: Có thể xóa
- ✅ **ADMIN**: Có thể xóa
- ❌ **EDITOR**: Không thể xóa
- ❌ **VIEWER**: Không thể xóa

### Scenario 3: Thêm user mới
- ✅ **OWNER**: Có thể thêm (tất cả roles)
- ✅ **ADMIN**: Có thể thêm (trừ OWNER role)
- ❌ **EDITOR**: Không thể thêm
- ❌ **VIEWER**: Không thể thêm

### Scenario 4: Xem analytics
- ✅ **OWNER**: Có thể xem
- ✅ **ADMIN**: Có thể xem
- ✅ **EDITOR**: Có thể xem
- ✅ **VIEWER**: Có thể xem

### Scenario 5: Upload media file
- ✅ **OWNER**: Có thể upload
- ✅ **ADMIN**: Có thể upload
- ✅ **EDITOR**: Có thể upload
- ❌ **VIEWER**: Không thể upload

### Scenario 6: Xóa user
- ✅ **OWNER**: Có thể xóa
- ❌ **ADMIN**: Không thể xóa
- ❌ **EDITOR**: Không thể xóa
- ❌ **VIEWER**: Không thể xóa

---

**Version:** 1.0  
**Last Updated:** 2025-10-11

