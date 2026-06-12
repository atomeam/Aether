/**
 * @aether/secret-management - Secret Management
 */

export class SecretManager {
  private secrets: Map<string, string> = new Map();
  
  set(key: string, value: string): void {
    this.secrets.set(key, value);
  }
  
  get(key: string): string {
    return this.secrets.get(key) || '';
  }
}

export const secretManager = new SecretManager();