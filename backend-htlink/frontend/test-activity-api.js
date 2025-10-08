// Test Activity API endpoints
// Run this in browser console when on the frontend

async function testActivityAPI() {
  console.log('🧪 Activity API Test Starting...');
  
  const baseURL = window.location.origin + '/api/v1';
  const token = localStorage.getItem('access_token');
  const tenantCode = localStorage.getItem('tenant_code') || 'demo';
  
  console.log('🔍 Auth Info:', {
    hasToken: !!token,
    tenantCode,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'None'
  });
  
  if (!token) {
    console.error('❌ No access token found. Please login first.');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-Code': tenantCode,
    'Content-Type': 'application/json'
  };
  
  // Test 1: Get activity logs
  console.log('\n📍 Test 1: Get Activity Logs');
  try {
    const response = await fetch(`${baseURL}/activity-logs/?limit=10&days=7`, {
      method: 'GET',
      headers
    });
    
    console.log('📊 Activity logs response:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Activity logs data:', data);
      console.log(`📈 Found ${Array.isArray(data) ? data.length : 'N/A'} activities`);
    } else {
      const errorText = await response.text();
      console.error('❌ Activity logs error:', errorText);
    }
  } catch (error) {
    console.error('❌ Activity logs request failed:', error);
  }
  
  // Test 2: Seed sample data
  console.log('\n📍 Test 2: Seed Sample Data');
  try {
    const response = await fetch(`${baseURL}/activity-logs/seed-sample-data?count=15`, {
      method: 'POST',
      headers
    });
    
    console.log('🌱 Seed data response:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Seed data result:', data);
    } else {
      const errorText = await response.text();
      console.error('❌ Seed data error:', errorText);
    }
  } catch (error) {
    console.error('❌ Seed data request failed:', error);
  }
  
  // Test 3: Get activity logs again after seeding
  console.log('\n📍 Test 3: Get Activity Logs After Seeding');
  try {
    const response = await fetch(`${baseURL}/activity-logs/?limit=20&days=30`, {
      method: 'GET',
      headers
    });
    
    console.log('📊 Activity logs (after seed) response:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Activity logs (after seed) data:', data);
      console.log(`📈 Found ${Array.isArray(data) ? data.length : 'N/A'} activities`);
      
      // Show sample activities
      if (Array.isArray(data) && data.length > 0) {
        console.log('\n📋 Sample Activities:');
        data.slice(0, 5).forEach((activity, index) => {
          console.log(`${index + 1}. ${activity.activity_type} - ${activity.created_at}`);
          if (activity.details) {
            console.log(`   Details:`, activity.details);
          }
        });
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Activity logs (after seed) error:', errorText);
    }
  } catch (error) {
    console.error('❌ Activity logs (after seed) request failed:', error);
  }
  
  // Test 4: Test frontend API service
  console.log('\n📍 Test 4: Frontend API Service');
  try {
    // Import the API service if available
    if (window.analyticsAPI) {
      console.log('🔍 Testing frontend analyticsAPI service...');
      
      const recentActivities = await window.analyticsAPI.getRecentActivities(5);
      console.log('✅ Recent activities from service:', recentActivities);
      
      const allActivities = await window.analyticsAPI.getAllActivities(10, 30);
      console.log('✅ All activities from service:', allActivities);
    } else {
      console.log('⚠️ analyticsAPI not available on window object');
    }
  } catch (error) {
    console.error('❌ Frontend API service test failed:', error);
  }
  
  console.log('\n🎉 Activity API Test Complete!');
}

// Auto-run the test
testActivityAPI();
