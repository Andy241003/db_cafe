import { Coffee, Menu, MapPin, Tag } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  cafeMenuApi, 
  cafeBranchesApi, 
  cafePromotionsApi,
  cafeActivityLogsApi,
  type CafeActivityItem
} from '../../services/cafeApi';

interface CafeDashboardStats {
  totalMenuCategories: number;
  totalMenuItems: number;
  totalPromotions: number;
  totalBranches: number;
}

const CafeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CafeDashboardStats>({
    totalMenuCategories: 0,
    totalMenuItems: 0,
    totalPromotions: 0,
    totalBranches: 0,
  });
  const [recentActivities, setRecentActivities] = useState<CafeActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load stats
      const [categories, items, promotions, branches] = await Promise.all([
        cafeMenuApi.getCategories().catch(() => []),
        cafeMenuApi.getItems().catch(() => []),
        cafePromotionsApi.getPromotions().catch(() => []),
        cafeBranchesApi.getBranches().catch(() => []),
      ]);

      setStats({
        totalMenuCategories: categories?.length || 0,
        totalMenuItems: items?.length || 0,
        totalPromotions: promotions?.length || 0,
        totalBranches: branches?.length || 0,
      });

      // Load recent activities
      const activities = await cafeActivityLogsApi.getRecentActivities(10);
      setRecentActivities(activities);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
        <div>
          <h2 className="text-3xl font-bold mb-2">Welcome back! 👋</h2>
          <p className="text-blue-100 text-lg">
            Manage your cafe content and keep everything up to date
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/cafe/menu')}
            className="px-6 py-2.5 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium shadow-sm"
          >
            Add Menu Category
          </button>
          <button
            onClick={() => navigate('/cafe/menu')}
            className="px-6 py-2.5 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium shadow-sm"
          >
            Add Menu Item
          </button>
          <button
            onClick={() => navigate('/cafe/promotions')}
            className="px-6 py-2.5 bg-white/90 text-blue-600 rounded-md hover:bg-white transition-colors font-medium shadow-sm"
          >
            Add Promotion
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Menu Categories */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Menu Categories</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalMenuCategories}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Coffee className="w-7 h-7 text-white" />
            </div>
          </div>
          <button
            onClick={() => navigate('/cafe/menu')}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all →
          </button>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Menu Items</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalMenuItems}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 via-pink-600 to-red-600 rounded-lg flex items-center justify-center">
              <Menu className="w-7 h-7 text-white" />
            </div>
          </div>
          <button
            onClick={() => navigate('/cafe/menu')}
            className="mt-4 text-sm text-pink-600 hover:text-pink-700 font-medium"
          >
            View all →
          </button>
        </div>

        {/* Promotions */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Promotions</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalPromotions}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Tag className="w-7 h-7 text-white" />
            </div>
          </div>
          <button
            onClick={() => navigate('/cafe/promotions')}
            className="mt-4 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
          >
            View all →
          </button>
        </div>

        {/* Branches */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Branches</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalBranches}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-7 h-7 text-white" />
            </div>
          </div>
          <button
            onClick={() => navigate('/cafe/branches')}
            className="mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            View all →
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <button 
            onClick={() => navigate('/cafe/activities')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </button>
        </div>
        
        <div className="space-y-3">
          {recentActivities && recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors border-l-4"
                style={{ borderColor: activity.iconBg }}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                  style={{
                    background: activity.iconBg,
                    color: activity.iconColor,
                  }}
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
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-2">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">No recent activity</p>
              <p className="text-sm text-slate-500 mt-1">
                Activity will appear here once you start making changes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CafeDashboard;
