/**
 * Research RapidAPI Layout
 * Takes screenshot and inspects RapidAPI page to understand layout
 */

const PersistentBrowserClient = require('./persistent-browser-client');
const fs = require('fs');

async function researchRapidAPILayout() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Researching RapidAPI layout...');
    
    // Navigate to RapidAPI
    console.log('📝 Navigating to RapidAPI...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to RapidAPI');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get page info
    const info = await client.getPageInfo();
    console.log('📋 Page URL:', info.url);
    console.log('📋 Page title:', info.title);
    
    // Take screenshot
    console.log('📸 Taking screenshot...');
    const result = await client.takeScreenshot();
    
    if (result.success) {
      const buffer = Buffer.from(result.screenshot, 'base64');
      fs.writeFileSync('rapidapi-layout-screenshot.png', buffer);
      console.log('✅ Screenshot saved to rapidapi-layout-screenshot.png');
    }
    
    // List all buttons
    console.log('📝 Listing all buttons...');
    const buttonsResult = await client.listButtons();
    console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
    
    for (const button of buttonsResult.buttons) {
      if (button.visible) {
        console.log(`  - text="${button.text}", id=${button.id}, className=${button.className}`);
      }
    }
    
    // List all inputs
    console.log('📝 Listing all inputs...');
    const inputsResult = await client.listInputs();
    console.log(`📋 Found ${inputsResult.inputs.length} inputs`);
    
    for (const input of inputsResult.inputs) {
      if (input.visible) {
        console.log(`  - type=${input.type}, name=${input.name}, id=${input.id}, value=${input.value}, placeholder=${input.placeholder}`);
      }
    }
    
    console.log('📝 Research complete. Check the browser window and screenshot.');
    console.log('📝 Screenshot saved to rapidapi-layout-screenshot.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

researchRapidAPILayout().catch(console.error);
