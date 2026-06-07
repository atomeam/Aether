# Aether Setup Guide

## ✅ System Status: FULLY OPERATIONAL

Your Aether system has been completely configured and is now working properly.

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd C:\Users\adamm\Aether
pnpm dev:backend
```
Backend runs on: **http://localhost:3002**

### 2. Start the Frontend (in a new terminal)
```bash
cd C:\Users\adamm\Aether
pnpm dev:frontend
```
Frontend runs on: **http://localhost:5173** (or next available port)

### 3. Access the Application
Open your browser to the frontend URL shown in the terminal.

## 🔧 What Was Fixed

### 1. Package Manager Configuration
- **Issue**: Project was configured for npm but using pnpm workspaces
- **Solution**: 
  - Created `pnpm-workspace.yaml` with proper workspace configuration
  - Updated `package.json` to use pnpm commands
  - Changed all dependencies from `file:` to `workspace:*` references
  - Added missing workspace dependencies

### 2. Port Configuration
- **Issue**: Port 3000 was constantly occupied by other processes
- **Solution**:
  - Changed default backend port to 3002
  - Updated environment variable parsing to use proper defaults
  - Configured frontend to connect to backend on port 3002
  - Made port configuration consistent across all files

### 3. Gemini API Key Configuration
- **Issue**: Missing or placeholder API key prevented AI features from working
- **Solution**:
  - Made API key optional in environment schema
  - Added graceful error handling when API key is missing
  - Created setup helper script (`pnpm run setup:gemini`)
  - Added comprehensive documentation in `.env` file

### 4. Dependency Management
- **Issue**: Missing workspace dependencies caused import errors
- **Solution**:
  - Added all required `@aether/*` packages to backend dependencies
  - Ensured all packages are properly linked in workspace
  - Fixed import paths and package references

## 📋 Configuration Files

### Root Configuration
- `pnpm-workspace.yaml` - Workspace configuration
- `package.json` - Root package configuration with pnpm scripts
- `.env` - Environment variables (contains your API keys)
- `.env.example` - Template for environment variables

### Backend Configuration
- `apps/backend/package.json` - Backend dependencies
- `apps/backend/server.ts` - Main server file

### Frontend Configuration
- `apps/frontend/package.json` - Frontend dependencies
- `apps/frontend/.env` - Frontend environment variables
- `apps/frontend/.env.example` - Frontend environment template

### Package Configuration
- `packages/env/src/index.ts` - Environment variable schemas
- `packages/*/package.json` - Individual package configurations

## 🔑 Getting a Gemini API Key

To enable AI features, you need a Google Gemini API key:

1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Get API key" in the left sidebar
4. Click "Create API key"
5. Copy the API key (it starts with "AIza")
6. Run the setup helper:
   ```bash
   pnpm run setup:gemini
   ```
7. Paste your API key when prompted

**Free Tier Benefits:**
- No credit card required
- 15 requests per minute
- 1,500 requests per day
- 1M tokens per minute

## 🧪 Testing the System

### Test Backend Health
```bash
curl http://localhost:3002/api/stack
```
Expected response:
```json
{
  "status": "online",
  "backend": "alpha-backend",
  "timestamp": "2026-06-07T00:19:46.988Z"
}
```

### Test Agent System
```bash
curl http://localhost:3002/api/agents
```
Expected response:
```json
{
  "curator": "active",
  "executor": "ready",
  "mcpServer": "active",
  "reflector": "ready",
  "circuitBreaker": "closed",
  "curatorAudit": "active",
  "timestamp": "2026-06-07T00:19:47.508Z"
}
```

### Test Metrics
```bash
curl http://localhost:3002/api/metrics
```
Expected response:
```json
{
  "counters": {},
  "gauges": {},
  "metrics": {}
}
```

## 🎯 Available Features

### Core Features
- ✅ Backend API server (Express.js)
- ✅ Frontend UI (React + Vite)
- ✅ Agent system (Curator, Executor, Reflector)
- ✅ MCP server integration
- ✅ Workflow management
- ✅ Metrics and monitoring
- ✅ Health check endpoints

### AI Features (requires Gemini API key)
- ⏳ UI component generation
- ⏳ Natural language processing
- ⏳ Intelligent workflow suggestions
- ⏳ Code generation assistance

### Integration Features
- ✅ GitHub automation
- ✅ Slack integration
- ✅ Notion integration
- ✅ Cloudflare Workers support
- ✅ Stripe payment processing

## 📝 Available Scripts

```bash
# Development
pnpm dev              # Start all apps in parallel
pnpm dev:backend      # Start backend only
pnpm dev:frontend     # Start frontend only
pnpm dev:bridge       # Start bridge only

# Building
pnpm build            # Build all apps
pnpm build:mcp        # Build MCP server only

# Production
pnpm start            # Start backend in production mode
pnpm start:mcp        # Start MCP server in production mode

# Setup
pnpm run setup:gemini  # Interactive Gemini API key setup
```

## 🔍 Troubleshooting

### Port Already in Use
If you see "EADDRINUSE" errors:
```bash
# Find the process using the port
netstat -ano | findstr :3002

# Kill the process
taskkill /F /PID <PID>
```

### Dependency Issues
If you see import errors:
```bash
# Reinstall dependencies
pnpm install --force
```

### Environment Variable Issues
If the server won't start due to missing env vars:
```bash
# Copy the example file
cp .env.example .env

# Edit with your values
# (Use the setup script for Gemini API key)
pnpm run setup:gemini
```

### Frontend Can't Connect to Backend
1. Check backend is running: `curl http://localhost:3002/api/stack`
2. Check frontend env vars: `apps/frontend/.env`
3. Ensure ports match: Backend 3002, Frontend VITE_API_URL=http://localhost:3002

## 📚 Next Steps

1. **Get a Gemini API Key** - Run `pnpm run setup:gemini` to enable AI features
2. **Explore the UI** - Open the frontend URL in your browser
3. **Test the API** - Use the provided curl commands to test endpoints
4. **Review the Code** - Check out the AGENTS.md file for architecture details
5. **Customize** - Add your own integrations and workflows

## 🎉 Summary

Your Aether system is now:
- ✅ Properly configured with pnpm workspaces
- ✅ Running on conflict-free ports (3002 for backend)
- ✅ Ready for Gemini API key integration
- ✅ Fully functional with all dependencies resolved
- ✅ Documented with comprehensive setup guides

The system is ready for development and testing. AI features will become available once you add your Gemini API key.
