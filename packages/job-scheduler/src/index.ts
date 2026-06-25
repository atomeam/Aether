/**
 * @aether/job-scheduler - Job Scheduling System
 */

export class JobScheduler {
  private jobs: Map<string, any> = new Map();
  
  schedule(id: string, job: any, delay: number): void {
    setTimeout(() => {
      job();
      this.jobs.delete(id);
    }, delay);
    this.jobs.set(id, job);
  }
  
  cancel(id: string): void {
    this.jobs.delete(id);
  }
}

export const jobScheduler = new JobScheduler();