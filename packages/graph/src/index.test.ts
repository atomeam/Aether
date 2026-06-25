/**
 * @aether/graph - Graph Algorithms Tests
 */

import { describe, it, expect } from 'vitest';
import {
  Graph,
  createGraph,
  bfs,
  bfsShortestPath,
  dfs,
  dfsRecursive,
  detectCycle,
  dijkstra,
  dijkstraAll,
  aStar,
  primMST,
  kruskalMST,
  graphColoring,
  welshPowellColoring,
  topologicalSortKahn,
  topologicalSortDFS,
  AdjacencyList,
  Edge,
  Vertex,
  parseEdge,
  parsePathResult,
  parseMSTResult,
  parseColoringResult,
  parseTopologicalSortResult
} from './index';

describe('Graph Data Structure', () => {
  it('should create an empty graph', () => {
    const graph = createGraph<string>();
    expect(graph.getAllVertices()).toEqual([]);
  });

  it('should add vertices', () => {
    const graph = createGraph<string>();
    graph.addVertex('A');
    graph.addVertex('B');
    expect(graph.getAllVertices()).toEqual(['A', 'B']);
  });

  it('should add edges', () => {
    const graph = createGraph<string>();
    graph.addEdge('A', 'B');
    expect(graph.hasEdge('A', 'B')).toBe(true);
    expect(graph.hasEdge('B', 'A')).toBe(true);
  });

  it('should add directed edges', () => {
    const graph = createGraph<string>();
    graph.addDirectedEdge('A', 'B');
    expect(graph.hasEdge('A', 'B')).toBe(true);
    expect(graph.hasEdge('B', 'A')).toBe(false);
  });

  it('should remove vertices', () => {
    const graph = createGraph<string>();
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');
    graph.removeVertex('B');
    expect(graph.hasVertex('B')).toBe(false);
    expect(graph.hasEdge('A', 'B')).toBe(false);
  });

  it('should remove edges', () => {
    const graph = createGraph<string>();
    graph.addEdge('A', 'B');
    graph.removeEdge('A', 'B');
    expect(graph.hasEdge('A', 'B')).toBe(false);
  });

  it('should get neighbors', () => {
    const graph = createGraph<string>();
    graph.addEdge('A', 'B');
    graph.addEdge('A', 'C');
    const neighbors = graph.getNeighbors('A');
    expect(neighbors).toEqual(new Set(['B', 'C']));
  });
});

describe('BFS Traversal', () => {
  it('should traverse graph in BFS order', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }, { vertex: 'C' }],
      'B': [{ vertex: 'D' }],
      'C': [{ vertex: 'E' }],
      'D': [],
      'E': []
    };

    const visited: string[] = [];
    bfs(graph, 'A', (vertex) => visited.push(vertex as string));
    expect(visited).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('should find shortest path in unweighted graph', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }, { vertex: 'C' }],
      'B': [{ vertex: 'D' }],
      'C': [{ vertex: 'D' }],
      'D': []
    };

    const result = bfsShortestPath(graph, 'A', 'D');
    expect(result.path).toContain('A');
    expect(result.path).toContain('D');
    expect(result.distance).toBe(2);
  });

  it('should return empty path if no path exists', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }],
      'B': [],
      'C': []
    };

    const result = bfsShortestPath(graph, 'A', 'C');
    expect(result.path).toEqual([]);
    expect(result.distance).toBe(Infinity);
  });
});

describe('DFS Traversal', () => {
  it('should traverse graph in DFS order (iterative)', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }, { vertex: 'C' }],
      'B': [{ vertex: 'D' }],
      'C': [{ vertex: 'E' }],
      'D': [],
      'E': []
    };

    const visited: string[] = [];
    dfs(graph, 'A', (vertex) => visited.push(vertex as string));
    expect(visited).toContain('A');
    expect(visited).toContain('B');
    expect(visited).toContain('C');
    expect(visited).toContain('D');
    expect(visited).toContain('E');
  });

  it('should traverse graph in DFS order (recursive)', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }, { vertex: 'C' }],
      'B': [{ vertex: 'D' }],
      'C': [{ vertex: 'E' }],
      'D': [],
      'E': []
    };

    const visited: string[] = [];
    dfsRecursive(graph, 'A', (vertex) => visited.push(vertex as string));
    expect(visited).toContain('A');
    expect(visited).toContain('B');
    expect(visited).toContain('C');
    expect(visited).toContain('D');
    expect(visited).toContain('E');
  });
});

