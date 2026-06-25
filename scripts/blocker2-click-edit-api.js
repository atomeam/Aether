/**
 * Blocker 2: Click Edit API
 * Research and fix: How to click "Edit API" from settings dropdown
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Clicking Edit API');
    
    // Navigate to RapidAPI
    console.log('📝 Navigating to RapidAPI...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to RapidAPI');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click settings icon
    console.log('📝 Clicking settings icon...');
    await client.clickElement('button:has(svg)');
    console.log('✅ Settings icon clicked');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to find Edit API button
    console.log('🔍 Looking for Edit API button...');
    const buttonsResult = await client.listButtons();
    console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
    
    for (const button of buttonsResult.buttons) {
      if (button.visible) {
        console.log(`  - text="${button.text}"`);
      }
    }
    
    // Try clicking Edit API
    try {
      await client.clickElement('button:has-text("Edit API")');
      console.log('✅ Clicked Edit API button');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if we're on edit page
      const info = await client.getPageInfo();
      console.log(`📋 Current URL: ${info.url}`);
      
      if (info.url.includes('edit') || info.url.includes('settings')) {
        console.log('✅ Blocker 2 SOLVED: Edit API clicked, on edit page');
        return true;
      }
    } catch (error) {
      console.log('⚠️  Error clicking Edit API:', error.message);
    }
    
    // Alternative: Try navigating directly to edit URL
    console.log('🔍 Trying direct navigation to edit URL...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api/edit');
    console.log('✅ Navigated to edit URL');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const info2 = await client.getPageInfo();
    console.log(`📋 Current URL: ${info2.url}`);
    
    if (info2.url.includes('edit')) {
      console.log('✅ Blocker 2 SOLVED: Direct navigation to edit page');
      return true;
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: Could not access edit page');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI().catch(console.error);
