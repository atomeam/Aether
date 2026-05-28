/**
 * aether-metrics-cron — Profit Loop Scoreboard Compute Layer (Option B)
 *
 * Cron: Mon 09:00 ET (13:00 UTC)
 * Reads: Notion Runs ledger (querySql via HTTP API), Stripe (subscriptions)
 * Writes: KV key "scoreboard:current" + "scoreboard:{week-iso}"
 * Serves: GET /api/scoreboard
 *
 * Data contracts (v1 spec, amended for Option B transport):
 *   Productivity (Executor Runs)  → Notion Runs ledger, collection 0a91ffaa-cfa9-4ef4-8909-e1cb00fe812d
 *   Outputs (Artifacts Shipped)   → Notion Runs ledger, same collection, completed rows
 *   Quality (Rollbacks)           → Notion Runs ledger, "Outcome summary" token
 *   Impact (Net MRR)              → Stripe API, subscriptions:read
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface Env {
  SCOREBOARD: KVNamespace;
  NOTION_API_KEY?: string;
  STRIPE_API_KEY?: string;
}

interface WeekWindow {
  start: string; // ISO Monday 00:00 UTC
  end: string;   // ISO next Monday 00:00 UTC
  label: string; // e.g. "2026-W22"
}

interface ScoreboardMetrics {
  week: WeekWindow;
  productivity: {
    executor_runs: number;
    source: "notion_runs_ledger" | "stub";
  };
  outputs: {
    artifacts_shipped: number;
    source: "notion_runs_ledger" | "stub";
  };
  quality: {
    rollbacks: number;
    total_runs: number;
    rollback_rate: number;
    source: "notion_runs_ledger" | "stub";
  };
  impact: {
    net_mrr_cents: number;
    currency: string;
    source: "stripe_api" | "stub";
  };
  computed_at: string;
  version: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VERSION = "1.0.0";

/** Get the Monday-to-Monday window for a given date */
function getWeekWindow(date: Date = new Date()): WeekWindow {
  const d = new Date(date);
  // Roll back to Monday 00:00 UTC
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 1, Sunday = 0
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);

  const start = new Date(d);
  const end = new Date(d);
  end.setUTCDate(end.getUTCDate() + 7);

  // ISO week number
  const jan1 = new Date(Date.UTC(start.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(
    ((start.getTime() - jan1.getTime()) / 86400000 + jan1.getUTCDay() + 1) / 7
  );
  const label = `${start.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label,
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
}

// ─── Notion Runs Ledger ──────────────────────────────────────────────────────
//
// Collection: 0a91ffaa-cfa9-4ef4-8909-e1cb00fe812d
// Queries the Runs ledger via Notion HTTP API (databases.query)
// The collection ID maps to a Notion database.
//
// When NOTION_API_KEY is not set, returns stub data (zeroes).

const NOTION_RUNS_DB = "0a91ffaa-cfa9-4ef4-8909-e1cb00fe812d";

interface NotionRunsResult {
  executor_runs: number;
  artifacts_shipped: number;
  rollbacks: number;
  total_runs: number;
}

async function queryNotionRunsLedger(
  apiKey: string,
  week: WeekWindow
): Promise<NotionRunsResult> {
  // Query the Notion database for runs in this week window
  const response = await fetch(
    `https://api.notion.com/v1/databases/${NOTION_RUNS_DB}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          and: [
            {
              property: "Created",
              date: { on_or_after: week.start },
            },
            {
              property: "Created",
              date: { before: week.end },
            },
          ],
        },
        page_size: 100,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Notion API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    results: Array<{
      properties: Record<string, any>;
    }>;
    has_more: boolean;
    next_cursor: string | null;
  };

  let executor_runs = 0;
  let artifacts_shipped = 0;
  let rollbacks = 0;

  for (const page of data.results) {
    executor_runs++;

    // Count completed tasks as artifacts shipped
    // Adjust property name to match actual Runs ledger schema
    const status = page.properties?.["Status"]?.status?.name
      ?? page.properties?.["Status"]?.select?.name
      ?? "";
    if (
      status.toLowerCase().includes("complete") ||
      status.toLowerCase().includes("done") ||
      status.toLowerCase().includes("shipped")
    ) {
      artifacts_shipped++;
    }

    // Check "Outcome summary" for rollback token
    const outcome = page.properties?.["Outcome summary"]?.rich_text
      ?.map((t: any) => t.plain_text)
      .join("") ?? "";
    if (outcome.toLowerCase().includes("rollback")) {
      rollbacks++;
    }
  }

  // TODO: handle pagination if has_more === true (>100 runs/week)

  return {
    executor_runs,
    artifacts_shipped,
    rollbacks,
    total_runs: executor_runs,
  };
}

