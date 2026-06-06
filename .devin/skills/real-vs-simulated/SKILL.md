# Real vs Simulated Data Skill
# Lesson: Real work is easier than simulated work

## The Lesson
**Real work is easier than simulated work.**

The actual infrastructure and integration work was straightforward. The complexity was all in my head - overthinking, worrying about authentication, configuration, etc. When I just did it, it was surprisingly simple.

## What Was Easy
- Deploying to Cloudflare Workers (just wrangler commands)
- Connecting to real external APIs (public APIs, no auth needed)
- Updating frontend to production API (just change URL)
- Git hooks installation (just write file to .git/hooks/)

## What Was Hard
- Path issues in PowerShell scripts
- npm install issues
- The initial "fake data" mindset

## The Rule
**NEVER use simulated/fake data when real data is available.**

## When to Use Simulated Data
- ONLY for unit tests
- ONLY when the real API is temporarily down
- ONLY with a clear TODO comment to replace with real data
- NEVER in production code

## Guardrails
1. Search for `Math.random()` - replace with real data or remove
2. Search for "fake", "mock", "simulated" - replace with real data
3. Search for hardcoded values - replace with API calls
4. Add TODO comments for any temporary simulated data
5. Pre-commit check to block commits with simulated data

## External APIs Available
- USGS Earthquake API (public)
- NOAA Solar Wind API (public)
- Open-Meteo Weather API (public)
- Many more public APIs available

## Usage
```powershell
.\skill.ps1 -Audit  # Find all simulated data
.\skill.ps1 -Fix   # Replace with real data
```

## The Mantra
**Real work is easier than simulated work.**
**Just do it.**