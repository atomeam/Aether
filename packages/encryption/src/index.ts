/**
 * @aether/encryption - Encryption
 */

export class Encryption {
  encrypt(text: string, key: string): string {
    return Buffer.from(text).toString('base64');
  }
  
  decrypt(encrypted: string, key: string): string {
    return Buffer.from(encrypted, 'base64').toString();
  }
}

export const encryption = new Encryption();