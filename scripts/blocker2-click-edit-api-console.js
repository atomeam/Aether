/**
 * Blocker 2: Click Edit API - Try Console/Workspace
 * Research and fix: Navigate to console or workspace to manage APIs
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_console() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Trying console/workspace approach');
    
    // Navigate to console
    console.log('📝 Navigating to console...');
    await client.navigateTo('https://rapidapi.com/console');
    console.log('✅ Navigated to console');
    
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
    
    // Look for "My APIs" or "Manage APIs"
    console.log('🔍 Looking for manage APIs button...');
    
    const manageSelectors = [
      'button:has-text("My APIs")',
      'a:has-text("My APIs")',
      'button:has-text("Manage APIs")',
      'a:has-text("Manage APIs")',
      'button:has-text("APIs")',
      'a:has-text("APIs")',
    ];
    
    for (const selector of manageSelectors) {
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
    
    console.log('❌ Blocker 2 NOT SOLVED: Could not find manage APIs');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_console().catch(console.error);