// ─── Stripe MRR ──────────────────────────────────────────────────────────────
//
// Reads active subscriptions to compute Net MRR at weekly snapshot time.
// When STRIPE_API_KEY is not set, returns stub data (zeroes).

interface StripeResult {
  net_mrr_cents: number;
  currency: string;
}

async function queryStripeMRR(apiKey: string): Promise<StripeResult> {
  // List active subscriptions
  const response = await fetch(
    "https://api.stripe.com/v1/subscriptions?status=active&limit=100",
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Stripe API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    data: Array<{
      items: {
        data: Array<{
          price: {
            unit_amount: number;
            currency: string;
            recurring: { interval: string; interval_count: number } | null;
          };
          quantity: number;
        }>;
      };
    }>;
  };

  let net_mrr_cents = 0;
  let currency = "usd";

  for (const sub of data.data) {
    for (const item of sub.items.data) {
      const price = item.price;
      currency = price.currency;
      let monthly = price.unit_amount * item.quantity;

      // Normalize to monthly
      if (price.recurring) {
        if (price.recurring.interval === "year") {
          monthly = Math.round(monthly / (12 * price.recurring.interval_count));
        } else if (price.recurring.interval === "month") {
          monthly = Math.round(monthly / price.recurring.interval_count);
        }
        // weekly, daily — extend as needed
      }

      net_mrr_cents += monthly;
    }
  }

  // TODO: handle pagination for >100 subscriptions
  // TODO: subtract churned MRR if needed (compare with previous week's snapshot)

  return { net_mrr_cents, currency };
}

// ─── Compute Scoreboard ──────────────────────────────────────────────────────

async function computeScoreboard(env: Env): Promise<ScoreboardMetrics> {
  const week = getWeekWindow();
  const hasNotion = !!env.NOTION_API_KEY;
  const hasStripe = !!env.STRIPE_API_KEY;

  // Notion: Productivity, Outputs, Quality
  let notionResult: NotionRunsResult = {
    executor_runs: 0,
    artifacts_shipped: 0,
    rollbacks: 0,
    total_runs: 0,
  };

  if (hasNotion) {
    try {
      notionResult = await queryNotionRunsLedger(env.NOTION_API_KEY!, week);
    } catch (err) {
      console.error("Notion query failed:", err);
    }
  }

  // Stripe: Impact (Net MRR)
  let stripeResult: StripeResult = { net_mrr_cents: 0, currency: "usd" };

  if (hasStripe) {
    try {
      stripeResult = await queryStripeMRR(env.STRIPE_API_KEY!);
    } catch (err) {
      console.error("Stripe query failed:", err);
    }
  }

  const rollbackRate =
    notionResult.total_runs > 0
      ? parseFloat(
          (notionResult.rollbacks / notionResult.total_runs).toFixed(4)
        )
      : 0;

  return {
    week,
    productivity: {
      executor_runs: notionResult.executor_runs,
      source: hasNotion ? "notion_runs_ledger" : "stub",
    },
    outputs: {
      artifacts_shipped: notionResult.artifacts_shipped,
      source: hasNotion ? "notion_runs_ledger" : "stub",
    },
    quality: {
      rollbacks: notionResult.rollbacks,
      total_runs: notionResult.total_runs,
      rollback_rate: rollbackRate,
      source: hasNotion ? "notion_runs_ledger" : "stub",
    },
    impact: {
      net_mrr_cents: stripeResult.net_mrr_cents,
      currency: stripeResult.currency,
      source: hasStripe ? "stripe_api" : "stub",
    },
    computed_at: new Date().toISOString(),
    version: VERSION,
  };
}

