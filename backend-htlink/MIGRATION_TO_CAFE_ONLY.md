# Migration to Cafe-Only System

## 📋 Overview

This migration converts the multi-service system (Travel Link + VR Hotel + Cafe) to a **Cafe-only** system.

## ✅ What Was Changed

### Frontend Changes (Already Completed)
- ✅ Removed VR Hotel pages folder (`pages/vr-hotel/`)
- ✅ Removed Travel Link layout (`layouts/MainLayout.tsx`)
- ✅ Removed Dashboard Selection page
- ✅ Updated login flow to redirect to `/cafe` directly
- ✅ Updated App.tsx routes (only Cafe, Admin, Settings remain)

### Backend Changes (Ready to Deploy)

#### 1. **Models** (`app/models/__init__.py`)
- ❌ Removed `service_access` field from `AdminUser` model
- ❌ Removed `service_access` from `AdminUserCreate` schema
- ❌ Removed `service_access` from `AdminUserUpdate` schema

#### 2. **Schemas** (`app/schemas/core.py`)
- ❌ Removed `service_access` from `AdminUserBase`
- ❌ Removed `service_access` from `AdminUserCreate`
- ❌ Removed `service_access` from `AdminUserUpdate`

#### 3. **CRUD** (`app/crud/crud_core.py`)
- ❌ Removed `service_access` from user creation

#### 4. **API Endpoints**
- ✅ Updated `/auth/me/services` - now always returns `["cafe"]`
- ❌ Removed service_access auto-sync logic from user creation

### Database Changes (⚠️ NOT YET APPLIED)

The SQL migration file is ready but **NOT executed yet**:
- 📁 Location: `backend/migrations/cleanup_cafe_only.sql`
- ⚠️ This will **DELETE** all VR Hotel and Travel Link data!

## 🚀 Deployment Steps

### Step 1: Backup Database (CRITICAL!)

```bash
# From backend-htlink directory
cd backend

# Create backup
mysqldump -u root -p linkhotel_saas_db > backup_before_cafe_only_$(date +%Y%m%d_%H%M%S).sql

# Verify backup exists
ls -lh backup_before_cafe_only_*.sql
```

### Step 2: Apply Database Migration

```bash
# Login to MySQL
mysql -u root -p linkhotel_saas_db

# Run migration
source migrations/cleanup_cafe_only.sql;

# Verify changes
DESCRIBE admin_users;  # Should NOT have service_access column
SHOW TABLES;           # Should only see Cafe, admin, and shared tables
```

### Step 3: Restart Backend

```bash
# Stop backend (if using Docker)
docker-compose down

# Rebuild (to apply model changes)
docker-compose build backend

# Start backend
docker-compose up -d backend

# Check logs
docker-compose logs -f backend
```

### Step 4: Verify Frontend

```bash
cd ../frontend

# Install dependencies (if needed)
npm install

# Start dev server
npm run dev

# Test login flow:
# 1. Login → Should redirect to /cafe (not /dashboard-selection)
# 2. Try accessing /vr-hotel → Should redirect to /cafe
# 3. Try accessing / → Should redirect to /cafe
```

## 🧪 Testing Checklist

- [ ] **Login** - redirects to `/cafe` dashboard
- [ ] **Root `/`** - redirects to `/cafe`
- [ ] **Unknown URLs** - redirect to `/cafe`
- [ ] **Create User** - works without service_access field
- [ ] **Update User** - works without service_access field
- [ ] **GET /auth/me/services** - returns `["cafe"]`
- [ ] **Cafe Dashboard** - loads correctly
- [ ] **Cafe Settings** - loads and saves
- [ ] **Cafe Users** - can manage users
- [ ] **Cafe Menu** - CRUD operations work
- [ ] **Media Library** - uploads with `source="cafe"`

## 🔄 Rollback Instructions

If something goes wrong:

```bash
# Stop services
docker-compose down

# Restore database from backup
mysql -u root -p linkhotel_saas_db < backup_before_cafe_only_YYYYMMDD_HHMMSS.sql

# Restore backend code (if needed)
git reset --hard HEAD~1  # Or specific commit

# Restart
docker-compose up -d
```

## 📊 Database Impact Summary

### Dropped Tables (~30+ tables)
- **VR Hotel**: `vr_hotel_settings`, `vr_hotel_seo`, `rooms`, `room_translations`, `room_media`, `facilities`, `services`, `dining`, `offers`, `policies`, `rules`, `contact_info`
- **Travel Link**: `properties`, `posts`, `post_translations`, `features`, `feature_translations`, `feature_categories`, `property_categories`

### Modified Tables
- **admin_users**: Removed `service_access` column

### Preserved Tables
- **Core**: `tenants`, `admin_users` (modified), `media_files`, `locales`, `audit_logs`
- **Cafe**: All 15+ Cafe tables (unchanged)

## 🎯 Benefits of This Migration

1. ✅ **Simpler codebase** - no multi-service logic
2. ✅ **Faster development** - focus on Cafe features only
3. ✅ **Smaller database** - ~30 fewer tables
4. ✅ **Better performance** - less data to query
5. ✅ **Cleaner auth flow** - no service selection needed

## 📝 Notes

- All Cafe data is **preserved**
- Media files are converted to `source='general'` (reusable)
- Admin users and tenants are **preserved**
- Authentication still works the same way
- User roles (Owner/Admin/Editor/Viewer) unchanged

## ❓ FAQ

**Q: Can I restore VR Hotel/Travel Link later?**  
A: Yes, if you kept the database backup. But you'll need to restore frontend code from git.

**Q: Will existing users need to re-login?**  
A: No, access tokens remain valid.

**Q: What happens to media files from VR Hotel?**  
A: They're kept but marked as `source='general'` so you can reuse them in Cafe.

**Q: Do I need to update API documentation?**  
A: Yes, remove references to `service_access` field in user endpoints.

---

**Created:** 2026-02-10  
**Status:** ✅ Code ready, ⚠️ Database migration pending
