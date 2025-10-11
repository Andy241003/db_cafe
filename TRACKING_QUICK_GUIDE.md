# Tracking Script - Hướng dẫn nhanh

## 🎯 Chọn phiên bản phù hợp

### 1. **TRACKING_SCRIPT_COMPACT.html** ⭐ Khuyến nghị
- ✅ Ngắn gọn, dễ đọc (50 dòng)
- ✅ Track page views + clicks
- ✅ Có comments
- 📦 Size: ~1.5KB

### 2. **TRACKING_SCRIPT_MINIFIED.html** 
- ✅ Siêu ngắn (3 dòng)
- ✅ Tối ưu performance
- ❌ Khó đọc (minified)
- 📦 Size: ~800 bytes

### 3. **TRACKING_SCRIPT_BOTONBLUE.html**
- ✅ Đầy đủ tính năng
- ✅ Debug mode, share tracking
- ✅ Comments chi tiết
- 📦 Size: ~8KB

## 🚀 Cách sử dụng (3 bước)

### Bước 1: Copy script

**Khuyến nghị dùng Compact version:**

```html
<!-- Hotel Link 360 Analytics - Compact Version -->
<script>
(function() {
  const API = 'https://travel.link360.vn/api/v1/analytics/track';
  const KEY = 'boton_blue_tracking';
  
  function getDevice() {
    const ua = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad)/i.test(ua)) return 'tablet';
    if (/mobile|android|iphone/i.test(ua)) return 'mobile';
    return 'desktop';
  }
  
  function track(type, data = {}) {
    fetch(API, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        tracking_key: KEY,
        event_type: type,
        device: getDevice(),
        user_agent: navigator.userAgent,
        url: location.href,
        referrer: document.referrer || null,
        ...data
      }),
      keepalive: true
    }).catch(() => {});
  }
  
  // Track page view
  function init() {
    track('page_view');
  }
  
  // Track clicks
  document.addEventListener('click', e => {
    const el = e.target.closest('a, button');
    if (el) track('click', {
      element: el.tagName.toLowerCase(),
      element_text: (el.textContent || '').trim().substring(0, 100),
      element_href: el.href || ''
    });
  }, {passive: true});
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Expose API
  window.HotelLink360Analytics = {track, getDevice};
})();
</script>
```

### Bước 2: Paste vào website

Thêm vào **trước `</body>`** hoặc trong `<head>` của https://botonblue.trip360.vn/

```html
<!DOCTYPE html>
<html>
<head>
  <title>Boton Blue Hotel & Spa</title>
  <!-- ... other tags ... -->
</head>
<body>
  <!-- ... your content ... -->
  
  <!-- Paste tracking script here -->
  <script>
  (function() {
    const API = 'https://travel.link360.vn/api/v1/analytics/track';
    const KEY = 'boton_blue_tracking';
    // ... rest of script ...
  })();
  </script>
</body>
</html>
```

### Bước 3: Deploy và test

1. **Deploy** website
2. **Vào** https://botonblue.trip360.vn/
3. **Mở Console** (F12) - không có lỗi = OK
4. **Check Analytics** tại https://travel.link360.vn/analytics
5. **Refresh** (Ctrl + R) - sẽ thấy data tăng

## 🔧 Tùy chỉnh

### Thay đổi Tracking Key

Nếu tracking key khác `boton_blue_tracking`:

```javascript
const KEY = 'your_tracking_key_here'; // Thay đổi dòng này
```

### Tắt Click Tracking

Nếu chỉ muốn track page views:

```javascript
// Xóa hoặc comment phần này:
/*
document.addEventListener('click', e => {
  // ...
}, {passive: true});
*/
```

### Track Custom Events

```javascript
// Track booking button
document.getElementById('book-now').addEventListener('click', () => {
  window.HotelLink360Analytics.track('click', {
    element: 'booking-button',
    element_text: 'Book Now'
  });
});
```

## ✅ Checklist

- [ ] Copy script từ file
- [ ] Paste vào website (trước `</body>`)
- [ ] Thay tracking key nếu cần
- [ ] Deploy website
- [ ] Test: vào website và mở Console (F12)
- [ ] Verify: check Analytics page
- [ ] Done! 🎉

## 🐛 Troubleshooting

### Không thấy data trong Analytics?

1. **Mở Console** (F12) - có lỗi không?
2. **Check Network tab** - request đến `/analytics/track` thành công chưa?
3. **Verify tracking key** - đúng chưa?
4. **Refresh Analytics page** (Ctrl + R)

### CORS Error?

Backend đã config CORS cho `*.trip360.vn`. Nếu dùng domain khác, cần update backend config.

### Script không chạy?

- Kiểm tra syntax error
- Đảm bảo script nằm trong `<script>` tag
- Kiểm tra browser console có lỗi không

## 📊 Kết quả mong đợi

Sau khi setup, Analytics page sẽ hiển thị:
- ✅ Page Views tăng khi có người vào website
- ✅ Unique Visitors tăng
- ✅ Charts có data
- ✅ Real-time stats hoạt động

Chúc bạn thành công! 🚀

