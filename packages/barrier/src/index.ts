/**
 * @aether/barrier - Barrier
 */

export class Barrier {
  private count: number;
  private callbacks: Array<() => void> = [];
  
  constructor(count: number) {
    this.count = count;
  }
  
  async wait(): Promise<void> {
    if (this.count <= 0) return;
    
    return new Promise(resolve => {
      this.callbacks.push(resolve);
    });
  }
  
  signal(): void {
    this.count--;
    if (this.count <= 0) {
      this.callbacks.forEach(cb => cb());
      this.callbacks = [];
    }
  }
}

export const barrier = new Barrier(1);