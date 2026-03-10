/**
 * Cafe API Service
 * 
 * API calls for Cafe management (Menu, Branches, Events, Careers, Promotions, etc.)
 */
import axios from 'axios';
import { getApiBaseUrl } from '../utils/api';

// API Base Configuration
const API_BASE_URL = getApiBaseUrl();

// Create axios instance for Cafe
const cafeClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// Request interceptor
// Cafe system only needs tenant and user authentication, no property_id
cafeClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const tenantCode = localStorage.getItem('tenant_code') || 'demo';
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    config.headers['X-Tenant-Code'] = tenantCode;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Setup interceptors for auth and permission handling
import { setupAxiosInterceptors } from '../utils/axiosInterceptors';
setupAxiosInterceptors(cafeClient);

// ==========================================
// Types
// ==========================================

export interface CafeActivityItem {
  id: number;
  type: string;
  text: string;
  time: string;
  user_name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export interface CafeActivityLogResponse {
  id: number;
  tenant_id: number;
  activity_type: string;
  details: any;
  created_at: string;
}

export interface CafeSettings {
  cafe_name?: string;
  slogan?: string;
  primary_color: string;
  background_color?: string;
  logo_media_id?: number;
  favicon_media_id?: number;
  booking_url?: string;
  messenger_url?: string;
  phone_number?: string;
  
  // Contact information
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  meta_image_media_id?: number;
  
