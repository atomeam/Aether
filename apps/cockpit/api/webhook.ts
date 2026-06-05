// God Button webhook endpoint. Triggers GitHub Actions repository_dispatch.
// Cockpit cannot deploy directly - it only triggers GitHub Actions.
export interface Env { GITHUB_TOKEN: string; WEBHOOK_TOKEN: string }

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/api/webhook/execute" && req.method === "POST") {
      // Authenticate webhook request
      if (req.headers.get("authorization") !== `Bearer ${env.WEBHOOK_TOKEN}`) {
        return new Response("unauthorized", { status: 401 });
      }

      const body = await req.json<{ pr_number: number }>();
      if (!body?.pr_number) {
        return new Response("pr_number required", { status: 400 });
      }

      // Trigger GitHub Actions repository_dispatch
      const githubRes = await fetch("https://api.github.com/repos/atomeam/Aether/dispatches", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "god-button-execute",
          client_payload: { pr_number: body.pr_number },
        }),
      });

      if (!githubRes.ok) {
        return new Response(`GitHub API error: ${githubRes.statusText}`, { status: 500 });
      }

      return new Response(JSON.stringify({ ok: true, pr_number: body.pr_number }), {
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("not found", { status: 404 });
  },
};