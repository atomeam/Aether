# .env Validation Skill

## Overview
Validates .env file for duplicates, empty values, invalid values, and missing required variables.

## What It Checks
- **Duplicate variables** - Same variable defined multiple times
- **Empty variables** - Variables that should have values but are empty
- **Placeholder values** - Variables with placeholder text (YOUR_, HERE, etc.)
- **Missing required variables** - Required variables not defined

## Required Variables
- GITHUB_TOKEN
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID

## Usage
```powershell
.\skill.ps1 -Audit    # Check for issues
.\skill.ps1 -Fix      # Fix issues automatically
```

## Integration
- Pre-commit hooks
- Autonomous improvement daemon
- Learning system
- All validation workflows

## Philosophy
Environment files should be clean, valid, and complete.