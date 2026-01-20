// src/layouts/MainLayout.tsx
import React from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Activities from '../pages/Activities';
import Analytics from '../pages/Analytics';
import Categories from '../pages/Categories';
import Dashboard from '../pages/Dashboard';
import Features from '../pages/Features';
import Media from '../pages/Media';
import { isAuthenticated } from '../services/api';

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
        return { title: 'Dashboard', breadcrumb: 'Travel Link / Dashboard' };
      case '/categories':
        return { title: 'Categories', breadcrumb: 'Travel Link / Categories' };
      case '/features':
        return { title: 'Features', breadcrumb: 'Travel Link / Features' };
      case '/media':
        return { title: 'Media Library', breadcrumb: 'Travel Link / Media' };
      case '/analytics':
        return { title: 'Analytics', breadcrumb: 'Travel Link / Analytics' };
      case '/activities':
        return { title: 'Activity Log', breadcrumb: 'Travel Link / Activity Log' };
      default:
        return { title: 'Dashboard', breadcrumb: 'Travel Link / Dashboard' };
    }
  };

  const pageInfo = getPageInfo(location.pathname);

  const handleSearch = (_query: string) => {
    // Implement global search logic here
  };

  const handleNotifications = () => {
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
            <Route path="/categories/*" element={<Categories />} />
            <Route path="/features/*" element={<Features />} />
            <Route path="/media" element={<Media defaultSource="travel" />} />
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