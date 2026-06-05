# ============================================================
# NERVOUS SYSTEM UPLINK — real-time telemetry relay (HUD)
# Cloudflare Durable Object WebSocket fan-out + local uplink agent.
# Streams Devin's REAL working set / test output / sub-agent status
# to the cockpit. Telemetry only — never deploys. No mock data.
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
# 1. DURABLE OBJECT — WebSocket relay (hibernation API)
#    Browsers subscribe on /ws; Devin's uplink POSTs to /ingest.
# ------------------------------------------------------------
Step "Telemetry Hub (Durable Object)"
Save "apps/cockpit/api/telemetry-hub.ts" @'
// TelemetryHub: fan-out relay. Telemetry ONLY. Cannot deploy anything.
export interface Env { TELEMETRY_HUB: DurableObjectNamespace; UPLINK_TOKEN: string; VIEWER_TOKEN: string }

export class TelemetryHub {
  state: DurableObjectState;
  env: Env;
  constructor(state: DurableObjectState, env: Env) { this.state = state; this.env = env; }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Browser subscribes (token-gated). Hibernation WebSocket API.
    if (url.pathname.endsWith("/ws")) {
      if (url.searchParams.get("t") !== this.env.VIEWER_TOKEN) return new Response("unauthorized", { status: 401 });
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      // Replay the last known frame so a fresh cockpit isn't blank (real, last-seen data only).
      const last = await this.state.storage.get<string>("last");
      if (last) pair[1].send(last);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    // Devin's local uplink pushes a REAL event (Bearer UPLINK_TOKEN).
    if (url.pathname.endsWith("/ingest") && req.method === "POST") {
      if (req.headers.get("authorization") !== `Bearer ${this.env.UPLINK_TOKEN}`) return new Response("unauthorized", { status: 401 });
      const body = await req.text();           // raw JSON event from the agent
      await this.state.storage.put("last", body);
      for (const ws of this.state.getWebSockets()) { try { ws.send(body); } catch {} }
      return new Response(JSON.stringify({ ok: true, fanout: this.state.getWebSockets().length }), { headers: { "content-type": "application/json" } });
    }
    return new Response("not found", { status: 404 });
  }

  // Hibernation handlers (keep connections cheap)
  async webSocketMessage(ws: WebSocket, msg: string) { /* HUD is read-only; ignore client msgs */ }
  async webSocketClose(ws: WebSocket) { try { ws.close(); } catch {} }
}
'@

# ------------------------------------------------------------
# 2. WORKER ROUTER — routes /api/ws and /api/ingest to the single hub
# ------------------------------------------------------------
Step "Worker router"
Save "apps/cockpit/api/index.ts" @'
import { TelemetryHub } from "./telemetry-hub";
export { TelemetryHub };
export interface Env { TELEMETRY_HUB: DurableObjectNamespace; UPLINK_TOKEN: string; VIEWER_TOKEN: string }

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/ws") || url.pathname.startsWith("/api/ingest")) {
      const id = env.TELEMETRY_HUB.idFromName("global");   // one shared hub
      return env.TELEMETRY_HUB.get(id).fetch(req);
    }
    return new Response("not found", { status: 404 });
  },
};
'@

# ------------------------------------------------------------
# 3. LOCAL UPLINK AGENT — tails REAL files; sends real events only
# ------------------------------------------------------------
Step "Local uplink agent (.devin/mech/uplink.ps1)"
Save ".devin/mech/uplink.ps1" @'
param(
  [Parameter(Mandatory)][string]$IngestUrl,   # https://devin.a-to-mind.com/api/ingest
  [Parameter(Mandatory)][string]$Token,
  [int]$IntervalSec = 2
)
# Streams Devin's REAL state to the cockpit. No synthetic data:
# if a source file is absent, we send {present:false} so the HUD shows an empty state.
$ErrorActionPreference = "Continue"
$ws   = ".devin/memory/WORKING_SET.md"
$sess = ".devin/memory/SESSION.md"
$test = ".devin/mech/last-test-output.txt"   # AgentCoder loop writes real test output here
$sub  = ".devin/mech/subagent-status.json"   # council/verifier writes real status here

