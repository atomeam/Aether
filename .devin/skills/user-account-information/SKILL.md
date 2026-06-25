# User Account Information

## Overview

This skill stores and manages user account information for automation tasks.

## Account Information

### Primary Email
- **Email**: atomicmoonbeam88@gmail.com
- **Usage**: Google login, RapidAPI, Cloudflare, GitHub, etc.

### GitHub
- **Username**: atomeam
- **Email**: atomicmoonbeam88@gmail.com

### Cloudflare
- **Account ID**: 95745fedbea06314e24c27233033a37d
- **Email**: atomicmoonbeam88@gmail.com

### RapidAPI
- **Username**: atom-bomb
- **Email**: atomicmoonbeam88@gmail.com

## Usage in Automation

### Fill Email Address

```javascript
const BrowserManager = require('./browser-manager');

async function fillEmailAddress() {
  const browserManager = BrowserManager.getInstance();
  const page = await browserManager.getPage();
  
  const emailSelectors = [
    'input[type="email"]',
    'input[name="email"]',
    'input[id*="email"]',
  ];
  
  for (const selector of emailSelectors) {
    try {
      const input = await page.$(selector);
      if (input) {
        await input.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        await input.fill('atomicmoonbeam88@gmail.com');
        break;
      }
    } catch {
      continue;
    }
  }
}
```

### GitHub Authentication

```javascript
async function githubLogin() {
  const browserManager = BrowserManager.getInstance();
  const page = await browserManager.getPage();
  
  await page.fill('input[name="login"]', 'atomeam');
  await page.fill('input[name="password"]', 'YOUR_PASSWORD');
  await page.click('input[type="submit"]');
}
```

### Cloudflare Authentication

```javascript
async function cloudflareLogin() {
  const browserManager = BrowserManager.getInstance();
  const page = await browserManager.getPage();
  
  await page.fill('input[name="email"]', 'atomicmoonbeam88@gmail.com');
  await page.fill('input[name="password"]', 'YOUR_PASSWORD');
  await page.click('button[type="submit"]');
}
```

## Security Notes

- **Never commit passwords** to the repository
- **Use environment variables** for sensitive data
- **Use secret management** for production
- **Session persistence** reduces need for credentials

## Available Scripts

- `fill-atomicmoonbeam-email.js` - Fills atomicmoonbeam88@gmail.com in email input
- `complete-google-login-flow.js` - Complete Google login flow with email

## Best Practices

1. **Use session persistence** - Stay logged in to avoid repeated credential entry
2. **Use environment variables** - Store sensitive data in environment variables
3. **Never hardcode passwords** - Use secret management systems
4. **Rotate credentials** - Regularly update passwords and API keys
5. **Use 2FA** - Enable two-factor authentication where possible

## Session Persistence

The singleton browser manager automatically persists sessions, so:
- Login once
- Stay logged in across tasks
- No need to re-enter credentials
- Sessions saved to `.browser-sessions/` directory

## When to Update

Update this skill when:
- Email address changes
- New accounts are added
- Account information changes
- New services are integrated

## Integration with Other Skills

This skill integrates with:
- **Browser Automation Singleton** - For filling forms
- **Persistent Browser Sessions** - For session management
- **Autonomous Revenue Generation** - For account-based monetization
