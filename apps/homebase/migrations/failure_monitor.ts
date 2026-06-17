/**
 * Failure Monitor Workflow
 * 
 * Monitors workflow failures from the run history and sends alerts
 * when failure thresholds are exceeded
 */

import * as fs from 'fs';
import * as path from 'path';
import { JobContext, JobResult } from '../backbone/shared/types/job';

interface FailureAlert {
  timestamp: string;
  workflow: string;
  failureCount: number;
  recentFailures: any[];
  severity: 'low' | 'medium' | 'high';
}

export async function handler(context: JobContext): Promise<JobResult> {
  const { input, config, logger, runId } = context;
  
  try {
    logger.info('Failure monitor started', { input });
    
    const runsDir = path.join(process.cwd(), '..', 'runs');
    const runsFile = path.join(runsDir, 'runs.jsonl');
    
    // Read run history
    let runHistory: any[] = [];
    if (fs.existsSync(runsFile)) {
      const content = fs.readFileSync(runsFile, 'utf-8');
      runHistory = content.split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    }

    // Analyze failures in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRuns = runHistory.filter(run => 
      new Date(run.timestamp) > oneHourAgo
    );

    const failures = recentRuns.filter(run => 
      run.status === 'failed' || run.output?.status === 'failed'
    );

    // Group failures by workflow
    const failuresByWorkflow: Record<string, any[]> = {};
    for (const failure of failures) {
      const workflow = failure.workflow || 'unknown';
      if (!failuresByWorkflow[workflow]) {
        failuresByWorkflow[workflow] = [];
      }
      failuresByWorkflow[workflow].push(failure);
    }

    // Generate alerts
    const alerts: FailureAlert[] = [];
    for (const [workflow, workflowFailures] of Object.entries(failuresByWorkflow)) {
      const failureCount = workflowFailures.length;
      let severity: 'low' | 'medium' | 'high' = 'low';
      
      if (failureCount >= 5) {
        severity = 'high';
      } else if (failureCount >= 3) {
        severity = 'medium';
      }

      if (failureCount > 0) {
        alerts.push({
          timestamp: new Date().toISOString(),
          workflow,
          failureCount,
          recentFailures: workflowFailures.slice(-5), // Last 5 failures
          severity
        });
      }
    }

    const monitorResult = {
      timestamp: new Date().toISOString(),
      totalRuns: recentRuns.length,
      totalFailures: failures.length,
      failureRate: recentRuns.length > 0 ? (failures.length / recentRuns.length) * 100 : 0,
      alerts,
      workflowsWithFailures: Object.keys(failuresByWorkflow)
    };

    logger.info('Failure monitor completed', { 
      totalFailures: failures.length,
      alertCount: alerts.length,
      failureRate: monitorResult.failureRate 
    });

    return {
      runId,
      status: 'completed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 1000,
      output: monitorResult
    };
  } catch (error) {
    logger.error('Failure monitor failed', { 
      error: (error as Error).message,
      stack: (error as Error).stack 
    });
    
    return {
      runId,
      status: 'failed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      error: error as Error,
      output: {
        success: false,
        error: (error as Error).message
      }
    };
  }
}