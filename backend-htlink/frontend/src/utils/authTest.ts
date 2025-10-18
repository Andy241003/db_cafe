// Test authentication with production domain
export const testAuth = () => {
  // Set production domain for testing
  const productionDomain = new URL(window.location.href).hostname;
  
  // Map production domain to tenant code
  let tenantCode = 'demo'; // default for localhost
  
  if (productionDomain.includes('zalominiapp.vtlink.vn')) {
    tenantCode = 'premier_admin'; // or whatever your production tenant code is
  }
  
  localStorage.setItem('tenant_domain', tenantCode);
  
  // Test API call - use same origin for production
  const apiUrl = import.meta.env.VITE_API_URL || 
    (window.location.protocol === 'https:' ? `${window.location.protocol}//${window.location.hostname}` : 'http://localhost:8000');
  
  return fetch(`${apiUrl}/api/v1/auth/test-token`, {
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