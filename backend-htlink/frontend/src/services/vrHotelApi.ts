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
  
  // VR Page Settings (Hero sections)
  pages?: Record<string, {
    vr360_link?: string;
    vr_title?: string;
  }>;
}

export interface VRHotelSettingsUpdate extends Partial<VRHotelSettings> {}

export interface VRPageSettings {
  vr360_link?: string;
  vr_title?: string;
  is_displaying?: boolean;
}

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
   * Get VR page settings (for rooms, dining, offers, facilities hero sections)
   */
  getPageSettings: async (pageName: string): Promise<VRPageSettings | null> => {
    const settings = await vrHotelSettingsApi.getSettings();
    return settings.pages?.[pageName] || null;
  },

  /**
   * Update VR page settings
   */
  updatePageSettings: async (pageName: string, settings: VRPageSettings): Promise<VRHotelSettings> => {
    const currentSettings = await vrHotelSettingsApi.getSettings();
    const currentPages = currentSettings.pages || {};
    const updatedPages = {
      ...currentPages,
      [pageName]: settings
    };
    return vrHotelSettingsApi.updateSettings({ pages: updatedPages });
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
// Policies & Rules API
// ==========================================

export interface PoliciesContent {
  title: string;
  shortDescription: string;
  detailedContent: string;
}

export interface PoliciesData {
  isDisplaying: boolean;
  content: Record<string, PoliciesContent>; // {locale: content}
  vr360Link?: string;
  vrTitle?: string;
}

export const vrHotelPoliciesApi = {
  /**
   * Get VR Hotel policies content
   */
  getPolicies: async (): Promise<PoliciesData> => {
    const response = await vrHotelClient.get('/vr-hotel/policies');
    return response.data;
  },

  /**
   * Update VR Hotel policies content
   */
  updatePolicies: async (data: Partial<PoliciesData>): Promise<PoliciesData> => {
    const response = await vrHotelClient.put('/vr-hotel/policies', data);
    return response.data;
  }
};

// ==========================================
// Rules API
// ==========================================

export interface RulesContent {
  title: string;
  shortDescription: string;
  detailedContent: string;
}

export interface RulesData {
  isDisplaying: boolean;
  content: Record<string, RulesContent>; // {locale: content}
  vr360Link?: string;
  vrTitle?: string;
}

export const vrHotelRulesApi = {
  /**
   * Get VR Hotel rules content
   */
  getRules: async (): Promise<RulesData> => {
    const response = await vrHotelClient.get('/vr-hotel/rules');
    return response.data;
  },

  /**
   * Update VR Hotel rules content
   */
  updateRules: async (data: Partial<RulesData>): Promise<RulesData> => {
    const response = await vrHotelClient.put('/vr-hotel/rules', data);
    return response.data;
  }
};

// ==========================================
// Export everything
// ==========================================

// ==========================================
// Rooms API
// ==========================================

export interface RoomTranslation {
  locale: string;
  name: string;
  description?: string;
  amenities_text?: string;
}

export interface RoomMediaInfo {
  media_id: number;
  is_vr360?: boolean;
  is_primary?: boolean;
  sort_order?: number;
}

export interface Room {
  id: number;
  tenant_id: number;
  property_id: number;
  room_code: string;
  room_type?: string;
  floor?: number;
  bed_type?: string;
  capacity?: number;
  size_sqm?: number;
  price_per_night?: number;
  vr_link?: string;
  status: string;
  amenities_json?: string[];
  attributes_json?: Record<string, any>;
  display_order: number;
  translations: Record<string, RoomTranslation>;
  media: RoomMediaInfo[];
  created_at: string;
  updated_at?: string;
}

export interface RoomCreate {
  room_code: string;
  room_type?: string;
  floor?: number;
  bed_type?: string;
  capacity?: number;
  size_sqm?: number;
  price_per_night?: number;
  vr_link?: string;
  status?: string;
  amenities_json?: string[];
  attributes_json?: Record<string, any>;
  display_order?: number;
  translations: RoomTranslation[];
  media?: RoomMediaInfo[];
}

export interface RoomUpdate {
  room_code?: string;
  room_type?: string;
  floor?: number;
  bed_type?: string;
  capacity?: number;
  size_sqm?: number;
  price_per_night?: number;
  vr_link?: string;
  status?: string;
  amenities_json?: string[];
  attributes_json?: Record<string, any>;
  display_order?: number;
  translations?: RoomTranslation[];
  media?: RoomMediaInfo[];
}

export const vrHotelRoomsApi = {
  /**
   * Get all rooms
   */
  getRooms: async (params?: {
    skip?: number;
    limit?: number;
    room_type?: string;
    status?: string;
  }): Promise<Room[]> => {
    const response = await vrHotelClient.get('/vr-hotel/rooms', { params });
    return response.data;
  },

  /**
   * Get specific room by ID
   */
  getRoom: async (roomId: number): Promise<Room> => {
    const response = await vrHotelClient.get(`/vr-hotel/rooms/${roomId}`);
    return response.data;
  },

  /**
   * Create new room
   */
  createRoom: async (data: RoomCreate): Promise<Room> => {
    const response = await vrHotelClient.post('/vr-hotel/rooms', data);
    return response.data;
  },

  /**
   * Update existing room
   */
  updateRoom: async (roomId: number, data: RoomUpdate): Promise<Room> => {
    const response = await vrHotelClient.put(`/vr-hotel/rooms/${roomId}`, data);
    return response.data;
  },

  /**
   * Delete room
   */
  deleteRoom: async (roomId: number): Promise<void> => {
    await vrHotelClient.delete(`/vr-hotel/rooms/${roomId}`);
  }
};

// ==========================================
// Dining Types & API
// ==========================================

export interface DiningTranslation {
  locale: string;
  name: string;
  description?: string;
}

export interface DiningMediaInfo {
  media_id: number;
  is_vr360?: boolean;
  is_primary?: boolean;
  sort_order?: number;
}

export interface Dining {
  id: number;
  tenant_id: number;
  property_id: number;
  code: string;
  dining_type?: string;
  vr_link?: string;
  status: string;
  display_order: number;
  translations: Record<string, DiningTranslation>;
  media: DiningMediaInfo[];
  created_at: string;
  updated_at?: string;
}

export interface DiningCreate {
  code: string;
  dining_type?: string;
  vr_link?: string;
  display_order?: number;
  translations: DiningTranslation[];
  media: DiningMediaInfo[];
}

export interface DiningUpdate {
  code?: string;
  dining_type?: string;
  vr_link?: string;
  display_order?: number;
  translations?: DiningTranslation[];
  media?: DiningMediaInfo[];
}

export const vrHotelDiningApi = {
  /**
   * Get all dining venues
   */
  getDinings: async (params?: {
    skip?: number;
    limit?: number;
    dining_type?: string;
  }): Promise<Dining[]> => {
    const response = await vrHotelClient.get('/vr-hotel/dining', { params });
    return response.data;
  },

  /**
   * Get specific dining venue by ID
   */
  getDining: async (diningId: number): Promise<Dining> => {
    const response = await vrHotelClient.get(`/vr-hotel/dining/${diningId}`);
    return response.data;
  },

  /**
   * Create new dining venue
   */
  createDining: async (data: DiningCreate): Promise<Dining> => {
    const response = await vrHotelClient.post('/vr-hotel/dining', data);
    return response.data;
  },

  /**
   * Update existing dining venue
   */
  updateDining: async (diningId: number, data: DiningUpdate): Promise<Dining> => {
    const response = await vrHotelClient.put(`/vr-hotel/dining/${diningId}`, data);
    return response.data;
  },

  /**
   * Delete dining venue
   */
  deleteDining: async (diningId: number): Promise<void> => {
    await vrHotelClient.delete(`/vr-hotel/dining/${diningId}`);
  }
};

// ==========================================
// Facilities API
// ==========================================

export interface FacilityTranslation {
  locale: string;
  name: string;
  description?: string;
}

export interface Facility {
  id: number;
  tenant_id: number;
  property_id: number;
  code: string;
  facility_type?: string;
  operating_hours?: string;
  vr_link?: string;
  status: string;
  display_order: number;
  translations: Record<string, { name: string; description: string }>;
  media?: Array<{ media_id: number; is_vr360: boolean; is_primary: boolean; sort_order: number }>;
  created_at: string;
  updated_at?: string;
}

export interface FacilityCreate {
  code: string;
  facility_type?: string;
  operating_hours?: string;
  vr_link?: string;
  display_order?: number;
  translations: FacilityTranslation[];
  media: Array<{ media_id: number; is_vr360: boolean; is_primary: boolean; sort_order: number }>;
}

export interface FacilityUpdate extends FacilityCreate {}

export const vrHotelFacilityApi = {
  getFacilities: async (params?: { facility_type?: string; skip?: number; limit?: number }): Promise<Facility[]> => {
    const propertyId = localStorage.getItem('current_property_id');
    const response = await vrHotelClient.get('/vr-hotel/facilities', {
      params,
      headers: { 'X-Property-Id': propertyId }
    });
    return response.data;
  },

  getFacility: async (facilityId: number): Promise<Facility> => {
    const propertyId = localStorage.getItem('current_property_id');
    const response = await vrHotelClient.get(`/vr-hotel/facilities/${facilityId}`, {
      headers: { 'X-Property-Id': propertyId }
    });
    return response.data;
  },

  createFacility: async (data: FacilityCreate): Promise<Facility> => {
    const propertyId = localStorage.getItem('current_property_id');
    const response = await vrHotelClient.post('/vr-hotel/facilities', data, {
      headers: { 'X-Property-Id': propertyId }
    });
    return response.data;
  },

  updateFacility: async (facilityId: number, data: FacilityUpdate): Promise<Facility> => {
    const propertyId = localStorage.getItem('current_property_id');
    const response = await vrHotelClient.put(`/vr-hotel/facilities/${facilityId}`, data, {
      headers: { 'X-Property-Id': propertyId }
    });
    return response.data;
  },

  deleteFacility: async (facilityId: number): Promise<void> => {
    const propertyId = localStorage.getItem('current_property_id');
    await vrHotelClient.delete(`/vr-hotel/facilities/${facilityId}`, {
      headers: { 'X-Property-Id': propertyId }
    });
  }
};

// ==========================================
// Services API
// ==========================================

export interface ServiceTranslation {
  locale: string;
  name: string;
  description?: string;
  locale_name?: string;
}

export interface ServiceMediaInfo {
  media_id: number;
  file_path: string;
  thumbnail_path?: string;
  is_vr360?: boolean;
  is_primary?: boolean;
}

export interface Service {
  id: number;
  code: string;
  service_type?: string;
  availability?: string;
  price_info?: string;
  vr_link?: string;
  status: string;
  translations: { [key: string]: ServiceTranslation };
  media: ServiceMediaInfo[];
  display_order: number;
}

export interface ServiceCreate {
  code: string;
  service_type?: string;
  availability?: string;
  price_info?: string;
  vr_link?: string;
  status?: string;
  translations: ServiceTranslation[];
  media_ids?: number[];
  primary_media_id?: number;
  vr360_media_ids?: number[];
  display_order?: number;
}

export interface ServiceUpdate {
  code?: string;
  service_type?: string;
  availability?: string;
  price_info?: string;
  vr_link?: string;
  status?: string;
  translations?: ServiceTranslation[];
  media_ids?: number[];
  primary_media_id?: number;
  vr360_media_ids?: number[];
  display_order?: number;
}

export const vrHotelServiceApi = {
  getServices: async (propertyId: number): Promise<Service[]> => {
    const response = await vrHotelClient.get('/vr-hotel/services', {
      headers: { 'X-Property-Id': propertyId }
    });
    return response.data;
  },

  getService: async (propertyId: number, serviceId: number): Promise<Service> => {
    const response = await vrHotelClient.get(`/vr-hotel/services/${serviceId}`, {
      headers: { 'X-Property-Id': propertyId }
    });
    return response.data;
  },

  createService: async (propertyId: number, serviceData: ServiceCreate): Promise<Service> => {
    const response = await vrHotelClient.post('/vr-hotel/services', serviceData, {
      headers: { 'X-Property-Id': propertyId }
    });
    return response.data;
  },

  updateService: async (propertyId: number, serviceId: number, serviceData: ServiceUpdate): Promise<Service> => {
    const response = await vrHotelClient.put(`/vr-hotel/services/${serviceId}`, serviceData, {
      headers: { 'X-Property-Id': propertyId }
    });
    return response.data;
  },

  deleteService: async (propertyId: number, serviceId: number): Promise<void> => {
    await vrHotelClient.delete(`/vr-hotel/services/${serviceId}`, {
      headers: { 'X-Property-Id': propertyId }
    });
  }
};

// ==========================================
// Contact API
// ==========================================

export interface ContactData {
  isDisplaying: boolean;
  phone?: string;
  email?: string;
  website?: string;
  address?: Record<string, string>;
  socialMedia?: Record<string, string>;
  mapCoordinates?: string;
  workingHours?: Record<string, string>;
  vr360Link?: string;
  vrTitle?: string;
  content?: Record<string, any>;
}

export const vrHotelContactApi = {
  getContact: async (): Promise<ContactData> => {
    const response = await vrHotelClient.get('/vr-hotel/contact');
    return response.data;
  },

  updateContact: async (data: ContactData): Promise<ContactData> => {
    const response = await vrHotelClient.put('/vr-hotel/contact', data);
    return response.data;
  }
};

export default {
  settings: vrHotelSettingsApi,
  languages: vrLanguagesApi,
  introduction: vrHotelIntroductionApi,
  policies: vrHotelPoliciesApi,
  rules: vrHotelRulesApi,
  rooms: vrHotelRoomsApi,
  dining: vrHotelDiningApi,
  facilities: vrHotelFacilityApi,
  services: vrHotelServiceApi,
  contact: vrHotelContactApi
};
