/**
 * Blocker 2: Click Edit API - Quick Check
 * Quick check without long waits
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_quick() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Quick check');
    
    // Navigate to API page
    console.log('📝 Navigating to API page...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get current URL before click
    const infoBefore = await client.getPageInfo();
    console.log(`📋 URL before click: ${infoBefore.url}`);
    
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
    
    // Wait only 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get current URL after click
    const infoAfter = await client.getPageInfo();
    console.log(`📋 URL after click: ${infoAfter.url}`);
    
    if (infoAfter.url !== infoBefore.url) {
      console.log('✅ User Profile button navigated to a new page');
      console.log('📝 New page:', infoAfter.url);
      
      // Look for Edit API on new page
      const buttonsResult = await client.listButtons();
      console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
      
      for (const button of buttonsResult.buttons) {
        if (button.visible) {
          console.log(`  - text="${button.text}"`);
        }
      }
      
      const editButton = buttonsResult.buttons.find(b => 
        b.text.toLowerCase().includes('edit') || 
        b.text.toLowerCase().includes('settings')
      );
      
      if (editButton) {
        console.log(`📝 Found button: ${editButton.text}`);
        console.log('✅ Blocker 2 SOLVED: User Profile leads to page with Edit/Settings');
        return true;
      }
    } else {
      console.log('⚠️  User Profile button did not navigate (might open modal)');
    }
    
    console.log('❌ Blocker 2 NOT SOLVED');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_quick().catch(console.error);
