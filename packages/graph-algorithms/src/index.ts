/**
 * @aether/graph-algorithms - Graph Algorithms
 */

export interface GraphNode {
  id: string;
  edges: { to: string; weight?: number }[];
}

export class GraphAlgorithms {
  bfs(graph: Map<string, GraphNode>, start: string, target?: string): string[] {
    const visited = new Set<string>();
    const queue: string[] = [start];
    const parent = new Map<string, string | null>();
    
    parent.set(start, null);
    visited.add(start);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current === target) {
        return this.reconstructPath(parent, target);
      }
      
      const node = graph.get(current);
      if (node) {
        for (const edge of node.edges) {
          if (!visited.has(edge.to)) {
            visited.add(edge.to);
            parent.set(edge.to, current);
            queue.push(edge.to);
          }
        }
      }
    }
    
    return [];
  }
  
  dfs(graph: Map<string, GraphNode>, start: string, target?: string): string[] {
    const visited = new Set<string>();
    const parent = new Map<string, string | null>();
    const path: string[] = [];
    
    const traverse = (nodeId: string): boolean => {
      visited.add(nodeId);
      path.push(nodeId);
      
      if (nodeId === target) return true;
      
      const node = graph.get(nodeId);
      if (node) {
        for (const edge of node.edges) {
          if (!visited.has(edge.to)) {
            parent.set(edge.to, nodeId);
            if (traverse(edge.to)) return true;
          }
        }
      }
      
      path.pop();
      return false;
    };
    
    parent.set(start, null);
    if (traverse(start) && target) {
      return this.reconstructPath(parent, target);
    }
    
    return path;
  }
  
  dijkstra(graph: Map<string, GraphNode>, start: string, target: string): { path: string[]; distance: number } {
    const distances = new Map<string, number>();
    const parent = new Map<string, string | null>();
    const visited = new Set<string>();
    const queue: string[] = [];
    
    for (const nodeId of graph.keys()) {
      distances.set(nodeId, Infinity);
      queue.push(nodeId);
    }
    
    distances.set(start, 0);
    parent.set(start, null);
    
    while (queue.length > 0) {
      queue.sort((a, b) => (distances.get(a) ?? Infinity) - (distances.get(b) ?? Infinity));
      const current = queue.shift()!;
      
      if (current === target) break;
      if (visited.has(current)) continue;
      
      visited.add(current);
      
      const node = graph.get(current);
      if (node) {
        for (const edge of node.edges) {
          const weight = edge.weight ?? 1;
          const alt = (distances.get(current) ?? 0) + weight;
          
          if (alt < (distances.get(edge.to) ?? Infinity)) {
            distances.set(edge.to, alt);
            parent.set(edge.to, current);
          }
        }
      }
    }
    
    const path = this.reconstructPath(parent, target);
    return {
      path,
      distance: distances.get(target) ?? Infinity
    };
  }
  
  topologicalSort(graph: Map<string, GraphNode>): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const result: string[] = [];
    
    const visit = (nodeId: string): boolean => {
      if (temp.has(nodeId)) return false; // Cycle detected
      if (visited.has(nodeId)) return true;
      
      temp.add(nodeId);
      
      const node = graph.get(nodeId);
      if (node) {
        for (const edge of node.edges) {
          if (!visit(edge.to)) return false;
        }
      }
      
      temp.delete(nodeId);
      visited.add(nodeId);
      result.unshift(nodeId);
      
      return true;
    };
    
    for (const nodeId of graph.keys()) {
      if (!visit(nodeId)) {
        return []; // Cycle detected
      }
    }
    
    return result;
  }
  
  private reconstructPath(parent: Map<string, string | null>, target: string): string[] {
    const path: string[] = [];
    let current: string | null = target;
    
    while (current !== null) {
      path.unshift(current);
      current = parent.get(current) ?? null;
    }
    
    return path;
  }
}

export const graphAlgorithms = new GraphAlgorithms();