describe('Cycle Detection', () => {
  it('should detect cycle in directed graph', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }],
      'B': [{ vertex: 'C' }],
      'C': [{ vertex: 'A' }]
    };

    expect(detectCycle(graph)).toBe(true);
  });

  it('should not detect cycle in acyclic graph', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }],
      'B': [{ vertex: 'C' }],
      'C': []
    };

    expect(detectCycle(graph)).toBe(false);
  });
});

describe('Dijkstra Algorithm', () => {
  it('should find shortest path in weighted graph', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B', weight: 4 }, { vertex: 'C', weight: 2 }],
      'B': [{ vertex: 'D', weight: 3 }],
      'C': [{ vertex: 'B', weight: 1 }, { vertex: 'D', weight: 5 }],
      'D': []
    };

    const result = dijkstra(graph, 'A', 'D');
    expect(result.path).toContain('A');
    expect(result.path).toContain('D');
    expect(result.distance).toBe(6); // A -> C -> B -> D
  });

  it('should return infinite distance if no path exists', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }],
      'B': [],
      'C': []
    };

    const result = dijkstra(graph, 'A', 'C');
    expect(result.path).toEqual([]);
    expect(result.distance).toBe(Infinity);
  });

  it('should find shortest paths to all vertices', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B', weight: 4 }, { vertex: 'C', weight: 2 }],
      'B': [{ vertex: 'D', weight: 3 }],
      'C': [{ vertex: 'B', weight: 1 }, { vertex: 'D', weight: 5 }],
      'D': []
    };

    const results = dijkstraAll(graph, 'A');
    expect(results.get('A')?.distance).toBe(0);
    expect(results.get('B')?.distance).toBe(3);
    expect(results.get('C')?.distance).toBe(2);
    expect(results.get('D')?.distance).toBe(6);
  });
});

describe('A* Algorithm', () => {
  it('should find shortest path with heuristic', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B', weight: 4 }, { vertex: 'C', weight: 2 }],
      'B': [{ vertex: 'D', weight: 3 }],
      'C': [{ vertex: 'B', weight: 1 }, { vertex: 'D', weight: 5 }],
      'D': []
    };

    // Euclidean distance heuristic (simplified)
    const heuristic = (vertex: Vertex, goal: Vertex): number => {
      const positions: Record<string, [number, number]> = {
        'A': [0, 0],
        'B': [4, 0],
        'C': [2, 0],
        'D': [6, 0]
      };
      const [x1, y1] = positions[String(vertex)] || [0, 0];
      const [x2, y2] = positions[String(goal)] || [0, 0];
      return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    };

    const result = aStar(graph, 'A', 'D', heuristic);
    expect(result.path).toContain('A');
    expect(result.path).toContain('D');
    expect(result.distance).toBe(6);
  });

  it('should return empty path if no path exists', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }],
      'B': [],
      'C': []
    };

    const heuristic = () => 0;
    const result = aStar(graph, 'A', 'C', heuristic);
    expect(result.path).toEqual([]);
    expect(result.distance).toBe(Infinity);
  });
});

describe('Prim\'s MST Algorithm', () => {
  it('should find minimum spanning tree', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B', weight: 4 }, { vertex: 'C', weight: 2 }],
      'B': [{ vertex: 'A', weight: 4 }, { vertex: 'C', weight: 1 }, { vertex: 'D', weight: 3 }],
      'C': [{ vertex: 'A', weight: 2 }, { vertex: 'B', weight: 1 }, { vertex: 'D', weight: 5 }],
      'D': [{ vertex: 'B', weight: 3 }, { vertex: 'C', weight: 5 }]
    };

    const result = primMST(graph);
    expect(result.edges.length).toBe(3); // n-1 edges for n vertices
    expect(result.totalWeight).toBe(6); // B-C (1) + A-C (2) + B-D (3)
  });

  it('should handle empty graph', () => {
    const graph: AdjacencyList = {};
    const result = primMST(graph);
    expect(result.edges).toEqual([]);
    expect(result.totalWeight).toBe(0);
  });
});

describe('Kruskal\'s MST Algorithm', () => {
  it('should find minimum spanning tree', () => {
    const edges: Edge[] = [
      { from: 'A', to: 'B', weight: 4 },
      { from: 'A', to: 'C', weight: 2 },
      { from: 'B', to: 'C', weight: 1 },
      { from: 'B', to: 'D', weight: 3 },
      { from: 'C', to: 'D', weight: 5 }
    ];

    const result = kruskalMST(edges);
    expect(result.edges.length).toBe(3);
    expect(result.totalWeight).toBe(6);
  });

  it('should handle empty edge list', () => {
    const edges: Edge[] = [];
    const result = kruskalMST(edges);
    expect(result.edges).toEqual([]);
    expect(result.totalWeight).toBe(0);
  });
});

