# Frontend Sync Guard
# Automatically ensures frontend UI matches backend API capabilities

## Overview
This guard skill automatically runs frontend-backend sync whenever backend changes are detected. It prevents the "backend capability without UI visibility" issue.

## When It Runs
- After any backend file changes (*.ts in apps/*)
- Before commit (via pre-commit hook)
- During AGENTS compliance workflow
- On demand via skill invocation

## What It Does
1. Detects backend API changes
2. Scans for missing UI components
3. Auto-generates UI components for new endpoints
4. Updates dashboard to use real API calls
5. Validates type definitions
6. Reports sync status

## Auto-Fix Behavior
- Generates React components for new endpoints
- Adds imports to App.tsx
- Updates dashboard with real data fetching
- Creates type definitions from backend schemas
- Adds navigation for new features

## Integration
This skill is automatically invoked by:
- Pre-commit hooks
- AGENTS compliance workflow
- Manual invocation: `.\skill.ps1`

## Exit Codes
- 0: Frontend is in sync with backend
- 1: Critical mismatches found (auto-fix attempted)
- 2: Warnings found (non-blocking)