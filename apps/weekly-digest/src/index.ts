/**
 * Weekly Digest Worker - Aggregates runs ledger and posts to Notion
 *
 * Cron trigger: Friday 5pm ET (UTC 21:00)
 * Reads from D1 runs table
 * Aggregates by week: total runs, PASS rate, longest blockers, top contributors
 * Posts to Notion via existing notion-worker (stubbed)
 */

import type { D1Database, KVNamespace, ExecutionContext, ScheduledEvent } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  STATE: KVNamespace;
  STATE_CACHE: KVNamespace;
  ENVIRONMENT: string;
}

interface RunRow {
  id: string;
  title: string;
  status: string; // 'pending', 'in_progress', 'completed', 'failed'
  created_at: string;
  updated_at: string;
  agent_id?: string; // For contributor tracking
  evidence_passed?: boolean; // For PASS rate calculation
}

interface WeeklyDigest {
  week_start: string;
  week_end: string;
  total_runs: number;
  pass_rate: number;
  longest_blockers: { title: string; duration_hours: number }[];
  top_contributors: { agent_id: string; runs_completed: number }[];
  generated_at: string;
}

export default {
  async fetch(request: any, env: Env, ctx: ExecutionContext): Promise<any> {
    const url = new URL(request.url);

    // GET /health
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({
        status: 'healthy',
        worker: 'weekly-digest',
        timestamp: new Date().toISOString(),
      });
    }

    // POST /generate (manual trigger for testing)
    if (url.pathname === '/generate' && request.method === 'POST') {
      return handleDigestGeneration(request, env, ctx);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },

  // Scheduled handler for cron trigger
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('[weekly-digest] Scheduled digest generation triggered');

    try {
      const digest = await generateWeeklyDigest(env);
      console.log('[weekly-digest] Digest generated:', digest);

      // Stub: Post to Notion via existing notion-worker
      await postToNotion(digest, env);

      console.log('[weekly-digest] Digest posted to Notion');
    } catch (error) {
      console.error('[weekly-digest] Error in scheduled digest:', error);
    }
  },
};

async function handleDigestGeneration(request: any, env: Env, ctx: ExecutionContext): Promise<any> {
  try {
    const digest = await generateWeeklyDigest(env);
    
    // Stub: Post to Notion
    await postToNotion(digest, env);
    
    return Response.json({
      success: true,
      digest,
      message: 'Digest generated and posted to Notion (stubbed)',
    });
  } catch (error) {
    console.error('[weekly-digest] Error in manual digest generation:', error);
    return Response.json(
      { error: 'Digest generation failed', message: String(error) },
      { status: 500 }
    );
  }
}

async function generateWeeklyDigest(env: Env): Promise<WeeklyDigest> {
  // Calculate week range (current week, Monday to Sunday)
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday
  weekEnd.setHours(23, 59, 59, 999);
  
  // Query runs from this week
  const runs = await getRunsForWeek(env.DB, weekStart.toISOString(), weekEnd.toISOString());
  
  // Calculate metrics
  const total_runs = runs.length;
  const passed_runs = runs.filter(r => r.evidence_passed === true).length;
  const pass_rate = total_runs > 0 ? (passed_runs / total_runs) * 100 : 0;
  
  // Find longest blockers (tasks that took longest to complete)
  const longest_blockers = findLongestBlockers(runs);
  
  // Find top contributors by agent
  const top_contributors = findTopContributors(runs);
  
  return {
    week_start: weekStart.toISOString(),
    week_end: weekEnd.toISOString(),
    total_runs,
    pass_rate: Math.round(pass_rate * 100) / 100,
    longest_blockers,
    top_contributors,
    generated_at: new Date().toISOString(),
  };
}

