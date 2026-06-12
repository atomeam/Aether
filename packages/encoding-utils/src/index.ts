/**
 * @aether/encoding-utils - Encoding/Decoding Utilities
 */

export class EncodingUtils {
  utf8Encode(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }
  
  utf8Decode(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
  }
  
  base64Encode(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }
  
  base64Decode(str: string): Uint8Array {
    const binaryString = atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  
  base64UrlEncode(bytes: Uint8Array): string {
    return this.base64Encode(bytes)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  
  base64UrlDecode(str: string): Uint8Array {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return this.base64Decode(base64);
  }
  
  hexEncode(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  hexDecode(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }
  
  percentEncode(str: string): string {
    return encodeURIComponent(str);
  }
  
  percentDecode(str: string): string {
    return decodeURIComponent(str);
  }
}

export const encodingUtils = new EncodingUtils();