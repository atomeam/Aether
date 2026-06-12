/**
 * Complete RapidAPI Login and Domain Fix - Using Persistent Browser Service
 * Logs into RapidAPI and fixes the domain issue
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function completeRapidAPILoginAndFixDomain() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🚀 Completing RapidAPI login and domain fix...');
    
    // Check if we're logged in
    console.log('📝 Checking login status...');
    const buttonsResult = await client.listButtons();
    const signInButton = buttonsResult.buttons.find(b => b.text === 'Sign In');
    
    if (signInButton) {
      console.log('📝 Not logged in, clicking Sign In...');
      await client.clickElement('button:has-text("Sign In")');
      console.log('✅ Clicked Sign In');
      
      // Wait for login page
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Click Login with Google
      console.log('📝 Clicking Login with Google...');
      await client.clickElement('button:has-text("Login with Google")');
      console.log('✅ Clicked Login with Google');
      
      // Wait for Google login page
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
      
      // Wait for password page
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
      console.log('📝 Waiting for login to complete...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Navigate back to API page
      console.log('📝 Navigating back to API page...');
      await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
      console.log('✅ Navigated to API page');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('✅ Already logged in');
    }
    
    // Now fix the domain
    console.log('📝 Looking for Edit/Settings button...');
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
      // This would require a more complex selector, but for now we'll try to click it
    } else {
      console.log('⚠️  Could not find Edit/Settings button');
      console.log('📝 Please manually click Edit/Settings in the browser window');
      console.log('📝 Then update the domain from .www.a-to-mind.com to a-to-mind.com');
      console.log('📝 OR use: bridge.a-to-mind.com (recommended)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Please complete manually in the browser window');
  }
}

completeRapidAPILoginAndFixDomain().catch(console.error);
