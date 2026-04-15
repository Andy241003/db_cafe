// src/utils/api.ts
// Utility function to auto-detect API base URL based on environment

const normalizeApiBaseUrl = (rawUrl?: string): string | null => {
  if (!rawUrl) {
    return null;
  }

  const trimmedUrl = rawUrl.trim().replace(/\/$/, '');
  if (!trimmedUrl) {
    return null;
  }

  if (trimmedUrl.endsWith('/api/v1')) {
    return trimmedUrl;
  }

  if (trimmedUrl.endsWith('/api')) {
    return `${trimmedUrl}/v1`;
  }

  return `${trimmedUrl}/api/v1`;
};

export const getApiBaseUrl = (): string => {
  // During Vite development, use relative URL with /api/v1 prefix to leverage Vite proxy
  // The proxy in vite.config.ts forwards /api requests to backend
  if (import.meta.env.DEV) {
    // Use /api/v1 as base for proxy
    return '/api/v1';
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

  // If we are running on localhost or 127.0.0.1, rely on the Vite/dev proxy or current origin.
  // This takes PRIORITY over VITE_API_URL to ensure proxy works in development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return '/api/v1';
  }

  const configuredUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');

  if (configuredUrl) {
    return normalizeApiBaseUrl(configuredUrl) || '/api/v1';
  }

  // If VITE_API_URL explicitly points to the internal Docker backend hostname,
  // do not expose that to the browser from a non-Docker client.
  if (configuredUrl && configuredUrl.includes('backend:8000') && hostname !== 'backend') {
    return '/api/v1';
  }

  // If VITE_API_URL is explicitly set in production, prefer it over hostname inference.
  if (configuredUrl) {
    return normalizeApiBaseUrl(configuredUrl) || '/api/v1';
  }

  // For old production domains or backend domain itself
  if (hostname.includes('travel.link360.vn') || hostname.includes('link360.vn') || hostname.includes('trip360.vn')) {
    return `https://${hostname}/api/v1`;
  }

  // For any HTTPS site, use same origin with HTTPS
  if (protocol === 'https:' && !hostname.includes('localhost')) {
    return `${protocol}//${hostname}/api/v1`;
  }

  // For non-localhost HTTP environments, use same origin as a fallback.
  return `${protocol}//${hostname}/api/v1`;
};
