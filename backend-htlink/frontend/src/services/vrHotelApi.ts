/**
 * VR Hotel API Service
 * 
 * API calls for VR Hotel management (Settings, Rooms, Dining, Facilities, etc.)
 */
import axios from 'axios';
import { getApiBaseUrl } from '../utils/api';

// API Base Configuration
const API_BASE_URL = getApiBaseUrl();

// Create axios instance for VR Hotel
const vrHotelClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// Request interceptor
vrHotelClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const tenantCode = localStorage.getItem('tenant_code') || 'demo';
    const propertyId = localStorage.getItem('current_property_id');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // VR Hotel APIs require both tenant and property headers
    config.headers['X-Tenant-Code'] = tenantCode;
    if (propertyId) {
      config.headers['X-Property-Id'] = propertyId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Setup interceptors for auth and permission handling
import { setupAxiosInterceptors } from '../utils/axiosInterceptors';
setupAxiosInterceptors(vrHotelClient);

// ==========================================
// Types
// ==========================================

export interface VRHotelSettings {
  // Basic info
  hotel_name_vi?: string;
  hotel_name_en?: string;
  slogan_vi?: string;
  slogan_en?: string;
  
  // Configuration
  default_language: string;
  timezone: string;
  currency: string;
  primary_color: string;
  
  // Media
  logo_media_id?: number;
  favicon_media_id?: number;
  
  // Additional settings
  settings_json?: Record<string, any>;
  
  // Contact information
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  tripadvisor_url?: string;
  map_latitude?: number;
  map_longitude?: number;
  google_map_url?: string;
  
  // SEO (per locale)
  seo?: Record<string, {
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
  }>;
}

export interface VRHotelSettingsUpdate extends Partial<VRHotelSettings> {}

// ==========================================
// Properties API
// ==========================================

export interface Property {
  id: number;
  tenant_id: number;
  property_name: string;
  code: string;
  vr_hotel_enabled: boolean;
  // ... other fields as needed
}

export const vrHotelPropertiesApi = {
  /**
   * Get list of properties for current tenant
   */
  getProperties: async (): Promise<Property[]> => {
    const response = await vrHotelClient.get<Property[]>('/properties');
    return response.data;
  },
  
  /**
   * Get first property with VR Hotel enabled
   */
  getVRHotelProperty: async (): Promise<Property | null> => {
    const properties = await vrHotelPropertiesApi.getProperties();
    return properties.find(p => p.vr_hotel_enabled) || properties[0] || null;
  }
};

// ==========================================
// Settings API
// ==========================================

export const vrHotelSettingsApi = {
  /**
   * Get VR Hotel settings for current property
   */
  getSettings: async (): Promise<VRHotelSettings> => {
    const response = await vrHotelClient.get('/vr-hotel/settings');
    return response.data;
  },

  /**
   * Update VR Hotel settings
   */
  updateSettings: async (data: VRHotelSettingsUpdate): Promise<VRHotelSettings> => {
    const response = await vrHotelClient.put('/vr-hotel/settings', data);
    return response.data;
  },

  /**
   * Restore default settings
   */
  restoreDefaults: async (): Promise<VRHotelSettings> => {
    const defaultSettings: VRHotelSettingsUpdate = {
      hotel_name_vi: '',
      hotel_name_en: '',
      slogan_vi: '',
      slogan_en: '',
      default_language: 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
      currency: 'VND',
      primary_color: '#3b82f6',
      address: '',
      phone: '',
      email: '',
      website: '',
      facebook_url: '',
      instagram_url: '',
      youtube_url: '',
      tripadvisor_url: '',
      seo: {
        vi: {
          meta_title: '',
          meta_description: '',
          meta_keywords: ''
        }
      }
    };
    
    return await vrHotelSettingsApi.updateSettings(defaultSettings);
  }
};

// ==========================================
// Languages API
// ==========================================

export interface VRLanguage {
  id: number;
  locale: string;
  is_default: boolean;
  is_active: boolean;
}

export interface Locale {
  id: number;
  code: string;
  name: string;
  native_name?: string;
}

export const vrLanguagesApi = {
  /**
   * Get all available locales from database
   */
  getAvailableLocales: async (): Promise<Locale[]> => {
    const response = await vrHotelClient.get('/locales/');
    return response.data;
  },

  /**
   * Get supported languages
   */
  getLanguages: async (): Promise<VRLanguage[]> => {
    const response = await vrHotelClient.get('/vr-hotel/languages');
    return response.data;
  },

  /**
   * Add a new language
   */
  addLanguage: async (locale_code: string): Promise<VRLanguage> => {
    const response = await vrHotelClient.post('/vr-hotel/languages', { locale_code });
    return response.data;
  },

  /**
   * Remove a language
   */
  removeLanguage: async (locale_code: string): Promise<void> => {
    await vrHotelClient.delete(`/vr-hotel/languages/${locale_code}`);
  },

  /**
   * Sync supported languages with property_locales table
   * Add/remove languages to match the supportedLanguages array
   */
  syncLanguages: async (supportedLanguages: string[]): Promise<void> => {
    // Get current languages from property_locales
    const currentLanguages = await vrLanguagesApi.getLanguages();
    const currentCodes = currentLanguages.map(l => l.locale_code);

    // Find languages to add
    const toAdd = supportedLanguages.filter(code => !currentCodes.includes(code));
    
    // Find languages to remove
    const toRemove = currentCodes.filter(code => !supportedLanguages.includes(code));

    // Add new languages
    for (const code of toAdd) {
      try {
        await vrLanguagesApi.addLanguage(code);
      } catch (error) {
        console.error(`Failed to add language ${code}:`, error);
      }
    }

    // Remove old languages
    for (const code of toRemove) {
      try {
        await vrLanguagesApi.removeLanguage(code);
      } catch (error) {
        console.error(`Failed to remove language ${code}:`, error);
      }
    }
  }
};

// ==========================================
// Introduction API
// ==========================================

export interface IntroductionContent {
  title: string;
  shortDescription: string;
  detailedContent: string;
}

export interface IntroductionData {
  isDisplaying: boolean;
  content: Record<string, IntroductionContent>; // {locale: content}
  vr360Link?: string;
  vrTitle?: string;
}

export const vrHotelIntroductionApi = {
  /**
   * Get VR Hotel introduction content
   */
  getIntroduction: async (): Promise<IntroductionData> => {
    const response = await vrHotelClient.get('/vr-hotel/introduction');
    return response.data;
  },

  /**
   * Update VR Hotel introduction content
   */
  updateIntroduction: async (data: Partial<IntroductionData>): Promise<IntroductionData> => {
    const response = await vrHotelClient.put('/vr-hotel/introduction', data);
    return response.data;
  }
};

// ==========================================
// Export everything
// ==========================================

export default {
  settings: vrHotelSettingsApi,
  languages: vrLanguagesApi,
  introduction: vrHotelIntroductionApi
};
