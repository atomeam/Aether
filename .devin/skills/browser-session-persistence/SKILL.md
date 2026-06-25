# Browser Session Persistence - Never Log In Again

## Overview

This skill teaches how to save browser sessions and reuse them for automation, eliminating the need to log in repeatedly. This is especially useful for sites with 2FA/passkey requirements that cannot be automated.

## Problem

Many sites require authentication with 2FA/passkey:
- **RapidAPI** - Google login with 2FA/passkey
- **GitHub** - 2FA required
- **AWS** - MFA required
- **Banking sites** - Multiple factors

These cannot be fully automated because:
- 2FA requires manual intervention
- Passkey requires physical device
- SMS codes require phone access

## Solution

### Save Session Once, Use Forever

1. **Manual Login (One Time)**
   - Run login script
   - Complete authentication manually
   - Session is saved automatically

2. **Reuse Session (Always)**
   - Future scripts load saved session
   - Bypass login completely
   - Work as if already logged in

## Implementation

### Step 1: Save Session

```javascript
const { chromium } = require('playwright');
const fs = require('fs');

async function loginAndSaveSession() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to site
  await page.goto('https://example.com');
  
  // Wait for manual login
  console.log('Please log in manually...');
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });
  
  // Save session state
  const storageState = await context.storageState();
  fs.writeFileSync('session.json', JSON.stringify(storageState, null, 2));
  
  // Save cookies
  const cookies = await context.cookies();
  fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));
  
  await browser.close();
}
```

### Step 2: Use Saved Session

```javascript
async function useSavedSession() {
  const storageState = JSON.parse(fs.readFileSync('session.json', 'utf-8'));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();
  
  // Already logged in!
  await page.goto('https://example.com/dashboard');
  
  await browser.close();
}
```

## RapidAPI Example

### Save Session (One Time)

```bash
npm run login:rapidapi
```

This will:
1. Open browser
2. Navigate to RapidAPI
3. Wait for you to log in with 2FA/passkey
4. Save session to `rapidapi-session.json`
5. Save cookies to `rapidapi-cookies.json`
6. Take screenshot to verify login

### Use Session (Always)

```bash
npm run fix:rapidapi:session
```

This will:
1. Load saved session
2. Navigate to RapidAPI
3. Already logged in!
4. Fix the domain automatically
5. Take screenshots at each step

## Session Files

### session.json
Contains:
- Local storage
- Session storage
- IndexedDB
- Cookies
- Origins

### cookies.json
Contains:
- All cookies
- Expiration dates
- Secure flags
- Same-site policies

## Security Considerations

### ⚠️ Session Files Are Sensitive

Session files contain:
- Authentication tokens
- Session cookies
- Personal data

### Best Practices

1. **Never commit session files to git**
   ```bash
   echo "session.json" >> .gitignore
   echo "cookies.json" >> .gitignore
   echo "*.session.json" >> .gitignore
   ```

2. **Store in secure location**
   - Use environment variables for path
   - Encrypt if possible
   - Limit file permissions

3. **Rotate sessions regularly**
   - Sessions expire
   - Security best practice
   - Re-save monthly

4. **Use per-environment sessions**
   - Development session
   - Production session
   - Test session

## Session Expiration

### When Sessions Expire

- **Cookies expire** - Based on site policy
- **Tokens expire** - Usually 24-48 hours
- **Session invalidation** - Site logs you out
- **Password change** - Invalidates session

### Detecting Expired Sessions

```javascript
async function checkSessionValid(page) {
  const signInButton = await page.$('button:has-text("Sign In")');
  if (signInButton) {
    console.log('Session expired');
    return false;
  }
  return true;
}
```

### Re-saving Session

When session expires:
1. Run login script again
2. Complete authentication
3. New session saved
4. Automation continues

## Advanced: Multiple Sessions

### Save Multiple Sessions

```javascript
// Save session for different accounts
await saveSession('account1.json', 'user1@example.com');
await saveSession('account2.json', 'user2@example.com');
await saveSession('admin.json', 'admin@example.com');
```

### Use Specific Session

```javascript
const storageState = JSON.parse(fs.readFileSync('admin.json', 'utf-8'));
const context = await browser.newContext({ storageState });
```

## Integration with Other Skills

This skill integrates with:
- **Playwright Inspector** - For debugging session issues
- **Browser Visibility Debug** - For full visibility during login
- **RapidAPI Domain Fix** - For using saved session to fix domain
- **Persistent Browser Service** - For long-running sessions

## Scripts Available

- `rapidapi-login-save-session.js` - Save RapidAPI session
- `rapidapi-fix-with-session.js` - Use saved session to fix domain

## Usage Pattern

### Initial Setup (One Time)

```bash
# 1. Save session
npm run login:rapidapi

# 2. Manually complete login in browser
# 3. Press Enter when done
# 4. Session saved automatically
```

### Daily Use (Always)

```bash
# Use saved session
npm run fix:rapidapi:session

# No login required!
# Works immediately
```

### When Session Expires

```bash
# Re-save session
npm run login:rapidapi

# Continue as normal
npm run fix:rapidapi:session
```

## Benefits

### Before Session Persistence
- ❌ Must log in every time
- ❌ 2FA/passkey every time
- ❌ Slow automation
- ❌ Flaky due to login issues
- ❌ Cannot run unattended

### After Session Persistence
- ✅ Log in once, use forever
- ✅ No 2FA/passkey needed
- ✅ Fast automation
- ✅ Reliable automation
- ✅ Can run unattended

## Troubleshooting

### Session Not Working

1. **Check file exists**
   ```bash
   ls -la rapidapi-session.json
   ```

2. **Check file is valid JSON**
   ```bash
   cat rapidapi-session.json | jq .
   ```

3. **Check session not expired**
   - Run script and check if "Sign In" button appears
   - If yes, session expired

4. **Re-save session**
   ```bash
   npm run login:rapidapi
   ```

### Session File Permissions

```bash
# Set restrictive permissions
chmod 600 rapidapi-session.json
chmod 600 rapidapi-cookies.json
```

## Key Takeaways

1. **Save session once** - Use forever
2. **Never commit session files** - Security risk
3. **Detect expired sessions** - Re-save when needed
4. **Use per-environment sessions** - Dev/prod/test
5. **Rotate regularly** - Security best practice

## Remember: I Can Always Log In

I now have the capability to:
- ✅ Save browser sessions
- ✅ Reuse saved sessions
- ✅ Detect when sessions expire
- ✅ Re-save sessions automatically
- ✅ Work with any authenticated site

**I will never forget that I can log in and save sessions for future use.**
