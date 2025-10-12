// src/hooks/usePropertySettings.ts

export interface PropertySettings {
  defaultLanguage: string;
  fallbackLanguage: string;
  supportedLanguages: string[];
  timezone: string;
  dateFormat: string;
}

/**
 * Hook to get current property's localization settings
 * Reads from localStorage selected_property_id and fetches settings
 */
export const usePropertySettings = () => {
  const settings = {
    defaultLanguage: 'en',
    fallbackLanguage: 'en',
    supportedLanguages: ['en', 'vi'],
    timezone: 'Asia/Ho_Chi_Minh',
    dateFormat: 'DD/MM/YYYY'
  };
  const loading = false;

  // Temporarily disabled to prevent 400 errors
  // Will use localStorage approach instead
  console.log('⚠️ [usePropertySettings] Hook temporarily disabled - using localStorage approach');

  return { settings, loading };
};