  // Settings JSON
  settings_json?: Record<string, any>;
}

export interface CafeSettingsUpdate extends Partial<CafeSettings> {}

// Translation Types
export interface Translation {
  locale: string;
  [key: string]: string; // name, description, etc.
}

export interface CategoryTranslation {
  locale: string;
  name: string;
  description?: string;
}

export interface ItemTranslation {
  locale: string;
  name: string;
  description?: string;
  ingredients?: string;
}

// Menu Types
export interface MenuCategory {
  id: number;
  tenant_id: number;
  code: string;
  icon_media_id?: number;
  display_order: number;
  is_active: boolean;
  translations: CategoryTranslation[];
  created_at?: string;
  updated_at?: string;
}

export interface MenuCategoryCreate {
  code: string;
  icon_media_id?: number;
  display_order?: number;
  is_active?: boolean;
  translations: CategoryTranslation[];
}

export interface MenuCategoryUpdate extends Partial<MenuCategoryCreate> {}

export interface MenuItem {
  id: number;
  tenant_id: number;
  category_id: number;
  code: string;
  price?: number;
  original_price?: number;
  status: string;
  primary_image_media_id?: number;
  is_bestseller: boolean;
  is_new: boolean;
  is_seasonal: boolean;
  display_order: number;
  calories?: number;
  translations: ItemTranslation[];
  created_at?: string;
  updated_at?: string;
  // Legacy fields for backward compatibility
  name_vi?: string;
  name_en?: string;
  description_vi?: string;
  description_en?: string;
  image_media_id?: number;
  is_available?: boolean;
  is_featured?: boolean;
}

export interface MenuItemCreate {
  category_id: number;
  code?: string;
  price?: number;
  original_price?: number;
  status?: string;
  primary_image_media_id?: number;
  is_bestseller?: boolean;
  is_new?: boolean;
  is_seasonal?: boolean;
  display_order?: number;
  calories?: number;
  translations: ItemTranslation[];
}

export interface MenuItemUpdate extends Partial<MenuItemCreate> {}

// Translation Types for other content
export interface BranchTranslation {
  locale: string;
  name: string;
  address?: string;
  description?: string;
}

export interface EventTranslation {
  locale: string;
  title: string;
  description?: string;
  details?: string;
}

export interface CareerTranslation {
  locale: string;
  title: string;
  description?: string;
  requirements?: string;
  benefits?: string;
}

export interface PromotionTranslation {
  locale: string;
  title: string;
  description?: string;
  terms_and_conditions?: string;
}

export interface SpaceTranslation {
  locale: string;
  name: string;
  description?: string;
}

export interface ContentSectionTranslation {
  locale: string;
  title: string;
  description?: string;
  content?: string;
}

// Branch Types
export interface Branch {
  id: number;
  tenant_id: number;
  name_vi: string;
  name_en?: string;
  address_vi?: string;
  address_en?: string;
  phone?: string;
  email?: string;
  opening_hours_vi?: string;
  opening_hours_en?: string;
  map_latitude?: number;
  map_longitude?: number;
  google_map_url?: string;
  image_media_id?: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  translations?: BranchTranslation[];
}

export interface BranchCreate {
  name_vi: string;
  name_en?: string;
  address_vi?: string;
  address_en?: string;
  phone?: string;
  email?: string;
  opening_hours_vi?: string;
  opening_hours_en?: string;
  map_latitude?: number;
  map_longitude?: number;
  google_map_url?: string;
  image_media_id?: number;
  display_order?: number;
  is_active?: boolean;
}

export interface BranchUpdate extends Partial<BranchCreate> {}

// Event Types
export interface CafeEvent {
  id: number;
  tenant_id: number;
  title_vi: string;
  title_en?: string;
  description_vi?: string;
  description_en?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  registration_url?: string;
  image_media_id?: number;
  display_order: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  translations?: EventTranslation[];
}

export interface CafeEventCreate {
  title_vi: string;
  title_en?: string;
  description_vi?: string;
  description_en?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  registration_url?: string;
  image_media_id?: number;
  display_order?: number;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface CafeEventUpdate extends Partial<CafeEventCreate> {}

// Career Types
export interface Career {
  id: number;
  tenant_id: number;
  title_vi: string;
  title_en?: string;
  description_vi?: string;
  description_en?: string;
  requirements_vi?: string;
  requirements_en?: string;
  benefits_vi?: string;
  benefits_en?: string;
  location?: string;
  employment_type?: string;
  salary_range?: string;
  application_deadline?: string;
  contact_email?: string;
  display_order: number;
  status: 'open' | 'closed' | 'filled';
  created_at: string;
  updated_at?: string;
  translations?: CareerTranslation[];
}

export interface CareerCreate {
  title_vi: string;
  title_en?: string;
  description_vi?: string;
  description_en?: string;
  requirements_vi?: string;
  requirements_en?: string;
  benefits_vi?: string;
  benefits_en?: string;
  location?: string;
  employment_type?: string;
  salary_range?: string;
  application_deadline?: string;
  contact_email?: string;
  display_order?: number;
  status?: 'open' | 'closed' | 'filled';
}

export interface CareerUpdate extends Partial<CareerCreate> {}

// Promotion Types
export interface Promotion {
  id: number;
  tenant_id: number;
  title_vi: string;
  title_en?: string;
  description_vi?: string;
  description_en?: string;
  discount_type?: string;
  discount_value?: number;
  valid_from?: string;
  valid_to?: string;
  terms_vi?: string;
  terms_en?: string;
  image_media_id?: number;
  display_order: number;
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
  updated_at?: string;
  translations?: PromotionTranslation[];
}

export interface PromotionCreate {
  title_vi: string;
  title_en?: string;
  description_vi?: string;
  description_en?: string;
  discount_type?: string;
  discount_value?: number;
  valid_from?: string;
  valid_to?: string;
  terms_vi?: string;
  terms_en?: string;
  image_media_id?: number;
  display_order?: number;
  status?: 'active' | 'inactive' | 'expired';
}

export interface PromotionUpdate extends Partial<PromotionCreate> {}

// Space Types
export interface Space {
  id: number;
  tenant_id: number;
  code: string;
  primary_image_media_id?: number;
  amenities_json?: Record<string, any>;
  capacity?: number;
  area_size?: string;
  is_active: boolean;
  display_order: number;
  attributes_json?: Record<string, any>;
  created_at: string;
  updated_at: string;
  translations?: SpaceTranslation[];
}

export interface SpaceCreate {
  code: string;
  primary_image_media_id?: number;
  amenities_json?: Record<string, any>;
  capacity?: number;
  area_size?: string;
  is_active?: boolean;
  display_order?: number;
  attributes_json?: Record<string, any>;
  translations: SpaceTranslation[];
}

export interface SpaceUpdate extends Partial<SpaceCreate> {}

// Content Section Types
export interface ContentSection {
  id: number;
  tenant_id: number;
  section_type: string;
  page_code: string;
  icon?: string;
  image_media_id?: number;
  is_active: boolean;
  display_order: number;
  attributes_json?: Record<string, any>;
  created_at: string;
  updated_at: string;
  translations?: ContentSectionTranslation[];
}

export interface ContentSectionCreate {
  section_type: string;
  page_code: string;
  icon?: string;
  image_media_id?: number;
  is_active?: boolean;
  display_order?: number;
  attributes_json?: Record<string, any>;
  translations: ContentSectionTranslation[];
}

export interface ContentSectionUpdate extends Partial<ContentSectionCreate> {}

// Language Types
export interface CafeLanguage {
  locale: string;
  is_default: boolean;
}

export interface LanguageCreate {
  locale: string;
}

// ==========================================
// Settings API
// ==========================================

export const cafeSettingsApi = {
  getSettings: async (): Promise<CafeSettings> => {
    const response = await cafeClient.get('/cafe/settings');
    return response.data;
  },

  updateSettings: async (data: CafeSettingsUpdate): Promise<CafeSettings> => {
    const response = await cafeClient.post('/cafe/settings', data);
    return response.data;
  },
};

// ==========================================
// Contact API (Separate from Settings)
// ==========================================

export interface CafeContact {
  is_displaying: boolean;
  phone: string;
  email: string;
  website: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  youtube_url: string;
  vr360_link: string;
  vr_title: string;
  map_coordinates: string;
  address_translations: {
    [locale: string]: {
      address: string;
      working_hours: string;
      description: string;
    };
  };
}

export interface CafeContactUpdate extends Partial<CafeContact> {}

export const cafeContactApi = {
  getContact: async (): Promise<CafeContact> => {
    const response = await cafeClient.get('/cafe/contact');
    return response.data;
  },

  updateContact: async (data: CafeContactUpdate): Promise<CafeContact> => {
    const response = await cafeClient.post('/cafe/contact', data);
    return response.data;
  },
};

// ==========================================
// Languages API
// ==========================================

export const cafeLanguagesApi = {
  /**
   * Get all supported languages for cafe
   */
  getLanguages: async (): Promise<CafeLanguage[]> => {
    const response = await cafeClient.get<CafeLanguage[]>('/cafe/languages');
    return response.data;
  },

  /**
   * Add a new language
   */
  addLanguage: async (locale: string): Promise<CafeLanguage> => {
    const response = await cafeClient.post<CafeLanguage>('/cafe/languages', { locale });
    return response.data;
  },

  /**
   * Remove a language
   */
  removeLanguage: async (locale: string): Promise<void> => {
    await cafeClient.delete(`/cafe/languages/${locale}`);
  },

  /**
   * Set a language as default
   */
  setDefaultLanguage: async (locale: string): Promise<void> => {
    await cafeClient.put(`/cafe/languages/${locale}/set-default`);
  },

  /**
   * Get array of locale codes only
   */
  getLanguageCodes: async (): Promise<string[]> => {
    const languages = await cafeLanguagesApi.getLanguages();
    return languages.map(lang => lang.locale);
  },
};

// ==========================================
// Menu API
// ==========================================

export const cafeMenuApi = {
  // Categories
  getCategories: async (): Promise<MenuCategory[]> => {
    const response = await cafeClient.get('/cafe/menu/categories');
    return response.data;
  },

  createCategory: async (data: MenuCategoryCreate): Promise<MenuCategory> => {
    const response = await cafeClient.post('/cafe/menu/categories', data);
    return response.data;
  },

  updateCategory: async (id: number, data: MenuCategoryUpdate): Promise<MenuCategory> => {
    const response = await cafeClient.put(`/cafe/menu/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await cafeClient.delete(`/cafe/menu/categories/${id}`);
  },

  // Menu Items
  getItems: async (): Promise<MenuItem[]> => {
    const response = await cafeClient.get('/cafe/menu/items');
    return response.data;
  },

  getItem: async (id: number): Promise<MenuItem> => {
    const response = await cafeClient.get(`/cafe/menu/items/${id}`);
    return response.data;
  },

  createItem: async (data: MenuItemCreate): Promise<MenuItem> => {
    const response = await cafeClient.post('/cafe/menu/items', data);
    return response.data;
  },

  updateItem: async (id: number, data: MenuItemUpdate): Promise<MenuItem> => {
    const response = await cafeClient.put(`/cafe/menu/items/${id}`, data);
    return response.data;
  },

  deleteItem: async (id: number): Promise<void> => {
    await cafeClient.delete(`/cafe/menu/items/${id}`);
  },

  // Translations
  updateCategoryTranslations: async (id: number, translations: CategoryTranslation[]): Promise<MenuCategory> => {
    const response = await cafeClient.put(`/cafe/menu/categories/${id}`, { translations });
    return response.data;
  },

  updateItemTranslations: async (id: number, translations: ItemTranslation[]): Promise<MenuItem> => {
    const response = await cafeClient.put(`/cafe/menu/items/${id}`, { translations });
    return response.data;
  },
};

// ==========================================
// Branches API
// ==========================================

export const cafeBranchesApi = {
  getBranches: async (): Promise<Branch[]> => {
    const response = await cafeClient.get('/cafe/branches');
    return response.data;
  },

  getBranch: async (id: number): Promise<Branch> => {
    const response = await cafeClient.get(`/cafe/branches/${id}`);
    return response.data;
  },

  createBranch: async (data: BranchCreate): Promise<Branch> => {
    const response = await cafeClient.post('/cafe/branches', data);
    return response.data;
  },

  updateBranch: async (id: number, data: BranchUpdate): Promise<Branch> => {
    const response = await cafeClient.put(`/cafe/branches/${id}`, data);
    return response.data;
  },

  deleteBranch: async (id: number): Promise<void> => {
    await cafeClient.delete(`/cafe/branches/${id}`);
  },

  reorderBranches: async (branchIds: number[]): Promise<void> => {
    await cafeClient.post('/cafe/branches/reorder', { branch_ids: branchIds });
  },

  updateBranchTranslations: async (id: number, translations: BranchTranslation[]): Promise<Branch> => {
    const response = await cafeClient.put(`/cafe/branches/${id}`, { translations });
    return response.data;
  },
};

// ==========================================
// Events API
// ==========================================

export const cafeEventsApi = {
  getEvents: async (): Promise<CafeEvent[]> => {
    const response = await cafeClient.get('/cafe/events');
    return response.data;
  },

  getEvent: async (id: number): Promise<CafeEvent> => {
    const response = await cafeClient.get(`/cafe/events/${id}`);
    return response.data;
  },

  createEvent: async (data: CafeEventCreate): Promise<CafeEvent> => {
    const response = await cafeClient.post('/cafe/events', data);
    return response.data;
  },

  updateEvent: async (id: number, data: CafeEventUpdate): Promise<CafeEvent> => {
    const response = await cafeClient.put(`/cafe/events/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id: number): Promise<void> => {
    await cafeClient.delete(`/cafe/events/${id}`);
  },

  updateEventTranslations: async (id: number, translations: EventTranslation[]): Promise<CafeEvent> => {
    const response = await cafeClient.put(`/cafe/events/${id}`, { translations });
    return response.data;
  },
};

// ==========================================
// Careers API
// ==========================================

export const cafeCareersApi = {
  getCareers: async (): Promise<Career[]> => {
    const response = await cafeClient.get('/cafe/careers');
    return response.data;
  },

  getCareer: async (id: number): Promise<Career> => {
    const response = await cafeClient.get(`/cafe/careers/${id}`);
    return response.data;
  },

  createCareer: async (data: CareerCreate): Promise<Career> => {
    const response = await cafeClient.post('/cafe/careers', data);
    return response.data;
  },

  updateCareer: async (id: number, data: CareerUpdate): Promise<Career> => {
    const response = await cafeClient.put(`/cafe/careers/${id}`, data);
    return response.data;
  },

  deleteCareer: async (id: number): Promise<void> => {
    await cafeClient.delete(`/cafe/careers/${id}`);
  },

  updateCareerTranslations: async (id: number, translations: CareerTranslation[]): Promise<Career> => {
    const response = await cafeClient.put(`/cafe/careers/${id}`, { translations });
    return response.data;
  },
};

// ==========================================
// Promotions API
// ==========================================

export const cafePromotionsApi = {
  getPromotions: async (): Promise<Promotion[]> => {
    const response = await cafeClient.get('/cafe/promotions');
    return response.data;
  },

  getPromotion: async (id: number): Promise<Promotion> => {
    const response = await cafeClient.get(`/cafe/promotions/${id}`);
    return response.data;
  },

  createPromotion: async (data: PromotionCreate): Promise<Promotion> => {
    const response = await cafeClient.post('/cafe/promotions', data);
    return response.data;
  },

  updatePromotion: async (id: number, data: PromotionUpdate): Promise<Promotion> => {
    const response = await cafeClient.put(`/cafe/promotions/${id}`, data);
    return response.data;
  },

  deletePromotion: async (id: number): Promise<void> => {
    await cafeClient.delete(`/cafe/promotions/${id}`);
  },

  updatePromotionTranslations: async (id: number, translations: PromotionTranslation[]): Promise<Promotion> => {
    const response = await cafeClient.put(`/cafe/promotions/${id}`, { translations });
    return response.data;
  },
};

// ==========================================
// Services API
// ==========================================

export interface ServiceTranslation {
  locale: string;
  name: string;
  description?: string;
}

export interface Service {
  id: number;
  code: string;
  service_type: string;
  availability?: string;
  price_information?: string;
  vr360_tour_url?: string;
  booking_url?: string;
  primary_image_media_id?: number;
  is_active: boolean;
  display_order: number;
  translations: ServiceTranslation[];
  created_at: string;
  updated_at: string;
}

export interface ServiceCreate {
  code: string;
  service_type: string;
  availability?: string;
  price_information?: string;
  vr360_tour_url?: string;
  booking_url?: string;
  primary_image_media_id?: number;
  is_active?: boolean;
  display_order?: number;
  translations: ServiceTranslation[];
}

export interface ServiceUpdate extends Partial<ServiceCreate> {}

export const cafeServicesApi = {
  getServices: async (): Promise<Service[]> => {
    const response = await cafeClient.get('/cafe/services');
    return response.data;
  },

  getService: async (id: number): Promise<Service> => {
    const response = await cafeClient.get(`/cafe/services/${id}`);
    return response.data;
  },

  createService: async (data: ServiceCreate): Promise<Service> => {
    const response = await cafeClient.post('/cafe/services', data);
    return response.data;
  },

  updateService: async (id: number, data: ServiceUpdate): Promise<Service> => {
    const response = await cafeClient.put(`/cafe/services/${id}`, data);
    return response.data;
  },

  deleteService: async (id: number): Promise<void> => {
    await cafeClient.delete(`/cafe/services/${id}`);
  },

  reorderService: async (id: number, newOrder: number): Promise<void> => {
    await cafeClient.patch(`/cafe/services/${id}/reorder?new_order=${newOrder}`);
  },

  addServiceMedia: async (serviceId: number, mediaId: number, isPrimary: boolean = false): Promise<void> => {
    await cafeClient.post(`/cafe/services/${serviceId}/media/${mediaId}`, { is_primary: isPrimary });
  },

  removeServiceMedia: async (serviceId: number, mediaId: number): Promise<void> => {
    await cafeClient.delete(`/cafe/services/${serviceId}/media/${mediaId}`);
  },

  getServiceMedia: async (serviceId: number) => {
    const response = await cafeClient.get(`/cafe/services/${serviceId}/media`);
    return response.data;
  }
};

// ==========================================
// Audit Logs API
// ==========================================

export interface AuditLog {
  id: number;
  tenant_id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  entity_type?: string;
  entity_id?: number;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ==========================================
// Activity Logs API
// ==========================================

export const cafeActivityLogsApi = {
  getRecentActivities: async (limit: number = 10): Promise<CafeActivityItem[]> => {
    try {
      const response = await cafeClient.get<CafeActivityLogResponse[]>(`/activity-logs/?limit=${limit}&days=7`);
      const logs = Array.isArray(response.data) ? response.data : [];
      return transformCafeActivityLogs(logs);
    } catch (error) {
      console.warn('Activity logs API not available, using empty array');
      return [];
    }
  },

  getAllActivities: async (limit: number = 50, days: number = 30): Promise<CafeActivityItem[]> => {
    try {
      const response = await cafeClient.get<CafeActivityLogResponse[]>(`/activity-logs/?limit=${limit}&days=${days}`);
      const logs = Array.isArray(response.data) ? response.data : [];
      return transformCafeActivityLogs(logs);
    } catch (error) {
      console.warn('Activity logs API not available, using empty array');
      return [];
    }
  }
};

// Helper function to transform activity logs
const transformCafeActivityLogs = (logs: CafeActivityLogResponse[]): CafeActivityItem[] => {
  return logs
    .filter(log => log.activity_type !== 'analytics_event')
    .map(log => {
      const details = log.details || {};
      const activityType = log.activity_type;
      const username = details.username || details.user_email || 'System User';

      // Parse created_at
      let createdAtStr = log.created_at;
      if (!createdAtStr.endsWith('Z') && !createdAtStr.includes('+')) {
        createdAtStr += 'Z';
      }
      const createdAt = new Date(createdAtStr);

      // Calculate relative time
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeAgo: string;
      if (diffMinutes < 1) {
        timeAgo = 'Just now';
      } else if (diffMinutes < 60) {
        timeAgo = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays < 30) {
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = createdAt.toLocaleDateString();
      }

      // Generate activity text based on type
      let text = details.message || `${activityType.replace('_', ' ')} performed`;
      let icon = 'fas fa-info-circle';
      let iconBg = '#f3f4f6';
      let iconColor = '#6b7280';

      // Customize based on activity type - Cafe specific
      switch (activityType) {
        case 'upload_media':
          text = `Media file '${details.filename || 'Unknown'}' uploaded by ${username}`;
          icon = 'fas fa-upload';
          iconBg = '#f0f9ff';
          iconColor = '#0369a1';
          break;

        case 'create_category':
          text = `Created menu category "${details.name || 'Unknown'}"`;
          icon = 'fas fa-folder-plus';
          iconBg = '#dcfce7';
          iconColor = '#16a34a';
          break;

        case 'update_category':
          text = `Updated menu category "${details.name || 'Unknown'}"`;
          icon = 'fas fa-pen';
          iconBg = '#fef3c7';
          iconColor = '#d97706';
          break;

        case 'delete_category':
        case 'delete_media':
          text = activityType === 'delete_media' 
            ? `Media file deleted by ${username}`
            : `Deleted menu category "${details.name || 'Unknown'}"`;
          icon = 'fas fa-info-circle';
          iconBg = '#f3f4f6';
          iconColor = '#6b7280';
          break;

        case 'create_post':
          text = `Created new item "${details.title || 'Unknown'}"`;
          icon = 'fas fa-file-alt';
          iconBg = '#dbeafe';
          iconColor = '#3b82f6';
          break;

        case 'update_post':
          text = `Updated item "${details.title || 'Unknown'}"`;
          icon = 'fas fa-edit';
          iconBg = '#fef3c7';
          iconColor = '#d97706';
          break;

        case 'delete_post':
          text = `Deleted item "${details.title || 'Unknown'}"`;
          icon = 'fas fa-trash-alt';
          iconBg = '#fee2e2';
          iconColor = '#dc2626';
          break;

        case 'login':
          text = `User ${username} logged in from ${details.ip_address || 'unknown IP'}`;
          icon = 'fas fa-sign-in-alt';
          iconBg = '#f0fdf4';
          iconColor = '#16a34a';
          break;

        case 'logout':
          text = `User logged out`;
          icon = 'fas fa-sign-out-alt';
          iconBg = '#fef3c7';
          iconColor = '#d97706';
          break;

        default:
          text = details.message || `${activityType.replace(/_/g, ' ')}`;
          break;
      }

      return {
        id: log.id,
        type: activityType,
        text,
        time: timeAgo,
        user_name: username,
        icon,
        iconBg,
        iconColor
      };
    });
};
export const cafeAuditLogsApi = {
  getRecentLogs: async (limit: number = 10): Promise<AuditLog[]> => {
    const response = await cafeClient.get('/audit-logs', {
      params: { limit }
    });
    return response.data;
  },
};

// ==========================================
// Spaces API
// ==========================================

export const cafeSpacesApi = {
  getSpaces: async (): Promise<Space[]> => {
    const response = await cafeClient.get('/cafe/spaces');
    return response.data;
  },

  getSpace: async (id: number): Promise<Space> => {
    const response = await cafeClient.get(`/cafe/spaces/${id}`);
    return response.data;
  },

  createSpace: async (data: SpaceCreate): Promise<Space> => {
    const response = await cafeClient.post('/cafe/spaces', data);
    return response.data;
  },

  updateSpace: async (id: number, data: SpaceUpdate): Promise<Space> => {
    const response = await cafeClient.put(`/cafe/spaces/${id}`, data);
    return response.data;
  },

  deleteSpace: async (id: number): Promise<void> => {
    await cafeClient.delete(`/cafe/spaces/${id}`);
  },

  reorderSpaces: async (spaceIds: number[]): Promise<void> => {
    await cafeClient.post('/cafe/spaces/reorder', { space_ids: spaceIds });
  },

  updateSpaceTranslations: async (id: number, translations: SpaceTranslation[]): Promise<Space> => {
    const response = await cafeClient.put(`/cafe/spaces/${id}`, { translations });
    return response.data;
  },
};

// ==========================================
// Content Sections API
// ==========================================

export const cafeContentSectionsApi = {
  getContentSections: async (pageCode?: string, sectionType?: string): Promise<ContentSection[]> => {
    const params = new URLSearchParams();
    if (pageCode) params.append('page_code', pageCode);
    if (sectionType) params.append('section_type', sectionType);
    const response = await cafeClient.get(`/cafe/content-sections?${params.toString()}`);
    return response.data;
  },

  getContentSection: async (id: number): Promise<ContentSection> => {
    const response = await cafeClient.get(`/cafe/content-sections/${id}`);
    return response.data;
  },

  createContentSection: async (data: ContentSectionCreate): Promise<ContentSection> => {
    const response = await cafeClient.post('/cafe/content-sections', data);
    return response.data;
  },

  updateContentSection: async (id: number, data: ContentSectionUpdate): Promise<ContentSection> => {
    const response = await cafeClient.put(`/cafe/content-sections/${id}`, data);
    return response.data;
  },

  deleteContentSection: async (id: number): Promise<void> => {
    await cafeClient.delete(`/cafe/content-sections/${id}`);
  },

  reorderContentSections: async (sectionIds: number[]): Promise<void> => {
    await cafeClient.post('/cafe/content-sections/reorder', { section_ids: sectionIds });
  },

  updateContentSectionTranslations: async (id: number, translations: ContentSectionTranslation[]): Promise<ContentSection> => {
    const response = await cafeClient.put(`/cafe/content-sections/${id}`, { translations });
    return response.data;
  },
};

export default {
  settings: cafeSettingsApi,
  contact: cafeContactApi,
  menu: cafeMenuApi,
  branches: cafeBranchesApi,
  events: cafeEventsApi,
  careers: cafeCareersApi,
  promotions: cafePromotionsApi,
  services: cafeServicesApi,
  spaces: cafeSpacesApi,
  contentSections: cafeContentSectionsApi,
  auditLogs: cafeAuditLogsApi,
};
