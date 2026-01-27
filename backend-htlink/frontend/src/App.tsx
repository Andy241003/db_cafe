// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import DashboardSelection from './pages/DashboardSelection';
import Login from './pages/Login';

// Admin imports
import AdminLayout from './pages/admin/AdminLayout';

// Shared imports
import SharedSettingsLayout from './layouts/SharedSettingsLayout';
import Media from './pages/Media';

// VR Hotel imports
import VRHotelActivities from './pages/vr-hotel/Activities';
import VRHotelContact from './pages/vr-hotel/Contact';
import VRHotelDashboard from './pages/vr-hotel/Dashboard';
import VRHotelDining from './pages/vr-hotel/Dining';
import VRHotelExportImport from './pages/vr-hotel/ExportImport';
import VRHotelFacilities from './pages/vr-hotel/Facilities';
import VRHotelIntroduction from './pages/vr-hotel/Introduction';
import VRHotelOffers from './pages/vr-hotel/Offers';
import VRHotelPolicies from './pages/vr-hotel/Policies';
import VRHotelRooms from './pages/vr-hotel/Rooms';
import VRHotelRules from './pages/vr-hotel/Rules';
import VRHotelServices from './pages/vr-hotel/Services';
import VRHotelSettings from './pages/vr-hotel/Settings';
import VRHotelLayout from './pages/vr-hotel/VRHotelLayout';

import { autoDetectLanguage } from './utils/languageDetection';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  // Direct localStorage check, bypass useAuth hook
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('access_token');
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    return !!(token && isAuth);
  });

  // Poll localStorage every 500ms for changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      const newState = !!(token && isAuth);
      
      if (newState !== isAuthenticated) {
        setIsAuthenticated(newState);
      }
    };

    // Check immediately
    checkAuth();

    // Poll every 500ms
    const interval = setInterval(checkAuth, 500);

    // Listen for storage events
    const handleStorageChange = () => {
      checkAuth();
    };

    // Listen for custom auth events
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, [isAuthenticated]);

  // Auto-detect browser language on app mount
  useEffect(() => {
    // Only run if user is authenticated
    if (isAuthenticated) {
      autoDetectLanguage().catch(error => {
        console.error('Failed to auto-detect language:', error);
      });
    }
  }, [isAuthenticated]); // Run when auth state changes

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard-selection" 
              element={isAuthenticated ? <DashboardSelection /> : <Navigate to="/login" replace />} 
            />
            
            {/* Core Admin Routes - Super Admin only */}
            <Route 
              path="/admin/*" 
              element={
                isAuthenticated ? (
                  <ProtectedRoute requireOwner>
                    <AdminLayout />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            
            {/* Shared Settings Route - Accessible by all authenticated users */}
            <Route 
              path="/settings" 
              element={
                isAuthenticated ? (
                  <SharedSettingsLayout />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            
            {/* VR Hotel Routes */}
            <Route 
              path="/vr-hotel/*" 
              element={
                isAuthenticated ? (
                  <ProtectedRoute requireService="vr-hotel">
                    <Routes>
                      <Route element={<VRHotelLayout />}>
                        <Route path="" element={<VRHotelDashboard />} />
                        <Route path="introduction" element={<VRHotelIntroduction />} />
                        <Route path="services" element={<VRHotelServices />} />
                        <Route path="rooms" element={<VRHotelRooms />} />
                        <Route path="dining" element={<VRHotelDining />} />
                        <Route path="offers" element={<VRHotelOffers />} />
                        <Route path="facilities" element={<VRHotelFacilities />} />
                        <Route path="media" element={<Media defaultSource="vr_hotel" />} />
                        <Route path="policies" element={<VRHotelPolicies />} />
                        <Route path="rules" element={<VRHotelRules />} />
                        <Route path="contact" element={<VRHotelContact />} />
                        <Route path="settings" element={<VRHotelSettings />} />
                        <Route path="activities" element={<VRHotelActivities />} />
                        <Route path="export-import" element={<VRHotelExportImport />} />
                      </Route>
                    </Routes>
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            {/* Travel Link Routes (MainLayout) */}
            <Route 
              path="/" 
              element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />} 
            />
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </div>
      </Router>
      {/* Modern Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;