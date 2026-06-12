/**
 * Complete RapidAPI Fix - Using Persistent Browser Service
 * Logs into RapidAPI and fixes the domain issue
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function completeRapidAPIFix() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🚀 Starting complete RapidAPI fix...');
    
    // Navigate to RapidAPI
    console.log('📝 Step 1: Navigating to RapidAPI...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to RapidAPI');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if logged in
    console.log('📝 Step 2: Checking login status...');
    const buttonsResult = await client.listButtons();
    const signInButton = buttonsResult.buttons.find(b => b.text === 'Sign In');
    
    if (signInButton) {
      console.log('📝 Not logged in, starting login process...');
      
      // Click Sign In
      console.log('📝 Clicking Sign In...');
      await client.clickElement('button:has-text("Sign In")');
      console.log('✅ Clicked Sign In');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Click Login with Google
      console.log('📝 Clicking Login with Google...');
      await client.clickElement('button:has-text("Login with Google")');
      console.log('✅ Clicked Login with Google');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Fill email
      console.log('📝 Filling email...');
      await client.fillInput('input[name="identifier"]', 'atomicmoonbeam88@gmail.com');
      console.log('✅ Filled email');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Click Next
      console.log('📝 Clicking Next...');
      await client.clickElement('button:has-text("Next")');
      console.log('✅ Clicked Next');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Fill password
      console.log('📝 Filling password...');
      await client.fillInput('input[type="password"]', 'jadenb11');
      console.log('✅ Filled password');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Click Next
      console.log('📝 Clicking Next...');
      await client.clickElement('button:has-text("Next")');
      console.log('✅ Clicked Next');
      
      // Wait for login to complete
      console.log('📝 Waiting for login to complete (2FA/passkey)...');
      console.log('⏸️  Please complete 2FA/passkey in the browser window');
      console.log('⌨️  Press Enter in terminal when login is complete...');
      
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
      
      console.log('✅ Login completed');
      
      // Navigate back to API page
      console.log('📝 Navigating back to API page...');
      await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
      console.log('✅ Navigated to API page');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('✅ Already logged in');
    }
    
    // Now fix the domain
    console.log('📝 Step 3: Looking for Edit/Settings button...');
    const buttonsResult2 = await client.listButtons();
    console.log(`📋 Found ${buttonsResult2.buttons.length} buttons`);
    
    for (const button of buttonsResult2.buttons) {
      if (button.visible) {
        console.log(`  - text="${button.text}"`);
      }
    }
    
    // Look for Edit/Settings button
    const editButton = buttonsResult2.buttons.find(b => b.text.includes('Edit') || b.text.includes('Settings'));
    
    if (editButton) {
      console.log(`📝 Found button: ${editButton.text}`);
      console.log('📝 Please manually click this button in the browser window');
    } else {
      console.log('⚠️  Could not find Edit/Settings button');
    }
    
    console.log('📝 Manual steps:');
    console.log('1. Click Edit API or Settings button in browser window');
    console.log('2. Find the domain/endpoint URL field');
    console.log('3. Remove leading dot: .www.a-to-mind.com → a-to-mind.com');
    console.log('4. OR use: bridge.a-to-mind.com (recommended)');
    console.log('5. Click Save');
    console.log('');
    console.log('⏸️  Press Enter in terminal when domain is fixed...');
    
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('✅ Domain fix completed');
    console.log('📝 Browser is still alive');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Please complete manually in the browser window');
  }
}

completeRapidAPIFix().catch(console.error);
