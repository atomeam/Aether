# Aether Developer Onboarding Guide

## Welcome to Aether

Aether is an ALPHA Stack monorepo building autonomous AI agents with governance, chaos engineering, and self-healing capabilities. This guide will help you get started quickly.

## Prerequisites

### Required
- Node.js >=18.0.0
- npm >=10.9.8
- Git
- Code editor (VS Code recommended)

### Optional but Recommended
- Cloudflare account (for Workers operations)
- Vercel account (for deployment)
- Stripe account (for billing integration)

## Quick Start (5 minutes)

### 1. Clone Repository
```bash
cd C:\Users\adamm
git clone https://github.com/atomeam/Aether.git
cd Aether
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development
```bash
# Terminal 1 - Backend (port 3000)
npm run dev:backend

# Terminal 2 - Frontend (port 5173)
npm run dev:frontend
```

### 4. Verify
- Open http://localhost:3000 - Backend health
- Open http://localhost:5173 - Frontend UI

## Project Structure

```
Aether/
├── apps/
│   ├── backend/        # @aether/backend (Express server, port 3000)
│   ├── frontend/     # @aether/frontend (React UI, port 5173)
│   └── bridge/      # @aether/bridge (Cloudflare Worker)
├── packages/
│   ├── contracts/   # Zod schemas for type safety
│   ├── curator/    # Security gate for generated content
│   ├── mcp-tools/  # MCP tool registry
│   ├── logger/     # Logging system
│   ├── metrics/    # Metrics collection
│   └── [35+ more packages]
├── scripts/
│   ├── deploy.ps1       # Deployment automation
│   ├── backup.ps1       # Backup automation
│   ├── restore.ps1      # Restore automation
│   └── health-check.ps1 # Health monitoring
└── docs/
    ├── AGENTS.md              # Agent system documentation
    ├── AGENT-HUB-ASSESSMENT.md # System assessment
    ├── QUICK-REFERENCE.md     # Quick commands reference
    ├── TROUBLESHOOTING.md    # Common issues
    └── OPERATIONAL-RUNBOOKS.md # Operational procedures
```

## Core Concepts

### ALPHA Stack
- **A**gentic AI - Autonomous agents with governance
- **L**ogging - Comprehensive execution tracking
- **P**ersistence - Durable storage and state management
- **H**ealth - System health monitoring
- **A**udit - Decision logging and evaluation

### Two-Agent System
```
User Request → Curator (validates) → APPROVED → Executor (runs tools) → Ledger
                                      → REJECTED → 422 error
```

### MCP Tools
Sandboxed tools for agent operations:
- `file_read` - Read files (workspace-restricted)
- `file_write` - Write files (workspace-restricted)
- `git_status` - Check git status
- `git_commit` - Create commits
- `http_request` - HTTP requests (GET/HEAD only)
- `lessons_write` - Write lessons to database
- `get_agent_state` - Get execution metrics
- `trigger_workflow` - Trigger workflows
- `chaos_inject` - Inject failure patterns

### Agent Loop
Continuous loop connecting:
- Curator → validates actions
- Executor → runs approved actions
- Evaluator → analyzes patterns
- Reflector → learns from outcomes

## Development Workflow

### 1. Make Changes
- Edit code in appropriate package
- Follow existing patterns
- Add tests for new features

### 2. Test Locally
```bash
# Type check
npm run typecheck

# Run tests
npm run test

# Build
npm run build
```

### 3. Commit Changes
```bash
git add .
git commit -m "Description of changes"
```

### 4. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```
- Create pull request on GitHub
- Get required review
- Wait for CI to pass

### 6. Merge
- After approval, merge to main
- CI will deploy automatically

## Common Tasks

### Add New MCP Tool
1. Edit `packages/mcp-tools/src/index.ts`
2. Add tool implementation
3. Add to toolRegistry
4. Test with executor

### Add New Package
1. Create directory in `packages/`
2. Add `package.json` with workspace reference
3. Add to root `package.json` workspaces
4. Implement package
5. Add tests

### Add New API Endpoint
1. Edit `apps/backend/server.ts`
2. Add route handler
3. Add error handling
4. Test endpoint
5. Update documentation

### Add New Agent
1. Create file in `apps/backend/src/agents/`
2. Implement agent logic
3. Add to agent loop if needed
4. Add tests
5. Update documentation

## Testing

### Unit Tests
```bash
# Run all tests
npm run test

# Run specific package tests
npm run test -w @aether/contracts

# Run agent tests
npm run test:agents
```

