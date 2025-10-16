import axios from 'axios';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for long content translation
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
  /**
   * Enhanced translation with DeepL/Google Cloud support
   * 
   * @param texts - Array of texts to translate
   * @param target - Target language code (e.g., 'vi', 'ja', 'ko')
   * @param source - Source language code (default: 'auto' for auto-detection)
   * @param is_html - Whether the text contains HTML (preserves tags and images)
   * @param concurrent - Number of parallel translation requests
   * @param prefer_deepl - Prefer DeepL over Google Cloud (default: true)
   * @param apply_glossary - Apply hotel industry glossary (default: true)
   */
  async translateBatch(
    texts: string[], 
    target = 'en', 
    source = 'auto', 
    is_html = false, 
    concurrent = 4,
    prefer_deepl = true,
    apply_glossary = true
  ) {
    const response = await apiClient.post('/translations/translate', {
      texts,
      target,
      source,
      is_html,
      concurrent,
      prefer_deepl,
      apply_glossary
    }, {
      timeout: 120000, // 2 minutes for very long content
    });
    
    return response.data;
  }
};
