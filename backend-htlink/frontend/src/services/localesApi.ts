import axios from 'axios';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

// Auto-detect tenant code (same logic as propertyPostsApi)
const getTenantCode = (): string => {
  const savedTenant = localStorage.getItem('tenant_code') || localStorage.getItem('tenant_domain');
  if (savedTenant) return savedTenant;

  const hostname = window.location.hostname;
  if (hostname.includes('zalominiapp.vtlink.vn')) {
    return 'premier_admin';
  }

  const subdomain = hostname.split('.')[0];
  if (subdomain && subdomain !== 'localhost' && subdomain !== '127') {
    return subdomain;
  }

  return 'default_tenant';
};

// Add request interceptor to include auth token and tenant code
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const tenantCode = getTenantCode();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (tenantCode) {
      config.headers['X-Tenant-Code'] = tenantCode;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export interface Locale {
  code: string;
  name: string;
  native_name?: string;
}

export interface LocaleCreate {
  code: string;
  name: string;
  native_name: string;
}

export const localesApi = {
  async getLocales(): Promise<Locale[]> {
    try {
      const response = await apiClient.get('/locales/');
      console.debug('[localesApi] GET /locales response:', response.status, response.data);
      return response.data;
    } catch (err) {
      console.warn('[localesApi] failed to fetch /locales:', err);
      throw err;
    }
  },

  async createLocale(localeData: LocaleCreate): Promise<Locale> {
    try {
      const response = await apiClient.post('/locales/', localeData);
      console.debug('[localesApi] POST /locales response:', response.status, response.data);
      return response.data;
    } catch (err) {
      console.warn('[localesApi] failed to create locale:', err);
      throw err;
    }
  },

  async getLocale(code: string): Promise<Locale> {
    try {
      const response = await apiClient.get(`/locales/${code}`);
      console.debug('[localesApi] GET /locales/{code} response:', response.status, response.data);
      return response.data;
    } catch (err) {
      console.warn('[localesApi] failed to fetch locale:', err);
      throw err;
    }
  }
};
