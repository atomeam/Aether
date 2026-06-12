/**
 * Browser Automation Training - Progressive Learning
 * 
 * This script trains browser automation skills on progressively
 * more complex sites, starting with simple tasks.
 */

const { chromium } = require('playwright');
const fs = require('fs');

class BrowserTrainer {
  constructor() {
    this.browser = null;
    this.page = null;
    this.trainingDir = './browser-training';
    this.level = 1;
    this.fs = fs;
    this.fs.mkdirSync(this.trainingDir, { recursive: true });
  }
  
  async init() {
    this.browser = await chromium.launch({ 
      headless: false, // Show browser for learning
      slowMo: 100 // Slow down for visibility
    });
    this.page = await this.browser.newPage();
    console.log('🌐 Browser started');
  }
  
  async screenshot(name) {
    const path = `${this.trainingDir}/level${this.level}-${name}.png`;
    await this.page.screenshot({ path, fullPage: true });
    console.log(`📸 Screenshot: ${path}`);
    return path;
  }
  
  async log(text) {
    console.log(text);
  }
  
  async close() {
    await this.browser.close();
    console.log('🎯 Browser closed');
  }
}

// Level 1: Basic Navigation
async function level1_basicNavigation(trainer) {
  trainer.log('\n=== LEVEL 1: Basic Navigation ===');
  trainer.log('Task: Navigate to a page and verify');
  
  await trainer.page.goto('https://example.com');
  await trainer.page.waitForLoadState('networkidle');
  await trainer.screenshot('01-example-home');
  
  const title = await trainer.page.title();
  trainer.log(`✅ Page title: ${title}`);
  
  const url = trainer.page.url();
  trainer.log(`✅ Page URL: ${url}`);
  
  trainer.log('✅ Level 1 complete');
}

// Level 2: Find and Click Elements
async function level2_findAndClick(trainer) {
  trainer.log('\n=== LEVEL 2: Find and Click Elements ===');
  trainer.log('Task: Find links and click them');
  
  await trainer.page.goto('https://example.com');
  await trainer.page.waitForLoadState('networkidle');
  
  // Find all links
  const links = await trainer.page.$$eval('a', els => 
    els.map(el => ({ text: el.textContent, href: el.href }))
  );
  trainer.log(`🔗 Found ${links.length} links`);
  links.forEach((link, i) => {
    trainer.log(`   ${i + 1}. ${link.text} -> ${link.href}`);
  });
  
  await trainer.screenshot('01-links-found');
  
  // Click the "More information" link
  const moreInfoLink = await trainer.page.$('a:has-text("More information")');
  if (moreInfoLink) {
    await moreInfoLink.click();
    await trainer.page.waitForLoadState('networkidle');
    await trainer.screenshot('02-after-click');
    trainer.log('✅ Clicked "More information" link');
  }
  
  trainer.log('✅ Level 2 complete');
}

// Level 3: Form Interaction
async function level3_formInteraction(trainer) {
  trainer.log('\n=== LEVEL 3: Form Interaction ===');
  trainer.log('Task: Fill and submit a form');
  
  await trainer.page.goto('https://the-internet.herokuapp.com/login');
  await trainer.page.waitForLoadState('networkidle');
  await trainer.screenshot('01-login-page');
  
  // Find username input
  const usernameInput = await trainer.page.$('#username');
  if (usernameInput) {
    await usernameInput.fill('tomsmith');
    trainer.log('✅ Filled username');
  }
  
  // Find password input
  const passwordInput = await trainer.page.$('#password');
  if (passwordInput) {
    await passwordInput.fill('SuperSecretPassword!');
    trainer.log('✅ Filled password');
  }
  
  await trainer.screenshot('02-form-filled');
  
  // Click login button
  const loginButton = await trainer.page.$('button[type="submit"]');
  if (loginButton) {
    await loginButton.click();
    await trainer.page.waitForLoadState('networkidle');
    await trainer.screenshot('03-after-login');
    trainer.log('✅ Clicked login button');
  }
  
  // Verify success
  const successMessage = await trainer.page.$('.flash.success');
  if (successMessage) {
    const text = await successMessage.textContent();
    trainer.log(`✅ Success message: ${text}`);
  }
  
  trainer.log('✅ Level 3 complete');
}

