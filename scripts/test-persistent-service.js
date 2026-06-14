/**
 * Test Persistent Browser Service
 * Tests the persistent browser service by navigating to a page
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function testService() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🧪 Testing persistent browser service...');
    
    // Navigate to Google
    console.log('📝 Navigating to Google...');
    await client.navigateTo('https://accounts.google.com');
    console.log('✅ Navigated to Google');
    
    // Get page info
    console.log('📝 Getting page info...');
    const info = await client.getPageInfo();
    console.log('✅ Page info:', info);
    
    console.log('✅ Service test successful');
    console.log('📝 Browser is still alive and ready for more commands');
    
  } catch (error) {
    console.error('❌ Service test failed:', error.message);
  }
}

testService().catch(console.error);
