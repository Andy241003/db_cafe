// src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';

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

  return (
    <Router>
      <div className="App">
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