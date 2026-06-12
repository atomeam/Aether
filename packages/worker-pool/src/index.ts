/**
 * @aether/worker-pool - Worker Pool
 */

export class WorkerPool {
  private workers: any[] = [];
  private queue: any[] = [];
  
  constructor(private size: number) {
    for (let i = 0; i < size; i++) {
      this.workers.push({ id: i, busy: false });
    }
  }
  
  execute(task: any): void {
    const worker = this.workers.find(w => !w.busy);
    if (worker) {
      worker.busy = true;
      task().then(() => worker.busy = false);
    } else {
      this.queue.push(task);
    }
  }
}

export const workerPool = new WorkerPool(4);