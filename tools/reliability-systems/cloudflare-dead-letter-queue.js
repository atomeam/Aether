/**
 * Cloudflare-Native Dead-Letter Queue
 * Uses Cloudflare KV for persistence instead of JSON files
 * Provides atomic operations and serverless compatibility
 */

const { persistence } = require('./cloudflare-persistence');

class CloudflareDeadLetterQueue {
  constructor() {
    this.prefix = 'dlq:';
    this.stats = {
      totalFailed: 0,
      totalReplayed: 0,
      totalReplayedSuccess: 0,
      totalReplayedFailed: 0
    };
  }

  // Add failed job to dead-letter queue
  async addFailedJob(job, error, context = {}) {
    console.log(`💀 Adding failed job to DLQ: ${job.id}`);
    
    const deadLetterJob = {
      id: this.generateDeadLetterId(),
      originalJob: job,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        timestamp: new Date().toISOString()
      },
      context,
      attempts: job.attempts || 1,
      maxAttempts: job.maxAttempts || 3,
      addedAt: new Date().toISOString(),
      status: 'failed'
    };
    
    const key = `${this.prefix}${deadLetterJob.id}`;
    await persistence.kvSet(key, deadLetterJob);
    
    this.stats.totalFailed++;
    await this.updateStats();
    
    return deadLetterJob;
  }

  // Replay a failed job
  async replayJob(deadLetterId, replayFunction) {
    console.log(`🔄 Replaying job: ${deadLetterId}`);
    
    const key = `${this.prefix}${deadLetterId}`;
    const deadLetterJob = await persistence.kvGet(key);
    
    if (!deadLetterJob) {
      throw new Error('Job not found in dead-letter queue');
    }
    
    try {
      // Execute replay function
      const result = await replayFunction(deadLetterJob.originalJob, deadLetterJob.context);
      
      // Move to replay queue on success
      const replayedJob = {
        ...deadLetterJob,
        replayedAt: new Date().toISOString(),
        replayResult: result,
        status: 'replayed_success'
      };
      
      const replayKey = `${this.prefix}replay:${deadLetterId}`;
      await persistence.kvSet(replayKey, replayedJob);
      await persistence.kvDelete(key);
      
      this.stats.totalReplayed++;
      this.stats.totalReplayedSuccess++;
      await this.updateStats();
      
      return { success: true, result };
    } catch (error) {
      // Increment attempts
      deadLetterJob.attempts++;
      
      // Check if max attempts reached
      if (deadLetterJob.attempts >= deadLetterJob.maxAttempts) {
        deadLetterJob.status = 'permanently_failed';
        console.error(`❌ Job permanently failed after ${deadLetterJob.attempts} attempts`);
      } else {
        deadLetterJob.status = 'replay_failed';
        console.error(`❌ Replay failed, attempt ${deadLetterJob.attempts}/${deadLetterJob.maxAttempts}`);
      }
      
      deadLetterJob.lastError = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      
      await persistence.kvSet(key, deadLetterJob);
      
      this.stats.totalReplayed++;
      this.stats.totalReplayedFailed++;
      await this.updateStats();
      
      return { success: false, error };
    }
  }

  // Get all failed jobs
  async getFailedJobs() {
    const listed = await persistence.kvList(this.prefix);
    const jobs = [];
    
    for (const key of listed.keys) {
      const job = await persistence.kvGet(key.name);
      if (job && job.status === 'failed') {
        jobs.push(job);
      }
    }
    
    return jobs;
  }

  // Get permanently failed jobs
  async getPermanentlyFailedJobs() {
    const listed = await persistence.kvList(this.prefix);
    const jobs = [];
    
    for (const key of listed.keys) {
      const job = await persistence.kvGet(key.name);
      if (job && job.status === 'permanently_failed') {
        jobs.push(job);
      }
    }
    
    return jobs;
  }

  // Get replay history
  async getReplayHistory() {
    const listed = await persistence.kvList(`${this.prefix}replay:`);
    const jobs = [];
    
    for (const key of listed.keys) {
      const job = await persistence.kvGet(key.name);
      if (job) {
        jobs.push(job);
      }
    }
    
    return jobs;
  }

  // Get statistics
  async getStatistics() {
    const statsKey = `${this.prefix}stats`;
    const storedStats = await persistence.kvGet(statsKey);
    
    return storedStats || this.stats;
  }

  // Clear old jobs
  async clearOldJobs(maxAgeHours = 24) {
    console.log(`🧹 Clearing jobs older than ${maxAgeHours} hours...`);
    
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    const listed = await persistence.kvList(this.prefix);
    let cleared = 0;
    
    for (const key of listed.keys) {
      const job = await persistence.kvGet(key.name);
      if (job && new Date(job.addedAt) < cutoffTime) {
        await persistence.kvDelete(key.name);
        cleared++;
      }
    }
    
    console.log(`🧹 Cleared ${cleared} old jobs`);
    
    return cleared;
  }

  // Update statistics
  async updateStats() {
    const statsKey = `${this.prefix}stats`;
    await persistence.kvSet(statsKey, this.stats);
  }

  // Generate dead-letter ID
  generateDeadLetterId() {
    return `dlq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = {
  CloudflareDeadLetterQueue
};
