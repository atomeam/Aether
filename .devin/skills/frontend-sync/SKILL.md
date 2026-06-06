# Frontend Sync Skill
# Automatically syncs frontend UI with backend API capabilities

## Overview
This skill ensures that the frontend dashboard always reflects the current backend capabilities. It detects when backend APIs are added/modified and automatically updates the frontend UI to show new features.

## Usage
```powershell
.\skill.ps1 -AutoFix
```

## Parameters
- `AutoFix`: Automatically fix detected mismatches (default: true)
- `BackendPath`: Path to backend source (default: apps/api-worker/src, apps/uap-detection/src)
- `FrontendPath`: Path to frontend source (default: src/App.tsx, apps/frontend/src)
- `Verbose`: Show detailed output (default: false)

## How It Works
1. Scans backend API endpoints
2. Scans frontend UI components
3. Detects mismatches between capabilities
4. Auto-generates UI components for missing features
5. Updates existing components to match backend changes
6. Validates the sync

## What It Checks
- API endpoints vs UI components
- Data models vs TypeScript interfaces
- Feature flags vs UI visibility
- Real-time data streams vs UI updates
- New subsystems vs dashboard display

## Auto-Fix Capabilities
- Generate dashboard cards for new APIs
- Add navigation for new features
- Create data visualization components
- Update type definitions
- Add real-time data subscriptions
- Generate documentation

## Example
```powershell
.\skill.ps1 -AutoFix -Verbose
```

## Notes
- Always run this after adding new backend APIs
- Integrates with AGENTS compliance workflow
- Prevents "backend capability without UI visibility" issues
- Auto-generates production-ready UI components