### Integration Tests
```bash
# Test agent loop
npm run test -w @aether/backend

# Test API endpoints
curl http://localhost:3000/api/health
```

### Manual Testing
1. Start backend: `npm run dev:backend`
2. Start frontend: `npm run dev:frontend`
3. Test features in browser
4. Check logs for errors

## Deployment

### Local Deployment
```bash
# Build
npm run build

# Start production server
npm run start
```

### Vercel Deployment
```bash
pwsh scripts/deploy.ps1 -Target vercel
```

### Cloudflare Deployment
```bash
cd apps/bridge
wrangler deploy
```

### Automated Deployment
```bash
pwsh scripts/deploy.ps1 -Target both
```

## Troubleshooting

### Build Errors
1. Run `npm run typecheck` to identify issues
2. Check import paths
3. Verify dependencies
4. Clear cache: `rm -rf node_modules/.cache`

### Runtime Errors
1. Check logs for error messages
2. Verify environment variables
3. Test API endpoints
4. Review TROUBLESHOOTING.md

### Deployment Issues
1. Check deployment logs
2. Verify environment variables
3. Test build locally
4. Follow DEPLOYMENT-CHECKLIST.md

## Important Files

### Configuration
- `package.json` - Root package configuration
- `turbo.json` - Turborepo pipeline
- `apps/backend/package.json` - Backend dependencies
- `apps/frontend/package.json` - Frontend dependencies

### Agent System
- `apps/backend/src/agents/executor.ts` - Executor agent
- `apps/backend/src/agents/evaluator.ts` - Evaluator agent
- `apps/backend/src/agents/agent-loop.ts` - Agent loop

### Documentation
- `AGENTS.md` - Agent system documentation
- `QUICK-REFERENCE.md` - Quick commands
- `TROUBLESHOOTING.md` - Common issues
- `OPERATIONAL-RUNBOOKS.md` - Operational procedures

## Environment Variables

### Required
- `GEMINI_API_KEY` - Google Gemini API key

### Optional
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `STRIPE_API_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

## Best Practices

### Code Style
- Follow existing patterns
- Use TypeScript for type safety
- Add comments for complex logic
- Keep functions small and focused

### Testing
- Write tests for new features
- Test edge cases
- Mock external dependencies
- Keep tests fast

### Documentation
- Update AGENTS.md for agent changes
- Add comments for complex code
- Document API endpoints
- Keep README files updated

### Security
- Never commit secrets
- Use environment variables
- Validate all inputs
- Follow principle of least privilege

## Resources

### Internal Documentation
- AGENTS.md - Agent system details
- AGENT-HUB-ASSESSMENT.md - System assessment
- QUICK-REFERENCE.md - Quick commands
- TROUBLESHOOTING.md - Common issues
- OPERATIONAL-RUNBOOKS.md - Operational procedures

### External Resources
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Vercel: https://vercel.com/docs
- Turborepo: https://turbo.build/repo/docs
- TypeScript: https://www.typescriptlang.org/docs/

### Tools
- Health Check: `pwsh scripts/health-check.ps1`
- Deployment: `pwsh scripts/deploy.ps1`
- Backup: `pwsh scripts/backup.ps1`
- Restore: `pwsh scripts/restore.ps1`

## Getting Help

### Documentation
- Check relevant documentation files
- Review code comments
- Look at similar implementations

### Team
- Ask questions in team chat
- Create issue for bugs
- Request review for PRs

### Troubleshooting
- Run health check: `pwsh scripts/health-check.ps1`
- Review logs for errors
- Check TROUBLESHOOTING.md
- Follow OPERATIONAL-RUNBOOKS.md

## Next Steps

### First Week
1. Complete Quick Start
2. Read AGENTS.md
3. Explore codebase
4. Make small changes
5. Run tests

### First Month
1. Contribute to features
2. Add tests
3. Fix bugs
4. Review PRs
5. Improve documentation

### Ongoing
1. Stay updated with changes
2. Participate in code reviews
3. Improve documentation
4. Share knowledge
5. Help onboard new developers

## Key Contacts

### Infrastructure
- Cloudflare operations: Use Dashboard
- Vercel deployment: Use Dashboard or script
- Database operations: Check Cloudflare KV

### Development
- Code review: GitHub PRs
- Questions: Team chat
- Issues: GitHub Issues

### Operations
- Incidents: Follow OPERATIONAL-RUNBOOKS.md
- Monitoring: Use health check script
- Alerts: Set up as needed

---

**Version:** 1.0
**Last Updated:** 2026-06-11
**Purpose:** Onboard new developers to Aether project