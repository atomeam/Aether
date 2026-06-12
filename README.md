# Aether - ALPHA Stack Monorepo

Welcome to Aether! This is the ALPHA Stack monorepo with npm workspaces.

## 🚀 Quick Start - Get Pro Access

**Get your API key now:**
```
https://bridge.a-to-mind.com/pay?amount=49&email=YOUR_EMAIL
```

**Pro Tier ($49 USD):**
- API key with priority rate limits
- Council session logs & replay
- Email support
- Multi-chain crypto payments (Base, Ethereum, Polygon)

## Development Quick Start

```bash
# Clone and install
cd Aether
npm install
npm run dev
```

## Two Terminals Required

### Terminal 1 (Backend)

```bash
npm run dev:backend
```

### Terminal 2 (Frontend)

```bash
npm run dev:frontend
```

### Then open in browser

```text
http://localhost:5173
```

## Project Structure

```text
aether/
├── apps/
│   ├── backend/        # @aether/backend — express API, deployed to Vercel (port 3000 local)
│   ├── frontend/       # @aether/frontend (port 5173)
│   ├── bridge/         # @aether/bridge — Cloudflare Worker (bridge.a-to-mind.com)
│   ├── aether-verifier/  crew-room/  homebase/  notion-worker/  weekly-digest/
├── packages/           # 40+ shared packages (council, curator, alerts, …)
├── src/                # Apex SPA (Vite + React) served at a-to-mind.com
├── docs/               # See docs/README.md for the index
├── STATUS.md           # Current state + money roadmap — read this first
├── vercel.json         # Apex deploy (backend bundle + /api/* routes)
└── wrangler.toml       # Bridge worker deploy (via CI only)
```

## Deploy & env

- Vercel (apex): set `GEMINI_API_KEY`, `ALLOW_DEGRADED=1`, `NODE_ENV=production`.
- Bridge (Cloudflare): deploys via CI — never `wrangler deploy` from local. Billing needs `STRIPE_WEBHOOK_SECRET` secret.

## Scripts

| Script | Description |
|--------|-----------|
| `npm run dev` | Run all dev servers |
| `npm run dev:backend` | Start backend on port 3000 |
| `npm run dev:frontend` | Start frontend on port 5173 |
| `npm run build` | Build all packages |
| `npm run test` | Run tests |

## Testing

Run tests with Turborepo:

```bash
npx turbo run test
```

Or test individual packages:

```bash
npm run test -w @aether/contracts
```
