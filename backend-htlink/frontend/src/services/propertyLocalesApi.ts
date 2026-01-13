/**
 * Property Locales API
 * Unified locale management for both Travel Link and VR Hotel
 */
import apiClient from './api';

export interface PropertyLocale {
  id: number;
  tenant_id: number;
  property_id: number;
  locale_code: string;
  is_default: boolean;
  is_active: boolean;
}

export interface PropertyLocaleCreate {
  locale_code: string;
  is_default?: boolean;
  is_active?: boolean;
}

export const propertyLocalesApi = {
  /**
   * Get all locales for a property
   */
  getLocales: async (propertyId: number): Promise<PropertyLocale[]> => {
    const response = await apiClient.get(`/properties/${propertyId}/locales`);
    return response.data;
  },

  /**
   * Add a new locale to property
   */
  addLocale: async (propertyId: number, locale: PropertyLocaleCreate): Promise<PropertyLocale> => {
    const response = await apiClient.post(`/properties/${propertyId}/locales`, locale);
    return response.data;
  },

  /**
   * Remove a locale from property
   */
  removeLocale: async (propertyId: number, localeCode: string): Promise<void> => {
    await apiClient.delete(`/properties/${propertyId}/locales/${localeCode}`);
  },

  /**
   * Set a locale as default for property
   */
  setDefaultLocale: async (propertyId: number, localeCode: string): Promise<void> => {
    await apiClient.put(`/properties/${propertyId}/locales/${localeCode}/default`);
  },

  /**
   * Sync supported languages - add/remove to match array
   */
  syncLocales: async (propertyId: number, supportedLanguages: string[]): Promise<void> => {
    // Get current locales
    const currentLocales = await propertyLocalesApi.getLocales(propertyId);
    const currentCodes = currentLocales.map(l => l.locale_code);

    // Find locales to add
    const toAdd = supportedLanguages.filter(code => !currentCodes.includes(code));
    
    // Find locales to remove
    const toRemove = currentCodes.filter(code => !supportedLanguages.includes(code));

    // Add new locales
    for (const code of toAdd) {
      try {
        await propertyLocalesApi.addLocale(propertyId, { locale_code: code });
      } catch (error) {
        console.error(`Failed to add locale ${code}:`, error);
      }
    }

    // Remove old locales
    for (const code of toRemove) {
      try {
        await propertyLocalesApi.removeLocale(propertyId, code);
      } catch (error) {
        console.error(`Failed to remove locale ${code}:`, error);
      }
    }
  }
};
