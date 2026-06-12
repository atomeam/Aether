/**
 * Complete RapidAPI Domain Fix - Manual Guidance
 * Guides user through manual domain fix with research
 */

const PersistentBrowserClient = require('./persistent-browser-client');
const fs = require('fs');

async function completeDomainFix() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🚀 Complete RapidAPI domain fix with research...');
    
    console.log('📝 Based on research, the settings icon is in the top right corner');
    console.log('📝 Please manually:');
    console.log('1. Click the settings icon (gear) in the top right corner');
    console.log('2. Click "Edit API" from the dropdown');
    console.log('⏸️  Press Enter in terminal when you reach the edit page...');
    
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('✅ Proceeding to inspect edit page...');
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot
    console.log('📸 Taking screenshot of edit page...');
    const result = await client.takeScreenshot();
    
    if (result.success) {
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
    
    // Look for domain field
    console.log('📝 Looking for domain field...');
    for (const input of inputsResult.inputs) {
      if (input.visible && input.value && input.value.includes('.www.a-to-mind.com')) {
        console.log(`📝 Found domain field: name=${input.name}, value=${input.value}`);
        console.log('📝 Attempting to update domain...');
        
        try {
          await client.fillInput(`input[name="${input.name}"]`, 'a-to-mind.com');
          console.log('✅ Updated domain to a-to-mind.com');
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Click Save
          console.log('📝 Clicking Save button...');
          await client.clickElement('button:has-text("Save")');
          console.log('✅ Clicked Save');
          
          console.log('✅ Domain fix completed successfully!');
          return;
        } catch (error) {
          console.log('⚠️  Error updating domain:', error.message);
        }
      }
    }
    
    console.log('⚠️  Could not find domain field with current value');
    console.log('📝 Please manually:');
    console.log('1. Find the domain/endpoint URL field');
    console.log('2. Remove leading dot: .www.a-to-mind.com → a-to-mind.com');
    console.log('3. OR use: bridge.a-to-mind.com (recommended)');
    console.log('4. Click Save');
    console.log('⏸️  Press Enter in terminal when domain is fixed...');
    
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('✅ Domain fix completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

completeDomainFix().catch(console.error);
