/**
 * Research Settings Page Layout
 * Takes screenshot and inspects settings page
 */

const PersistentBrowserClient = require('./persistent-browser-client');
const fs = require('fs');

async function researchSettingsLayout() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Researching settings page layout...');
    
    // Take screenshot of current page (should be settings)
    console.log('📸 Taking screenshot of settings page...');
    const result = await client.takeScreenshot();
    
    if (result.success) {
      const buffer = Buffer.from(result.screenshot, 'base64');
      fs.writeFileSync('rapidapi-settings-screenshot.png', buffer);
      console.log('✅ Screenshot saved to rapidapi-settings-screenshot.png');
    }
    
    // Get page info
    const info = await client.getPageInfo();
    console.log('📋 Page URL:', info.url);
    console.log('📋 Page title:', info.title);
    
    // List all buttons
    console.log('📝 Listing all buttons...');
    const buttonsResult = await client.listButtons();
    console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
    
    for (const button of buttonsResult.buttons) {
      if (button.visible) {
        console.log(`  - text="${button.text}"`);
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
    console.log('📝 Screenshot saved to rapidapi-settings-screenshot.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

researchSettingsLayout().catch(console.error);
