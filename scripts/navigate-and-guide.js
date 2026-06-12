/**
 * Navigate to RapidAPI and Guide Manual Fix
 * Navigates to RapidAPI and guides manual domain fix
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function navigateAndGuide() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🚀 Navigating to RapidAPI and guiding manual fix...');
    
    // Navigate to RapidAPI
    console.log('📝 Navigating to RapidAPI...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to RapidAPI');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    console.log('📸 Taking screenshot...');
    const result = await client.takeScreenshot();
    
    if (result.success) {
      const fs = require('fs');
      const buffer = Buffer.from(result.screenshot, 'base64');
      fs.writeFileSync('rapidapi-page-screenshot.png', buffer);
      console.log('✅ Screenshot saved to rapidapi-page-screenshot.png');
    }
    
    // List buttons
    console.log('📝 Listing buttons...');
    const buttonsResult = await client.listButtons();
    console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
    
    for (const button of buttonsResult.buttons) {
      if (button.visible) {
        console.log(`  - "${button.text}"`);
      }
    }
    
    console.log('');
    console.log('📝 Manual fix steps:');
    console.log('1. Look at the browser window (you should see the RapidAPI page)');
    console.log('2. Find Edit API or Settings button (usually top right corner)');
    console.log('3. Click it');
    console.log('4. Find the domain/endpoint URL field');
    console.log('5. Remove leading dot: .www.a-to-mind.com → a-to-mind.com');
    console.log('6. OR use: bridge.a-to-mind.com (recommended, already working)');
    console.log('7. Click Save');
    console.log('');
    console.log('⏸️  Press Enter in terminal when domain is fixed...');
    
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('✅ Domain fix completed');
    console.log('📝 Browser is still alive');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Please complete manually in the browser window');
  }
}

navigateAndGuide().catch(console.error);
