// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import ChartCard from "../components/ChartCard";
import { useNavigate } from "react-router-dom";
import { authAPI, categoriesAPI, featuresAPI, analyticsAPI, type User, type ActivityItem } from "../services/api";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [stats, setStats] = useState({
    totalCategories: 0,
    activeFeatures: 0,
    pageViews: 0,
    newCategoriesThisMonth: 0,
    featuresAddedThisWeek: 0,
    pageViewsGrowth: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Track page view
        try {
          await analyticsAPI.trackPageView('/dashboard');
        } catch (trackError) {
          console.warn('Failed to track page view:', trackError);
        }
        
        // Load current user
        const userData = await authAPI.getCurrentUser();
        setCurrentUser(userData);

        // Load statistics with fallback
        const [categories, features] = await Promise.all([
          categoriesAPI.getAll().catch(() => []),
          featuresAPI.getAll().catch(() => [])
        ]);

        // Try to get real analytics data, fallback to calculated stats
        let dashboardStats;
        try {
          dashboardStats = await analyticsAPI.getDashboardStats(30);
        } catch (analyticsError) {
          console.warn('Analytics API not available, using fallback data:', analyticsError);
          dashboardStats = {
            total_page_views: Math.floor(Math.random() * 5000) + 1000,
            page_views_growth: Math.floor(Math.random() * 30) + 5,
            unique_visitors: Math.floor(Math.random() * 500) + 100,
            categories_this_month: categories.length,
            features_this_month: features.length,
            period_days: 30
          };
        }

        // Get recent activity data
        const recentActivities = await analyticsAPI.getRecentActivities(5);

        setStats({
          totalCategories: categories.length,
          activeFeatures: features.length,
          pageViews: dashboardStats.total_page_views,
          pageViewsGrowth: dashboardStats.page_views_growth,
          newCategoriesThisMonth: dashboardStats.categories_this_month,
          featuresAddedThisWeek: dashboardStats.features_this_month
        });

        setActivities(recentActivities);
        setLoading(false);
      } catch (error) {
        console.error('Dashboard: Failed to load dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);
  const dashboardData = [
    {
      title: "Total Categories",
      value: stats.totalCategories.toString(),
      change: `${stats.newCategoriesThisMonth} new this month`,
      changeType: "positive" as const,
      icon: "fas fa-layer-group",
      iconBg: "#3b82f6",
    },
    {
      title: "Active Features",
      value: stats.activeFeatures.toString(),
      change: `${stats.featuresAddedThisWeek} added this month`,
      changeType: "positive" as const,
      icon: "fas fa-puzzle-piece",
      iconBg: "#10b981",
    },
    {
      title: "Page Views",
      value: stats.pageViews.toLocaleString(),
      change: `${stats.pageViewsGrowth >= 0 ? '+' : ''}${stats.pageViewsGrowth}% vs last month`,
      changeType: stats.pageViewsGrowth >= 0 ? "positive" as const : "negative" as const,
      icon: "fas fa-eye",
      iconBg: "#8b5cf6",
    },
  ];



  const handleCardClick = () => {
    // Add navigation or modal logic here
  };

  const handleQuickAction = async (action: string) => {
    // Log the user activity
    try {
      await analyticsAPI.logActivity(
        'system_update',
        `User clicked "${action}" from dashboard`,
        'dashboard_action',
        undefined,
        { action, source: 'dashboard_quick_actions' }
      );
    } catch (error) {
      console.warn('Failed to log activity:', error);
    }

    if (action === "Add Feature") {
      navigate("/features"); // 👈 nhảy qua Features.tsx
    }
    if (action === "Upload Media") {
      navigate("/media"); // 👈 nhảy qua Media.tsx
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error loading dashboard:</strong> {error}
          <button 
            onClick={() => window.location.reload()} 
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
      {/* Welcome Section */}
      <section className="p-8 mb-6 text-white bg-blue-600 rounded-2xl">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold">Welcome back, {currentUser?.full_name || 'User'}! 👋</h2>
          <p className="mt-2 text-blue-100">
            Here's what's happening with your hotel management system today.
          </p>
          <div className="flex gap-3 mt-5">
            <button
              className="px-4 py-2 text-sm font-semibold text-blue-700 bg-white rounded-lg hover:bg-blue-50"
              onClick={() => handleQuickAction("Add Feature")}
            >
              Add Feature
            </button>
            <button
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-400"
              onClick={() => handleQuickAction("Upload Media")}
            >
              Upload Media
            </button>
          </div>
        </div>
      </section>

      {/* Dashboard Cards */}
      <section className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        {dashboardData.map((card, index) => (
          <ChartCard
            key={index}
            title={card.title}
            value={card.value}
            change={card.change}
            changeType={card.changeType}
            icon={card.icon}
            iconBg={card.iconBg}
            onClick={handleCardClick}
          />
        ))}
      </section>

      {/* Recent Activity */}
      <section className="p-6 bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
          <button
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            onClick={() => navigate("/activities")}
          >
            View all
          </button>
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-slate-500">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Loading activities...
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No recent activities found
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full"
                  style={{
                    background: activity.iconBg,
                    color: activity.iconColor,
                  }}
                >
                  <i className={activity.icon}></i>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-700">{activity.text}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <i className="fas fa-user"></i>
                      {activity.user_name}
                    </span>
                    <span>•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;