async function getRunsForWeek(db: D1Database, weekStart: string, weekEnd: string): Promise<RunRow[]> {
  // Stub: Query runs table for the week
  // Real implementation would:
  // 1. Query runs where created_at >= weekStart AND created_at <= weekEnd
  // 2. Return all columns including agent_id and evidence_passed
  
  try {
    const stmt = db.prepare(`
      SELECT id, title, status, created_at, updated_at, agent_id, evidence_passed
      FROM runs
      WHERE created_at >= ? AND created_at <= ?
      ORDER BY created_at DESC
    `);
    
    const result = await stmt.bind(weekStart, weekEnd).all<RunRow>();
    return result.results || [];
  } catch (error) {
    console.error('[weekly-digest] Error querying runs:', error);
    // Return empty array if table doesn't exist yet
    return [];
  }
}

function findLongestBlockers(runs: RunRow[]): { title: string; duration_hours: number }[] {
  // Calculate duration for each run
  const blockers = runs
    .map(run => {
      const created = new Date(run.created_at).getTime();
      const updated = new Date(run.updated_at).getTime();
      const duration_hours = (updated - created) / (1000 * 60 * 60);
      return {
        title: run.title,
        duration_hours: Math.round(duration_hours * 100) / 100,
      };
    })
    .filter(b => b.duration_hours > 0)
    .sort((a, b) => b.duration_hours - a.duration_hours)
    .slice(0, 5); // Top 5
  
  return blockers;
}

function findTopContributors(runs: RunRow[]): { agent_id: string; runs_completed: number }[] {
  // Count runs by agent_id
  const contributorMap = new Map<string, number>();
  
  for (const run of runs) {
    if (run.agent_id && run.status === 'completed') {
      const count = contributorMap.get(run.agent_id) || 0;
      contributorMap.set(run.agent_id, count + 1);
    }
  }
  
  // Convert to array and sort
  const contributors = Array.from(contributorMap.entries())
    .map(([agent_id, runs_completed]) => ({ agent_id, runs_completed }))
    .sort((a, b) => b.runs_completed - a.runs_completed)
    .slice(0, 5); // Top 5
  
  return contributors;
}

async function postToNotion(digest: WeeklyDigest, env: Env): Promise<void> {
  // Stub: Post to Notion via existing notion-worker
  // Real implementation would:
  // 1. Convert digest to markdown format
  // 2. Call notion-worker API to create/update Notion page
  // 3. Reference Victus weekly digest master template
  
  console.log('[weekly-digest] Stub: Posting to Notion via notion-worker');
  console.log('[weekly-digest] Digest content:', JSON.stringify(digest, null, 2));
  
  // Reference: Victus weekly digest master template page in operator's Notion workspace
  // This would be the template page ID to use for creating new digest pages
}

// ─── Markdown Generation (for Notion posting) ─────────────────────────────

function generateMarkdown(digest: WeeklyDigest): string {
  const weekStart = new Date(digest.week_start).toLocaleDateString();
  const weekEnd = new Date(digest.week_end).toLocaleDateString();
  
  let markdown = `# Weekly Digest: ${weekStart} - ${weekEnd}\n\n`;
  markdown += `**Generated**: ${new Date(digest.generated_at).toLocaleString()}\n\n`;
  
  markdown += `## Summary\n\n`;
  markdown += `- **Total Runs**: ${digest.total_runs}\n`;
  markdown += `- **PASS Rate**: ${digest.pass_rate}%\n\n`;
  
  markdown += `## Longest Blockers\n\n`;
  if (digest.longest_blockers.length > 0) {
    markdown += `| Task | Duration (hours) |\n`;
    markdown += `|------|------------------|\n`;
    for (const blocker of digest.longest_blockers) {
      markdown += `| ${blocker.title} | ${blocker.duration_hours} |\n`;
    }
  } else {
    markdown += `No blockers found this week.\n`;
  }
  markdown += `\n`;
  
  markdown += `## Top Contributors\n\n`;
  if (digest.top_contributors.length > 0) {
    markdown += `| Agent | Runs Completed |\n`;
    markdown += `|-------|----------------|\n`;
    for (const contributor of digest.top_contributors) {
      markdown += `| ${contributor.agent_id} | ${contributor.runs_completed} |\n`;
    }
  } else {
    markdown += `No contributors found this week.\n`;
  }
  
  return markdown;
}
