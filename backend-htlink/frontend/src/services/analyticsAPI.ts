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

export interface ActivityLogResponse {
  id: number;
  tenant_id: number;
  activity_type: string;
  details: any;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  text: string;
  time: string;
  user_name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export interface DashboardStatsResponse {
  total_page_views: number;
  page_views_growth: number;
  unique_visitors: number;
  categories_this_month: number;
  features_this_month: number;
  period_days: number;
}

class AnalyticsAPI {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Get auth token from localStorage
    const token = localStorage.getItem('access_token');

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-Code': 'boton_blue', // Default tenant for testing
    };

    // Add Authorization header if token exists
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

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

  async getDashboardStats(days: number = 30): Promise<DashboardStatsResponse> {
    return this.makeRequest<DashboardStatsResponse>(`/analytics/dashboard-stats?days=${days}`);
  }

  async getRecentActivities(limit: number = 10): Promise<ActivityItem[]> {
    try {
      const logs = await this.makeRequest<ActivityLogResponse[]>(`/activity-logs/?limit=${limit}&days=7`);
      return this.transformActivityLogs(logs);
    } catch (error) {
      console.warn('Activity logs API not available, using mock data');
      return this.getMockActivities(limit);
    }
  }

  async getAllActivities(limit: number = 50, days: number = 30): Promise<ActivityItem[]> {
    try {
      const logs = await this.makeRequest<ActivityLogResponse[]>(`/activity-logs/?limit=${limit}&days=${days}`);
      return this.transformActivityLogs(logs);
    } catch (error) {
      console.warn('Activity logs API not available, using mock data');
      return this.getMockActivities(limit);
    }
  }

  private transformActivityLogs(logs: ActivityLogResponse[]): ActivityItem[] {
    return logs.map(log => {
      const details = log.details || {};
      const activityType = log.activity_type;
      const username = details.username || 'Unknown User';

      // Parse created_at - backend sends UTC time
      // If it doesn't have 'Z' suffix, add it to indicate UTC
      let createdAtStr = log.created_at;
      if (!createdAtStr.endsWith('Z') && !createdAtStr.includes('+')) {
        createdAtStr += 'Z';
      }
      const createdAt = new Date(createdAtStr);

      // Calculate relative time
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeAgo: string;
      if (diffMinutes < 1) {
        timeAgo = 'Just now';
      } else if (diffMinutes < 60) {
        timeAgo = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays < 30) {
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = createdAt.toLocaleDateString();
      }

      // Generate activity text based on type
      let text = details.message || `${activityType.replace('_', ' ')} performed`;
      let icon = 'fas fa-info-circle';
      let iconBg = '#f3f4f6';
      let iconColor = '#6b7280';

      // Customize based on activity type
      switch (activityType) {
        case 'create_feature':
          icon = 'fas fa-plus';
          iconBg = '#eff6ff';
          iconColor = '#2563eb';
          break;
        case 'update_feature':
          icon = 'fas fa-edit';
          iconBg = '#f0fdf4';
          iconColor = '#16a34a';
          break;
        case 'delete_feature':
          icon = 'fas fa-trash';
          iconBg = '#fef2f2';
          iconColor = '#dc2626';
          break;
        case 'create_category':
          icon = 'fas fa-layer-group';
          iconBg = '#fef3c7';
          iconColor = '#d97706';
          break;
        case 'update_category':
          icon = 'fas fa-edit';
          iconBg = '#f0fdf4';
          iconColor = '#16a34a';
          break;
        case 'create_user':
          icon = 'fas fa-user-plus';
          iconBg = '#e0f2fe';
          iconColor = '#0284c7';
          break;
        case 'update_user':
          icon = 'fas fa-user-edit';
          iconBg = '#f3e8ff';
          iconColor = '#7c3aed';
          break;
        case 'login':
          icon = 'fas fa-sign-in-alt';
          iconBg = '#ecfdf5';
          iconColor = '#10b981';
          break;
        case 'logout':
          icon = 'fas fa-sign-out-alt';
          iconBg = '#fee2e2';
          iconColor = '#ef4444';
          break;
        case 'upload_media':
          icon = 'fas fa-upload';
          iconBg = '#f0f9ff';
          iconColor = '#0369a1';
          break;
        case 'create_post':
          icon = 'fas fa-file-alt';
          iconBg = '#fef3c7';
          iconColor = '#f59e0b';
          break;
        case 'publish_post':
          icon = 'fas fa-bullhorn';
          iconBg = '#ecfdf5';
          iconColor = '#10b981';
          break;
        default:
          icon = 'fas fa-info-circle';
          iconBg = '#f3f4f6';
          iconColor = '#6b7280';
      }

      return {
        id: log.id.toString(),
        type: activityType,
        text,
        time: timeAgo,
        user_name: username,
        icon,
        iconBg,
        iconColor,
      };
    });
  }

  private getMockActivities(limit: number): ActivityItem[] {
    const mockActivities: ActivityItem[] = [
      {
        id: "1",
        type: "create_feature",
        text: 'New feature "WiFi Information" was added to Services category',
        time: "2 hours ago",
        user_name: "Admin User",
        icon: "fas fa-plus",
        iconBg: "#eff6ff",
        iconColor: "#2563eb",
      },
      {
        id: "2",
        type: "update_category",
        text: 'Category "Services" was updated with new translations',
        time: "4 hours ago",
        user_name: "Editor User",
        icon: "fas fa-edit",
        iconBg: "#f0fdf4",
        iconColor: "#16a34a",
      },
      {
        id: "3",
        type: "create_user",
        text: 'New user "John Doe" was created with Editor role',
        time: "1 day ago",
        user_name: "Admin User",
        icon: "fas fa-user-plus",
        iconBg: "#e0f2fe",
        iconColor: "#0284c7",
      },
      {
        id: "4",
        type: "upload_media",
        text: 'New image "hotel-lobby.jpg" was uploaded',
        time: "2 days ago",
        user_name: "Editor User",
        icon: "fas fa-upload",
        iconBg: "#f0f9ff",
        iconColor: "#0369a1",
      },
      {
        id: "5",
        type: "publish_post",
        text: 'Post "Welcome to our hotel" was published',
        time: "3 days ago",
        user_name: "Admin User",
        icon: "fas fa-bullhorn",
        iconBg: "#ecfdf5",
        iconColor: "#10b981",
      }
    ];

    return mockActivities.slice(0, limit);
  }
}

export const analyticsAPI = new AnalyticsAPI();