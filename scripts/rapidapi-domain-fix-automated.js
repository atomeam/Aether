/**
 * RapidAPI Domain Fix - Automated with Cookie Acceptance
 * Automatically removes leading dot from domain in RapidAPI listing
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class BrowserManager {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.sessionDir = '.browser-sessions';
    this.sessionFile = path.join(this.sessionDir, 'rapidapi-session.json');
    this.ensureSessionDir();
  }
  
  ensureSessionDir() {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }
  
  async getBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
        ]
      });
    }
    return this.browser;
  }
  
  async getContext() {
    if (!this.context) {
      const browser = await this.getBrowser();
      const sessionExists = fs.existsSync(this.sessionFile);
      
      this.context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'America/New_York',
        acceptDownloads: true,
        ignoreHTTPSErrors: false,
        javaScriptEnabled: true,
        storageState: sessionExists ? this.sessionFile : undefined,
      });
    }
    return this.context;
  }
  
  async getPage() {
    if (!this.page) {
      const context = await this.getContext();
      this.page = await context.newPage();
    }
    return this.page;
  }
  
  async saveSession() {
    if (this.context) {
      await this.context.storageState({ path: this.sessionFile });
    }
  }
  
  async close() {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.context) {
      await this.saveSession();
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
  
  async acceptCookies() {
    if (!this.page) return;
    
    try {
      // Look for cookie acceptance buttons
      const cookieButtons = await this.page.$$('button, a');
      for (const button of cookieButtons) {
        const text = await button.textContent();
        if (text.includes('Accept') || text.includes('Accept All') || text.includes('I Agree') || text.includes('Got it')) {
          console.log('✅ Found cookie acceptance button');
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;
        }
      }
      
      // Try common selectors
      const acceptSelectors = [
        'button:has-text("Accept")',
        'button:has-text("Accept All")',
        'button:has-text("I Agree")',
        'button:has-text("Got it")',
        'button:has-text("Allow")',
        'a:has-text("Accept")',
        '.accept-cookies',
        '#accept-cookies',
        '[data-testid*="accept"]',
        '[data-testid*="cookie"]',
      ];
      
      for (const selector of acceptSelectors) {
        try {
          const button = await this.page.$(selector);
          if (button) {
            console.log(`✅ Found cookie button with selector: ${selector}`);
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            return true;
          }
        } catch {
          continue;
        }
      }
      
      console.log('⚠️  No cookie acceptance button found');
      return false;
    } catch (error) {
      console.log('⚠️  Could not accept cookies:', error.message);
      return false;
    }
  }
  
  async isLoggedIn(loginSelector = 'text=Log in') {
    if (!this.page) return false;
    const loginButton = await this.page.$(loginSelector);
    return !loginButton;
  }
}

async function fixRapidAPIDomain() {
  const browserManager = new BrowserManager();
  
  try {
    console.log('🚀 Starting automated RapidAPI domain fix...');
    console.log('🔒 Using persistent browser session');
    
    const page = await browserManager.getPage();
    
    // Navigate to RapidAPI a-to-mind API
    console.log('📝 Navigating to RapidAPI a-to-mind API...');
    await page.goto('https://rapidapi.com/atom-bomb-a-to-mind/api', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Accept cookies if present
    console.log('🍪 Checking for cookie acceptance...');
    await browserManager.acceptCookies();
    
    // Check if logged in
    if (!(await browserManager.isLoggedIn())) {
      console.log('📝 Not logged in. Please log in manually in the browser window...');
      console.log('⏸️  Waiting for you to complete login...');
      console.log('⏱️  You have up to 5 minutes to complete the login');
      
      await page.waitForSelector('text=API Overview', { timeout: 300000 });
      
      console.log('✅ Login detected. Continuing...');
      await browserManager.saveSession();
    } else {
      console.log('✅ Already logged in (session persisted)');
    }
    
    console.log('🔧 Attempting to fix domain automatically...');
    
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
    
  } catch (error) {
    console.error('❌ Error during fix:', error.message);
    console.log('💡 Browser window is still open for manual completion');
    console.log('⏸️  Press Enter to close browser...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
  } finally {
    await browserManager.close();
  }
}

fixRapidAPIDomain().catch(console.error);
