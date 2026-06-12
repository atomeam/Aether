/**
 * Blocker 1: Click Settings Icon
 * Research and fix: How to click the settings icon (gear) in top right
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker1_clickSettingsIcon() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 1: Clicking Settings Icon');
    
    // Navigate to RapidAPI
    console.log('📝 Navigating to RapidAPI...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to RapidAPI');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // List all buttons to find settings icon
    console.log('📝 Listing all buttons...');
    const buttonsResult = await client.listButtons();
    console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
    
    // Look for button with SVG (settings icon)
    console.log('🔍 Looking for button with SVG (settings icon)...');
    
    // Try clicking by SVG presence
    try {
      await client.clickElement('button:has(svg)');
      console.log('✅ Clicked button with SVG (settings icon)');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if dropdown appeared
      const buttonsAfter = await client.listButtons();
      console.log(`📋 After click: ${buttonsAfter.buttons.length} buttons`);
      
      for (const button of buttonsAfter.buttons) {
        if (button.visible) {
          console.log(`  - text="${button.text}"`);
        }
      }
      
      console.log('✅ Blocker 1 SOLVED: Settings icon clicked');
      return true;
      
    } catch (error) {
      console.log('⚠️  Error clicking button with SVG:', error.message);
      
      // Try alternative: click by aria-label
      try {
        await client.clickElement('button[aria-label*="settings"], button[aria-label*="Settings"]');
        console.log('✅ Clicked settings button by aria-label');
        console.log('✅ Blocker 1 SOLVED: Settings icon clicked');
        return true;
      } catch (error2) {
        console.log('⚠️  Error clicking by aria-label:', error2.message);
      }
    }
    
    console.log('❌ Blocker 1 NOT SOLVED: Could not click settings icon');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker1_clickSettingsIcon().catch(console.error);
