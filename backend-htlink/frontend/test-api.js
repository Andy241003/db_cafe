// Test Analytics API endpoints
// Run this in browser console when on the analytics page

async function quickTestAPI() {
  console.log('🧪 Quick API Test Starting...');
  
  const baseURL = 'http://localhost:8000/api/v1';
  
  // Test 1: Check if analytics endpoints exist
  console.log('📍 Testing endpoint availability...');
  
  try {
    // Test basic endpoint
    const dashboardResponse = await fetch(`${baseURL}/analytics/dashboard-stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'demo-tenant-id',
        'Authorization': 'Bearer demo-token'
      }
    });
    
    console.log('📊 Dashboard stats:', dashboardResponse.status, await dashboardResponse.text());
    
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
  }
  
  try {
    // Test analytics main endpoint
    const analyticsResponse = await fetch(`${baseURL}/analytics/?start_date=2024-10-01&end_date=2024-10-31&time_filter=30d`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'demo-tenant-id',
        'Authorization': 'Bearer demo-token'
      }
    });
    
    console.log('📈 Analytics main:', analyticsResponse.status, await analyticsResponse.text());
    
  } catch (error) {
    console.error('❌ Analytics main error:', error);
  }
  
  try {
    // Test realtime endpoint
    const realtimeResponse = await fetch(`${baseURL}/analytics/realtime`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'demo-tenant-id',
        'Authorization': 'Bearer demo-token'
      }
    });
    
    console.log('⚡ Realtime stats:', realtimeResponse.status, await realtimeResponse.text());
    
  } catch (error) {
    console.error('❌ Realtime error:', error);
  }
}

// Run the test
quickTestAPI();