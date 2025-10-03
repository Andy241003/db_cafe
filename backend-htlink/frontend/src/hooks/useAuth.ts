// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem('access_token');
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const result = !!(token && isAuth);
    console.log('🔧 useAuth initial state:', { token: !!token, isAuth, result });
    return result;
  });

  useEffect(() => {
    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      const token = localStorage.getItem('access_token');
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      setIsAuthenticated(!!(token && isAuth));
    };

    // Listen for custom auth events
    const handleAuthChange = () => {
      const token = localStorage.getItem('access_token');
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      const newState = !!(token && isAuth);
      console.log('🔧 useAuth handleAuthChange:', { token: !!token, isAuth, newState });
      setIsAuthenticated(newState);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const login = () => {
    console.log('🔧 useAuth login() called');
    setIsAuthenticated(true);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authStateChanged'));
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('access_token');
    localStorage.setItem('isAuthenticated', 'false');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tenant_code');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('tenant_name');
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authStateChanged'));
  };

  return { isAuthenticated, login, logout };
};