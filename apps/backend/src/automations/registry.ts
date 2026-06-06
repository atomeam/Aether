/**
 * Automation Registry
 * 
 * Central registry for all automations across GitHub, Slack, Notion, n8n, and internal systems.
 */

import { createPR, listIssues, addIssueComment } from '@aether/github-automation';

// Simple in-memory scheduler (since @aether/scheduler package needs installation)
class SimpleScheduler {
  private jobs: Map<string, any> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  addJob(job: any): string {
    const id = `${job.name}-${Date.now()}`;
    this.jobs.set(id, { ...job, id });
    if (job.enabled) {
      this.scheduleJob(id, job);
    }
    return id;
  }

  removeJob(id: string): boolean {
    const interval = this.intervals.get(id);
    if (interval) clearInterval(interval);
    this.intervals.delete(id);
    return this.jobs.delete(id);
  }

  listJobs(): any[] {
    return Array.from(this.jobs.values());
  }

  toggleJob(id: string, enabled: boolean): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;
    job.enabled = enabled;
    if (enabled) {
      this.scheduleJob(id, job);
    } else {
      const interval = this.intervals.get(id);
      if (interval) clearInterval(interval);
      this.intervals.delete(id);
    }
    return true;
  }

  private scheduleJob(id: string, job: any): void {
    const interval = setInterval(async () => {
      if (job.enabled) {
        try {
          await job.handler();
        } catch (error) {
          console.error(`Job ${job.name} failed:`, error);
        }
      }
    }, 60000); // Run every minute for now
    this.intervals.set(id, interval);
  }
}

const scheduler = new SimpleScheduler();

// GitHub Automations
scheduler.addJob({
  name: 'github-pr-check',
  schedule: '*/5 * * * *',
  handler: async () => {
    console.log('[Automation] Checking for new PRs...');
  },
  enabled: true,
});

scheduler.addJob({
  name: 'github-issue-triage',
  schedule: '0 * * * *',
  handler: async () => {
    console.log('[Automation] Running issue triage...');
  },
  enabled: true,
});

// System Health Automations
scheduler.addJob({
  name: 'system-health-check',
  schedule: '*/10 * * * *',
  handler: async () => {
    console.log('[Automation] Running system health check...');
    try {
      const response = await fetch('http://localhost:3000/api/stack');
      const data = await response.json();
      console.log('System status:', data);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  },
  enabled: true,
});

// Data Sync Automations
scheduler.addJob({
  name: 'github-sync',
  schedule: '0 */2 * * *',
  handler: async () => {
    console.log('[Automation] Syncing GitHub data...');
    try {
      const issues = await listIssues({
        owner: 'atomicmoonbeam88',
        repo: 'Aether',
        state: 'open',
      });
      console.log(`Synced ${issues.length} issues`);
    } catch (error) {
      console.error('GitHub sync failed:', error);
    }
  },
  enabled: true,
});

// Export automation utilities
export const automationRegistry = {
  scheduler,
  jobs: scheduler.listJobs(),
  workflows: {
    prCreated: 'pr-created-notification',
    issueTriage: 'auto-issue-triage',
  },
  
  async triggerWorkflow(name: string, input: any) {
    console.log(`Triggering workflow: ${name}`, input);
    return { success: true, workflow: name, input };
  },
  
  listAutomations() {
    return {
      scheduledJobs: scheduler.listJobs(),
      availableWorkflows: ['pr-created-notification', 'auto-issue-triage'],
    };
  },
  
  toggleAutomation(id: string, enabled: boolean) {
    return scheduler.toggleJob(id, enabled);
  },
};
