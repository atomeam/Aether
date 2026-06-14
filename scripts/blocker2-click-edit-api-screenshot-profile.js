/**
 * Blocker 2: Click Edit API - Screenshot Profile Navigation
 * Take screenshot after clicking User Profile to see where it goes
 */

const PersistentBrowserClient = require('./persistent-browser-client');
const fs = require('fs');

async function blocker2_clickEditAPI_screenshotProfile() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Screenshot profile navigation');
    
    // Navigate to API page
    console.log('📝 Navigating to API page...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click User Profile button
    console.log('📝 Clicking User Profile button...');
    const clickCode = `
      (function() {
        const allButtons = document.querySelectorAll('button');
        for (const button of allButtons) {
          const ariaLabel = button.getAttribute('aria-label') || '';
          if (ariaLabel === 'User Profile') {
            button.click();
            return 'Clicked User Profile';
          }
        }
        return 'User Profile not found';
      })()
    `;
    
    await client.executeJavaScript(clickCode);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot
    console.log('📸 Taking screenshot...');
    const result = await client.takeScreenshot();
    
    if (result.success) {
      const buffer = Buffer.from(result.screenshot, 'base64');
      fs.writeFileSync('profile-navigation-screenshot.png', buffer);
      console.log('✅ Screenshot saved to profile-navigation-screenshot.png');
    }
    
    // Get current URL
    const info = await client.getPageInfo();
    console.log(`📋 Current URL: ${info.url}`);
    console.log(`📋 Page title: ${info.title}`);
    
    console.log('📝 Check the screenshot to see where User Profile leads');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

blocker2_clickEditAPI_screenshotProfile().catch(console.error);
