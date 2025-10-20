// src/utils/api.ts
// Utility function to auto-detect API base URL based on environment
export const getApiBaseUrl = (): string => {
  // During Vite development, use absolute URL to backend
  // This bypasses proxy issues and connects directly to backend
  if (import.meta.env.DEV) {
    // Use VITE_API_URL if set, otherwise default to localhost:8000
    return import.meta.env.VITE_API_URL 
      ? `${import.meta.env.VITE_API_URL}/api/v1`
      : 'http://localhost:8000/api/v1';
  }

  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return 'https://travel.link360.vn/api/v1';
  }

  // Auto-detect based on current URL (PRIORITY: Use same domain as frontend)
  const { protocol, hostname } = window.location;

  // For new production domain app.botonblue.com, use backend at travel.link360.vn
  if (hostname.includes('app.botonblue.com')) {
    return 'https://travel.link360.vn/api/v1';
  }

  // For old production domains or backend domain itself
  if (hostname.includes('travel.link360.vn') || hostname.includes('link360.vn') || hostname.includes('trip360.vn')) {
    return `https://${hostname}/api/v1`;
  }

  // For any HTTPS site, use same origin with HTTPS
  if (protocol === 'https:' || !hostname.includes('localhost')) {
    return `${protocol}//${hostname}/api/v1`;
  }

  // If VITE_API_URL is explicitly set (for localhost dev), use it
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api/v1`;
  }

  // Only for localhost development fallback
  return 'http://localhost:8000/api/v1';
};