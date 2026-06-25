/**
 * @aether/graph - Advanced Graph Algorithms
 */

import {
  Vertex,
  Edge,
  AdjacencyList,
  PathResult,
  MSTResult,
  ColoringResult,
  TopologicalSortResult
} from './types';

// =============================================================================
// BREADTH-FIRST SEARCH (BFS)
// =============================================================================

/**
 * Breadth-First Search traversal
 * @param graph - Adjacency list representation of the graph
 * @param start - Starting vertex
 * @param visit - Callback function for each visited vertex
 */
export function bfs(
  graph: AdjacencyList,
  start: Vertex,
  visit: (vertex: Vertex) => void
): void {
  const visited = new Set<string>();
  const queue: Vertex[] = [start];
  const startKey = String(start);

  while (queue.length > 0) {
    const vertex = queue.shift()!;
    const key = String(vertex);

    if (visited.has(key)) continue;
    visited.add(key);
    visit(vertex);

    const neighbors = graph[key] || [];
    for (const neighbor of neighbors) {
      const neighborKey = String(neighbor.vertex);
      if (!visited.has(neighborKey)) {
        queue.push(neighbor.vertex);
      }
    }
  }
}

/**
 * BFS to find shortest path in unweighted graph
 */
export function bfsShortestPath(
  graph: AdjacencyList,
  start: Vertex,
  end: Vertex
): PathResult {
  const visited = new Set<string>();
  const queue: Vertex[] = [start];
  const parent = new Map<string, Vertex>();
  const startKey = String(start);
  const endKey = String(end);

  visited.add(startKey);

  while (queue.length > 0) {
    const vertex = queue.shift()!;
    const key = String(vertex);

    if (key === endKey) {
      // Reconstruct path
      const path: Vertex[] = [];
      let current: Vertex | undefined = end;
      while (current !== undefined) {
        path.unshift(current);
        const currentKey = String(current);
        current = parent.get(currentKey);
      }
      return { path, distance: path.length - 1 };
    }

    const neighbors = graph[key] || [];
    for (const neighbor of neighbors) {
      const neighborKey = String(neighbor.vertex);
      if (!visited.has(neighborKey)) {
        visited.add(neighborKey);
        parent.set(neighborKey, vertex);
        queue.push(neighbor.vertex);
      }
    }
  }

  return { path: [], distance: Infinity };
}

// =============================================================================
// DEPTH-FIRST SEARCH (DFS)
// =============================================================================

/**
 * Depth-First Search traversal (iterative)
 */
export function dfs(
  graph: AdjacencyList,
  start: Vertex,
  visit: (vertex: Vertex) => void
): void {
  const visited = new Set<string>();
  const stack: Vertex[] = [start];

  while (stack.length > 0) {
    const vertex = stack.pop()!;
    const key = String(vertex);

    if (visited.has(key)) continue;
    visited.add(key);
    visit(vertex);

    const neighbors = graph[key] || [];
    for (const neighbor of neighbors) {
      const neighborKey = String(neighbor.vertex);
      if (!visited.has(neighborKey)) {
        stack.push(neighbor.vertex);
      }
    }
  }
}

/**
 * DFS traversal (recursive)
 */
export function dfsRecursive(
  graph: AdjacencyList,
  start: Vertex,
  visit: (vertex: Vertex) => void,
  visited = new Set<string>()
): void {
  const key = String(start);
  if (visited.has(key)) return;

  visited.add(key);
  visit(start);

  const neighbors = graph[key] || [];
  for (const neighbor of neighbors) {
    dfsRecursive(graph, neighbor.vertex, visit, visited);
  }
}

/**
 * Detect cycle in directed graph using DFS
 */
export function detectCycle(graph: AdjacencyList): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycle = (vertex: Vertex): boolean => {
    const key = String(vertex);
    visited.add(key);
    recursionStack.add(key);

    const neighbors = graph[key] || [];
    for (const neighbor of neighbors) {
      const neighborKey = String(neighbor.vertex);
      if (!visited.has(neighborKey)) {
        if (hasCycle(neighbor.vertex)) return true;
      } else if (recursionStack.has(neighborKey)) {
        return true;
      }
    }

    recursionStack.delete(key);
    return false;
  };

  for (const vertex of Object.keys(graph)) {
    if (!visited.has(vertex)) {
      if (hasCycle(vertex as Vertex)) return true;
    }
  }

  return false;
}

// =============================================================================
// DIJKSTRA'S SHORTEST PATH
// =============================================================================

