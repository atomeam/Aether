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
    
    await this.saveSession();
    console.log('✅ Navigation complete');
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
      await input.fill(value);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    }
    return { success: false, error: 'Input not found' };
  }
  
  async getPageInfo() {
    if (!this.page) await this.startBrowser();
    
    return {
      url: this.page.url(),
      title: await this.page.title(),
    };
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
        } else if (pathname === '/info') {
          const info = await this.getPageInfo();
          res.writeHead(200);
          res.end(JSON.stringify(info));
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
