import { TelemetryHub } from "./telemetry-hub";
import { default as webhook } from "./webhook";
export { TelemetryHub };
export interface Env { TELEMETRY_HUB: DurableObjectNamespace; MECH_STATE: KVNamespace; UPLINK_TOKEN: string; VIEWER_TOKEN: string; INGEST_TOKEN: string; GITHUB_TOKEN: string; WEBHOOK_TOKEN: string }

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    
    // Telemetry hub routes (WebSocket fan-out)
    if (url.pathname.startsWith("/api/ws") || url.pathname.startsWith("/api/telemetry/ingest")) {
      const id = env.TELEMETRY_HUB.idFromName("global");
      return env.TELEMETRY_HUB.get(id).fetch(req);
    }
    
    // Webhook routes (God Button)
    if (url.pathname.startsWith("/api/webhook")) {
      return webhook(req, env);
    }
    
    // Status API routes (KV-based)
    if (url.pathname === "/api/status") {
      const [doctor, guard, telem, cie, evals, ejector] = await Promise.all([
        env.MECH_STATE.get("doctor", "json"),
        env.MECH_STATE.get("guard", "json"),
        env.MECH_STATE.get("telemetry_latest", "json"),
        env.MECH_STATE.get("cie_queue", "json"),
        env.MECH_STATE.get("eval_scorecard", "json"),
        env.MECH_STATE.get("ejector", "json"),
      ]);
      return new Response(JSON.stringify({ doctor, guard, telemetry: telem, cie, evals, ejector, ts: new Date().toISOString() }), { headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });
    }

    // Authenticated KV ingest from mech.ps1 (Bearer INGEST_TOKEN)
    if (url.pathname === "/api/kv/ingest" && req.method === "POST") {
      if (req.headers.get("authorization") !== `Bearer ${env.INGEST_TOKEN}`) return new Response("unauthorized", { status: 401 });
      const body = await req.json<{ key: string; value: unknown }>();
      if (!body?.key) return new Response("error: key required", { status: 400 });
      await env.MECH_STATE.put(body.key, JSON.stringify(body.value));
      return new Response(JSON.stringify({ ok: true, key: body.key }), { headers: { "content-type": "application/json" } });
    }

    // Ejector toggle (the kill-switch the loops read)
    if (url.pathname === "/api/ejector" && req.method === "POST") {
      if (req.headers.get("authorization") !== `Bearer ${env.INGEST_TOKEN}`) return new Response("unauthorized", { status: 401 });
      const { engaged } = await req.json<{ engaged: boolean }>();
      await env.MECH_STATE.put("ejector", JSON.stringify({ engaged: !!engaged, at: new Date().toISOString() }));
      return new Response(JSON.stringify({ ok: true, engaged: !!engaged }), { headers: { "content-type": "application/json" } });
    }
    
    return new Response("not found", { status: 404 });
  },
};