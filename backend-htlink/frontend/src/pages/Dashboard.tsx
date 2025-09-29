// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import ChartCard from "../components/ChartCard";
import { useNavigate } from "react-router-dom";
import { authAPI, categoriesAPI, featuresAPI, type User } from "../services/api";

interface ActivityItem {
  id: string;
  type: "add" | "edit" | "upload" | "user" | "system";
  text: string;
  time: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

const Dashboard: React.FC = () => {
  console.log('🚀 Dashboard component is being rendered!');
  
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [stats, setStats] = useState({
    totalCategories: 0,
    activeFeatures: 0,
    pageViews: 0,
    newCategoriesThisMonth: 0,
    featuresAddedThisWeek: 0
  });

  useEffect(() => {
    console.log('Dashboard: Component mounted');
    const loadDashboardData = async () => {
      try {
        console.log('Dashboard: Loading data...');
        
        // Load current user
        const userData = await authAPI.getCurrentUser();
        setCurrentUser(userData);

        // Load statistics with fallback
        const [categories, features] = await Promise.all([
          categoriesAPI.getAll().catch(() => []),
          featuresAPI.getAll().catch(() => [])
        ]);

        console.log('Dashboard: Data loaded successfully', { categories: categories.length, features: features.length });
        
        setStats({
          totalCategories: categories.length,
          activeFeatures: features.length,
          pageViews: Math.floor(Math.random() * 10000), // Mock data for now
          newCategoriesThisMonth: Math.floor(categories.length * 0.2),
          featuresAddedThisWeek: Math.floor(features.length * 0.1)
        });
        
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
      change: `${stats.featuresAddedThisWeek} added this week`,
      changeType: "positive" as const,
      icon: "fas fa-puzzle-piece",
      iconBg: "#10b981",
    },
    {
      title: "Page Views",
      value: "2,847",
      change: "18% vs last month",
      changeType: "positive" as const,
      icon: "fas fa-eye",
      iconBg: "#8b5cf6",
    },
  ];

  const activities: ActivityItem[] = [
    {
      id: "1",
      type: "add",
      text: 'New feature "WiFi Information" was added to Services category',
      time: "2 hours ago",
      icon: "fas fa-plus",
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
    },
    {
      id: "2",
      type: "edit",
      text: 'Post "Check-in Process" was updated with new translations',
      time: "4 hours ago",
      icon: "fas fa-edit",
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
    },
    {
      id: "3",
      type: "upload",
      text: "5 new images uploaded to media library",
      time: "6 hours ago",
      icon: "fas fa-image",
      iconBg: "#fef3c7",
      iconColor: "#d97706",
    },
    {
      id: "4",
      type: "user",
      text: 'New admin user "Jane Smith" was added',
      time: "1 day ago",
      icon: "fas fa-user-plus",
      iconBg: "#fce7f3",
      iconColor: "#be185d",
    },
    {
      id: "5",
      type: "system",
      text: "Korean language support was enabled",
      time: "2 days ago",
      icon: "fas fa-globe",
      iconBg: "#f3e8ff",
      iconColor: "#7c3aed",
    },
  ];

  const handleCardClick = (title: string) => {
    console.log(`Clicked on ${title} card`);
    // Add navigation or modal logic here
  };

  const handleQuickAction = (action: string) => {
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
            <button
              className="px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-400"
              onClick={() => {
                console.log('Current domain:', window.location.hostname);
                console.log('Current tenant:', localStorage.getItem('tenant_domain'));
                console.log('Current token:', localStorage.getItem('access_token') ? 'EXISTS' : 'MISSING');
              }}
            >
              Debug Auth
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
            onClick={() => handleCardClick(card.title)}
          />
        ))}
      </section>

      {/* Recent Activity */}
      <section className="p-6 bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700">View all</button>
        </div>
        <div className="space-y-4">
          {activities.map((activity) => (
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
                <div className="text-xs text-slate-400">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;