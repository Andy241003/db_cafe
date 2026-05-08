// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { autoDetectLanguage } from './utils/languageDetection';

const Login = lazy(() => import('./pages/Login'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const SharedSettingsLayout = lazy(() => import('./layouts/SharedSettingsLayout'));
const Media = lazy(() => import('./pages/Media'));
const CafeActivities = lazy(() => import('./pages/cafe/Activities'));
const CafeBranches = lazy(() => import('./pages/cafe/Branches'));
const CafeCareers = lazy(() => import('./pages/cafe/Careers'));
const CafeContact = lazy(() => import('./pages/cafe/Contact'));
const CafeDashboard = lazy(() => import('./pages/cafe/Dashboard'));
const CafeEvents = lazy(() => import('./pages/cafe/Events'));
const CafeGallery = lazy(() => import('./pages/cafe/Gallery'));
const CafeAbout = lazy(() => import('./pages/cafe/About'));
const CafeHome = lazy(() => import('./pages/cafe/Home'));
const CafeLanguages = lazy(() => import('./pages/cafe/Languages'));
const CafeLayout = lazy(() => import('./pages/cafe/CafeLayout'));
const CafeMenu = lazy(() => import('./pages/cafe/Menu'));
const CafePromotions = lazy(() => import('./pages/cafe/Promotions'));
const CafeSettings = lazy(() => import('./pages/cafe/Settings'));
const CafeSpace = lazy(() => import('./pages/cafe/Space'));
const CafeUsers = lazy(() => import('./pages/cafe/Users'));
const CafeTenants = lazy(() => import('./pages/cafe/Tenants'));

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

  const routeFallback = (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-slate-600">
      Loading...
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Suspense fallback={routeFallback}>
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
          </Suspense>
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

