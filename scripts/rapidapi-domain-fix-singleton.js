/**
 * RapidAPI Domain Fix - Using Singleton Browser Manager
 * Automatically removes leading dot from domain in RapidAPI listing
 * Reuses the same browser instance across all tasks
 */

const BrowserManager = require('./browser-manager');

async function fixRapidAPIDomain() {
  const browserManager = BrowserManager.getInstance();
  
  try {
    console.log('🚀 Starting automated RapidAPI domain fix...');
    console.log('🔒 Using singleton browser manager');
    
    await browserManager.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    
    // Check if logged in
    if (!(await browserManager.isLoggedIn())) {
      console.log('📝 Not logged in. Please log in manually in the browser window...');
      console.log('⏸️  Waiting for you to complete login...');
      console.log('⏱️  You have up to 5 minutes to complete the login');
      
      const page = await browserManager.getPage();
      await page.waitForSelector('text=API Overview', { timeout: 300000 });
      
      console.log('✅ Login detected. Continuing...');
      await browserManager.saveSession();
    } else {
      console.log('✅ Already logged in (session persisted)');
    }
    
    console.log('🔧 Attempting to fix domain automatically...');
    
    const page = await browserManager.getPage();
    
    // Try multiple strategies to find and fix the domain
    let fixed = false;
    
    // Strategy 1: Look for Edit button
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const editButtons = await page.$$('button, a');
      for (const button of editButtons) {
        const text = await button.textContent();
        if (text.includes('Edit') || text.includes('Settings')) {
          console.log('✅ Found Edit/Settings button');
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 3000));
          break;
        }
      }
      
      // Look for domain/endpoint input fields
      const inputs = await page.$$('input[type="text"], input[type="url"]');
      for (const input of inputs) {
        const currentValue = await input.inputValue();
        console.log(`📝 Found input with value: ${currentValue}`);
        
        if (currentValue.includes('.www.') || currentValue.includes('.a-to-mind.com')) {
          const fixedValue = currentValue.replace('.www.', 'www.').replace('.a-to-mind.com', 'a-to-mind.com');
          await input.fill(fixedValue);
          console.log(`✅ Fixed domain to: ${fixedValue}`);
          fixed = true;
          
          // Look for Save button
          const saveButtons = await page.$$('button');
          for (const saveButton of saveButtons) {
            const saveText = await saveButton.textContent();
            if (saveText.includes('Save') || saveText.includes('Update')) {
              console.log('✅ Found Save button');
              await saveButton.click();
              await new Promise(resolve => setTimeout(resolve, 3000));
              break;
            }
          }
          break;
        }
      }
      
    } catch (error) {
      console.log('⚠️  Automation failed:', error.message);
    }
    
    if (fixed) {
      console.log('✅ Domain fixed successfully!');
    } else {
      console.log('⚠️  Could not fix domain automatically');
      console.log('📋 Manual instructions:');
      console.log('1. Click "Edit API" or "Settings"');
      console.log('2. Find the domain/endpoint URL field');
      console.log('3. Remove the leading dot (.www.a-to-mind.com → a-to-mind.com)');
      console.log('4. OR use: bridge.a-to-mind.com (recommended)');
      console.log('5. Click Save');
      console.log('');
      console.log('⏸️  Please complete manually in the browser.');
      console.log('⌨️  Press Enter in terminal when done...');
      
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
    }
    
    console.log('✅ Fix completed!');
    console.log('📝 Browser is still open for future tasks');
    
  } catch (error) {
    console.error('❌ Error during fix:', error.message);
    console.log('💡 Browser window is still open for manual completion');
    console.log('⏸️  Press Enter to close browser...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
  }
  // Don't close browser - keep it for future tasks
}

fixRapidAPIDomain().catch(console.error);
