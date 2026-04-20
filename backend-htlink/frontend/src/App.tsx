// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
// MainLayout & DashboardSelection - REMOVED (Cafe only)
// import MainLayout from './layouts/MainLayout';
// import DashboardSelection from './pages/DashboardSelection';
import Login from './pages/Login';

// Admin imports
import AdminLayout from './pages/admin/AdminLayout';

// Shared imports
import SharedSettingsLayout from './layouts/SharedSettingsLayout';
import Media from './pages/Media';

// VR Hotel imports - REMOVED (Cafe only)
// import VRHotelActivities from './pages/vr-hotel/Activities';
// import VRHotelContact from './pages/vr-hotel/Contact';
// ... (all VR Hotel imports removed)

// Travel Link imports - REMOVED (Cafe only)
// import MainLayout from './layouts/MainLayout';
// import DashboardSelection from './pages/DashboardSelection';

// Cafe imports
import CafeActivities from './pages/cafe/Activities';
import CafeBranches from './pages/cafe/Branches';
import CafeCareers from './pages/cafe/Careers';
import CafeContact from './pages/cafe/Contact';
import CafeDashboard from './pages/cafe/Dashboard';
import CafeEvents from './pages/cafe/Events';
import CafeGallery from './pages/cafe/Gallery';
import CafeAbout from './pages/cafe/About';
import CafeHome from './pages/cafe/Home';
import CafeLanguages from './pages/cafe/Languages';
import CafeLayout from './pages/cafe/CafeLayout';
import CafeMenu from './pages/cafe/Menu';
import CafePromotions from './pages/cafe/Promotions';
import CafeSettings from './pages/cafe/Settings';
import CafeSpace from './pages/cafe/Space';
import CafeUsers from './pages/cafe/Users';
import CafeTenants from './pages/cafe/Tenants';
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

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      const newState = !!(token && isAuth);
      
      setIsAuthenticated((prev) => (prev === newState ? prev : newState));
    };

    // Check immediately
    checkAuth();

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
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

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
            
            {/* Dashboard Selection - REMOVED (Cafe only) */}
            {/* <Route path="/dashboard-selection" element={...} /> */}
            
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
            
            {/* VR Hotel Routes - REMOVED (Cafe only) */}
            {/* <Route path="/vr-hotel/*" element={...} /> */}

            {/* Cafe Routes */}
            <Route 
              path="/cafe/*" 
              element={
                isAuthenticated ? (
                  <ProtectedRoute>
                    <Routes>
                      <Route element={<CafeLayout />}>
                        <Route path="" element={<CafeDashboard />} />
                        <Route path="activities" element={<CafeActivities />} />
                        <Route path="users" element={<CafeUsers />} />
                        <Route path="tenants" element={<ProtectedRoute requireAdmin><CafeTenants /></ProtectedRoute>} />
                        <Route path="home" element={<CafeHome />} />
                        <Route path="about" element={<CafeAbout />} />
                        <Route path="menu" element={<CafeMenu />} />
                        <Route path="space" element={<CafeSpace />} />
                        <Route path="branches" element={<CafeBranches />} />
                        <Route path="events" element={<CafeEvents />} />
                        <Route path="careers" element={<CafeCareers />} />
                        <Route path="promotions" element={<CafePromotions />} />
                        <Route path="gallery" element={<CafeGallery />} />
                        <Route path="media" element={<Media defaultSource="cafe" />} />
                        <Route path="contact" element={<CafeContact />} />
                        <Route path="languages" element={<CafeLanguages />} />
                        <Route path="settings" element={<CafeSettings />} />
                      </Route>
                    </Routes>
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            {/* Travel Link Routes - REMOVED (Cafe only) */}
            {/* Default route: redirect to Cafe */}
            <Route 
              path="/" 
              element={isAuthenticated ? <Navigate to="/cafe" replace /> : <Navigate to="/login" replace />} 
            />
            <Route path="/*" element={<Navigate to="/cafe" replace />} />
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

