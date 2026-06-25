/**
 * @aether/geo - Geospatial Types and Schemas
 */

import { z } from 'zod';

// =============================================================================
// COORDINATE TYPES
// =============================================================================

/**
 * Geographic coordinate pair (latitude, longitude)
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Bounding box defined by min/max coordinates
 */
export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

/**
 * 3D coordinate with altitude
 */
export interface Coordinate3D extends Coordinate {
  altitude?: number;
}

// =============================================================================
// POLYGON TYPES
// =============================================================================

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Polygon defined by array of points
 */
export interface Polygon {
  points: Point[];
}

/**
 * Multi-polygon (multiple polygon rings)
 */
export interface MultiPolygon {
  polygons: Polygon[];
}

/**
 * Polygon operation result
 */
export interface PolygonOperationResult {
  area: number;
  perimeter: number;
  centroid: Point;
  isConvex: boolean;
}

/**
 * Point in polygon test result
 */
export interface PointInPolygonResult {
  inside: boolean;
  onEdge: boolean;
}

// =============================================================================
// GEOMETRY TYPES
// =============================================================================

/**
 * Line segment defined by two points
 */
export interface LineSegment {
  start: Point;
  end: Point;
}

/**
 * Circle defined by center and radius
 */
export interface Circle {
  center: Point;
  radius: number;
}

/**
 * Rectangle defined by bounds
 */
export interface Rectangle {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// =============================================================================
// PROJECTION TYPES
// =============================================================================

/**
 * Supported map projections
 */
export enum ProjectionType {
  MERCATOR = 'mercator',
  TRANSVERSE_MERCATOR = 'transverse_mercator',
  LAMBERT_CONFORMAL_CONIC = 'lambert_conformal_conic',
  ALBERS_EQUAL_AREA = 'albers_equal_area',
  UTM = 'utm',
  WEB_MERCATOR = 'web_mercator'
}

/**
 * Projection parameters
 */
export interface ProjectionParams {
  type: ProjectionType;
  centralMeridian?: number;
  standardParallel1?: number;
  standardParallel2?: number;
  falseEasting?: number;
  falseNorthing?: number;
  scaleFactor?: number;
  zone?: number; // For UTM
}

/**
 * Projected coordinate
 */
export interface ProjectedCoordinate {
  x: number;
  y: number;
  projection: ProjectionType;
}

// =============================================================================
// GEOCODING TYPES
// =============================================================================

/**
 * Geocoding result
 */
export interface GeocodeResult {
  address: string;
  coordinate: Coordinate;
  confidence: number;
  components?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

/**
 * Reverse geocoding result
 */
export interface ReverseGeocodeResult {
  address: string;
  coordinate: Coordinate;
  components?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

// =============================================================================
// DISTANCE TYPES
// =============================================================================

/**
 * Distance calculation methods
 */
export enum DistanceMethod {
  HAVERSINE = 'haversine',
  VINCENTY = 'vincenty',
  GREAT_CIRCLE = 'great_circle',
  EUCLDEAN = 'euclidean'
}

/**
 * Distance result with method information
 */
export interface DistanceResult {
  distance: number;
  method: DistanceMethod;
  unit: 'meters' | 'kilometers' | 'miles' | 'nautical_miles';
}

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

/**
 * Schema for validating coordinates
 */
export const CoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

/**
 * Schema for validating bounding box
 */
export const BoundingBoxSchema = z.object({
  minLat: z.number().min(-90).max(90),
  maxLat: z.number().min(-90).max(90),
  minLon: z.number().min(-180).max(180),
  maxLon: z.number().min(-180).max(180)
});

/**
 * Schema for validating 3D coordinates
 */
export const Coordinate3DSchema = CoordinateSchema.extend({
  altitude: z.number().optional()
});

/**
 * Schema for validating points
 */
export const PointSchema = z.object({
  x: z.number(),
  y: z.number()
});

/**
 * Schema for validating polygons
 */
export const PolygonSchema = z.object({
  points: z.array(PointSchema).min(3)
});

/**
 * Schema for validating multi-polygons
 */
export const MultiPolygonSchema = z.object({
  polygons: z.array(PolygonSchema)
});

/**
 * Schema for validating line segments
 */
export const LineSegmentSchema = z.object({
  start: PointSchema,
  end: PointSchema
});

/**
 * Schema for validating circles
 */
export const CircleSchema = z.object({
  center: PointSchema,
  radius: z.number().positive()
});

/**
 * Schema for validating rectangles
 */
export const RectangleSchema = z.object({
  minX: z.number(),
  minY: z.number(),
  maxX: z.number(),
  maxY: z.number()
});

/**
 * Schema for validating projection types
 */
export const ProjectionTypeSchema = z.nativeEnum(ProjectionType);

/**
 * Schema for validating projection parameters
 */
export const ProjectionParamsSchema = z.object({
  type: ProjectionTypeSchema,
  centralMeridian: z.number().optional(),
  standardParallel1: z.number().optional(),
  standardParallel2: z.number().optional(),
  falseEasting: z.number().optional(),
  falseNorthing: z.number().optional(),
  scaleFactor: z.number().optional(),
  zone: z.number().optional()
});

/**
 * Schema for validating projected coordinates
 */
export const ProjectedCoordinateSchema = z.object({
  x: z.number(),
  y: z.number(),
  projection: ProjectionTypeSchema
});

/**
 * Schema for validating geocode results
 */
export const GeocodeResultSchema = z.object({
  address: z.string(),
  coordinate: CoordinateSchema,
  confidence: z.number().min(0).max(1),
  components: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional()
  }).optional()
});

/**
 * Schema for validating reverse geocode results
 */
export const ReverseGeocodeResultSchema = z.object({
  address: z.string(),
  coordinate: CoordinateSchema,
  components: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional()
  }).optional()
});

