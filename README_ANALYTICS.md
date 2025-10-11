# Hotel Link 360 - Analytics System

## 🎯 Tổng quan

Hệ thống Analytics cho phép tracking và phân tích traffic của các website khách sạn.

### Websites

- **🏨 Website khách sạn**: https://botonblue.trip360.vn/
- **⚙️ Admin Panel**: https://travel.link360.vn/
- **🔌 Backend API**: https://travel.link360.vn/api/v1/

## 📚 Tài liệu

### 1. Quick Start (Bắt đầu nhanh)
📄 **File**: `QUICK_START_ANALYTICS.md`

Hướng dẫn nhanh nhất để:
- Tạo sample data để test
- Xem Analytics dashboard
- Troubleshooting cơ bản

**Dùng khi**: Bạn muốn test Analytics ngay lập tức

### 2. Analytics Setup Guide (Hướng dẫn chi tiết)
📄 **File**: `ANALYTICS_SETUP_GUIDE.md`

Hướng dẫn đầy đủ về:
- Cách hoạt động của Analytics
- Setup tracking key
- Nhúng tracking script
- Tạo sample data
- Database schema
- Customization

**Dùng khi**: Bạn muốn hiểu sâu về hệ thống

### 3. Production Deployment (Deploy production)
📄 **File**: `PRODUCTION_DEPLOYMENT_GUIDE.md`

Hướng dẫn deploy lên production:
- Setup cho website thật (botonblue.trip360.vn)
- Nhúng tracking script
- Test và verify
- Monitoring
- Troubleshooting

**Dùng khi**: Bạn sẵn sàng deploy lên production

### 4. Tracking Script
📄 **File**: `TRACKING_SCRIPT_BOTONBLUE.html`

Script tracking hoàn chỉnh để nhúng vào website botonblue.trip360.vn

**Dùng khi**: Bạn cần copy tracking code

### 5. Activity Logging Status
📄 **File**: `ACTIVITY_LOGGING_STATUS.md`

Tổng hợp về activity logging:
- Các endpoints đã có logging
- Timezone fix
- Activity types

**Dùng khi**: Bạn muốn kiểm tra activity logging

### 6. Permission Fixes
📄 **File**: `PERMISSION_FIXES_COMPLETED.md`

Chi tiết về permission system:
- Backend API permissions
- Frontend UI restrictions
- Role-based access control

**Dùng khi**: Bạn cần hiểu về phân quyền

## 🚀 Quick Start - 3 Bước

### Bước 1: Tạo Sample Data (Test)

```bash
# Chạy trong terminal
cd backend-htlink
docker-compose exec backend python /app/seed_analytics_data.py
```

### Bước 2: Xem Analytics Dashboard

1. **Logout và Login lại** vào https://travel.link360.vn/
2. **Vào Analytics page**
3. **Refresh** (Ctrl + R)
4. Xem charts và stats

### Bước 3: Deploy lên Production

1. **Copy tracking script** từ `TRACKING_SCRIPT_BOTONBLUE.html`
2. **Paste vào** `<head>` của website botonblue.trip360.vn
3. **Deploy** website
4. **Test** bằng cách vào website và check Analytics page

## 📊 Tính năng Analytics

### Dashboard Stats
- ✅ **Total Page Views** - Tổng lượt xem trang
- ✅ **Unique Visitors** - Số khách truy cập duy nhất
- ✅ **Total Events** - Tổng số events (page views + clicks + shares)
- ✅ **Properties Count** - Số lượng properties

### Charts
- ✅ **Page Views by Day** - Line chart theo ngày
- ✅ **Traffic Sources** - Pie chart theo device (Desktop/Mobile/Tablet)

### Real-time Stats
- ✅ **Active Users** - Users trong 15 phút
- ✅ **Page Views** - Views trong 5 phút
- ✅ **Events** - Events trong 1 phút

### Date Range Picker
- ✅ This Month / Last Month
- ✅ This Quarter / Last Quarter
- ✅ This Year / Last Year
- ✅ Custom Range

### Export
- ✅ **Export CSV** (OWNER/ADMIN only)
- ✅ Bao gồm tất cả metrics

## 🔑 Tracking Events

### Event Types

1. **page_view** - Khi user vào trang
2. **click** - Khi user click vào link/button
3. **share** - Khi user share trên social media

### Data Tracked

