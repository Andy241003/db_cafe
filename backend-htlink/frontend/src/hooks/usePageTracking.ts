// src/hooks/usePageTracking.ts
import { useEffect } from 'react';
import { analyticsAPI } from '../services/analyticsAPI';

export const usePageTracking = (pagePath: string) => {
  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Get device type from user agent
        const getDeviceType = (): 'desktop' | 'tablet' | 'mobile' => {
          const userAgent = navigator.userAgent.toLowerCase();
          
          if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
            return 'mobile';
          } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
            return 'tablet';
          } else {
            return 'desktop';
          }
        };

        const trackingEvent = {
          tracking_key: 'test-tracking-key', // Use our test tracking key
          event_type: 'page_view' as const,
          device: getDeviceType(),
          user_agent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer || undefined,
        };

        console.log('Tracking page view:', pagePath, trackingEvent);
        
        const result = await analyticsAPI.trackEvent(trackingEvent);
        console.log('Page view tracked successfully:', result);
        
      } catch (error) {
        console.error('Failed to track page view:', error);
        
        // Fallback to localStorage tracking
        const visits = JSON.parse(localStorage.getItem('page_visits') || '{}');
        visits[pagePath] = (visits[pagePath] || 0) + 1;
        localStorage.setItem('page_visits', JSON.stringify(visits));
        
        const visitHistory = JSON.parse(localStorage.getItem('visit_history') || '[]');
        visitHistory.push({
          page: pagePath,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer
        });
        
        if (visitHistory.length > 100) {
          visitHistory.splice(0, visitHistory.length - 100);
        }
        
        localStorage.setItem('visit_history', JSON.stringify(visitHistory));
      }
    };

    trackPageView();
  }, [pagePath]);
};