/**
 * Schema for validating distance methods
 */
export const DistanceMethodSchema = z.nativeEnum(DistanceMethod);

/**
 * Schema for validating distance results
 */
export const DistanceResultSchema = z.object({
  distance: z.number().nonnegative(),
  method: DistanceMethodSchema,
  unit: z.enum(['meters', 'kilometers', 'miles', 'nautical_miles'])
});

// =============================================================================
// VALIDATORS
// =============================================================================

/**
 * Parse and validate a coordinate
 */
export function parseCoordinate(data: unknown): Coordinate {
  return CoordinateSchema.parse(data);
}

/**
 * Parse and validate a bounding box
 */
export function parseBoundingBox(data: unknown): BoundingBox {
  return BoundingBoxSchema.parse(data);
}

/**
 * Parse and validate a 3D coordinate
 */
export function parseCoordinate3D(data: unknown): Coordinate3D {
  return Coordinate3DSchema.parse(data);
}

/**
 * Parse and validate a point
 */
export function parsePoint(data: unknown): Point {
  return PointSchema.parse(data);
}

/**
 * Parse and validate a polygon
 */
export function parsePolygon(data: unknown): Polygon {
  return PolygonSchema.parse(data);
}

/**
 * Parse and validate a multi-polygon
 */
export function parseMultiPolygon(data: unknown): MultiPolygon {
  return MultiPolygonSchema.parse(data);
}

/**
 * Parse and validate a line segment
 */
export function parseLineSegment(data: unknown): LineSegment {
  return LineSegmentSchema.parse(data);
}

/**
 * Parse and validate a circle
 */
export function parseCircle(data: unknown): Circle {
  return CircleSchema.parse(data);
}

/**
 * Parse and validate a rectangle
 */
export function parseRectangle(data: unknown): Rectangle {
  return RectangleSchema.parse(data);
}

/**
 * Parse and validate projection parameters
 */
export function parseProjectionParams(data: unknown): ProjectionParams {
  return ProjectionParamsSchema.parse(data);
}

/**
 * Parse and validate a projected coordinate
 */
export function parseProjectedCoordinate(data: unknown): ProjectedCoordinate {
  return ProjectedCoordinateSchema.parse(data);
}

/**
 * Parse and validate a geocode result
 */
export function parseGeocodeResult(data: unknown): GeocodeResult {
  return GeocodeResultSchema.parse(data);
}

/**
 * Parse and validate a reverse geocode result
 */
export function parseReverseGeocodeResult(data: unknown): ReverseGeocodeResult {
  return ReverseGeocodeResultSchema.parse(data);
}

/**
 * Parse and validate a distance result
 */
export function parseDistanceResult(data: unknown): DistanceResult {
  return DistanceResultSchema.parse(data);
}
