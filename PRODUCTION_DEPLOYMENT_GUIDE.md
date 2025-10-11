# Production Deployment Guide - Hotel Link 360

## 🌐 Thông tin hệ thống

- **Website khách sạn**: https://botonblue.trip360.vn/
- **Admin Panel**: https://travel.link360.vn/
- **Backend API**: https://travel.link360.vn/api/v1/

## 📊 Setup Analytics Tracking

### Bước 1: Kiểm tra Property và Tracking Key

1. **Login vào Admin Panel**: https://travel.link360.vn/
2. **Vào Properties page**
3. **Kiểm tra hoặc tạo property** cho Boton Blue Hotel:
   - Property Name: `Boton Blue Hotel & Spa`
   - Tracking Key: `boton_blue_tracking`
   - Tenant: `boton_blue`

#### Nếu chưa có property, tạo mới:

**Option 1: Qua UI**
- Click "Add Property"
- Điền thông tin:
  - Property Name: `Boton Blue Hotel & Spa`
  - Address: `123 Beach Road, Da Nang` (hoặc địa chỉ thật)
  - Tracking Key: `boton_blue_tracking`
- Click Save

**Option 2: Qua API**
```bash
curl -X POST "https://travel.link360.vn/api/v1/properties/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Tenant-Code: boton_blue" \
  -H "Content-Type: application/json" \
  -d '{
    "property_name": "Boton Blue Hotel & Spa",
    "tracking_key": "boton_blue_tracking",
    "address": "123 Beach Road, Da Nang"
  }'
```

### Bước 2: Nhúng Tracking Script vào Website

#### File cần chỉnh sửa:
Tìm file HTML chính của website **botonblue.trip360.vn** (thường là `index.html` hoặc layout template)

#### Thêm script vào `<head>` hoặc trước `</body>`:

```html
<!-- Hotel Link 360 Analytics Tracking -->
<script>
(function() {
  'use strict';
  
  const CONFIG = {
    TRACKING_KEY: 'boton_blue_tracking',
    API_URL: 'https://travel.link360.vn/api/v1/analytics/track',
    DEBUG: false, // Set true để debug
    TRACK_CLICKS: true,
    TRACK_SHARES: true,
    CLICK_SELECTORS: 'a, button, [role="button"]',
    SHARE_SELECTORS: '.share-button, .social-share, [data-share]'
  };
  
  function getDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(navigator.userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }
  
  async function trackEvent(eventType, additionalData = {}) {
    const eventData = {
      tracking_key: CONFIG.TRACKING_KEY,
      event_type: eventType,
      device: getDeviceType(),
      user_agent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer || null,
      ...additionalData
    };
    
    try {
      await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
        keepalive: true
      });
    } catch (error) {
      if (CONFIG.DEBUG) console.error('Tracking error:', error);
    }
  }
  
  function trackPageView() {
    trackEvent('page_view');
  }
  
  function setupClickTracking() {
    if (!CONFIG.TRACK_CLICKS) return;
    document.addEventListener('click', function(e) {
      const target = e.target.closest(CONFIG.CLICK_SELECTORS);
      if (target) {
        trackEvent('click', {
          element: target.tagName.toLowerCase(),
          element_text: target.textContent?.trim().substring(0, 100) || '',
          element_href: target.href || ''
        });
      }
    }, { passive: true });
  }
  
  function setupShareTracking() {
    if (!CONFIG.TRACK_SHARES) return;
    document.addEventListener('click', function(e) {
      const target = e.target.closest(CONFIG.SHARE_SELECTORS);
      if (target) {
        const platform = target.dataset.share || 
                        target.className.match(/(facebook|twitter|linkedin|instagram|zalo)/i)?.[0] || 
                        'unknown';
        trackEvent('share', { platform: platform, url: window.location.href });
      }
    }, { passive: true });
  }
  
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', trackPageView);
    } else {
      trackPageView();
    }
    setupClickTracking();
    setupShareTracking();
  }
  
  init();
  
  window.HotelLink360Analytics = {
    track: trackEvent,
    trackPageView: trackPageView,
    getDeviceType: getDeviceType
  };
})();
</script>
```

**Hoặc sử dụng file đã tạo sẵn**: Copy nội dung từ `TRACKING_SCRIPT_BOTONBLUE.html`

### Bước 3: Test Tracking

#### Test trên localhost trước:

1. **Mở website** botonblue.trip360.vn
2. **Mở Console** (F12)
3. **Kiểm tra logs** (nếu DEBUG = true):
```javascript
[Hotel Link 360 Analytics] Initializing...
[Hotel Link 360 Analytics] Tracking event: page_view
[Hotel Link 360 Analytics] Tracking success: {success: true, event_id: 123}
```

4. **Click vào links/buttons** để test click tracking
5. **Kiểm tra Network tab** để xem requests đến API

#### Verify trong Admin Panel:

1. **Login vào** https://travel.link360.vn/
2. **Vào Analytics page**
3. **Refresh page** (Ctrl + R)
4. **Kiểm tra**:
   - Total Page Views tăng lên
   - Unique Visitors tăng lên
   - Real-time Stats hiển thị activity
   - Charts có data mới