/**
 * Dijkstra's algorithm for shortest path in weighted graph
 */
export function dijkstra(
  graph: AdjacencyList,
  start: Vertex,
  end: Vertex
): PathResult {
  const distances = new Map<string, number>();
  const parent = new Map<string, Vertex>();
  const visited = new Set<string>();
  const startKey = String(start);
  const endKey = String(end);

  // Initialize distances
  for (const vertex of Object.keys(graph)) {
    distances.set(vertex, Infinity);
  }
  distances.set(startKey, 0);

  while (visited.size < Object.keys(graph).length) {
    // Find unvisited vertex with minimum distance
    let minDistance = Infinity;
    let current: string | null = null;

    for (const [vertex, distance] of distances) {
      if (!visited.has(vertex) && distance < minDistance) {
        minDistance = distance;
        current = vertex;
      }
    }

    if (current === null || minDistance === Infinity) break;
    visited.add(current);

    if (current === endKey) {
      // Reconstruct path
      const path: Vertex[] = [];
      let pathVertex: Vertex | undefined = end;
      while (pathVertex !== undefined) {
        path.unshift(pathVertex);
        const pathKey = String(pathVertex);
        pathVertex = parent.get(pathKey);
      }
      return { path, distance: minDistance };
    }

    const neighbors = graph[current] || [];
    for (const neighbor of neighbors) {
      const neighborKey = String(neighbor.vertex);
      if (visited.has(neighborKey)) continue;

      const weight = neighbor.weight || 1;
      const newDistance = minDistance + weight;

      if (newDistance < (distances.get(neighborKey) || Infinity)) {
        distances.set(neighborKey, newDistance);
        parent.set(neighborKey, current as Vertex);
      }
    }
  }

  return { path: [], distance: Infinity };
}

/**
 * Dijkstra's algorithm to find shortest paths to all vertices
 */
export function dijkstraAll(
  graph: AdjacencyList,
  start: Vertex
): Map<string, PathResult> {
  const distances = new Map<string, number>();
  const parent = new Map<string, Vertex>();
  const visited = new Set<string>();
  const startKey = String(start);

  // Initialize distances
  for (const vertex of Object.keys(graph)) {
    distances.set(vertex, Infinity);
  }
  distances.set(startKey, 0);

  while (visited.size < Object.keys(graph).length) {
    let minDistance = Infinity;
    let current: string | null = null;

    for (const [vertex, distance] of distances) {
      if (!visited.has(vertex) && distance < minDistance) {
        minDistance = distance;
        current = vertex;
      }
    }

    if (current === null || minDistance === Infinity) break;
    visited.add(current);

    const neighbors = graph[current] || [];
    for (const neighbor of neighbors) {
      const neighborKey = String(neighbor.vertex);
      if (visited.has(neighborKey)) continue;

      const weight = neighbor.weight || 1;
      const newDistance = minDistance + weight;

      if (newDistance < (distances.get(neighborKey) || Infinity)) {
        distances.set(neighborKey, newDistance);
        parent.set(neighborKey, current as Vertex);
      }
    }
  }

  // Build path results for all vertices
  const results = new Map<string, PathResult>();
  for (const vertex of Object.keys(graph)) {
    const path: Vertex[] = [];
    let pathVertex: Vertex | undefined = vertex as Vertex;
    while (pathVertex !== undefined) {
      path.unshift(pathVertex);
      const pathKey = String(pathVertex);
      pathVertex = parent.get(pathKey);
    }
    results.set(vertex, {
      path,
      distance: distances.get(vertex) || Infinity
    });
  }

  return results;
}

// =============================================================================
// A* SEARCH ALGORITHM
// =============================================================================

/**
 * A* search algorithm with heuristic function
 * @param graph - Adjacency list with weighted edges
 * @param start - Starting vertex
 * @param end - Target vertex
 * @param heuristic - Heuristic function estimating cost to goal
 */
