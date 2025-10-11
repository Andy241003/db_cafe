# Analytics Setup Guide - Hướng dẫn chạy Analytics Page

## 📊 Tổng quan

Analytics page hiển thị thống kê về:
- **Page Views** - Lượt xem trang
- **Unique Visitors** - Số lượng khách truy cập duy nhất
- **Traffic Sources** - Nguồn traffic (Desktop, Mobile, Tablet)
- **Real-time Stats** - Thống kê thời gian thực

## 🔑 Yêu cầu

Analytics hoạt động dựa trên **tracking events** từ các website khách sạn. Mỗi property cần có:
1. **Tracking Key** - Mã định danh duy nhất
2. **Tracking Script** - Script nhúng vào website khách sạn
3. **Events** - Dữ liệu tracking được gửi về

## 🚀 Cách setup

### Bước 1: Tạo Property với Tracking Key

#### Option 1: Qua UI (Properties Page)

1. Vào **Properties** page
2. Click **"Add Property"**
3. Điền thông tin:
   - Property Name: `Boton Blue Hotel & Spa`
   - Address: `123 Beach Road, Da Nang`
   - Tracking Key: `boton_blue_tracking` (hoặc để trống, hệ thống tự tạo)
4. Click **Save**

#### Option 2: Qua API

```bash
curl -X POST "http://localhost:8000/api/v1/properties/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Tenant-Code: boton_blue" \
  -H "Content-Type: application/json" \
  -d '{
    "property_name": "Boton Blue Hotel & Spa",
    "address": "123 Beach Road, Da Nang",
    "tracking_key": "boton_blue_tracking"
  }'
```

### Bước 2: Lấy Tracking Key

#### Qua UI:
1. Vào **Properties** page
2. Xem danh sách properties
3. Copy **Tracking Key** của property

#### Qua API:
```bash
curl -X GET "http://localhost:8000/api/v1/properties/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Tenant-Code: boton_blue"
```

Response:
```json
[
  {
    "id": 1,
    "property_name": "Boton Blue Hotel & Spa",
    "tracking_key": "boton_blue_tracking",
    "tenant_id": 1
  }
]
```

### Bước 3: Nhúng Tracking Script vào Website Khách Sạn

Thêm script này vào `<head>` của website khách sạn:

```html
<!-- Hotel Link 360 Analytics Tracking -->
<script>
(function() {
  const TRACKING_KEY = 'boton_blue_tracking'; // Thay bằng tracking key của bạn
  const API_URL = 'http://localhost:8000/api/v1/analytics/track';
  
  // Detect device type
  function getDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }
  
  // Track page view
  function trackPageView() {
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tracking_key: TRACKING_KEY,
        event_type: 'page_view',
        device: getDeviceType(),
        user_agent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer || null
      })
    })
    .then(response => response.json())
    .then(data => console.log('Analytics tracked:', data))
    .catch(error => console.error('Analytics error:', error));
  }
  
  // Track on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
  } else {
    trackPageView();
  }
  
  // Track clicks on important elements
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a, button');
    if (target) {
      fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracking_key: TRACKING_KEY,
          event_type: 'click',
          device: getDeviceType(),
          user_agent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(error => console.error('Click tracking error:', error));
    }
  });
})();
</script>
```

### Bước 4: Test Tracking (Tạo Sample Data)

Nếu chưa có website thật, bạn có thể tạo sample data bằng cách gọi API trực tiếp:

#### Test Script (chạy trong browser console hoặc Postman):

```javascript
// Test tracking - chạy trong browser console
const TRACKING_KEY = 'boton_blue_tracking';
const API_URL = 'http://localhost:8000/api/v1/analytics/track';

// Tạo 100 page views giả lập
async function generateSampleData() {
  const devices = ['desktop', 'mobile', 'tablet'];
  const eventTypes = ['page_view', 'click', 'share'];
  
  for (let i = 0; i < 100; i++) {
    const device = devices[Math.floor(Math.random() * devices.length)];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tracking_key: TRACKING_KEY,
        event_type: eventType,
        device: device,
        user_agent: navigator.userAgent,
        url: `https://botonblue.trip360.vn/page-${i}`,
        referrer: i > 0 ? `https://botonblue.trip360.vn/page-${i-1}` : 'https://google.com'
      })
    });
    
    // Delay để tránh spam
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ Generated 100 sample events!');
}

