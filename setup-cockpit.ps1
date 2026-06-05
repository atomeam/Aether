# ============================================================
# DEVIN COCKPIT — mech pilot seat (web) + edge deploy lane
# Builds into the Aether monorepo (apps/cockpit + a CF Worker API).
# Surfaces mech health, eval scores, CIE feed, telemetry, EJECTOR.
# Adds a canary deploy lane: bold to canary, auto-rollback on error spike.
# Run from the Aether repo ROOT.
# ============================================================

[CmdletBinding()]
param([switch]$Force)
$ErrorActionPreference = "Stop"
function Ok($m){ Write-Host "  [OK] $m" -ForegroundColor Green }
function Warn($m){ Write-Host "  [!!] $m" -ForegroundColor Yellow }
function Step($m){ Write-Host "`n=== $m ===" -ForegroundColor Cyan }
if (-not (Test-Path ".git")) { throw "Run from the Aether repo ROOT." }
$repo = (Resolve-Path ".").Path
function Save($Path,$Content){
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    if ((Test-Path $Path) -and -not $Force) { Warn "exists, skipped (-Force): $Path"; return }
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText(($repo+[IO.Path]::DirectorySeparatorChar+($Path -replace '/','\')), ($Content -replace "`r`n","`n"), $enc)
    Ok "wrote $Path"
}

# ------------------------------------------------------------
# 1. STATUS API (Cloudflare Worker) — serves mech state from KV
#    Routes: GET /api/status, POST /api/ingest, POST /api/ejector
# ------------------------------------------------------------
Step "Cockpit status API (worker)"
Save "apps/cockpit/api/status.ts" @'
// Devin Cockpit status API. Reads mech state from KV (binding: MECH_STATE).
// mech.ps1 telemetry/doctor push JSON here via POST /api/ingest.
export interface Env { MECH_STATE: KVNamespace; INGEST_TOKEN: string }

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return json({}, 204);

    if (url.pathname === "/api/status") {
      const [doctor, guard, telem, cie, evals, ejector] = await Promise.all([
        env.MECH_STATE.get("doctor", "json"),
        env.MECH_STATE.get("guard", "json"),
        env.MECH_STATE.get("telemetry_latest", "json"),
        env.MECH_STATE.get("cie_queue", "json"),
        env.MECH_STATE.get("eval_scorecard", "json"),
        env.MECH_STATE.get("ejector", "json"),
      ]);
      return json({ doctor, guard, telemetry: telem, cie, evals, ejector, ts: new Date().toISOString() });
    }

    // Authenticated ingest from mech.ps1 (Bearer INGEST_TOKEN)
    if (url.pathname === "/api/ingest" && req.method === "POST") {
      if (req.headers.get("authorization") !== `Bearer ${env.INGEST_TOKEN}`) return json({ error: "unauthorized" }, 401);
      const body = await req.json<{ key: string; value: unknown }>();
      if (!body?.key) return json({ error: "key required" }, 400);
      await env.MECH_STATE.put(body.key, JSON.stringify(body.value));
      return json({ ok: true, key: body.key });
    }

    // Ejector toggle (the kill-switch the loops read)
    if (url.pathname === "/api/ejector" && req.method === "POST") {
      if (req.headers.get("authorization") !== `Bearer ${env.INGEST_TOKEN}`) return json({ error: "unauthorized" }, 401);
      const { engaged } = await req.json<{ engaged: boolean }>();
      await env.MECH_STATE.put("ejector", JSON.stringify({ engaged: !!engaged, at: new Date().toISOString() }));
      return json({ ok: true, engaged: !!engaged });
    }

    return json({ error: "not found" }, 404);
  },
};
'@

# ------------------------------------------------------------
# 2. DASHBOARD (React) — the pilot seat
# ------------------------------------------------------------
Step "Cockpit dashboard (React)"
Save "apps/cockpit/src/Cockpit.tsx" @'
import { useEffect, useState } from "react";

type Status = {
  doctor?: { score: number; checks: { name: string; ok: boolean }[] };
  guard?: { alerts: string[] };
  telemetry?: { branch: string; commits_24h: number };
  cie?: { open: number };
  evals?: { passRate: number };
  ejector?: { engaged: boolean };
};

const API = import.meta.env.VITE_COCKPIT_API ?? "/api";

export default function Cockpit() {
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() { setS(await (await fetch(`${API}/status`)).json()); }
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  async function eject(engaged: boolean) {
    setBusy(true);
    await fetch(`${API}/ejector`, { method: "POST", headers: { authorization: `Bearer ${import.meta.env.VITE_COCKPIT_TOKEN}` }, body: JSON.stringify({ engaged }) });
    await load(); setBusy(false);
  }

  const score = s?.doctor?.score ?? 0;
  const armorOk = (s?.guard?.alerts?.length ?? 0) === 0;
  const ejected = s?.ejector?.engaged ?? false;

  return (
    <div style={{ fontFamily: "ui-sans-serif", padding: 24, background: "#0b0d12", color: "#e6e8ee", minHeight: "100vh" }}>
      <h1>🤖 Devin Cockpit</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
        <Card title="Readiness" value={`${score}%`} good={score >= 80} />
        <Card title="Armor" value={armorOk ? "INTACT" : `${s?.guard?.alerts?.length} ALERTS`} good={armorOk} />
        <Card title="CIE proposals" value={`${s?.cie?.open ?? 0} open`} good />
        <Card title="Eval pass rate" value={`${Math.round((s?.evals?.passRate ?? 0) * 100)}%`} good={(s?.evals?.passRate ?? 0) >= 0.8} />
        <Card title="Branch" value={s?.telemetry?.branch ?? "—"} good />
        <Card title="Commits 24h" value={`${s?.telemetry?.commits_24h ?? 0}`} good />
      </div>

      <div style={{ marginTop: 24 }}>
        <button disabled={busy} onClick={() => eject(!ejected)}
          style={{ background: ejected ? "#16a34a" : "#dc2626", color: "#fff", border: 0, padding: "14px 28px", fontSize: 18, borderRadius: 10, cursor: "pointer" }}>
          {ejected ? "▶ RESUME MECH" : "■ EJECT (kill all loops)"}
        </button>
        {ejected && <span style={{ marginLeft: 12, color: "#fbbf24" }}>Ejector engaged — autonomous loops halted.</span>}
      </div>

      {!armorOk && (
        <div style={{ marginTop: 16, background: "#3b0d0d", padding: 12, borderRadius: 8 }}>
          <b>Armor alerts:</b>
          <ul>{s?.guard?.alerts?.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function Card({ title, value, good }: { title: string; value: string; good?: boolean }) {
  return (
    <div style={{ background: "#151823", borderRadius: 12, padding: 16, borderLeft: `4px solid ${good ? "#22c55e" : "#ef4444"}` }}>
      <div style={{ opacity: 0.7, fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
'@

# ------------------------------------------------------------
# 3. PUSHER — mech.ps1 -> Cockpit ingest (so the site shows live state)
# ------------------------------------------------------------
Step "Mech -> Cockpit pusher"
Save ".devin/mech/push.ps1" @'
param([Parameter(Mandatory)][string]$ApiBase, [Parameter(Mandatory)][string]$Token)
# Pushes local mech JSON to the Cockpit API. Run after doctor/guard/telemetry.
function Push($key,$file){
  if (-not (Test-Path $file)) { return }
  $val = Get-Content $file -Raw
  Invoke-RestMethod -Method Post -Uri "$ApiBase/api/ingest" -Headers @{ Authorization = "Bearer $Token" } `
    -ContentType "application/json" -Body (@{ key=$key; value=($val | ConvertFrom-Json) } | ConvertTo-Json -Depth 25)
  Write-Host "pushed $key" -ForegroundColor Green
}
Push "doctor"           ".devin/mech/doctor.json"
Push "guard"            ".devin/mech/guard.json"
Push "telemetry_latest" ".devin/mech/telemetry_latest.json"
Push "eval_scorecard"   ".devin/mech/eval_scorecard.json"
'@

# ------------------------------------------------------------
# 4. EDGE LANE — canary deploy with auto-rollback ("live on edge")
# ------------------------------------------------------------
Step "Canary deploy + auto-rollback"
Save ".devin/mech/canary.ps1" @'
param(
  [Parameter(Mandatory)][string]$HealthUrl,   # canary health endpoint
  [int]$Samples = 20, [int]$IntervalSec = 3, [double]$MaxErrorRate = 0.05
)
# Bold deploy, safe landing. Deploy to canary, watch error rate, promote or revert.
$ErrorActionPreference = "Stop"
function Say($m,$c="Cyan"){ Write-Host $m -ForegroundColor $c }

Say "Deploying to CANARY (no prod traffic shifted yet)..."
& cmd /c "npx wrangler deploy --env canary"   # uses your existing wrangler env; never edited by Devin
if ($LASTEXITCODE -ne 0) { Say "Canary deploy failed; prod untouched." Red; exit 1 }

Say "Watching canary health ($Samples samples)..."
$errors = 0
for ($i=1; $i -le $Samples; $i++) {
  try { $r = Invoke-WebRequest -Uri $HealthUrl -TimeoutSec 8 -UseBasicParsing; if ($r.StatusCode -ge 500) { $errors++ } }
  catch { $errors++ }
  Start-Sleep -Seconds $IntervalSec
}
$rate = [math]::Round($errors / $Samples, 3)
Say "Canary error rate: $rate (threshold $MaxErrorRate)"

if ($rate -le $MaxErrorRate) {
  Say "HEALTHY -> promoting canary to production." Green
  & cmd /c "npx wrangler deploy --env production"
} else {
  Say "ERROR SPIKE -> AUTO-ROLLBACK. Production was never promoted." Yellow
  & cmd /c "npx wrangler rollback --env canary"
  exit 2
}
'@

Step "Done - Devin Cockpit + edge lane scaffolded"
Write-Host "  API:       apps/cockpit/api/status.ts   (bind KV: MECH_STATE; secret: INGEST_TOKEN)"
Write-Host "  UI:        apps/cockpit/src/Cockpit.tsx  (set VITE_COCKPIT_API / VITE_COCKPIT_TOKEN)"
Write-Host "  Pusher:    .devin/mech/push.ps1"
Write-Host "  Edge lane: .devin/mech/canary.ps1"
Ok "Pilot seat online. Live on the canary edge, not the prod cliff."