describe('Graph Coloring', () => {
  it('should color graph with greedy algorithm', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }, { vertex: 'C' }],
      'B': [{ vertex: 'A' }, { vertex: 'C' }],
      'C': [{ vertex: 'A' }, { vertex: 'B' }]
    };

    const result = graphColoring(graph);
    expect(result.numColors).toBe(3); // Triangle needs 3 colors
    expect(result.colors.size).toBe(3);
  });

  it('should color bipartite graph with 2 colors', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }, { vertex: 'C' }],
      'B': [{ vertex: 'A' }],
      'C': [{ vertex: 'A' }]
    };

    const result = graphColoring(graph);
    expect(result.numColors).toBe(2);
  });

  it('should use Welsh-Powell algorithm', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }, { vertex: 'C' }, { vertex: 'D' }],
      'B': [{ vertex: 'A' }, { vertex: 'C' }],
      'C': [{ vertex: 'A' }, { vertex: 'B' }],
      'D': [{ vertex: 'A' }]
    };

    const result = welshPowellColoring(graph);
    expect(result.numColors).toBeGreaterThan(0);
    expect(result.colors.size).toBe(4);
  });
});

describe('Topological Sort', () => {
  it('should sort DAG using Kahn\'s algorithm', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }, { vertex: 'C' }],
      'B': [{ vertex: 'D' }],
      'C': [{ vertex: 'D' }],
      'D': []
    };

    const result = topologicalSortKahn(graph);
    expect(result.hasCycle).toBe(false);
    expect(result.order).toContain('A');
    expect(result.order).toContain('B');
    expect(result.order).toContain('C');
    expect(result.order).toContain('D');

    // Check ordering constraints
    const aIndex = result.order.indexOf('A');
    const bIndex = result.order.indexOf('B');
    const dIndex = result.order.indexOf('D');
    expect(aIndex).toBeLessThan(bIndex);
    expect(bIndex).toBeLessThan(dIndex);
  });

  it('should detect cycle using Kahn\'s algorithm', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }],
      'B': [{ vertex: 'C' }],
      'C': [{ vertex: 'A' }]
    };

    const result = topologicalSortKahn(graph);
    expect(result.hasCycle).toBe(true);
  });

  it('should sort DAG using DFS', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }, { vertex: 'C' }],
      'B': [{ vertex: 'D' }],
      'C': [{ vertex: 'D' }],
      'D': []
    };

    const result = topologicalSortDFS(graph);
    expect(result.hasCycle).toBe(false);
    expect(result.order).toContain('A');
    expect(result.order).toContain('B');
    expect(result.order).toContain('C');
    expect(result.order).toContain('D');
  });

  it('should detect cycle using DFS', () => {
    const graph: AdjacencyList = {
      'A': [{ vertex: 'B' }],
      'B': [{ vertex: 'C' }],
      'C': [{ vertex: 'A' }]
    };

    const result = topologicalSortDFS(graph);
    expect(result.hasCycle).toBe(true);
  });
});

describe('Schema Validation', () => {
  it('should parse valid edge', () => {
    const edge = parseEdge({ from: 'A', to: 'B', weight: 5 });
    expect(edge.from).toBe('A');
    expect(edge.to).toBe('B');
    expect(edge.weight).toBe(5);
  });

  it('should parse valid path result', () => {
    const result = parsePathResult({ path: ['A', 'B', 'C'], distance: 2 });
    expect(result.path).toEqual(['A', 'B', 'C']);
    expect(result.distance).toBe(2);
  });

  it('should parse valid MST result', () => {
    const result = parseMSTResult({
      edges: [{ from: 'A', to: 'B', weight: 1 }],
      totalWeight: 1
    });
    expect(result.edges).toHaveLength(1);
    expect(result.totalWeight).toBe(1);
  });

  it('should parse valid coloring result', () => {
    const result = parseColoringResult({
      colors: { A: 0, B: 1 },
      numColors: 2
    });
    expect(result.colors.get('A')).toBe(0);
    expect(result.colors.get('B')).toBe(1);
    expect(result.numColors).toBe(2);
  });

  it('should parse valid topological sort result', () => {
    const result = parseTopologicalSortResult({
      order: ['A', 'B', 'C'],
      hasCycle: false
    });
    expect(result.order).toEqual(['A', 'B', 'C']);
    expect(result.hasCycle).toBe(false);
  });
});
