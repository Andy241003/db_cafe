// src/pages/Activities.tsx
import React, { useEffect, useState } from "react";
import { analyticsAPI, type ActivityItem } from "../services/api";

const Activities: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [filter, setFilter] = useState<string>("all");
  const [days, setDays] = useState<number>(30);

  useEffect(() => {
    loadActivities();
  }, [filter, days]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await analyticsAPI.getAllActivities(100, days);
      let filteredData = data;

      if (filter !== "all") {
        filteredData = data.filter(activity => activity.type === filter);
      }

      setActivities(filteredData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setError(error instanceof Error ? error.message : 'Failed to load activities');
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading activities...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error loading activities:</strong> {error}
          <button
            onClick={loadActivities}
            className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Activity Log</h1>
        <p className="text-slate-600">Track all user activities and system events</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6">
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Activities ({activities.length})
            </h2>
            <button
              onClick={loadActivities}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
              Refresh
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <i className="fas fa-inbox text-4xl mb-4"></i>
              <p>No activities found for the selected filters.</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-slate-50">
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
                    style={{
                      background: activity.iconBg,
                      color: activity.iconColor,
                    }}
                  >
                    <i className={activity.icon}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-700 mb-1">
                      {activity.text}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-user"></i>
                        {activity.user_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-clock"></i>
                        {activity.time}
                      </span>
                      {activity.ip_address && (
                        <span className="flex items-center gap-1">
                          <i className="fas fa-map-marker-alt"></i>
                          {activity.ip_address}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.type.includes('create') ? 'bg-green-100 text-green-800' :
                        activity.type.includes('update') ? 'bg-blue-100 text-blue-800' :
                        activity.type.includes('delete') ? 'bg-red-100 text-red-800' :
                        activity.type.includes('login') ? 'bg-green-100 text-green-800' :
                        activity.type.includes('logout') ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Activities;