# Analytics Optimization Guide

## Vấn đề đã giải quyết

### 1. **Rate Limiting - Chống spam tracking**
- ✅ Page view: Tối đa 1 lần / 30 giây
- ✅ Click: Tối đa 5 lần / phút (1 click / 12 giây)
- ✅ Share: Tối đa 1 lần / 60 giây
- ✅ Session tracking: Group events theo session 30 phút

### 2. **Database Optimization - Tránh phình database**
- ✅ Daily aggregation: Tổng hợp dữ liệu theo ngày
- ✅ Auto-delete: Xóa events cũ hơn 90 ngày (giữ summaries)
- ✅ Scheduled task: Chạy tự động mỗi ngày lúc 2h sáng

## Cách sử dụng

### **Tracking Script mới (v2.0)**

#### Cách 1: Tự động (khuyên dùng)
```html
<!-- Thêm vào cuối thẻ <body> -->
<script>
  window.hotelLinkConfig = {
    trackingKey: 'botonblue-tracking-key',
    apiUrl: 'https://travel.link360.vn/api/v1'
  };
</script>
<script src="https://travel.link360.vn/static/tracking-v2.js"></script>
```

#### Cách 2: Track feature clicks với feature_id
```html
<!-- Thêm data-feature-id vào các button/link -->
<button data-feature-id="123" data-category-id="5">
  WiFi Information
</button>

<a href="#" data-feature-id="124" data-track>
  Room Service Menu
</a>
```

### **Rate Limiting**

#### LocalStorage Keys
Script sử dụng localStorage để lưu rate limit:
- `hotellink_session_id`: Session ID (30 phút)
- `hotellink_last_pageView`: Timestamp của page view cuối
- `hotellink_last_click`: Timestamp của click cuối  
- `hotellink_last_share`: Timestamp của share cuối

#### Cách hoạt động
```javascript
// User visit trang lần 1: ✅ Track page view
// User reload sau 10 giây: ❌ Bị chặn (chưa đủ 30s)
// User reload sau 35 giây: ✅ Track page view mới

// User click button 1: ✅ Track click
// User click button 2 sau 5s: ✅ Track click
// User click button 3 sau 10s: ✅ Track click  
// User click button 4 sau 15s: ✅ Track click
// User click button 5 sau 20s: ✅ Track click
// User click button 6 sau 25s: ❌ Bị chặn (đã 5 clicks trong 1 phút)
// User click button 7 sau 70s: ✅ Track click (đã qua 1 phút từ click đầu)
```

### **Database Aggregation**

#### Cách 1: Tự động (Cron Job)
```bash
# Setup cron job trong docker-compose.yml
services:
  analytics-cron:
    build:
      context: ./backend
      dockerfile: Dockerfile.cron
    environment:
      - DATABASE_URL=mysql://...
    depends_on:
      - db
```

#### Cách 2: Thủ công (API)
```bash
# Gọi API để aggregate thủ công (cần quyền OWNER/ADMIN)
POST https://travel.link360.vn/api/v1/analytics/aggregate
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "days_back": 30  // Aggregate 30 ngày gần đây
}
```

#### Cách 3: Python Script
```python
# Chạy trực tiếp trong container
docker-compose exec backend python -m app.tasks.analytics_aggregation

# Hoặc backfill cho khoảng thời gian cụ thể
docker-compose exec backend python
>>> from datetime import date
>>> from app.tasks.analytics_aggregation import backfill_summaries
>>> backfill_summaries(date(2025, 10, 1), date(2025, 10, 17))
```

## Lợi ích

### **Về Performance**
- ✅ Giảm 80-90% số lượng events được lưu
- ✅ Query nhanh hơn (dùng aggregated data thay vì raw events)
- ✅ Database nhỏ hơn (tự động xóa events cũ)

### **Về Accuracy**
- ✅ Chặn spam clicks (reload liên tục)
- ✅ Chặn bot traffic (rate limiting)
- ✅ Session tracking chính xác hơn

### **Về Storage**

**Trước:**
- 1,000 page views/ngày × 365 ngày = **365,000 records**
- 5,000 clicks/ngày × 365 ngày = **1,825,000 records**
- **Tổng: ~2.2 triệu records/năm**

**Sau (với aggregation):**
- 365 daily summaries × 1 tenant = **365 records**
- Recent events (90 ngày): ~90,000 records
- **Tổng: ~90,365 records/năm (giảm 96%!)**

