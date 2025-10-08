// src/utils/api.ts
// Utility function to auto-detect API base URL based on environment
export const getApiBaseUrl = (): string => {
  // During Vite development, prefer the Vite dev server proxy by returning a
  // relative path. This avoids sending requests directly to the backend host
  // and prevents CORS issues in dev.
  if (import.meta.env.DEV) {
    return '/api/v1';
  }

  // If VITE_API_URL is explicitly set in non-dev environments, use it.
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api/v1`;
  }

  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return 'https://travel.link360.vn/api/v1';
  }
  
  // Auto-detect based on current URL
  const { protocol, hostname } = window.location;
  
  // For production domains, always use HTTPS
  if (hostname.includes('travel.link360.vn') || hostname.includes('link360.vn')) {
    return `https://${hostname}/api/v1`;
  }
  
  // For any HTTPS site, use same origin with HTTPS
  if (protocol === 'https:' || !hostname.includes('localhost')) {
    return `${protocol}//${hostname}/api/v1`;
  }
  
  // Only for localhost development
  return 'http://localhost:8000/api/v1';
};