# Frontend-Backend Sync Compliance Check
# Ensures frontend UI always reflects backend API capabilities

## Overview
This compliance check validates that the frontend dashboard is in sync with backend API capabilities. It prevents the "backend capability without UI visibility" issue.

## When to Run
- Before every commit (pre-commit hook)
- During AGENTS compliance workflow
- In CI/CD pipeline
- Before PR creation

## What It Checks
1. Backend API endpoints exist
2. Frontend UI components exist for each endpoint
3. Dashboard displays all subsystems
4. Real API calls are made (not static data)
5. Type definitions match backend responses

## Failure Conditions
- Backend endpoint without UI component → FAIL
- UI component without backend endpoint → WARNING
- Dashboard shows static data instead of real API calls → FAIL
- Type definitions don't match → WARNING

## Auto-Fix
- Generate UI components for missing endpoints
- Update dashboard to use real API calls
- Update type definitions to match backend

## Integration
Add to AGENTS compliance workflow:
```json
{
  "checks": [
    "lint",
    "typecheck",
    "test",
    "secret-detection",
    "frontend-backend-sync"
  ]
}
```

## Exit Codes
- 0: Frontend is in sync with backend
- 1: Critical mismatches found
- 2: Warnings found (non-blocking)