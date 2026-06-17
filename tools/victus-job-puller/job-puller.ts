/**
 * Victus Job Puller
 * 
 * Polls KV for jobs assigned to Victus runner and executes them using local superpowers.
 * This is the Victus-side component of the dispatch model.
 * 
 * Jobs are pulled from KV with runner: "victus" and executed locally.
 * Results are written back to KV with proof attachments.
 */

import { VictusBridge, VictusCommand } from '../../src/core/victus_bridge';
import { Job, parseJob } from '@aether/contracts';

interface JobPullerConfig {
  victusBridge: VictusBridge;
  pollInterval: number; // milliseconds
  kvNamespace: string;
  runnerId: string;
}

interface JobExecutionResult {
  jobId: string;
  success: boolean;
  result?: {
    data?: Record<string, unknown>;
    error?: string;
    proofUrl?: string;
  };
  executionTime: number;
}

class VictusJobPuller {
  private config: JobPullerConfig;
  private isRunning: boolean = false;
  private pollTimer?: NodeJS.Timeout;

  constructor(config: JobPullerConfig) {
    this.config = config;
  }

  /**
   * Start polling for jobs
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Job puller already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting Victus job puller...');
    console.log(`Runner ID: ${this.config.runnerId}`);
    console.log(`Poll interval: ${this.config.pollInterval}ms`);

    // Poll immediately
    await this.poll();

    // Set up recurring poll
    this.pollTimer = setInterval(() => {
      this.poll().catch(error => {
        console.error('Poll error:', error);
      });
    }, this.config.pollInterval);
  }

  /**
   * Stop polling for jobs
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }

    console.log('Victus job puller stopped');
  }

  /**
   * Poll for pending jobs assigned to Victus
   */
  private async poll(): Promise<void> {
    try {
      // Get pending jobs for Victus runner
      const jobs = await this.getPendingJobs();

      if (jobs.length === 0) {
        return; // No jobs to process
      }

      console.log(`Found ${jobs.length} pending jobs for Victus`);

      // Process each job
      for (const job of jobs) {
        await this.processJob(job);
      }
    } catch (error) {
      console.error('Poll error:', error);
    }
  }

