/**
 * @aether/uuid - UUID Generator
 */

export class UUID {
  v4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  v5(namespace: string, name: string): string {
    const hash = this.hash(namespace + name);
    return this.formatUUID(hash);
  }
  
  private hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  private formatUUID(hash: string): string {
    const hex = hash.padStart(32, '0');
    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      '5' + hex.substring(13, 16),
      '8' + hex.substring(16, 20),
      hex.substring(20, 32)
    ].join('-');
  }
}

export const uuid = new UUID();