# Aether Security Best Practices

## Overview
This guide covers security best practices for the Aether monorepo.

## Table of Contents
1. [Secrets Management](#secrets-management)
2. [Authentication](#authentication)
3. [Input Validation](#input-validation)
4. [API Security](#api-security)
5. [Worker Security](#worker-security)
6. [Database Security](#database-security)
7. [Network Security](#network-security)
8. [Code Security](#code-security)

---

## Secrets Management

### Never Commit Secrets

**❌ Bad:**
```bash
# Committing secrets to git
git add .env
git commit -m "Add secrets"
```

**✅ Good:**
```bash
# Use environment variables
cp .env.example .env
# Edit .env with actual secrets
echo ".env" >> .gitignore
```

### Use Environment Variables

**✅ Good:**
```typescript
// Use environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY not set');
}
```

### Rotate Secrets Regularly

**Best Practice:**
- Rotate API keys every 90 days
- Rotate auth tokens every 30 days
- Rotate database credentials every 60 days
- Use password manager to track rotation schedule

### Use Different Secrets for Different Environments

**✅ Good:**
```bash
# Development
DEV_API_KEY=dev_key_123

# Staging
STAGING_API_KEY=staging_key_456

# Production
PROD_API_KEY=prod_key_789
```

---

## Authentication

### Use Strong Authentication

**✅ Good:**
```typescript
// Use Clerk for authentication
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

app.post('/api/protected', ClerkExpressRequireAuth(), (req, res) => {
  // Only authenticated users can access
});
```

### Implement Scope-Based Access Control

**✅ Good:**
```typescript
// Different scopes for different operations
const requireAuth = (scope: 'nucleus' | 'service') => {
  return (req, res, next) => {
    const key = req.headers.get('Authorization')?.replace('Bearer ', '');
    const expectedKey = scope === 'nucleus' 
      ? process.env.BRIDGE_NUCLEUS_KEY 
      : process.env.BRIDGE_SERVICE_KEY;
    
    if (key !== expectedKey) {
      return res.status(403).json({ error: 'Invalid auth key' });
    }
    
    next();
  };
};
```

### Use Constant-Time Comparison for Secrets

**✅ Good:**
```typescript
// Use constant-time comparison for HMAC
let xor = 0;
for (let i = 0; i < expectedHex.length; i++) {
  xor |= expectedHex.charCodeAt(i) ^ providedHex.charCodeAt(i);
}

if (xor !== 0) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

---

## Input Validation

### Validate All User Input

**❌ Bad:**
```typescript
// No validation
const command = req.body.command;
exec(command);
```

**✅ Good:**
```typescript
// Validate input
const command = req.body.command;
if (!command || typeof command !== 'string') {
  return res.status(400).json({ error: 'Invalid command' });
}

// Use allowlist
const SAFE_COMMANDS = ['git', 'ls', 'cat'];
if (!SAFE_COMMANDS.includes(command.split(' ')[0])) {
  return res.status(403).json({ error: 'Unsafe command' });
}
```

### Sanitize File Paths

**✅ Good:**
```typescript
// Validate file paths
const fullPath = path.join(process.cwd(), args.path);
if (!fullPath.startsWith(process.cwd())) {
  throw new Error("Security Violation: Out of bounds read.");
}
```

### Use Schema Validation

**✅ Good:**
```typescript
// Use Zod for schema validation
import { z } from 'zod';

const TaskSchema = z.object({
  to: z.string(),
  from: z.string(),
  task: z.string(),
  priority: z.enum(['low', 'normal', 'high']),
});

const validated = TaskSchema.parse(req.body);
```

---

## API Security

### Use HTTPS in Production

**✅ Good:**
```typescript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.protocol !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}
```

### Implement Rate Limiting

**✅ Good:**
```typescript
// Implement rate limiting
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  
  entry.count++;
  return entry.count <= 60; // 60 requests per minute
}
```

### Use CORS Properly

**✅ Good:**
```typescript
// Configure CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## Worker Security

### Validate Webhook Signatures

**✅ Good:**
```typescript
// Verify webhook signatures
const signature = request.headers.get('x-notion-signature');
const enc = new TextEncoder();
const key = await crypto.subtle.importKey(
  'raw', enc.encode(env.NOTION_WEBHOOK_SECRET),
  { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
);
const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
const expectedHex = Array.from(new Uint8Array(sigBuf))
  .map(b => b.toString(16).padStart(2, '0')).join('');
const providedHex = signature.replace(/^sha256=/, '');

// Constant-time comparison
let xor = 0;
for (let i = 0; i < expectedHex.length; i++) {
  xor |= expectedHex.charCodeAt(i) ^ providedHex.charCodeAt(i);
}

if (xor !== 0) {
  return new Response('Invalid signature', { status: 401 });
}
```

### Use Default-Deny Auth

**✅ Good:**
```typescript
// Default-deny for write endpoints
if (path === '/proposals/write' && method === 'POST') {
  const authError = requireAuth(env, 'nucleus')(request);
  if (authError) return authError;
  
  // Only proceed if auth passes
}
```

### Limit Worker Resources

**✅ Good:**
```toml
# wrangler.toml
[build]
command = "npm run build"

[build.upload]
format = "modules"
main = "./worker.js"

# Limits
limits = { cpu_ms = 50 }
```

---

## Database Security

### Use Prepared Statements

**✅ Good:**
```typescript
// Use prepared statements to prevent SQL injection
const { results } = await env.DB.prepare(
  "SELECT * FROM relay_tasks WHERE assigned_to = ?"
).bind(agentId).all();
```

### Limit Database Access

**✅ Good:**
```typescript
// Use least privilege principle
// Create separate database users for different services
// Grant only necessary permissions

// Example: Read-only user for analytics
// Write user for main application
// Admin user for migrations
```

### Encrypt Sensitive Data

**✅ Good:**
```typescript
// Encrypt sensitive data before storing
import crypto from 'crypto';

function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}
```

---

## Network Security

### Validate URLs

**✅ Good:**
```typescript
// Validate URLs before fetching
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

if (!isValidUrl(url)) {
  throw new Error('Invalid URL');
}
```

### Use Request Timeouts

**✅ Good:**
```typescript
// Use timeouts for external requests
const response = await fetch(url, {
  signal: AbortSignal.timeout(5000), // 5 second timeout
});
```

### Validate SSL Certificates

**✅ Good:**
```typescript
// In production, always validate SSL certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
```

---

## Code Security

### Keep Dependencies Updated

**✅ Good:**
```bash
# Regularly update dependencies
pnpm update

# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit fix
```

### Use Linting Rules

**✅ Good:**
```json
// .eslintrc.json
{
  "rules": {
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error"
  }
}
```

### Use TypeScript

**✅ Good:**
```typescript
// TypeScript provides type safety
interface Task {
  to: string;
  from: string;
  task: string;
  priority: 'low' | 'normal' | 'high';
}

function processTask(task: Task): void {
  // Type-safe processing
}
```

---

## Monitoring

### Log Security Events

**✅ Good:**
```typescript
// Log authentication failures
if (authError) {
  console.log(`[AUTH] Failed attempt from ${ip} at ${timestamp}`);
  // Send alert for repeated failures
}
```

### Set Up Alerts

**✅ Good:**
```typescript
// Alert on suspicious activity
if (failedAttempts > 5) {
  sendAlert('Multiple auth failures detected');
}
```

### Regular Security Audits

**Best Practice:**
- Monthly security audits
- Dependency vulnerability scans
- Code security reviews
- Penetration testing

---

## Incident Response

### Have a Plan

**Steps:**
1. Identify the breach
2. Contain the breach
3. Eradicate the threat
4. Recover systems
5. Document lessons learned

### Rotate Compromised Secrets

**Immediate Action:**
```bash
# Rotate all secrets if breach detected
wrangler secret put BRIDGE_NUCLEUS_KEY
wrangler secret put BRIDGE_SERVICE_KEY
# etc.
```

### Notify Stakeholders

**Best Practice:**
- Notify users if data compromised
- Notify team immediately
- Document incident
- Post-mortem analysis

---

## Compliance

### GDPR Compliance

**Requirements:**
- Data minimization
- User consent
- Right to be forgotten
- Data portability
- Breach notification

### SOC 2 Compliance

**Requirements:**
- Access controls
- Encryption
- Monitoring
- Incident response
- Change management

---

## Resources

### Tools
- OWASP ZAP - Web application security scanner
- Snyk - Dependency vulnerability scanner
- SonarQube - Code quality and security
- Dependabot - Automated dependency updates

### Documentation
- OWASP Top 10 - https://owasp.org/www-project-top-ten/
- Cloudflare Security - https://developers.cloudflare.com/security/
- Node.js Security - https://nodejs.org/en/docs/guides/security/

---

## Checklist

### Before Deployment
- [ ] All secrets in environment variables
- [ ] No secrets in code
- [ ] HTTPS enabled
- [ ] Authentication implemented
- [ ] Input validation added
- [ ] Rate limiting configured
- [ ] CORS configured
- [ ] Dependencies updated
- [ ] Security audit passed

### After Deployment
- [ ] Monitor logs for security events
- [ ] Set up alerts
- [ ] Test authentication
- [ ] Test input validation
- [ ] Test rate limiting
- [ ] Document security measures

---

## Next Steps

1. Review current security measures
2. Implement missing security measures
3. Set up monitoring and alerts
4. Schedule regular security audits
5. Train team on security best practices
