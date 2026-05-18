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

  const configuredUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return configuredUrl || '/api/v1';
  }

  // Auto-detect based on current URL and prefer same-origin when no explicit API URL is configured.
  const { protocol, hostname } = window.location;

  // If we are running on localhost or 127.0.0.1, rely on the Vite/dev proxy or current origin.
  // This takes PRIORITY over VITE_API_URL to ensure proxy works in development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return '/api/v1';
  }

  if (configuredUrl) {
    // If VITE_API_URL accidentally points to an internal Docker hostname,
    // fall back to same-origin so browsers never try to resolve internal names.
    if (configuredUrl.includes('backend:8000') && hostname !== 'backend') {
      return `${protocol}//${hostname}/api/v1`;
    }

    return configuredUrl;
  }

  // For production-like environments without an explicit API URL, use same origin.
  return `${protocol}//${hostname}/api/v1`;
};
