# Persistent Browser Session Management

## Overview

This skill teaches how to manage browser sessions to:
- Stay logged in across automation tasks
- Reuse the same browser instance
- Avoid opening multiple browser windows
- Persist login sessions using storage state

## Key Concepts

### 1. Persistent Browser Context

Use `storageState` to persist cookies and login sessions:

```javascript
const context = await browser.newContext({
  storageState: 'path/to/session.json',  // Load existing session
});

// After completing task
await context.storageState({ path: 'path/to/session.json' });  // Save session
```

### 2. Reuse Browser Instance

Keep the browser open and reuse it across multiple tasks:

```javascript
// Single browser instance for the session
let browser = null;
let context = null;

async function getBrowserContext() {
  if (!browser) {
    browser = await chromium.launch({ headless: false });
  }
  
  if (!context) {
    const sessionPath = 'path/to/session.json';
    const sessionExists = fs.existsSync(sessionPath);
    
    context = await browser.newContext({
      storageState: sessionExists ? sessionPath : undefined,
    });
  }
  
  return { browser, context };
}

async function closeBrowser() {
  if (context) {
    await context.storageState({ path: 'path/to/session.json' });
    await context.close();
    context = null;
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
}
```

### 3. Session File Management

Store session files in a consistent location:

```javascript
const SESSION_DIR = '.browser-sessions';
const SESSION_FILE = path.join(SESSION_DIR, 'cloudflare-session.json');

// Ensure directory exists
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}
```

### 4. Check Login Status

Before using a session, verify it's still valid:

```javascript
async function isSessionValid(page) {
  try {
    await page.goto('https://example.com/dashboard');
    const loginButton = await page.$('text=Log in');
    return !loginButton;  // Returns true if logged in
  } catch {
    return false;
  }
}
```

### 5. Session Cleanup

Clean up old sessions periodically:

```javascript
function cleanupOldSessions(maxAge = 7 * 24 * 60 * 60 * 1000) {
  const sessionDir = '.browser-sessions';
  if (!fs.existsSync(sessionDir)) return;
  
  const files = fs.readdirSync(sessionDir);
  const now = Date.now();
  
  files.forEach(file => {
    const filePath = path.join(sessionDir, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up old session: ${file}`);
    }
  });
}
```

## Implementation Pattern

### Single Browser Instance Pattern

```javascript
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class BrowserManager {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.sessionDir = '.browser-sessions';
    this.sessionFile = path.join(this.sessionDir, 'default-session.json');
    
    this.ensureSessionDir();
  }
  
  ensureSessionDir() {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }
  
  async getBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
        ]
      });
    }
    return this.browser;
  }
  
  async getContext() {
    if (!this.context) {
      const browser = await this.getBrowser();
      const sessionExists = fs.existsSync(this.sessionFile);
      
      this.context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        storageState: sessionExists ? this.sessionFile : undefined,
      });
    }
    return this.context;
  }
  
  async getPage() {
    if (!this.page) {
      const context = await this.getContext();
      this.page = await context.newPage();
    }
    return this.page;
  }
  
  async saveSession() {
    if (this.context) {
      await this.context.storageState({ path: this.sessionFile });
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
  
  async isLoggedIn(page, loginSelector = 'text=Log in') {
    const loginButton = await page.$(loginSelector);
    return !loginButton;
  }
}

// Usage
const browserManager = new BrowserManager();

async function task() {
  const page = await browserManager.getPage();
  
  // Check if logged in
  if (!(await browserManager.isLoggedIn(page))) {
    console.log('Not logged in, please log in manually...');
    // Wait for manual login
  }
  
  // Do work...
  
  // Save session when done
  await browserManager.saveSession();
}

// Close when completely done
await browserManager.close();
```

## Best Practices

### 1. Use Single Browser Instance
- Keep one browser open for the entire session
- Reuse contexts instead of creating new ones
- Only close browser when completely done

### 2. Save Session After Login
- Always save session after successful login
- Save session after completing sensitive tasks
- Save session before closing browser

### 3. Check Session Validity
- Verify session is still valid before using
- Handle expired sessions gracefully
- Re-login if session is invalid

### 4. Clean Up Old Sessions
- Remove old session files periodically
- Don't keep sessions indefinitely
- Use reasonable expiration times

### 5. Handle Multiple Services
- Use separate session files for different services
- Name sessions descriptively (e.g., `cloudflare-session.json`, `rapidapi-session.json`)
- Manage sessions independently

## Example: Cloudflare + RapidAPI

```javascript
class MultiServiceBrowserManager {
  constructor() {
    this.browser = null;
    this.contexts = new Map();  // Service name -> context
    this.sessionDir = '.browser-sessions';
    this.ensureSessionDir();
  }
  
  async getContext(serviceName) {
    if (!this.contexts.has(serviceName)) {
      if (!this.browser) {
        this.browser = await chromium.launch({ headless: false });
      }
      
      const sessionFile = path.join(this.sessionDir, `${serviceName}-session.json`);
      const sessionExists = fs.existsSync(sessionFile);
      
      const context = await this.browser.newContext({
        storageState: sessionExists ? sessionFile : undefined,
      });
      
      this.contexts.set(serviceName, context);
    }
    
    return this.contexts.get(serviceName);
  }
  
  async saveSession(serviceName) {
    const context = this.contexts.get(serviceName);
    if (context) {
      const sessionFile = path.join(this.sessionDir, `${serviceName}-session.json`);
      await context.storageState({ path: sessionFile });
    }
  }
  
  async closeService(serviceName) {
    const context = this.contexts.get(serviceName);
    if (context) {
      await this.saveSession(serviceName);
      await context.close();
      this.contexts.delete(serviceName);
    }
  }
  
  async closeAll() {
    for (const [serviceName] of this.contexts) {
      await this.closeService(serviceName);
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Usage
const browserManager = new MultiServiceBrowserManager();

// Cloudflare task
const cloudflareContext = await browserManager.getContext('cloudflare');
const cloudflarePage = await cloudflareContext.newPage();
// ... do Cloudflare work ...
await browserManager.saveSession('cloudflare');
await cloudflarePage.close();

// RapidAPI task
const rapidapiContext = await browserManager.getContext('rapidapi');
const rapidapiPage = await rapidapiContext.newPage();
// ... do RapidAPI work ...
await browserManager.saveSession('rapidapi');
await rapidapiPage.close();

// Close all when done
await browserManager.closeAll();
```

## Session File Location

Store session files in project directory:

```
project/
├── .browser-sessions/
│   ├── cloudflare-session.json
│   ├── rapidapi-session.json
│   └── github-session.json
├── scripts/
└── ...
```

Add to .gitignore:

```
.browser-sessions/
*.json
```

## Error Handling

```javascript
async function safeBrowserOperation(operation) {
  try {
    return await operation();
  } catch (error) {
    console.error('Browser operation failed:', error);
    // Clean up and retry
    await browserManager.close();
    return await operation();
  }
}
```

## When to Close Browser

Close browser when:
- All tasks for the session are complete
- Session is corrupted or invalid
- User explicitly requests closure
- Before long-running background tasks

Don't close browser when:
- More tasks are pending
- Session needs to be preserved
- User is actively using the browser

## Performance Benefits

- Faster startup (no need to re-login)
- Fewer resources (single browser instance)
- Better user experience (persistent login)
- Reduced automation time (skip login steps)
