/**
 * VR Hotel Offers API Service
 * 
 * API calls for VR Hotel offers/vouchers management
 */
import axios from 'axios';
import { getApiBaseUrl } from '../utils/api';

// API Base Configuration
const API_BASE_URL = getApiBaseUrl();

// Create axios instance for VR Hotel Offers
const vrHotelOffersClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// Request interceptor
vrHotelOffersClient.interceptors.request.use(
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
setupAxiosInterceptors(vrHotelOffersClient);

// ==========================================
// Types
// ==========================================

export interface OfferTranslation {
  locale: string;
  title: string;
  description?: string;
  terms_conditions?: string;
}

export interface Offer {
  id: number;
  tenant_id: number;
  property_id: number;
  code: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_night';
  discount_value?: number;
  valid_from?: string; // ISO date
  valid_to?: string; // ISO date
  min_nights: number;
  applicable_room_types?: string[];
  status: 'active' | 'inactive' | 'expired';
  vr_link?: string;
  display_order: number;
  translations: Record<string, OfferTranslation>;
  created_at: string;
  updated_at?: string;
}

export interface OfferCreate {
  code: string;
  discount_type?: 'percentage' | 'fixed_amount' | 'free_night';
  discount_value?: number;
  valid_from?: string;
  valid_to?: string;
  min_nights?: number;
  applicable_room_types?: string[];
  status?: 'active' | 'inactive' | 'expired';
  vr_link?: string;
  display_order?: number;
  translations: OfferTranslation[];
}

export interface OfferUpdate extends Partial<OfferCreate> {
  translations?: OfferTranslation[];
}

// ==========================================
// Offers API
// ==========================================

export const vrHotelOffersApi = {
  /**
   * Get list of offers for current property
   */
  getOffers: async (status?: string): Promise<Offer[]> => {
    const config: any = {};
    if (status) {
      config.params = { status };
    }
    const response = await vrHotelOffersClient.get<Offer[]>('/vr-hotel/offers', config);
    return response.data;
  },

  /**
   * Get specific offer by ID
   */
  getOffer: async (offerId: number): Promise<Offer> => {
    const response = await vrHotelOffersClient.get<Offer>(`/vr-hotel/offers/${offerId}`);
    return response.data;
  },

  /**
   * Create new offer
   */
  createOffer: async (offer: OfferCreate): Promise<Offer> => {
    const response = await vrHotelOffersClient.post<Offer>('/vr-hotel/offers', offer);
    return response.data;
  },

  /**
   * Update existing offer
   */
  updateOffer: async (offerId: number, offer: OfferUpdate): Promise<Offer> => {
    const response = await vrHotelOffersClient.put<Offer>(`/vr-hotel/offers/${offerId}`, offer);
    return response.data;
  },

  /**
   * Delete offer
   */
  deleteOffer: async (offerId: number): Promise<void> => {
    await vrHotelOffersClient.delete(`/vr-hotel/offers/${offerId}`);
  }
};

export default vrHotelOffersApi;