## Monitoring

### Kiểm tra aggregation có chạy không
```bash
# Xem logs của cron job
docker-compose logs analytics-cron --tail=50

# Check xem có summaries không
docker-compose exec backend python
>>> from app.models import AnalyticsSummary
>>> from app.core.db import engine
>>> from sqlmodel import Session, select
>>> with Session(engine) as session:
...     count = session.exec(select(func.count(AnalyticsSummary.id))).one()
...     print(f"Total summaries: {count}")
```

### Kiểm tra dung lượng database
```sql
-- Kiểm tra số lượng records
SELECT 
  'events' as table_name, 
  COUNT(*) as row_count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM events
UNION ALL
SELECT 
  'analytics_summary' as table_name,
  COUNT(*) as row_count,
  MIN(date) as oldest,
  MAX(date) as newest  
FROM analytics_summary;

-- Kiểm tra dung lượng
SELECT 
  table_name,
  ROUND((data_length + index_length) / 1024 / 1024, 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = 'hotellink360_db'
  AND table_name IN ('events', 'analytics_summary')
ORDER BY size_mb DESC;
```

## Troubleshooting

### Q: Rate limiting quá chặt, muốn nới lỏng?
**A:** Sửa trong `tracking-v2.js`:
```javascript
const RATE_LIMITS = {
    pageView: 20000,  // Giảm từ 30s xuống 20s
    click: 10000,     // Giảm từ 12s xuống 10s  
    share: 30000      // Giảm từ 60s xuống 30s
};

const MAX_CLICKS_PER_MINUTE = 10;  // Tăng từ 5 lên 10
```

### Q: Muốn giữ events lâu hơn 90 ngày?
**A:** Sửa trong `analytics_aggregation.py`:
```python
deleted_count = delete_old_events(session, days_to_keep=180)  # 180 ngày
```

### Q: Cron job không chạy?
**A:** Kiểm tra:
1. Container có đang chạy: `docker ps | grep cron`
2. Cron service có start: `docker-compose logs analytics-cron`
3. Timezone đúng không: `docker-compose exec analytics-cron date`

### Q: Muốn test rate limiting?
**A:** Mở DevTools Console:
```javascript
// Clear localStorage để reset rate limits
localStorage.removeItem('hotellink_last_pageView');
localStorage.removeItem('hotellink_session_id');

// Test clicks
for (let i = 0; i < 10; i++) {
  document.querySelector('button').click();
}
// Chỉ 5 clicks đầu được track, 5 clicks sau bị chặn
```

## Migration từ tracking.js cũ sang tracking-v2.js

### Bước 1: Update HTML
```html
<!-- CŨ -->
<script src="https://travel.link360.vn/static/tracking.js"></script>

<!-- MỚI -->
<script src="https://travel.link360.vn/static/tracking-v2.js"></script>
```

### Bước 2: Thêm feature_id vào buttons (optional)
```html
<!-- Lấy feature_id từ database -->
<?php foreach ($features as $feature): ?>
  <button 
    data-feature-id="<?= $feature->id ?>"
    data-category-id="<?= $feature->category_id ?>"
  >
    <?= $feature->title ?>
  </button>
<?php endforeach; ?>
```

### Bước 3: Deploy tracking-v2.js
```bash
# Copy file vào static folder
cp backend/app/static/tracking-v2.js /path/to/static/

# Restart backend nếu cần
docker-compose restart backend
```

### Bước 4: Verify
1. Mở website trong Incognito
2. Mở DevTools → Network tab
3. Reload trang 3 lần trong 30 giây
4. Chỉ thấy 1 request `/analytics/track` (2 request sau bị chặn)

## Best Practices

1. **Luôn dùng tracking-v2.js** (có rate limiting)
2. **Setup cron job** cho aggregation tự động
3. **Monitor database size** hàng tháng
4. **Backup trước khi delete** events cũ
5. **Test rate limiting** trước khi deploy production

## Support

Nếu có vấn đề, check:
1. Backend logs: `docker-compose logs backend`
2. Cron logs: `docker-compose logs analytics-cron`  
3. Browser console: F12 → Console
4. Database: Check events table size

---
**Version:** 2.0  
**Last Updated:** 2025-10-18  
**Author:** HotelLink360 Team
