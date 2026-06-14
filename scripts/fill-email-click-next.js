/**
 * Fill Email and Click Next - Using Persistent Browser Service
 * Fills in email address and clicks Next button
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function fillEmailAndClickNext() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🚀 Filling email and clicking Next...');
    
    // Navigate to Google login page
    console.log('📝 Navigating to Google login page...');
    await client.navigateTo('https://accounts.google.com');
    console.log('✅ Navigated to Google login page');
    
    // Wait a moment for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // List inputs to see what's available
    console.log('📝 Listing available inputs...');
    const inputsResult = await client.listInputs();
    console.log(`📋 Found ${inputsResult.inputs.length} inputs`);
    
    for (const input of inputsResult.inputs) {
      if (input.visible) {
        console.log(`  - type=${input.type}, name=${input.name}, id=${input.id}, value=${input.value}`);
      }
    }
    
    // Fill in email address
    console.log('📝 Filling email address...');
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[name="identifier"]',
      'input[id*="email"]',
      'input[id*="identifier"]',
      'input[aria-label*="Email"]',
    ];
    
    let filled = false;
    for (const selector of emailSelectors) {
      try {
        await client.fillInput(selector, 'atomicmoonbeam88@gmail.com');
        console.log(`✅ Filled email with selector: ${selector}`);
        filled = true;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!filled) {
      console.log('⚠️  Could not fill email with standard selectors');
      console.log('📝 Trying to find by attributes...');
      
      // Try to find by looking at the inputs we listed
      for (const input of inputsResult.inputs) {
        if (input.visible && (input.type === 'email' || input.name === 'identifier' || input.id?.includes('identifier'))) {
          console.log(`📝 Found email input: name=${input.name}, id=${input.id}`);
          try {
            await client.fillInput(`input[name="${input.name}"]`, 'atomicmoonbeam88@gmail.com');
            console.log('✅ Filled email address');
            filled = true;
            break;
          } catch (error) {
            continue;
          }
        }
      }
    }
    
    if (!filled) {
      console.log('⚠️  Could not fill email address');
      console.log('📋 Please manually fill email in the browser window');
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
      '#identifierNext',
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
      console.log('✅ Successfully filled email and clicked Next');
      console.log('📝 Browser is still alive for next steps');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Please complete manually in the browser window');
  }
}

fillEmailAndClickNext().catch(console.error);
