# 🔧 Analytics System Fix - Summary

## ❌ Vấn đề trước khi fix:

1. **Tracking events lưu SAI chỗ**: Code đang lưu analytics events vào bảng `activity_logs` với `activity_type='ANALYTICS_EVENT'`
2. **Bảng `activity_logs` không phù hợp**: Bảng này dùng cho admin actions (tạo category, sửa feature, v.v.), KHÔNG phải cho analytics tracking
3. **Database phình to không cần thiết**: Mỗi page view lại tạo 2 records:
   - 1 record trong `events` ✅
   - 1 record trong `activity_logs` ❌ (thừa)
4. **Analytics dashboard hiển thị mock data**: Frontend không kết nối đúng với backend API

## ✅ Đã fix:

### 1. Backend API (`analytics.py`)

**Trước:**
```python
# Create event record
event = Event(...)  # Lưu vào events table ✅
session.add(event)
session.commit()

# Log activity in activity_logs ❌ THỪA
activity_log = ActivityLog(
    activity_type=ActivityType.ANALYTICS_EVENT,
    details={...}
)
session.add(activity_log)
session.commit()
```

**Sau:**
```python
# Create event record in events table ONLY
event = Event(...)  # Chỉ lưu vào events table ✅
session.add(event)
session.commit()

# NO MORE activity_logs for analytics! 🎉
```

### 2. Database Structure

**Bảng `events` (Đúng cho analytics):**
```sql
events:
  - id (bigint, auto_increment)
  - tenant_id (bigint)
  - property_id (bigint) 
  - event_type (enum: page_view, click, share)
  - device (enum: desktop, tablet, mobile)
  - user_agent (varchar 255)
  - ip_hash (char 64) -- Hashed cho privacy
  - created_at (datetime)
```

**Bảng `activity_logs` (Dùng cho admin actions):**
```sql
activity_logs:
  - id (int)
  - tenant_id (int)
  - user_id (int) -- Admin user
  - activity_type (VARCHAR) -- create_category, update_feature, etc.
  - details (JSON)
  - created_at (timestamp)
```

### 3. Cách tracking hoạt động bây giờ:

```
User vào botonblue.trip360.vn
    ↓
Tracking script gửi:
POST https://travel.link360.vn/api/v1/analytics/track
{
  "tracking_key": "botonblue-tracking-key",
  "event_type": "page_view",
  "device": "desktop",
  "user_agent": "Mozilla/5.0...",
  "url": "https://botonblue.trip360.vn/rooms",
  "referrer": "https://google.com"
}
    ↓
Backend lưu vào bảng `events` (KHÔNG lưu vào activity_logs nữa)
    ↓
Background task cập nhật `analytics_summary`
    ↓
Dashboard hiển thị real data
```

## 📊 Kiểm tra kết quả:

### Xem events đã được track:

```bash
cd backend-htlink

# Xem tất cả events
docker-compose exec db mysql -u root -pVeryStrongRootPass2024! hotellink360_db -e "SELECT id, property_id, event_type, device, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as time FROM events ORDER BY created_at DESC LIMIT 10;"

# Đếm events theo property
docker-compose exec db mysql -u root -pVeryStrongRootPass2024! hotellink360_db -e "SELECT p.property_name, COUNT(e.id) as total_events, COUNT(DISTINCT e.ip_hash) as unique_visitors FROM events e JOIN properties p ON e.property_id = p.id GROUP BY p.id, p.property_name;"

# Đếm events theo device
docker-compose exec db mysql -u root -pVeryStrongRootPass2024! hotellink360_db -e "SELECT device, COUNT(*) as count FROM events GROUP BY device;"

# Xem activity_logs (KHÔNG nên có ANALYTICS_EVENT nữa)
docker-compose exec db mysql -u root -pVeryStrongRootPass2024! hotellink360_db -e "SELECT activity_type, COUNT(*) as count FROM activity_logs GROUP BY activity_type;"
```

### Test tracking:

1. **Mở browser console** trên trang https://botonblue.trip360.vn/
2. **Chạy lệnh test:**
```javascript
fetch('https://travel.link360.vn/api/v1/analytics/track', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    tracking_key: 'botonblue-tracking-key',
    event_type: 'page_view',
    device: 'desktop',
    url: window.location.href,
    user_agent: navigator.userAgent
  })
})
.then(res => res.json())
.then(data => console.log('✅ Tracked:', data))
.catch(err => console.error('❌ Error:', err));
```

3. **Kiểm tra database:**
```bash
docker-compose exec db mysql -u root -pVeryStrongRootPass2024! hotellink360_db -e "SELECT * FROM events ORDER BY created_at DESC LIMIT 1\G"
```

Phải thấy event mới nhất với đúng thông tin!

## 🎯 Kết quả mong đợi:

✅ Mỗi page view chỉ tạo **1 record** trong bảng `events`  
✅ Bảng `activity_logs` chỉ có admin actions (create_category, update_feature, etc.)  
✅ Database nhẹ hơn, performance tốt hơn  
✅ Analytics dashboard hiển thị data thật từ bảng `events`  
✅ Real-time stats hoạt động  

## 🚀 Next Steps:

1. **Test tracking script** trên botonblue.trip360.vn
2. **Verify events** được lưu vào bảng `events`
3. **Kiểm tra dashboard** có hiển thị data thật không
4. **Monitor performance** sau vài ngày

## 📝 Note:

- Bảng `activity_logs` vẫn giữ lại để track admin actions
- Bảng `events` chỉ dùng cho website analytics
- Bảng `analytics_summary` được tự động cập nhật hàng ngày
- IP addresses được hash (SHA-256) để bảo vệ privacy

Happy tracking! 🎉
