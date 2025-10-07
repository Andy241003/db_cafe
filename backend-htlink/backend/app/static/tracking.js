/**
 * HotelLink Analytics Tracking Script
 * This script should be embedded on hotel websites to track analytics
 * 
 * Usage:
 * <script>
 *   window.hotelLinkConfig = {
 *     trackingKey: 'your-tracking-key-here',
 *     apiUrl: 'https://travel.link360.vn/api/v1'
 *   };
 * </script>
 * <script src="https://travel.link360.vn/static/tracking.js"></script>
 */

(function() {
    'use strict';
    
    // Configuration
    const config = window.hotelLinkConfig || {};
    const trackingKey = config.trackingKey;
    const apiUrl = config.apiUrl || 'https://travel.link360.vn/api/v1';
    
    if (!trackingKey) {
        console.warn('HotelLink Analytics: No tracking key provided');
        return;
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
        const data = {
            tracking_key: trackingKey,
            event_type: eventType,
            device: detectDevice(),
            user_agent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer,
            ...additionalData
        };
        
        // Use sendBeacon if available, fallback to fetch
        if (navigator.sendBeacon) {
            navigator.sendBeacon(
                `${apiUrl}/analytics/track`,
                JSON.stringify(data)
            );
        } else {
            fetch(`${apiUrl}/analytics/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
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
            const target = event.target;
            
            // Track clicks on buttons, links, and elements with data-track attribute
            if (target.tagName === 'BUTTON' || 
                target.tagName === 'A' || 
                target.getAttribute('data-track')) {
                
                trackEvent('click', {
                    element: target.tagName.toLowerCase(),
                    text: target.textContent?.trim().substring(0, 100),
                    href: target.href,
                    className: target.className,
                    id: target.id
                });
            }
        });
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
    
    // Track time on page (send when user leaves)
    function trackTimeOnPage() {
        const startTime = Date.now();
        
        function sendTimeOnPage() {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            
            if (timeSpent > 5) { // Only track if user spent more than 5 seconds
                trackEvent('page_view', {
                    time_on_page: timeSpent
                });
            }
        }
        
        // Track when user leaves the page
        window.addEventListener('beforeunload', sendTimeOnPage);
        window.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                sendTimeOnPage();
            }
        });
    }
    
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
        trackTimeOnPage();
        
        // Expose tracking function globally for manual tracking
        window.hotelLinkTrack = trackEvent;
    }
    
    // Start tracking
    init();
    
    console.log('HotelLink Analytics initialized with tracking key:', trackingKey);
    
})();