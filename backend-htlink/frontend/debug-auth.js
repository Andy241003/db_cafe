// Quick test script - paste in browser console to debug auth issue

const debugAuth = async () => {
  console.log('🔍 === AUTH DEBUG STARTED ===');
  
  // Step 1: Check localStorage
  const authData = {
    token: localStorage.getItem('access_token'),
    isAuth: localStorage.getItem('isAuthenticated'),
    tenantCode: localStorage.getItem('tenant_code'),
    tenantId: localStorage.getItem('tenant_id'),
    currentUser: localStorage.getItem('currentUser')
  };
  
  console.log('📱 localStorage:', authData);
  
  if (!authData.token) {
    console.error('❌ No token found - need to login!');
    return;
  }
  
  // Step 2: Test /users/me endpoint
  try {
    console.log('🧪 Testing /users/me endpoint...');
    const meResponse = await fetch('http://localhost:8000/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'X-Tenant-Code': authData.tenantCode || 'demo',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('👤 /users/me status:', meResponse.status);
    if (meResponse.ok) {
      const userData = await meResponse.json();
      console.log('👤 Current user data:', userData);
      
      // Update tenant if needed
      const correctTenant = userData.tenant_id === 1 ? 'demo' : 'premier_admin';
      if (authData.tenantCode !== correctTenant) {
        console.log('🔄 Updating tenant:', { old: authData.tenantCode, new: correctTenant });
        localStorage.setItem('tenant_code', correctTenant);
        localStorage.setItem('tenant_id', userData.tenant_id.toString());
      }
      
      // Step 3: Test /users/ endpoint with correct tenant
      console.log('🧪 Testing /users/ endpoint...');
      const usersResponse = await fetch('http://localhost:8000/api/v1/users/?skip=0&limit=100', {
        headers: {
          'Authorization': `Bearer ${authData.token}`,
          'X-Tenant-Code': correctTenant,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📋 /users/ status:', usersResponse.status);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('📋 Users data:', usersData);
        console.log('✅ SUCCESS! Users endpoint working');
      } else {
        const errorData = await usersResponse.text();
        console.error('❌ /users/ failed:', {
          status: usersResponse.status,
          statusText: usersResponse.statusText,
          body: errorData
        });
      }
      
    } else {
      const errorData = await meResponse.text();
      console.error('❌ /users/me failed:', {
        status: meResponse.status,
        statusText: meResponse.statusText,
        body: errorData
      });
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
  
  console.log('🔍 === AUTH DEBUG COMPLETED ===');
};

// Auto-run
debugAuth();