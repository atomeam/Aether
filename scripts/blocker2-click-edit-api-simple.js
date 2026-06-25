/**
 * Blocker 2: Click Edit API - Simple Screenshot
 * Simple screenshot after clicking User Profile to see what happens
 */

const PersistentBrowserClient = require('./persistent-browser-client');
const fs = require('fs');

async function blocker2_clickEditAPI_simple() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Simple screenshot approach');
    
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
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    console.log('📸 Taking screenshot...');
    const result = await client.takeScreenshot();
    
    if (result.success) {
      const buffer = Buffer.from(result.screenshot, 'base64');
      fs.writeFileSync('user-profile-click-screenshot.png', buffer);
      console.log('✅ Screenshot saved to user-profile-click-screenshot.png');
    }
    
    console.log('📝 Check the screenshot to see what User Profile button does');
    console.log('📝 Screenshot saved to user-profile-click-screenshot.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

blocker2_clickEditAPI_simple().catch(console.error);
