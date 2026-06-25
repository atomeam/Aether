/**
 * Blocker 2: Click Edit API - Try All Header Buttons
 * Try all buttons in the header area to find settings
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_header() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Trying all header buttons');
    
    // Navigate to API page
    console.log('📝 Navigating to API page...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Find all buttons in header area
    console.log('📝 Finding all buttons in header...');
    const findCode = `
      (function() {
        const buttons = [];
        const allButtons = document.querySelectorAll('button');
        
        for (const button of allButtons) {
          const visible = button.offsetParent !== null;
          if (visible) {
            const text = button.textContent?.trim() || '';
            const ariaLabel = button.getAttribute('aria-label') || '';
            const title = button.getAttribute('title') || '';
            const className = button.className?.substring(0, 100) || '';
            
            buttons.push({
              text: text.substring(0, 50),
              ariaLabel,
              title,
              className
            });
          }
        }
        return buttons;
      })()
    `;
    
    const findResult = await client.executeJavaScript(findCode);
    console.log(`📋 Found ${findResult.result.length} buttons`);
    
    for (const button of findResult.result) {
      console.log(`  - text="${button.text}", aria-label="${button.ariaLabel}"`);
    }
    
    // Try each button
    for (let i = 0; i < findResult.result.length; i++) {
      const button = findResult.result[i];
      
      // Skip navigation buttons (API Marketplace, Console, Studio)
      if (button.text.includes('API Marketplace') || 
          button.text.includes('Console') || 
          button.text.includes('Studio')) {
        continue;
      }
      
      console.log(`📝 Trying button ${i}: text="${button.text}"`);
      
      // Navigate back to API page
      await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click the button
      const clickCode = `
        (function() {
          const allButtons = document.querySelectorAll('button');
          const index = ${i};
          if (allButtons[index]) {
            allButtons[index].click();
            return 'Clicked';
          }
          return 'Not found';
        })()
      `;
      
      await client.executeJavaScript(clickCode);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for overlay with Edit API
      const checkCode = `
        (function() {
          const overlay = document.querySelector('[role="menu"]');
          if (!overlay) return { found: false };
          
          const allElements = overlay.querySelectorAll('*');
          for (const el of allElements) {
            const text = el.textContent?.trim() || '';
            if (text.toLowerCase().includes('edit') && text.toLowerCase().includes('api')) {
              return { found: true, text: text.substring(0, 100) };
            }
          }
          return { found: false };
        })()
      `;
      
      const checkResult = await client.executeJavaScript(checkCode);
      
      if (checkResult.result.found) {
        console.log(`✅ Found Edit API in menu from button ${i}`);
        
        // Click Edit API
        const clickEditCode = `
          (function() {
            const overlay = document.querySelector('[role="menu"]');
            if (!overlay) return 'Overlay not found';
            
            const allElements = overlay.querySelectorAll('*');
            for (const el of allElements) {
              const text = el.textContent?.trim() || '';
              if (text.toLowerCase().includes('edit') && text.toLowerCase().includes('api')) {
                const parentButton = el.closest('button, a, div[role="menuitem"]');
                if (parentButton) {
                  parentButton.click();
                  return 'Clicked Edit API';
                }
                el.click();
                return 'Clicked Edit API';
              }
            }
            return 'Edit API not found';
          })()
        `;
        
        await client.executeJavaScript(clickEditCode);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const info = await client.getPageInfo();
        console.log(`📋 Current URL: ${info.url}`);
        
        if (info.url.includes('edit') || info.url.includes('settings')) {
          console.log('✅ Blocker 2 SOLVED: Found correct settings button');
          return true;
        }
      }
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: No button opened menu with Edit API');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_header().catch(console.error);
