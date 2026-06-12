/**
 * Blocker 2: Click Edit API - Try Hover and Click
 * Research and fix: Try hovering over settings icon then clicking dropdown items
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_hover() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Trying hover approach');
    
    // Navigate to API page
    console.log('📝 Navigating to API page...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Hover over settings icon
    console.log('📝 Hovering over settings icon...');
    // Note: Persistent browser service doesn't support hover yet
    // Let's try clicking and waiting longer
    
    await client.clickElement('button:has(svg)');
    console.log('✅ Clicked settings icon');
    
    // Wait longer for dropdown
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // List buttons again
    const buttonsResult = await client.listButtons();
    console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
    
    for (const button of buttonsResult.buttons) {
      if (button.visible) {
        console.log(`  - text="${button.text}"`);
      }
    }
    
    // Look for Edit API
    const editButton = buttonsResult.buttons.find(b => b.text.includes('Edit') || b.text.includes('edit'));
    if (editButton) {
      console.log(`📝 Found Edit button: ${editButton.text}`);
      try {
        await client.clickElement(`button:has-text("${editButton.text}")`);
        console.log('✅ Clicked Edit button');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const info = await client.getPageInfo();
        console.log(`📋 Current URL: ${info.url}`);
        
        console.log('✅ Blocker 2 SOLVED: Clicked Edit button');
        return true;
      } catch (error) {
        console.log('⚠️  Error clicking Edit button:', error.message);
      }
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: Could not find Edit button');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_hover().catch(console.error);
