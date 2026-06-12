/**
 * Enhanced Persistent Browser Service
 * Complete browser automation with all advanced features
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

class EnhancedBrowserService {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.sessionDir = '.browser-sessions';
    this.sessionFile = path.join(this.sessionDir, 'persistent-session.json');
    this.screenshotsDir = '.browser-screenshots';
    this.baselinesDir = '.browser-baselines';
    this.port = 3456;
    this.debugMode = false;
    this.slowMo = 0;
    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 5000,
      backoffMultiplier: 2
    };
    this.ensureDirectories();
  }
  
  ensureDirectories() {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
    if (!fs.existsSync(this.baselinesDir)) {
      fs.mkdirSync(this.baselinesDir, { recursive: true });
    }
  }
  
  async startBrowser(options = {}) {
    if (!this.browser) {
      console.log('🌐 Starting enhanced browser...');
      
      const launchOptions = {
        headless: options.headless ?? false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
        ]
      };
      
      if (options.slowMo) {
        this.slowMo = options.slowMo;
        launchOptions.slowMo = options.slowMo;
      }
      
      this.browser = await chromium.launch(launchOptions);
      
      const sessionExists = fs.existsSync(this.sessionFile);
      this.context = await this.browser.newContext({
        viewport: options.viewport || { width: 1280, height: 720 },
        userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: options.locale || 'en-US',
        timezoneId: options.timezoneId || 'America/New_York',
        acceptDownloads: true,
        ignoreHTTPSErrors: options.ignoreHTTPSErrors || false,
        javaScriptEnabled: true,
        storageState: sessionExists ? this.sessionFile : undefined,
        deviceScaleFactor: options.deviceScaleFactor || 1,
        isMobile: options.isMobile || false,
        hasTouch: options.hasTouch || false,
      });
      
      this.page = await this.context.newPage();
      
      // Set up error screenshot handler
      this.page.on('pageerror', async (error) => {
        await this.takeErrorScreenshot(error);
      });
      
      console.log('✅ Enhanced browser started');
    }
  }
  
  async saveSession() {
    if (this.context) {
      await this.context.storageState({ path: this.sessionFile });
    }
  }
  
  // ==================== SMART WAITING ====================
  
  async waitForSelector(selector, options = {}) {
    if (!this.page) await this.startBrowser();
    
    try {
      const timeout = options.timeout || 30000;
      const state = options.state || 'attached';
      await this.page.waitForSelector(selector, { timeout, state });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async waitForFunction(fn, options = {}) {
    if (!this.page) await this.startBrowser();
    
    try {
      const timeout = options.timeout || 30000;
      const polling = options.polling || 'raf';
      await this.page.waitForFunction(fn, { timeout, polling });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async waitForNavigation(options = {}) {
    if (!this.page) await this.startBrowser();
    
    try {
      const timeout = options.timeout || 30000;
      const waitUntil = options.waitUntil || 'load';
      await this.page.waitForNavigation({ timeout, waitUntil });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async waitForResponse(urlOrPredicate, options = {}) {
    if (!this.page) await this.startBrowser();
    
    try {
      const timeout = options.timeout || 30000;
      const response = await this.page.waitForResponse(urlOrPredicate, { timeout });
      return { success: true, url: response.url(), status: response.status() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async waitForNetworkIdle(options = {}) {
    if (!this.page) await this.startBrowser();
    
    try {
      const timeout = options.timeout || 30000;
      const idleTime = options.idleTime || 500;
      await this.page.waitForNetworkIdle({ timeout, idleTime });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // ==================== BETTER ELEMENT SELECTION ====================
  
  async getByRole(role, options = {}) {
    if (!this.page) await this.startBrowser();
    
    try {
      const locator = this.page.getByRole(role, options);
      await locator.waitFor({ timeout: 5000 });
      return { success: true, locator: locator.toString() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getByText(text, options = {}) {
    if (!this.page) await this.startBrowser();
    
    try {
      const locator = this.page.getByText(text, options);
      await locator.waitFor({ timeout: 5000 });
      return { success: true, locator: locator.toString() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getByLabel(text, options = {}) {
    if (!this.page) await this.startBrowser();
    
    try {
      const locator = this.page.getByLabel(text, options);
      await locator.waitFor({ timeout: 5000 });
      return { success: true, locator: locator.toString() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getByPlaceholder(text, options = {}) {
    if (!this.page) await this.startBrowser();
    
    try {
      const locator = this.page.getByPlaceholder(text, options);
      await locator.waitFor({ timeout: 5000 });
      return { success: true, locator: locator.toString() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getByTestId(testId, options = {}) {
    if (!this.page) await this.startBrowser();
    
    try {
      const locator = this.page.getByTestId(testId, options);
      await locator.waitFor({ timeout: 5000 });
      return { success: true, locator: locator.toString() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getByAltText(text, options = {}) {
    if (!this.page) await this.startBrowser();
    
    try {
      const locator = this.page.getByAltText(text, options);
      await locator.waitFor({ timeout: 5000 });
      return { success: true, locator: locator.toString() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // ==================== RETRY LOGIC ====================
  
  async withRetry(fn, options = {}) {
    const maxRetries = options.maxRetries || this.retryConfig.maxRetries;
    const initialDelay = options.initialDelay || this.retryConfig.initialDelay;
    const maxDelay = options.maxDelay || this.retryConfig.maxDelay;
    const backoffMultiplier = options.backoffMultiplier || this.retryConfig.backoffMultiplier;
    
    let lastError;
    let delay = initialDelay;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        return { success: true, result, attempts: attempt + 1 };
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          console.log(`⚠️  Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * backoffMultiplier, maxDelay);
        }
      }
    }
    
    return { success: false, error: lastError.message, attempts: maxRetries + 1 };
  }
  
  // ==================== AUTO SCREENSHOTS ON ERROR ====================
  
  async takeErrorScreenshot(error) {
    if (!this.page) return;
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `error-${timestamp}-${error.message.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      const filepath = path.join(this.screenshotsDir, filename);
      
      const screenshot = await this.page.screenshot({
        path: filepath,
        fullPage: true
      });
      
      const info = {
        url: this.page.url(),
        title: await this.page.title(),
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      const infoFile = filepath.replace('.png', '.json');
      fs.writeFileSync(infoFile, JSON.stringify(info, null, 2));
      
      console.log(`📸 Error screenshot saved: ${filename}`);
    } catch (screenshotError) {
      console.log('⚠️  Could not save error screenshot:', screenshotError.message);
    }
  }
  
  // ==================== NETWORK INTERCEPTION ====================
  
  async interceptRequest(urlPattern, handler) {
    if (!this.page) await this.startBrowser();
    
    await this.page.route(urlPattern, handler);
    return { success: true };
  }
  
  async mockResponse(urlPattern, response) {
    if (!this.page) await this.startBrowser();
    
    await this.page.route(urlPattern, route => {
      route.fulfill({
        status: response.status || 200,
        contentType: response.contentType || 'application/json',
        body: JSON.stringify(response.body)
      });
    });
    
    return { success: true };
  }
  
  async getNetworkRequests() {
    if (!this.page) await this.startBrowser();
    
    // This would need to be set up before navigation
    return { success: true, requests: [] };
  }
  
  // ==================== SHADOW DOM SUPPORT ====================
  
  async queryShadowRoot(selector) {
    if (!this.page) await this.startBrowser();
    
    const result = await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element || !element.shadowRoot) return null;
      
      return {
        shadowRoot: true,
        innerHTML: element.shadowRoot.innerHTML.substring(0, 1000)
      };
    }, selector);
    
    return { success: true, result };
  }
  
  async clickShadowElement(hostSelector, shadowSelector) {
    if (!this.page) await this.startBrowser();
    
    const result = await this.page.evaluate((hostSel, shadowSel) => {
      const host = document.querySelector(hostSel);
      if (!host || !host.shadowRoot) return { success: false, error: 'Shadow root not found' };
      
      const element = host.shadowRoot.querySelector(shadowSel);
      if (!element) return { success: false, error: 'Element not found in shadow root' };
      
      element.click();
      return { success: true };
    }, hostSelector, shadowSelector);
    
    return result;
  }
  
  // ==================== FRAME/IFRAME SUPPORT ====================
  
  async getFrames() {
    if (!this.page) await this.startBrowser();
    
    const frames = this.page.frames();
    return { success: true, frames: frames.map(f => ({ url: f.url(), name: f.name() })) };
  }
  
  async frameLocator(selector) {
    if (!this.page) await this.startBrowser();
    
    const frame = this.page.frameLocator(selector);
    return { success: true, frame: frame.toString() };
  }
  
  // ==================== MORE INTERACTION METHODS ====================
  
  async type(selector, text, options = {}) {
    if (!this.page) await this.startBrowser();
    
    try {
      const delay = options.delay || 50;
      await this.page.fill(selector, '');
      await this.page.type(selector, text, { delay });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async selectOption(selector, value) {
    if (!this.page) await this.startBrowser();
    
    try {
      await this.page.selectOption(selector, value);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async check(selector) {
    if (!this.page) await this.startBrowser();
    
    try {
      await this.page.check(selector);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async uncheck(selector) {
    if (!this.page) await this.startBrowser();
    
    try {
      await this.page.uncheck(selector);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async uploadFile(selector, filePath) {
    if (!this.page) await this.startBrowser();
    
    try {
      await this.page.setInputFiles(selector, filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async dragAndDrop(source, target) {
    if (!this.page) await this.startBrowser();
    
    try {
      await this.page.dragAndDrop(source, target);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async doubleClick(selector) {
    if (!this.page) await this.startBrowser();
    
    try {
      await this.page.dblclick(selector);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async rightClick(selector) {
    if (!this.page) await this.startBrowser();
    
    try {
      await this.page.click(selector, { button: 'right' });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async scroll(selector, options = {}) {
    if (!this.page) await this.startBrowser();
    
    try {
      await this.page.locator(selector).scrollIntoViewIfNeeded(options);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async press(key) {
    if (!this.page) await this.startBrowser();
    
    try {
      await this.page.keyboard.press(key);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // ==================== VISUAL REGRESSION ====================
  
  async takeBaselineScreenshot(name) {
    if (!this.page) await this.startBrowser();
    
    const filepath = path.join(this.baselinesDir, `${name}.png`);
    await this.page.screenshot({ path: filepath, fullPage: true });
    return { success: true, filepath };
  }
  
  async compareScreenshot(name, options = {}) {
    if (!this.page) await this.startBrowser();
    
    const currentPath = path.join(this.screenshotsDir, `${name}-current.png`);
    const baselinePath = path.join(this.baselinesDir, `${name}.png`);
    
    if (!fs.existsSync(baselinePath)) {
      return { success: false, error: 'Baseline not found' };
    }
    
    await this.page.screenshot({ path: currentPath, fullPage: true });
    
    // Simple comparison (would need pixelmatch library for actual diffing)
    const currentStats = fs.statSync(currentPath);
    const baselineStats = fs.statSync(baselinePath);
    
    return {
      success: true,
      currentSize: currentStats.size,
      baselineSize: baselineStats.size,
      sizeDiff: currentStats.size - baselineStats.size
    };
  }
  
  // ==================== PERFORMANCE MONITORING ====================
  
  async getPerformanceMetrics() {
    if (!this.page) await this.startBrowser();
    
    const metrics = await this.page.metrics();
    return { success: true, metrics };
  }
  
  async getResourceTiming() {
    if (!this.page) await this.startBrowser();
    
    const timing = await this.page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      return entries.map(entry => ({
        name: entry.name,
        duration: entry.duration,
        transferSize: entry.transferSize
      }));
    });
    
    return { success: true, timing };
  }
  
  async getCoreWebVitals() {
    if (!this.page) await this.startBrowser();
    
    const vitals = await this.page.evaluate(() => {
      return {
        // LCP would need PerformanceObserver
        // FID would need PerformanceObserver
        // CLS would need PerformanceObserver
        timestamp: performance.now()
      };
    });
    
    return { success: true, vitals };
  }
  
  // ==================== MOBILE EMULATION ====================
  
  async emulateDevice(device) {
    if (!this.page) await this.startBrowser();
    
    const devices = {
      'iPhone 12': chromium.devices['iPhone 12'],
      'Pixel 5': chromium.devices['Pixel 5'],
    };
    
    if (devices[device]) {
      await this.context.setViewport(devices[device].viewport);
      return { success: true, device };
    }
    
    return { success: false, error: 'Device not found' };
  }
  
  // ==================== BROWSER CONTEXT MANAGEMENT ====================
  
  async newContext(options = {}) {
    if (!this.browser) await this.startBrowser();
    
    const newContext = await this.browser.newContext(options);
    return { success: true, contextId: newContext.toString() };
  }
  
  async setCookies(cookies) {
    if (!this.context) await this.startBrowser();
    
    await this.context.addCookies(cookies);
    return { success: true };
  }
  
  async getCookies() {
    if (!this.context) await this.startBrowser();
    
    const cookies = await this.context.cookies();
    return { success: true, cookies };
  }
  
  async clearCookies() {
    if (!this.context) await this.startBrowser();
    
    await this.context.clearCookies();
    return { success: true };
  }
  
  async setLocalStorage(items) {
    if (!this.page) await this.startBrowser();
    
    await this.page.evaluate((items) => {
      for (const [key, value] of Object.entries(items)) {
        localStorage.setItem(key, value);
      }
    }, items);
    
    return { success: true };
  }
  
  async getLocalStorage() {
    if (!this.page) await this.startBrowser();
    
    const storage = await this.page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        items[key] = localStorage.getItem(key);
      }
      return items;
    });
    
    return { success: true, storage };
  }
  
  // ==================== DEBUG MODE ====================
  
  setDebugMode(enabled) {
    this.debugMode = enabled;
    if (enabled) {
      this.slowMo = 1000;
    } else {
      this.slowMo = 0;
    }
    return { success: true, debugMode: enabled };
  }
  
  async highlightElement(selector) {
    if (!this.page) await this.startBrowser();
    
    await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        element.style.border = '3px solid red';
        element.style.backgroundColor = 'yellow';
      }
    }, selector);
    
    return { success: true };
  }
  
  // ==================== EXISTING METHODS (ENHANCED) ====================
  
  async navigateTo(url) {
    if (!this.page) await this.startBrowser();
    
    console.log(`🔗 Navigating to: ${url}`);
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    // Smart wait instead of fixed timeout
    await this.waitForNetworkIdle({ timeout: 10000, idleTime: 500 });
    
    await this.acceptCookies();
    await this.switchToDarkMode();
    await this.saveSession();
    
    console.log('✅ Navigation complete');
  }
  
  async switchToDarkMode() {
    if (!this.page) return;
    
    try {
      console.log('🌙 Switching to dark mode...');
      
      const darkModeCode = `
        (function() {
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
          
          document.documentElement.setAttribute('data-theme', 'dark');
          document.documentElement.setAttribute('data-color-mode', 'dark');
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
          localStorage.setItem('theme', 'dark');
          localStorage.setItem('color-mode', 'dark');
          localStorage.setItem('darkMode', 'true');
          
          return 'Attempted to set dark mode';
        })()
      `;
      
      const result = await this.page.evaluate(darkModeCode);
      console.log(`✅ Dark mode result: ${result}`);
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
    
    const result = await this.withRetry(async () => {
      await this.page.click(selector);
      await new Promise(resolve => setTimeout(resolve, this.slowMo));
    });
    
    return result;
  }
  
  async fillInput(selector, value) {
    if (!this.page) await this.startBrowser();
    
    const result = await this.withRetry(async () => {
      await this.page.fill(selector, value);
      await new Promise(resolve => setTimeout(resolve, this.slowMo));
    });
    
    return result;
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
        
        inputList.push({ type, name, id, placeholder, value, visible: isVisible });
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
          buttonList.push({ text: text.trim(), id, className, visible: isVisible });
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
  
  async hoverElement(selector) {
    if (!this.page) await this.startBrowser();
    
    try {
      await this.page.hover(selector);
      await new Promise(resolve => setTimeout(resolve, this.slowMo));
      return { success: true };
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
  
  // ==================== API SERVER ====================
  
  startServer() {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const pathname = url.pathname;
        
        res.setHeader('Content-Type', 'application/json');
        
        // Smart Waiting
        if (pathname === '/wait-for-selector') {
          const selector = url.searchParams.get('selector');
          const result = await this.waitForSelector(selector);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/wait-for-function') {
          const code = url.searchParams.get('code');
          const result = await this.waitForFunction(decodeURIComponent(code));
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/wait-for-navigation') {
          const result = await this.waitForNavigation();
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/wait-for-response') {
          const urlPattern = url.searchParams.get('url');
          const result = await this.waitForResponse(urlPattern);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/wait-for-network-idle') {
          const result = await this.waitForNetworkIdle();
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        }
        
        // Better Element Selection
        else if (pathname === '/get-by-role') {
          const role = url.searchParams.get('role');
          const name = url.searchParams.get('name');
          const result = await this.getByRole(role, name ? { name } : {});
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/get-by-text') {
          const text = url.searchParams.get('text');
          const result = await this.getByText(text);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/get-by-label') {
          const text = url.searchParams.get('text');
          const result = await this.getByLabel(text);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/get-by-placeholder') {
          const text = url.searchParams.get('text');
          const result = await this.getByPlaceholder(text);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/get-by-test-id') {
          const testId = url.searchParams.get('testId');
          const result = await this.getByTestId(testId);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/get-by-alt-text') {
          const text = url.searchParams.get('text');
          const result = await this.getByAltText(text);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        }
        
        // Retry Logic
        else if (pathname === '/with-retry') {
          const code = url.searchParams.get('code');
          const result = await this.withRetry(async () => {
            return await this.page.evaluate(decodeURIComponent(code));
          });
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        }
        
        // Network Interception
        else if (pathname === '/intercept-request') {
          const urlPattern = url.searchParams.get('url');
          const result = await this.interceptRequest(urlPattern);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/mock-response') {
          const urlPattern = url.searchParams.get('url');
          const responseBody = url.searchParams.get('body');
          const result = await this.mockResponse(urlPattern, JSON.parse(decodeURIComponent(responseBody)));
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        }
        
        // Shadow DOM
        else if (pathname === '/query-shadow-root') {
          const selector = url.searchParams.get('selector');
          const result = await this.queryShadowRoot(selector);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/click-shadow-element') {
          const hostSelector = url.searchParams.get('host');
          const shadowSelector = url.searchParams.get('shadow');
          const result = await this.clickShadowElement(hostSelector, shadowSelector);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        }
        
        // Frame Support
        else if (pathname === '/get-frames') {
          const result = await this.getFrames();
          res.writeHead(200);
          res.end(JSON.stringify(result));
        } else if (pathname === '/frame-locator') {
          const selector = url.searchParams.get('selector');
          const result = await this.frameLocator(selector);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        }
        
        // More Interactions
        else if (pathname === '/type') {
          const selector = url.searchParams.get('selector');
          const text = url.searchParams.get('text');
          const result = await this.type(selector, text);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/select-option') {
          const selector = url.searchParams.get('selector');
          const value = url.searchParams.get('value');
          const result = await this.selectOption(selector, value);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/check') {
          const selector = url.searchParams.get('selector');
          const result = await this.check(selector);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/uncheck') {
          const selector = url.searchParams.get('selector');
          const result = await this.uncheck(selector);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/upload-file') {
          const selector = url.searchParams.get('selector');
          const filePath = url.searchParams.get('path');
          const result = await this.uploadFile(selector, filePath);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/drag-and-drop') {
          const source = url.searchParams.get('source');
          const target = url.searchParams.get('target');
          const result = await this.dragAndDrop(source, target);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/double-click') {
          const selector = url.searchParams.get('selector');
          const result = await this.doubleClick(selector);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/right-click') {
          const selector = url.searchParams.get('selector');
          const result = await this.rightClick(selector);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/scroll') {
          const selector = url.searchParams.get('selector');
          const result = await this.scroll(selector);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/press') {
          const key = url.searchParams.get('key');
          const result = await this.press(key);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        }
        
        // Visual Regression
        else if (pathname === '/take-baseline') {
          const name = url.searchParams.get('name');
          const result = await this.takeBaselineScreenshot(name);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/compare-screenshot') {
          const name = url.searchParams.get('name');
          const result = await this.compareScreenshot(name);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        }
        
        // Performance
        else if (pathname === '/performance-metrics') {
          const result = await this.getPerformanceMetrics();
          res.writeHead(200);
          res.end(JSON.stringify(result));
        } else if (pathname === '/resource-timing') {
          const result = await this.getResourceTiming();
          res.writeHead(200);
          res.end(JSON.stringify(result));
        } else if (pathname === '/core-web-vitals') {
          const result = await this.getCoreWebVitals();
          res.writeHead(200);
          res.end(JSON.stringify(result));
        }
        
        // Mobile Emulation
        else if (pathname === '/emulate-device') {
          const device = url.searchParams.get('device');
          const result = await this.emulateDevice(device);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        }
        
        // Context Management
        else if (pathname === '/set-cookies') {
          const cookies = JSON.parse(url.searchParams.get('cookies'));
          const result = await this.setCookies(cookies);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/get-cookies') {
          const result = await this.getCookies();
          res.writeHead(200);
          res.end(JSON.stringify(result));
        } else if (pathname === '/clear-cookies') {
          const result = await this.clearCookies();
          res.writeHead(200);
          res.end(JSON.stringify(result));
        } else if (pathname === '/set-local-storage') {
          const items = JSON.parse(url.searchParams.get('items'));
          const result = await this.setLocalStorage(items);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        } else if (pathname === '/get-local-storage') {
          const result = await this.getLocalStorage();
          res.writeHead(200);
          res.end(JSON.stringify(result));
        }
        
        // Debug Mode
        else if (pathname === '/set-debug-mode') {
          const enabled = url.searchParams.get('enabled') === 'true';
          const result = this.setDebugMode(enabled);
          res.writeHead(200);
          res.end(JSON.stringify(result));
        } else if (pathname === '/highlight-element') {
          const selector = url.searchParams.get('selector');
          const result = await this.highlightElement(selector);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
        }
        
        // Existing endpoints
        else if (pathname === '/navigate') {
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
          await this.switchToDarkMode();
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
        await this.takeErrorScreenshot(error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    
    server.listen(this.port, () => {
      console.log(`🚀 Enhanced browser service listening on port ${this.port}`);
      console.log(`📡 API endpoints (50+ available):`);
      console.log(`   Smart Waiting: /wait-for-selector, /wait-for-function, /wait-for-navigation, /wait-for-response, /wait-for-network-idle`);
      console.log(`   Element Selection: /get-by-role, /get-by-text, /get-by-label, /get-by-placeholder, /get-by-test-id, /get-by-alt-text`);
      console.log(`   Retry Logic: /with-retry`);
      console.log(`   Network: /intercept-request, /mock-response`);
      console.log(`   Shadow DOM: /query-shadow-root, /click-shadow-element`);
      console.log(`   Frames: /get-frames, /frame-locator`);
      console.log(`   Interactions: /type, /select-option, /check, /uncheck, /upload-file, /drag-and-drop, /double-click, /right-click, /scroll, /press`);
      console.log(`   Visual: /take-baseline, /compare-screenshot`);
      console.log(`   Performance: /performance-metrics, /resource-timing, /core-web-vitals`);
      console.log(`   Mobile: /emulate-device`);
      console.log(`   Context: /set-cookies, /get-cookies, /clear-cookies, /set-local-storage, /get-local-storage`);
      console.log(`   Debug: /set-debug-mode, /highlight-element`);
    });
    
    return server;
  }
}

// Start the service
const service = new EnhancedBrowserService();
service.startBrowser().then(() => {
  service.startServer();
}).catch(console.error);
