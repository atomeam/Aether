/**
 * @aether/cyclic-barrier - Cyclic Barrier
 */

export class CyclicBarrier {
  private parties: number;
  private waiting: number = 0;
  private callbacks: Array<() => void> = [];
  
  constructor(parties: number) {
    this.parties = parties;
  }
  
  async await(): Promise<void> {
    this.waiting++;
    if (this.waiting >= this.parties) {
      this.waiting = 0;
      this.callbacks.forEach(cb => cb());
      this.callbacks = [];
      return;
    }
    
    return new Promise(resolve => {
      this.callbacks.push(resolve);
    });
  }
}

export const cyclicBarrier = new CyclicBarrier(3);