// Test authentication with production domain
export const testAuth = () => {
  // Set production domain for testing
  const productionDomain = new URL(window.location.href).hostname;
  console.log('Current domain:', productionDomain);
  
  // Map production domain to tenant code
  let tenantCode = 'demo'; // default for localhost
  
  if (productionDomain.includes('zalominiapp.vtlink.vn')) {
    tenantCode = 'premier_admin'; // or whatever your production tenant code is
  }
  
  console.log('Setting tenant code:', tenantCode);
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
  .then(response => {
    console.log('Auth test response:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Auth test data:', data);
    return data;
  })
  .catch(error => {
    console.error('Auth test error:', error);
    throw error;
  });
};