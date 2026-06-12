/**
 * @aether/bit-set - Bit Set
 */

export class BitSet {
  private bits: number[] = [];
  
  constructor(size: number = 32) {
    this.bits = new Array(Math.ceil(size / 32)).fill(0);
  }
  
  set(index: number): void {
    const arrayIndex = Math.floor(index / 32);
    const bitIndex = index % 32;
    this.bits[arrayIndex] |= (1 << bitIndex);
  }
  
  clear(index: number): void {
    const arrayIndex = Math.floor(index / 32);
    const bitIndex = index % 32;
    this.bits[arrayIndex] &= ~(1 << bitIndex);
  }
  
  get(index: number): boolean {
    const arrayIndex = Math.floor(index / 32);
    const bitIndex = index % 32;
    return (this.bits[arrayIndex] & (1 << bitIndex)) !== 0;
  }
  
  toggle(index: number): void {
    const arrayIndex = Math.floor(index / 32);
    const bitIndex = index % 32;
    this.bits[arrayIndex] ^= (1 << bitIndex);
  }
  
  reset(): void {
    this.bits.fill(0);
  }
  
  size(): number {
    return this.bits.length * 32;
  }
}

export function createBitSet(size?: number): BitSet {
  return new BitSet(size);
}