/**
 * RapidAPI Domain Fix - Playwright Test with Inspector
 * 
 * This test uses Playwright Inspector to debug and fix the domain issue.
 * 
 * Run with Inspector:
 *   npx playwright test rapidapi-domain-fix.spec.js --debug
 * 
 * Or use page.pause() to open Inspector at specific points
 */

const { test, expect } = require('@playwright/test');

test.describe('RapidAPI Domain Fix', () => {
  test('Navigate and inspect API page', async ({ page }) => {
    // Navigate to RapidAPI
    await page.goto('https://rapidapi.com/atom-bomb-a-to-mind/api');
    
    // PAUSE HERE - Opens Inspector to see the page
    await page.pause();
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get page URL
    const url = page.url();
    console.log('Page URL:', url);
    
    // List all buttons
    const buttons = await page.$$eval('button, [role="button"]', els =>
      els.map(el => ({ text: el.textContent, id: el.id, class: el.className }))
    );
    console.log('Buttons:', JSON.stringify(buttons, null, 2));
    
    // List all inputs
    const inputs = await page.$$eval('input, textarea, select', els =>
      els.map(el => ({ type: el.type, name: el.name, id: el.id, placeholder: el.placeholder }))
    );
    console.log('Inputs:', JSON.stringify(inputs, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'rapidapi-page.png', fullPage: true });
  });
  
  test('Click User Profile and inspect menu', async ({ page }) => {
    await page.goto('https://rapidapi.com/atom-bomb-a-to-mind/api');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click User Profile button
    await page.click('button[aria-label="User Profile"]');
    
    // PAUSE HERE - Opens Inspector to see the menu
    await page.pause();
    
    // List menu buttons
    const menuButtons = await page.$$eval('button, [role="button"]', els =>
      els.map(el => ({ text: el.textContent, id: el.id, ariaLabel: el.getAttribute('aria-label') }))
    );
    console.log('Menu buttons:', JSON.stringify(menuButtons, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'rapidapi-menu.png', fullPage: true });
  });
  
  test('Navigate to settings and find domain field', async ({ page }) => {
    await page.goto('https://rapidapi.com/atom-bomb-a-to-mind/api');
    await page.waitForLoadState('networkidle');
    
    // Click User Profile
    await page.click('button[aria-label="User Profile"]');
    await page.waitForTimeout(2000);
    
    // Click Account Settings
    await page.click('button:has-text("Account Settings")');
    await page.waitForLoadState('networkidle');
    
    // PAUSE HERE - Opens Inspector to see settings page
    await page.pause();
    
    // List all inputs
    const inputs = await page.$$eval('input, textarea, select', els =>
      els.map(el => ({ 
        type: el.type, 
        name: el.name, 
        id: el.id, 
        placeholder: el.placeholder,
        value: el.value 
      }))
    );
    console.log('Settings inputs:', JSON.stringify(inputs, null, 2));
    
    // Look for domain input
    const domainInput = inputs.find(input => 
      (input.name && input.name.toLowerCase().includes('domain')) ||
      (input.id && input.id.toLowerCase().includes('domain')) ||
      (input.placeholder && input.placeholder.toLowerCase().includes('domain')) ||
      (input.value && input.value.includes('.www.a-to-mind.com'))
    );
    
    if (domainInput) {
      console.log('Found domain input:', domainInput);
    } else {
      console.log('Domain input not found');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'rapidapi-settings.png', fullPage: true });
  });
  
  test('Try Edit API button path', async ({ page }) => {
    await page.goto('https://rapidapi.com/atom-bomb-a-to-mind/api');
    await page.waitForLoadState('networkidle');
    
    // Click User Profile
    await page.click('button[aria-label="User Profile"]');
    await page.waitForTimeout(2000);
    
    // Look for Edit API button
    const editAPIButton = await page.$('button:has-text("Edit API")');
    
    if (editAPIButton) {
      console.log('Found Edit API button');
      await editAPIButton.click();
      await page.waitForLoadState('networkidle');
      
      // PAUSE HERE - Opens Inspector to see Edit API page
      await page.pause();
      
      // List inputs
      const inputs = await page.$$eval('input, textarea, select', els =>
        els.map(el => ({ 
          type: el.type, 
          name: el.name, 
          id: el.id, 
          placeholder: el.placeholder,
          value: el.value 
        }))
      );
      console.log('Edit API inputs:', JSON.stringify(inputs, null, 2));
      
      // Take screenshot
      await page.screenshot({ path: 'rapidapi-edit-api.png', fullPage: true });
    } else {
      console.log('Edit API button not found');
    }
  });
  
  test('Full domain fix workflow', async ({ page }) => {
    await page.goto('https://rapidapi.com/atom-bomb-a-to-mind/api');
    await page.waitForLoadState('networkidle');
    
    // PAUSE 1 - See initial page
    await page.pause();
    
    // Click User Profile
    await page.click('button[aria-label="User Profile"]');
    await page.waitForTimeout(2000);
    
    // PAUSE 2 - See menu
    await page.pause();
    
    // Try Account Settings
    const settingsButton = await page.$('button:has-text("Account Settings")');
    if (settingsButton) {
      await settingsButton.click();
      await page.waitForLoadState('networkidle');
      
      // PAUSE 3 - See settings page
      await page.pause();
      
      // Look for domain field
      const domainInput = await page.$('input[name*="domain"], input[id*="domain"], input[placeholder*="domain"]');
      
      if (domainInput) {
        console.log('Found domain input');
        
        // PAUSE 4 - Before changing domain
        await page.pause();
        
        // Clear and fill
        await domainInput.fill('a-to-mind.com');
        
        // PAUSE 5 - After changing domain
        await page.pause();
        
        // Look for save button
        const saveButton = await page.$('button:has-text("Save"), button[type="submit"]');
        if (saveButton) {
          await saveButton.click();
          console.log('Clicked save button');
        }
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'rapidapi-final.png', fullPage: true });
  });
});