// Level 4: Dynamic Content
async function level4_dynamicContent(trainer) {
  trainer.log('\n=== LEVEL 4: Dynamic Content ===');
  trainer.log('Task: Wait for dynamic content to load');
  
  await trainer.page.goto('https://the-internet.herokuapp.com/dynamic_loading');
  await trainer.page.waitForLoadState('networkidle');
  await trainer.screenshot('01-dynamic-page');
  
  // Click start button
  const startButton = await trainer.page.$('#start');
  if (startButton) {
    await startButton.click();
    trainer.log('✅ Clicked start button');
  }
  
  // Wait for dynamic content
  try {
    await trainer.page.waitForSelector('#finish', { timeout: 15000 });
    await trainer.screenshot('02-dynamic-loaded');
    trainer.log('✅ Dynamic content loaded');
  } catch (error) {
    trainer.log('⚠️  Dynamic content timeout, but continuing');
    await trainer.screenshot('02-dynamic-timeout');
  }
  
  trainer.log('✅ Level 4 complete');
}

// Level 5: Multiple Tabs
async function level5_multipleTabs(trainer) {
  trainer.log('\n=== LEVEL 5: Multiple Tabs ===');
  trainer.log('Task: Open and manage multiple tabs');
  
  await trainer.page.goto('https://example.com');
  await trainer.page.waitForLoadState('networkidle');
  
  // Open new tab
  const newPage = await trainer.browser.newPage();
  await newPage.goto('https://example.com');
  await newPage.waitForLoadState('networkidle');
  trainer.log('✅ Opened new tab');
  
  // Switch back to first tab
  await trainer.page.bringToFront();
  trainer.log('✅ Switched back to first tab');
  
  await trainer.screenshot('01-multiple-tabs');
  
  await newPage.close();
  trainer.log('✅ Closed new tab');
  
  trainer.log('✅ Level 5 complete');
}

// Level 6: Dropdowns and Selects
async function level6_dropdowns(trainer) {
  trainer.log('\n=== LEVEL 6: Dropdowns and Selects ===');
  trainer.log('Task: Interact with dropdown menus');
  
  await trainer.page.goto('https://the-internet.herokuapp.com/dropdown');
  await trainer.page.waitForLoadState('networkidle');
  await trainer.screenshot('01-dropdown-page');
  
  // Select option
  const dropdown = await trainer.page.$('#dropdown');
  if (dropdown) {
    await dropdown.selectOption('1');
    trainer.log('✅ Selected option 1');
    
    const selectedOption = await dropdown.$eval('option:checked', el => el.textContent);
    trainer.log(`✅ Selected: ${selectedOption}`);
  }
  
  await trainer.screenshot('02-dropdown-selected');
  
  trainer.log('✅ Level 6 complete');
}

// Level 7: Alerts and Dialogs
async function level7_alerts(trainer) {
  trainer.log('\n=== LEVEL 7: Alerts and Dialogs ===');
  trainer.log('Task: Handle browser alerts');
  
  await trainer.page.goto('https://the-internet.herokuapp.com/javascript_alerts');
  await trainer.page.waitForLoadState('networkidle');
  await trainer.screenshot('01-alerts-page');
  
  // Handle alert
  trainer.page.on('dialog', async dialog => {
    trainer.log(`🔔 Alert: ${dialog.message()}`);
    await dialog.accept();
    trainer.log('✅ Accepted alert');
  });
  
  const alertButton = await trainer.page.$('button:has-text("Click for JS Alert")');
  if (alertButton) {
    await alertButton.click();
    await trainer.page.waitForTimeout(1000);
  }
  
  await trainer.screenshot('02-alert-handled');
  
  trainer.log('✅ Level 7 complete');
}

// Level 8: File Upload
async function level8_fileUpload(trainer) {
  trainer.log('\n=== LEVEL 8: File Upload ===');
  trainer.log('Task: Upload a file');
  
  await trainer.page.goto('https://the-internet.herokuapp.com/upload');
  await trainer.page.waitForLoadState('networkidle');
  await trainer.screenshot('01-upload-page');
  
  // Create a test file
  const testFilePath = `${trainer.trainingDir}/test-upload.txt`;
  trainer.fs.writeFileSync(testFilePath, 'Test file content');
  
  // Upload file
  const fileInput = await trainer.page.$('#file-upload');
  if (fileInput) {
    await fileInput.setInputFiles(testFilePath);
    trainer.log('✅ Selected file');
  }
  
  await trainer.screenshot('02-file-selected');
  
  // Click upload button
  const uploadButton = await trainer.page.$('#file-submit');
  if (uploadButton) {
    await uploadButton.click();
    await trainer.page.waitForLoadState('networkidle');
    await trainer.screenshot('03-file-uploaded');
    trainer.log('✅ File uploaded');
  }
  
  trainer.log('✅ Level 8 complete');
}

