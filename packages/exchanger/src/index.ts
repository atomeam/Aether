/**
 * @aether/exchanger - Exchanger
 */

export class Exchanger<T> {
  private item: T | null = null;
  private waiting: Array<(item: T) => void> = [];
  
  async exchange(item: T): Promise<T> {
    if (this.waiting.length > 0) {
      const partner = this.waiting.shift()!;
      const otherItem = this.item;
      this.item = item;
      partner(item);
      return otherItem!;
    }
    
    this.item = item;
    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }
}

export const exchanger = new Exchanger<any>();