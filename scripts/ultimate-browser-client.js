/**
 * Ultimate Browser Client
 * Complete client for 150+ browser automation features
 */

const http = require('http');

class UltimateBrowserClient {
  constructor(baseUrl = 'http://localhost:3456') {
    this.baseUrl = baseUrl;
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
  
  // ==================== MULTI-BROWSER ====================
  async startFirefox() {
    return this.request('/start-firefox');
  }
  
  async startWebkit() {
    return this.request('/start-webkit');
  }
  
  // ==================== MULTI-PAGE ====================
  async newPage() {
    return this.request('/new-page');
  }
  
  async getPage(pageId) {
    return this.request('/get-page', { pageId });
  }
  
  async closePage(pageId) {
    return this.request('/close-page', { pageId });
  }
  
  async switchToPage(pageId) {
    return this.request('/switch-to-page', { pageId });
  }
  
  async getAllPages() {
    return this.request('/get-all-pages');
  }
  
  // ==================== MULTI-CONTEXT ====================
  async newContext(options) {
    return this.request('/new-context', { options: JSON.stringify(options) });
  }
  
  async getContext(contextId) {
    return this.request('/get-context', { contextId });
  }
  
  async closeContext(contextId) {
    return this.request('/close-context', { contextId });
  }
  
  // ==================== VIDEO RECORDING ====================
  async startVideoRecording(options) {
    return this.request('/start-video', { options: JSON.stringify(options) });
  }
  
  async stopVideoRecording() {
    return this.request('/stop-video');
  }
  
  // ==================== TRACE VIEWER ====================
  async startTrace(name) {
    return this.request('/start-trace', { name });
  }
  
  async stopTrace(name) {
    return this.request('/stop-trace', { name });
  }
  
  // ==================== TEST RUNNER ====================
  async runTest(testFn, options) {
    return this.request('/run-test', { 
      fn: testFn.toString(), 
      options: JSON.stringify(options) 
    });
  }
  
  // ==================== ASSERTIONS ====================
  async expect(actual) {
    return this.request('/expect', { actual: JSON.stringify(actual) });
  }
  
  // ==================== REPORTERS ====================
  async generateReport(results, format) {
    return this.request('/generate-report', { 
      results: JSON.stringify(results), 
      format 
    });
  }
  
  // ==================== PARALLEL EXECUTION ====================
  async runParallel(tests, workers) {
    return this.request('/run-parallel', { 
      tests: JSON.stringify(tests), 
      workers 
    });
  }
  
  // ==================== FIXTURES ====================
  async useFixture(fixtureFn) {
    return this.request('/use-fixture', { fn: fixtureFn.toString() });
  }
  
  // ==================== HOOKS ====================
  async beforeAll(fn) {
    return this.request('/before-all', { fn: fn.toString() });
  }
  
  async afterAll(fn) {
    return this.request('/after-all', { fn: fn.toString() });
  }
  
  async beforeEach(fn) {
    return this.request('/before-each', { fn: fn.toString() });
  }
  
  async afterEach(fn) {
    return this.request('/after-each', { fn: fn.toString() });
  }
  
  // ==================== COVERAGE ====================
  async collectCoverage() {
    return this.request('/collect-coverage');
  }
  
  // ==================== ACCESSIBILITY ====================
  async checkAccessibility() {
    return this.request('/check-accessibility');
  }
  
  // ==================== REMOTE BROWSER ====================
  async connectToRemote(options) {
    return this.request('/connect-remote', { options: JSON.stringify(options) });
  }
  
  // ==================== CUSTOM BINARY ====================
  async useCustomBinary(executablePath) {
    return this.request('/use-custom-binary', { path: executablePath });
  }
  
  // ==================== EXTENSIONS ====================
  async loadExtension(extensionPath) {
    return this.request('/load-extension', { path: extensionPath });
  }
  
  // ==================== CDP ====================
  async executeCDPCommand(command, params) {
    return this.request('/execute-cdp', { 
      command, 
      params: JSON.stringify(params) 
    });
  }
  
  // ==================== XPATH ====================
  async getByXPath(xpath) {
    return this.request('/get-by-xpath', { xpath });
  }
  
  // ==================== REACT/VUE SELECTORS ====================
  async getByReactSelector(selector) {
    return this.request('/get-by-react', { selector });
  }
  
  async getByVueSelector(selector) {
    return this.request('/get-by-vue', { selector });
  }
  
  // ==================== LOCATOR STRATEGIES ====================
  async getFirst(selector) {
    return this.request('/get-first', { selector });
  }
  
  async getLast(selector) {
    return this.request('/get-last', { selector });
  }
  
  async getNth(selector, index) {
    return this.request('/get-nth', { selector, index });
  }
  
  async getHas(selector, innerSelector) {
    return this.request('/get-has', { selector, inner });
  }
  
  async getFilter(selector, filterFn) {
    return this.request('/get-filter', { 
      selector, 
      filter: filterFn.toString() 
    });
  }
  
  // ==================== CHAINING ====================
  async chainLocators(...locators) {
    return this.request('/chain-locators', { 
      locators: JSON.stringify(locators) 
    });
  }
  
  // ==================== VISIBILITY ====================
  async getVisible(selector) {
    return this.request('/get-visible', { selector });
  }
  
  async getHidden(selector) {
    return this.request('/get-hidden', { selector });
  }
  
  // ==================== TOUCH ACTIONS ====================
  async tap(selector) {
    return this.request('/tap', { selector });
  }
  
  async longPress(selector, duration) {
    return this.request('/long-press', { selector, duration });
  }
  
  async swipe(startX, startY, endX, endY) {
    return this.request('/swipe', { startX, startY, endX, endY });
  }
  
  async pinch(selector) {
    return this.request('/pinch', { selector });
  }
  
  async zoom(selector) {
    return this.request('/zoom', { selector });
  }
  
  // ==================== MULTI-TOUCH ====================
  async multiTouch(actions) {
    return this.request('/multi-touch', { 
      actions: JSON.stringify(actions) 
    });
  }
  
  // ==================== WHEEL ====================
  async wheel(deltaX, deltaY) {
    return this.request('/wheel', { deltaX, deltaY });
  }
  
  // ==================== MOUSE ACTIONS ====================
  async mouseMove(x, y) {
    return this.request('/mouse-move', { x, y });
  }
  
  async mouseDown() {
    return this.request('/mouse-down');
  }
  
  async mouseUp() {
    return this.request('/mouse-up');
  }
  
  // ==================== KEYBOARD ACTIONS ====================
  async keyDown(key) {
    return this.request('/key-down', { key });
  }
  
  async keyUp(key) {
    return this.request('/key-up', { key });
  }
  
  async insertText(text) {
    return this.request('/insert-text', { text });
  }
  
  // ==================== CLIPBOARD ====================
  async readClipboard() {
    return this.request('/read-clipboard');
  }
  
  async writeClipboard(text) {
    return this.request('/write-clipboard', { text });
  }
  
  // ==================== FILE CHOOSER ====================
  async handleFileChooser(selector, files) {
    return this.request('/handle-file-chooser', { 
      selector, 
      files: JSON.stringify(files) 
    });
  }
  
  // ==================== DOWNLOAD ====================
  async waitForDownload() {
    return this.request('/wait-for-download');
  }
  
  // ==================== DIALOG ====================
  async setDialogHandler(handler) {
    return this.request('/set-dialog-handler', { 
      handler: handler.toString() 
    });
  }
  
  async acceptDialog(promptText) {
    return this.request('/accept-dialog', { promptText });
  }
  
  async dismissDialog() {
    return this.request('/dismiss-dialog');
  }
  
  // ==================== POPUP ====================
  async waitForPopup() {
    return this.request('/wait-for-popup');
  }
  
  // ==================== WEBSOCKET ====================
  async interceptWebSocket(urlPattern, handler) {
    return this.request('/intercept-websocket', { 
      url: urlPattern, 
      handler: handler.toString() 
    });
  }
  
  async getWebSockets() {
    return this.request('/get-websockets');
  }
  
  // ==================== HEADERS ====================
  async setRequestHeaders(headers) {
    return this.request('/set-request-headers', { 
      headers: JSON.stringify(headers) 
    });
  }
  
  async getResponseHeaders(url) {
    return this.request('/get-response-headers', { url });
  }
  
  // ==================== BODY ====================
  async getRequestBody(url) {
    return this.request('/get-request-body', { url });
  }
  
  async getResponseBody(url) {
    return this.request('/get-response-body', { url });
  }
  
  // ==================== HAR ====================
  async exportHAR(filename) {
    return this.request('/export-har', { filename });
  }
  
  // ==================== THROTTLING ====================
  async setNetworkThrottle(options) {
    return this.request('/set-network-throttle', { 
      options: JSON.stringify(options) 
    });
  }
  
  async setCPUThrottle(throttleRate) {
    return this.request('/set-cpu-throttle', { rate: throttleRate });
  }
  
  async setOffline(offline) {
    return this.request('/set-offline', { offline: offline.toString() });
  }
  
  // ==================== STORAGE ====================
  async getIndexedDB() {
    return this.request('/get-indexeddb');
  }
  
  async getCacheStorage() {
    return this.request('/get-cache-storage');
  }
  
  async getSessionStorage() {
    return this.request('/get-session-storage');
  }
  
  async setSessionStorage(items) {
    return this.request('/set-session-storage', { 
      items: JSON.stringify(items) 
    });
  }
  
  // ==================== WORKERS ====================
  async getServiceWorkers() {
    return this.request('/get-service-workers');
  }
  
  async getWebWorkers() {
    return this.request('/get-web-workers');
  }
  
  // ==================== GEOLOCATION ====================
  async setGeolocation(options) {
    return this.request('/set-geolocation', { 
      options: JSON.stringify(options) 
    });
  }
  
  async getGeolocation() {
    return this.request('/get-geolocation');
  }
  
  // ==================== PERMISSIONS ====================
  async grantPermissions(permissions) {
    return this.request('/grant-permissions', { 
      permissions: JSON.stringify(permissions) 
    });
  }
  
  async clearPermissions() {
    return this.request('/clear-permissions');
  }
  
  // ==================== DEVICE ====================
  async setDeviceOrientation(options) {
    return this.request('/set-device-orientation', { 
      options: JSON.stringify(options) 
    });
  }
  
  async setColorScheme(scheme) {
    return this.request('/set-color-scheme', { scheme });
  }
  
  async setReducedMotion(reduced) {
    return this.request('/set-reduced-motion', { 
      reduced: reduced.toString() 
    });
  }
  
  async setForcedColors(forced) {
    return this.request('/set-forced-colors', { forced });
  }
  
  async setHighContrast(highContrast) {
    return this.request('/set-high-contrast', { 
      highContrast: highContrast.toString() 
    });
  }
  
  // ==================== CONSOLE ====================
  async getConsoleMessages() {
    return this.request('/get-console-messages');
  }
  
  async clearConsoleMessages() {
    return this.request('/clear-console-messages');
  }
  
  // ==================== ACCESSIBILITY ====================
  async getAccessibilityTree() {
    return this.request('/get-accessibility-tree');
  }
  
  // ==================== ELEMENT STATE ====================
  async getElementState(selector) {
    return this.request('/get-element-state', { selector });
  }
  
  // ==================== BOUNDING BOX ====================
  async getBoundingBox(selector) {
    return this.request('/get-bounding-box', { selector });
  }
  
  // ==================== CSS ====================
  async getComputedStyle(selector) {
    return this.request('/get-computed-style', { selector });
  }
  
  // ==================== SCROLL ====================
  async getScrollPosition() {
    return this.request('/get-scroll-position');
  }
  
  async setScrollPosition(x, y) {
    return this.request('/set-scroll-position', { x, y });
  }
  
  // ==================== ELEMENT CONTENT ====================
  async getElementContent(selector) {
    return this.request('/get-element-content', { selector });
  }
  
  // ==================== ELEMENT COUNT ====================
  async getElementCount(selector) {
    return this.request('/get-element-count', { selector });
  }
  
  // ==================== FOCUS/BLUR ====================
  async focusElement(selector) {
    return this.request('/focus-element', { selector });
  }
  
  async blurElement(selector) {
    return this.request('/blur-element', { selector });
  }
  
  // ==================== PDF ====================
  async generatePDF(options) {
    return this.request('/generate-pdf', { 
      options: JSON.stringify(options) 
    });
  }
  
  // ==================== ADVANCED SCREENSHOT ====================
  async takeAdvancedScreenshot(options) {
    return this.request('/take-advanced-screenshot', { 
      options: JSON.stringify(options) 
    });
  }
  
  // ==================== SCREENSHOT MASKING ====================
  async maskScreenshot(selector, options) {
    return this.request('/mask-screenshot', { 
      selector, 
      options: JSON.stringify(options) 
    });
  }
  
  // ==================== SCREENSHOT IGNORE REGIONS ====================
  async ignoreRegionsScreenshot(regions, options) {
    return this.request('/ignore-regions-screenshot', { 
      regions: JSON.stringify(regions), 
      options: JSON.stringify(options) 
    });
  }
  
  // ==================== WEBAUTHN ====================
  async enableWebAuthn() {
    return this.request('/enable-webauthn');
  }
  
  // ==================== HTTP AUTH ====================
  async setHTTPAuth(username, password) {
    return this.request('/set-http-auth', { username, password });
  }
  
  // ==================== CLIENT CERTIFICATES ====================
  async setClientCertificates(certificates) {
    return this.request('/set-client-certificates', { 
      certificates: JSON.stringify(certificates) 
    });
  }
  
  // ==================== PROXY AUTH ====================
  async setProxyAuth(proxy, username, password) {
    return this.request('/set-proxy-auth', { proxy, username, password });
  }
  
  // ==================== COOKIE ADVANCED ====================
  async setCookiePriority(cookie, priority) {
    return this.request('/set-cookie-priority', { 
      cookie: JSON.stringify(cookie), 
      priority 
    });
  }
  
  async setCookieSameParty(cookie, sameParty) {
    return this.request('/set-cookie-same-party', { 
      cookie: JSON.stringify(cookie), 
      sameParty: sameParty.toString() 
    });
  }
  
  async setCookiePartitionKey(cookie, partitionKey) {
    return this.request('/set-cookie-partition-key', { 
      cookie: JSON.stringify(cookie), 
      partitionKey 
    });
  }
  
  // ==================== USER AGENT ====================
  async setUserAgent(userAgent) {
    return this.request('/set-user-agent', { userAgent });
  }
  
  // ==================== VIEWPORT ====================
  async setViewportSize(width, height) {
    return this.request('/set-viewport-size', { width, height });
  }
  
  // ==================== MEDIA TYPE ====================
  async setMediaType(media) {
    return this.request('/set-media-type', { media });
  }
  
  // ==================== COLOR GAMUT ====================
  async setColorGamut(gamut) {
    return this.request('/set-color-gamut', { gamut });
  }
  
  // ==================== TEST TAGS ====================
  async runTaggedTests(tags, tests) {
    return this.request('/run-tagged-tests', { 
      tags: JSON.stringify(tags), 
      tests: JSON.stringify(tests) 
    });
  }
  
  // ==================== TEST PROJECTS ====================
  async runProject(projectConfig) {
    return this.request('/run-project', { 
      config: JSON.stringify(projectConfig) 
    });
  }
  
  // ==================== TEST CONFIG ====================
  async setTestConfig(config) {
    return this.request('/set-test-config', { 
      config: JSON.stringify(config) 
    });
  }
  
  // ==================== GLOBAL SETUP/TEARDOWN ====================
  async globalSetup(fn) {
    return this.request('/global-setup', { fn: fn.toString() });
  }
  
  async globalTeardown(fn) {
    return this.request('/global-teardown', { fn: fn.toString() });
  }
  
  // ==================== DEPENDENT TESTS ====================
  async runDependentTests(tests) {
    return this.request('/run-dependent-tests', { 
      tests: JSON.stringify(tests) 
    });
  }
  
  // ==================== TEST FILTERING ====================
  async filterTests(tests, filter) {
    return this.request('/filter-tests', { 
      tests: JSON.stringify(tests), 
      filter: JSON.stringify(filter) 
    });
  }
  
  // ==================== CSP ====================
  async setCSP(csp) {
    return this.request('/set-csp', { csp });
  }
  
  // ==================== CORS ====================
  async setCORS(enabled) {
    return this.request('/set-cors', { enabled: enabled.toString() });
  }
  
  // ==================== ENHANCED FEATURES ====================
  async waitForSelector(selector, options) {
    return this.request('/wait-for-selector', { 
      selector, 
      options: JSON.stringify(options) 
    });
  }
  
  async waitForFunction(code, options) {
    return this.request('/wait-for-function', { 
      code: encodeURIComponent(code), 
      options: JSON.stringify(options) 
    });
  }
  
  async waitForNavigation(options) {
    return this.request('/wait-for-navigation', { 
      options: JSON.stringify(options) 
    });
  }
  
  async waitForResponse(urlPattern, options) {
    return this.request('/wait-for-response', { 
      url: urlPattern, 
      options: JSON.stringify(options) 
    });
  }
  
  async waitForNetworkIdle(options) {
    return this.request('/wait-for-network-idle', { 
      options: JSON.stringify(options) 
    });
  }
  
  async getByRole(role, options) {
    return this.request('/get-by-role', { 
      role, 
      options: JSON.stringify(options) 
    });
  }
  
  async getByText(text, options) {
    return this.request('/get-by-text', { 
      text, 
      options: JSON.stringify(options) 
    });
  }
  
  async getByLabel(text, options) {
    return this.request('/get-by-label', { 
      text, 
      options: JSON.stringify(options) 
    });
  }
  
  async getByPlaceholder(text, options) {
    return this.request('/get-by-placeholder', { 
      text, 
      options: JSON.stringify(options) 
    });
  }
  
  async getByTestId(testId, options) {
    return this.request('/get-by-test-id', { 
      testId, 
      options: JSON.stringify(options) 
    });
  }
  
  async getByAltText(text, options) {
    return this.request('/get-by-alt-text', { 
      text, 
      options: JSON.stringify(options) 
    });
  }
  
  async withRetry(code, options) {
    return this.request('/with-retry', { 
      code: encodeURIComponent(code), 
      options: JSON.stringify(options) 
    });
  }
  
  async interceptRequest(urlPattern) {
    return this.request('/intercept-request', { url: urlPattern });
  }
  
  async mockResponse(urlPattern, responseBody) {
    return this.request('/mock-response', { 
      url: urlPattern, 
      body: encodeURIComponent(JSON.stringify(responseBody)) 
    });
  }
  
  async queryShadowRoot(selector) {
    return this.request('/query-shadow-root', { selector });
  }
  
  async clickShadowElement(hostSelector, shadowSelector) {
    return this.request('/click-shadow-element', { 
      host: hostSelector, 
      shadow: shadowSelector 
    });
  }
  
  async getFrames() {
    return this.request('/get-frames');
  }
  
  async frameLocator(selector) {
    return this.request('/frame-locator', { selector });
  }
  
  async type(selector, text, options) {
    return this.request('/type', { 
      selector, 
      text, 
      options: JSON.stringify(options) 
    });
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
  
  async scroll(selector, options) {
    return this.request('/scroll', { 
      selector, 
      options: JSON.stringify(options) 
    });
  }
  
  async press(key) {
    return this.request('/press', { key });
  }
  
  async takeBaselineScreenshot(name) {
    return this.request('/take-baseline', { name });
  }
  
  async compareScreenshot(name, options) {
    return this.request('/compare-screenshot', { 
      name, 
      options: JSON.stringify(options) 
    });
  }
  
  async getPerformanceMetrics() {
    return this.request('/performance-metrics');
  }
  
  async getResourceTiming() {
    return this.request('/resource-timing');
  }
  
  async getCoreWebVitals() {
    return this.request('/core-web-vitals');
  }
  
  async emulateDevice(device) {
    return this.request('/emulate-device', { device });
  }
  
  async setCookies(cookies) {
    return this.request('/set-cookies', { 
      cookies: JSON.stringify(cookies) 
    });
  }
  
  async getCookies() {
    return this.request('/get-cookies');
  }
  
  async clearCookies() {
    return this.request('/clear-cookies');
  }
  
  async setLocalStorage(items) {
    return this.request('/set-local-storage', { 
      items: JSON.stringify(items) 
    });
  }
  
  async getLocalStorage() {
    return this.request('/get-local-storage');
  }
  
  async setDebugMode(enabled) {
    return this.request('/set-debug-mode', { 
      enabled: enabled.toString() 
    });
  }
  
  async highlightElement(selector) {
    return this.request('/highlight-element', { selector });
  }
  
  // ==================== BASIC ====================
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
    return this.request('/execute-js', { 
      code: encodeURIComponent(code) 
    });
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
  
  // ==================== NEW 100% FEATURES ====================
  
  // Direct element clicking from semantic selectors
  async clickByRole(role, options) {
    return this.request('/click-by-role', { role, options: JSON.stringify(options) });
  }
  
  async clickByText(text, options) {
    return this.request('/click-by-text', { text, options: JSON.stringify(options || {}) });
  }
  
  // Element inspection from locators
  async getLocatorText(role, options) {
    return this.request('/get-locator-text', { role, options: JSON.stringify(options) });
  }
  
  async getLocatorAttribute(role, attribute, options) {
    return this.request('/get-locator-attribute', { role, attribute, options: JSON.stringify(options) });
  }
  
  async getLocatorState(role, options) {
    return this.request('/get-locator-state', { role, options: JSON.stringify(options) });
  }
  
  // Visual element detection
  async findElementByColor(selector, color) {
    return this.request('/find-by-color', { selector, color });
  }
  
  async findElementByPosition(x, y) {
    return this.request('/find-by-position', { x, y });
  }
  
  async findElementsBySize(minWidth, minHeight) {
    return this.request('/find-by-size', { minWidth, minHeight });
  }
  
  // AI-powered element finding
  async findElementByDescription(description) {
    return this.request('/find-by-description', { description });
  }
  
  // Cross-origin frame communication
  async postMessageToFrame(frameSelector, message) {
    return this.request('/post-message-to-frame', { frameSelector, message: JSON.stringify(message) });
  }
  
  async listenForFrameMessages() {
    return this.request('/listen-for-frame-messages');
  }
  
  async getFrameMessages() {
    return this.request('/get-frame-messages');
  }
  
  // Browser extension API
  async injectExtensionScript(script) {
    return this.request('/inject-extension-script', { script });
  }
  
  async executeInExtensionContext(code) {
    return this.request('/execute-in-extension-context', { code });
  }
  
  // Service worker testing
  async registerServiceWorker(scriptURL) {
    return this.request('/register-service-worker', { scriptURL });
  }
  
  async getServiceWorkerRegistration() {
    return this.request('/get-service-worker-registration');
  }
  
  async triggerPushNotification(data) {
    return this.request('/trigger-push-notification', { data: JSON.stringify(data) });
  }
  
  // WebRTC testing
  async getUserMedia(constraints) {
    return this.request('/get-user-media', { constraints: JSON.stringify(constraints) });
  }
  
  async getMediaStreamStats() {
    return this.request('/get-media-stream-stats');
  }
  
  // Canvas/WebGL testing
  async getCanvasData(selector) {
    return this.request('/get-canvas-data', { selector });
  }
  
  async getWebGLInfo(selector) {
    return this.request('/get-webgl-info', { selector });
  }
  
  // WebSocket frame inspection
  async captureWebSocketFrames(urlPattern) {
    return this.request('/capture-websocket-frames', { urlPattern });
  }
  
  async getWebSocketFrames() {
    return this.request('/get-websocket-frames');
  }
  
  // Storage quota testing
  async getStorageQuota() {
    return this.request('/get-storage-quota');
  }
  
  async requestPersistentStorage() {
    return this.request('/request-persistent-storage');
  }
  
  // Browser cache testing
  async clearBrowserCache() {
    return this.request('/clear-browser-cache');
  }
  
  async getCacheEntries() {
    return this.request('/get-cache-entries');
  }
  
  // Browser history testing
  async getHistoryLength() {
    return this.request('/get-history-length');
  }
  
  async goBack() {
    return this.request('/go-back');
  }
  
  async goForward() {
    return this.request('/go-forward');
  }
  
  async pushState(state, url) {
    return this.request('/push-state', { state: JSON.stringify(state), url });
  }
  
  // Browser print testing
  async triggerPrint() {
    return this.request('/trigger-print');
  }
  
  async cancelPrintDialog() {
    return this.request('/cancel-print-dialog');
  }
  
  // Download content verification
  async verifyDownloadContent(filePath, expectedContent) {
    return this.request('/verify-download-content', { filePath, expectedContent });
  }
  
  async getDownloadProgress() {
    return this.request('/get-download-progress');
  }
  
  // Complex drag-and-drop
  async dragOverMultiple(source, targets) {
    return this.request('/drag-over-multiple', { source, targets: JSON.stringify(targets) });
  }
  
  async validateDrop(target, expectedContent) {
    return this.request('/validate-drop', { target, expectedContent });
  }
  
  // Resize testing
  async testResponsiveBreakpoints(breakpoints) {
    return this.request('/test-responsive-breakpoints', { breakpoints: JSON.stringify(breakpoints) });
  }
  
  async listenForResizeEvents() {
    return this.request('/listen-for-resize-events');
  }
  
  async getResizeEvents() {
    return this.request('/get-resize-events');
  }
  
  // Focus testing
  async testFocusTrap(containerSelector) {
    return this.request('/test-focus-trap', { containerSelector });
  }
  
  async getFocusOrder() {
    return this.request('/get-focus-order');
  }
  
  async testFocusVisible() {
    return this.request('/test-focus-visible');
  }
  
  // Scroll testing
  async getScrollPositionDetailed() {
    return this.request('/get-scroll-position-detailed');
  }
  
  async listenForScrollEvents() {
    return this.request('/listen-for-scroll-events');
  }
  
  async getScrollEvents() {
    return this.request('/get-scroll-events');
  }
  
  async testInfiniteScroll() {
    return this.request('/test-infinite-scroll');
  }
  
  // Animation testing
  async getAnimationState(selector) {
    return this.request('/get-animation-state', { selector });
  }
  
  async waitForAnimation(selector, timeout) {
    return this.request('/wait-for-animation', { selector, timeout });
  }
  
  async listenForAnimationEvents(selector) {
    return this.request('/listen-for-animation-events', { selector });
  }
  
  async getAnimationEvents() {
    return this.request('/get-animation-events');
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

module.exports = UltimateBrowserClient;
