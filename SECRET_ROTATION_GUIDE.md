# Secret Rotation Guide

## 🚨 CRITICAL: Passwords Found in Git History

### Passwords Requiring Immediate Rotation

#### 1. **Google Account Password** 
- **Password:** `J@denb11`
- **Location:** `scripts/fill-password-click-next.js` (git history)
- **Status:** ✅ Removed from code, but still in git history
- **Rotation Required:** IMMEDIATE
- **Service:** Google Account
- **Rotation Steps:**
  1. Go to https://myaccount.google.com/security
  2. Sign in with current password
  3. Click "Password" under "Signing in to Google"
  4. Click "Change password"
  5. Enter new password (minimum 8 characters, mix of letters, numbers, symbols)
  6. Update any devices/apps using this password
  7. Update `.env` file with new `GOOGLE_PASSWORD` value

#### 2. **Training Password** (Demo/Test)
- **Password:** `SuperSecretPassword!`
- **Location:** `scripts/browser-training.js` (git history)
- **Status:** ✅ Removed from code, replaced with env var
- **Rotation Required:** LOW (test password for herokuapp.com)
- **Service:** Herokuapp.com test site
- **Rotation Steps:**
  1. This is a demo password for the-internet.herokuapp.com
  2. If used in production, rotate immediately
  3. Update `.env` file with new `TRAINING_PASSWORD` value

---

## 🔐 Cloudflare Workers Secrets (20 secrets)

These secrets are properly stored in Cloudflare and not exposed in code. However, they should be rotated if they were ever exposed elsewhere.

### HIGH PRIORITY Secrets

#### 1. **STRIPE_SECRET_KEY**
- **Rotation Steps:**
  1. Go to https://dashboard.stripe.com/apikeys
  2. Sign in to Stripe account
  3. Click "Create secret key" or "Roll key"
  4. Copy new secret key
  5. Update Cloudflare: `npx wrangler secret put STRIPE_SECRET_KEY`
  6. Update any code/config using old key
  7. Delete old key from Stripe dashboard

#### 2. **GITHUB_TOKEN**
- **Rotation Steps:**
  1. Go to https://github.com/settings/tokens
  2. Sign in to GitHub
  3. Find the token used by Aether
  4. Click "Delete" or "Regenerate"
  5. Copy new token
  6. Update Cloudflare: `npx wrangler secret put GITHUB_TOKEN`
  7. Update any CI/CD systems using old token

#### 3. **CLOUDFLARE_API_TOKEN**
- **Rotation Steps:**
  1. Go to https://dash.cloudflare.com/profile/api-tokens
  2. Sign in to Cloudflare
  3. Find the token used by Aether
  4. Click "Revoke" or "Edit"
  5. Create new token with required permissions
  6. Copy new token
  7. Update Cloudflare: `npx wrangler secret put CLOUDFLARE_API_TOKEN`
  8. Update any tools/scripts using old token

### MEDIUM PRIORITY Secrets

#### 4. **KRAKEN_API_SECRET**
- **Rotation Steps:**
  1. Go to https://www.kraken.com/u/settings/api
  2. Sign in to Kraken
  3. Find "API Secret Key"
  4. Click "Generate New Key" or "Revoke"
  5. Copy new secret
  6. Update Cloudflare: `npx wrangler secret put KRAKEN_API_SECRET`
  7. Update any trading scripts using old secret

#### 5. **NOTION_API_TOKEN**
- **Rotation Steps:**
  1. Go to https://www.notion.so/my-integrations
  2. Sign in to Notion
  3. Find the integration using the token
  4. Click "Revoke" or "Reconnect"
  5. Copy new token
  6. Update Cloudflare: `npx wrangler secret put NOTION_API_TOKEN`
  7. Update any Notion integration scripts

