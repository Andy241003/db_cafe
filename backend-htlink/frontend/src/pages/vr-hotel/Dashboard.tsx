import React, { useState, useEffect } from 'react';
import { Hotel, Users, Calendar, Eye } from 'lucide-react';

interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  pendingBookings: number;
  avgViewsPerDay: number;
}

const VRHotelDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 12,
    occupiedRooms: 8,
    pendingBookings: 3,
    avgViewsPerDay: 1250
  });

  const occupancyRate = Math.round((stats.occupiedRooms / stats.totalRooms) * 100);

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
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50 rounded">
            <div>
              <p className="font-medium text-gray-900">New booking received</p>
              <p className="text-xs text-gray-600">Room 202 - Check-in: Jan 15, 2026</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">2 hours ago</span>
          </div>

          <div className="flex items-center justify-between p-3 border-l-4 border-green-500 bg-green-50 rounded">
            <div>
              <p className="font-medium text-gray-900">Room 101 check-in completed</p>
              <p className="text-xs text-gray-600">Guest: John Doe</p>
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">4 hours ago</span>
          </div>

          <div className="flex items-center justify-between p-3 border-l-4 border-yellow-500 bg-yellow-50 rounded">
            <div>
              <p className="font-medium text-gray-900">Virtual tour viewed</p>
              <p className="text-xs text-gray-600">Deluxe Suite - 45 views today</p>
            </div>
            <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VRHotelDashboard;