// Chạy
generateSampleData();
```

#### Hoặc dùng curl:

```bash
# Tạo 1 page view event
curl -X POST "http://localhost:8000/api/v1/analytics/track" \
  -H "Content-Type: application/json" \
  -d '{
    "tracking_key": "boton_blue_tracking",
    "event_type": "page_view",
    "device": "desktop",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "url": "https://botonblue.trip360.vn/",
    "referrer": "https://google.com"
  }'
```

### Bước 5: Xem Analytics Dashboard

1. **Login** vào admin panel
2. Vào **Analytics** page
3. Bạn sẽ thấy:
   - ✅ Total Page Views
   - ✅ Unique Visitors
   - ✅ Traffic by Device (Desktop/Mobile/Tablet)
   - ✅ Page Views Chart (theo ngày)
   - ✅ Real-time Stats

## 🎯 Các tính năng của Analytics Page

### 1. **Date Range Picker**
- This Month / Last Month
- This Quarter / Last Quarter
- This Year / Last Year
- Custom Range (chọn ngày tùy ý)

### 2. **Export Data**
- Export CSV (chỉ OWNER và ADMIN)
- Bao gồm tất cả metrics trong khoảng thời gian đã chọn

### 3. **Real-time Stats**
- Active users trong 15 phút
- Page views trong 5 phút
- Events trong 1 phút

### 4. **Charts**
- **Page Views Chart** - Line chart theo ngày
- **Traffic Sources** - Pie chart theo device type

## 🔧 Troubleshooting

### Không có data hiển thị?

1. **Kiểm tra Property có tracking_key chưa**:
```bash
curl -X GET "http://localhost:8000/api/v1/properties/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Code: boton_blue"
```

2. **Kiểm tra Events table có data chưa**:
```sql
SELECT COUNT(*) FROM events WHERE tenant_id = 1;
```

3. **Tạo sample data** bằng script ở Bước 4

### Analytics API trả về 403?

- ✅ Đã fix! Bây giờ chấp nhận tất cả authenticated users
- Đảm bảo đã login và có token trong localStorage

### Thời gian hiển thị sai?

- ✅ Đã fix timezone issue!
- Refresh browser để thấy thay đổi

## 📝 Database Schema

### Events Table
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  property_id INTEGER NOT NULL,
  event_type VARCHAR(50), -- 'page_view', 'click', 'share'
  device VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
  user_agent VARCHAR(255),
  ip_hash VARCHAR(64), -- Hashed IP for privacy
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Analytics Summary Table
```sql
CREATE TABLE analytics_summary (
  id INTEGER PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  date DATE NOT NULL,
  period_type VARCHAR(20), -- 'daily', 'weekly', 'monthly'
  total_page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0
);
```

## 🎨 Customization

### Thay đổi API URL cho production:

Trong tracking script, thay:
```javascript
const API_URL = 'https://api.trip360.vn/api/v1/analytics/track';
```

### Thêm custom events:

```javascript
// Track button click
document.getElementById('book-now').addEventListener('click', function() {
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tracking_key: TRACKING_KEY,
      event_type: 'click',
      device: getDeviceType(),
      url: window.location.href
    })
  });
});
```

## ✅ Checklist

- [ ] Tạo Property với tracking_key
- [ ] Copy tracking_key
- [ ] Nhúng tracking script vào website (hoặc tạo sample data)
- [ ] Kiểm tra Events table có data
- [ ] Login vào admin panel
- [ ] Vào Analytics page
- [ ] Xem charts và stats
- [ ] Test Export CSV (nếu là OWNER/ADMIN)

## 🚀 Next Steps

1. **Tích hợp vào website thật** của khách sạn
2. **Monitor real-time stats** để theo dõi traffic
3. **Export reports** định kỳ để phân tích
4. **Tạo alerts** khi có traffic bất thường (future feature)

Chúc bạn thành công! 🎉

