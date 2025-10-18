// Test authentication with production domain
import { getApiBaseUrl } from './api';

export const testAuth = () => {
  // Set production domain for testing
  const productionDomain = new URL(window.location.href).hostname;
  
  // Map production domain to tenant code
  let tenantCode = 'demo'; // default for localhost
  
  if (productionDomain.includes('zalominiapp.vtlink.vn')) {
    tenantCode = 'premier_admin'; // or whatever your production tenant code is
  }
  
  localStorage.setItem('tenant_domain', tenantCode);
  
  // Test API call - use centralized API URL
  const apiUrl = getApiBaseUrl();
  
  return fetch(`${apiUrl}/auth/test-token`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'X-Tenant-Code': tenantCode,
      'Content-Type': 'application/json',
    }
  })
  .then(response => response.json())
  .then(data => data)
  .catch(error => {
    throw error;
  });
};