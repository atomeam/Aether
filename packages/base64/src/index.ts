/**
 * @aether/base64 - Base64 Utilities
 */

export class Base64 {
  encode(str: string): string {
    return Buffer.from(str).toString('base64');
  }
  
  decode(str: string): string {
    return Buffer.from(str, 'base64').toString();
  }
  
  encodeURL(str: string): string {
    return Buffer.from(str).toString('base64url');
  }
  
  decodeURL(str: string): string {
    return Buffer.from(str, 'base64url').toString();
  }
}

export const base64 = new Base64();