// ─── Scheduled (Cron) Handler ────────────────────────────────────────────────

async function handleScheduled(env: Env): Promise<void> {
  console.log(`[metrics-cron] Computing scoreboard at ${new Date().toISOString()}`);

  const scoreboard = await computeScoreboard(env);

  // Write to KV: current + week-specific key
  await env.SCOREBOARD.put(
    "scoreboard:current",
    JSON.stringify(scoreboard),
    { expirationTtl: 60 * 60 * 24 * 8 } // 8 days TTL
  );

  await env.SCOREBOARD.put(
    `scoreboard:${scoreboard.week.label}`,
    JSON.stringify(scoreboard)
    // No TTL — historical snapshots persist
  );

  console.log(
    `[metrics-cron] Scoreboard written for ${scoreboard.week.label}:`,
    `runs=${scoreboard.productivity.executor_runs}`,
    `shipped=${scoreboard.outputs.artifacts_shipped}`,
    `rollbacks=${scoreboard.quality.rollbacks}`,
    `mrr=${scoreboard.impact.net_mrr_cents}c`
  );
}

// ─── HTTP Handler ────────────────────────────────────────────────────────────

async function handleFetch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // GET /api/scoreboard — read from KV
  if (url.pathname === "/api/scoreboard" && request.method === "GET") {
    const weekParam = url.searchParams.get("week");

    let key = "scoreboard:current";
    if (weekParam && weekParam !== "current") {
      key = `scoreboard:${weekParam}`; // e.g. "scoreboard:2026-W22"
    }

    const data = await env.SCOREBOARD.get(key);
    if (!data) {
      return jsonResponse(
        {
          ok: false,
          error: "no_data",
          message: key === "scoreboard:current"
            ? "No scoreboard computed yet. Cron runs Mon 09:00 ET, or POST /api/scoreboard/compute to trigger manually."
            : `No scoreboard found for week "${weekParam}".`,
        },
        404
      );
    }

    return jsonResponse({ ok: true, ...JSON.parse(data) });
  }

  // POST /api/scoreboard/compute — manual trigger (for testing)
  if (url.pathname === "/api/scoreboard/compute" && request.method === "POST") {
    await handleScheduled(env);
    const data = await env.SCOREBOARD.get("scoreboard:current");
    return jsonResponse({
      ok: true,
      message: "Scoreboard computed and written to KV.",
      ...(data ? JSON.parse(data) : {}),
    });
  }

  // GET /api/scoreboard/history — list all week keys
  if (url.pathname === "/api/scoreboard/history" && request.method === "GET") {
    const list = await env.SCOREBOARD.list({ prefix: "scoreboard:20" });
    const weeks = list.keys.map((k) => k.name.replace("scoreboard:", ""));
    return jsonResponse({ ok: true, weeks });
  }

  // GET /health
  if (url.pathname === "/health") {
    return jsonResponse({
      ok: true,
      service: "aether-metrics-cron",
      version: VERSION,
      secrets: {
        notion: !!env.NOTION_API_KEY,
        stripe: !!env.STRIPE_API_KEY,
      },
    });
  }

  return jsonResponse({ error: "not_found", path: url.pathname }, 404);
}

// ─── Export ──────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleFetch(request, env);
    } catch (err) {
      console.error("[metrics-cron] Unhandled error:", err);
      return jsonResponse(
        { ok: false, error: "internal", message: String(err) },
        500
      );
    }
  },

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(handleScheduled(env));
  },
};
