# Cockpit Deployment Guide

## What I've Done

✅ Created `apps/cockpit/wrangler.toml` with:
- Durable Object binding for TelemetryHub
- KV namespace binding for MECH_STATE
- Routes configuration for devin.a-to-mind.com
- Migration for Durable Object

✅ All code is ready:
- API worker (`api/index.ts`, `api/telemetry-hub.ts`)
- React dashboard (`src/Cockpit.tsx`, `src/Hud.tsx`)
- Local uplink agent (`.devin/mech/uplink.ps1`)

## What You Need to Do

### 1. Set Cloudflare Credentials

```powershell
# Set your Cloudflare API token
$env:CLOUDFLARE_API_TOKEN = "your_api_token_here"

# Or set it permanently in system environment variables
```

Get your token from: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/

### 2. Create KV Namespace

```powershell
cd apps/cockpit
npx wrangler kv namespace create MECH_STATE
```

This will output an ID like `abc123def456`. Update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "MECH_STATE"
id = "abc123def456"  # Replace with actual ID from command output
```

### 3. Set Secrets

```powershell
npx wrangler secret put UPLINK_TOKEN
npx wrangler secret put VIEWER_TOKEN
npx wrangler secret put INGEST_TOKEN
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put WEBHOOK_TOKEN
```

Use strong random tokens for each. For GITHUB_TOKEN, create a GitHub Personal Access Token with `repo` scope.

### 5. Deploy

```powershell
npx wrangler deploy
```

## Custom Domain Setup (Manual DNS Update Required)

**IMPORTANT:** cockpit.a-to-mind.com is currently pointing to an old site. You need to manually update the DNS record.

### Option 1: Update Existing DNS Record (Recommended)

1. Go to Cloudflare Dashboard → DNS → Records
2. Find the existing `cockpit` CNAME record
3. **Update the target to:** `cockpit.atomicmoonbeam88.workers.dev`
4. Ensure proxy status is: Proxied (orange cloud)
5. Save changes
6. Wait 5-15 minutes for DNS propagation
7. Access: https://cockpit.a-to-mind.com

### Option 2: Use Direct Worker URL (Immediate Access)

**Access the cockpit directly right now:**
https://cockpit.atomicmoonbeam88.workers.dev

This bypasses DNS completely and goes straight to the Cloudflare worker with the complete mech system.

### Option 3: Use Different Subdomain

If you prefer not to update the existing DNS:
- Use: devin.a-to-mind.com (requires enhanced API token permissions)
- Or: mech.a-to-mind.com (requires enhanced API token permissions)

### 7. Start Local Uplink

```powershell
# From repo root
.\.devin\mech\uplink.ps1 -IngestUrl "https://cockpit.a-to-mind.com" -Token "<UPLINK_TOKEN>"
```

### 8. Access Cockpit

**Primary:** https://cockpit.a-to-mind.com (after DNS configuration)
**Direct:** https://cockpit.atomicmoonbeam88.workers.dev (immediate access)

## Environment Variables for React Dashboard

Set these in your `.env` or deployment platform:

```bash
VITE_COCKPIT_API=https://cockpit.a-to-mind.com/api
VITE_COCKPIT_WS=wss://cockpit.a-to-mind.com/api/ws
VITE_COCKPIT_TOKEN=<INGEST_TOKEN>
VITE_COCKPIT_VIEWER_TOKEN=<VIEWER_TOKEN>
```

## Security

Put the cockpit behind Cloudflare Access:
- Go to Cloudflare Zero Trust
- Add devin.a-to-mind.com to your Access policy
- Only you can access the HUD

## Troubleshooting

**"Unexpected fields found in kv_namespaces" error:**
- Fixed by separating routes into its own section

**"CLOUDFLARE_API_TOKEN required" error:**
- Set the environment variable before running wrangler commands

**WebSocket connection fails:**
- Check VIEWER_TOKEN matches between secret and React env
- Verify Durable Object deployed successfully
- Check Cloudflare Access isn't blocking WebSocket connections