// src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import AuthDebugger from './components/AuthDebugger';

function App() {
  // Direct localStorage check, bypass useAuth hook
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('access_token');
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const result = !!(token && isAuth);
    console.log('🔧 App.tsx initial auth check:', { token: !!token, isAuth, result });
    return result;
  });

  // Poll localStorage every 500ms for changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      const newState = !!(token && isAuth);
      
      if (newState !== isAuthenticated) {
        console.log('🔧 App.tsx auth state changed:', { 
          from: isAuthenticated, 
          to: newState, 
          token: !!token, 
          isAuth,
          pathname: window.location.pathname 
        });
        setIsAuthenticated(newState);
      }
    };

    // Check immediately
    checkAuth();

    // Poll every 500ms
    const interval = setInterval(checkAuth, 500);

    // Also listen for storage events
    const handleStorageChange = () => {
      console.log('🔧 App.tsx storage event triggered');
      checkAuth();
    };

    // Listen for custom auth events
    const handleAuthChange = () => {
      console.log('🔧 App.tsx authStateChanged event triggered');
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

  console.log('🔧 App.tsx render - isAuthenticated:', isAuthenticated, 'pathname:', window.location.pathname);

  return (
    <Router>
      <div className="App">
        <AuthDebugger />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />} 
          />
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;