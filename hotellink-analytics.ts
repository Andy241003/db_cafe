/**
 * HotelLink Analytics v2.0 - TypeScript Version
 * Enhanced with rate limiting and session management
 */

export interface AnalyticsConfig {
  trackingKey: string;
  apiUrl: string;
}

interface RateLimits {
  pageView: number;
  click: number;
  share: number;
}

const RATE_LIMITS: RateLimits = {
  pageView: 30000,      // 30 seconds
  click: 12000,         // 12 seconds
  share: 60000          // 60 seconds
};

const MAX_CLICKS_PER_MINUTE = 5;
const clickHistory: number[] = [];

function getSessionId(): string {
  const SESSION_KEY = 'hotellink_session_id';
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  
  let session: any = null;
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      session = JSON.parse(stored);
      if (Date.now() - session.timestamp > SESSION_DURATION) {
        session = null;
      }
    }
  } catch (e) {
    // Storage not available
  }
  
  if (!session) {
    session = {
      id: generateUUID(),
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      // Ignore storage errors
    }
  }
  
  return session.id;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function checkRateLimit(eventType: keyof RateLimits): boolean {
  const LIMIT_KEY = `hotellink_last_${eventType}`;
  const limit = RATE_LIMITS[eventType] || 0;
  
  if (!limit) return true;
  
  try {
    const lastTime = localStorage.getItem(LIMIT_KEY);
    if (lastTime) {
      const elapsed = Date.now() - parseInt(lastTime, 10);
      if (elapsed < limit) {
        console.debug(`HotelLink: Rate limit for ${eventType}, wait ${Math.ceil((limit - elapsed) / 1000)}s`);
        return false;
      }
    }
    localStorage.setItem(LIMIT_KEY, Date.now().toString());
  } catch (e) {
    // Storage not available, allow tracking
  }
  
  return true;
}

function checkClickRateLimit(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  while (clickHistory.length > 0 && clickHistory[0] < oneMinuteAgo) {
    clickHistory.shift();
  }
  
  if (clickHistory.length >= MAX_CLICKS_PER_MINUTE) {
    console.debug('HotelLink: Click rate limit exceeded');
    return false;
  }
  
  clickHistory.push(now);
  return true;
}

function detectDevice(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipod|windows phone/.test(userAgent)) {
    return 'mobile';
  } else if (/ipad|tablet|kindle/.test(userAgent)) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

export function initAnalytics(config: AnalyticsConfig) {
  const { trackingKey, apiUrl } = config;
  
  function trackEvent(eventType: string, additionalData: Record<string, any> = {}) {
    // Check rate limits
    if (eventType === 'page_view' && !checkRateLimit('pageView')) {
      return;
    }
    if (eventType === 'click' && !checkClickRateLimit()) {
      return;
    }
    if (eventType === 'share' && !checkRateLimit('share')) {
      return;
    }
    
    const data = {
      tracking_key: trackingKey,
      event_type: eventType,
      device: detectDevice(),
      user_agent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      session_id: getSessionId(),
      page_title: document.title,
      ...additionalData
    };
    
    const payload = JSON.stringify(data);
    
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(`${apiUrl}/analytics/track`, blob);
    } else {
      fetch(`${apiUrl}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
        keepalive: true
      }).catch((error) => {
        console.warn('HotelLink Analytics: Failed to track event', error);
      });
    }
  }
  
  // Track initial page view
  trackEvent('page_view');
  
  // Track clicks
  const handleClick = (event: MouseEvent) => {
    const target = (event.target as HTMLElement).closest('button, a, [data-track]');
    
    if (!target) return;
    
    const featureId = target.getAttribute('data-feature-id');
    const categoryId = target.getAttribute('data-category-id');
    
    trackEvent('click', {
      element: target.tagName.toLowerCase(),
      text: target.textContent?.trim().substring(0, 100),
      href: (target as HTMLAnchorElement).href || '',
      className: target.className,
      id: target.id,
      feature_id: featureId ? parseInt(featureId, 10) : null,
      category_id: categoryId ? parseInt(categoryId, 10) : null
    });
  };
  
  document.addEventListener('click', handleClick, true);
  
  // Expose globally
  (window as any).hotelLinkTrack = trackEvent;
  
  console.log('HotelLink Analytics v2.0 initialized');
  
  // Return cleanup function
  return () => {
    document.removeEventListener('click', handleClick, true);
  };
}
