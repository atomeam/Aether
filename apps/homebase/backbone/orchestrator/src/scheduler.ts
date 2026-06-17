import cron from 'node-cron';
import { logger } from '../../shared/logger';
import { loadConfig } from '../../shared/config';
import { WorkflowEngine } from './workflow';

export class Scheduler {
  private workflowEngine: WorkflowEngine;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  constructor(workflowEngine: WorkflowEngine) {
    this.workflowEngine = workflowEngine;
  }

  start(): void {
    const config = loadConfig();
    
    if (!config.scheduler.enabled) {
      logger.info('Scheduler is disabled');
      return;
    }

    logger.info('Starting scheduler', { 
      timezone: config.scheduler.timezone 
    });

    // Schedule each enabled workflow
    Object.entries(config.workflows).forEach(([workflowId, workflowConfig]) => {
      if (workflowConfig.enabled && workflowConfig.schedule) {
        this.scheduleWorkflow(workflowId, workflowConfig.schedule);
      }
    });

    logger.info(`Scheduler started with ${this.scheduledTasks.size} workflows`);
  }

  stop(): void {
    logger.info('Stopping scheduler');
    
    this.scheduledTasks.forEach((task, workflowId) => {
      task.stop();
      logger.info(`Stopped workflow: ${workflowId}`);
    });

    this.scheduledTasks.clear();
    logger.info('Scheduler stopped');
  }

  private scheduleWorkflow(workflowId: string, schedule: string): void {
    try {
      const task = cron.schedule(schedule, async () => {
        logger.info(`Executing scheduled workflow: ${workflowId}`);
        
        try {
          await this.workflowEngine.executeWorkflow(workflowId, {
            trigger: 'scheduler'
          });
        } catch (error) {
          logger.error(`Scheduled workflow failed: ${workflowId}`, { 
            error: (error as Error).message 
          });
        }
      }, {
        timezone: loadConfig().scheduler.timezone
      });

      this.scheduledTasks.set(workflowId, task);
      logger.info(`Scheduled workflow: ${workflowId}`, { schedule });
    } catch (error) {
      logger.error(`Failed to schedule workflow: ${workflowId}`, { 
        error: (error as Error).message 
      });
    }
  }

  getScheduledWorkflows(): string[] {
    return Array.from(this.scheduledTasks.keys());
  }

  getAllWorkflows(): string[] {
    const config = loadConfig();
    return Object.keys(config.workflows).filter(workflowId => {
      return config.workflows[workflowId].enabled;
    });
  }
}
