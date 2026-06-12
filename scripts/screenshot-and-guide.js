/**
 * Take Screenshot and Guide Manual Fix
 * Takes screenshot of current page and guides manual fix
 */

const PersistentBrowserClient = require('./persistent-browser-client');
const fs = require('fs');

async function screenshotAndGuide() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🚀 Taking screenshot of current page...');
    
    const result = await client.takeScreenshot();
    
    if (result.success) {
      const buffer = Buffer.from(result.screenshot, 'base64');
      fs.writeFileSync('rapidapi-page-screenshot.png', buffer);
      console.log('✅ Screenshot saved to rapidapi-page-screenshot.png');
    }
    
    console.log('📝 Manual fix steps:');
    console.log('1. Look at the browser window');
    console.log('2. Find Edit API or Settings button (usually top right)');
    console.log('3. Click it');
    console.log('4. Find the domain/endpoint URL field');
    console.log('5. Remove leading dot: .www.a-to-mind.com → a-to-mind.com');
    console.log('6. OR use: bridge.a-to-mind.com (recommended)');
    console.log('7. Click Save');
    console.log('');
    console.log('⏸️  Press Enter in terminal when domain is fixed...');
    
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('✅ Domain fix completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

screenshotAndGuide().catch(console.error);
