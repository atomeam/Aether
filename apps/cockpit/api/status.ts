// Status API - serves mech state from KV (for backward compatibility)
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