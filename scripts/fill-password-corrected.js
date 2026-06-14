/**
 * Fill Password (Corrected) and Click Next - Using Persistent Browser Service
 * Fills in password jadenb11 and clicks Next button
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function fillPasswordAndClickNext() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🚀 Filling password (jadenb11) and clicking Next...');
    
    // Wait a moment for password page to load
    console.log('📝 Waiting for password page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // List inputs to see what's available
    console.log('📝 Listing available inputs...');
    const inputsResult = await client.listInputs();
    console.log(`📋 Found ${inputsResult.inputs.length} inputs`);
    
    for (const input of inputsResult.inputs) {
      if (input.visible) {
        console.log(`  - type=${input.type}, name=${input.name}, id=${input.id}, value=${input.value}`);
      }
    }
    
    // Fill in password
    console.log('📝 Filling password...');
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[name="Passwd"]',
      'input[id*="password"]',
      'input[id*="Passwd"]',
    ];
    
    let filled = false;
    for (const selector of passwordSelectors) {
      try {
        await client.fillInput(selector, 'jadenb11');
        console.log(`✅ Filled password with selector: ${selector}`);
        filled = true;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!filled) {
      console.log('⚠️  Could not fill password with standard selectors');
      console.log('📝 Trying to find by attributes...');
      
      // Try to find by looking at the inputs we listed
      for (const input of inputsResult.inputs) {
        if (input.visible && (input.type === 'password' || input.name === 'Passwd' || input.id?.includes('Passwd'))) {
          console.log(`📝 Found password input: name=${input.name}, id=${input.id}`);
          try {
            await client.fillInput(`input[name="${input.name}"]`, 'jadenb11');
            console.log('✅ Filled password');
            filled = true;
            break;
          } catch (error) {
            continue;
          }
        }
      }
    }
    
    if (!filled) {
      console.log('⚠️  Could not fill password');
      console.log('📋 Please manually fill password in the browser window');
      return;
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click Next button
    console.log('📝 Clicking Next button...');
    const nextSelectors = [
      'button:has-text("Next")',
      'button:has-text("Next ")',
      'button[type="submit"]',
      '#passwordNext',
      '[data-primary-action-label="Next"]',
    ];
    
    let clicked = false;
    for (const selector of nextSelectors) {
      try {
        await client.clickElement(selector);
        console.log(`✅ Clicked Next with selector: ${selector}`);
        clicked = true;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!clicked) {
      console.log('⚠️  Could not click Next button');
      console.log('📋 Please manually click Next in the browser window');
    } else {
      console.log('✅ Successfully filled password and clicked Next');
      console.log('📝 Browser is still alive for next steps');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Please complete manually in the browser window');
  }
}

fillPasswordAndClickNext().catch(console.error);
