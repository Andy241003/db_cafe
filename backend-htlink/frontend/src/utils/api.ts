// src/utils/api.ts
// Utility function to auto-detect API base URL based on environment
export const getApiBaseUrl = (): string => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    console.log('Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return `${import.meta.env.VITE_API_URL}/api/v1`;
  }
  
  // Auto-detect based on current domain
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  console.log('Auto-detecting API URL - hostname:', hostname, 'protocol:', protocol);
  
  if (hostname.includes('travel.link360.vn')) {
    // Production domain - use same protocol as frontend
    const apiUrl = `${protocol}//${hostname}/api/v1`;
    console.log('Using production API URL:', apiUrl);
    return apiUrl;
  }
  
  // Default for development
  console.log('Using development API URL: http://localhost:8000/api/v1');
  return 'http://localhost:8000/api/v1';
};