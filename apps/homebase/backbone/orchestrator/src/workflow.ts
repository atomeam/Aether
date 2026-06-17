import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { logger, createWorkflowLogger } from '../../shared/logger';
import { loadConfig } from '../../shared/config';
import { withRetry, createJobResult } from '../../shared/errors';
import { JobContext, JobResult, RunHistory } from '../../shared/types/job';

export class WorkflowEngine {
  private runHistoryPath: string;

  constructor() {
    const config = loadConfig();
    
    // Use absolute path if configured, otherwise resolve relative to automation_consolidation_v2 root
    if (config.orchestrator.absolute_runs_dir) {
      // Use absolute path from config
      this.runHistoryPath = path.join(config.orchestrator.runs_dir, 'runs.jsonl');
    } else {
      // Resolve runs_dir relative to the automation_consolidation_v2 root
      const rootDir = path.join(process.cwd(), '..');
      this.runHistoryPath = path.join(rootDir, config.orchestrator.runs_dir, 'runs.jsonl');
    }
    
    this.ensureRunsDirectory();
  }

  private ensureRunsDirectory(): void {
    const config = loadConfig();
    let runsDir: string;
    
    if (config.orchestrator.absolute_runs_dir) {
      // Use absolute path from config
      runsDir = config.orchestrator.runs_dir;
    } else {
      // Resolve runs_dir relative to the automation_consolidation_v2 root
      const rootDir = path.join(process.cwd(), '..');
      runsDir = path.join(rootDir, config.orchestrator.runs_dir);
    }
    
    if (!fs.existsSync(runsDir)) {
      fs.mkdirSync(runsDir, { recursive: true });
      logger.info(`Created runs directory: ${runsDir}`);
    }
  }

  async executeWorkflow(
    workflowId: string, 
    options: { trigger?: 'scheduler' | 'manual' | 'webhook'; input?: Record<string, unknown> } = {}
  ): Promise<JobResult> {
    const config = loadConfig();
    const workflowConfig = config.workflows[workflowId];
    
    if (!workflowConfig) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const runId = `run_${randomBytes(8).toString('hex')}`;
    const startTime = new Date();
    const workflowLogger = createWorkflowLogger(workflowId, runId);

    if (!workflowConfig.enabled) {
      // Return SKIPPED status instead of throwing error
      const endTime = new Date();
      const jobResult = createJobResult(
        runId,
        'skipped',
        startTime,
        endTime,
        { reason: 'Workflow is disabled in configuration' }
      );

      // Record skip in run history
      this.recordRunHistory({
        timestamp: endTime.toISOString(),
        workflow: workflowId,
        run_id: runId,
        status: 'skipped',
        trigger: options.trigger || 'manual',
        duration_ms: jobResult.duration,
        output: { reason: 'Workflow is disabled in configuration' }
      });

      workflowLogger.info('Workflow skipped (disabled in config)');
      return jobResult;
    }

    // Record start in run history
    this.recordRunHistory({
      timestamp: startTime.toISOString(),
      workflow: workflowId,
      run_id: runId,
      status: 'started',
      trigger: options.trigger || 'manual'
    });

    workflowLogger.info('Workflow started', { 
      trigger: options.trigger, 
      input: options.input 
    });

    try {
      // Load workflow handler
      const handler = await this.loadWorkflowHandler(workflowId);
      
      // Create job context
      const context: JobContext = {
        input: options.input || {},
        config: workflowConfig,
        logger: workflowLogger,
        runId
      };

      // Execute with retry logic
      const result = await withRetry(
        () => handler(context),
        {
          maxRetries: workflowConfig.retries,
          initialDelay: 1000,
          maxDelay: 30000,
          backoffMultiplier: 2,
          retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', '503', '502', '429']
        },
        workflowLogger
      );

      const endTime = new Date();
      const jobResult = createJobResult(
        runId,
        'completed',
        startTime,
        endTime,
        result
      );

      // Record completion in run history
      this.recordRunHistory({
        timestamp: endTime.toISOString(),
        workflow: workflowId,
        run_id: runId,
        status: 'completed',
        trigger: options.trigger || 'manual',
        duration_ms: jobResult.duration,
        output: result
      });

      workflowLogger.info('Workflow completed', { 
        duration: jobResult.duration 
      });

      return jobResult;
    } catch (error) {
      const endTime = new Date();
      const jobResult = createJobResult(
        runId,
        'failed',
        startTime,
        endTime,
        undefined,
        error as Error
      );

      // Record failure in run history
      this.recordRunHistory({
        timestamp: endTime.toISOString(),
        workflow: workflowId,
        run_id: runId,
        status: 'failed',
        trigger: options.trigger || 'manual',
        duration_ms: jobResult.duration,
        error: (error as Error).message
      });

      workflowLogger.error('Workflow failed', { 
        error: (error as Error).message,
        duration: jobResult.duration 
      });

      return jobResult;
    }
  }

