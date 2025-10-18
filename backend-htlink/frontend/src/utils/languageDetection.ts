/**
 * Auto Language Detection Utility
 * Detects user's browser language and sets locale automatically
 * Only works if Auto Language Detection is enabled in Settings
 */

interface PropertySettings {
  autoLanguageDetection?: boolean;
  defaultLanguage?: string;
  supportedLanguages?: string[];
}

/**
 * Get property settings from localStorage
 * ONLY uses localStorage - no API calls
 * Settings page is responsible for keeping localStorage in sync with database
 */
const getPropertySettings = (): PropertySettings => {
  try {
    const settingsJson = localStorage.getItem('property_settings');
    if (settingsJson) {
      return JSON.parse(settingsJson);
    }
  } catch (error) {
    console.error('Failed to parse property settings:', error);
  }
  return {};
};

/**
 * Auto-detect browser language and set locale if enabled
 * This should be called once on app initialization or page load
 */
export const autoDetectLanguage = async (): Promise<void> => {
  // Check if locale is already set by user
  const existingLocale = localStorage.getItem('locale');
  
  // If user already selected a language manually, don't override
  const userSelectedLocale = localStorage.getItem('user_selected_locale');
  if (userSelectedLocale === 'true') {
    return;
  }

  // Get property settings to check if auto-detection is enabled
  // ONLY read from localStorage (no API calls)
  const propertySettings = getPropertySettings();
  
  // Check if auto language detection is enabled (default to true for backward compatibility)
  // This value is set by Settings page when user saves
  const autoDetectEnabled = propertySettings.autoLanguageDetection ?? true;
  
  if (!autoDetectEnabled) {
    return;
  }

  // If locale already exists, check if it's from auto-detection
  const autoDetected = localStorage.getItem('locale_auto_detected');
  if (existingLocale && autoDetected !== 'true') {
    return;
  }

  // Get browser language (e.g., "en-US", "vi-VN", "ja-JP")
  const browserLang = navigator.language || (navigator as any).userLanguage;
  const languageCode = browserLang.split('-')[0].toLowerCase(); // Extract "en" from "en-US"
  
  // Get supported languages from settings or use default list
  const supportedLanguages = propertySettings.supportedLanguages || 
                            ['en', 'vi', 'ja', 'ko', 'zh', 'fr', 'de', 'es'];
  
  // Set locale if browser language is supported, otherwise use default
  const defaultLanguage = propertySettings.defaultLanguage || 'en';
  const detectedLocale = supportedLanguages.includes(languageCode) ? languageCode : defaultLanguage;
  
  // Only set if different from current
  if (detectedLocale !== existingLocale) {
    localStorage.setItem('locale', detectedLocale);
    localStorage.setItem('locale_auto_detected', 'true');
    
    // Trigger language change event for other components
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: detectedLocale } }));
  }
};

/**
 * Mark locale as user-selected (to prevent auto-detection override)
 */
export const markLocaleAsUserSelected = (locale: string): void => {
  localStorage.setItem('locale', locale);
  localStorage.setItem('user_selected_locale', 'true');
  localStorage.removeItem('locale_auto_detected');
};

/**
 * Reset locale to allow auto-detection again
 */
export const resetLocaleSelection = (): void => {
  localStorage.removeItem('user_selected_locale');
  localStorage.removeItem('locale_auto_detected');
  localStorage.removeItem('locale');
};

/**
 * Check if auto language detection is enabled
 * Reads from localStorage only (no API calls)
 */
export const isAutoDetectEnabled = (): boolean => {
  const propertySettings = getPropertySettings();
  return propertySettings.autoLanguageDetection ?? true;
};
