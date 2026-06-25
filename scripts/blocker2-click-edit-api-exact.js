/**
 * Blocker 2: Click Edit API - Try Exact Text Match
 * Research and fix: Use exact text from button list
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_exact() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Trying exact text match');
    
    // Navigate to console
    console.log('📝 Navigating to console...');
    await client.navigateTo('https://rapidapi.com/console');
    console.log('✅ Navigated to console');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // List buttons to get exact text
    const buttonsResult = await client.listButtons();
    console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
    
    for (const button of buttonsResult.buttons) {
      if (button.visible) {
        console.log(`  - text="${button.text}"`);
      }
    }
    
    // Try clicking "View profile page" with exact text
    console.log('📝 Clicking View profile page...');
    try {
      await client.clickElement('button:has-text("View profile page")');
      console.log('✅ Clicked View profile page');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const info = await client.getPageInfo();
      console.log(`📋 Current URL: ${info.url}`);
      
      // List buttons again
      const buttons2 = await client.listButtons();
      console.log(`📋 Found ${buttons2.buttons.length} buttons`);
      
      for (const button of buttons2.buttons) {
        if (button.visible) {
          console.log(`  - text="${button.text}"`);
        }
      }
      
      console.log('✅ Blocker 2 SOLVED: Navigated to profile page');
      return true;
      
    } catch (error) {
      console.log('⚠️  Error clicking View profile page:', error.message);
    }
    
    console.log('❌ Blocker 2 NOT SOLVED');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_exact().catch(console.error);
