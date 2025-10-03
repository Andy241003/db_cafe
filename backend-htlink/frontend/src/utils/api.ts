// src/utils/api.ts
// Utility function to auto-detect API base URL based on environment
export const getApiBaseUrl = (): string => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    console.log('Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return `${import.meta.env.VITE_API_URL}/api/v1`;
  }
  
  // Auto-detect based on current URL
  const { protocol, hostname } = window.location;
  
  console.log('Auto-detecting API URL - hostname:', hostname, 'protocol:', protocol);
  
  // For production or any HTTPS site, use same origin with HTTPS
  if (protocol === 'https:' || hostname.includes('link360.vn') || !hostname.includes('localhost')) {
    const apiUrl = `${protocol}//${hostname}/api/v1`;
    console.log('Using same-origin API URL (v2):', apiUrl);
    return apiUrl;
  }
  
  // Only for localhost development
  console.log('Using development API URL: http://localhost:8000/api/v1');
  return 'http://localhost:8000/api/v1';
};