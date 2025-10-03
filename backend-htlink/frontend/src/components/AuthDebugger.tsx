// AuthDebugger.tsx - Component to debug authentication state
import { useEffect, useState } from 'react';

const AuthDebugger = () => {
  const [debugInfo, setDebugInfo] = useState({
    token: '',
    isAuthenticated: '',
    currentUser: '',
    tenantCode: '',
    pathname: '',
    timestamp: ''
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        token: localStorage.getItem('access_token')?.substring(0, 20) + '...' || 'null',
        isAuthenticated: localStorage.getItem('isAuthenticated') || 'null',
        currentUser: localStorage.getItem('currentUser')?.substring(0, 50) + '...' || 'null',
        tenantCode: localStorage.getItem('tenant_code') || 'null',
        pathname: window.location.pathname,
        timestamp: new Date().toLocaleTimeString()
      });
    };

    // Initial check
    updateDebugInfo();

    // Update every second
    const interval = setInterval(updateDebugInfo, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div><strong>Auth Debug Info</strong></div>
      <div>Token: {debugInfo.token}</div>
      <div>IsAuth: {debugInfo.isAuthenticated}</div>
      <div>User: {debugInfo.currentUser}</div>
      <div>Tenant: {debugInfo.tenantCode}</div>
      <div>Path: {debugInfo.pathname}</div>
      <div>Time: {debugInfo.timestamp}</div>
    </div>
  );
};

export default AuthDebugger;