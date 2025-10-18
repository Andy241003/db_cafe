// src/utils/apiTest_new.ts
import { analyticsAPI } from '../services/analyticsAPI';

export const testAnalyticsAPI = async () => {
  try {
    console.log('🧪 Testing Analytics API...');
    
    // Test connection
    console.log('1. Testing connection...');
    const isConnected = await analyticsAPI.testConnection();
    console.log(`Connection status: ${isConnected ? '✅ Connected' : '❌ Failed'}`);
    
    if (!isConnected) {
      console.log('❌ API connection failed. Check if backend is running on http://localhost:8000');
      return false;
    }
    
    // Test tracking
    console.log('2. Testing event tracking...');
    try {
      const trackResult = await analyticsAPI.testTracking();
      console.log('✅ Tracking test successful:', trackResult);
    } catch (error) {
      console.log('❌ Tracking test failed:', error);
    }
    
    // Test stats
    console.log('3. Testing stats endpoint...');
    try {
      const stats = await analyticsAPI.getStats(7);
      console.log('✅ Stats retrieved:', stats);
    } catch (error) {
      console.log('❌ Stats test failed:', error);
    }
    
    // Test realtime
    console.log('4. Testing realtime stats...');
    try {
      const realtime = await analyticsAPI.getRealtimeStats();
      console.log('✅ Realtime stats retrieved:', realtime);
    } catch (error) {
      console.log('❌ Realtime stats test failed:', error);
    }
    
    console.log('🎉 API testing completed!');
    return true;
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
};

export const setupAuth = () => {
  // For demo purposes
  localStorage.setItem('analytics_demo_auth', 'true');
  alert('Demo auth setup completed!');
};

export const clearAuth = () => {
  localStorage.removeItem('analytics_demo_auth');
  sessionStorage.removeItem('analytics_session_id');
  alert('Auth data cleared!');
};