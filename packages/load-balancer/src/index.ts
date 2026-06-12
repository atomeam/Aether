/**
 * @aether/load-balancer - Load Balancing
 */

export class LoadBalancer {
  private currentIndex = 0;
  
  select(servers: string[]): string {
    const server = servers[this.currentIndex % servers.length];
    this.currentIndex++;
    return server;
  }
}

export const loadBalancer = new LoadBalancer();