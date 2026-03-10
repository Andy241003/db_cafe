// src/pages/cafe/Activities.tsx
import React, { useEffect, useState } from "react";
import { cafeActivityLogsApi, type CafeActivityItem } from "../../services/cafeApi";

const CafeActivities: React.FC = () => {
  const [activities, setActivities] = useState<CafeActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [filter, setFilter] = useState<string>("all");
  const [days, setDays] = useState<number>(7);

  useEffect(() => {
    loadActivities();
  }, [filter, days]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await cafeActivityLogsApi.getAllActivities(100, days);
      
      console.log('Activities data:', data); // Debug: check data structure
      
      // Filter by activity type if not "all"
      let filteredData = data;
      if (filter !== "all") {
        filteredData = data.filter(activity => activity.type === filter);
      }

      console.log('Filtered activities:', filteredData); // Debug: check filtered data

      setActivities(filteredData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setError(error instanceof Error ? error.message : 'Failed to load activities');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="pt-6 px-6 pb-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg font-semibold text-slate-700">Loading activities...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="pt-6 px-6 pb-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error loading activities:</strong> {error}
          <button
            onClick={loadActivities}
            className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-6 px-6 pb-6">
      {/* Page Header */}
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
                <option value="login">Login</option>
                <option value="delete_media">Delete Media</option>
                <option value="upload_media">Upload Media</option>
                <option value="create_post">Create Post</option>
                <option value="update_post">Update Post</option>
                <option value="delete_post">Delete Post</option>
                <option value="create_category">Create Category</option>
                <option value="update_category">Update Category</option>
                <option value="delete_category">Delete Category</option>
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
              <div className="text-slate-400 mb-2">
                <i className="fas fa-inbox text-4xl"></i>
              </div>
              <p className="text-slate-600 font-medium">No activities found</p>
              <p className="text-sm text-slate-500 mt-1">
                Try adjusting your filters to see more activities
              </p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all border-l-4"
                style={{ borderLeftColor: activity.iconBg }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                    style={{
                      background: activity.iconBg,
                      color: activity.iconColor,
                    }}
                  >
                    <i className={activity.icon}></i>
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
                          <span>•</span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                            {activity.type.replace(/_/g, ' ').split(' ').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      {/* Footer */}
      {activities.length > 0 && (
        <div className="mt-6 text-center text-sm text-slate-600">
          <p>Showing {activities.length} activities from the last {days} days</p>
        </div>
      )}
    </main>
  );
};

export default CafeActivities;
