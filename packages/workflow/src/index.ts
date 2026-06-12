/**
 * Workflow Package
 * 
 * Webhook-triggered workflow automations.
 * Define workflows as config, trigger by webhook.
 */

import { z } from 'zod';

// ============ Workflow Definition ============

export const StepSchema = z.object({
  name: z.string(),
  tool: z.string(),
  args: z.record(z.unknown()),
  condition: z.string().optional(), // JMESPath expression
  retry: z.number().optional(),
});

export const WorkflowSchema = z.object({
  name: z.string(),
  trigger: z.object({
    type: z.enum(['webhook', 'schedule', 'event']),
    url: z.string().optional(),    // For webhook
    schedule: z.string().optional(), // Cron
    event: z.string().optional(),  // Event type
  }),
  steps: z.array(StepSchema),
  on_failure: z.enum(['stop', 'continue', 'rollback']).default('stop'),
  timeout: z.number().default(300000), // 5 min
});

export type Workflow = z.infer<typeof WorkflowSchema>;
export type Step = z.infer<typeof StepSchema>;

// ============ Workflow Runner ============

import { executeTool } from '@aether/mcp-tools';

export interface WorkflowResult {
  workflow: string;
  status: 'success' | 'failed' | 'timeout';
  steps_completed: number;
  steps_failed: number;
  results: Array<{ step: string; success: boolean; result?: unknown; error?: string }>;
  duration: number;
}

export async function runWorkflow(workflow: Workflow, context: Record<string, unknown> = {}): Promise<WorkflowResult> {
  const startTime = Date.now();
  const results: WorkflowResult['results'] = [];
  let steps_completed = 0;
  let steps_failed = 0;

  for (const step of workflow.steps) {
    // Check condition (JMESPath-like simple check)
    if (step.condition) {
      const pass = evaluateCondition(step.condition, context);
      if (!pass) {
        results.push({ step: step.name, success: true, result: 'skipped' });
        continue;
      }
    }

    // Execute step with retry
    let stepResult: unknown;
    let stepError: string | undefined;
    let success = false;

    const attempts = step.retry || 1;
    for (let i = 0; i < attempts; i++) {
      try {
        // Interpolate args with context
        const args = interpolateArgs(step.args, context);
        
        stepResult = await executeTool(step.tool, args);
        success = true;
        break;
      } catch (e) {
        stepError = (e as Error).message;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }

    if (success) {
      steps_completed++;
      results.push({ step: step.name, success: true, result: stepResult });
      context[step.name] = stepResult; // Chain output
    } else {
      steps_failed++;
      results.push({ step: step.name, success: false, error: stepError });

      if (workflow.on_failure === 'stop') {
        break;
      }
    }
  }

  return {
    workflow: workflow.name,
    status: steps_failed > 0 && workflow.on_failure === 'stop' ? 'failed' : 'success',
    steps_completed,
    steps_failed,
    results,
    duration: Date.now() - startTime,
  };
}

// Simple condition evaluation (very basic)
function evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
  // Handle ${stepName.output} references
  const match = condition.match(/\$\{(\w+)\.\w+\}/);
  if (!match) return true;
  
  const [, stepName] = match;
  return stepName in context;
}

// Interpolate ${context.key} in args
function interpolateArgs(args: Record<string, unknown>, context: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === 'string' && value.includes('${')) {
      let interpolated = value;
      for (const [ck, cv] of Object.entries(context)) {
        interpolated = interpolated.replace(`\${${ck}}`, String(cv));
      }
      result[key] = interpolated;
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// ============ Webhook Handler ============

export interface WebhookPayload {
  workflow: string;
  context: Record<string, unknown>;
  secret?: string;
}

// Validate webhook payload
export function validateWebhook(payload: WebhookPayload, secret?: string): boolean {
  if (!secret) return true;
  return payload.secret === secret;
}

// ============ Example Workflows ============

export const EXAMPLE_WORKFLOWS: Workflow[] = [
  {
    name: 'deploy-frontend',
    trigger: { type: 'webhook', url: '/webhooks/deploy-frontend' },
    steps: [
      { name: 'checkout', tool: 'git_status', args: {} },
      { name: 'build', tool: 'http_request', args: { url: 'https://api.vercel.com/deploy', method: 'POST' } },
    ],
    on_failure: 'stop',
    timeout: 300000,
  },
  {
    name: 'fix-and-commit',
    trigger: { type: 'webhook' },
    steps: [
      { name: 'check-diff', tool: 'git_diff', args: {} },
      { name: 'stage', tool: 'git_commit', args: { message: 'Auto-fix via workflow' }, retry: 2 },
    ],
    on_failure: 'stop',
    timeout: 300000,
  },
];

export function listWorkflows() {
  return EXAMPLE_WORKFLOWS.map(w => ({ name: w.name, trigger: w.trigger.type, steps: w.steps.length }));
}

export function getWorkflow(name: string) {
  return EXAMPLE_WORKFLOWS.find(w => w.name === name);
}