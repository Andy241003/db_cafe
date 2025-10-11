# Tracking Script cho Next.js / React

## ⚠️ Lưu ý quan trọng

**KHÔNG** paste JavaScript trực tiếp vào file `.tsx` hoặc `.jsx`!

Phải dùng 1 trong 3 cách sau:

---

## Cách 1: Dùng `<Script>` component của Next.js ⭐ Khuyến nghị

### File: `pages/_app.tsx` hoặc `pages/index.tsx`

```tsx
import Script from 'next/script'

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* Your app content */}
      <Component {...pageProps} />
      
      {/* Hotel Link 360 Analytics */}
      <Script id="hotel-analytics" strategy="afterInteractive">
        {`
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
            
            function init() {
              track('page_view');
            }
            
            document.addEventListener('click', e => {
              const el = e.target.closest('a, button');
              if (el) track('click', {
                element: el.tagName.toLowerCase(),
                element_text: (el.textContent || '').trim().substring(0, 100),
                element_href: el.href || ''
              });
            }, {passive: true});
            
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', init);
            } else {
              init();
            }
            
            window.HotelLink360Analytics = {track, getDevice};
          })();
        `}
      </Script>
    </>
  )
}
```

---

## Cách 2: Dùng `useEffect` hook

### File: `pages/_app.tsx` hoặc `components/Analytics.tsx`

```tsx
import { useEffect } from 'react'

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Hotel Link 360 Analytics
    const API = 'https://travel.link360.vn/api/v1/analytics/track';
    const KEY = 'boton_blue_tracking';
    
    function getDevice() {
      const ua = navigator.userAgent.toLowerCase();
      if (/(tablet|ipad)/i.test(ua)) return 'tablet';
      if (/mobile|android|iphone/i.test(ua)) return 'mobile';
      return 'desktop';
    }
    
    function track(type: string, data: any = {}) {
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
    track('page_view');
    
    // Track clicks
    const handleClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('a, button');
      if (el) {
        track('click', {
          element: el.tagName.toLowerCase(),
          element_text: (el.textContent || '').trim().substring(0, 100),
          element_href: (el as HTMLAnchorElement).href || ''
        });
      }
    };
    
    document.addEventListener('click', handleClick, {passive: true});
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);
  
  return <Component {...pageProps} />
}
```

---

## Cách 3: Tạo file riêng và import

### Bước 1: Tạo file `public/analytics.js`

```javascript
// public/analytics.js
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
  
  function init() {
    track('page_view');
  }
  
  document.addEventListener('click', e => {
    const el = e.target.closest('a, button');
    if (el) track('click', {
      element: el.tagName.toLowerCase(),
      element_text: (el.textContent || '').trim().substring(0, 100),
      element_href: el.href || ''
    });
  }, {passive: true});
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  window.HotelLink360Analytics = {track, getDevice};
})();
```

### Bước 2: Load trong `pages/_app.tsx`

```tsx
import Script from 'next/script'

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Script src="/analytics.js" strategy="afterInteractive" />
    </>
  )
}
```

---

## Cách 4: Dùng `<Head>` trong Next.js

### File: `pages/_document.tsx`

```tsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
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
                
                function init() { track('page_view'); }
                
                document.addEventListener('click', e => {
                  const el = e.target.closest('a, button');
                  if (el) track('click', {
                    element: el.tagName.toLowerCase(),
                    element_text: (el.textContent || '').trim().substring(0, 100),
                    element_href: el.href || ''
                  });
                }, {passive: true});
                
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', init);
                } else {
                  init();
                }
                
                window.HotelLink360Analytics = {track, getDevice};
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

---

## ✅ Khuyến nghị

**Dùng Cách 1** (`<Script>` component) vì:
- ✅ Tối ưu performance (strategy="afterInteractive")
- ✅ Không block rendering
- ✅ Syntax sạch, dễ maintain
- ✅ TypeScript-friendly

---

## 🐛 Troubleshooting

### Lỗi: "Cannot find name 'init'"

**Nguyên nhân**: Paste JavaScript trực tiếp vào JSX/TSX

**Giải pháp**: Dùng 1 trong 4 cách trên

### Lỗi: "Unexpected token"

**Nguyên nhân**: Curly braces `{}` conflict với JSX syntax

**Giải pháp**: Wrap trong `<Script>` hoặc `dangerouslySetInnerHTML`

### Script không chạy

**Kiểm tra**:
1. Mở Console (F12) - có lỗi không?
2. Check Network tab - request đến `/analytics/track` thành công chưa?
3. Verify `window.HotelLink360Analytics` có tồn tại không

---

## 📊 Test

Sau khi setup, test bằng cách:

```javascript
// Mở Console (F12) và chạy:
window.HotelLink360Analytics.track('page_view');

// Hoặc
window.HotelLink360Analytics.getDevice();
```

Nếu không có lỗi = thành công! ✅