export function aStar(
  graph: AdjacencyList,
  start: Vertex,
  end: Vertex,
  heuristic: (vertex: Vertex, goal: Vertex) => number
): PathResult {
  const openSet = new Set<string>([String(start)]);
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const parent = new Map<string, Vertex>();
  const startKey = String(start);
  const endKey = String(end);

  // Initialize scores
  for (const vertex of Object.keys(graph)) {
    gScore.set(vertex, Infinity);
    fScore.set(vertex, Infinity);
  }
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(start, end));

  while (openSet.size > 0) {
    // Find vertex in openSet with lowest fScore
    let minFScore = Infinity;
    let current: string | null = null;

    for (const vertex of openSet) {
      const score = fScore.get(vertex) || Infinity;
      if (score < minFScore) {
        minFScore = score;
        current = vertex;
      }
    }

    if (current === null) break;
    if (current === endKey) {
      // Reconstruct path
      const path: Vertex[] = [];
      let pathVertex: Vertex | undefined = end;
      while (pathVertex !== undefined) {
        path.unshift(pathVertex);
        const pathKey = String(pathVertex);
        pathVertex = parent.get(pathKey);
      }
      return { path, distance: gScore.get(endKey) || 0 };
    }

    openSet.delete(current);

    const neighbors = graph[current] || [];
    for (const neighbor of neighbors) {
      const neighborKey = String(neighbor.vertex);
      const weight = neighbor.weight || 1;
      const tentativeGScore = (gScore.get(current) || 0) + weight;

      if (tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
        parent.set(neighborKey, current as Vertex);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(
          neighborKey,
          tentativeGScore + heuristic(neighbor.vertex, end)
        );
        openSet.add(neighborKey);
      }
    }
  }

  return { path: [], distance: Infinity };
}

// =============================================================================
// MINIMUM SPANNING TREE (PRIM'S ALGORITHM)
// =============================================================================

/**
 * Prim's algorithm for Minimum Spanning Tree
 */
export function primMST(graph: AdjacencyList): MSTResult {
  const visited = new Set<string>();
  const edges: Edge[] = [];
  let totalWeight = 0;

  // Start with first vertex
  const vertices = Object.keys(graph);
  if (vertices.length === 0) return { edges, totalWeight };

  const start = vertices[0];
  visited.add(start);

  // Priority queue of edges (min-heap simulation using array)
  const edgeQueue: Array<{ from: Vertex; to: Vertex; weight: number }> = [];

  const addEdges = (vertex: string) => {
    const neighbors = graph[vertex] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(String(neighbor.vertex))) {
        edgeQueue.push({
          from: vertex as Vertex,
          to: neighbor.vertex,
          weight: neighbor.weight || 1
        });
      }
    }
  };

  addEdges(start);

  while (visited.size < vertices.length && edgeQueue.length > 0) {
    // Find minimum weight edge
    edgeQueue.sort((a, b) => a.weight - b.weight);
    const edge = edgeQueue.shift()!;
    const toKey = String(edge.to);

    if (visited.has(toKey)) continue;

    visited.add(toKey);
    edges.push({ from: edge.from, to: edge.to, weight: edge.weight });
    totalWeight += edge.weight;
    addEdges(toKey);
  }

  return { edges, totalWeight };
}

// =============================================================================
// MINIMUM SPANNING TREE (KRUSKAL'S ALGORITHM)
// =============================================================================

/**
 * Kruskal's algorithm for Minimum Spanning Tree using Union-Find
 */
export function kruskalMST(edges: Edge[]): MSTResult {
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();
  const mstEdges: Edge[] = [];
  let totalWeight = 0;

  // Initialize Union-Find
  const find = (vertex: string): string => {
    if (parent.get(vertex) !== vertex) {
      parent.set(vertex, find(parent.get(vertex)!));
    }
    return parent.get(vertex)!;
  };

  const union = (v1: string, v2: string): void => {
    const root1 = find(v1);
    const root2 = find(v2);

    if (root1 === root2) return;

    const rank1 = rank.get(root1) || 0;
    const rank2 = rank.get(root2) || 0;

    if (rank1 < rank2) {
      parent.set(root1, root2);
    } else if (rank1 > rank2) {
      parent.set(root2, root1);
    } else {
      parent.set(root2, root1);
      rank.set(root1, rank1 + 1);
    }
  };

  // Initialize parent and rank
  const vertices = new Set<string>();
  for (const edge of edges) {
    vertices.add(String(edge.from));
    vertices.add(String(edge.to));
  }

  for (const vertex of vertices) {
    parent.set(vertex, vertex);
    rank.set(vertex, 0);
  }

  // Sort edges by weight
  const sortedEdges = [...edges].sort((a, b) => (a.weight || 1) - (b.weight || 1));

  for (const edge of sortedEdges) {
    const fromKey = String(edge.from);
    const toKey = String(edge.to);

    if (find(fromKey) !== find(toKey)) {
      union(fromKey, toKey);
      mstEdges.push(edge);
      totalWeight += edge.weight || 1;
    }
  }

  return { edges: mstEdges, totalWeight };
}

