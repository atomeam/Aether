/**
 * Dead-Letter Queue System
 * Captures failed jobs for later inspection/replay instead of losing them
 */

const fs = require('fs');
const path = require('path');

class DeadLetterQueue {
  constructor() {
    this.queue = [];
    this.replayQueue = [];
    this.stats = {
      totalFailed: 0,
      totalReplayed: 0,
      totalReplayedSuccess: 0,
      totalReplayedFailed: 0
    };
    this.dataPath = path.resolve(__dirname, 'dead-letter-queue.json');
    this.loadQueue();
  }

  // Add failed job to dead-letter queue
  async addFailedJob(job, error, context = {}) {
    console.log(`💀 Adding failed job to dead-letter queue: ${job.id}`);
    
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
    
    this.queue.push(deadLetterJob);
    this.stats.totalFailed++;
    this.saveQueue();
    
    return deadLetterJob;
  }

  // Replay a failed job
  async replayJob(deadLetterId, replayFunction) {
    console.log(`🔄 Replaying job: ${deadLetterId}`);
    
    const jobIndex = this.queue.findIndex(j => j.id === deadLetterId);
    
    if (jobIndex === -1) {
      throw new Error('Job not found in dead-letter queue');
    }
    
    const deadLetterJob = this.queue[jobIndex];
    
    try {
      // Execute replay function
      const result = await replayFunction(deadLetterJob.originalJob, deadLetterJob.context);
      
      // Move to replay queue on success
      this.queue.splice(jobIndex, 1);
      this.replayQueue.push({
        ...deadLetterJob,
        replayedAt: new Date().toISOString(),
        replayResult: result,
        status: 'replayed_success'
      });
      
      this.stats.totalReplayed++;
      this.stats.totalReplayedSuccess++;
      this.saveQueue();
      
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
      
      this.stats.totalReplayed++;
      this.stats.totalReplayedFailed++;
      this.saveQueue();
      
      return { success: false, error };
    }
  }

  // Get all failed jobs
  getFailedJobs() {
    return this.queue.filter(j => j.status === 'failed');
  }

  // Get permanently failed jobs
  getPermanentlyFailedJobs() {
    return this.queue.filter(j => j.status === 'permanently_failed');
  }

  // Get replay history
  getReplayHistory() {
    return this.replayQueue;
  }

  // Get statistics
  getStatistics() {
    return {
      ...this.stats,
      queueSize: this.queue.length,
      replayQueueSize: this.replayQueue.length,
      permanentlyFailed: this.queue.filter(j => j.status === 'permanently_failed').length,
      replayable: this.queue.filter(j => j.status === 'failed' || j.status === 'replay_failed').length
    };
  }

  // Clear old jobs
  clearOldJobs(maxAgeHours = 24) {
    console.log(`🧹 Clearing jobs older than ${maxAgeHours} hours...`);
    
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    const beforeSize = this.queue.length;
    this.queue = this.queue.filter(j => new Date(j.addedAt) > cutoffTime);
    this.replayQueue = this.replayQueue.filter(j => new Date(j.replayedAt) > cutoffTime);
    
    const cleared = beforeSize - this.queue.length;
    console.log(`🧹 Cleared ${cleared} old jobs`);
    
    this.saveQueue();
    
    return cleared;
  }

  // Generate dead-letter ID
  generateDeadLetterId() {
    return `dlq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load queue
  loadQueue() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      this.queue = parsed.queue || [];
      this.replayQueue = parsed.replayQueue || [];
      this.stats = parsed.stats || this.stats;
    }
  }

  // Save queue
  saveQueue() {
    if (this.queue.length > 1000) {
      this.queue = this.queue.slice(-1000);
    }
    if (this.replayQueue.length > 1000) {
      this.replayQueue = this.replayQueue.slice(-1000);
    }
    fs.writeFileSync(this.dataPath, JSON.stringify({
      queue: this.queue,
      replayQueue: this.replayQueue,
      stats: this.stats
    }, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const dlq = new DeadLetterQueue();

  switch (command) {
    case 'stats':
      const stats = dlq.getStatistics();
      console.log('📊 Dead-Letter Queue Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    case 'list':
      const failed = dlq.getFailedJobs();
      console.log('💀 Failed Jobs:');
      console.log(JSON.stringify(failed, null, 2));
      break;

    case 'permanent':
      const permanent = dlq.getPermanentlyFailedJobs();
      console.log('❌ Permanently Failed Jobs:');
      console.log(JSON.stringify(permanent, null, 2));
      break;

    case 'replay':
      if (args[1]) {
        console.log('🔄 Replay requires a replay function - this is for programmatic use');
        console.log('Usage: const dlq = new DeadLetterQueue(); await dlq.replayJob(id, replayFunction)');
      } else {
        console.error('Usage: node dead-letter-queue.js replay <dead-letter-id>');
      }
      break;

    case 'history':
      const history = dlq.getReplayHistory();
      console.log('📜 Replay History:');
      console.log(JSON.stringify(history, null, 2));
      break;

    case 'clear':
      const hours = args[1] ? parseInt(args[1]) : 24;
      const cleared = dlq.clearOldJobs(hours);
      console.log(`🧹 Cleared ${cleared} old jobs`);
      break;

    default:
      console.log('💀 Dead-Letter Queue System');
      console.log('');
      console.log('Commands:');
      console.log('  stats      - Get statistics');
      console.log('  list       - List failed jobs');
      console.log('  permanent  - List permanently failed jobs');
      console.log('  replay     - Replay a job (programmatic)');
      console.log('  history    - Get replay history');
      console.log('  clear      - Clear old jobs');
      console.log('');
      console.log('Examples:');
      console.log('  node dead-letter-queue.js stats');
      console.log('  node dead-letter-queue.js list');
      console.log('  node dead-letter-queue.js permanent');
      console.log('  node dead-letter-queue.js history');
      console.log('  node dead-letter-queue.js clear 24');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  DeadLetterQueue
};
