# Browser Automation with Singleton Manager

## Overview

This skill teaches how to automate browser interactions using a singleton browser manager that:
- Reuses the same browser instance across all tasks
- Never opens multiple browser windows
- Persists login sessions
- Accepts cookies automatically
- Can click buttons, fill forms, and navigate pages

## Core Concept: Singleton Browser Manager

The singleton browser manager ensures only one browser instance exists and is reused across all automation tasks.

### Browser Manager Class

```javascript
const BrowserManager = require('./browser-manager');

// Get the singleton instance
const browserManager = BrowserManager.getInstance();

// Navigate to a page
await browserManager.navigateTo('https://example.com');

// Get the page for interactions
const page = await browserManager.getPage();

// Don't close browser - keep it for future tasks
```

## Key Capabilities

### 1. Navigate to Pages

```javascript
const browserManager = BrowserManager.getInstance();
await browserManager.navigateTo('https://example.com');
```

**What it does**:
- Reuses existing browser instance
- Reuses existing context
- Reuses existing page
- Accepts cookies automatically
- Saves session after navigation

### 2. Click Buttons

```javascript
const browserManager = BrowserManager.getInstance();
const page = await browserManager.getPage();

// Strategy 1: Text-based selector
await page.click('button:has-text("Sign in")');

// Strategy 2: Multiple selectors
const selectors = [
  'button:has-text("Sign in")',
  'button:has-text("Log in")',
  'a:has-text("Sign in")',
];

for (const selector of selectors) {
  try {
    const button = await page.$(selector);
    if (button) {
      await button.click();
      break;
    }
  } catch {
    continue;
  }
}

// Strategy 3: Search by text content
const buttons = await page.$$('button, a');
for (const button of buttons) {
  const text = await button.textContent();
  if (text && text.toLowerCase().includes('sign in')) {
    await button.click();
    break;
  }
}
```

### 3. Fill Forms

```javascript
const browserManager = BrowserManager.getInstance();
const page = await browserManager.getPage();

// Fill input fields
await page.fill('input[name="email"]', 'user@example.com');
await page.fill('input[name="password"]', 'password');

// Submit form
await page.click('button[type="submit"]');
```

### 4. Extract Text

```javascript
const browserManager = BrowserManager.getInstance();
const page = await browserManager.getPage();

// Get page title
const title = await page.title();

// Get element text
const text = await page.textContent('.selector');

// Get input value
const value = await page.inputValue('input[name="field"]');
```

### 5. Check Login Status

```javascript
const browserManager = BrowserManager.getInstance();
const isLoggedIn = await browserManager.isLoggedIn('text=Log in');

if (!isLoggedIn) {
  console.log('Not logged in');
  // Wait for manual login
} else {
  console.log('Already logged in');
}
```

### 6. Wait for Elements

```javascript
const browserManager = BrowserManager.getInstance();
const page = await browserManager.getPage();

// Wait for selector
await page.waitForSelector('.selector', { timeout: 10000 });

// Wait for text
await page.waitForSelector('text=Success', { timeout: 10000 });

// Wait for navigation
await page.waitForURL('https://example.com/dashboard');
```

### 7. Take Screenshots

```javascript
const browserManager = BrowserManager.getInstance();
const page = await browserManager.getPage();

// Take screenshot
await page.screenshot({ path: 'screenshot.png' });

// Take full page screenshot
await page.screenshot({ path: 'full-page.png', fullPage: true });
```

## Common Patterns

### Pattern 1: Login Flow

```javascript
const BrowserManager = require('./browser-manager');

async function login() {
  const browserManager = BrowserManager.getInstance();
  
  // Navigate to login page
  await browserManager.navigateTo('https://example.com/login');
  
  const page = await browserManager.getPage();
  
  // Check if already logged in
  if (await browserManager.isLoggedIn()) {
    console.log('Already logged in');
    return;
  }
  
  // Click login button
  await page.click('button:has-text("Log in")');
  
  // Wait for login page
  await page.waitForSelector('input[name="email"]');
  
  // Fill credentials
  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await page.waitForSelector('text=Dashboard');
  
  console.log('Login successful');
}

login().catch(console.error);
```

### Pattern 2: Click Button with Multiple Strategies

```javascript
async function clickButton(targetText) {
  const browserManager = BrowserManager.getInstance();
  const page = await browserManager.getPage();
  
  // Strategy 1: Text-based selector
  const textSelectors = [
    `button:has-text("${targetText}")`,
    `a:has-text("${targetText}")`,
    `[data-testid*="${targetText.toLowerCase()}"]`,
  ];
  
  for (const selector of textSelectors) {
    try {
      const button = await page.$(selector);
      if (button) {
        await button.click();
        return true;
      }
    } catch {
      continue;
    }
  }
  
  // Strategy 2: Search by text content
  const buttons = await page.$$('button, a');
  for (const button of buttons) {
    const text = await button.textContent();
    if (text && text.toLowerCase().includes(targetText.toLowerCase())) {
      await button.click();
      return true;
    }
  }
  
  return false;
}
```

### Pattern 3: Navigate and Wait

