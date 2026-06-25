/**
 * @aether/batcher - Batcher
 */

export class Batcher<T> {
  private batch: T[] = [];
  private timer: any;
  
  constructor(private batchSize: number, private delay: number, private flush: (batch: T[]) => void) {}
  
  add(item: T): void {
    this.batch.push(item);
    if (this.batch.length >= this.batchSize) {
      this.flushBatch();
    } else {
      this.resetTimer();
    }
  }
  
  private resetTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flushBatch(), this.delay);
  }
  
  private flushBatch(): void {
    if (this.batch.length > 0) {
      this.flush([...this.batch]);
      this.batch = [];
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export function createBatcher<T>(batchSize: number, delay: number, flush: (batch: T[]) => void): Batcher<T> {
  return new Batcher(batchSize, delay, flush);
}