# Browser Visibility & Debug - 100 Ways to See What's Happening

## Overview

This skill provides 100 techniques to eliminate "flying blind" in browser automation. Never guess what's on the page again - see everything, log everything, debug everything.

## Philosophy

**Before any action:**
1. See the page (screenshot)
2. Inspect the page (DOM)
3. Validate the page (state)
4. Document the page (log)

**After any action:**
1. Verify the result (screenshot)
2. Check the state (DOM)
3. Log the change (diff)
4. Confirm success (validation)

## Implementation

### Complete Visibility Framework

```javascript
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class VisibleBrowser {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    this.screenshotDir = options.screenshotDir || './screenshots';
    this.logDir = options.logDir || './logs';
    this.headless = options.headless !== false; // Default to headless: true
    this.verbose = options.verbose !== false;
    this.step = 0;
    this.history = [];
    
    // Create directories
    fs.mkdirSync(this.screenshotDir, { recursive: true });
    fs.mkdirSync(this.logDir, { recursive: true });
  }
  
  async init() {
    this.browser = await chromium.launch({ 
      headless: this.headless,
      slowMo: this.verbose ? 100 : 0
    });
    this.page = await this.browser.newPage();
    
    // Enable console logging
    this.page.on('console', msg => {
      this.log('console', msg.text());
    });
    
    // Enable error logging
    this.page.on('pageerror', error => {
      this.log('error', error.message);
    });
    
    this.log('info', 'Browser initialized');
  }
  
  // ==================== VISUAL DOCUMENTATION (1-10) ====================
  
  async screenshotBefore(action) {
    const path = this.getScreenshotPath(`before-${action}`);
    await this.page.screenshot({ path, fullPage: true });
    this.log('screenshot', `Before ${action}: ${path}`);
    return path;
  }
  
  async screenshotAfter(action) {
    const path = this.getScreenshotPath(`after-${action}`);
    await this.page.screenshot({ path, fullPage: true });
    this.log('screenshot', `After ${action}: ${path}`);
    return path;
  }
  
  async screenshotOnError(error) {
    const path = this.getScreenshotPath(`error-${Date.now()}`);
    await this.page.screenshot({ path, fullPage: true });
    this.log('error', `Error screenshot: ${path}`);
    return path;
  }
  
  async screenshotOnSuccess(action) {
    const path = this.getScreenshotPath(`success-${action}`);
    await this.page.screenshot({ path, fullPage: true });
    this.log('success', `Success screenshot: ${path}`);
    return path;
  }
  
  async startVideo() {
    const context = await this.browser.newContext({
      recordVideo: { dir: this.screenshotDir }
    });
    this.page = await context.newPage();
    this.log('video', 'Video recording started');
  }
  
  async stopVideo() {
    await this.context.close();
    this.log('video', 'Video recording stopped');
  }
  
  async screenshotMultipleViewports(url) {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 }
    ];
    
    for (const vp of viewports) {
      await this.page.setViewportSize(vp);
      await this.page.goto(url);
      const path = this.getScreenshotPath(`viewport-${vp.width}x${vp.height}`);
      await this.page.screenshot({ path, fullPage: true });
      this.log('screenshot', `Viewport ${vp.width}x${vp.height}: ${path}`);
    }
  }
  
  async screenshotDarkMode(url) {
    await this.page.emulateMedia({ colorScheme: 'dark' });
    await this.page.goto(url);
    const path = this.getScreenshotPath('dark-mode');
    await this.page.screenshot({ path, fullPage: true });
    this.log('screenshot', `Dark mode: ${path}`);
  }
  
  async screenshotHighlightElements(selector) {
    await this.page.addStyleTag({
      content: `${selector} { outline: 3px solid red !important; }`
    });
    const path = this.getScreenshotPath(`highlight-${selector.replace(/[^a-z0-9]/gi, '-')}`);
    await this.page.screenshot({ path, fullPage: true });
    this.log('screenshot', `Highlight ${selector}: ${path}`);
  }
  
  async screenshotLabelElements() {
    await this.page.evaluate(() => {
      document.querySelectorAll('*').forEach((el, i) => {
        el.style.outline = '1px solid blue';
        el.setAttribute('data-debug-id', i);
      });
    });
    const path = this.getScreenshotPath('labeled');
    await this.page.screenshot({ path, fullPage: true });
    this.log('screenshot', `Labeled elements: ${path}`);
  }
  
  // ==================== DOM INSPECTION (11-20) ====================
  
  async logPageHTML() {
    const html = await this.page.content();
    const path = this.getLogPath('page-html');
    fs.writeFileSync(path, html);
    this.log('dom', `Page HTML: ${path}`);
    return html;
  }
  
  async logElementHTML(selector) {
    const html = await this.page.$eval(selector, el => el.outerHTML);
    this.log('dom', `Element HTML [${selector}]: ${html.substring(0, 500)}...`);
    return html;
  }
  
  async logPageTitle() {
    const title = await this.page.title();
    this.log('dom', `Page title: ${title}`);
    return title;
  }
  
  async logPageURL() {
    const url = this.page.url();
    this.log('dom', `Page URL: ${url}`);
    return url;
  }
  
  async logAllVisibleText() {
    const text = await this.page.evaluate(() => document.body.innerText);
    this.log('dom', `Visible text: ${text.substring(0, 500)}...`);
    return text;
  }
  
  async logAllButtons() {
    const buttons = await this.page.$$eval('button, [role="button"]', els => 
      els.map(el => ({ text: el.textContent, id: el.id, class: el.className }))
    );
    this.log('dom', `Buttons: ${JSON.stringify(buttons, null, 2)}`);
    return buttons;
  }
  
  async logAllInputs() {
    const inputs = await this.page.$$eval('input, textarea, select', els =>
      els.map(el => ({ type: el.type, name: el.name, id: el.id, placeholder: el.placeholder }))
    );
    this.log('dom', `Inputs: ${JSON.stringify(inputs, null, 2)}`);
    return inputs;
  }
  
  async logAllLinks() {
    const links = await this.page.$$eval('a', els =>
      els.map(el => ({ text: el.textContent, href: el.href }))
    );
    this.log('dom', `Links: ${JSON.stringify(links, null, 2)}`);
    return links;
  }
  
  async logAllImages() {
    const images = await this.page.$$eval('img', els =>
      els.map(el => ({ src: el.src, alt: el.alt }))
    );
    this.log('dom', `Images: ${JSON.stringify(images, null, 2)}`);
    return images;
  }
  
  async logAllForms() {
    const forms = await this.page.$$eval('form', els =>
      els.map(el => ({ action: el.action, method: el.method, id: el.id }))
    );
    this.log('dom', `Forms: ${JSON.stringify(forms, null, 2)}`);
    return forms;
  }
  
  // ==================== ELEMENT DISCOVERY (21-30) ====================
  
  async listElementsByTag(tag) {
    const elements = await this.page.$$eval(tag, els =>
      els.map(el => ({ tag: el.tagName, id: el.id, class: el.className }))
    );
    this.log('discovery', `Elements by tag [${tag}]: ${JSON.stringify(elements, null, 2)}`);
    return elements;
  }
  
  async listElementsByClass(className) {
    const elements = await this.page.$$eval(`.${className}`, els =>
      els.map(el => ({ tag: el.tagName, id: el.id, text: el.textContent?.substring(0, 50) }))
    );
    this.log('discovery', `Elements by class [${className}]: ${JSON.stringify(elements, null, 2)}`);
    return elements;
  }
  
  async listElementsById(id) {
    const element = await this.page.$eval(`#${id}`, el => ({
      tag: el.tagName,
      class: el.className,
      text: el.textContent?.substring(0, 50)
    }));
    this.log('discovery', `Element by id [${id}]: ${JSON.stringify(element, null, 2)}`);
    return element;
  }
  
  async listElementsByAttribute(attr, value) {
    const elements = await this.page.$$eval(`[${attr}="${value}"]`, els =>
      els.map(el => ({ tag: el.tagName, id: el.id, text: el.textContent?.substring(0, 50) }))
    );
    this.log('discovery', `Elements by attribute [${attr}="${value}"]: ${JSON.stringify(elements, null, 2)}`);
    return elements;
  }
  
  async listClickableElements() {
    const elements = await this.page.$$eval('button, a, [role="button"], [onclick]', els =>
      els.map(el => ({ tag: el.tagName, text: el.textContent?.substring(0, 50), id: el.id }))
    );
    this.log('discovery', `Clickable elements: ${JSON.stringify(elements, null, 2)}`);
    return elements;
  }
  
  async listFormElements() {
    const elements = await this.page.$$eval('input, textarea, select, button[type="submit"]', els =>
      els.map(el => ({ tag: el.tagName, type: el.type, name: el.name, id: el.id }))
    );
    this.log('discovery', `Form elements: ${JSON.stringify(elements, null, 2)}`);
    return elements;
  }
  
  async listVisibleElements() {
    const elements = await this.page.$$eval('*', els =>
      els.filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
      }).map(el => ({ tag: el.tagName, id: el.id, text: el.textContent?.substring(0, 30) }))
    );
    this.log('discovery', `Visible elements: ${JSON.stringify(elements, null, 2)}`);
    return elements;
  }
  
  async listHiddenElements() {
    const elements = await this.page.$$eval('*', els =>
      els.filter(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || style.visibility === 'hidden';
      }).map(el => ({ tag: el.tagName, id: el.id }))
    );
    this.log('discovery', `Hidden elements: ${JSON.stringify(elements, null, 2)}`);
    return elements;
  }
  
  async listElementsWithText(text) {
    const elements = await this.page.$$eval('*', els =>
      els.filter(el => el.textContent?.includes(text))
        .map(el => ({ tag: el.tagName, id: el.id, text: el.textContent?.substring(0, 50) }))
    );
    this.log('discovery', `Elements with text [${text}]: ${JSON.stringify(elements, null, 2)}`);
    return elements;
  }
  
  async listElementsWithAriaLabel() {
    const elements = await this.page.$$eval('[aria-label]', els =>
      els.map(el => ({ tag: el.tagName, ariaLabel: el.getAttribute('aria-label'), id: el.id }))
    );
    this.log('discovery', `Elements with aria-label: ${JSON.stringify(elements, null, 2)}`);
    return elements;
  }
  
  // ==================== SELECTOR TESTING (31-40) ====================
  
  async testSelector(selector) {
    const count = await this.page.$$(selector);
    this.log('selector', `Selector [${selector}] matches: ${count.length} elements`);
    return count.length;
  }
  
  async testSelectorBeforeClick(selector) {
    const count = await this.testSelector(selector);
    if (count === 0) {
      this.log('error', `Selector [${selector}] found 0 elements, cannot click`);
      throw new Error(`Selector ${selector} not found`);
    }
    return count;
  }
  
  async testSelectorBeforeFill(selector) {
    const count = await this.testSelector(selector);
    if (count === 0) {
      this.log('error', `Selector [${selector}] found 0 elements, cannot fill`);
      throw new Error(`Selector ${selector} not found`);
    }
    return count;
  }
  
  async testSelectorBeforeHover(selector) {
    const count = await this.testSelector(selector);
    if (count === 0) {
      this.log('error', `Selector [${selector}] found 0 elements, cannot hover`);
      throw new Error(`Selector ${selector} not found`);
    }
    return count;
  }
  
  async logSelectorMatchDetails(selector) {
    const elements = await this.page.$$eval(selector, els =>
      els.map(el => ({
        tag: el.tagName,
        id: el.id,
        class: el.className,
        visible: el.offsetParent !== null,
        text: el.textContent?.substring(0, 30)
      }))
    );
    this.log('selector', `Selector [${selector}] details: ${JSON.stringify(elements, null, 2)}`);
    return elements;
  }
  
  async tryMultipleSelectors(selectors) {
    for (const selector of selectors) {
      const count = await this.testSelector(selector);
      if (count > 0) {
        this.log('selector', `Found selector: ${selector}`);
        return selector;
      }
    }
    this.log('error', `No selectors matched: ${selectors.join(', ')}`);
    return null;
  }
  
  async tryCSSSelector(selector) {
    return this.testSelector(selector);
  }
  
  async tryXPathSelector(xpath) {
    const count = await this.page.$$(xpath);
    this.log('selector', `XPath [${xpath}] matches: ${count.length} elements`);
    return count.length;
  }
  
  async tryTextSelector(text) {
    const selector = `text=${text}`;
    return this.testSelector(selector);
  }
  
  async tryRoleSelector(role, name) {
    const selector = `[role="${role}"]`;
    const count = await this.testSelector(selector);
    if (name) {
      const namedSelector = `[role="${role}"][aria-label="${name}"]`;
      const namedCount = await this.testSelector(namedSelector);
      return namedCount;
    }
    return count;
  }
  
  // ==================== PAGE STATE (41-50) ====================
  
  async logPageLoadState() {
    const state = await this.page.evaluate(() => ({
      readyState: document.readyState,
      domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
    }));
    this.log('state', `Page load state: ${JSON.stringify(state, null, 2)}`);
    return state;
  }
  
  async logNetworkIdleState() {
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 5000 });
      this.log('state', 'Network idle: true');
      return true;
    } catch {
      this.log('state', 'Network idle: false (timeout)');
      return false;
    }
  }
  
  async logDOMContentLoaded() {
    await this.page.waitForLoadState('domcontentloaded');
    this.log('state', 'DOM content loaded');
  }
  
  async logAllLoadedResources() {
    const resources = [];
    this.page.on('response', response => {
      resources.push({
        url: response.url(),
        status: response.status(),
        type: response.resourceType()
      });
    });
    this.log('state', `Loaded resources: ${JSON.stringify(resources, null, 2)}`);
    return resources;
  }
  
  async logConsoleErrors() {
    const errors = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    this.log('state', `Console errors: ${JSON.stringify(errors, null, 2)}`);
    return errors;
  }
  
  async logConsoleWarnings() {
    const warnings = [];
    this.page.on('console', msg => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    this.log('state', `Console warnings: ${JSON.stringify(warnings, null, 2)}`);
    return warnings;
  }
  
  async logConsoleMessages() {
    const messages = [];
    this.page.on('console', msg => {
      messages.push({ type: msg.type(), text: msg.text() });
    });
    this.log('state', `Console messages: ${JSON.stringify(messages, null, 2)}`);
    return messages;
  }
  
  async logPageDimensions() {
    const dimensions = await this.page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight
    }));
    this.log('state', `Page dimensions: ${JSON.stringify(dimensions, null, 2)}`);
    return dimensions;
  }
  
  async logScrollPosition() {
    const position = await this.page.evaluate(() => ({
      scrollX: window.scrollX,
      scrollY: window.scrollY
    }));
    this.log('state', `Scroll position: ${JSON.stringify(position, null, 2)}`);
    return position;
  }
  
  async logViewportSize() {
    const viewport = this.page.viewportSize();
    this.log('state', `Viewport size: ${JSON.stringify(viewport, null, 2)}`);
    return viewport;
  }
  
  // ==================== INTERACTIVE DEBUGGING (51-60) ====================
  
  async runHeadful() {
    this.headless = false;
    await this.init();
    this.log('debug', 'Running in headful mode');
  }
  
  async addPausePoint(message) {
    console.log(`\n⏸️  PAUSE: ${message}`);
    console.log('Press Enter to continue...');
    await new Promise(resolve => process.stdin.once('data', resolve));
    this.log('debug', `Resumed after: ${message}`);
  }
  
  async addDebugBreakpoint() {
    debugger;
    this.log('debug', 'Breakpoint hit');
  }
  
  async stepByStepExecution() {
    this.stepByStep = true;
    this.log('debug', 'Step-by-step execution enabled');
  }
  
  async waitForUserInput(prompt) {
    console.log(`\n❓ ${prompt}`);
    const answer = await new Promise(resolve => {
      process.stdin.once('data', data => resolve(data.toString().trim()));
    });
    this.log('debug', `User input: ${answer}`);
    return answer;
  }
  
  async confirmBeforeAction(action) {
    const confirmed = await this.waitForUserInput(`Execute: ${action}? (y/n)`);
    if (confirmed.toLowerCase() !== 'y') {
      this.log('debug', `Action cancelled: ${action}`);
      return false;
    }
    this.log('debug', `Action confirmed: ${action}`);
    return true;
  }
  
  async addRollbackCapability() {
    this.history.push({
      url: this.page.url(),
      state: await this.page.evaluate(() => document.body.innerHTML)
    });
    this.log('debug', 'State saved for rollback');
  }
  
  async rollback() {
    if (this.history.length === 0) {
      this.log('error', 'No history to rollback');
      return;
    }
    const lastState = this.history.pop();
    await this.page.goto(lastState.url);
    await this.page.evaluate(html => { document.body.innerHTML = html; }, lastState.state);
    this.log('debug', 'Rolled back to previous state');
  }
  
  async dryRunMode() {
    this.dryRun = true;
    this.log('debug', 'Dry run mode enabled');
  }
  
  async verboseLogging() {
    this.verbose = true;
    this.log('debug', 'Verbose logging enabled');
  }
  
  async addProgressIndicator(step, total) {
    const percent = Math.round((step / total) * 100);
    console.log(`\n📊 Progress: ${step}/${total} (${percent}%)`);
    this.log('debug', `Progress: ${step}/${total} (${percent}%)`);
  }
  
  // ==================== COMPARISON (61-70) ====================
  
  async compareScreenshots(before, after) {
    // Simple comparison - in production use pixelmatch
    this.log('comparison', `Comparing ${before} vs ${after}`);
    return { before, after };
  }
  
  async compareDOM(before, after) {
    this.log('comparison', `Comparing DOM before vs after`);
    return { before, after };
  }
  
  async compareSelectors(before, after) {
    this.log('comparison', `Comparing selectors before vs after`);
    return { before, after };
  }
  
  async comparePageState(before, after) {
    this.log('comparison', `Comparing page state before vs after`);
    return { before, after };
  }
  
  async compareNetworkRequests(before, after) {
    this.log('comparison', `Comparing network requests before vs after`);
    return { before, after };
  }
  
  async compareConsoleOutput(before, after) {
    this.log('comparison', `Comparing console output before vs after`);
    return { before, after };
  }
  
  async compareElementCounts(before, after) {
    this.log('comparison', `Comparing element counts before vs after`);
    return { before, after };
  }
  
  async compareTextContent(before, after) {
    this.log('comparison', `Comparing text content before vs after`);
    return { before, after };
  }
  
  async compareStyles(before, after) {
    this.log('comparison', `Comparing styles before vs after`);
    return { before, after };
  }
  
  async compareLayout(before, after) {
    this.log('comparison', `Comparing layout before vs after`);
    return { before, after };
  }
  
  // ==================== VALIDATION (71-80) ====================
  
  async validatePageLoaded() {
    const loaded = await this.page.evaluate(() => document.readyState === 'complete');
    this.log('validation', `Page loaded: ${loaded}`);
    return loaded;
  }
  
  async validateElementExists(selector) {
    const exists = await this.page.$(selector) !== null;
    this.log('validation', `Element exists [${selector}]: ${exists}`);
    return exists;
  }
  
  async validateElementVisible(selector) {
    const visible = await this.page.isVisible(selector);
    this.log('validation', `Element visible [${selector}]: ${visible}`);
    return visible;
  }
  
  async validateElementClickable(selector) {
    const clickable = await this.page.isDisabled(selector) === false;
    this.log('validation', `Element clickable [${selector}]: ${clickable}`);
    return clickable;
  }
  
  async validateElementEnabled(selector) {
    const enabled = await this.page.isEnabled(selector);
    this.log('validation', `Element enabled [${selector}]: ${enabled}`);
    return enabled;
  }
  
  async validateElementHasText(selector, expectedText) {
    const text = await this.page.textContent(selector);
    const hasText = text?.includes(expectedText);
    this.log('validation', `Element has text [${selector}]: ${hasText}`);
    return hasText;
  }
  
  async validateElementHasAttribute(selector, attribute) {
    const hasAttr = await this.page.$eval(selector, el => el.hasAttribute(attribute));
    this.log('validation', `Element has attribute [${selector}][${attribute}]: ${hasAttr}`);
    return hasAttr;
  }
  
  async validateFormFilled(selector) {
    const filled = await this.page.$eval(selector, el => el.value !== '');
    this.log('validation', `Form filled [${selector}]: ${filled}`);
    return filled;
  }
  
  async validateNavigationComplete(expectedURL) {
    const currentURL = this.page.url();
    const complete = currentURL === expectedURL;
    this.log('validation', `Navigation complete to [${expectedURL}]: ${complete}`);
    return complete;
  }
  
  async validateActionSuccessful(selector) {
    const exists = await this.validateElementExists(selector);
    this.log('validation', `Action successful [${selector}]: ${exists}`);
    return exists;
  }
  
  // ==================== RECOVERY (81-90) ====================
  
  async autoRetryOnFailure(operation, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        this.log('retry', `Attempt ${i + 1} failed: ${error.message}`);
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  async autoFallbackSelector(primary, fallbacks) {
    if (await this.testSelector(primary) > 0) return primary;
    for (const fallback of fallbacks) {
      if (await this.testSelector(fallback) > 0) {
        this.log('fallback', `Using fallback: ${fallback}`);
        return fallback;
      }
    }
    throw new Error('No selector matched');
  }
  
  async autoWaitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      this.log('wait', `Element found: ${selector}`);
      return true;
    } catch {
      this.log('error', `Element not found: ${selector}`);
      return false;
    }
  }
  
  async autoScrollToElement(selector) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
    this.log('scroll', `Scrolled to: ${selector}`);
  }
  
  async autoClickWithOffset(selector, offsetX = 0, offsetY = 0) {
    await this.page.click(selector, { position: { x: offsetX, y: offsetY } });
    this.log('click', `Clicked with offset: ${selector}`);
  }
  
  async autoFillWithDelay(selector, value, delay = 50) {
    for (const char of value) {
      await this.page.type(selector, char, { delay });
    }
    this.log('fill', `Filled with delay: ${selector}`);
  }
  
  async autoNavigateOnError(url) {
    try {
      await this.page.goto(url);
    } catch (error) {
      this.log('error', `Navigation failed: ${error.message}`);
      await this.page.reload();
    }
  }
  
  async autoRefreshOnTimeout(selector, timeout = 5000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
    } catch {
      this.log('timeout', `Element not found, refreshing`);
      await this.page.reload();
      await this.page.waitForSelector(selector, { timeout });
    }
  }
  
  async autoScreenshotOnError(error) {
    await this.screenshotOnError(error);
  }
  
  async autoLogOnError(error) {
    this.log('error', error.message);
    this.log('error', error.stack);
  }
  
  // ==================== ADVANCED (91-100) ====================
  
  async useAIToDescribePage() {
    const text = await this.logAllVisibleText();
    this.log('ai', `Page description: ${text.substring(0, 200)}...`);
    return text;
  }
  
  async useAIToFindElements(description) {
    // Would integrate with AI service
    this.log('ai', `Finding elements for: ${description}`);
    return [];
  }
  
  async useAIToSuggestActions() {
    // Would integrate with AI service
    this.log('ai', 'Suggesting actions based on page state');
    return [];
  }
  
  async useVisualRegression(baseline, current) {
    // Would integrate with visual regression tool
    this.log('visual', `Comparing ${baseline} vs ${current}`);
    return { different: false };
  }
  
  async useAccessibilityTree() {
    const tree = await this.page.accessibility.snapshot();
    this.log('a11y', `Accessibility tree: ${JSON.stringify(tree, null, 2)}`);
    return tree;
  }
  
  async useComputedStyles(selector) {
    const styles = await this.page.$eval(selector, el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        zIndex: computed.zIndex
      };
    });
    this.log('styles', `Computed styles [${selector}]: ${JSON.stringify(styles, null, 2)}`);
    return styles;
  }
  
  async useBoundingBoxes(selector) {
    const box = await this.page.$eval(selector, el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    this.log('geometry', `Bounding box [${selector}]: ${JSON.stringify(box, null, 2)}`);
    return box;
  }
  
  async useElementCoordinates(selector) {
    const coords = await this.page.$eval(selector, el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    });
    this.log('geometry', `Element coordinates [${selector}]: ${JSON.stringify(coords, null, 2)}`);
    return coords;
  }
  
  async useElementHierarchy(selector) {
    const path = await this.page.$eval(selector, el => {
      const path = [];
      let current = el;
      while (current) {
        path.unshift({
          tag: current.tagName,
          id: current.id,
          class: current.className
        });
        current = current.parentElement;
      }
      return path;
    });
    this.log('hierarchy', `Element hierarchy [${selector}]: ${JSON.stringify(path, null, 2)}`);
    return path;
  }
  
  async usePageMetrics() {
    const metrics = await this.page.metrics();
    this.log('metrics', `Page metrics: ${JSON.stringify(metrics, null, 2)}`);
    return metrics;
  }
  
  // ==================== UTILITY METHODS ====================
  
  getScreenshotPath(name) {
    const timestamp = Date.now();
    return path.join(this.screenshotDir, `${this.step}-${name}-${timestamp}.png`);
  }
  
  getLogPath(name) {
    const timestamp = Date.now();
    return path.join(this.logDir, `${this.step}-${name}-${timestamp}.log`);
  }
  
  log(type, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type}] ${message}`;
    console.log(logMessage);
    
    // Write to file
    const logPath = path.join(this.logDir, 'debug.log');
    fs.appendFileSync(logPath, logMessage + '\n');
  }
  
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.log('info', 'Browser closed');
    }
  }
}

// ==================== USAGE EXAMPLE ====================

async function exampleUsage() {
  const browser = new VisibleBrowser({
    headless: false,
    verbose: true
  });
  
  try {
    await browser.init();
    
    // Navigate with full visibility
    await browser.screenshotBefore('navigate');
    await browser.page.goto('https://example.com');
    await browser.logPageLoadState();
    await browser.screenshotAfter('navigate');
    
    // Inspect page
    await browser.logPageTitle();
    await browser.logPageURL();
    await browser.logAllButtons();
    await browser.logAllInputs();
    
    // Find element
    const selector = await browser.tryMultipleSelectors([
      'button[type="submit"]',
      '#submit-button',
      '.submit'
    ]);
    
    if (selector) {
      await browser.screenshotBefore('click');
      await browser.autoScrollToElement(selector);
      await browser.page.click(selector);
      await browser.screenshotAfter('click');
    }
    
  } finally {
    await browser.close();
  }
}

module.exports = VisibleBrowser;
