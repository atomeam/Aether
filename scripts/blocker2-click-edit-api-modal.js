/**
 * Blocker 2: Click Edit API - Check for Modal
 * Check if User Profile button opens a modal
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_modal() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Checking for modal');
    
    // Navigate to API page
    console.log('📝 Navigating to API page...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click User Profile button
    console.log('📝 Clicking User Profile button...');
    const clickCode = `
      (function() {
        const allButtons = document.querySelectorAll('button');
        for (const button of allButtons) {
          const ariaLabel = button.getAttribute('aria-label') || '';
          if (ariaLabel === 'User Profile') {
            button.click();
            return 'Clicked User Profile';
          }
        }
        return 'User Profile not found';
      })()
    `;
    
    await client.executeJavaScript(clickCode);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for modal
    console.log('📝 Checking for modal...');
    const modalCode = `
      (function() {
        const modalSelectors = [
          '[role="dialog"]',
          '[role="modal"]',
          '.modal',
          '.dialog',
          '[data-state="open"]',
          '.popover',
        ];
        
        for (const selector of modalSelectors) {
          const element = document.querySelector(selector);
          if (element && element.offsetParent !== null) {
            const allElements = element.querySelectorAll('*');
            const elements = [];
            for (const el of allElements) {
              const text = el.textContent?.trim() || '';
              if (text) {
                elements.push(text.substring(0, 50));
              }
            }
            return { found: true, selector, elements };
          }
        }
        return { found: false };
      })()
    `;
    
    const modalResult = await client.executeJavaScript(modalCode);
    console.log(`✅ Modal result: ${JSON.stringify(modalResult.result)}`);
    
    if (modalResult.result.found) {
      console.log(`✅ Found modal with selector: ${modalResult.result.selector}`);
      console.log(`📋 Modal elements: ${modalResult.result.elements.join(', ')}`);
      
      // Look for Edit API in modal
      const editInModal = modalResult.result.elements.find(el => 
        el.toLowerCase().includes('edit') && el.toLowerCase().includes('api')
      );
      
      if (editInModal) {
        console.log(`📝 Found Edit API in modal: ${editInModal}`);
        
        // Click it
        const clickEditCode = `
          (function() {
            const modal = document.querySelector('${modalResult.result.selector}');
            if (!modal) return 'Modal not found';
            
            const allElements = modal.querySelectorAll('*');
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
          console.log('✅ Blocker 2 SOLVED: Modal contained Edit API');
          return true;
        }
      }
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: No modal with Edit API found');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_modal().catch(console.error);
