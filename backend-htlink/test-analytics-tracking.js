/**
 * Test Analytics Tracking Script
 * 
 * Chạy script này trong browser console để tạo sample analytics data
 * 
 * Cách dùng:
 * 1. Mở browser console (F12)
 * 2. Copy toàn bộ script này
 * 3. Paste vào console và Enter
 * 4. Chờ script chạy xong (khoảng 30 giây)
 * 5. Refresh Analytics page để xem data
 */

(async function() {
  console.log('🚀 Starting Analytics Test Data Generator...');
  
  // Configuration
  const CONFIG = {
    API_URL: 'https://travel.link360.vn/api/v1/analytics/track', // Production API
    TRACKING_KEY: 'boton_blue_tracking', // Tracking key của Boton Blue Hotel
    NUM_EVENTS: 200, // Số lượng events cần tạo
    DELAY_MS: 50 // Delay giữa các requests (ms)
  };
  
  // Sample data
  const DEVICES = ['desktop', 'mobile', 'tablet'];
  const EVENT_TYPES = ['page_view', 'click', 'share'];
  const PAGES = [
    '/',
    '/rooms',
    '/rooms/deluxe',
    '/rooms/suite',
    '/amenities',
    '/dining',
    '/spa',
    '/gallery',
    '/contact',
    '/booking'
  ];
  const REFERRERS = [
    'https://google.com/search?q=hotel+danang',
    'https://facebook.com',
    'https://booking.com',
    'https://tripadvisor.com',
    'https://instagram.com',
    null // Direct traffic
  ];
  
  // Helper functions
  function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  function randomDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date;
  }
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Generate realistic user agent
  function getRandomUserAgent(device) {
    const userAgents = {
      desktop: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
      ],
      mobile: [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      ],
      tablet: [
        'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 13; SM-X900) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    };
    return randomChoice(userAgents[device]);
  }
  
  // Track single event
  async function trackEvent(eventData) {
    try {
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Tracking failed');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Tracking error:', error.message);
      throw error;
    }
  }
  
  // Generate sample events
  async function generateSampleData() {
    let successCount = 0;
    let errorCount = 0;
    
    console.log(`📊 Generating ${CONFIG.NUM_EVENTS} sample events...`);
    console.log(`⏱️  Estimated time: ${Math.ceil(CONFIG.NUM_EVENTS * CONFIG.DELAY_MS / 1000)} seconds`);
    
    for (let i = 0; i < CONFIG.NUM_EVENTS; i++) {
      const device = randomChoice(DEVICES);
      const eventType = randomChoice(EVENT_TYPES);
      const page = randomChoice(PAGES);
      const referrer = randomChoice(REFERRERS);
      
      const eventData = {
        tracking_key: CONFIG.TRACKING_KEY,
        event_type: eventType,
        device: device,
        user_agent: getRandomUserAgent(device),
        url: `https://app.botonblue.com${page}`,
        referrer: referrer
      };
      
      try {
        await trackEvent(eventData);
        successCount++;
        
        // Progress indicator
        if ((i + 1) % 20 === 0) {
          console.log(`✅ Progress: ${i + 1}/${CONFIG.NUM_EVENTS} events created`);
        }
      } catch (error) {
        errorCount++;
      }
      
      // Delay to avoid overwhelming the server
      await sleep(CONFIG.DELAY_MS);
    }
    
    return { successCount, errorCount };
  }
  
  // Main execution
  try {
    const startTime = Date.now();
    
    // Check if tracking key is valid first
    console.log('🔍 Testing tracking key...');
    await trackEvent({
      tracking_key: CONFIG.TRACKING_KEY,
      event_type: 'page_view',
      device: 'desktop',
      user_agent: navigator.userAgent,
      url: 'https://app.botonblue.com/test',
      referrer: null
    });
    console.log('✅ Tracking key is valid!');
    
    // Generate sample data
    const { successCount, errorCount } = await generateSampleData();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 ANALYTICS TEST DATA GENERATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Success: ${successCount} events`);
    console.log(`❌ Errors: ${errorCount} events`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log('='.repeat(50));
    console.log('\n💡 Next steps:');
    console.log('1. Go to Analytics page');
    console.log('2. Refresh the page (Ctrl + R)');
    console.log('3. You should see the data in charts and stats');
    console.log('\n🎉 Done!');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('1. Invalid tracking_key - Check your Property settings');
    console.log('2. Backend server not running - Start Docker containers');
    console.log('3. CORS issue - Check backend CORS settings');
    console.log('\nTo fix:');
    console.log('1. Go to Properties page');
    console.log('2. Create a property or get the tracking_key');
    console.log('3. Update CONFIG.TRACKING_KEY in this script');
    console.log('4. Run the script again');
  }
})();

