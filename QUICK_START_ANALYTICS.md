# Quick Start - Analytics Page

## 🚀 Cách nhanh nhất để chạy Analytics

### Option 1: Dùng Python Script (Khuyến nghị - Nhanh nhất!)

```bash
# Trong terminal, chạy:
cd backend-htlink
docker-compose exec backend python seed_analytics_data.py
```

Hoặc với custom số lượng:
```bash
# Tạo 1000 events trong 60 ngày
docker-compose exec backend python seed_analytics_data.py --events 1000 --days 60
```

**Kết quả**: Script sẽ tạo 500 events (mặc định) trong 30 ngày qua với:
- 70% page views
- 25% clicks  
- 5% shares
- 50% desktop, 40% mobile, 10% tablet

### Option 2: Dùng JavaScript trong Browser Console

1. **Mở browser console** (F12)
2. **Copy toàn bộ nội dung** file `backend-htlink/test-analytics-tracking.js`
3. **Paste vào console** và Enter
4. **Chờ 10-30 giây** để script chạy xong

### Option 3: Tạo Property và Tracking Key thủ công

Nếu chưa có property:

```bash
# Tạo property qua API
curl -X POST "http://localhost:8000/api/v1/properties/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Code: boton_blue" \
  -H "Content-Type: application/json" \
  -d '{
    "property_name": "Boton Blue Hotel & Spa",
    "tracking_key": "boton_blue_tracking"
  }'
```

Hoặc qua UI:
1. Vào **Properties** page
2. Click **Add Property**
3. Điền thông tin và Save

## ✅ Kiểm tra kết quả

1. **Logout và Login lại** (để user data được lưu vào localStorage)
2. **Vào Analytics page**
3. **Refresh page** (Ctrl + R)
4. Bạn sẽ thấy:
   - ✅ Total Page Views
   - ✅ Unique Visitors
   - ✅ Charts có data
   - ✅ Real-time stats

## 🐛 Troubleshooting

### "No properties found"
```bash
# Tạo property bằng SQL
docker-compose exec backend psql -U postgres -d hotel_saas -c "
INSERT INTO properties (property_name, tracking_key, tenant_id, created_at)
VALUES ('Boton Blue Hotel & Spa', 'boton_blue_tracking', 1, CURRENT_TIMESTAMP);
"
```

### "403 Forbidden" khi vào Analytics
1. **Logout** từ sidebar
2. **Login lại**
3. User data sẽ được lưu vào localStorage
4. Refresh Analytics page

### Không thấy data trong charts
1. Chạy lại seed script:
```bash
docker-compose exec backend python seed_analytics_data.py
```

2. Kiểm tra database:
```bash
docker-compose exec backend psql -U postgres -d hotel_saas -c "SELECT COUNT(*) FROM events;"
```

3. Refresh Analytics page (Ctrl + R)

## 📊 Các tính năng có thể test

1. **Date Range Picker** - Chọn khoảng thời gian khác nhau
2. **Export CSV** - Click Export (chỉ OWNER/ADMIN)
3. **Real-time Stats** - Xem stats cập nhật
4. **Charts** - Xem Page Views và Traffic Sources

## 🎯 Next Steps

Sau khi có data test, bạn có thể:
1. Tích hợp tracking script vào website thật
2. Monitor real-time traffic
3. Export reports để phân tích
4. Tạo thêm properties cho các khách sạn khác

Chúc bạn thành công! 🎉

