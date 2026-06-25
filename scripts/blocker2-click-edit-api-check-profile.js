/**
 * Blocker 2: Click Edit API - Check Profile Navigation
 * Check where User Profile button navigates to
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_checkProfile() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Checking where User Profile navigates');
    
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
    
    // Get current URL
    const info = await client.getPageInfo();
    console.log(`📋 Current URL after clicking User Profile: ${info.url}`);
    console.log(`📋 Page title: ${info.title}`);
    
    // List buttons on new page
    const buttonsResult = await client.listButtons();
    console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
    
    for (const button of buttonsResult.buttons) {
      if (button.visible) {
        console.log(`  - text="${button.text}"`);
      }
    }
    
    // Look for Edit API or Settings
    const editButton = buttonsResult.buttons.find(b => 
      b.text.toLowerCase().includes('edit') || 
      b.text.toLowerCase().includes('settings') ||
      b.text.toLowerCase().includes('api')
    );
    
    if (editButton) {
      console.log(`📝 Found button: ${editButton.text}`);
      
      await client.clickElement(`button:has-text("${editButton.text}")`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const info2 = await client.getPageInfo();
      console.log(`📋 Current URL after clicking: ${info2.url}`);
      
      if (info2.url.includes('edit') || info2.url.includes('settings')) {
        console.log('✅ Blocker 2 SOLVED: User Profile navigation led to settings');
        return true;
      }
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: User Profile did not lead to settings');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_checkProfile().catch(console.error);
