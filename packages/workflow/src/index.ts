/**
 * Workflow Package
 * 
 * Chain multiple automation steps together with error handling and context passing.
 */

import { z } from 'zod';

// Workflow step definition
export interface WorkflowStep {
  name: string;
  handler: (context: any) => Promise<any>;
  onError?: (error: Error, context: any) => Promise<any>;
  continueOnError?: boolean;
}

// Workflow definition
export interface Workflow {
  name: string;
  description?: string;
  steps: WorkflowStep[];
  onFinally?: (context: any) => Promise<void>;
}

// Workflow execution context
export interface WorkflowContext {
  input: any;
  output: any;
  errors: Array<{ step: string; error: Error }>;
  metadata: Record<string, any>;
}

// Workflow registry
const workflows: Map<string, Workflow> = new Map();

// Register a workflow
export function registerWorkflow(workflow: Workflow): void {
  workflows.set(workflow.name, workflow);
}

// Get a workflow
export function getWorkflow(name: string): Workflow | undefined {
  return workflows.get(name);
}

// List all workflows
export function listWorkflows(): Workflow[] {
  return Array.from(workflows.values());
}

// Run a workflow
export async function runWorkflow(workflow: Workflow, input: any = {}): Promise<any> {
  const context: WorkflowContext = {
    input,
    output: {},
    errors: [],
    metadata: {
      startTime: Date.now(),
      workflowName: workflow.name,
    },
  };

  try {
    for (const step of workflow.steps) {
      try {
        const stepOutput = await step.handler(context);
        context.output[step.name] = stepOutput;
        context.metadata[`step_${step.name}_completed`] = Date.now();
      } catch (error) {
        const err = error as Error;
        context.errors.push({ step: step.name, error: err });
        
        if (step.onError) {
          const recovery = await step.onError(err, context);
          context.output[`${step.name}_recovery`] = recovery;
        }
        
        if (!step.continueOnError) {
          throw err;
        }
      }
    }
  } finally {
    if (workflow.onFinally) {
      await workflow.onFinally(context);
    }
    context.metadata.endTime = Date.now();
    context.metadata.duration = context.metadata.endTime - context.metadata.startTime;
  }

  return context;
}

// Predefined workflows
export const predefinedWorkflows: Workflow[] = [
  {
    name: 'github-pr-notification',
    description: 'Notify Slack when a new PR is created',
    steps: [
      {
        name: 'fetch_pr',
        handler: async (context) => {
          const { createPR } = await import('@aether/github-automation');
          return createPR(context.input);
        },
      },
      {
        name: 'notify_slack',
        handler: async (context) => {
          const { sendMessage } = await import('@aether/slack-automation');
          const pr = context.output.fetch_pr;
          return sendMessage({
            channel: context.input.slackChannel || '#general',
            text: `New PR created: ${pr.title}`,
          });
        },
        continueOnError: true,
      },
    ],
  },
  {
    name: 'daily-status-report',
    description: 'Generate and post daily status report',
    steps: [
      {
        name: 'collect_metrics',
        handler: async (context) => {
          // Collect metrics from various sources
          return {
            github: await fetch('https://api.github.com/repos/owner/repo').then(r => r.json()),
            system: await fetch('http://localhost:3000/api/stack').then(r => r.json()),
          };
        },
      },
      {
        name: 'create_notion_page',
        handler: async (context) => {
          const { createPage } = await import('@aether/notion-automation');
          const metrics = context.output.collect_metrics;
          return createPage({
            parent: { database_id: context.input.notionDatabaseId },
            properties: {
              title: `Daily Report ${new Date().toISOString().split('T')[0]}`,
              metrics: JSON.stringify(metrics),
            },
          });
        },
        continueOnError: true,
      },
      {
        name: 'notify_slack',
        handler: async (context) => {
          const { sendMessage } = await import('@aether/slack-automation');
          return sendMessage({
            channel: context.input.slackChannel || '#reports',
            text: 'Daily status report created in Notion',
          });
        },
        continueOnError: true,
      },
    ],
  },
  {
    name: 'issue-triage',
    description: 'Automatically triage GitHub issues',
    steps: [
      {
        name: 'fetch_issues',
        handler: async (context) => {
          const { listIssues } = await import('@aether/github-automation');
          return listIssues({
            owner: context.input.owner,
            repo: context.input.repo,
            state: 'open',
          });
        },
      },
      {
        name: 'categorize',
        handler: async (context) => {
          const issues = context.output.fetch_issues;
          // Simple categorization logic
          return issues.map((issue: any) => ({
            ...issue,
            category: issue.labels?.[0]?.name || 'uncategorized',
          }));
        },
      },
      {
        name: 'update_notion',
        handler: async (context) => {
          const { createPage } = await import('@aether/notion-automation');
          const categorized = context.output.categorize;
          // Create pages for each category
          return Promise.all(
            categorized.map((issue: any) =>
              createPage({
                parent: { database_id: context.input.notionDatabaseId },
                properties: {
                  title: issue.title,
                  category: issue.category,
                  url: issue.html_url,
                },
              })
            )
          );
        },
        continueOnError: true,
      },
    ],
  },
];

// Register predefined workflows
predefinedWorkflows.forEach(registerWorkflow);

// Export workflow utilities
export { workflows };
