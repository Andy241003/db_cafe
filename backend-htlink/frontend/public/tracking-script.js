/**
 * Hotel Analytics Tracking Script
 * This script should be embedded in the target website (app.botonblue.com)
 * to track page views and user interactions
 */

(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    API_BASE_URL: 'http://localhost:8000/api/v1/analytics',
    TRACKING_KEY: 'botonblue-tracking-key', // Unique key for app.botonblue.com
    DEBUG: true
  };

  // Utility functions
  const log = (...args) => {
    if (CONFIG.DEBUG) console.log('[Analytics Tracker]', ...args);
  };

  const getDeviceType = () => {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  };

  const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const getOrCreateSessionId = () => {
    let sessionId = sessionStorage.getItem('hotel_analytics_session');
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem('hotel_analytics_session', sessionId);
    }
    return sessionId;
  };

  // Main tracking function
  const trackEvent = async (eventType, additionalData = {}) => {
    try {
      const eventData = {
        tracking_key: CONFIG.TRACKING_KEY,
        event_type: eventType,
        device: getDeviceType(),
        user_agent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer || undefined,
        page_title: document.title,
        session_id: getOrCreateSessionId(),
        timestamp: new Date().toISOString(),
        ...additionalData
      };

      log('Tracking event:', eventData);

      const response = await fetch(`${CONFIG.API_BASE_URL}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const result = await response.json();
        log('Event tracked successfully:', result);
        return result;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
      return null;
    }
  };

  // Auto-track page view
  const trackPageView = () => {
    trackEvent('page_view', {
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      screen_width: screen.width,
      screen_height: screen.height,
      color_depth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    });
  };

  // Track clicks on important elements
  const setupClickTracking = () => {
    // Track all link clicks
    document.addEventListener('click', (event) => {
      const element = event.target.closest('a, button');
      if (element) {
        const elementInfo = {
          tag: element.tagName.toLowerCase(),
          text: element.textContent?.trim().substring(0, 100) || '',
          href: element.href || '',
          id: element.id || '',
          className: element.className || ''
        };

        trackEvent('click', {
          element_info: elementInfo,
          click_x: event.clientX,
          click_y: event.clientY
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM') {
        trackEvent('form_submit', {
          form_id: form.id || '',
          form_action: form.action || '',
          form_method: form.method || 'get'
        });
      }
    });
  };

  // Track scroll depth
  const setupScrollTracking = () => {
    let maxScroll = 0;
    let scrollTimeout;

    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100
      );

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        // Track milestone scrolls
        if (maxScroll >= 25 && maxScroll < 50) {
          trackEvent('scroll_25');
        } else if (maxScroll >= 50 && maxScroll < 75) {
          trackEvent('scroll_50');
        } else if (maxScroll >= 75 && maxScroll < 100) {
          trackEvent('scroll_75');
        } else if (maxScroll >= 100) {
          trackEvent('scroll_100');
        }
      }
    };

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(trackScroll, 250);
    });
  };

  // Track time on page
  const setupTimeTracking = () => {
    const startTime = Date.now();
    let isActive = true;
    let totalActiveTime = 0;
    let lastActiveTime = startTime;

    // Track when user becomes active/inactive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isActive) {
          totalActiveTime += Date.now() - lastActiveTime;
          isActive = false;
        }
      } else {
        if (!isActive) {
          lastActiveTime = Date.now();
          isActive = true;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Send time tracking data when page unloads
    window.addEventListener('beforeunload', () => {
      if (isActive) {
        totalActiveTime += Date.now() - lastActiveTime;
      }

      trackEvent('time_on_page', {
        total_time: Date.now() - startTime,
        active_time: totalActiveTime,
        idle_time: (Date.now() - startTime) - totalActiveTime
      });
    });
  };

  // Performance tracking
  const trackPerformance = () => {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          trackEvent('page_performance', {
            load_time: perfData.loadEventEnd - perfData.loadEventStart,
            dom_load_time: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            dns_time: perfData.domainLookupEnd - perfData.domainLookupStart,
            connect_time: perfData.connectEnd - perfData.connectStart,
            response_time: perfData.responseEnd - perfData.responseStart
          });
        }
      }, 1000);
    });
  };

  // Initialize tracking
  const initializeTracking = () => {
    log('Initializing analytics tracking for:', CONFIG.TRACKING_KEY);
    
    // Track page view immediately
    trackPageView();
    
    // Setup event listeners
    setupClickTracking();
    setupScrollTracking();
    setupTimeTracking();
    trackPerformance();
    
    log('Analytics tracking initialized successfully');
  };

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTracking);
  } else {
    initializeTracking();
  }

  // Expose global tracking function for manual use
  window.HotelAnalytics = {
    track: trackEvent,
    trackPageView: trackPageView,
    config: CONFIG
  };

})();