```javascript
async function navigateAndWait(url, selector) {
  const browserManager = BrowserManager.getInstance();
  
  await browserManager.navigateTo(url);
  const page = await browserManager.getPage();
  
  await page.waitForSelector(selector, { timeout: 10000 });
  
  return page;
}
```

### Pattern 4: Form Submission

```javascript
async function submitForm(formSelector, data) {
  const browserManager = BrowserManager.getInstance();
  const page = await browserManager.getPage();
  
  // Fill form fields
  for (const [field, value] of Object.entries(data)) {
    const selector = `${formSelector} [name="${field}"]`;
    await page.fill(selector, value);
  }
  
  // Submit form
  const submitButton = await page.$(`${formSelector} button[type="submit"]`);
  await submitButton.click();
  
  // Wait for success
  await page.waitForSelector('text=Success', { timeout: 10000 });
}
```

## Best Practices

### 1. Always Use Singleton

```javascript
// ✅ Good - Reuses browser
const browserManager = BrowserManager.getInstance();

// ❌ Bad - Opens new browser
const browser = await chromium.launch();
```

### 2. Never Close Browser Unless Requested

```javascript
// ✅ Good - Keep browser open
await browserManager.navigateTo('https://example.com');

// ❌ Bad - Close browser
await browser.close();
```

### 3. Accept Cookies Automatically

The browser manager automatically accepts cookies on every navigation. No manual intervention needed.

### 4. Persist Sessions

Sessions are automatically saved after:
- Navigation
- Login
- Sensitive operations

No manual session saving needed.

### 5. Use Multiple Strategies

Always try multiple strategies to find elements:
- Text-based selectors
- Data attributes
- Class names
- Text content search

### 6. Wait for Elements

Always wait for elements before interacting:
```javascript
await page.waitForSelector('.selector');
await page.click('.selector');
```

### 7. Handle Errors Gracefully

```javascript
try {
  await page.click('.selector');
} catch (error) {
  console.log('Could not click, trying alternative...');
  // Try alternative approach
}
```

## Common Selectors

### Buttons
```javascript
'button:has-text("Click me")'
'button[type="submit"]'
'button[data-testid="submit"]'
'a:has-text("Link")'
```

### Inputs
```javascript
'input[name="email"]'
'input[type="text"]'
'input[type="password"]'
'textarea[name="message"]'
```

### Forms
```javascript
'form[name="login"]'
'form[action="/submit"]'
'.login-form'
'#login-form'
```

### Navigation
```javascript
'a[href="/dashboard"]'
'nav a:has-text("Home")'
'.menu-item'
```

## Error Handling

### Element Not Found
```javascript
const element = await page.$('.selector');
if (!element) {
  console.log('Element not found');
  // Try alternative selector
}
```

### Timeout
```javascript
try {
  await page.waitForSelector('.selector', { timeout: 10000 });
} catch (error) {
  console.log('Element not found within timeout');
}
```

### Navigation Failed
```javascript
try {
  await page.goto('https://example.com');
} catch (error) {
  console.log('Navigation failed');
}
```

## When to Close Browser

Close browser only when:
- All automation tasks are complete
- User explicitly requests closure
- Session is corrupted or invalid
- Before long-running background tasks

```javascript
const browserManager = BrowserManager.getInstance();
await browserManager.close();
```

## When to Reset Page

Reset page when:
- Page gets stuck
- Has issues
- Need fresh page

```javascript
const browserManager = BrowserManager.getInstance();
await browserManager.resetPage();
```

## Complete Example: RapidAPI Login

```javascript
const BrowserManager = require('./browser-manager');

async function rapidAPILogin() {
  const browserManager = BrowserManager.getInstance();
  
  try {
    // Navigate to login page
    await browserManager.navigateTo('https://rapidapi.com/auth/login');
    
    const page = await browserManager.getPage();
    
    // Check if already logged in
    if (await browserManager.isLoggedIn()) {
      console.log('Already logged in');
      return;
    }
    
    // Click Login with Google
    await page.click('button:has-text("Login with Google")');
    
    // Wait for Google authentication
    await page.waitForSelector('text=Dashboard', { timeout: 60000 });
    
    console.log('Login successful');
    
  } catch (error) {
    console.error('Login failed:', error);
  }
  // Don't close browser - keep it for future tasks
}

rapidAPILogin().catch(console.error);
```

## Key Takeaways

1. **Always use singleton browser manager** - Never open new browsers
2. **Never close browser unless requested** - Keep it open for future tasks
3. **Use multiple strategies** - Try different selectors and approaches
4. **Wait for elements** - Don't interact before elements are ready
5. **Handle errors gracefully** - Always have fallback strategies
6. **Sessions persist automatically** - No manual session management needed
7. **Cookies accepted automatically** - No manual intervention needed

## Available Scripts

- `browser-manager.js` - Singleton browser manager class
- `test-browser-manager.js` - Test script to verify singleton behavior
- `click-signin.js` - Click Sign In button
- `click-google-login.js` - Click Login with Google button
- `rapidapi-domain-fix-singleton.js` - Fix RapidAPI domain using singleton

## Skill Integration

This skill integrates with:
- **Persistent Browser Sessions** - Session persistence
- **Autonomous Revenue Generation** - Browser automation for monetization
- **Singleton Browser Manager** - Core browser management
