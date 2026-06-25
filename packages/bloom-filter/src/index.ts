/**
 * @aether/bloom-filter - Bloom Filter
 */

export class BloomFilter {
  private bitArray: Uint8Array;
  private size: number;
  private hashCount: number;
  
  constructor(size: number = 1000, hashCount: number = 3) {
    this.size = size;
    this.hashCount = hashCount;
    this.bitArray = new Uint8Array(Math.ceil(size / 8));
  }
  
  private hash(value: string, seed: number): number {
    let hash = seed;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % this.size;
  }
  
  add(value: string): void {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.hash(value, i);
      const byteIndex = Math.floor(index / 8);
      const bitIndex = index % 8;
      this.bitArray[byteIndex] |= (1 << bitIndex);
    }
  }
  
  has(value: string): boolean {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.hash(value, i);
      const byteIndex = Math.floor(index / 8);
      const bitIndex = index % 8;
      if ((this.bitArray[byteIndex] & (1 << bitIndex)) === 0) {
        return false;
      }
    }
    return true;
  }
  
  clear(): void {
    this.bitArray.fill(0);
  }
}

export function createBloomFilter(size?: number, hashCount?: number): BloomFilter {
  return new BloomFilter(size, hashCount);
}