import { AlertCircle, ArrowUp, Bed, Check, Eye, Flame, Lightbulb, Loader, Plus, Tag, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI, type ActivityItem } from '../../services/api';
import { vrHotelDiningApi, vrHotelFacilityApi, vrHotelRoomsApi } from '../../services/vrHotelApi';
import vrHotelOffersApi from '../../services/vrHotelOffersApi';

interface VRDashboardStats {
  totalRooms: number;
  totalFacilities: number;
  totalOffers: number;
  totalDining: number;
  avgViewsPerDay: number;
}

const VRHotelDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<VRDashboardStats>({
    totalRooms: 0,
    totalFacilities: 0,
    totalOffers: 0,
    totalDining: 0,
    avgViewsPerDay: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all real data in parallel
        try {
          const [rooms, facilities, offers, dinings, dashboardStats] = await Promise.all([
            vrHotelRoomsApi.getRooms().catch(() => []),
            vrHotelFacilityApi.getFacilities().catch(() => []),
            vrHotelOffersApi.getOffers().catch(() => []),
            vrHotelDiningApi.getDinings().catch(() => []),
            analyticsAPI.getDashboardStats(30).catch(() => null)
          ]);

          setStats({
            totalRooms: rooms.length,
            totalFacilities: facilities.length,
            totalOffers: offers.length,
            totalDining: dinings.length,
            avgViewsPerDay: dashboardStats?.total_page_views || 0
          });
        } catch (statsError) {
          console.warn('Error loading stats:', statsError);
          setStats({
            totalRooms: 0,
            totalFacilities: 0,
            totalOffers: 0,
            totalDining: 0,
            avgViewsPerDay: 0
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

  // Show loading state
  if (loading && !stats.totalRooms) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !stats.totalRooms) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <strong className="text-red-700">Error:</strong>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="space-y-6">
          <div>
            <h2 className="text-4xl font-bold mb-2">Welcome back! 👋</h2>
            <p className="text-blue-100 text-lg">Manage your VR360 hotel content</p>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/vr-hotel/rooms')}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              Add New Room
            </button>
            <button
              onClick={() => navigate('/vr-hotel/offers')}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              <Tag size={18} />
              Create Offer
            </button>
            <a
              href="https://hotellink.trip360.vn/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              <Eye size={18} />
              View Website
            </a>
          </div>
        </div>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Rooms Card */}
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Total Rooms</h3>
            <div className="p-3 rounded-lg" style={{ background: '#3b82f6' }}>
              <Bed size={20} className="text-white" />
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-3">{stats.totalRooms}</div>
          <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
            <ArrowUp size={16} />
            <span>Active rooms</span>
          </div>
        </div>

        {/* Facilities Card */}
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Facilities</h3>
            <div className="p-3 rounded-lg bg-gradient-to-br from-pink-400 to-red-500">
              <Zap size={20} className="text-white" />
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-3">{stats.totalFacilities}</div>
          <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
            <Check size={16} />
            <span>Active</span>
          </div>
        </div>

        {/* Offers Card */}
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Offers</h3>
            <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500">
              <Tag size={20} className="text-white" />
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-3">{stats.totalOffers}</div>
          <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm">
            <Flame size={16} />
            <span>{stats.totalOffers > 0 ? 'Available' : 'No offers'}</span>
          </div>
        </div>

        {/* Dining/VR360 Tours Card */}
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Dining</h3>
            <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500">
              <Lightbulb size={20} className="text-white" />
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-3">{stats.totalDining}</div>
          <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
            <ArrowUp size={16} />
            <span>{stats.totalDining > 0 ? 'Active' : 'No dining'}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <button
            onClick={() => navigate('/vr-hotel/activities')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-gray-600">Loading activities...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No recent activities</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors border-l-4" style={{ borderColor: activity.iconBg }}>
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                  style={{ background: activity.iconBg, color: activity.iconColor || '#fff' }}
                >
                  <i className={activity.icon}></i>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{activity.text}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <span>{activity.user_name}</span>
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
