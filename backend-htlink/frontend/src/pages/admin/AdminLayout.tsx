import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import VRHotelSidebar from '../../components/layout/VRHotelSidebar';
import ProtectedRoute from '../../components/ProtectedRoute';
import { getCurrentUserFromStorage, isAuthenticated } from '../../services/api';

// Admin pages - lazy load to avoid type import issues
const TenantSettings = lazy(() => import('./Tenants'));
const Properties = lazy(() => import('./Properties'));
const Users = lazy(() => import('./Users'));
const Languages = lazy(() => import('./Languages'));

const AdminLayout: React.FC = () => {
  const location = useLocation();

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

  // Map routes to page titles
  const getPageInfo = (pathname: string) => {
    switch (pathname) {
      case '/admin/tenants':
        return { title: 'Tenant Management', breadcrumb: 'Core Admin / Tenants' };
      case '/admin/properties':
        return { title: 'Property Management', breadcrumb: 'Core Admin / Properties' };
      case '/admin/users':
        return { title: 'User Management', breadcrumb: 'Core Admin / Users' };
      case '/admin/languages':
        return { title: 'Language Management', breadcrumb: 'Core Admin / Languages' };
      default:
        return { title: 'Core Admin', breadcrumb: 'Core Admin' };
    }
  };

  const pageInfo = getPageInfo(location.pathname);

  const handleSearch = (_query: string) => {
    // Implement search logic
  };

  const handleNotifications = () => {
    // Implement notification logic
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {showVRHotelSidebar ? <VRHotelSidebar /> : <Sidebar />}
      <div className="sm:ml-64">
        <Header 
          title={pageInfo.title} 
          breadcrumb={pageInfo.breadcrumb}
          onSearch={handleSearch}
          onNotificationClick={handleNotifications}
        />
        <main className="pt-20 px-6 pb-6">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-4 text-sm text-slate-500">Loading...</p>
              </div>
            </div>
          }>
            <Routes>
            {/* Tenants - OWNER only */}
            <Route
              path="/tenants"
              element={
                <ProtectedRoute requireOwner>
                  <TenantSettings />
                </ProtectedRoute>
              }
            />

            {/* Properties - ADMIN and above */}
            <Route
              path="/properties"
              element={
                <ProtectedRoute requireAdmin>
                  <Properties />
                </ProtectedRoute>
              }
            />

            {/* Users - ADMIN and above */}
            <Route
              path="/users"
              element={
                <ProtectedRoute requireAdmin>
                  <Users />
                </ProtectedRoute>
              }
            />

            {/* Languages - All authenticated users */}
            <Route
              path="/languages"
              element={<Languages />}
            />

            {/* Redirect /admin to /admin/tenants */}
            <Route path="/" element={<Navigate to="/admin/tenants" replace />} />
          </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
