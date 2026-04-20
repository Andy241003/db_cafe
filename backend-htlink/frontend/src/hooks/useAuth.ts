// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem('access_token');
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    return !!(token && isAuth);
  });

  // Function to check authentication status
  const checkAuthStatus = () => {
    const token = localStorage.getItem('access_token');
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const newState = !!(token && isAuth);
    setIsAuthenticated((prev) => (prev === newState ? prev : newState));
    return newState;
  };

  useEffect(() => {
    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    // Listen for custom auth events
    const handleAuthChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authStateChanged'));
  };

  const logout = () => {
    setIsAuthenticated(false);
    
    // Clear ALL localStorage to prevent any cache issues
    localStorage.clear();
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authStateChanged'));
    
    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  return { isAuthenticated, login, logout };
};
