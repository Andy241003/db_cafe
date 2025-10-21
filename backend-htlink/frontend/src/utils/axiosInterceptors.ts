// src/utils/axiosInterceptors.ts
// Shared axios interceptors for handling auth and permission errors

import type { AxiosInstance, AxiosError } from 'axios';
import { t } from './i18n';

/**
 * Setup interceptors for axios instance to handle:
 * - 401 Unauthorized: Token expired, redirect to login
 * - 403 Forbidden: Permission denied, show translated error message
 */
export const setupAxiosInterceptors = (axiosInstance: AxiosInstance): void => {
  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ detail?: string }>) => {
      if (error.response?.status === 401) {
        // Token expired or invalid, clear storage and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('currentUser');
        localStorage.setItem('isAuthenticated', 'false');
        
        // Redirect to login page
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        // Permission denied - translate error message
        const backendMessage = error.response?.data?.detail || '';
        
        // Map backend error messages to i18n keys
        let translatedMessage = t('permissionDenied');
        
        const lowerMessage = backendMessage.toLowerCase();
        
        // Check for specific permission errors
        if (lowerMessage.includes('create')) {
          if (lowerMessage.includes('user')) {
            translatedMessage = t('cannotCreateUser');
          } else {
            translatedMessage = t('cannotCreateContent');
          }
        } else if (lowerMessage.includes('modify') || lowerMessage.includes('update') || lowerMessage.includes('edit')) {
          if (lowerMessage.includes('user')) {
            translatedMessage = t('cannotEditUser');
          } else {
            translatedMessage = t('cannotEditContent');
          }
        } else if (lowerMessage.includes('delete')) {
          if (lowerMessage.includes('user')) {
            translatedMessage = t('cannotDeleteUser');
          } else {
            translatedMessage = t('cannotDeleteContent');
          }
        }
        
        // Replace error detail with translated message
        if (error.response.data) {
          error.response.data.detail = translatedMessage;
        }
      }
      return Promise.reject(error);
    }
  );
};
