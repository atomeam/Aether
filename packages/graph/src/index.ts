/**
 * @aether/graph - Advanced Graph Algorithms and Data Structures
 *
 * A comprehensive graph library providing:
 * - Graph data structures (adjacency list, adjacency matrix)
 * - Graph traversal algorithms (BFS, DFS)
 * - Shortest path algorithms (Dijkstra, A*)
 * - Minimum spanning tree algorithms (Prim's, Kruskal's)
 * - Graph coloring algorithms (Greedy, Welsh-Powell)
 * - Topological sort algorithms (Kahn's, DFS-based)
 *
 * @version 1.0.0
 */

// Export basic graph data structure
export class Graph<T> {
  private adjacencyList: Map<T, Set<T>> = new Map();

  addVertex(vertex: T): void {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, new Set());
    }
  }

  addEdge(vertex1: T, vertex2: T): void {
    this.addVertex(vertex1);
    this.addVertex(vertex2);
    this.adjacencyList.get(vertex1)!.add(vertex2);
    this.adjacencyList.get(vertex2)!.add(vertex1);
  }

  addDirectedEdge(from: T, to: T): void {
    this.addVertex(from);
    this.addVertex(to);
    this.adjacencyList.get(from)!.add(to);
  }

  removeVertex(vertex: T): void {
    this.adjacencyList.delete(vertex);
    for (const neighbors of this.adjacencyList.values()) {
      neighbors.delete(vertex);
    }
  }

  removeEdge(vertex1: T, vertex2: T): void {
    this.adjacencyList.get(vertex1)?.delete(vertex2);
    this.adjacencyList.get(vertex2)?.delete(vertex1);
  }

  hasVertex(vertex: T): boolean {
    return this.adjacencyList.has(vertex);
  }

  hasEdge(vertex1: T, vertex2: T): boolean {
    return this.adjacencyList.get(vertex1)?.has(vertex2) ?? false;
  }

  getNeighbors(vertex: T): Set<T> | undefined {
    return this.adjacencyList.get(vertex);
  }

  getAllVertices(): T[] {
    return Array.from(this.adjacencyList.keys());
  }

  bfs(start: T, visit: (vertex: T) => void): void {
    const visited = new Set<T>();
    const queue: T[] = [start];

    while (queue.length > 0) {
      const vertex = queue.shift()!;
      if (visited.has(vertex)) continue;

      visited.add(vertex);
      visit(vertex);

      for (const neighbor of this.adjacencyList.get(vertex) || []) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }

  dfs(start: T, visit: (vertex: T) => void): void {
    const visited = new Set<T>();

    const traverse = (vertex: T) => {
      if (visited.has(vertex)) return;

      visited.add(vertex);
      visit(vertex);

      for (const neighbor of this.adjacencyList.get(vertex) || []) {
        traverse(neighbor);
      }
    };

    traverse(start);
  }
}

export function createGraph<T>(): Graph<T> {
  return new Graph<T>();
}

// Export types and schemas
export * from './types';

// Export algorithms
export * from './algorithms';