  /**
   * Get pending jobs from KV
   */
  private async getPendingJobs(): Promise<Job[]> {
    const command: VictusCommand = {
      operation: 'kv_list',
      args: {
        namespace: this.config.kvNamespace,
        prefix: 'job:',
        filter: {
          runner: 'victus',
          status: 'pending',
        },
      },
    };

    const response = await this.config.victusBridge.forwardCommand(command);

    if (!response.success) {
      throw new Error(`Failed to get jobs: ${response.error}`);
    }

    const jobsData = response.data as Record<string, unknown>[];
    return jobsData.map(data => parseJob(data));
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    console.log(`Processing job ${job.id}: ${job.type} for ${job.service}`);

    // Update job status to assigned
    await this.updateJobStatus(job.id, 'assigned');

    try {
      // Update job status to running
      await this.updateJobStatus(job.id, 'running', { startedAt: new Date().toISOString() });

      // Execute job based on type
      const result = await this.executeJob(job);

      // Update job with result
      await this.updateJobResult(job.id, 'completed', result);

      console.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Job ${job.id} failed:`, errorMessage);

      // Update job with error
      await this.updateJobResult(job.id, 'failed', {
        success: false,
        error: errorMessage,
      });

      // Check if should retry
      if (job.retryCount < job.maxRetries) {
        console.log(`Retrying job ${job.id} (attempt ${job.retryCount + 1}/${job.maxRetries})`);
        await this.updateJobStatus(job.id, 'pending', {
          retryCount: job.retryCount + 1,
        });
      }
    }
  }

  /**
   * Execute job based on type
   */
  private async executeJob(job: Job): Promise<JobExecutionResult> {
    const startTime = Date.now();

    switch (job.type) {
      case 'cancellation':
        return await this.executeCancellation(job);
      
      case 'discovery':
        return await this.executeDiscovery(job);
      
      case 'proof_capture':
        return await this.executeProofCapture(job);
      
      case 'verification':
        return await this.executeVerification(job);
      
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Execute cancellation job
   */
  private async executeCancellation(job: Job): Promise<JobExecutionResult> {
    console.log(`Executing cancellation for ${job.service}`);

    const command: VictusCommand = {
      operation: 'cancel_subscription',
      args: {
        service: job.service,
        trialId: job.trialId,
        method: job.cancelDifficulty || 'manual_only',
        payload: job.payload,
      },
    };

    const response = await this.config.victusBridge.forwardCommand(command);

    if (!response.success) {
      return {
        jobId: job.id,
        success: false,
        result: {
          error: response.error,
        },
        executionTime: Date.now() - Date.now(),
      };
    }

    return {
      jobId: job.id,
      success: true,
      result: {
        data: response.data as Record<string, unknown>,
        proofUrl: (response.data as { proofUrl?: string })?.proofUrl,
      },
      executionTime: Date.now() - Date.now(),
    };
  }

  /**
   * Execute discovery job
   */
  private async executeDiscovery(job: Job): Promise<JobExecutionResult> {
    console.log(`Executing discovery for ${job.service}`);

    const command: VictusCommand = {
      operation: 'discover_trial',
      args: {
        service: job.service,
        payload: job.payload,
      },
    };

    const response = await this.config.victusBridge.forwardCommand(command);

    if (!response.success) {
      return {
        jobId: job.id,
        success: false,
        result: {
          error: response.error,
        },
        executionTime: Date.now() - Date.now(),
      };
    }

    return {
      jobId: job.id,
      success: true,
      result: {
        data: response.data as Record<string, unknown>,
      },
      executionTime: Date.now() - Date.now(),
    };
  }

  /**
   * Execute proof capture job
   */
  private async executeProofCapture(job: Job): Promise<JobExecutionResult> {
    console.log(`Executing proof capture for ${job.service}`);

    const command: VictusCommand = {
      operation: 'capture_proof',
      args: {
        trialId: job.trialId,
        service: job.service,
        proofType: 'screenshot', // or 'recording'
        payload: job.payload,
      },
    };

    const response = await this.config.victusBridge.forwardCommand(command);

    if (!response.success) {
      return {
        jobId: job.id,
        success: false,
        result: {
          error: response.error,
        },
        executionTime: Date.now() - Date.now(),
      };
    }

    return {
      jobId: job.id,
      success: true,
      result: {
        data: response.data as Record<string, unknown>,
        proofUrl: (response.data as { proofUrl?: string })?.proofUrl,
      },
      executionTime: Date.now() - Date.now(),
    };
  }

  /**
   * Execute verification job
   */
  private async executeVerification(job: Job): Promise<JobExecutionResult> {
    console.log(`Executing verification for ${job.service}`);

    const command: VictusCommand = {
      operation: 'verify_cancellation',
      args: {
        trialId: job.trialId,
        service: job.service,
        method: job.cancelDifficulty || 'manual_only',
        payload: job.payload,
      },
    };

    const response = await this.config.victusBridge.forwardCommand(command);

    if (!response.success) {
      return {
        jobId: job.id,
        success: false,
        result: {
          error: response.error,
        },
        executionTime: Date.now() - Date.now(),
      };
    }

    return {
      jobId: job.id,
      success: true,
      result: {
        data: response.data as Record<string, unknown>,
        proofUrl: (response.data as { proofUrl?: string })?.proofUrl,
      },
      executionTime: Date.now() - Date.now(),
    };
  }

  /**
   * Update job status in KV
   */
  private async updateJobStatus(
    jobId: string,
    status: Job['status'],
    updates?: Partial<Job>
  ): Promise<void> {
    const command: VictusCommand = {
      operation: 'kv_update',
      args: {
        namespace: this.config.kvNamespace,
        key: `job:${jobId}`,
        updates: {
          status,
          ...updates,
          lastHeartbeat: new Date().toISOString(),
        },
      },
    };

    const response = await this.config.victusBridge.forwardCommand(command);

    if (!response.success) {
      throw new Error(`Failed to update job status: ${response.error}`);
    }
  }

  /**
   * Update job result in KV
   */
  private async updateJobResult(
    jobId: string,
    status: Job['status'],
    result: JobExecutionResult
  ): Promise<void> {
    const command: VictusCommand = {
      operation: 'kv_update',
      args: {
        namespace: this.config.kvNamespace,
        key: `job:${jobId}`,
        updates: {
          status,
          result: result.result,
          completedAt: new Date().toISOString(),
          lastHeartbeat: new Date().toISOString(),
        },
      },
    };

    const response = await this.config.victusBridge.forwardCommand(command);

    if (!response.success) {
      throw new Error(`Failed to update job result: ${response.error}`);
    }
  }

  /**
   * Check if puller is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create Victus job puller with default configuration
 */
export function createVictusJobPuller(victusBridge: VictusBridge): VictusJobPuller {
  return new VictusJobPuller({
    victusBridge,
    pollInterval: 30000, // 30 seconds
    kvNamespace: 'TRIAL_JOBS',
    runnerId: 'victus-' + Math.random().toString(36).substr(2, 9),
  });
}

/**
 * Create Victus job puller with custom configuration
 */
export function createVictusJobPullerWithConfig(config: Partial<JobPullerConfig>, victusBridge: VictusBridge): VictusJobPuller {
  const defaultConfig: JobPullerConfig = {
    victusBridge,
    pollInterval: 30000,
    kvNamespace: 'TRIAL_JOBS',
    runnerId: 'victus-' + Math.random().toString(36).substr(2, 9),
  };

  const mergedConfig = {
    ...defaultConfig,
    ...config,
    victusBridge: config.victusBridge || victusBridge,
  };

  return new VictusJobPuller(mergedConfig);
}

export default VictusJobPuller;
