# Clerk Backend Integration Plan

## Overview
Complete Clerk authentication integration for the backend and Cloudflare Workers.

## Current State
- ✅ Frontend Clerk integration complete
- ❌ Backend Clerk integration blocked by workspace dependency issues
- ❌ Cloudflare Workers Clerk integration not started
- ❌ Workspace dependency: `@aether/chaos` not found in npm registry

## Blocker Analysis

### Issue: Workspace Dependency Resolution
**Error:** `@aether/chaos` not found in npm registry
**Cause:** npm workspaces vs pnpm workspaces conflict
**Impact:** Cannot install `@clerk/backend` package

### Root Cause
The project uses pnpm workspaces but npm is trying to resolve dependencies. The `@aether/chaos` package is a workspace package that only exists in the monorepo, not in the npm registry.

## Resolution Strategy

### Option A: Switch to pnpm (Recommended)
**Why:** Project already has pnpm-workspace.yaml and .npmrc configured for pnpm

**Steps:**
1. Remove all node_modules directories
2. Remove package-lock.json files
3. Run `pnpm install` instead of `npm install`
4. Update all scripts to use pnpm
5. Update CI/CD to use pnpm

**Pros:**
- Native workspace support
- Faster installs
- Better dependency resolution
- Already configured

**Cons:**
- Requires tooling change
- May need to update CI/CD

### Option B: Fix npm Workspace Configuration
**Why:** Keep using npm if preferred

**Steps:**
1. Update package.json to properly configure workspaces
2. Ensure all workspace packages are listed
3. Use `file:` protocol for workspace dependencies
4. Test npm install

**Pros:**
- Keep using npm
- No tooling change

**Cons:**
- npm workspaces are less mature
- May still have issues
- Slower than pnpm

### Option C: Publish @aether/chaos to npm registry
**Why:** Make it available as a regular package

**Steps:**
1. Configure npm registry
2. Publish @aether/chaos package
3. Update dependencies to use published version
4. Set up publishing workflow

**Pros:**
- Works with any package manager
- No workspace issues

**Cons:**
- Requires publishing infrastructure
- Version management complexity
- May not be desired for internal packages

## Recommended Path: Option A (Switch to pnpm)

### Step 1: Clean Up npm Artifacts

```bash
# Remove all node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Remove all package-lock.json
find . -name "package-lock.json" -delete

# Remove .npmrc if it has npm-specific config
```

### Step 2: Verify pnpm Configuration

**File:** `.npmrc`
```
shamefully-hoist=true
strict-peer-dependencies=false
```

**File:** `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Step 3: Install with pnpm

```bash
pnpm install
```

### Step 4: Verify Installation

```bash
# Check if @aether/chaos is resolved
pnpm list @aether/chaos

# Check if all dependencies are installed
pnpm list --depth=0
```

### Step 5: Install Clerk Backend Package

```bash
pnpm add @clerk/backend -w @aether/backend
```

### Step 6: Test Backend Build

```bash
cd apps/backend
pnpm build
```

## Clerk Backend Integration

### Step 1: Install Clerk Backend

```bash
cd apps/backend
pnpm add @clerk/backend
```

### Step 2: Add Clerk Middleware

**File:** `apps/backend/src/middleware/clerk.ts`

```typescript
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { clerkClient } from '@clerk/clerk-sdk-node';

export const requireAuth = ClerkExpressRequireAuth();

export const getUser = async (req: any) => {
  const userId = req.auth.userId;
  const user = await clerkClient.users.getUser(userId);
  return user;
};

export const getSession = async (req: any) => {
  const sessionId = req.auth.sessionId;
  const session = await clerkClient.sessions.getSession(sessionId);
  return session;
};
```

### Step 3: Add Clerk to Environment Variables

**File:** `apps/backend/.env`
```
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WORKSPACE_ID=org_3Ew5hrrD9SYJZvuMPJU4065lGcS
```

### Step 4: Protect API Endpoints

**File:** `apps/backend/server.ts`

```typescript
import { requireAuth, getUser } from './middleware/clerk';

// Protect /api/build endpoint
app.post('/api/build', requireAuth, async (req, res) => {
  const user = await getUser(req);
  console.log('User:', user.id);
  
  // ... existing build logic ...
});

// Protect /api/agents endpoints
app.get('/api/agents', requireAuth, async (req, res) => {
  // ... existing logic ...
});

