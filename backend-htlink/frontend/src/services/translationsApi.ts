import axios from 'axios';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

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

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const tenantCode = getTenantCode();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantCode) config.headers['X-Tenant-Code'] = tenantCode;
  return config;
});

export const translationsApi = {
  async translateBatch(texts: string[], target = 'en', source = 'auto', is_html = false, concurrent = 8, libre_url?: string) {
    const response = await apiClient.post('/translations/translate', texts, {
      params: { target, source, is_html: is_html ? 'true' : 'false', concurrent, libre_url },
    });
    return response.data;
  }
};
