/**
 * Blocker 2: Click Edit API - Screenshot After Settings Click
 * Take screenshot after clicking Settings to see what happens
 */

const PersistentBrowserClient = require('./persistent-browser-client');
const fs = require('fs');

async function blocker2_clickEditAPI_screenshotSettings() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Screenshot after Settings click');
    
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot before clicking Settings
    console.log('📸 Taking screenshot before clicking Settings...');
    const result1 = await client.takeScreenshot();
    if (result1.success) {
      const buffer1 = Buffer.from(result1.screenshot, 'base64');
      fs.writeFileSync('before-settings-click.png', buffer1);
      console.log('✅ Screenshot saved to before-settings-click.png');
    }
    
    // Click Settings
    console.log('📝 Clicking Settings...');
    const settingsCode = `
      (function() {
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          const text = el.textContent?.trim() || '';
          if (text === 'Settings') {
            const parentButton = el.closest('button, a, div[role="menuitem"]');
            if (parentButton) {
              parentButton.click();
              return 'Clicked Settings';
            }
            el.click();
            return 'Clicked Settings';
          }
        }
        return 'Settings not found';
      })()
    `;
    
    await client.executeJavaScript(settingsCode);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot after clicking Settings
    console.log('📸 Taking screenshot after clicking Settings...');
    const result2 = await client.takeScreenshot();
    if (result2.success) {
      const buffer2 = Buffer.from(result2.screenshot, 'base64');
      fs.writeFileSync('after-settings-click.png', buffer2);
      console.log('✅ Screenshot saved to after-settings-click.png');
    }
    
    // Get current URL
    const info = await client.getPageInfo();
    console.log(`📋 Current URL: ${info.url}`);
    console.log(`📋 Page title: ${info.title}`);
    
    console.log('📝 Check screenshots to see what happened');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

blocker2_clickEditAPI_screenshotSettings().catch(console.error);
