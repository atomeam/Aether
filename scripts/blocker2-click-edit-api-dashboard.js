/**
 * Blocker 2: Click Edit API - Try Dashboard Approach
 * Research and fix: Navigate to dashboard first, then find API
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_dashboard() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Trying dashboard approach');
    
    // Navigate to dashboard
    console.log('📝 Navigating to dashboard...');
    await client.navigateTo('https://rapidapi.com/hub');
    console.log('✅ Navigated to dashboard');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const info = await client.getPageInfo();
    console.log(`📋 Current URL: ${info.url}`);
    console.log(`📋 Page title: ${info.title}`);
    
    // List buttons to see what's available
    const buttonsResult = await client.listButtons();
    console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
    
    for (const button of buttonsResult.buttons) {
      if (button.visible) {
        console.log(`  - text="${button.text}"`);
      }
    }
    
    // Look for "My APIs" or similar
    console.log('🔍 Looking for My APIs or similar button...');
    
    const myAPIsSelectors = [
      'button:has-text("My APIs")',
      'a:has-text("My APIs")',
      'button:has-text("APIs")',
      'a:has-text("APIs")',
    ];
    
    for (const selector of myAPIsSelectors) {
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
        
        console.log('✅ Blocker 2 SOLVED: Found APIs page');
        return true;
        
      } catch (error) {
        continue;
      }
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: Could not find APIs page');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_dashboard().catch(console.error);
