/**
 * @aether/crypto-utils - Cryptographic Utilities
 */

export class CryptoUtils {
  async hashSHA256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  async hashSHA512(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-512', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  async hashMD5(data: string): Promise<string> {
    // Simple hash function (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  async randomBytes(length: number): Promise<Uint8Array> {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  }
  
  async randomString(length: number): Promise<string> {
    const bytes = await this.randomBytes(length);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  async randomInt(min: number, max: number): Promise<number> {
    const range = max - min + 1;
    const bytes = await this.randomBytes(4);
    const value = new DataView(bytes.buffer).getUint32(0);
    return min + (value % range);
  }
  
  async hmac(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const dataBuffer = encoder.encode(data);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);
    const signatureArray = Array.from(new Uint8Array(signature));
    return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const cryptoUtils = new CryptoUtils();