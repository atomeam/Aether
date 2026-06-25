/**
 * @aether/graph - Graph Algorithm Types and Schemas
 */

import { z } from 'zod';

// =============================================================================
// GRAPH TYPES
// =============================================================================

/**
 * Represents a vertex in a graph
 */
export type Vertex = string | number;

/**
 * Represents an edge in a graph
 */
export interface Edge {
  from: Vertex;
  to: Vertex;
  weight?: number;
}

/**
 * Graph types
 */
export enum GraphType {
  UNDIRECTED = 'undirected',
  DIRECTED = 'directed',
  WEIGHTED = 'weighted',
  UNWEIGHTED = 'unweighted'
}

/**
 * Graph representation using adjacency list
 */
export interface AdjacencyList {
  [key: string]: Array<{ vertex: Vertex; weight?: number }>;
}

/**
 * Graph representation using adjacency matrix
 */
export type AdjacencyMatrix = number[][];

/**
 * Path result from shortest path algorithms
 */
export interface PathResult {
  path: Vertex[];
  distance: number;
}

/**
 * Minimum spanning tree result
 */
export interface MSTResult {
  edges: Edge[];
  totalWeight: number;
}

/**
 * Graph coloring result
 */
export interface ColoringResult {
  colors: Map<Vertex, number>;
  numColors: number;
}

/**
 * Topological sort result
 */
export interface TopologicalSortResult {
  order: Vertex[];
  hasCycle: boolean;
}

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

/**
 * Schema for validating an edge
 */
export const EdgeSchema = z.object({
  from: z.union([z.string(), z.number()]),
  to: z.union([z.string(), z.number()]),
  weight: z.number().optional()
});

/**
 * Schema for validating a path result
 */
export const PathResultSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  distance: z.number()
});

/**
 * Schema for validating MST result
 */
export const MSTResultSchema = z.object({
  edges: z.array(EdgeSchema),
  totalWeight: z.number()
});

/**
 * Schema for validating coloring result
 */
export const ColoringResultSchema = z.object({
  colors: z.record(z.union([z.string(), z.number()]), z.number()),
  numColors: z.number()
});

/**
 * Schema for validating topological sort result
 */
export const TopologicalSortResultSchema = z.object({
  order: z.array(z.union([z.string(), z.number()])),
  hasCycle: z.boolean()
});

/**
 * Schema for validating graph type
 */
export const GraphTypeSchema = z.enum([
  GraphType.UNDIRECTED,
  GraphType.DIRECTED,
  GraphType.WEIGHTED,
  GraphType.UNWEIGHTED
]);

// =============================================================================
// VALIDATORS
// =============================================================================

/**
 * Parse and validate an edge
 */
export function parseEdge(data: unknown): Edge {
  return EdgeSchema.parse(data);
}

/**
 * Parse and validate a path result
 */
export function parsePathResult(data: unknown): PathResult {
  return PathResultSchema.parse(data);
}

/**
 * Parse and validate MST result
 */
export function parseMSTResult(data: unknown): MSTResult {
  return MSTResultSchema.parse(data);
}

/**
 * Parse and validate coloring result
 */
export function parseColoringResult(data: unknown): ColoringResult {
  const parsed = ColoringResultSchema.parse(data);
  return {
    colors: new Map(Object.entries(parsed.colors)),
    numColors: parsed.numColors
  };
}

/**
 * Parse and validate topological sort result
 */
export function parseTopologicalSortResult(data: unknown): TopologicalSortResult {
  return TopologicalSortResultSchema.parse(data);
}
