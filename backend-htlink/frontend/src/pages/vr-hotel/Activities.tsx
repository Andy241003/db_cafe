// src/pages/vr-hotel/Activities.tsx
import { AlertCircle, Loader } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { analyticsAPI, type ActivityItem } from '../../services/api';

const VRHotelActivities: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [days, setDays] = useState<number>(30);

  useEffect(() => {
    loadActivities();
  }, [filter, days]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await analyticsAPI.getAllActivities(100, days);

      // Filter out analytics_event - only show CRUD operations and auth events
      let filteredData = data.filter(activity =>
        activity.type !== 'analytics_event' &&
        activity.type !== 'system_update'
      );

      if (filter !== 'all') {
        filteredData = filteredData.filter(activity => activity.type === filter);
      }

      setActivities(filteredData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activities');
      setLoading(false);
    }
  };

  const getActivityTypeOptions = () => {
    const types = Array.from(new Set(activities.map(a => a.type)));
    return types.map(type => ({
      value: type,
      label: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
            <p className="mt-4 text-lg font-semibold text-slate-700">Loading activities...</p>
            <p className="text-sm text-slate-500 mt-1">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <div>
            <strong>Error loading activities:</strong> {error}
            <button
              onClick={loadActivities}
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">VR Hotel Activity Log</h1>
        <p className="text-slate-600 mt-2">Track all VR Hotel management activities and events</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Activity Type
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Activities</option>
              {getActivityTypeOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Time Period
            </label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          <button
            onClick={loadActivities}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-slate-200 text-center">
            <p className="text-slate-600">No activities found for the selected filters</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all"
              style={{ borderLeft: `4px solid ${activity.iconBg || '#3b82f6'}` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                  style={{
                    background: activity.iconBg || '#3b82f6',
                    color: activity.iconColor || '#fff',
                  }}
                >
                  <i className={activity.icon || 'fas fa-info-circle'}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          👤 {activity.user_name}
                        </span>
                        <span>•</span>
                        <span>{activity.time}</span>
                        {activity.type && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                              {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination info */}
      <div className="mt-6 text-center text-sm text-slate-600">
        <p>Showing {activities.length} activities from the last {days} days</p>
      </div>
    </div>
  );
};

export default VRHotelActivities;