// =============================================================================
// GRAPH COLORING (GREEDY ALGORITHM)
// =============================================================================

/**
 * Greedy graph coloring algorithm
 */
export function graphColoring(graph: AdjacencyList): ColoringResult {
  const colors = new Map<string, number>();
  const vertices = Object.keys(graph);

  for (const vertex of vertices) {
    const neighbors = graph[vertex] || [];
    const usedColors = new Set<number>();

    for (const neighbor of neighbors) {
      const neighborColor = colors.get(String(neighbor.vertex));
      if (neighborColor !== undefined) {
        usedColors.add(neighborColor);
      }
    }

    // Find smallest available color
    let color = 0;
    while (usedColors.has(color)) {
      color++;
    }

    colors.set(vertex, color);
  }

  const numColors = Math.max(...Array.from(colors.values())) + 1;
  return { colors, numColors };
}

/**
 * Graph coloring with specific vertex order (Welsh-Powell algorithm)
 */
export function welshPowellColoring(graph: AdjacencyList): ColoringResult {
  const colors = new Map<string, number>();
  const vertices = Object.keys(graph);

  // Sort vertices by degree (descending)
  const sortedVertices = vertices.sort((a, b) => {
    const degreeA = (graph[a] || []).length;
    const degreeB = (graph[b] || []).length;
    return degreeB - degreeA;
  });

  for (const vertex of sortedVertices) {
    const neighbors = graph[vertex] || [];
    const usedColors = new Set<number>();

    for (const neighbor of neighbors) {
      const neighborColor = colors.get(String(neighbor.vertex));
      if (neighborColor !== undefined) {
        usedColors.add(neighborColor);
      }
    }

    let color = 0;
    while (usedColors.has(color)) {
      color++;
    }

    colors.set(vertex, color);
  }

  const numColors = Math.max(...Array.from(colors.values())) + 1;
  return { colors, numColors };
}

// =============================================================================
// TOPOLOGICAL SORT
// =============================================================================

/**
 * Topological sort using Kahn's algorithm (BFS-based)
 */
export function topologicalSortKahn(
  graph: AdjacencyList
): TopologicalSortResult {
  const inDegree = new Map<string, number>();
  const vertices = Object.keys(graph);
  const order: Vertex[] = [];

  // Calculate in-degrees
  for (const vertex of vertices) {
    inDegree.set(vertex, 0);
  }

  for (const vertex of vertices) {
    const neighbors = graph[vertex] || [];
    for (const neighbor of neighbors) {
      const neighborKey = String(neighbor.vertex);
      inDegree.set(
        neighborKey,
        (inDegree.get(neighborKey) || 0) + 1
      );
    }
  }

  // Initialize queue with vertices of in-degree 0
  const queue: string[] = [];
  for (const [vertex, degree] of inDegree) {
    if (degree === 0) {
      queue.push(vertex);
    }
  }

  let processed = 0;

  while (queue.length > 0) {
    const vertex = queue.shift()!;
    order.push(vertex as Vertex);
    processed++;

    const neighbors = graph[vertex] || [];
    for (const neighbor of neighbors) {
      const neighborKey = String(neighbor.vertex);
      const newDegree = (inDegree.get(neighborKey) || 0) - 1;
      inDegree.set(neighborKey, newDegree);

      if (newDegree === 0) {
        queue.push(neighborKey);
      }
    }
  }

  // If not all vertices processed, there's a cycle
  const hasCycle = processed !== vertices.length;
  return { order, hasCycle };
}

/**
 * Topological sort using DFS
 */
export function topologicalSortDFS(
  graph: AdjacencyList
): TopologicalSortResult {
  const visited = new Set<string>();
  const tempVisited = new Set<string>();
  const order: Vertex[] = [];
  const vertices = Object.keys(graph);

  const visit = (vertex: string): boolean => {
    if (tempVisited.has(vertex)) return true; // Cycle detected
    if (visited.has(vertex)) return false;

    tempVisited.add(vertex);

    const neighbors = graph[vertex] || [];
    for (const neighbor of neighbors) {
      const neighborKey = String(neighbor.vertex);
      if (visit(neighborKey)) return true;
    }

    tempVisited.delete(vertex);
    visited.add(vertex);
    order.unshift(vertex as Vertex);

    return false;
  };

  let hasCycle = false;
  for (const vertex of vertices) {
    if (!visited.has(vertex)) {
      if (visit(vertex)) {
        hasCycle = true;
        break;
      }
    }
  }

  return { order, hasCycle };
}
