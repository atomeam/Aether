/**
 * Blocker 2: Click Edit API - Direct Profile URL
 * Research and fix: Navigate directly to profile URL
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_direct() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Trying direct profile URL');
    
    // Navigate directly to profile URL
    console.log('📝 Navigating to profile URL...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind');
    console.log('✅ Navigated to profile URL');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const info = await client.getPageInfo();
    console.log(`📋 Current URL: ${info.url}`);
    console.log(`📋 Page title: ${info.title}`);
    
    // List buttons
    const buttonsResult = await client.listButtons();
    console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
    
    for (const button of buttonsResult.buttons) {
      if (button.visible) {
        console.log(`  - text="${button.text}"`);
      }
    }
    
    // Look for "APIs" or "Published APIs"
    console.log('🔍 Looking for APIs button...');
    
    const apiSelectors = [
      'button:has-text("APIs")',
      'a:has-text("APIs")',
      'button:has-text("Published APIs")',
      'a:has-text("Published APIs")',
    ];
    
    for (const selector of apiSelectors) {
      try {
        await client.clickElement(selector);
        console.log(`✅ Clicked with selector: ${selector}`);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const info2 = await client.getPageInfo();
        console.log(`📋 Current URL: ${info2.url}`);
        
        // List buttons again
        const buttons2 = await client.listButtons();
        console.log(`📋 Found ${buttons2.buttons.length} buttons`);
        
        for (const button of buttons2.buttons) {
          if (button.visible) {
            console.log(`  - text="${button.text}"`);
          }
        }
        
        // Look for a-to-mind API
        const aToMindButton = buttons2.buttons.find(b => b.text.includes('a-to-mind'));
        if (aToMindButton) {
          console.log(`📝 Found a-to-mind button: ${aToMindButton.text}`);
          console.log('✅ Blocker 2 SOLVED: Found user\'s APIs page with a-to-mind');
          return true;
        }
        
      } catch (error) {
        continue;
      }
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: Could not find APIs on profile');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_direct().catch(console.error);
