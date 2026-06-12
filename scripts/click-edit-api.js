/**
 * Click Edit API from Settings Dropdown
 * Clicks Edit API option from settings dropdown
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function clickEditAPI() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🚀 Clicking Edit API from settings dropdown...');
    
    // Try to find and click Edit API button
    console.log('📝 Looking for Edit API button...');
    const buttonsResult = await client.listButtons();
    console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
    
    for (const button of buttonsResult.buttons) {
      if (button.visible) {
        console.log(`  - text="${button.text}"`);
      }
    }
    
    // Try to click Edit API
    const editSelectors = [
      'button:has-text("Edit API")',
      'a:has-text("Edit API")',
      '[data-testid*="edit"]',
      '[data-testid*="edit-api"]',
    ];
    
    let clicked = false;
    for (const selector of editSelectors) {
      try {
        await client.clickElement(selector);
        console.log(`✅ Clicked Edit API with selector: ${selector}`);
        clicked = true;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!clicked) {
      console.log('⚠️  Could not find Edit API button');
      console.log('📝 Please manually click Edit API in the browser window');
      console.log('⏸️  Press Enter in terminal when Edit API is clicked...');
      
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
    }
    
    // Wait for edit page to load
    console.log('📝 Waiting for edit page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    console.log('📸 Taking screenshot of edit page...');
    const result = await client.takeScreenshot();
    
    if (result.success) {
      const fs = require('fs');
      const buffer = Buffer.from(result.screenshot, 'base64');
      fs.writeFileSync('rapidapi-edit-screenshot.png', buffer);
      console.log('✅ Screenshot saved to rapidapi-edit-screenshot.png');
    }
    
    // List inputs
    console.log('📝 Listing inputs on edit page...');
    const inputsResult = await client.listInputs();
    console.log(`📋 Found ${inputsResult.inputs.length} inputs`);
    
    for (const input of inputsResult.inputs) {
      if (input.visible) {
        console.log(`  - type=${input.type}, name=${input.name}, id=${input.id}, value=${input.value}, placeholder=${input.placeholder}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

clickEditAPI().catch(console.error);
