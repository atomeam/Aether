/**
 * Ultimate Browser API Routes
 * Complete API routes for 150+ browser automation features
 */

class UltimateBrowserAPIRoutes {
  constructor(service) {
    this.service = service;
  }
  
  async handleRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${this.service.port}`);
    const pathname = url.pathname;
    
    res.setHeader('Content-Type', 'application/json');
    
    try {
      // ==================== MULTI-BROWSER ====================
      if (pathname === '/start-firefox') {
        await this.service.startBrowserFirefox();
        this.sendSuccess(res);
      } else if (pathname === '/start-webkit') {
        await this.service.startBrowserWebkit();
        this.sendSuccess(res);
      }
      
      // ==================== MULTI-PAGE ====================
      else if (pathname === '/new-page') {
        const result = await this.service.newPage();
        this.sendResult(res, result);
      } else if (pathname === '/get-page') {
        const pageId = url.searchParams.get('pageId');
        const page = await this.service.getPage(pageId);
        this.sendSuccess(res, { page });
      } else if (pathname === '/close-page') {
        const pageId = url.searchParams.get('pageId');
        const result = await this.service.closePage(pageId);
        this.sendResult(res, result);
      } else if (pathname === '/switch-to-page') {
        const pageId = url.searchParams.get('pageId');
        const result = await this.service.switchToPage(pageId);
        this.sendResult(res, result);
      } else if (pathname === '/get-all-pages') {
        const result = await this.service.getAllPages();
        this.sendResult(res, result);
      }
      
      // ==================== MULTI-CONTEXT ====================
      else if (pathname === '/new-context') {
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.newContext(options);
        this.sendResult(res, result);
      } else if (pathname === '/get-context') {
        const contextId = url.searchParams.get('contextId');
        const context = await this.service.getContext(contextId);
        this.sendSuccess(res, { context });
      } else if (pathname === '/close-context') {
        const contextId = url.searchParams.get('contextId');
        const result = await this.service.closeContext(contextId);
        this.sendResult(res, result);
      }
      
      // ==================== VIDEO RECORDING ====================
      else if (pathname === '/start-video') {
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.startVideoRecording(options);
        this.sendResult(res, result);
      } else if (pathname === '/stop-video') {
        const result = await this.service.stopVideoRecording();
        this.sendResult(res, result);
      }
      
      // ==================== TRACE VIEWER ====================
      else if (pathname === '/start-trace') {
        const name = url.searchParams.get('name');
        const result = await this.service.startTrace(name);
        this.sendResult(res, result);
      } else if (pathname === '/stop-trace') {
        const name = url.searchParams.get('name');
        const result = await this.service.stopTrace(name);
        this.sendResult(res, result);
      }
      
      // ==================== TEST RUNNER ====================
      else if (pathname === '/run-test') {
        const testFn = new Function('return ' + url.searchParams.get('fn'))();
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.runTest(testFn, options);
        this.sendResult(res, result);
      }
      
      // ==================== ASSERTIONS ====================
      else if (pathname === '/expect') {
        const actual = JSON.parse(url.searchParams.get('actual'));
        const result = await this.service.expect(actual);
        this.sendResult(res, result);
      }
      
      // ==================== REPORTERS ====================
      else if (pathname === '/generate-report') {
        const results = JSON.parse(url.searchParams.get('results'));
        const format = url.searchParams.get('format') || 'json';
        const result = await this.service.generateReport(results, format);
        this.sendResult(res, result);
      }
      
      // ==================== PARALLEL EXECUTION ====================
      else if (pathname === '/run-parallel') {
        const tests = JSON.parse(url.searchParams.get('tests'));
        const workers = parseInt(url.searchParams.get('workers') || '1');
        const result = await this.service.runParallel(tests, workers);
        this.sendResult(res, result);
      }
      
      // ==================== FIXTURES ====================
      else if (pathname === '/use-fixture') {
        const fixtureFn = new Function('return ' + url.searchParams.get('fn'))();
        const result = await this.service.useFixture(fixtureFn);
        this.sendResult(res, result);
      }
      
      // ==================== HOOKS ====================
      else if (pathname === '/before-all') {
        const fn = new Function('return ' + url.searchParams.get('fn'))();
        const result = await this.service.beforeAll(fn);
        this.sendResult(res, result);
      } else if (pathname === '/after-all') {
        const fn = new Function('return ' + url.searchParams.get('fn'))();
        const result = await this.service.afterAll(fn);
        this.sendResult(res, result);
      } else if (pathname === '/before-each') {
        const fn = new Function('return ' + url.searchParams.get('fn'))();
        const result = await this.service.beforeEach(fn);
        this.sendResult(res, result);
      } else if (pathname === '/after-each') {
        const fn = new Function('return ' + url.searchParams.get('fn'))();
        const result = await this.service.afterEach(fn);
        this.sendResult(res, result);
      }
      
      // ==================== COVERAGE ====================
      else if (pathname === '/collect-coverage') {
        const result = await this.service.collectCoverage();
        this.sendResult(res, result);
      }
      
      // ==================== ACCESSIBILITY ====================
      else if (pathname === '/check-accessibility') {
        const result = await this.service.checkAccessibility();
        this.sendResult(res, result);
      }
      
      // ==================== REMOTE BROWSER ====================
      else if (pathname === '/connect-remote') {
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.connectToRemote(options);
        this.sendResult(res, result);
      }
      
      // ==================== CUSTOM BINARY ====================
      else if (pathname === '/use-custom-binary') {
        const executablePath = url.searchParams.get('path');
        const result = await this.service.useCustomBinary(executablePath);
        this.sendResult(res, result);
      }
      
      // ==================== EXTENSIONS ====================
      else if (pathname === '/load-extension') {
        const extensionPath = url.searchParams.get('path');
        const result = await this.service.loadExtension(extensionPath);
        this.sendResult(res, result);
      }
      
      // ==================== CDP ====================
      else if (pathname === '/execute-cdp') {
        const command = url.searchParams.get('command');
        const params = JSON.parse(url.searchParams.get('params') || '{}');
        const result = await this.service.executeCDPCommand(command, params);
        this.sendResult(res, result);
      }
      
      // ==================== XPATH ====================
      else if (pathname === '/get-by-xpath') {
        const xpath = url.searchParams.get('xpath');
        const result = await this.service.getByXPath(xpath);
        this.sendResult(res, result);
      }
      
      // ==================== REACT/VUE SELECTORS ====================
      else if (pathname === '/get-by-react') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.getByReactSelector(selector);
        this.sendResult(res, result);
      } else if (pathname === '/get-by-vue') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.getByVueSelector(selector);
        this.sendResult(res, result);
      }
      
      // ==================== LOCATOR STRATEGIES ====================
      else if (pathname === '/get-first') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.getFirst(selector);
        this.sendResult(res, result);
      } else if (pathname === '/get-last') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.getLast(selector);
        this.sendResult(res, result);
      } else if (pathname === '/get-nth') {
        const selector = url.searchParams.get('selector');
        const index = parseInt(url.searchParams.get('index'));
        const result = await this.service.getNth(selector, index);
        this.sendResult(res, result);
      } else if (pathname === '/get-has') {
        const selector = url.searchParams.get('selector');
        const innerSelector = url.searchParams.get('inner');
        const result = await this.service.getHas(selector, innerSelector);
        this.sendResult(res, result);
      } else if (pathname === '/get-filter') {
        const selector = url.searchParams.get('selector');
        const filterFn = new Function('return ' + url.searchParams.get('filter'))();
        const result = await this.service.getFilter(selector, filterFn);
        this.sendResult(res, result);
      }
      
      // ==================== CHAINING ====================
      else if (pathname === '/chain-locators') {
        const locators = JSON.parse(url.searchParams.get('locators'));
        const result = await this.service.chainLocators(...locators);
        this.sendResult(res, result);
      }
      
      // ==================== VISIBILITY ====================
      else if (pathname === '/get-visible') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.getVisible(selector);
        this.sendResult(res, result);
      } else if (pathname === '/get-hidden') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.getHidden(selector);
        this.sendResult(res, result);
      }
      
      // ==================== TOUCH ACTIONS ====================
      else if (pathname === '/tap') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.tap(selector);
        this.sendResult(res, result);
      } else if (pathname === '/long-press') {
        const selector = url.searchParams.get('selector');
        const duration = parseInt(url.searchParams.get('duration') || '1000');
        const result = await this.service.longPress(selector, duration);
        this.sendResult(res, result);
      } else if (pathname === '/swipe') {
        const startX = parseInt(url.searchParams.get('startX'));
        const startY = parseInt(url.searchParams.get('startY'));
        const endX = parseInt(url.searchParams.get('endX'));
        const endY = parseInt(url.searchParams.get('endY'));
        const result = await this.service.swipe(startX, startY, endX, endY);
        this.sendResult(res, result);
      } else if (pathname === '/pinch') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.pinch(selector);
        this.sendResult(res, result);
      } else if (pathname === '/zoom') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.zoom(selector);
        this.sendResult(res, result);
      }
      
      // ==================== MULTI-TOUCH ====================
      else if (pathname === '/multi-touch') {
        const actions = JSON.parse(url.searchParams.get('actions'));
        const result = await this.service.multiTouch(actions);
        this.sendResult(res, result);
      }
      
      // ==================== WHEEL ====================
      else if (pathname === '/wheel') {
        const deltaX = parseInt(url.searchParams.get('deltaX') || '0');
        const deltaY = parseInt(url.searchParams.get('deltaY') || '0');
        const result = await this.service.wheel(deltaX, deltaY);
        this.sendResult(res, result);
      }
      
      // ==================== MOUSE ACTIONS ====================
      else if (pathname === '/mouse-move') {
        const x = parseInt(url.searchParams.get('x'));
        const y = parseInt(url.searchParams.get('y'));
        const result = await this.service.mouseMove(x, y);
        this.sendResult(res, result);
      } else if (pathname === '/mouse-down') {
        const result = await this.service.mouseDown();
        this.sendResult(res, result);
      } else if (pathname === '/mouse-up') {
        const result = await this.service.mouseUp();
        this.sendResult(res, result);
      }
      
      // ==================== KEYBOARD ACTIONS ====================
      else if (pathname === '/key-down') {
        const key = url.searchParams.get('key');
        const result = await this.service.keyDown(key);
        this.sendResult(res, result);
      } else if (pathname === '/key-up') {
        const key = url.searchParams.get('key');
        const result = await this.service.keyUp(key);
        this.sendResult(res, result);
      } else if (pathname === '/insert-text') {
        const text = url.searchParams.get('text');
        const result = await this.service.insertText(text);
        this.sendResult(res, result);
      }
      
      // ==================== CLIPBOARD ====================
      else if (pathname === '/read-clipboard') {
        const result = await this.service.readClipboard();
        this.sendResult(res, result);
      } else if (pathname === '/write-clipboard') {
        const text = url.searchParams.get('text');
        const result = await this.service.writeClipboard(text);
        this.sendResult(res, result);
      }
      
      // ==================== FILE CHOOSER ====================
      else if (pathname === '/handle-file-chooser') {
        const selector = url.searchParams.get('selector');
        const files = JSON.parse(url.searchParams.get('files'));
        const result = await this.service.handleFileChooser(selector, files);
        this.sendResult(res, result);
      }
      
      // ==================== DOWNLOAD ====================
      else if (pathname === '/wait-for-download') {
        const result = await this.service.waitForDownload();
        this.sendResult(res, result);
      }
      
      // ==================== DIALOG ====================
      else if (pathname === '/set-dialog-handler') {
        const handler = new Function('return ' + url.searchParams.get('handler'))();
        const result = await this.service.setDialogHandler(handler);
        this.sendResult(res, result);
      } else if (pathname === '/accept-dialog') {
        const promptText = url.searchParams.get('promptText');
        const result = await this.service.acceptDialog(promptText);
        this.sendResult(res, result);
      } else if (pathname === '/dismiss-dialog') {
        const result = await this.service.dismissDialog();
        this.sendResult(res, result);
      }
      
      // ==================== POPUP ====================
      else if (pathname === '/wait-for-popup') {
        const result = await this.service.waitForPopup();
        this.sendResult(res, result);
      }
      
      // ==================== WEBSOCKET ====================
      else if (pathname === '/intercept-websocket') {
        const urlPattern = url.searchParams.get('url');
        const handler = new Function('return ' + url.searchParams.get('handler'))();
        const result = await this.service.interceptWebSocket(urlPattern, handler);
        this.sendResult(res, result);
      } else if (pathname === '/get-websockets') {
        const result = await this.service.getWebSockets();
        this.sendResult(res, result);
      }
      
      // ==================== HEADERS ====================
      else if (pathname === '/set-request-headers') {
        const headers = JSON.parse(url.searchParams.get('headers'));
        const result = await this.service.setRequestHeaders(headers);
        this.sendResult(res, result);
      } else if (pathname === '/get-response-headers') {
        const url = url.searchParams.get('url');
        const result = await this.service.getResponseHeaders(url);
        this.sendResult(res, result);
      }
      
      // ==================== BODY ====================
      else if (pathname === '/get-request-body') {
        const url = url.searchParams.get('url');
        const result = await this.service.getRequestBody(url);
        this.sendResult(res, result);
      } else if (pathname === '/get-response-body') {
        const url = url.searchParams.get('url');
        const result = await this.service.getResponseBody(url);
        this.sendResult(res, result);
      }
      
      // ==================== HAR ====================
      else if (pathname === '/export-har') {
        const filename = url.searchParams.get('filename');
        const result = await this.service.exportHAR(filename);
        this.sendResult(res, result);
      }
      
      // ==================== THROTTLING ====================
      else if (pathname === '/set-network-throttle') {
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.setNetworkThrottle(options);
        this.sendResult(res, result);
      } else if (pathname === '/set-cpu-throttle') {
        const throttleRate = parseFloat(url.searchParams.get('rate'));
        const result = await this.service.setCPUThrottle(throttleRate);
        this.sendResult(res, result);
      } else if (pathname === '/set-offline') {
        const offline = url.searchParams.get('offline') === 'true';
        const result = await this.service.setOffline(offline);
        this.sendResult(res, result);
      }
      
      // ==================== STORAGE ====================
      else if (pathname === '/get-indexeddb') {
        const result = await this.service.getIndexedDB();
        this.sendResult(res, result);
      } else if (pathname === '/get-cache-storage') {
        const result = await this.service.getCacheStorage();
        this.sendResult(res, result);
      } else if (pathname === '/get-session-storage') {
        const result = await this.service.getSessionStorage();
        this.sendResult(res, result);
      } else if (pathname === '/set-session-storage') {
        const items = JSON.parse(url.searchParams.get('items'));
        const result = await this.service.setSessionStorage(items);
        this.sendResult(res, result);
      }
      
      // ==================== WORKERS ====================
      else if (pathname === '/get-service-workers') {
        const result = await this.service.getServiceWorkers();
        this.sendResult(res, result);
      } else if (pathname === '/get-web-workers') {
        const result = await this.service.getWebWorkers();
        this.sendResult(res, result);
      }
      
      // ==================== GEOLOCATION ====================
      else if (pathname === '/set-geolocation') {
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.setGeolocation(options);
        this.sendResult(res, result);
      } else if (pathname === '/get-geolocation') {
        const result = await this.service.getGeolocation();
        this.sendResult(res, result);
      }
      
      // ==================== PERMISSIONS ====================
      else if (pathname === '/grant-permissions') {
        const permissions = JSON.parse(url.searchParams.get('permissions'));
        const result = await this.service.grantPermissions(permissions);
        this.sendResult(res, result);
      } else if (pathname === '/clear-permissions') {
        const result = await this.service.clearPermissions();
        this.sendResult(res, result);
      }
      
      // ==================== DEVICE ====================
      else if (pathname === '/set-device-orientation') {
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.setDeviceOrientation(options);
        this.sendResult(res, result);
      } else if (pathname === '/set-color-scheme') {
        const scheme = url.searchParams.get('scheme');
        const result = await this.service.setColorScheme(scheme);
        this.sendResult(res, result);
      } else if (pathname === '/set-reduced-motion') {
        const reduced = url.searchParams.get('reduced') === 'true';
        const result = await this.service.setReducedMotion(reduced);
        this.sendResult(res, result);
      } else if (pathname === '/set-forced-colors') {
        const forced = url.searchParams.get('forced');
        const result = await this.service.setForcedColors(forced);
        this.sendResult(res, result);
      } else if (pathname === '/set-high-contrast') {
        const highContrast = url.searchParams.get('highContrast') === 'true';
        const result = await this.service.setHighContrast(highContrast);
        this.sendResult(res, result);
      }
      
      // ==================== CONSOLE ====================
      else if (pathname === '/get-console-messages') {
        const result = await this.service.getConsoleMessages();
        this.sendResult(res, result);
      } else if (pathname === '/clear-console-messages') {
        const result = await this.service.clearConsoleMessages();
        this.sendResult(res, result);
      }
      
      // ==================== ACCESSIBILITY ====================
      else if (pathname === '/get-accessibility-tree') {
        const result = await this.service.getAccessibilityTree();
        this.sendResult(res, result);
      }
      
      // ==================== ELEMENT STATE ====================
      else if (pathname === '/get-element-state') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.getElementState(selector);
        this.sendResult(res, result);
      }
      
      // ==================== BOUNDING BOX ====================
      else if (pathname === '/get-bounding-box') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.getBoundingBox(selector);
        this.sendResult(res, result);
      }
      
      // ==================== CSS ====================
      else if (pathname === '/get-computed-style') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.getComputedStyle(selector);
        this.sendResult(res, result);
      }
      
      // ==================== SCROLL ====================
      else if (pathname === '/get-scroll-position') {
        const result = await this.service.getScrollPosition();
        this.sendResult(res, result);
      } else if (pathname === '/set-scroll-position') {
        const x = parseInt(url.searchParams.get('x') || '0');
        const y = parseInt(url.searchParams.get('y') || '0');
        const result = await this.service.setScrollPosition(x, y);
        this.sendResult(res, result);
      }
      
      // ==================== ELEMENT CONTENT ====================
      else if (pathname === '/get-element-content') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.getElementContent(selector);
        this.sendResult(res, result);
      }
      
      // ==================== ELEMENT COUNT ====================
      else if (pathname === '/get-element-count') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.getElementCount(selector);
        this.sendResult(res, result);
      }
      
      // ==================== FOCUS/BLUR ====================
      else if (pathname === '/focus-element') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.focusElement(selector);
        this.sendResult(res, result);
      } else if (pathname === '/blur-element') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.blurElement(selector);
        this.sendResult(res, result);
      }
      
      // ==================== PDF ====================
      else if (pathname === '/generate-pdf') {
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.generatePDF(options);
        this.sendResult(res, result);
      }
      
      // ==================== ADVANCED SCREENSHOT ====================
      else if (pathname === '/take-advanced-screenshot') {
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.takeAdvancedScreenshot(options);
        this.sendResult(res, result);
      }
      
      // ==================== SCREENSHOT MASKING ====================
      else if (pathname === '/mask-screenshot') {
        const selector = url.searchParams.get('selector');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.maskScreenshot(selector, options);
        this.sendResult(res, result);
      }
      
      // ==================== SCREENSHOT IGNORE REGIONS ====================
      else if (pathname === '/ignore-regions-screenshot') {
        const regions = JSON.parse(url.searchParams.get('regions'));
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.ignoreRegionsScreenshot(regions, options);
        this.sendResult(res, result);
      }
      
      // ==================== WEBAUTHN ====================
      else if (pathname === '/enable-webauthn') {
        const result = await this.service.enableWebAuthn();
        this.sendResult(res, result);
      }
      
      // ==================== HTTP AUTH ====================
      else if (pathname === '/set-http-auth') {
        const username = url.searchParams.get('username');
        const password = url.searchParams.get('password');
        const result = await this.service.setHTTPAuth(username, password);
        this.sendResult(res, result);
      }
      
      // ==================== CLIENT CERTIFICATES ====================
      else if (pathname === '/set-client-certificates') {
        const certificates = JSON.parse(url.searchParams.get('certificates'));
        const result = await this.service.setClientCertificates(certificates);
        this.sendResult(res, result);
      }
      
      // ==================== PROXY AUTH ====================
      else if (pathname === '/set-proxy-auth') {
        const proxy = url.searchParams.get('proxy');
        const username = url.searchParams.get('username');
        const password = url.searchParams.get('password');
        const result = await this.service.setProxyAuth(proxy, username, password);
        this.sendResult(res, result);
      }
      
      // ==================== COOKIE ADVANCED ====================
      else if (pathname === '/set-cookie-priority') {
        const cookie = JSON.parse(url.searchParams.get('cookie'));
        const priority = url.searchParams.get('priority');
        const result = await this.service.setCookiePriority(cookie, priority);
        this.sendResult(res, result);
      } else if (pathname === '/set-cookie-same-party') {
        const cookie = JSON.parse(url.searchParams.get('cookie'));
        const sameParty = url.searchParams.get('sameParty') === 'true';
        const result = await this.service.setCookieSameParty(cookie, sameParty);
        this.sendResult(res, result);
      } else if (pathname === '/set-cookie-partition-key') {
        const cookie = JSON.parse(url.searchParams.get('cookie'));
        const partitionKey = url.searchParams.get('partitionKey');
        const result = await this.service.setCookiePartitionKey(cookie, partitionKey);
        this.sendResult(res, result);
      }
      
      // ==================== USER AGENT ====================
      else if (pathname === '/set-user-agent') {
        const userAgent = url.searchParams.get('userAgent');
        const result = await this.service.setUserAgent(userAgent);
        this.sendResult(res, result);
      }
      
      // ==================== VIEWPORT ====================
      else if (pathname === '/set-viewport-size') {
        const width = parseInt(url.searchParams.get('width'));
        const height = parseInt(url.searchParams.get('height'));
        const result = await this.service.setViewportSize(width, height);
        this.sendResult(res, result);
      }
      
      // ==================== MEDIA TYPE ====================
      else if (pathname === '/set-media-type') {
        const media = url.searchParams.get('media');
        const result = await this.service.setMediaType(media);
        this.sendResult(res, result);
      }
      
      // ==================== COLOR GAMUT ====================
      else if (pathname === '/set-color-gamut') {
        const gamut = url.searchParams.get('gamut');
        const result = await this.service.setColorGamut(gamut);
        this.sendResult(res, result);
      }
      
      // ==================== TEST TAGS ====================
      else if (pathname === '/run-tagged-tests') {
        const tags = JSON.parse(url.searchParams.get('tags'));
        const tests = JSON.parse(url.searchParams.get('tests'));
        const result = await this.service.runTaggedTests(tags, tests);
        this.sendResult(res, result);
      }
      
      // ==================== TEST PROJECTS ====================
      else if (pathname === '/run-project') {
        const projectConfig = JSON.parse(url.searchParams.get('config'));
        const result = await this.service.runProject(projectConfig);
        this.sendResult(res, result);
      }
      
      // ==================== TEST CONFIG ====================
      else if (pathname === '/set-test-config') {
        const config = JSON.parse(url.searchParams.get('config'));
        const result = await this.service.setTestConfig(config);
        this.sendResult(res, result);
      }
      
      // ==================== GLOBAL SETUP/TEARDOWN ====================
      else if (pathname === '/global-setup') {
        const fn = new Function('return ' + url.searchParams.get('fn'))();
        const result = await this.service.globalSetup(fn);
        this.sendResult(res, result);
      } else if (pathname === '/global-teardown') {
        const fn = new Function('return ' + url.searchParams.get('fn'))();
        const result = await this.service.globalTeardown(fn);
        this.sendResult(res, result);
      }
      
      // ==================== DEPENDENT TESTS ====================
      else if (pathname === '/run-dependent-tests') {
        const tests = JSON.parse(url.searchParams.get('tests'));
        const result = await this.service.runDependentTests(tests);
        this.sendResult(res, result);
      }
      
      // ==================== TEST FILTERING ====================
      else if (pathname === '/filter-tests') {
        const tests = JSON.parse(url.searchParams.get('tests'));
        const filter = JSON.parse(url.searchParams.get('filter'));
        const result = await this.service.filterTests(tests, filter);
        this.sendResult(res, result);
      }
      
      // ==================== CSP ====================
      else if (pathname === '/set-csp') {
        const csp = url.searchParams.get('csp');
        const result = await this.service.setCSP(csp);
        this.sendResult(res, result);
      }
      
      // ==================== CORS ====================
      else if (pathname === '/set-cors') {
        const enabled = url.searchParams.get('enabled') === 'true';
        const result = await this.service.setCORS(enabled);
        this.sendResult(res, result);
      }
      
      // ==================== NEW 100% FEATURES ====================
      
      // Direct element clicking from semantic selectors
      else if (pathname === '/click-by-role') {
        const role = url.searchParams.get('role');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.clickByRole(role, options);
        this.sendResult(res, result);
      } else if (pathname === '/click-by-text') {
        const text = url.searchParams.get('text');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.clickByText(text, options);
        this.sendResult(res, result);
      }
      
      // Element inspection from locators
      else if (pathname === '/get-locator-text') {
        const role = url.searchParams.get('role');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.getLocatorText(role, options);
        this.sendResult(res, result);
      } else if (pathname === '/get-locator-attribute') {
        const role = url.searchParams.get('role');
        const attribute = url.searchParams.get('attribute');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.getLocatorAttribute(role, attribute, options);
        this.sendResult(res, result);
      } else if (pathname === '/get-locator-state') {
        const role = url.searchParams.get('role');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.getLocatorState(role, options);
        this.sendResult(res, result);
      }
      
      // Visual element detection
      else if (pathname === '/find-by-color') {
        const selector = url.searchParams.get('selector');
        const color = url.searchParams.get('color');
        const result = await this.service.findElementByColor(selector, color);
        this.sendResult(res, result);
      } else if (pathname === '/find-by-position') {
        const x = parseInt(url.searchParams.get('x'));
        const y = parseInt(url.searchParams.get('y'));
        const result = await this.service.findElementByPosition(x, y);
        this.sendResult(res, result);
      } else if (pathname === '/find-by-size') {
        const minWidth = parseInt(url.searchParams.get('minWidth'));
        const minHeight = parseInt(url.searchParams.get('minHeight'));
        const result = await this.service.findElementsBySize(minWidth, minHeight);
        this.sendResult(res, result);
      }
      
      // AI-powered element finding
      else if (pathname === '/find-by-description') {
        const description = url.searchParams.get('description');
        const result = await this.service.findElementByDescription(description);
        this.sendResult(res, result);
      }
      
      // Cross-origin frame communication
      else if (pathname === '/post-message-to-frame') {
        const frameSelector = url.searchParams.get('frameSelector');
        const message = JSON.parse(url.searchParams.get('message'));
        const result = await this.service.postMessageToFrame(frameSelector, message);
        this.sendResult(res, result);
      } else if (pathname === '/listen-for-frame-messages') {
        const result = await this.service.listenForFrameMessages();
        this.sendResult(res, result);
      } else if (pathname === '/get-frame-messages') {
        const result = await this.service.getFrameMessages();
        this.sendResult(res, result);
      }
      
      // Browser extension API
      else if (pathname === '/inject-extension-script') {
        const script = url.searchParams.get('script');
        const result = await this.service.injectExtensionScript(script);
        this.sendResult(res, result);
      } else if (pathname === '/execute-in-extension-context') {
        const code = url.searchParams.get('code');
        const result = await this.service.executeInExtensionContext(code);
        this.sendResult(res, result);
      }
      
      // Service worker testing
      else if (pathname === '/register-service-worker') {
        const scriptURL = url.searchParams.get('scriptURL');
        const result = await this.service.registerServiceWorker(scriptURL);
        this.sendResult(res, result);
      } else if (pathname === '/get-service-worker-registration') {
        const result = await this.service.getServiceWorkerRegistration();
        this.sendResult(res, result);
      } else if (pathname === '/trigger-push-notification') {
        const data = JSON.parse(url.searchParams.get('data'));
        const result = await this.service.triggerPushNotification(data);
        this.sendResult(res, result);
      }
      
      // WebRTC testing
      else if (pathname === '/get-user-media') {
        const constraints = JSON.parse(url.searchParams.get('constraints'));
        const result = await this.service.getUserMedia(constraints);
        this.sendResult(res, result);
      } else if (pathname === '/get-media-stream-stats') {
        const result = await this.service.getMediaStreamStats();
        this.sendResult(res, result);
      }
      
      // Canvas/WebGL testing
      else if (pathname === '/get-canvas-data') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.getCanvasData(selector);
        this.sendResult(res, result);
      } else if (pathname === '/get-webgl-info') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.getWebGLInfo(selector);
        this.sendResult(res, result);
      }
      
      // WebSocket frame inspection
      else if (pathname === '/capture-websocket-frames') {
        const urlPattern = url.searchParams.get('urlPattern');
        const result = await this.service.captureWebSocketFrames(urlPattern);
        this.sendResult(res, result);
      } else if (pathname === '/get-websocket-frames') {
        const result = await this.service.getWebSocketFrames();
        this.sendResult(res, result);
      }
      
      // Storage quota testing
      else if (pathname === '/get-storage-quota') {
        const result = await this.service.getStorageQuota();
        this.sendResult(res, result);
      } else if (pathname === '/request-persistent-storage') {
        const result = await this.service.requestPersistentStorage();
        this.sendResult(res, result);
      }
      
      // Browser cache testing
      else if (pathname === '/clear-browser-cache') {
        const result = await this.service.clearBrowserCache();
        this.sendResult(res, result);
      } else if (pathname === '/get-cache-entries') {
        const result = await this.service.getCacheEntries();
        this.sendResult(res, result);
      }
      
      // Browser history testing
      else if (pathname === '/get-history-length') {
        const result = await this.service.getHistoryLength();
        this.sendResult(res, result);
      } else if (pathname === '/go-back') {
        const result = await this.service.goBack();
        this.sendResult(res, result);
      } else if (pathname === '/go-forward') {
        const result = await this.service.goForward();
        this.sendResult(res, result);
      } else if (pathname === '/push-state') {
        const state = JSON.parse(url.searchParams.get('state'));
        const url = url.searchParams.get('url');
        const result = await this.service.pushState(state, url);
        this.sendResult(res, result);
      }
      
      // Browser print testing
      else if (pathname === '/trigger-print') {
        const result = await this.service.triggerPrint();
        this.sendResult(res, result);
      } else if (pathname === '/cancel-print-dialog') {
        const result = await this.service.cancelPrintDialog();
        this.sendResult(res, result);
      }
      
      // Download content verification
      else if (pathname === '/verify-download-content') {
        const filePath = url.searchParams.get('filePath');
        const expectedContent = url.searchParams.get('expectedContent');
        const result = await this.service.verifyDownloadContent(filePath, expectedContent);
        this.sendResult(res, result);
      } else if (pathname === '/get-download-progress') {
        const result = await this.service.getDownloadProgress();
        this.sendResult(res, result);
      }
      
      // Complex drag-and-drop
      else if (pathname === '/drag-over-multiple') {
        const source = url.searchParams.get('source');
        const targets = JSON.parse(url.searchParams.get('targets'));
        const result = await this.service.dragOverMultiple(source, targets);
        this.sendResult(res, result);
      } else if (pathname === '/validate-drop') {
        const target = url.searchParams.get('target');
        const expectedContent = url.searchParams.get('expectedContent');
        const result = await this.service.validateDrop(target, expectedContent);
        this.sendResult(res, result);
      }
      
      // Resize testing
      else if (pathname === '/test-responsive-breakpoints') {
        const breakpoints = JSON.parse(url.searchParams.get('breakpoints'));
        const result = await this.service.testResponsiveBreakpoints(breakpoints);
        this.sendResult(res, result);
      } else if (pathname === '/listen-for-resize-events') {
        const result = await this.service.listenForResizeEvents();
        this.sendResult(res, result);
      } else if (pathname === '/get-resize-events') {
        const result = await this.service.getResizeEvents();
        this.sendResult(res, result);
      }
      
      // Focus testing
      else if (pathname === '/test-focus-trap') {
        const containerSelector = url.searchParams.get('containerSelector');
        const result = await this.service.testFocusTrap(containerSelector);
        this.sendResult(res, result);
      } else if (pathname === '/get-focus-order') {
        const result = await this.service.getFocusOrder();
        this.sendResult(res, result);
      } else if (pathname === '/test-focus-visible') {
        const result = await this.service.testFocusVisible();
        this.sendResult(res, result);
      }
      
      // Scroll testing
      else if (pathname === '/get-scroll-position-detailed') {
        const result = await this.service.getScrollPosition();
        this.sendResult(res, result);
      } else if (pathname === '/listen-for-scroll-events') {
        const result = await this.service.listenForScrollEvents();
        this.sendResult(res, result);
      } else if (pathname === '/get-scroll-events') {
        const result = await this.service.getScrollEvents();
        this.sendResult(res, result);
      } else if (pathname === '/test-infinite-scroll') {
        const result = await this.service.testInfiniteScroll();
        this.sendResult(res, result);
      }
      
      // Animation testing
      else if (pathname === '/get-animation-state') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.getAnimationState(selector);
        this.sendResult(res, result);
      } else if (pathname === '/wait-for-animation') {
        const selector = url.searchParams.get('selector');
        const timeout = parseInt(url.searchParams.get('timeout') || '5000');
        const result = await this.service.waitForAnimation(selector, timeout);
        this.sendResult(res, result);
      } else if (pathname === '/listen-for-animation-events') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.listenForAnimationEvents(selector);
        this.sendResult(res, result);
      } else if (pathname === '/get-animation-events') {
        const result = await this.service.getAnimationEvents();
        this.sendResult(res, result);
      }
      
      // ==================== EXISTING ENHANCED FEATURES ====================
      else if (pathname === '/wait-for-selector') {
        const selector = url.searchParams.get('selector');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.waitForSelector(selector, options);
        this.sendResult(res, result);
      } else if (pathname === '/wait-for-function') {
        const code = url.searchParams.get('code');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.waitForFunction(decodeURIComponent(code), options);
        this.sendResult(res, result);
      } else if (pathname === '/wait-for-navigation') {
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.waitForNavigation(options);
        this.sendResult(res, result);
      } else if (pathname === '/wait-for-response') {
        const urlPattern = url.searchParams.get('url');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.waitForResponse(urlPattern, options);
        this.sendResult(res, result);
      } else if (pathname === '/wait-for-network-idle') {
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.waitForNetworkIdle(options);
        this.sendResult(res, result);
      } else if (pathname === '/get-by-role') {
        const role = url.searchParams.get('role');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.getByRole(role, options);
        this.sendResult(res, result);
      } else if (pathname === '/get-by-text') {
        const text = url.searchParams.get('text');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.getByText(text, options);
        this.sendResult(res, result);
      } else if (pathname === '/get-by-label') {
        const text = url.searchParams.get('text');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.getByLabel(text, options);
        this.sendResult(res, result);
      } else if (pathname === '/get-by-placeholder') {
        const text = url.searchParams.get('text');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.getByPlaceholder(text, options);
        this.sendResult(res, result);
      } else if (pathname === '/get-by-test-id') {
        const testId = url.searchParams.get('testId');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.getByTestId(testId, options);
        this.sendResult(res, result);
      } else if (pathname === '/get-by-alt-text') {
        const text = url.searchParams.get('text');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.getByAltText(text, options);
        this.sendResult(res, result);
      } else if (pathname === '/with-retry') {
        const code = url.searchParams.get('code');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.withRetry(async () => {
          return await this.service.page.evaluate(decodeURIComponent(code));
        }, options);
        this.sendResult(res, result);
      } else if (pathname === '/intercept-request') {
        const urlPattern = url.searchParams.get('url');
        const result = await this.service.interceptRequest(urlPattern);
        this.sendResult(res, result);
      } else if (pathname === '/mock-response') {
        const urlPattern = url.searchParams.get('url');
        const responseBody = JSON.parse(decodeURIComponent(url.searchParams.get('body')));
        const result = await this.service.mockResponse(urlPattern, responseBody);
        this.sendResult(res, result);
      } else if (pathname === '/query-shadow-root') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.queryShadowRoot(selector);
        this.sendResult(res, result);
      } else if (pathname === '/click-shadow-element') {
        const hostSelector = url.searchParams.get('host');
        const shadowSelector = url.searchParams.get('shadow');
        const result = await this.service.clickShadowElement(hostSelector, shadowSelector);
        this.sendResult(res, result);
      } else if (pathname === '/get-frames') {
        const result = await this.service.getFrames();
        this.sendResult(res, result);
      } else if (pathname === '/frame-locator') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.frameLocator(selector);
        this.sendResult(res, result);
      } else if (pathname === '/type') {
        const selector = url.searchParams.get('selector');
        const text = url.searchParams.get('text');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.type(selector, text, options);
        this.sendResult(res, result);
      } else if (pathname === '/select-option') {
        const selector = url.searchParams.get('selector');
        const value = url.searchParams.get('value');
        const result = await this.service.selectOption(selector, value);
        this.sendResult(res, result);
      } else if (pathname === '/check') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.check(selector);
        this.sendResult(res, result);
      } else if (pathname === '/uncheck') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.uncheck(selector);
        this.sendResult(res, result);
      } else if (pathname === '/upload-file') {
        const selector = url.searchParams.get('selector');
        const filePath = url.searchParams.get('path');
        const result = await this.service.uploadFile(selector, filePath);
        this.sendResult(res, result);
      } else if (pathname === '/drag-and-drop') {
        const source = url.searchParams.get('source');
        const target = url.searchParams.get('target');
        const result = await this.service.dragAndDrop(source, target);
        this.sendResult(res, result);
      } else if (pathname === '/double-click') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.doubleClick(selector);
        this.sendResult(res, result);
      } else if (pathname === '/right-click') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.rightClick(selector);
        this.sendResult(res, result);
      } else if (pathname === '/scroll') {
        const selector = url.searchParams.get('selector');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.scroll(selector, options);
        this.sendResult(res, result);
      } else if (pathname === '/press') {
        const key = url.searchParams.get('key');
        const result = await this.service.press(key);
        this.sendResult(res, result);
      } else if (pathname === '/take-baseline') {
        const name = url.searchParams.get('name');
        const result = await this.service.takeBaselineScreenshot(name);
        this.sendResult(res, result);
      } else if (pathname === '/compare-screenshot') {
        const name = url.searchParams.get('name');
        const options = JSON.parse(url.searchParams.get('options') || '{}');
        const result = await this.service.compareScreenshot(name, options);
        this.sendResult(res, result);
      } else if (pathname === '/performance-metrics') {
        const result = await this.service.getPerformanceMetrics();
        this.sendResult(res, result);
      } else if (pathname === '/resource-timing') {
        const result = await this.service.getResourceTiming();
        this.sendResult(res, result);
      } else if (pathname === '/core-web-vitals') {
        const result = await this.service.getCoreWebVitals();
        this.sendResult(res, result);
      } else if (pathname === '/emulate-device') {
        const device = url.searchParams.get('device');
        const result = await this.service.emulateDevice(device);
        this.sendResult(res, result);
      } else if (pathname === '/set-cookies') {
        const cookies = JSON.parse(url.searchParams.get('cookies'));
        const result = await this.service.setCookies(cookies);
        this.sendResult(res, result);
      } else if (pathname === '/get-cookies') {
        const result = await this.service.getCookies();
        this.sendResult(res, result);
      } else if (pathname === '/clear-cookies') {
        const result = await this.service.clearCookies();
        this.sendResult(res, result);
      } else if (pathname === '/set-local-storage') {
        const items = JSON.parse(url.searchParams.get('items'));
        const result = await this.service.setLocalStorage(items);
        this.sendResult(res, result);
      } else if (pathname === '/get-local-storage') {
        const result = await this.service.getLocalStorage();
        this.sendResult(res, result);
      } else if (pathname === '/set-debug-mode') {
        const enabled = url.searchParams.get('enabled') === 'true';
        const result = this.service.setDebugMode(enabled);
        this.sendResult(res, result);
      } else if (pathname === '/highlight-element') {
        const selector = url.searchParams.get('selector');
        const result = await this.service.highlightElement(selector);
        this.sendResult(res, result);
      }
      
      // ==================== BASIC ENDPOINTS ====================
      else if (pathname === '/navigate') {
        const targetUrl = url.searchParams.get('url');
        if (!targetUrl) {
          this.sendError(res, 400, 'URL parameter required');
          return;
        }
        await this.service.navigateTo(targetUrl);
        this.sendSuccess(res);
      } else if (pathname === '/click') {
        const selector = url.searchParams.get('selector');
        if (!selector) {
          this.sendError(res, 400, 'Selector parameter required');
          return;
        }
        const result = await this.service.clickElement(selector);
        this.sendResult(res, result);
      } else if (pathname === '/fill') {
        const selector = url.searchParams.get('selector');
        const value = url.searchParams.get('value');
        if (!selector || !value) {
          this.sendError(res, 400, 'Selector and value parameters required');
          return;
        }
        const result = await this.service.fillInput(selector, value);
        this.sendResult(res, result);
      } else if (pathname === '/list-inputs') {
        const result = await this.service.listInputs();
        this.sendResult(res, result);
      } else if (pathname === '/list-buttons') {
        const result = await this.service.listButtons();
        this.sendResult(res, result);
      } else if (pathname === '/info') {
        const info = await this.service.getPageInfo();
        this.sendSuccess(res, info);
      } else if (pathname === '/screenshot') {
        const result = await this.service.takeScreenshot();
        this.sendResult(res, result);
      } else if (pathname === '/execute-js') {
        const code = url.searchParams.get('code');
        if (!code) {
          this.sendError(res, 400, 'Code parameter required');
          return;
        }
        const result = await this.service.executeJavaScript(decodeURIComponent(code));
        this.sendResult(res, result);
      } else if (pathname === '/hover') {
        const selector = url.searchParams.get('selector');
        if (!selector) {
          this.sendError(res, 400, 'Selector parameter required');
          return;
        }
        const result = await this.service.hoverElement(selector);
        this.sendResult(res, result);
      } else if (pathname === '/dark-mode') {
        await this.service.switchToDarkMode();
        this.sendSuccess(res);
      } else if (pathname === '/close') {
        await this.service.close();
        this.sendSuccess(res);
        process.exit(0);
      } else {
        this.sendError(res, 404, 'Not found');
      }
    } catch (error) {
      await this.service.takeErrorScreenshot(error);
      this.sendError(res, 500, error.message);
    }
  }
  
  sendSuccess(res, data = { success: true }) {
    res.writeHead(200);
    res.end(JSON.stringify(data));
  }
  
  sendResult(res, result) {
    res.writeHead(result.success ? 200 : 400);
    res.end(JSON.stringify(result));
  }
  
  sendError(res, statusCode, message) {
    res.writeHead(statusCode);
    res.end(JSON.stringify({ error: message }));
  }
}

module.exports = UltimateBrowserAPIRoutes;
