import React, { useState, useEffect } from 'react';
import { Hotel, Users, Calendar, Eye, AlertCircle, Loader } from 'lucide-react';
import { analyticsAPI, type ActivityItem } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface VRDashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  pendingBookings: number;
  avgViewsPerDay: number;
}

const VRHotelDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<VRDashboardStats>({
    totalRooms: 0,
    occupiedRooms: 0,
    pendingBookings: 0,
    avgViewsPerDay: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Load stats from analytics
        try {
          const dashboardStats = await analyticsAPI.getDashboardStats(30);
          setStats({
            totalRooms: 12, // TODO: Get from API
            occupiedRooms: 8, // TODO: Get from API
            pendingBookings: 3, // TODO: Get from API
            avgViewsPerDay: dashboardStats.total_page_views
          });
        } catch (statsError) {
          console.warn('Analytics stats not available:', statsError);
          setStats({
            totalRooms: 12,
            occupiedRooms: 8,
            pendingBookings: 3,
            avgViewsPerDay: 1250
          });
        }

        // Load recent activities
        try {
          const recentActivities = await analyticsAPI.getRecentActivities(5);
          setActivities(recentActivities);
        } catch (activitiesError) {
          console.warn('Recent activities not available:', activitiesError);
          setActivities([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const occupancyRate = Math.round((stats.occupiedRooms / stats.totalRooms) * 100);

  // Show loading state
  if (loading && !stats.totalRooms) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
            <p className="mt-4 text-lg font-semibold text-slate-700">Loading VR Hotel dashboard...</p>
            <p className="text-sm text-slate-500 mt-1">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !stats.totalRooms) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <div>
            <strong>Error loading dashboard:</strong> {error}
            <button 
              onClick={() => window.location.reload()} 
              className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">VR Hotel Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome to your immersive hotel management system</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Rooms Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Rooms</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalRooms}</p>
            </div>
            <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
              <Hotel size={32} className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Occupancy Rate Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupancy Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{occupancyRate}%</p>
              <p className="text-xs text-gray-500 mt-2">{stats.occupiedRooms} of {stats.totalRooms} occupied</p>
            </div>
            <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
              <Users size={32} className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending Bookings Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Bookings</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingBookings}</p>
            </div>
            <div className="flex-shrink-0 p-3 bg-yellow-100 rounded-lg">
              <Calendar size={32} className="text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Average Views Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Views/Day</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.avgViewsPerDay.toLocaleString()}</p>
            </div>
            <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
              <Eye size={32} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 p-2 bg-blue-200 rounded">
              <Hotel size={20} className="text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Manage Rooms</p>
              <p className="text-xs text-gray-600">Add or edit room details</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 p-2 bg-purple-200 rounded">
              <Users size={20} className="text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">View Bookings</p>
              <p className="text-xs text-gray-600">Check pending reservations</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 p-2 bg-green-200 rounded">
              <Eye size={20} className="text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">View Analytics</p>
              <p className="text-xs text-gray-600">Check performance metrics</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          <button
            onClick={() => navigate('/vr-hotel/activities')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-5 h-5 animate-spin text-blue-600 mr-2" />
            <span className="text-slate-600">Loading activities...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No recent activities found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-3 border-l-4 rounded hover:bg-slate-50 transition-colors" style={{ borderColor: activity.iconBg }}>
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                  style={{
                    background: activity.iconBg,
                    color: activity.iconColor || '#fff',
                  }}
                >
                  <i className={activity.icon}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {activity.user_name}
                    </span>
                    <span>•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VRHotelDashboard;
