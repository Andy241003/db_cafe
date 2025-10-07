// src/services/analyticsAPI.ts
const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface AnalyticsStatsResponse {
  total_page_views: number;
  unique_visitors: number;
  total_events: number;
  properties_count: number;
  period_start: string;
  period_end: string;
  page_views_by_day?: Array<{date: string; views: number}>;
  popular_pages?: Array<{event_type: string; views: number}>;
  traffic_sources?: Array<{device: string; views: number}>;
  popular_features?: Array<{device: string; clicks: number}>;
}

export interface RealtimeStatsResponse {
  active_users_15min: number;
  page_views_5min: number;
  events_1min: number;
}

export interface TrackingEventRequest {
  tracking_key: string;
  event_type: 'page_view' | 'click' | 'share';
  device?: 'desktop' | 'tablet' | 'mobile';
  user_agent?: string;
  url?: string;
  referrer?: string;
}

export interface TrackingEventResponse {
  success: boolean;
  event_id: number;
  message: string;
}

class AnalyticsAPI {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Tenant-Code': 'boton_blue', // Default tenant for testing
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    console.log(`API Request: ${config.method || 'GET'} ${url}`, config);

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`API Response:`, data);
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/analytics/test');
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  async getStats(days: number = 30): Promise<AnalyticsStatsResponse> {
    return this.makeRequest<AnalyticsStatsResponse>(`/analytics/stats?days=${days}`);
  }

  async getRealtimeStats(): Promise<RealtimeStatsResponse> {
    return this.makeRequest<RealtimeStatsResponse>('/analytics/realtime');
  }

  async trackEvent(event: TrackingEventRequest): Promise<TrackingEventResponse> {
    return this.makeRequest<TrackingEventResponse>('/analytics/track', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async getPropertyAnalytics(propertyId: number): Promise<any> {
    return this.makeRequest(`/analytics/property/${propertyId}`);
  }

  async getSummary(
    startDate: string,
    endDate: string,
    periodType: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<any> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      period_type: periodType,
    });
    
    return this.makeRequest(`/analytics/summary?${params}`);
  }

  // Test tracking with our test property
  async testTracking(): Promise<TrackingEventResponse> {
    const testEvent: TrackingEventRequest = {
      tracking_key: 'test-tracking-key',
      event_type: 'page_view',
      device: 'desktop',
      user_agent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer || undefined,
    };

    return this.trackEvent(testEvent);
  }
}

export const analyticsAPI = new AnalyticsAPI();