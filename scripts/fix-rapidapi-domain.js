/**
 * Fix RapidAPI Domain Issue using Ultimate Browser Service
 * Change .www.a-to-mind.com to a-to-mind.com
 */

const UltimateBrowserClient = require('./ultimate-browser-client');

async function fixRapidAPIDomain() {
  const client = new UltimateBrowserClient();
  
  try {
    console.log('🔧 Starting RapidAPI domain fix...');
    
    // Navigate to API page
    console.log('\n📝 Step 1: Navigate to API page');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    // Click User Profile using new clickByRole feature
    console.log('\n📝 Step 2: Click User Profile button');
    const profileResult = await client.clickByRole('button', { name: 'User Profile' });
    console.log(`✅ Clicked User Profile: ${JSON.stringify(profileResult)}`);
    
    // Wait for menu
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // List buttons in the menu to see what's available
    console.log('\n📝 Step 3: List buttons in User Profile menu');
    const menuButtons = await client.listButtons();
    console.log(`📋 Found ${menuButtons.buttons.length} buttons in menu`);
    
    for (const button of menuButtons.buttons) {
      if (button.visible) {
        console.log(`  - text="${button.text}" ariaLabel="${button.ariaLabel || 'none'}"`);
      }
    }
    
    // Look for API-related buttons
    const apiButton = menuButtons.buttons.find(b => 
      b.text.toLowerCase().includes('api') || 
      (b.ariaLabel && b.ariaLabel.toLowerCase().includes('api'))
    );
    
    if (apiButton) {
      console.log(`📝 Found API-related button: ${apiButton.text}`);
      await client.clickElement(`button:has-text("${apiButton.text}")`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('⚠️  No API button found in menu, trying Account Settings');
      const settingsResult = await client.clickByText('Account Settings');
      console.log(`✅ Clicked Account Settings: ${JSON.stringify(settingsResult)}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // List buttons to see what's available
    console.log('\n📝 Step 4: List buttons on settings page');
    const buttons = await client.listButtons();
    console.log(`📋 Found ${buttons.buttons.length} buttons`);
    
    for (const button of buttons.buttons) {
      if (button.visible) {
        console.log(`  - text="${button.text}" ariaLabel="${button.ariaLabel || 'none'}"`);
      }
    }
    
    // List inputs to find domain field
    console.log('\n📝 Step 5: List inputs to find domain field');
    const inputs = await client.listInputs();
    console.log(`📋 Found ${inputs.inputs.length} inputs`);
    
    for (const input of inputs.inputs) {
      if (input.visible) {
        console.log(`  - type="${input.type}" name="${input.name}" id="${input.id}" placeholder="${input.placeholder || 'none'}" value="${input.value || 'none'}"`);
      }
    }
    
    // Look for domain input by various attributes
    console.log('\n📝 Step 6: Search for domain input');
    const domainInput = inputs.inputs.find(input => 
      (input.name && input.name.toLowerCase().includes('domain')) ||
      (input.id && input.id.toLowerCase().includes('domain')) ||
      (input.placeholder && input.placeholder.toLowerCase().includes('domain')) ||
      (input.value && input.value.includes('.www.a-to-mind.com'))
    );
    
    if (domainInput) {
      console.log(`🎉 Found domain input: ${JSON.stringify(domainInput)}`);
      
      // Clear and fill with correct domain
      console.log('\n📝 Step 7: Update domain to a-to-mind.com');
      const selector = domainInput.id ? `#${domainInput.id}` : 
                       domainInput.name ? `input[name="${domainInput.name}"]` :
                       domainInput.placeholder ? `input[placeholder="${domainInput.placeholder}"]` : 'input';
      
      await client.fillInput(selector, 'a-to-mind.com');
      console.log('✅ Updated domain to a-to-mind.com');
      
      // Take screenshot to verify
      const screenshot = await client.takeScreenshot();
      console.log('📸 Screenshot taken');
      
      console.log('\n🎉🎉🎉 RAPIDAPI DOMAIN FIX SUCCESSFUL!');
      return true;
    } else {
      console.log('❌ Domain input not found');
      console.log('⚠️  May need to navigate to a different section or the domain is in a different location');
      
      // Try to find Edit API button
      console.log('\n📝 Step 8: Try to find Edit API button');
      const editAPIButton = buttons.buttons.find(b => b.text === 'Edit API');
      if (editAPIButton) {
        console.log('📝 Found Edit API button, clicking it');
        await client.clickElement('button:has-text("Edit API")');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // List inputs again
        const inputs2 = await client.listInputs();
        console.log(`📋 Found ${inputs2.inputs.length} inputs after clicking Edit API`);
        
        for (const input of inputs2.inputs) {
          if (input.visible) {
            console.log(`  - type="${input.type}" name="${input.name}" id="${input.id}" placeholder="${input.placeholder || 'none'}" value="${input.value || 'none'}"`);
          }
        }
        
        const domainInput2 = inputs2.inputs.find(input => 
          (input.name && input.name.toLowerCase().includes('domain')) ||
          (input.id && input.id.toLowerCase().includes('domain')) ||
          (input.placeholder && input.placeholder.toLowerCase().includes('domain')) ||
          (input.value && input.value.includes('.www.a-to-mind.com'))
        );
        
        if (domainInput2) {
          console.log(`🎉 Found domain input after Edit API: ${JSON.stringify(domainInput2)}`);
          
          const selector2 = domainInput2.id ? `#${domainInput2.id}` : 
                           domainInput2.name ? `input[name="${domainInput2.name}"]` :
                           domainInput2.placeholder ? `input[placeholder="${domainInput2.placeholder}"]` : 'input';
          
          await client.fillInput(selector2, 'a-to-mind.com');
          console.log('✅ Updated domain to a-to-mind.com');
          
          console.log('\n🎉🎉🎉 RAPIDAPI DOMAIN FIX SUCCESSFUL!');
          return true;
        }
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

fixRapidAPIDomain().catch(console.error);
