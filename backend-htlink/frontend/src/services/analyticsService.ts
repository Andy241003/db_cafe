// src/services/analyticsService.ts
import axios from 'axios';
import type { DateRange } from '../pages/Analytics';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token and tenant header to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (tenantId) {
    config.headers['X-Tenant-Code'] = tenantId;
  }
  
  return config;
});

export interface AnalyticsStats {
  pageViews: { value: string; change: string; positive: boolean };
  uniqueVisitors: { value: string; change: string; positive: boolean };
  avgSession: { value: string; change: string; positive: boolean };
  bounceRate: { value: string; change: string; positive: boolean };
  featureClicks: { value: string; change: string; positive: boolean };
  vrTourViews: { value: string; change: string; positive: boolean };
}

export interface ChartData {
  labels: string[];
  pageViews: number[];
  uniqueVisitors: number[];
}

export interface TrafficSource {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PopularPage {
  page: string;
  views: number;
  trend: string;
  trendPositive: boolean;
}

export interface PopularFeature {
  feature: string;
  clicks: number;
  ctr: number;
}

export interface UserFlowStep {
  num: number;
  title: string;
  desc: string;
  users: number;
  conversion: number;
}

export interface AnalyticsData {
  stats: AnalyticsStats;
  chartData: ChartData;
  trafficSources: TrafficSource[];
  popularPages: PopularPage[];
  popularFeatures: PopularFeature[];
  userFlow: UserFlowStep[];
}

export const analyticsService = {
  // Get analytics data for a specific date range
  async getAnalytics(dateRange: DateRange, timeFilter: string = '30d'): Promise<AnalyticsData> {
    try {
      const response = await api.get('/analytics/', {
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          time_filter: timeFilter,
        },
      });
      
      return response.data;
    } catch (error) {
      // Return mock data if API fails (for development/demo)
      return getMockData(dateRange, timeFilter);
    }
  },

  // Export analytics data
  async exportData(dateRange: DateRange, format: 'csv' | 'xlsx' = 'xlsx'): Promise<Blob> {
    try {
      const response = await api.get('/analytics/export', {
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          format,
        },
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  },

  // Get real-time analytics
  async getRealTimeStats(): Promise<{ activeUsers: number; currentPageViews: number }> {
    try {
      const response = await api.get('/analytics/realtime');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch real-time stats:', error);
      
      // Return mock data for demo
      return { 
        activeUsers: Math.floor(Math.random() * 50) + 10, 
        currentPageViews: Math.floor(Math.random() * 200) + 50 
      };
    }
  },

  // Track page view (utility function)
  async trackPageView(pagePath: string, referrer?: string, sessionId?: string): Promise<void> {
    try {
      await api.post('/analytics/page-view', {
        page_path: pagePath,
        referrer,
        session_id: sessionId,
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  },

  // Get dashboard stats (alternative endpoint)
  async getDashboardStats(days: number = 30): Promise<any> {
    try {
      const response = await api.get('/analytics/dashboard-stats', {
        params: { days },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      return null;
    }
  },
};

// Mock data generator (for development/fallback)
function getMockData(_dateRange: DateRange, timeFilter: string): AnalyticsData {
  const isShortRange = timeFilter === '7d';
  
  return {
    stats: {
      pageViews: { value: "24,847", change: "+18.5%", positive: true },
      uniqueVisitors: { value: "8,423", change: "+12.3%", positive: true },
      avgSession: { value: "3m 42s", change: "+8.2%", positive: true },
      bounceRate: { value: "28.3%", change: "-5.4%", positive: false },
      featureClicks: { value: "15,673", change: "+24.1%", positive: true },
      vrTourViews: { value: "1,847", change: "+31.7%", positive: true },
    },
    chartData: {
      labels: isShortRange 
        ? ["Dec 1", "Dec 3", "Dec 5", "Dec 7"]
        : ["Dec 1", "Dec 3", "Dec 5", "Dec 7", "Dec 9", "Dec 11", "Dec 13", "Dec 15"],
      pageViews: isShortRange
        ? [1200, 1450, 1300, 1800]
        : [1200, 1450, 1300, 1800, 1600, 2100, 1950, 2300],
      uniqueVisitors: isShortRange
        ? [800, 950, 850, 1200]
        : [800, 950, 850, 1200, 1050, 1400, 1300, 1500],
    },
    trafficSources: [
      { name: "QR Code Scan", value: 45, percentage: 45, color: "#3b82f6" },
      { name: "Direct Link", value: 25, percentage: 25, color: "#10b981" },
      { name: "Social Media", value: 15, percentage: 15, color: "#f59e0b" },
      { name: "Search", value: 10, percentage: 10, color: "#8b5cf6" },
      { name: "Referral", value: 5, percentage: 5, color: "#06b6d4" },
    ],
    popularPages: [
      { page: "Welcome to Tabi Tower", views: 4523, trend: "+15.2%", trendPositive: true },
      { page: "Hotel Amenities", views: 3847, trend: "+8.7%", trendPositive: true },
      { page: "Restaurant & Dining", views: 2954, trend: "+22.1%", trendPositive: true },
      { page: "Spa & Wellness", views: 2673, trend: "-5.3%", trendPositive: false },
    ],
    popularFeatures: [
      { feature: "WiFi Information", clicks: 1847, ctr: 12.4 },
      { feature: "Room Service Menu", clicks: 1623, ctr: 10.8 },
      { feature: "Pool Schedule", clicks: 1354, ctr: 9.1 },
      { feature: "Concierge Contact", clicks: 1267, ctr: 8.5 },
    ],
    userFlow: [
      { num: 1, title: "Landing Page", desc: "Initial hotel information page", users: 8423, conversion: 100.0 },
      { num: 2, title: "Feature Navigation", desc: "Users browse hotel features", users: 6847, conversion: 81.3 },
      { num: 3, title: "Service Details", desc: "View specific service information", users: 4923, conversion: 58.4 },
      { num: 4, title: "Contact/Action", desc: "Contact hotel or use services", users: 2847, conversion: 33.8 },
    ],
  };
}