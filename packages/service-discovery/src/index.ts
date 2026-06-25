/**
 * @aether/service-discovery - Service Discovery
 */

export class ServiceDiscovery {
  private services: Map<string, string[]> = new Map();
  
  register(name: string, url: string): void {
    const urls = this.services.get(name) || [];
    urls.push(url);
    this.services.set(name, urls);
  }
  
  discover(name: string): string[] {
    return this.services.get(name) || [];
  }
}

export const serviceDiscovery = new ServiceDiscovery();