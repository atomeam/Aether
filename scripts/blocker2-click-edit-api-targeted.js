/**
 * Blocker 2: Click Edit API - Target Profile/Preferences Buttons
 * Try User Profile and Manage Preferences buttons specifically
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_targeted() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Targeting Profile/Preferences buttons');
    
    // Navigate to API page
    console.log('📝 Navigating to API page...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try User Profile button
    console.log('📝 Trying User Profile button...');
    const clickCode1 = `
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
    
    await client.executeJavaScript(clickCode1);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for overlay with Edit API
    const checkCode = `
      (function() {
        const overlay = document.querySelector('[role="menu"]');
        if (!overlay) return { found: false };
        
        const allElements = overlay.querySelectorAll('*');
        for (const el of allElements) {
          const text = el.textContent?.trim() || '';
          if (text.toLowerCase().includes('edit') && text.toLowerCase().includes('api')) {
            return { found: true, text: text.substring(0, 100) };
          }
        }
        return { found: false };
      })()
    `;
    
    const checkResult = await client.executeJavaScript(checkCode);
    
    if (checkResult.result.found) {
      console.log(`✅ Found Edit API in menu from User Profile button`);
      
      // Click Edit API
      const clickEditCode = `
        (function() {
          const overlay = document.querySelector('[role="menu"]');
          if (!overlay) return 'Overlay not found';
          
          const allElements = overlay.querySelectorAll('*');
          for (const el of allElements) {
            const text = el.textContent?.trim() || '';
            if (text.toLowerCase().includes('edit') && text.toLowerCase().includes('api')) {
              const parentButton = el.closest('button, a, div[role="menuitem"]');
              if (parentButton) {
                parentButton.click();
                return 'Clicked Edit API';
              }
              el.click();
              return 'Clicked Edit API';
            }
          }
          return 'Edit API not found';
        })()
      `;
      
      await client.executeJavaScript(clickEditCode);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const info = await client.getPageInfo();
      console.log(`📋 Current URL: ${info.url}`);
      
      if (info.url.includes('edit') || info.url.includes('settings')) {
        console.log('✅ Blocker 2 SOLVED: User Profile button opened menu with Edit API');
        return true;
      }
    }
    
    // Try Manage Preferences button
    console.log('📝 Trying Manage Preferences button...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const clickCode2 = `
      (function() {
        const allButtons = document.querySelectorAll('button');
        for (const button of allButtons) {
          const ariaLabel = button.getAttribute('aria-label') || '';
          if (ariaLabel === 'Manage Preferences') {
            button.click();
            return 'Clicked Manage Preferences';
          }
        }
        return 'Manage Preferences not found';
      })()
    `;
    
    await client.executeJavaScript(clickCode2);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const checkResult2 = await client.executeJavaScript(checkCode);
    
    if (checkResult2.result.found) {
      console.log(`✅ Found Edit API in menu from Manage Preferences button`);
      
      await client.executeJavaScript(clickEditCode);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const info2 = await client.getPageInfo();
      console.log(`📋 Current URL: ${info2.url}`);
      
      if (info2.url.includes('edit') || info2.url.includes('settings')) {
        console.log('✅ Blocker 2 SOLVED: Manage Preferences button opened menu with Edit API');
        return true;
      }
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: Profile/Preferences buttons did not open menu with Edit API');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_targeted().catch(console.error);