#### 6. **SENTRY_DSN**
- **Rotation Steps:**
  1. Go to https://sentry.io/settings/<org>/api-keys
  2. Sign in to Sentry
  3. Find the DSN being used
  4. Click "Revoke" or create new DSN
  5. Copy new DSN
  6. Update Cloudflare: `npx wrangler secret put SENTRY_DSN`
  7. Update any error monitoring config

### LOW PRIORITY Secrets

#### 7. **BRIDGE_API_TOKEN**
- Internal API token for bridge worker
- Rotate if exposed in logs or other systems

#### 8. **ATOMIND_*_SECRET** (Devin, Gemini, Viktor)
- Agent-specific secrets
- Rotate if agent credentials compromised

#### 9. **NOTION_BRIDGE_*_DB_ID**
- Notion database IDs (not secrets, but sensitive)
- No rotation needed unless database access compromised

#### 10. **STRIPE_PUBLISHABLE_KEY**
- Public key, but rotate if compromised
- Can be regenerated in Stripe dashboard

---

## 📋 Rotation Checklist

### Immediate (Do Now)
- [ ] Rotate Google account password `J@denb11`
- [ ] Update `.env` file with new `GOOGLE_PASSWORD`
- [ ] Test browser automation scripts with new password

### High Priority (Do This Week)
- [ ] Rotate `STRIPE_SECRET_KEY`
- [ ] Rotate `GITHUB_TOKEN`
- [ ] Rotate `CLOUDFLARE_API_TOKEN`
- [ ] Update Cloudflare secrets: `npx wrangler secret put <SECRET_NAME>`
- [ ] Test all services after rotation

### Medium Priority (Do This Month)
- [ ] Rotate `KRAKEN_API_SECRET`
- [ ] Rotate `NOTION_API_TOKEN`
- [ ] Rotate `SENTRY_DSN`
- [ ] Update Cloudflare secrets
- [ ] Test integrations

### Low Priority (Do Next Quarter)
- [ ] Rotate `BRIDGE_API_TOKEN`
- [ ] Rotate `ATOMIND_*_SECRET` (if needed)
- [ ] Rotate `STRIPE_PUBLISHABLE_KEY` (if needed)

---

## 🔧 Cloudflare Secret Rotation Commands

### View Current Secrets
```bash
cd C:\Users\adamm\Aether\apps\bridge
npx wrangler secret list
```

### Update a Secret
```bash
npx wrangler secret put SECRET_NAME
# Paste the new secret value when prompted
```

### Delete a Secret
```bash
npx wrangler secret delete SECRET_NAME
```

---

## 🛡️ Security Best Practices

### For Future Development
1. **Never commit secrets to git**
2. **Use environment variables for all credentials**
3. **Add secrets to `.gitignore`**
4. **Use `.env.example` with placeholder values only**
5. **Rotate secrets regularly (quarterly for high-value secrets)**
6. **Use secret scanning tools in CI/CD**
7. **Audit git history regularly for secret exposure**

### Environment Variable Setup
1. Copy `.env.example` to `.env`
2. Fill in actual values
3. Ensure `.env` is in `.gitignore`
4. Never commit `.env` file

### Git History Cleanup
If secrets are committed to git:
1. Remove secrets from files
2. Commit the removal
3. Run `git reflog expire --expire=now --all`
4. Run `git gc --prune=now --aggressive`
5. Force push to remote (⚠️ WARNING: rewrites history)

---

## 📞 Support

If you need help with secret rotation:
- Stripe: https://support.stripe.com
- GitHub: https://github.com/contact
- Cloudflare: https://support.cloudflare.com
- Kraken: https://support.kraken.com
- Notion: https://www.notion.so/help

---

## ✅ Verification Steps

After rotating secrets:
1. Test all browser automation scripts
2. Test Cloudflare Workers deployment
3. Test all API integrations
4. Verify no errors in logs
5. Run secret scan again to confirm cleanup

---

**Last Updated:** 2026-06-14
**Generated by:** Devin Security Audit