function ReadOrNull($p){ if (Test-Path $p) { (Get-Content $p -Raw) } else { $null } }
function Send($evt){
  try { Invoke-RestMethod -Method Post -Uri $IngestUrl -Headers @{ Authorization = "Bearer $Token" } `
        -ContentType "application/json" -Body $evt | Out-Null }
  catch { Write-Host "uplink send failed: $($_.Exception.Message)" -ForegroundColor Yellow }
}

Write-Host "Uplink streaming REAL state every ${IntervalSec}s. Ctrl+C to stop." -ForegroundColor Cyan
$lastHash = ""
while ($true) {
  $branch = (& git rev-parse --abbrev-ref HEAD 2>$null)
  $payload = @{
    ts          = [DateTime]::UtcNow.ToString("o")
    branch      = $branch
    workingSet  = ReadOrNull $ws
    session     = ReadOrNull $sess
    testOutput  = ReadOrNull $test
    subagents   = if (Test-Path $sub) { (Get-Content $sub -Raw | ConvertFrom-Json) } else { $null }
  }
  $json = $payload | ConvertTo-Json -Depth 25 -Compress
  $hash = [System.BitConverter]::ToString((New-Object Security.Cryptography.SHA1Managed).ComputeHash([Text.Encoding]::UTF8.GetBytes($json)))
  if ($hash -ne $lastHash) { Send $json; $lastHash = $hash; Write-Host "." -NoNewline -ForegroundColor Green }  # send only on real change
  Start-Sleep -Seconds $IntervalSec
}
'@

# ------------------------------------------------------------
# 4. HUD PANEL (React) — connects to wss, renders the live feed
# ------------------------------------------------------------
Step "HUD panel (React)"
Save "apps/cockpit/src/Hud.tsx" @'
import { useEffect, useRef, useState } from "react";

type Frame = {
  ts: string; branch?: string; workingSet?: string | null; session?: string | null;
  testOutput?: string | null; subagents?: { name: string; status: string }[] | null;
};
const WS = (import.meta.env.VITE_COCKPIT_WS ?? "wss://devin.a-to-mind.com/api/ws")
  + `?t=${import.meta.env.VITE_COCKPIT_VIEWER_TOKEN}`;

export default function Hud() {
  const [frame, setFrame] = useState<Frame | null>(null);
  const [live, setLive] = useState(false);
  const ref = useRef<WebSocket | null>(null);

  useEffect(() => {
    let stop = false;
    function connect() {
      const ws = new WebSocket(WS); ref.current = ws;
      ws.onopen = () => setLive(true);
      ws.onclose = () => { setLive(false); if (!stop) setTimeout(connect, 1500); };
      ws.onmessage = (e) => { try { setFrame(JSON.parse(e.data)); } catch {} };
    }
    connect();
    return () => { stop = true; ref.current?.close(); };
  }, []);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: live ? "#22c55e" : "#ef4444" }} />
        <b>Live Devin Feed</b>
        <span style={{ opacity: 0.6 }}>{live ? "streaming" : "reconnecting…"}</span>
        {frame?.branch && <code style={{ marginLeft: "auto" }}>{frame.branch}</code>}
      </div>

      <Panel title="Working set (what Devin is holding)">
        {frame?.workingSet ?? <Empty>awaiting live feed…</Empty>}
      </Panel>
      <Panel title="Live test / AgentCoder output">
        {frame?.testOutput ?? <Empty>no test run captured yet</Empty>}
      </Panel>
      <Panel title="Sub-agent status (Council / Verifier)">
        {frame?.subagents?.length
          ? frame.subagents.map((s, i) => <div key={i}>• {s.name}: <b>{s.status}</b></div>)
          : <Empty>no sub-agents active</Empty>}
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#0f1117", border: "1px solid #1f2430", borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6, marginBottom: 6 }}>{title}</div>
      <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 13, lineHeight: 1.4 }}>{children}</pre>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <span style={{ opacity: 0.4, fontStyle: "italic" }}>{children}</span>;
}
'@

Step "Done - Nervous System Uplink scaffolded"
Write-Host "  Relay (DO):  apps/cockpit/api/telemetry-hub.ts"
Write-Host "  Router:      apps/cockpit/api/index.ts"
Write-Host "  Uplink:      .devin/mech/uplink.ps1   (tails REAL files)"
Write-Host "  HUD:         apps/cockpit/src/Hud.tsx"
Ok "Telemetry only. No deploys. No mock data."