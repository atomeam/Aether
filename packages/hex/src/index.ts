/**
 * @aether/hex - Hex Utilities
 */

export class Hex {
  encode(bytes: Buffer): string {
    return bytes.toString('hex');
  }
  
  decode(hex: string): Buffer {
    return Buffer.from(hex, 'hex');
  }
  
  toString(bytes: Buffer): string {
    return bytes.toString('hex');
  }
  
  fromString(hex: string): Buffer {
    return Buffer.from(hex, 'hex');
  }
}

export const hex = new Hex();