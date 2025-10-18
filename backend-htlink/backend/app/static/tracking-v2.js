/**
 * HotelLink Analytics Tracking Script v2.0
 * Enhanced with rate limiting and session management
 * 
 * Features:
 * - Rate limiting: Max 1 page view per 30 seconds
 * - Session tracking: Group events by session
 * - Click throttling: Max 5 clicks per minute
 * - Local storage to prevent spam
 * 
 * Usage:
 * <script>
 *   window.hotelLinkConfig = {
 *     trackingKey: 'your-tracking-key-here',
 *     apiUrl: 'https://travel.link360.vn/api/v1'
 *   };
 * </script>
 * <script src="https://travel.link360.vn/static/tracking-v2.js"></script>
 */

(function() {
    'use strict';
    
    // Configuration
    const config = window.hotelLinkConfig || {};
    const trackingKey = config.trackingKey;
    const apiUrl = config.apiUrl || 'https://travel.link360.vn/api/v1';
    
    // Rate limiting settings
    const RATE_LIMITS = {
        pageView: 30000,      // 1 page view per 30 seconds
        click: 12000,         // 1 click per 12 seconds (max 5/min)
        share: 60000          // 1 share per 60 seconds
    };
    
    // Click tracking limits
    const MAX_CLICKS_PER_MINUTE = 5;
    const clickHistory = [];
    
    if (!trackingKey) {
        console.warn('HotelLink Analytics: No tracking key provided');
        return;
    }
    
    // Generate or retrieve session ID
    function getSessionId() {
        const SESSION_KEY = 'hotellink_session_id';
        const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
        
        let session = null;
        try {
            const stored = localStorage.getItem(SESSION_KEY);
            if (stored) {
                session = JSON.parse(stored);
                // Check if session expired
                if (Date.now() - session.timestamp > SESSION_DURATION) {
                    session = null;
                }
            }
        } catch (e) {
            // LocalStorage not available
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
    
    // Generate UUID
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // Check rate limit
    function checkRateLimit(eventType) {
        const LIMIT_KEY = `hotellink_last_${eventType}`;
        const limit = RATE_LIMITS[eventType] || 0;
        
        if (!limit) return true; // No limit
        
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
    
    // Check click rate limit (more sophisticated)
    function checkClickRateLimit() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Remove clicks older than 1 minute
        while (clickHistory.length > 0 && clickHistory[0] < oneMinuteAgo) {
            clickHistory.shift();
        }
        
        // Check if exceeded limit
        if (clickHistory.length >= MAX_CLICKS_PER_MINUTE) {
            console.debug('HotelLink: Click rate limit exceeded, max 5 clicks per minute');
            return false;
        }
        
        clickHistory.push(now);
        return true;
    }
    
    // Device detection
    function detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (/mobile|android|iphone|ipod|windows phone/.test(userAgent)) {
            return 'mobile';
        } else if (/ipad|tablet|kindle/.test(userAgent)) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }
    
    // Send tracking event
    function trackEvent(eventType, additionalData = {}) {
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
        
        // Use sendBeacon if available, fallback to fetch
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
            }).catch(error => {
                console.warn('HotelLink Analytics: Failed to track event', error);
            });
        }
    }
    
    // Track page view on load
    function trackPageView() {
        trackEvent('page_view');
    }
    
    // Track clicks on important elements
    function trackClicks() {
        document.addEventListener('click', function(event) {
            const target = event.target.closest('button, a, [data-track]');
            
            if (!target) return;
            
            // Extract feature_id if available
            const featureId = target.getAttribute('data-feature-id');
            const categoryId = target.getAttribute('data-category-id');
            
            trackEvent('click', {
                element: target.tagName.toLowerCase(),
                text: target.textContent?.trim().substring(0, 100),
                href: target.href,
                className: target.className,
                id: target.id,
                feature_id: featureId ? parseInt(featureId, 10) : null,
                category_id: categoryId ? parseInt(categoryId, 10) : null
            });
        }, true); // Use capture to catch events before they bubble
    }
    
    // Track shares (when share buttons are clicked)
    function trackShares() {
        // Listen for share events
        document.addEventListener('click', function(event) {
            const target = event.target;
            const classList = target.classList;
            
            // Detect share buttons by common class names
            if (classList.contains('share-btn') || 
                classList.contains('social-share') ||
                target.getAttribute('data-share')) {
                
                trackEvent('share', {
                    platform: target.getAttribute('data-platform') || 'unknown',
                    text: target.textContent?.trim()
                });
            }
        });
    }
    
    // Track time on page (send when user leaves) - REMOVED to reduce DB writes
    // Time on page can be calculated from session data instead
    
    // Initialize tracking
    function init() {
        // Track initial page view
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', trackPageView);
        } else {
            trackPageView();
        }
        
        // Set up event tracking
        trackClicks();
        trackShares();
        
        // Expose tracking function globally for manual tracking
        window.hotelLinkTrack = trackEvent;
        
        console.log('HotelLink Analytics v2.0 initialized');
    }
    
    // Start tracking
    init();
    
})();
