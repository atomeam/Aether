# Pre-Commit Hooks Skill
# Automatically runs compliance checks before commits

## Overview
This skill configures and manages pre-commit hooks to ensure code quality and compliance before every commit.

## Usage
```powershell
.\skill.ps1 -Install
.\skill.ps1 -Run
```

## Parameters
- `Install`: Install pre-commit hooks
- `Run`: Run all pre-commit checks manually
- `Skip`: Skip specific checks (comma-separated)

## Pre-Commit Checks
1. **Frontend-Backend Sync** - Ensures UI matches backend APIs
2. **Lint** - Code style checks
3. **Typecheck** - TypeScript type checking
4. **Secret Detection** - Prevents committing secrets
5. **AGENTS Compliance** - Full compliance workflow

## Integration
Hooks are installed via Git hooks in `.git/hooks/pre-commit`

## Exit Codes
- 0: All checks passed
- 1: Critical check failed (blocks commit)
- 2: Warning check failed (non-blocking)