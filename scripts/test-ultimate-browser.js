/**
 * Test Ultimate Browser Service - RapidAPI Domain Fix
 * Test the ultimate browser service with the RapidAPI domain fix task
 */

const http = require('http');
const UltimateBrowserClient = require('./ultimate-browser-client');

async function testUltimateBrowser() {
  const client = new UltimateBrowserClient();
  
  try {
    console.log('🧪 Testing Ultimate Browser Service');
    
    // Test 1: Navigate with smart waiting
    console.log('\n📝 Test 1: Navigate with smart waiting');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigation complete');
    
    // Test 2: Use getByText instead of CSS selectors
    console.log('\n📝 Test 2: Use getByText to find User Profile button');
    const buttonsResult = await client.listButtons();
    console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
    
    // Show all buttons (visible and hidden)
    for (const button of buttonsResult.buttons) {
      console.log(`  - text="${button.text}" visible=${button.visible} ariaLabel="${button.ariaLabel || 'none'}"`);
    }
    
    // Test 3: Use getByRole for better selectors
    console.log('\n📝 Test 3: Use getByRole to find buttons');
    const roleResult = await client.getByRole('button', { name: 'User Profile' });
    console.log(`✅ getByRole result: ${JSON.stringify(roleResult)}`);
    
    // Test 4: Use waitForSelector instead of fixed timeout
    console.log('\n📝 Test 4: Use waitForSelector');
    const waitResult = await client.waitForSelector('button:has(svg)', { timeout: 5000 });
    console.log(`✅ waitForSelector result: ${JSON.stringify(waitResult)}`);
    
    // Test 5: Use withRetry for flaky operations
    console.log('\n📝 Test 5: Use withRetry for clicking');
    const retryResult = await client.withRetry(async () => {
      await client.clickElement('button:has(svg)');
    }, { maxRetries: 3, initialDelay: 100 });
    console.log(`✅ withRetry result: ${JSON.stringify(retryResult)}`);
    
    // Test 6: Take advanced screenshot
    console.log('\n📝 Test 6: Take advanced screenshot');
    const screenshotResult = await client.takeAdvancedScreenshot({ fullPage: true });
    console.log(`✅ Advanced screenshot result: ${JSON.stringify(screenshotResult)}`);
    
    // Test 7: Get console messages
    console.log('\n📝 Test 7: Get console messages');
    const consoleResult = await client.getConsoleMessages();
    console.log(`✅ Console messages: ${consoleResult.messages.length} messages`);
    
    // Test 8: Check accessibility
    console.log('\n📝 Test 8: Check accessibility');
    const a11yResult = await client.checkAccessibility();
    console.log(`✅ Accessibility violations: ${a11yResult.violations.length}`);
    
    // Test 9: Get performance metrics
    console.log('\n📝 Test 9: Get performance metrics');
    const perfResult = await client.getPerformanceMetrics();
    console.log(`✅ Performance metrics: ${JSON.stringify(perfResult.metrics)}`);
    
    // Test 10: Try the actual RapidAPI fix with new features
    console.log('\n📝 Test 10: Try RapidAPI fix with new features');
    
    // Use getByLabel to find User Profile (since it has aria-label)
    const profileButton = buttonsResult.buttons.find(b => b.ariaLabel === 'User Profile');
    if (profileButton) {
      console.log(`📝 Found User Profile button via aria-label`);
      
      // Click it using aria-label selector
      await client.clickElement('button[aria-label="User Profile"]');
      console.log('✅ Clicked User Profile');
      
      // Wait for menu to appear using smart waiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // List buttons again to see what's in the menu
      const menuButtons = await client.listButtons();
      console.log(`📋 Menu buttons: ${menuButtons.buttons.length}`);
      for (const button of menuButtons.buttons) {
        if (button.visible) {
          console.log(`  - text="${button.text}" ariaLabel="${button.ariaLabel || 'none'}"`);
        }
      }
      
      // Edit API is not in the menu. Try User Settings instead.
      const userSettingsButton = menuButtons.buttons.find(b => b.text === 'User Settings');
      if (userSettingsButton) {
        console.log(`📝 Found User Settings button`);
        
        // Click it
        await client.clickElement('button:has-text("User Settings")');
        console.log('✅ Clicked User Settings');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // List buttons again to see what's in User Settings
        const settingsButtons = await client.listButtons();
        console.log(`📋 Settings buttons: ${settingsButtons.buttons.length}`);
        for (const button of settingsButtons.buttons) {
          if (button.visible) {
            console.log(`  - text="${button.text}" ariaLabel="${button.ariaLabel || 'none'}"`);
          }
        }
        
        // Use getByText to find Edit API
        const editAPIResult = await client.getByText('Edit API', { exact: true });
        console.log(`✅ getByText('Edit API') result: ${JSON.stringify(editAPIResult)}`);
        
        if (editAPIResult.success) {
          console.log('🎉 SUCCESS: Found Edit API using getByText!');
          
          // Click it
          await client.clickElement('button:has-text("Edit API")');
          console.log('✅ Clicked Edit API');
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Get page info
          const info = await client.getPageInfo();
          console.log(`📋 Current URL: ${info.url}`);
          
          if (info.url.includes('edit') || info.url.includes('settings')) {
            console.log('🎉🎉🎉 RAPIDAPI FIX SUCCESSFUL!');
            return true;
          }
        }
      }
    }
    
    console.log('\n✅ All tests completed');
    console.log('📝 RapidAPI fix: Need to investigate why getByText did not find Edit API');
    
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

testUltimateBrowser().catch(console.error);
