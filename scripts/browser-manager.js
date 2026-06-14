const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class SingletonBrowserManager {
  constructor() {
    if (SingletonBrowserManager.instance) {
      return SingletonBrowserManager.instance;
    }
    
    this.browser = null;
    this.context = null;
    this.page = null;
    this.sessionDir = '.browser-sessions';
    this.sessionFile = path.join(this.sessionDir, 'default-session.json');
    this.ensureSessionDir();
    
    SingletonBrowserManager.instance = this;
  }
  
  static getInstance() {
    if (!SingletonBrowserManager.instance) {
      SingletonBrowserManager.instance = new SingletonBrowserManager();
    }
    return SingletonBrowserManager.instance;
  }
  
  ensureSessionDir() {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }
  
  async getBrowser() {
    if (!this.browser) {
      console.log('🌐 Launching new browser instance...');
      this.browser = await chromium.launch({
        headless: false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
        ]
      });
      console.log('✅ Browser launched');
    } else {
      console.log('✅ Reusing existing browser instance');
    }
    return this.browser;
  }
  
  async getContext() {
    if (!this.context) {
      const browser = await this.getBrowser();
      const sessionExists = fs.existsSync(this.sessionFile);
      
      console.log('📝 Creating new browser context...');
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
      console.log('✅ Browser context created');
    } else {
      console.log('✅ Reusing existing browser context');
    }
    return this.context;
  }
  
  async getPage() {
    if (!this.page) {
      const context = await this.getContext();
      console.log('📄 Creating new page...');
      this.page = await context.newPage();
      console.log('✅ Page created');
    } else {
      // Check if page is still valid
      try {
        const url = this.page.url();
        if (url === 'about:blank' || !url) {
          console.log('⚠️  Page is on about:blank, creating new page...');
          const context = await this.getContext();
          await this.page.close();
          this.page = await context.newPage();
          console.log('✅ New page created');
        } else {
          console.log('✅ Reusing existing page');
        }
      } catch (error) {
        console.log('⚠️  Page is invalid, creating new page...');
        const context = await this.getContext();
        this.page = await context.newPage();
        console.log('✅ New page created');
      }
    }
    return this.page;
  }
  
  async saveSession() {
    if (this.context) {
      console.log('💾 Saving browser session...');
      await this.context.storageState({ path: this.sessionFile });
      console.log('✅ Session saved');
    }
  }
  
  async acceptCookies() {
    if (!this.page) return;
    
    try {
      console.log('🍪 Checking for cookie acceptance...');
      
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
  
  async navigateTo(url) {
    const page = await this.getPage();
    console.log(`🔗 Navigating to: ${url}`);
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Accept cookies if present
    await this.acceptCookies();
    
    console.log('✅ Navigation complete');
  }
  
  async isLoggedIn(loginSelector = 'text=Log in') {
    if (!this.page) return false;
    const loginButton = await this.page.$(loginSelector);
    return !loginButton;
  }
  
  async close() {
    console.log('🔒 Closing browser manager...');
    
    if (this.page) {
      await this.page.close();
      this.page = null;
      console.log('✅ Page closed');
    }
    if (this.context) {
      await this.saveSession();
      await this.context.close();
      this.context = null;
      console.log('✅ Context closed');
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('✅ Browser closed');
    }
    
    SingletonBrowserManager.instance = null;
    console.log('✅ Browser manager closed');
  }
  
  async resetPage() {
    if (this.page) {
      await this.page.close();
      this.page = null;
      console.log('✅ Page reset');
    }
  }
}

module.exports = SingletonBrowserManager;
