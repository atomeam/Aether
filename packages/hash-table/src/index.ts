/**
 * @aether/hash-table - Hash Table
 */

export class HashTable<K, V> {
  private buckets: Map<number, Array<{ key: K; value: V }>> = new Map();
  private size: number = 0;
  
  constructor(private capacity: number = 16) {}
  
  private hash(key: K): number {
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % this.capacity;
  }
  
  set(key: K, value: V): void {
    const index = this.hash(key);
    if (!this.buckets.has(index)) {
      this.buckets.set(index, []);
    }
    const bucket = this.buckets.get(index)!;
    const existing = bucket.find(item => item.key === key);
    if (existing) {
      existing.value = value;
    } else {
      bucket.push({ key, value });
      this.size++;
    }
  }
  
  get(key: K): V | undefined {
    const index = this.hash(key);
    const bucket = this.buckets.get(index);
    if (!bucket) return undefined;
    const item = bucket.find(item => item.key === key);
    return item?.value;
  }
  
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }
  
  delete(key: K): boolean {
    const index = this.hash(key);
    const bucket = this.buckets.get(index);
    if (!bucket) return false;
    const indexInBucket = bucket.findIndex(item => item.key === key);
    if (indexInBucket === -1) return false;
    bucket.splice(indexInBucket, 1);
    this.size--;
    return true;
  }
  
  getSize(): number {
    return this.size;
  }
  
  clear(): void {
    this.buckets.clear();
    this.size = 0;
  }
}

export function createHashTable<K, V>(capacity?: number): HashTable<K, V> {
  return new HashTable<K, V>(capacity);
}