// Level 9: Cookies and Storage
async function level9_cookies(trainer) {
  trainer.log('\n=== LEVEL 9: Cookies and Storage ===');
  trainer.log('Task: Manage cookies and local storage');
  
  await trainer.page.goto('https://example.com');
  await trainer.page.waitForLoadState('networkidle');
  
  // Set a cookie
  await trainer.page.context().addCookies([
    { name: 'test_cookie', value: 'test_value', domain: 'example.com', path: '/' }
  ]);
  trainer.log('✅ Set cookie');
  
  // Get cookies
  const cookies = await trainer.page.context().cookies();
  trainer.log(`✅ Cookies: ${JSON.stringify(cookies, null, 2)}`);
  
  // Set local storage
  await trainer.page.evaluate(() => {
    localStorage.setItem('test_key', 'test_value');
  });
  trainer.log('✅ Set local storage');
  
  // Get local storage
  const localStorage = await trainer.page.evaluate(() => localStorage.getItem('test_key'));
  trainer.log(`✅ Local storage: ${localStorage}`);
  
  await trainer.screenshot('01-cookies-storage');
  
  trainer.log('✅ Level 9 complete');
}

// Level 10: Full Workflow
async function level10_fullWorkflow(trainer) {
  trainer.log('\n=== LEVEL 10: Full Workflow ===');
  trainer.log('Task: Complete a multi-step workflow');
  
  // Step 1: Navigate
  await trainer.page.goto('https://the-internet.herokuapp.com/login');
  await trainer.page.waitForLoadState('networkidle');
  await trainer.screenshot('01-login-page');
  
  // Step 2: Login
  await trainer.page.fill('#username', 'tomsmith');
  await trainer.page.fill('#password', 'SuperSecretPassword!');
  await trainer.page.click('button[type="submit"]');
  await trainer.page.waitForLoadState('networkidle');
  await trainer.screenshot('02-logged-in');
  trainer.log('✅ Logged in');
  
  // Step 3: Navigate to checkboxes
  await trainer.page.goto('https://the-internet.herokuapp.com/checkboxes');
  await trainer.page.waitForLoadState('networkidle');
  await trainer.screenshot('03-checkboxes');
  
  // Step 4: Check checkboxes
  await trainer.page.check('#checkboxes input[type="checkbox"]:first-of-type');
  await trainer.screenshot('04-checkbox-checked');
  trainer.log('✅ Checked checkbox');
  
  // Step 5: Logout
  await trainer.page.goto('https://the-internet.herokuapp.com/logout');
  await trainer.page.waitForLoadState('networkidle');
  await trainer.screenshot('05-logged-out');
  trainer.log('✅ Logged out');
  
  trainer.log('✅ Level 10 complete');
}

// Main training function
async function runTraining() {
  const trainer = new BrowserTrainer();
  
  try {
    await trainer.init();
    
    try {
      await level1_basicNavigation(trainer);
      trainer.level++;
    } catch (error) {
      trainer.log(`❌ Level 1 failed: ${error.message}`);
    }
    
    try {
      await level2_findAndClick(trainer);
      trainer.level++;
    } catch (error) {
      trainer.log(`❌ Level 2 failed: ${error.message}`);
    }
    
    try {
      await level3_formInteraction(trainer);
      trainer.level++;
    } catch (error) {
      trainer.log(`❌ Level 3 failed: ${error.message}`);
    }
    
    try {
      await level4_dynamicContent(trainer);
      trainer.level++;
    } catch (error) {
      trainer.log(`❌ Level 4 failed: ${error.message}`);
    }
    
    try {
      await level5_multipleTabs(trainer);
      trainer.level++;
    } catch (error) {
      trainer.log(`❌ Level 5 failed: ${error.message}`);
    }
    
    try {
      await level6_dropdowns(trainer);
      trainer.level++;
    } catch (error) {
      trainer.log(`❌ Level 6 failed: ${error.message}`);
    }
    
    try {
      await level7_alerts(trainer);
      trainer.level++;
    } catch (error) {
      trainer.log(`❌ Level 7 failed: ${error.message}`);
    }
    
    try {
      await level8_fileUpload(trainer);
      trainer.level++;
    } catch (error) {
      trainer.log(`❌ Level 8 failed: ${error.message}`);
    }
    
    try {
      await level9_cookies(trainer);
      trainer.level++;
    } catch (error) {
      trainer.log(`❌ Level 9 failed: ${error.message}`);
    }
    
    try {
      await level10_fullWorkflow(trainer);
      trainer.level++;
    } catch (error) {
      trainer.log(`❌ Level 10 failed: ${error.message}`);
    }
    
    trainer.log('\n🎉 TRAINING COMPLETE!');
    trainer.log(`📸 All screenshots saved to: ${trainer.trainingDir}`);
    
  } catch (error) {
    trainer.log(`❌ Fatal error: ${error.message}`);
  } finally {
    await trainer.close();
  }
}

runTraining().catch(console.error);