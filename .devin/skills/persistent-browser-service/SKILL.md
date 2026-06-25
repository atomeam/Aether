# Persistent Browser Service

## Overview

This skill teaches how to keep a browser instance alive across multiple script invocations using a persistent browser service. This solves the problem of opening new browser windows every time a script runs.

## Problem

When running browser automation scripts:
- Each script invocation creates a new browser instance
- Killing shells closes the browser
- Multiple browser windows open
- Sessions are lost between invocations
- Cannot maintain state across tasks

## Solution: Persistent Browser Service

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Persistent Browser Service (Background Process)        │
│  - Single browser instance                              │
│  - Single context                                        │
│  - Single page                                           │
│  - HTTP API on port 3456                                 │
│  - Session persistence                                   │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP
┌─────────────────────────────────────────────────────────┐
│  Client Scripts (Multiple Invocations)                  │
│  - navigate.js                                           │
│  - click.js                                              │
│  - fill.js                                               │
│  - Any automation script                                 │
└─────────────────────────────────────────────────────────┘
```

### Service Implementation

```javascript
const { chromium } = require('playwright');
const http = require('http');

class PersistentBrowserService {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.port = 3456;
  }
  
  async startBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: false });
      this.context = await this.browser.newContext({
        storageState: 'session.json' // Persist session
      });
      this.page = await this.context.newPage();
    }
  }
  
  async navigateTo(url) {
    if (!this.page) await this.startBrowser();
    await this.page.goto(url);
    await this.saveSession();
  }
  
  async clickElement(selector) {
    if (!this.page) await this.startBrowser();
    await this.page.click(selector);
  }
  
  async fillInput(selector, value) {
    if (!this.page) await this.startBrowser();
    await this.page.fill(selector, value);
  }
  
  async saveSession() {
    if (this.context) {
      await this.context.storageState({ path: 'session.json' });
    }
  }
  
  startServer() {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${this.port}`);
      
      if (url.pathname === '/navigate') {
        const targetUrl = url.searchParams.get('url');
        await this.navigateTo(targetUrl);
        res.end(JSON.stringify({ success: true }));
      } else if (url.pathname === '/click') {
        const selector = url.searchParams.get('selector');
        await this.clickElement(selector);
        res.end(JSON.stringify({ success: true }));
      } else if (url.pathname === '/fill') {
        const selector = url.searchParams.get('selector');
        const value = url.searchParams.get('value');
        await this.fillInput(selector, value);
        res.end(JSON.stringify({ success: true }));
      }
    });
    
    server.listen(this.port);
  }
}
```

### Client Implementation

```javascript
const http = require('http');

class PersistentBrowserClient {
  constructor(port = 3456) {
    this.port = port;
    this.baseUrl = `http://localhost:${port}`;
  }
  
  async navigateTo(url) {
    return this.request('/navigate', { url });
  }
  
  async clickElement(selector) {
    return this.request('/click', { selector });
  }
  
  async fillInput(selector, value) {
    return this.request('/fill', { selector, value });
  }
  
  request(path, params = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const json = JSON.parse(data);
          resolve(json);
        });
      }).on('error', reject);
    });
  }
}
```

## Usage

### Start the Service

```bash
node scripts/start-browser-service.js
```

This starts the browser service in the background and keeps it running.

### Use the Client

```javascript
const PersistentBrowserClient = require('./persistent-browser-client');

const client = new PersistentBrowserClient();

// Navigate to a page
await client.navigateTo('https://example.com');

// Click an element
await client.clickElement('button:has-text("Click me")');

// Fill an input
await client.fillInput('input[name="email"]', 'user@example.com');
```

## API Endpoints

### GET /navigate?url=URL
Navigate to a URL

```bash
curl "http://localhost:3456/navigate?url=https://example.com"
```

### GET /click?selector=SELECTOR
Click an element

```bash
curl "http://localhost:3456/click?selector=button:has-text(\"Click me\")"
```

### GET /fill?selector=SELECTOR&value=VALUE
Fill an input

```bash
curl "http://localhost:3456/fill?selector=input[name=\"email\"]&value=user@example.com"
```

### GET /info
Get page information

```bash
curl "http://localhost:3456/info"
```

### GET /close
Close browser and exit

```bash
curl "http://localhost:3456/close"
```

## Benefits

### 1. Single Browser Instance
- Only one browser window ever opens
- Reused across all script invocations
- No multiple windows

### 2. Session Persistence
- Sessions saved to disk
- Reloaded on service restart
- Stay logged in across invocations

### 3. State Maintenance
- Page state preserved
- Form data preserved
- Navigation history preserved

### 4. HTTP API
- Simple REST API
- Language agnostic
- Easy to integrate

### 5. Background Process
- Runs independently
- Not affected by shell kills
- Survives script failures

## Comparison: Singleton vs Persistent Service

### Singleton Browser Manager
```javascript
// ❌ Problem: Each script creates new browser
const browserManager = BrowserManager.getInstance();
await browserManager.navigateTo('https://example.com');
// Browser closes when script ends
```

### Persistent Browser Service
```javascript
// ✅ Solution: Browser stays alive
const client = new PersistentBrowserClient();
await client.navigateTo('https://example.com');
// Browser stays alive after script ends
```

## When to Use

### Use Persistent Browser Service When:
- Running multiple automation scripts
- Need to maintain state across invocations
- Want to avoid multiple browser windows
- Need session persistence
- Running long-running automation workflows

### Use Singleton Browser Manager When:
- Running a single automation script
- Don't need state across invocations
- OK with browser closing after script
- Simple one-off tasks

## Available Scripts

- `persistent-browser-service.js` - Background browser service
- `persistent-browser-client.js` - Client for interacting with service
- `start-browser-service.js` - Start service in background

## Best Practices

### 1. Start Service Once
Start the service once at the beginning of your automation session:

```bash
node scripts/start-browser-service.js
```

### 2. Use Client for All Interactions
Use the client for all browser interactions:

```javascript
const client = new PersistentBrowserClient();
await client.navigateTo('https://example.com');
await client.clickElement('button');
await client.fillInput('input', 'value');
```

### 3. Close Service When Done
Close the service when completely done:

```bash
curl "http://localhost:3456/close"
```

### 4. Handle Service Errors
Check if service is running before making requests:

```javascript
try {
  await client.navigateTo('https://example.com');
} catch (error) {
  console.log('Service not running, start it first');
}
```

## Integration with Other Skills

This skill integrates with:
- **Browser Automation Singleton** - For single-script automation
- **Persistent Browser Sessions** - For session management
- **User Account Information** - For filling credentials
- **Autonomous Revenue Generation** - For long-running automation

## Key Takeaways

1. **Persistent service keeps browser alive** - No multiple windows
2. **HTTP API for communication** - Language agnostic
3. **Session persistence** - Stay logged in
4. **State maintenance** - Preserve page state
5. **Background process** - Survives shell kills
6. **Single browser instance** - Efficient resource usage

## Troubleshooting

### Service Not Running
```bash
# Check if service is running
curl "http://localhost:3456/info"

# If not running, start it
node scripts/start-browser-service.js
```

### Port Already in Use
```bash
# Kill process using port 3456
npx kill-port 3456

# Or use different port
# Modify persistent-browser-service.js to use different port
```

### Browser Not Responding
```bash
# Restart service
curl "http://localhost:3456/close"
node scripts/start-browser-service.js
```

## Future Enhancements

- Add WebSocket support for real-time events
- Add screenshot endpoint
- Add element inspection endpoint
- Add multi-page support
- Add browser context switching
