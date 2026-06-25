/**
 * Always Dark Mode - Enable on Any Site
 */

const { chromium } = require('playwright');

class DarkModeEnforcer {
  constructor(page) {
    this.page = page;
  }
  
  async enableAll() {
    console.log('🌙 Enabling dark mode...');
    await this.emulateMedia();
    await this.setCSSVariables();
    await this.setDataAttributes();
    await this.setCSSClasses();
    await this.setLocalStorage();
    await this.injectCSS();
    await this.clickDarkModeToggle();
    console.log('✅ Dark mode enabled');
  }
  
  async emulateMedia() {
    await this.page.emulateMedia({ colorScheme: 'dark' });
    console.log('✅ Emulated dark media');
  }
  
  async setCSSVariables() {
    await this.page.addStyleTag({
      content: `
        :root {
          --background: #1a1a1a;
          --foreground: #e0e0e0;
          --card: #2a2a2a;
          --border: #3a3a3a;
          --primary: #4a9eff;
          --text: #e0e0e0;
        }
        
        html, body {
          background-color: var(--background) !important;
          color: var(--foreground) !important;
        }
        
        * {
          background-color: var(--background) !important;
          color: var(--foreground) !important;
          border-color: var(--border) !important;
        }
      `
    });
    console.log('✅ Set CSS variables');
  }
  
  async setDataAttributes() {
    await this.page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-color-mode', 'dark');
      document.documentElement.setAttribute('data-mode', 'dark');
    });
    console.log('✅ Set data attributes');
  }
  
  async setCSSClasses() {
    await this.page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark');
      document.body.classList.add('dark-mode');
    });
    console.log('✅ Set CSS classes');
  }
  
  async setLocalStorage() {
    await this.page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('color-mode', 'dark');
      localStorage.setItem('darkMode', 'true');
      localStorage.setItem('prefers-color-scheme', 'dark');
    });
    console.log('✅ Set localStorage');
  }
  
  async injectCSS() {
    await this.page.addStyleTag({
      content: `
        @media (prefers-color-scheme: light) {
          :root {
            --background: #1a1a1a !important;
            --foreground: #e0e0e0 !important;
          }
        }
      `
    });
    console.log('✅ Injected CSS');
  }
  
  async clickDarkModeToggle() {
    const selectors = [
      'button[aria-label*="dark"]',
      'button[aria-label*="theme"]',
      'button[title*="dark"]',
      'button[title*="theme"]',
      '.dark-mode-toggle',
      '.theme-toggle',
      '[data-theme-toggle]',
      '.theme-switch',
      '.mode-toggle'
    ];
    
    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          await element.click();
          console.log(`✅ Clicked dark mode toggle: ${selector}`);
          return;
        }
      } catch {
        continue;
      }
    }
    console.log('⚠️  No dark mode toggle found');
  }
}

async function enableDarkModeOnSite(url) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log(`🌐 Navigating to ${url}...`);
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    const darkMode = new DarkModeEnforcer(page);
    await darkMode.enableAll();
    
    // Take screenshot to verify
    await page.screenshot({ path: 'dark-mode-enabled.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
    console.log('\n🔄 Browser will stay open with dark mode enabled');
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run with: node always-dark-mode.js https://example.com
const url = process.argv[2] || 'https://example.com';
enableDarkModeOnSite(url).catch(console.error);