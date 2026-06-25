/**
 * @aether/serializer - Serializer
 */

export class Serializer {
  serialize(obj: any): string {
    return JSON.stringify(obj);
  }
  
  deserialize<T>(str: string): T {
    return JSON.parse(str);
  }
  
  serializeBase64(obj: any): string {
    return Buffer.from(JSON.stringify(obj)).toString('base64');
  }
  
  deserializeBase64<T>(str: string): T {
    return JSON.parse(Buffer.from(str, 'base64').toString());
  }
}

export const serializer = new Serializer();