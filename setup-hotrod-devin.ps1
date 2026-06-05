# ============================================================
# HOTROD DEVIN — lean + fast build
# Stripped-down config tuned for speed and iteration velocity.
# Keeps only the floor that prevents a repo-wrecking mistake.
# Run from the Aether repo ROOT.
# ============================================================

[CmdletBinding()]
param([switch]$Force)

$ErrorActionPreference = "Stop"
function Ok($m){ Write-Host "  [OK] $m" -ForegroundColor Green }
function Warn($m){ Write-Host "  [!!] $m" -ForegroundColor Yellow }
function Step($m){ Write-Host "`n=== $m ===" -ForegroundColor Cyan }

if (-not (Test-Path ".git")) { throw "Run from the Aether repo ROOT (no .git found)." }
$repo = (Resolve-Path ".").Path

function Save($Path,$Content){
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    if ((Test-Path $Path) -and -not $Force) { Warn "exists, skipped (-Force): $Path"; return }
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText(($repo + [IO.Path]::DirectorySeparatorChar + ($Path -replace '/','\')), ($Content -replace "`r`n","`n"), $enc)
    Ok "wrote $Path"
}

# ------------------------------------------------------------
# 1. Lean, fast config — fast model, parallel, low ceremony
# ------------------------------------------------------------
Step "config.json (hotrod profile)"
Save ".devin/config.json" @'
{
  "model": "swe-1-6-fast",
  "mode": "accept-edits",
  "performance": {
    "parallelToolCalls": true,
    "maxParallelTools": 6,
    "streaming": true,
    "cachePromptPrefix": true,
    "skipRedundantFileReads": true,
    "earlyExitOnGreen": true
  },
  "context": {
    "leanMode": true,
    "maxFilesPerRead": 8,
    "autoCompactAtPercent": 55,
    "preferGrepOverFullRead": true
  },
  "verify": {
    "fastChecksFirst": ["typecheck", "lint"],
    "testScope": "changed-only",
    "fullSuiteOnlyBeforePR": true
  },
  "guardrails": {
    "noPushToMain": true,
    "noWranglerEdits": true,
    "blockSecrets": true,
    "evidenceForDone": true
  }
}
'@

# ------------------------------------------------------------
# 2. Tight AGENTS.md — short on purpose (less context = faster)
# ------------------------------------------------------------
Step "AGENTS.md (tight)"
Save "AGENTS.md" @'
# Aether — Agent Rules (hotrod)

## Stack
Turborepo / TypeScript / React+Vite / Cloudflare Workers (wrangler) / D1, KV, Queues, R2.
Subdomains: aether, bridge, notion, billing, grants, crew, home.

## Speed rules
- Grep before reading whole files. Read only what you'll edit.
- Smallest diff that satisfies the task. No drive-by refactors.
- typecheck + lint on changed files first; full test suite only before opening the PR.
- Parallelize independent reads/edits.

## Hard floor (do not cross)
- Feature branch + PR only. NEVER push to main.
- NEVER edit wrangler.toml (Viktor's lane).
- NEVER commit secrets (.env/.pem/.key).
- NEVER report "done" without the verbatim command output that proves it.

## Superpackages (available)
- Notion integration: Read-first workspace awareness (requires org allowlist)
- Gemini uplink: Deep reasoning for complex infrastructure (requires GEMINI_API_KEY)

## Done =
changed-file tests green + typecheck + lint clean (paste output) + PR opened.
'@

# ------------------------------------------------------------
# 3. One fast-loop helper — quick green check before PR
# ------------------------------------------------------------
Step "fast-check helper"
Save ".devin/fastcheck.ps1" @'
# Quick pre-PR green check. Fast checks first, bail on first failure.
$ErrorActionPreference = "Continue"
$steps = @("pnpm run typecheck --filter=!@aether/weekly-digest --filter=!@aether/aether-verifier")
foreach ($s in $steps) {
  Write-Host "-> $s" -ForegroundColor Cyan
  & cmd /c "$s"
  if ($LASTEXITCODE -ne 0) { Write-Host "FAIL: $s (exit $LASTEXITCODE)" -ForegroundColor Red; exit 1 }
}
Write-Host "ALL GREEN" -ForegroundColor Green
'@

Step "Done - Hotrod Devin installed"
Write-Host "  config:    .devin/config.json   (swe-1-6-fast, parallel, lean context)"
Write-Host "  rules:     AGENTS.md            (tight = fast)"
Write-Host "  fastcheck: .devin/fastcheck.ps1 (green check before PR)"
Ok "Run it lean. Run it fast."