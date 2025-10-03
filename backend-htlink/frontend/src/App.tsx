// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated } = useAuth();
  console.log('🔧 App.tsx isAuthenticated:', isAuthenticated);

  // Debug: Check localStorage on every render
  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    const isAuth = localStorage.getItem('isAuthenticated');
    console.log('🔧 App.tsx useEffect - localStorage check:', { 
      hasToken: !!token, 
      isAuth, 
      hookState: isAuthenticated,
      pathname: window.location.pathname 
    });
  });

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