### Bước 4: Deploy lên Production

#### Nếu website dùng Git:

```bash
# Commit changes
git add index.html  # hoặc file template của bạn
git commit -m "Add Hotel Link 360 Analytics tracking"
git push origin main

# Deploy (tùy theo hệ thống của bạn)
# Ví dụ với Vercel/Netlify: tự động deploy khi push
# Ví dụ với server: ssh và pull code
```

#### Nếu website dùng CMS (WordPress, etc):

1. Vào **Theme Editor** hoặc **Custom HTML**
2. Thêm script vào **Header** hoặc **Footer**
3. Save và publish

#### Nếu website static trên server:

```bash
# SSH vào server
ssh user@botonblue.trip360.vn

# Edit file HTML
nano /var/www/html/index.html

# Thêm tracking script
# Save (Ctrl + X, Y, Enter)

# Restart web server (nếu cần)
sudo systemctl restart nginx
# hoặc
sudo systemctl restart apache2
```

## 🔧 Configuration Options

### Debug Mode

Để debug trong development:
```javascript
const CONFIG = {
  DEBUG: true,  // Bật debug logs
  // ...
};
```

### Custom Tracking

Track custom events:
```javascript
// Track booking button click
document.getElementById('book-now').addEventListener('click', function() {
  window.HotelLink360Analytics.track('click', {
    element: 'booking-button',
    element_text: 'Book Now',
    room_type: 'Deluxe Suite'
  });
});

// Track form submission
document.getElementById('contact-form').addEventListener('submit', function() {
  window.HotelLink360Analytics.track('click', {
    element: 'contact-form',
    element_text: 'Contact Form Submitted'
  });
});
```

### Disable Click/Share Tracking

Nếu chỉ muốn track page views:
```javascript
const CONFIG = {
  TRACK_CLICKS: false,  // Tắt click tracking
  TRACK_SHARES: false,  // Tắt share tracking
  // ...
};
```

## 🔐 Security & Privacy

### CORS Configuration

Backend đã được config CORS cho:
- `https://botonblue.trip360.vn`
- `https://travel.link360.vn`
- `https://*.trip360.vn`

Nếu cần thêm domain khác, update trong `backend/app/core/config.py`:
```python
BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
    "https://botonblue.trip360.vn",
    "https://travel.link360.vn",
    "https://*.trip360.vn",
    "https://your-new-domain.com"  # Thêm domain mới
]
```

### Privacy Compliance

- ✅ IP addresses được **hash** (SHA-256) trước khi lưu
- ✅ Không lưu thông tin cá nhân
- ✅ Chỉ lưu metadata: device type, user agent, URL, referrer
- ✅ Tuân thủ GDPR/CCPA

## 📊 Monitoring & Analytics

### Real-time Monitoring

1. **Vào Analytics page**: https://travel.link360.vn/analytics
2. **Xem Real-time Stats**:
   - Active users trong 15 phút
   - Page views trong 5 phút
   - Events trong 1 phút

### Reports

1. **Date Range Picker**: Chọn khoảng thời gian
2. **Export CSV**: Click Export (OWNER/ADMIN only)
3. **Charts**:
   - Page Views by Day
   - Traffic Sources (Desktop/Mobile/Tablet)

## 🐛 Troubleshooting

### Tracking không hoạt động?

1. **Kiểm tra Console** (F12):
   - Có lỗi JavaScript không?
   - Có lỗi CORS không?

2. **Kiểm tra Network tab**:
   - Request đến `/api/v1/analytics/track` có thành công không?
   - Status code là gì? (200 = OK, 403 = Forbidden, 404 = Not Found)

3. **Kiểm tra Tracking Key**:
   - Vào Properties page
   - Verify tracking key đúng chưa

4. **Kiểm tra Backend**:
   ```bash
   # Test API endpoint
   curl -X POST "https://travel.link360.vn/api/v1/analytics/track" \
     -H "Content-Type: application/json" \
     -d '{
       "tracking_key": "boton_blue_tracking",
       "event_type": "page_view",
       "device": "desktop",
       "user_agent": "Test",
       "url": "https://botonblue.trip360.vn/test"
     }'
   ```

### Analytics page không hiển thị data?

1. **Refresh page** (Ctrl + R)
2. **Kiểm tra date range** - Chọn "This Month" hoặc "Last 30 days"
3. **Kiểm tra database**:
   ```sql
   SELECT COUNT(*) FROM events WHERE tenant_id = 1;
   ```

## ✅ Checklist Deployment

- [ ] Property đã được tạo với tracking_key
- [ ] Tracking script đã được thêm vào website
- [ ] Test tracking trên localhost
- [ ] Verify data trong Analytics page
- [ ] Deploy lên production
- [ ] Test tracking trên production
- [ ] Monitor real-time stats
- [ ] Setup alerts (optional)

## 🎯 Next Steps

1. **Monitor traffic** hàng ngày
2. **Export reports** định kỳ
3. **Analyze trends** để optimize marketing
4. **A/B testing** với tracking data
5. **Setup goals** và conversion tracking (future feature)

Chúc bạn thành công! 🚀

