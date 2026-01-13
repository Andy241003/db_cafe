// src/layouts/SharedSettingsLayout.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import VRHotelSidebar from '../components/layout/VRHotelSidebar';
import Settings from '../pages/Settings';
import { getCurrentUserFromStorage, isAuthenticated } from '../services/api';

const SharedSettingsLayout: React.FC = () => {
  // Check authentication
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Get current user to determine which sidebar to show
  const currentUser = getCurrentUserFromStorage();
  const serviceAccess = currentUser?.service_access;
  
  // Determine which sidebar to show based on service_access and saved context
  // service_access: 0 = Travel Link only, 1 = VR Hotel only, 2 = Both
  const savedContext = localStorage.getItem('admin_context');
  
  let showVRHotelSidebar = false;
  if (serviceAccess === 1) {
    // VR Hotel only - always show VR Hotel sidebar
    showVRHotelSidebar = true;
  } else if (serviceAccess === 2) {
    // Both services - use saved context
    showVRHotelSidebar = savedContext === 'vr-hotel';
  }
  // serviceAccess === 0 (Travel Link only) defaults to false
  
  const SidebarComponent = showVRHotelSidebar ? VRHotelSidebar : Sidebar;

  const pageInfo = {
    title: 'Settings',
    breadcrumb: showVRHotelSidebar ? 'VR Hotel / Settings' : 'Travel Link / Settings'
  };

  const handleSearch = (_query: string) => {
    // Implement search logic
  };

  const handleNotifications = () => {
    // Implement notification logic
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <SidebarComponent />
      <div className="sm:ml-64">
        <Header 
          title={pageInfo.title} 
          breadcrumb={pageInfo.breadcrumb}
          onSearch={handleSearch}
          onNotificationClick={handleNotifications}
        />
        <main className="pt-20 px-6 pb-6">
          <Settings />
        </main>
      </div>
    </div>
  );
};

export default SharedSettingsLayout;
