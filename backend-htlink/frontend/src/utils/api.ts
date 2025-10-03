// src/utils/api.ts
// Utility function to auto-detect API base URL based on environment
export const getApiBaseUrl = (): string => {
  console.log('DEBUG: getApiBaseUrl called');
  console.log('DEBUG: VITE_API_URL =', import.meta.env.VITE_API_URL);
  console.log('DEBUG: NODE_ENV =', import.meta.env.NODE_ENV);
  
  // If VITE_API_URL is explicitly set, use it (HIGHEST PRIORITY)
  if (import.meta.env.VITE_API_URL) {
    console.log('Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return `${import.meta.env.VITE_API_URL}/api/v1`;
  }
  
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    console.log('Server-side rendering detected, using default HTTPS');
    return 'https://travel.link360.vn/api/v1';
  }
  
  // Auto-detect based on current URL
  const { protocol, hostname } = window.location;
  
  console.log('Auto-detecting API URL - hostname:', hostname, 'protocol:', protocol);
  
  // For production domains, always use HTTPS
  if (hostname.includes('travel.link360.vn') || hostname.includes('link360.vn')) {
    const apiUrl = `https://${hostname}/api/v1`;
    console.log('Using production HTTPS API URL (v3):', apiUrl);
    return apiUrl;
  }
  
  // For any HTTPS site, use same origin with HTTPS
  if (protocol === 'https:' || !hostname.includes('localhost')) {
    const apiUrl = `${protocol}//${hostname}/api/v1`;
    console.log('Using same-origin API URL (v3):', apiUrl);
    return apiUrl;
  }
  
  // Only for localhost development
  console.log('Using development API URL: http://localhost:8000/api/v1');
  return 'http://localhost:8000/api/v1';
};