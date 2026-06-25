# Always Dark Mode - Browser Automation Skill

## Overview

This skill teaches how to automatically enable dark mode on any website during browser automation. Never be blinded by light mode again.

## Problem

Many websites default to light mode, which can be:
- Eye-straining during extended automation sessions
- Inconsistent across different sites
- Requires manual clicking for each site
- Not automated in standard browser automation

## Solution

### Automatic Dark Mode Enablement

```javascript
const { chromium } = require('playwright');

async function enableDarkMode(page) {
  // Method 1: CSS variables
  await page.addStyleTag({
    content: `
      html, body {
        background-color: #1a1a1a !important;
        color: #e0e0e0 !important;
      }
    `
  });
  
  // Method 2: Playwright emulation
  await page.emulateMedia({ colorScheme: 'dark' });
  
  // Method 3: Data attributes
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-color-mode', 'dark');
  });
  
  // Method 4: CSS classes
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  });
  
  // Method 5: LocalStorage
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('color-mode', 'dark');
    localStorage.setItem('darkMode', 'true');
  });
}
```

## Implementation

### Complete Dark Mode Enforcer

```javascript
class DarkModeEnforcer {
  constructor(page) {
    this.page = page;
    this.methods = [];
  }
  
  async enableAll() {
    await this.emulateMedia();
    await this.setCSSVariables();
    await this.setDataAttributes();
    await this.setCSSClasses();
    await this.setLocalStorage();
    await this.injectCSS();
    await this.clickDarkModeToggle();
  }
  
  async emulateMedia() {
    await this.page.emulateMedia({ colorScheme: 'dark' });
    console.log('✅ Emulated dark media');
  }
  
  async setCSSVariables() {
    await this.page.addStyleTag({
      content: `
        :root {
          --background: #1a1a1a;
          --foreground: #e0e0e0;
          --card: #2a2a2a;
          --border: #3a3a3a;
          --primary: #4a9eff;
          --text: #e0e0e0;
        }
        
        html, body {
          background-color: var(--background) !important;
          color: var(--foreground) !important;
        }
        
        * {
          background-color: var(--background) !important;
          color: var(--foreground) !important;
          border-color: var(--border) !important;
        }
      `
    });
    console.log('✅ Set CSS variables');
  }
  
  async setDataAttributes() {
    await this.page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-color-mode', 'dark');
      document.documentElement.setAttribute('data-mode', 'dark');
    });
    console.log('✅ Set data attributes');
  }
  
  async setCSSClasses() {
    await this.page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark');
      document.body.classList.add('dark-mode');
    });
    console.log('✅ Set CSS classes');
  }
  
  async setLocalStorage() {
    await this.page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('color-mode', 'dark');
      localStorage.setItem('darkMode', 'true');
      localStorage.setItem('prefers-color-scheme', 'dark');
    });
    console.log('✅ Set localStorage');
  }
  
  async injectCSS() {
    await this.page.addStyleTag({
      content: `
        @media (prefers-color-scheme: light) {
          :root {
            --background: #1a1a1a !important;
            --foreground: #e0e0e0 !important;
          }
        }
      `
    });
    console.log('✅ Injected CSS');
  }
  
  async clickDarkModeToggle() {
    // Try common dark mode toggle selectors
    const selectors = [
      'button[aria-label*="dark"]',
      'button[aria-label*="theme"]',
      'button[title*="dark"]',
      'button[title*="theme"]',
      '.dark-mode-toggle',
      '.theme-toggle',
      '[data-theme-toggle]',
      '.theme-switch',
      '.mode-toggle'
    ];
    
    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          await element.click();
          console.log(`✅ Clicked dark mode toggle: ${selector}`);
          return;
        }
      } catch {
        continue;
      }
    }
    console.log('⚠️  No dark mode toggle found');
  }
}
```

## Usage

### With Playwright

```javascript
const { chromium } = require('playwright');

async function browseWithDarkMode() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const darkMode = new DarkModeEnforcer(page);
  
  await page.goto('https://example.com');
  await darkMode.enableAll();
  
  // Continue with automation...
  
  await browser.close();
}
```

### With Persistent Browser Service

```javascript
const http = require('http');

async function navigateWithDarkMode(url) {
  // Navigate
  await httpGet(`http://localhost:3456/navigate?url=${url}`);
  
  // Enable dark mode via JavaScript execution
  const darkModeCode = `
    // Emulate dark mode
    window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set CSS variables
    document.documentElement.style.setProperty('--background', '#1a1a1a', 'important');
    document.documentElement.style.setProperty('--foreground', '#e0e0e0', 'important');
    
    // Set data attributes
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-color-mode', 'dark');
    
    // Set classes
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    
    // Set localStorage
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('color-mode', 'dark');
    
    'Dark mode enabled';
  `;
  
  await httpGet(`http://localhost:3456/execute-js?code=${encodeURIComponent(darkModeCode)}`);
}
```

## Integration with Other Skills

This skill integrates with:
- **Persistent Browser Service** - Apply dark mode to persistent sessions
- **Browser Visibility Debug** - Verify dark mode is applied
- **Playwright Inspector** - Debug dark mode issues
- **Browser Session Persistence** - Save dark mode preference

## Scripts Available

- `always-dark-mode.js` - Enable dark mode on any site
- `dark-mode-enforcer.js` - Comprehensive dark mode enforcement

## Best Practices

### 1. Enable Early
- Enable dark mode immediately after page load
- Before interacting with elements
- Before taking screenshots

### 2. Use Multiple Methods
- CSS variables + data attributes + localStorage
- Ensures compatibility across sites
- Fallback if one method fails

### 3. Verify Dark Mode
- Check computed styles
- Take screenshots to verify
- Check data attributes

### 4. Handle Dynamic Content
- Re-apply dark mode after dynamic content loads
- Use MutationObserver to watch for changes
- Re-enable on navigation

## Verification

```javascript
async function verifyDarkMode(page) {
  const isDark = await page.evaluate(() => {
    const computed = window.getComputedStyle(document.documentElement);
    return computed.backgroundColor === 'rgb(26, 26, 26)' ||
           computed.color === 'rgb(224, 224, 224)' ||
           document.documentElement.getAttribute('data-theme') === 'dark' ||
           document.documentElement.classList.contains('dark');
  });
  
  console.log('Dark mode active:', isDark);
  return isDark;
}
```

## Common Issues

### Dark Mode Not Applied
1. Check if site has inline styles
2. Use !important in CSS
3. Try different methods
4. Check for CSP restrictions

### Dynamic Content Resets Dark Mode
1. Use MutationObserver
2. Re-apply on navigation
3. Use CSS injection with high specificity

### Site Doesn't Support Dark Mode
1. Force dark mode with CSS
2. Override inline styles
3. Use browser extensions

## Key Takeaways

1. **Enable early** - Apply dark mode immediately after page load
2. **Use multiple methods** - CSS variables, data attributes, localStorage
3. **Verify application** - Check computed styles and take screenshots
4. **Handle dynamic content** - Re-apply after navigation and dynamic loads
5. **Use !important** - Override site styles when necessary

## Remember: I Can Always Enable Dark Mode

I now have the capability to:
- ✅ Enable dark mode on any site automatically
- ✅ Use multiple methods for compatibility
- ✅ Verify dark mode is applied
- ✅ Handle dynamic content
- ✅ Integrate with persistent browser

**I will never forget that I can enable dark mode for any site.**
