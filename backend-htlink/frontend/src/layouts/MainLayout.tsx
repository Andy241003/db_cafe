// src/layouts/MainLayout.tsx
import React from 'react';
import { Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/api';
import Sidebar from '../components/layout/Sidebar'; // Corrected import path
import Header from '../components/layout/Header';   // Corrected import path
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import Settings from '../pages/Settings';
import TenantSettings from '../pages/TenantSettings';
import Categories from '../pages/Categories';
import Features from '../pages/Features';
import Properties from '../pages/Properties';
import Media from '../pages/Media';
import Analytics from '../pages/Analytics';
import Activities from '../pages/Activities';

const MainLayout: React.FC = () => {
  const location = useLocation();

  // Check authentication
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Map routes to page titles and breadcrumbs
  const getPageInfo = (pathname: string) => {
    switch (pathname) {
      case '/':
        return { title: 'Dashboard', breadcrumb: 'Main / Dashboard' };
      case '/users':
        return { title: 'Users & Roles', breadcrumb: 'Management / Users & Roles' };
      case '/settings':
        return { title: 'Settings', breadcrumb: 'Management / Settings' };
      case '/tenant-settings':
        return { title: 'Tenant Settings', breadcrumb: 'Management / Tenant Settings' };
      case '/reports':
        return { title: 'Reports', breadcrumb: 'Analytics / Reports' };
      case '/categories':
        return { title: 'Categories', breadcrumb: 'Main / Categories' };
      case '/features':
        return { title: 'Features', breadcrumb: 'Main / Features' };
      case '/properties':
        return { title: 'Properties', breadcrumb: 'Main / Properties' };
      case '/media':
        return { title: 'Media Library', breadcrumb: 'Content / Media Library' };
      case '/analytics':
        return { title: 'Analytics', breadcrumb: 'Content / Analytics' };
      case '/activities':
        return { title: 'Activity Log', breadcrumb: 'Management / Activity Log' };
      default:
        return { title: 'Dashboard', breadcrumb: 'Home / Dashboard' };
    }
  };

  const pageInfo = getPageInfo(location.pathname);

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    // Implement global search logic here
  };

  const handleNotifications = () => {
    console.log('Notification icon clicked');
    // Implement notification logic here
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="sm:ml-64">
        <Header 
          title={pageInfo.title} 
          breadcrumb={pageInfo.breadcrumb}
          onSearch={handleSearch}
          onNotificationClick={handleNotifications}
        />
        <main className="pt-20 px-6 pb-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings/*" element={<Settings />} />
            <Route path="/tenant-settings" element={<TenantSettings />} />
            <Route path="/categories/*" element={<Categories />} />
            <Route path="/features/*" element={<Features />} />
            <Route path="/properties/*" element={<Properties />} />
            <Route path="/media" element={<Media />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/activities" element={<Activities />} />
          </Routes>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;