// Public health endpoint (no auth required)
app.get('/api/stack', async (req, res) => {
  // ... existing logic ...
});
```

### Step 5: Add Session Verification

**File:** `apps/backend/src/middleware/session.ts`

```typescript
import { clerkClient } from '@clerk/clerk-sdk-node';

export async function verifySession(token: string) {
  try {
    const session = await clerkClient.sessions.verifySession(token);
    return session;
  } catch (error) {
    throw new Error('Invalid session');
  }
}
```

### Step 6: Add Webhook Handler

**File:** `apps/backend/server.ts`

```typescript
import { Webhook } from '@clerk/clerk-sdk-node';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

app.post('/webhooks/clerk', async (req, res) => {
  const evt = await Webhook.create({
    payload: req.body,
    secret: webhookSecret,
  });

  switch (evt.type) {
    case 'user.created':
      console.log('User created:', evt.data.id);
      // Handle user creation
      break;
    case 'user.deleted':
      console.log('User deleted:', evt.data.id);
      // Handle user deletion
      break;
    case 'session.created':
      console.log('Session created:', evt.data.id);
      // Handle session creation
      break;
    case 'session.ended':
      console.log('Session ended:', evt.data.id);
      // Handle session end
      break;
    default:
      console.log('Unhandled event:', evt.type);
  }

  res.json({ received: true });
});
```

### Step 7: Add Webhook Secret to Environment

**File:** `apps/backend/.env`
```
CLERK_WEBHOOK_SECRET=whsec_...
```

### Step 8: Test Backend Integration

1. Start backend server
2. Test protected endpoint without auth (should fail)
3. Test protected endpoint with auth (should succeed)
4. Test webhook handler
5. Verify user/session data

## Cloudflare Workers Integration

### Step 1: Add Clerk to Workers

**File:** `apps/bridge/package.json`
```json
{
  "dependencies": {
    "@clerk/backend": "^1.0.0"
  }
}
```

### Step 2: Add Clerk Middleware to Worker

**File:** `apps/bridge/src/worker.ts`

```typescript
import { Clerk } from '@clerk/backend';

const clerk = new Clerk({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

async function verifyAuth(request: Request, env: Env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }
  
  try {
    const session = await clerk.sessions.verifySession(token);
    return session;
  } catch (error) {
    return null;
  }
}

// Use in endpoints
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const session = await verifyAuth(request, env);
    
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // ... existing logic ...
  }
};
```

### Step 3: Add Clerk Secrets to Worker

```bash
wrangler secret put CLERK_SECRET_KEY
wrangler secret put CLERK_PUBLISHABLE_KEY
```

### Step 4: Deploy Worker

```bash
cd apps/bridge
wrangler deploy
```

### Step 5: Test Worker Integration

1. Deploy worker
2. Test endpoint without auth (should fail)
3. Test endpoint with auth (should succeed)
4. Verify session verification

## Migration Checklist

### Workspace Dependency Resolution
- [ ] Clean up npm artifacts
- [ ] Verify pnpm configuration
- [ ] Install with pnpm
- [ ] Verify installation
- [ ] Install Clerk backend package
- [ ] Test backend build

### Backend Integration
- [ ] Add Clerk middleware
- [ ] Add environment variables
- [ ] Protect API endpoints
- [ ] Add session verification
- [ ] Add webhook handler
- [ ] Test backend integration

### Workers Integration
- [ ] Add Clerk to workers
- [ ] Add Clerk middleware to worker
- [ ] Add Clerk secrets
- [ ] Deploy worker
- [ ] Test worker integration

### Documentation
- [ ] Update CLERK_INTEGRATION.md
- [ ] Add backend setup instructions
- [ ] Add Workers setup instructions
- [ ] Add troubleshooting guide

## Rollback Plan

If integration fails:
1. Keep frontend Clerk integration
2. Remove backend middleware
3. Remove Workers middleware
4. Revert to unprotected endpoints
5. Keep workspace dependency resolution

## Benefits

1. **Complete auth** - Full authentication across frontend, backend, and Workers
2. **User management** - Centralized user management via Clerk
3. **Session management** - Secure session handling
4. **Webhook support** - Real-time user events
5. **Consistent auth** - Same auth system across all components

## Estimated Time

- Workspace dependency resolution: 1 hour
- Backend integration: 2 hours
- Workers integration: 1 hour
- Testing: 1 hour
- Documentation: 30 minutes
- Total: ~5.5 hours

## Next Steps

1. Get approval for pnpm migration
2. Resolve workspace dependencies
3. Implement backend integration
4. Implement Workers integration
5. Test complete auth flow
6. Deploy to production