  private async loadWorkflowHandler(workflowId: string) {
    const config = loadConfig();
    const workflowConfig = config.workflows[workflowId];
    const handlerPath = workflowConfig.handler || path.join(
      'backbone', 
      'workflows', 
      workflowId, 
      'handler.ts'
    );

    // Resolve paths relative to automation_consolidation_v2 root
    // Since orchestrator runs from backbone/, we need to go up one level for root-relative paths
    const rootDir = path.join(process.cwd(), '..');
    
    // Try multiple path resolution strategies
    const possiblePaths = [
      // Handler path relative to root (e.g., "migrations/homebase_wrapper.ts")
      path.join(rootDir, handlerPath),
      // Handler path relative to backbone (e.g., "workflows/homebase_health_check/handler.ts")
      path.join(process.cwd(), handlerPath),
      // Absolute path from config
      handlerPath.startsWith('/') ? handlerPath : null,
      // Legacy backbone/workflows structure
      path.join(process.cwd(), 'workflows', workflowId, 'handler.ts')
    ].filter(p => p !== null);

    let validPath = null;
    for (const testPath of possiblePaths) {
      if (testPath && fs.existsSync(testPath)) {
        validPath = testPath;
        break;
      }
    }

    if (!validPath) {
      throw new Error(`Workflow handler not found: ${handlerPath}. Tried paths: ${possiblePaths.join(', ')}`);
    }

    try {
      // Dynamic import of the handler - convert to file:// URL for Windows
      const fileUrl = `file:///${validPath.replace(/\\/g, '/')}`;
      const module = await import(fileUrl);
      return module.handler;
    } catch (error) {
      throw new Error(`Failed to load workflow handler from ${validPath}: ${(error as Error).message}`);
    }
  }

  private recordRunHistory(entry: RunHistory): void {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.runHistoryPath, line);
  }

  getRunHistory(limit: number = 100): RunHistory[] {
    if (!fs.existsSync(this.runHistoryPath)) {
      return [];
    }

    const content = fs.readFileSync(this.runHistoryPath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);
    
    return lines
      .map(line => JSON.parse(line) as RunHistory)
      .reverse()
      .slice(0, limit);
  }

  getWorkflowStatus(workflowId: string): { 
    enabled: boolean; 
    lastRun?: RunHistory;
    successRate: number;
  } {
    const config = loadConfig();
    const workflowConfig = config.workflows[workflowId];
    
    if (!workflowConfig) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const history = this.getRunHistory(50);
    const workflowHistory = history.filter(h => h.workflow === workflowId);
    
    const lastRun = workflowHistory[0];
    const completedRuns = workflowHistory.filter(h => h.status === 'completed').length;
    const successRate = workflowHistory.length > 0 
      ? (completedRuns / workflowHistory.length) * 100 
      : 0;

    return {
      enabled: workflowConfig.enabled,
      lastRun,
      successRate
    };
  }
}