- ✅ **Device Type** - desktop, mobile, tablet
- ✅ **User Agent** - Browser và OS info
- ✅ **URL** - Trang hiện tại
- ✅ **Referrer** - Nguồn traffic
- ✅ **IP Hash** - IP được hash (privacy)
- ✅ **Timestamp** - Thời gian event

## 🔐 Phân quyền

### OWNER
- ✅ Xem tất cả analytics
- ✅ Export CSV
- ✅ Quản lý properties
- ✅ Quản lý users
- ✅ Tenant settings

### ADMIN
- ✅ Xem tất cả analytics
- ✅ Export CSV
- ✅ Quản lý properties
- ✅ Quản lý users
- ❌ Tenant settings

### EDITOR
- ✅ Xem analytics
- ❌ Export CSV
- ✅ Quản lý content
- ❌ Quản lý users

### VIEWER
- ✅ Xem analytics
- ❌ Export CSV
- ❌ Quản lý content
- ❌ Quản lý users

## 🛠 Scripts & Tools

### Python Scripts

1. **`seed_analytics_data.py`** - Tạo sample data
   ```bash
   docker-compose exec backend python /app/seed_analytics_data.py --events 1000 --days 60
   ```

### JavaScript Scripts

1. **`test-analytics-tracking.js`** - Test tracking từ browser console
   - Mở Console (F12)
   - Copy script và paste
   - Chạy để tạo sample events

## 📁 File Structure

```
backend-htlink/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   ├── analytics.py          # Analytics API endpoints
│   │   │   ├── activity_logs.py      # Activity logging
│   │   │   └── properties.py         # Properties management
│   │   ├── models/
│   │   │   ├── event.py              # Event model
│   │   │   └── activity_log.py       # Activity log model
│   │   └── utils/
│   │       └── activity_logger.py    # Activity logging utility
│   └── seed_analytics_data.py        # Seed script
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Analytics.tsx         # Analytics dashboard
│   │   ├── hooks/
│   │   │   ├── useAnalytics.ts       # Analytics hook
│   │   │   └── usePermissions.ts     # Permissions hook
│   │   └── services/
│   │       └── analyticsAPI.ts       # Analytics API client
│   └── test-analytics-tracking.js    # Test script
└── docs/
    ├── QUICK_START_ANALYTICS.md
    ├── ANALYTICS_SETUP_GUIDE.md
    ├── PRODUCTION_DEPLOYMENT_GUIDE.md
    ├── TRACKING_SCRIPT_BOTONBLUE.html
    ├── ACTIVITY_LOGGING_STATUS.md
    └── README_ANALYTICS.md (this file)
```

## 🐛 Common Issues

### 1. Analytics page hiển thị "No Permission"

**Nguyên nhân**: User data không có trong localStorage

**Giải pháp**:
1. Logout
2. Login lại
3. Refresh Analytics page

### 2. Tracking không hoạt động

**Nguyên nhân**: Tracking key sai hoặc CORS issue

**Giải pháp**:
1. Kiểm tra tracking key trong Properties page
2. Kiểm tra Console (F12) có lỗi không
3. Verify CORS settings trong backend

### 3. Charts không có data

**Nguyên nhân**: Chưa có events trong database

**Giải pháp**:
1. Chạy seed script để tạo sample data
2. Hoặc nhúng tracking script vào website và test
3. Refresh Analytics page

### 4. Timezone sai ("7 hours ago")

**Nguyên nhân**: Đã fix! UTC parsing issue

**Giải pháp**: Đã được fix trong code, chỉ cần refresh

## ✅ Checklist

### Development
- [x] Backend API endpoints
- [x] Frontend Analytics page
- [x] Permission system
- [x] Activity logging
- [x] Timezone fix
- [x] Sample data scripts
- [x] Documentation

### Production
- [ ] Property created with tracking_key
- [ ] Tracking script added to website
- [ ] Tested on localhost
- [ ] Deployed to production
- [ ] Verified tracking works
- [ ] Monitoring setup

## 📞 Support

Nếu có vấn đề, kiểm tra:
1. **Console logs** (F12)
2. **Network tab** (F12)
3. **Backend logs** (`docker-compose logs backend`)
4. **Documentation** files

## 🎉 Kết luận

Hệ thống Analytics đã hoàn chỉnh và sẵn sàng sử dụng!

**Next Steps**:
1. ✅ Test với sample data
2. ✅ Deploy tracking script lên production
3. ✅ Monitor real-time stats
4. ✅ Export reports định kỳ

Chúc bạn thành công! 🚀

