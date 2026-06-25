/**
 * Enhanced Browser Client
 * Client for enhanced browser service with all advanced features
 */

class EnhancedBrowserClient {
  constructor(baseUrl = 'http://localhost:3456') {
    this.baseUrl = baseUrl;
  }
  
  // ==================== SMART WAITING ====================
  
  async waitForSelector(selector, options = {}) {
    return this.request('/wait-for-selector', { selector, ...options });
  }
  
  async waitForFunction(code, options = {}) {
    return this.request('/wait-for-function', { code: encodeURIComponent(code), ...options });
  }
  
  async waitForNavigation(options = {}) {
    return this.request('/wait-for-navigation', options);
  }
  
  async waitForResponse(urlPattern, options = {}) {
    return this.request('/wait-for-response', { url: urlPattern, ...options });
  }
  
  async waitForNetworkIdle(options = {}) {
    return this.request('/wait-for-network-idle', options);
  }
  
  // ==================== BETTER ELEMENT SELECTION ====================
  
  async getByRole(role, options = {}) {
    return this.request('/get-by-role', { role, ...options });
  }
  
  async getByText(text, options = {}) {
    return this.request('/get-by-text', { text, ...options });
  }
  
  async getByLabel(text, options = {}) {
    return this.request('/get-by-label', { text, ...options });
  }
  
  async getByPlaceholder(text, options = {}) {
    return this.request('/get-by-placeholder', { text, ...options });
  }
  
  async getByTestId(testId, options = {}) {
    return this.request('/get-by-test-id', { testId, ...options });
  }
  
  async getByAltText(text, options = {}) {
    return this.request('/get-by-alt-text', { text, ...options });
  }
  
  // ==================== RETRY LOGIC ====================
  
  async withRetry(code, options = {}) {
    return this.request('/with-retry', { code: encodeURIComponent(code), ...options });
  }
  
  // ==================== NETWORK INTERCEPTION ====================
  
  async interceptRequest(urlPattern) {
    return this.request('/intercept-request', { url: urlPattern });
  }
  
  async mockResponse(urlPattern, responseBody) {
    return this.request('/mock-response', { 
      url: urlPattern, 
      body: encodeURIComponent(JSON.stringify(responseBody)) 
    });
  }
  
  // ==================== SHADOW DOM ====================
  
  async queryShadowRoot(selector) {
    return this.request('/query-shadow-root', { selector });
  }
  
  async clickShadowElement(hostSelector, shadowSelector) {
    return this.request('/click-shadow-element', { host: hostSelector, shadow: shadowSelector });
  }
  
  // ==================== FRAME SUPPORT ====================
  
  async getFrames() {
    return this.request('/get-frames');
  }
  
  async frameLocator(selector) {
    return this.request('/frame-locator', { selector });
  }
  
  // ==================== MORE INTERACTIONS ====================
  
  async type(selector, text, options = {}) {
    return this.request('/type', { selector, text, ...options });
  }
  
  async selectOption(selector, value) {
    return this.request('/select-option', { selector, value });
  }
  
  async check(selector) {
    return this.request('/check', { selector });
  }
  
  async uncheck(selector) {
    return this.request('/uncheck', { selector });
  }
  
  async uploadFile(selector, filePath) {
    return this.request('/upload-file', { selector, path: filePath });
  }
  
  async dragAndDrop(source, target) {
    return this.request('/drag-and-drop', { source, target });
  }
  
  async doubleClick(selector) {
    return this.request('/double-click', { selector });
  }
  
  async rightClick(selector) {
    return this.request('/right-click', { selector });
  }
  
  async scroll(selector, options = {}) {
    return this.request('/scroll', { selector, ...options });
  }
  
  async press(key) {
    return this.request('/press', { key });
  }
  
  // ==================== VISUAL REGRESSION ====================
  
  async takeBaselineScreenshot(name) {
    return this.request('/take-baseline', { name });
  }
  
  async compareScreenshot(name, options = {}) {
    return this.request('/compare-screenshot', { name, ...options });
  }
  
  // ==================== PERFORMANCE ====================
  
  async getPerformanceMetrics() {
    return this.request('/performance-metrics');
  }
  
  async getResourceTiming() {
    return this.request('/resource-timing');
  }
  
  async getCoreWebVitals() {
    return this.request('/core-web-vitals');
  }
  
  // ==================== MOBILE EMULATION ====================
  
  async emulateDevice(device) {
    return this.request('/emulate-device', { device });
  }
  
  // ==================== CONTEXT MANAGEMENT ====================
  
  async setCookies(cookies) {
    return this.request('/set-cookies', { cookies: JSON.stringify(cookies) });
  }
  
  async getCookies() {
    return this.request('/get-cookies');
  }
  
  async clearCookies() {
    return this.request('/clear-cookies');
  }
  
  async setLocalStorage(items) {
    return this.request('/set-local-storage', { items: JSON.stringify(items) });
  }
  
  async getLocalStorage() {
    return this.request('/get-local-storage');
  }
  
  // ==================== DEBUG MODE ====================
  
  async setDebugMode(enabled) {
    return this.request('/set-debug-mode', { enabled: enabled.toString() });
  }
  
  async highlightElement(selector) {
    return this.request('/highlight-element', { selector });
  }
  
  // ==================== EXISTING METHODS ====================
  
  async navigateTo(url) {
    return this.request('/navigate', { url });
  }
  
  async clickElement(selector) {
    return this.request('/click', { selector });
  }
  
  async fillInput(selector, value) {
    return this.request('/fill', { selector, value });
  }
  
  async listInputs() {
    return this.request('/list-inputs');
  }
  
  async listButtons() {
    return this.request('/list-buttons');
  }
  
  async getPageInfo() {
    return this.request('/info');
  }
  
  async takeScreenshot() {
    return this.request('/screenshot');
  }
  
  async executeJavaScript(code) {
    return this.request('/execute-js', { code: encodeURIComponent(code) });
  }
  
  async hoverElement(selector) {
    return this.request('/hover', { selector });
  }
  
  async switchToDarkMode() {
    return this.request('/dark-mode');
  }
  
  async close() {
    return this.request('/close');
  }
  
  request(path, params = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      }).on('error', reject);
    });
  }
}

module.exports = EnhancedBrowserClient;
