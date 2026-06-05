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