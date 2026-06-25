/**
 * @aether/task-scheduler - Task Scheduler
 */

export class TaskScheduler {
  private tasks: Map<string, any> = new Map();
  
  schedule(id: string, task: () => void, delay: number): void {
    const timeout = setTimeout(() => {
      task();
      this.tasks.delete(id);
    }, delay);
    this.tasks.set(id, timeout);
  }
  
  cancel(id: string): void {
    const timeout = this.tasks.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.tasks.delete(id);
    }
  }
}

export const taskScheduler = new TaskScheduler();