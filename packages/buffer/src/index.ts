/**
 * @aether/buffer - Buffer Utilities
 */

export class BufferUtils {
  concat(buffers: Buffer[]): Buffer {
    return Buffer.concat(buffers);
  }
  
  split(buffer: Buffer, delimiter: Buffer): Buffer[] {
    const result: Buffer[] = [];
    let start = 0;
    let index = 0;
    
    while ((index = buffer.indexOf(delimiter, start)) !== -1) {
      result.push(buffer.slice(start, index));
      start = index + delimiter.length;
    }
    
    result.push(buffer.slice(start));
    return result;
  }
  
  equals(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}

export const bufferUtils = new BufferUtils();