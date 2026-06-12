/**
 * Persistent Browser Service
 * Keeps a browser instance alive across script invocations
 * Accepts commands via HTTP API
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

class PersistentBrowserService {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.sessionDir = '.browser-sessions';
    this.sessionFile = path.join(this.sessionDir, 'persistent-session.json');
    this.port = 3456;
    this.ensureSessionDir();
  }
  
  ensureSessionDir() {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }
  
  async startBrowser() {
    if (!this.browser) {
      console.log('🌐 Starting persistent browser...');
      this.browser = await chromium.launch({
        headless: false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
        ]
      });
      
      const sessionExists = fs.existsSync(this.sessionFile);
      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'America/New_York',
        acceptDownloads: true,
        ignoreHTTPSErrors: false,
        javaScriptEnabled: true,
        storageState: sessionExists ? this.sessionFile : undefined,
      });
      
      this.page = await this.context.newPage();
      console.log('✅ Persistent browser started');
    }
  }
  
  async saveSession() {
    if (this.context) {
      await this.context.storageState({ path: this.sessionFile });
    }
  }
  
  async navigateTo(url) {
    if (!this.page) await this.startBrowser();
    
    console.log(`🔗 Navigating to: ${url}`);
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Accept cookies
    await this.acceptCookies();
    
    // Switch to dark mode
    await this.switchToDarkMode();
    
    await this.saveSession();
    console.log('✅ Navigation complete');
  }
  
  async switchToDarkMode() {
    if (!this.page) return;
    
    try {
      console.log('🌙 Switching to dark mode...');
      
      // Try common dark mode patterns
      const darkModeCode = `
        (function() {
          // Try to find dark mode toggle
          const darkModeSelectors = [
            'button[aria-label*="dark"]',
            'button[aria-label*="theme"]',
            'button[title*="dark"]',
            'button[title*="theme"]',
            '.dark-mode-toggle',
            '.theme-toggle',
            '[data-theme-toggle]',
          ];
          
          for (const selector of darkModeSelectors) {
            const element = document.querySelector(selector);
            if (element && element.offsetParent !== null) {
              element.click();
              return 'Clicked dark mode toggle';
            }
          }
          
          // Try to set dark mode via CSS variables
          document.documentElement.setAttribute('data-theme', 'dark');
          document.documentElement.setAttribute('data-color-mode', 'dark');
          
          // Try to set dark mode via class
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
          
          // Try to set dark mode via localStorage
          localStorage.setItem('theme', 'dark');
          localStorage.setItem('color-mode', 'dark');
          localStorage.setItem('darkMode', 'true');
          
          return 'Attempted to set dark mode';
        })()
      `;
      
      const result = await this.page.evaluate(darkModeCode);
      console.log(`✅ Dark mode result: ${result}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log('⚠️  Could not switch to dark mode:', error.message);
    }
  }
  
  async acceptCookies() {
    if (!this.page) return;
    
    try {
      const cookieButtons = await this.page.$$('button, a');
      for (const button of cookieButtons) {
        const text = await button.textContent();
        if (text.includes('Accept') || text.includes('Accept All') || text.includes('I Agree') || text.includes('Got it')) {
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }
  
  async clickElement(selector) {
    if (!this.page) await this.startBrowser();
    
    const element = await this.page.$(selector);
    if (element) {
      await element.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    }
    return { success: false, error: 'Element not found' };
  }
  
  async fillInput(selector, value) {
    if (!this.page) await this.startBrowser();
    
    const input = await this.page.$(selector);
    if (input) {
      await input.click();
      await new Promise(resolve => setTimeout(resolve, 200));
      await input.fill('');
      await new Promise(resolve => setTimeout(resolve, 200));
      await input.type(value, { delay: 50 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    }
    return { success: false, error: 'Input not found' };
  }
  
  async findElementByAttributes(attributes) {
    if (!this.page) await this.startBrowser();
    
    const inputs = await this.page.$$('input');
    for (const input of inputs) {
      try {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const id = await input.getAttribute('id');
        const placeholder = await input.getAttribute('placeholder');
        const ariaLabel = await input.getAttribute('aria-label');
        const isVisible = await input.isVisible();
        
        if (!isVisible) continue;
        
        let match = true;
        for (const [key, expectedValue] of Object.entries(attributes)) {
          const actualValue = { type, name, id, placeholder, ariaLabel }[key];
          if (actualValue && actualValue.toLowerCase().includes(expectedValue.toLowerCase())) {
            continue;
          } else if (actualValue === expectedValue) {
            continue;
          } else {
            match = false;
            break;
          }
        }
        
        if (match) {
          return { success: true, selector: `input[${key}="${value}"]` };
        }
      } catch {
        continue;
      }
    }
    return { success: false, error: 'Element not found' };
  }
  
  async listInputs() {
    if (!this.page) await this.startBrowser();
    
    const inputs = await this.page.$$('input');
    const inputList = [];
    
    for (const input of inputs) {
      try {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const id = await input.getAttribute('id');
        const placeholder = await input.getAttribute('placeholder');
        const value = await input.inputValue();
        const isVisible = await input.isVisible();
        
        inputList.push({
          type,
          name,
          id,
          placeholder,
          value,
          visible: isVisible,
        });
      } catch {
        continue;
      }
    }
    
    return { success: true, inputs: inputList };
  }
  
  async listButtons() {
    if (!this.page) await this.startBrowser();
    
    const buttons = await this.page.$$('button, a');
    const buttonList = [];
    
    for (const button of buttons) {
      try {
        const text = await button.textContent();
        const id = await button.getAttribute('id');
        const className = await button.getAttribute('class');
        const isVisible = await button.isVisible();
        
        if (text && text.trim()) {
          buttonList.push({
            text: text.trim(),
            id,
            className,
            visible: isVisible,
          });
        }
      } catch {
        continue;
      }
    }
    
    return { success: true, buttons: buttonList };
  }
  
  async getPageInfo() {
    if (!this.page) await this.startBrowser();
    
    return {
      url: this.page.url(),
      title: await this.page.title(),
    };
  }
  
  async takeScreenshot() {
    if (!this.page) await this.startBrowser();
    
    const screenshot = await this.page.screenshot({ encoding: 'base64' });
    return { success: true, screenshot };
  }
  
  async executeJavaScript(code) {
    if (!this.page) await this.startBrowser();
    
    try {
      const result = await this.page.evaluate(code);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async executeJavaScriptAsync(code) {
    if (!this.page) await this.startBrowser();
    
    try {
      const result = await this.page.evaluate(code);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async hoverElement(selector) {
    if (!this.page) await this.startBrowser();
    
    try {
      const element = await this.page.$(selector);
      if (element) {
        await element.hover();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true };
      }
      return { success: false, error: 'Element not found' };
    } catch (error) {
      return { success: false, error: error.message };
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
  
  startServer() {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const pathname = url.pathname;
        
        res.setHeader('Content-Type', 'application/json');
        
        if (pathname === '/navigate') {
          const targetUrl = url.searchParams.get('url');
          if (!targetUrl) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'URL parameter required' }));
            return;
          }
          await this.navigateTo(targetUrl);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
        } else if (pathname === '/click') {
          const selector = url.searchParams.get('selector');
          if (!selector) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Selector parameter required' }));
            return;
          }
          const result = await this.clickElement(selector);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/fill') {
          const selector = url.searchParams.get('selector');
          const value = url.searchParams.get('value');
          if (!selector || !value) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Selector and value parameters required' }));
            return;
          }
          const result = await this.fillInput(selector, value);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/list-inputs') {
          const result = await this.listInputs();
          res.writeHead(200);
          res.end(JSON.stringify(result));
        } else if (pathname === '/list-buttons') {
          const result = await this.listButtons();
          res.writeHead(200);
          res.end(JSON.stringify(result));
        } else if (pathname === '/info') {
          const info = await this.getPageInfo();
          res.writeHead(200);
          res.end(JSON.stringify(info));
        } else if (pathname === '/screenshot') {
          const result = await this.takeScreenshot();
          res.writeHead(200);
          res.end(JSON.stringify(result));
        } else if (pathname === '/execute-js') {
          const code = url.searchParams.get('code');
          if (!code) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Code parameter required' }));
            return;
          }
          const result = await this.executeJavaScript(decodeURIComponent(code));
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/hover') {
          const selector = url.searchParams.get('selector');
          if (!selector) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Selector parameter required' }));
            return;
          }
          const result = await this.hoverElement(selector);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/dark-mode') {
          const result = await this.switchToDarkMode();
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
        } else if (pathname === '/close') {
          await this.close();
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
          process.exit(0);
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    
    server.listen(this.port, () => {
      console.log(`🚀 Persistent browser service listening on port ${this.port}`);
      console.log(`📡 API endpoints:`);
      console.log(`   GET  /navigate?url=URL - Navigate to URL`);
      console.log(`   GET  /click?selector=SELECTOR - Click element`);
      console.log(`   GET  /fill?selector=SELECTOR&value=VALUE - Fill input`);
      console.log(`   GET  /info - Get page info`);
      console.log(`   GET  /close - Close browser and exit`);
    });
    
    return server;
  }
}

// Start the service
const service = new PersistentBrowserService();
service.startBrowser().then(() => {
  service.startServer();
}).catch(console.error);
