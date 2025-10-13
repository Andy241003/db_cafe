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
  // Try to get settings from localStorage (saved by Settings page)
  const storedSettings = localStorage.getItem('property_settings');
  let defaultLanguage = 'vi'; // Default fallback
  let supportedLanguages = ['en', 'vi', 'ja', 'ko', 'fr', 'zh'];
  
  if (storedSettings) {
    try {
      const parsed = JSON.parse(storedSettings);
      defaultLanguage = parsed.defaultLanguage || 'vi';
      supportedLanguages = parsed.supportedLanguages || supportedLanguages;
      console.log('✅ [usePropertySettings] Loaded from localStorage:', parsed);
    } catch (e) {
      console.error('❌ [usePropertySettings] Failed to parse property_settings:', e);
    }
  } else {
    // Fallback: check old locale keys
    const storedDefaultLang = localStorage.getItem('default_locale') || 
                             localStorage.getItem('locale');
    if (storedDefaultLang) {
      defaultLanguage = storedDefaultLang;
      console.log('⚠️ [usePropertySettings] Using fallback locale from localStorage:', storedDefaultLang);
    }
  }
  
  const settings = {
    defaultLanguage,
    fallbackLanguage: 'en',
    supportedLanguages,
    timezone: 'Asia/Ho_Chi_Minh',
    dateFormat: 'DD/MM/YYYY'
  };
  const loading = false;

  console.log('🔧 [usePropertySettings] Final default language:', settings.defaultLanguage);

  return { settings, loading };
};

