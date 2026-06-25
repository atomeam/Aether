/**
 * @aether/geo - Geospatial Utilities
 */

import {
  Coordinate,
  Coordinate3D,
  Point,
  Polygon,
  LineSegment,
  Circle,
  Rectangle,
  BoundingBox,
  ProjectionType,
  ProjectionParams,
  ProjectedCoordinate,
  DistanceMethod,
  DistanceResult,
  PolygonOperationResult,
  PointInPolygonResult
} from './types';

// =============================================================================
// DISTANCE CALCULATIONS
// =============================================================================

/**
 * Earth's radius in meters (WGS84 ellipsoid)
 */
const EARTH_RADIUS = 6378137;

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Haversine formula for great-circle distance between two points
 */
export function haversineDistance(
  coord1: Coordinate,
  coord2: Coordinate,
  unit: 'meters' | 'kilometers' | 'miles' | 'nautical_miles' = 'meters'
): DistanceResult {
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);
  const deltaLat = toRadians(coord2.latitude - coord1.latitude);
  const deltaLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let distance = EARTH_RADIUS * c;

  // Convert to requested unit
  switch (unit) {
    case 'kilometers':
      distance /= 1000;
      break;
    case 'miles':
      distance *= 0.000621371;
      break;
    case 'nautical_miles':
      distance *= 0.000539957;
      break;
  }

  return { distance, method: DistanceMethod.HAVERSINE, unit };
}

/**
 * Vincenty formula for more accurate distance calculation
 * (simplified version for ellipsoidal distance)
 */
export function vincentyDistance(
  coord1: Coordinate,
  coord2: Coordinate,
  unit: 'meters' | 'kilometers' | 'miles' | 'nautical_miles' = 'meters'
): DistanceResult {
  // WGS84 ellipsoid parameters
  const a = 6378137; // semi-major axis
  const f = 1 / 298.257223563; // flattening
  const b = (1 - f) * a; // semi-minor axis

  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);
  const lon1 = toRadians(coord1.longitude);
  const lon2 = toRadians(coord2.longitude);

  const U1 = Math.atan((1 - f) * Math.tan(lat1));
  const U2 = Math.atan((1 - f) * Math.tan(lat2));
  const L = lon2 - lon1;

  let lambda = L;
  let iterLimit = 100;
  let sinU1 = Math.sin(U1);
  let cosU1 = Math.cos(U1);
  let sinU2 = Math.sin(U2);
  let cosU2 = Math.cos(U2);
  let sinSigma, cosSigma, sigma, sinAlpha, cosSqAlpha, cos2SigmaM;

  do {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    sinSigma = Math.sqrt(
      (cosU2 * sinLambda) ** 2 +
      (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) ** 2
    );
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cosSqAlpha = 1 - sinAlpha * sinAlpha;
    cos2SigmaM = cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha;
    const C = (f / 16) * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    lambda = L + (1 - C) * f * sinAlpha *
      (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2)));
  } while (Math.abs(lambda - L) > 1e-12 && --iterLimit > 0);

  if (iterLimit === 0) {
    // Failed to converge, fall back to haversine
    return haversineDistance(coord1, coord2, unit);
  }

  const uSq = cosSqAlpha * (a ** 2 - b ** 2) / (b ** 2);
  const A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const deltaSigma = B * sinSigma *
    (cos2SigmaM + (B / 4) *
      (cosSigma * (-1 + 2 * cos2SigmaM ** 2) -
       (B / 6) * cos2SigmaM * (-3 + 4 * sinSigma ** 2) * (-3 + 4 * cos2SigmaM ** 2)));

  let distance = b * A * (sigma - deltaSigma);

  // Convert to requested unit
  switch (unit) {
    case 'kilometers':
      distance /= 1000;
      break;
    case 'miles':
      distance *= 0.000621371;
      break;
    case 'nautical_miles':
      distance *= 0.000539957;
      break;
  }

  return { distance, method: DistanceMethod.VINCENTY, unit };
}

/**
 * Great circle distance (spherical law of cosines)
 */
export function greatCircleDistance(
  coord1: Coordinate,
  coord2: Coordinate,
  unit: 'meters' | 'kilometers' | 'miles' | 'nautical_miles' = 'meters'
): DistanceResult {
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);
  const deltaLon = toRadians(coord2.longitude - coord1.longitude);

  const distanceRad = Math.acos(
    Math.sin(lat1) * Math.sin(lat2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.cos(deltaLon)
  );

  let distance = EARTH_RADIUS * distanceRad;

  // Convert to requested unit
  switch (unit) {
    case 'kilometers':
      distance /= 1000;
      break;
    case 'miles':
      distance *= 0.000621371;
      break;
    case 'nautical_miles':
      distance *= 0.000539957;
      break;
  }

  return { distance, method: DistanceMethod.GREAT_CIRCLE, unit };
}

/**
 * Euclidean distance between two points (for projected coordinates)
 */
export function euclideanDistance(
  point1: Point,
  point2: Point
): DistanceResult {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return { distance, method: DistanceMethod.EUCLDEAN, unit: 'meters' };
}

/**
 * Calculate bearing between two coordinates
 */
export function calculateBearing(coord1: Coordinate, coord2: Coordinate): number {
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);
  const deltaLon = toRadians(coord2.longitude - coord1.longitude);

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Calculate midpoint between two coordinates
 */
export function calculateMidpoint(coord1: Coordinate, coord2: Coordinate): Coordinate {
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);
  const deltaLon = toRadians(coord2.longitude - coord1.longitude);

  const bx = Math.cos(lat2) * Math.cos(deltaLon);
  const by = Math.cos(lat2) * Math.sin(deltaLon);

  const lat = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) ** 2 + by ** 2)
  );
  const lon = toRadians(coord1.longitude) + Math.atan2(by, Math.cos(lat1) + bx);

  return {
    latitude: toDegrees(lat),
    longitude: toDegrees(lon)
  };
}

// =============================================================================
// POLYGON OPERATIONS
// =============================================================================

/**
 * Calculate polygon area using shoelace formula
 */
export function calculatePolygonArea(polygon: Polygon): number {
  const points = polygon.points;
  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return Math.abs(area / 2);
}

/**
 * Calculate polygon perimeter
 */
export function calculatePolygonPerimeter(polygon: Polygon): number {
  const points = polygon.points;
  let perimeter = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const dx = points[j].x - points[i].x;
    const dy = points[j].y - points[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }

  return perimeter;
}

/**
 * Calculate polygon centroid
 */
export function calculatePolygonCentroid(polygon: Polygon): Point {
  const points = polygon.points;
  let cx = 0;
  let cy = 0;
  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const cross = points[i].x * points[j].y - points[j].x * points[i].y;
    area += cross;
    cx += (points[i].x + points[j].x) * cross;
    cy += (points[i].y + points[j].y) * cross;
  }

  area /= 2;
  cx /= 6 * area;
  cy /= 6 * area;

  return { x: cx, y: cy };
}

/**
 * Check if polygon is convex
 */
export function isPolygonConvex(polygon: Polygon): boolean {
  const points = polygon.points;
  const n = points.length;

  if (n < 3) return false;

  let prevCross = 0;
  let isConvex = true;

  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const dx1 = p2.x - p1.x;
    const dy1 = p2.y - p1.y;
    const dx2 = p3.x - p2.x;
    const dy2 = p3.y - p2.y;

    const cross = dx1 * dy2 - dy1 * dx2;

    if (i === 0) {
      prevCross = cross;
    } else if (cross * prevCross < 0) {
      isConvex = false;
      break;
    }
  }

  return isConvex;
}

/**
 * Comprehensive polygon operation result
 */
export function analyzePolygon(polygon: Polygon): PolygonOperationResult {
  return {
    area: calculatePolygonArea(polygon),
    perimeter: calculatePolygonPerimeter(polygon),
    centroid: calculatePolygonCentroid(polygon),
    isConvex: isPolygonConvex(polygon)
  };
}

/**
 * Point in polygon test using ray casting algorithm
 */
export function pointInPolygon(point: Point, polygon: Polygon): PointInPolygonResult {
  const points = polygon.points;
  const n = points.length;
  let inside = false;
  let onEdge = false;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;

    // Check if point is on edge
    const cross = (point.x - xi) * (yj - yi) - (point.y - yi) * (xj - xi);
    if (Math.abs(cross) < 1e-10) {
      onEdge = true;
    }

    // Ray casting
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return { inside, onEdge };
}

/**
 * Check if two line segments intersect
 */
export function lineSegmentsIntersect(seg1: LineSegment, seg2: LineSegment): boolean {
  const { start: p1, end: p2 } = seg1;
  const { start: p3, end: p4 } = seg2;

  const orientation = (p: Point, q: Point, r: Point): number => {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  };

  const onSegment = (p: Point, q: Point, r: Point): boolean => {
    return q.x <= Math.max(p.x, r.x) &&
           q.x >= Math.min(p.x, r.x) &&
           q.y <= Math.max(p.y, r.y) &&
           q.y >= Math.min(p.y, r.y);
  };

  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);

  if (o1 * o2 < 0 && o3 * o4 < 0) return true;

  if (o1 === 0 && onSegment(p1, p3, p2)) return true;
  if (o2 === 0 && onSegment(p1, p4, p2)) return true;
  if (o3 === 0 && onSegment(p3, p1, p4)) return true;
  if (o4 === 0 && onSegment(p3, p2, p4)) return true;

  return false;
}

/**
 * Calculate bounding box for polygon
 */
export function calculateBoundingBox(polygon: Polygon): Rectangle {
  const points = polygon.points;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return { minX, minY, maxX, maxY };
}

// =============================================================================
// MAP PROJECTIONS
// =============================================================================

/**
 * Web Mercator projection (EPSG:3857)
 */
export function webMercatorProject(coord: Coordinate): ProjectedCoordinate {
  const x = (coord.longitude + 180) * (EARTH_RADIUS * Math.PI / 180);
  const latRad = toRadians(coord.latitude);
  const y = Math.log(Math.tan(Math.PI / 4 + latRad / 2)) * EARTH_RADIUS;

  return { x, y, projection: ProjectionType.WEB_MERCATOR };
}

/**
 * Inverse Web Mercator projection
 */
export function webMercatorInverse(projected: ProjectedCoordinate): Coordinate {
  const lon = (projected.x / (EARTH_RADIUS * Math.PI / 180)) - 180;
  const lat = toDegrees(2 * Math.atan(Math.exp(projected.y / EARTH_RADIUS)) - Math.PI / 2);

  return { latitude: lat, longitude: lon };
}

/**
 * Standard Mercator projection
 */
export function mercatorProject(coord: Coordinate, params: ProjectionParams = { type: ProjectionType.MERCATOR }): ProjectedCoordinate {
  const centralMeridian = params.centralMeridian || 0;
  const lonRad = toRadians(coord.longitude - centralMeridian);
  const latRad = toRadians(coord.latitude);

  const x = EARTH_RADIUS * lonRad;
  const y = EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + latRad / 2));

  return { x, y, projection: ProjectionType.MERCATOR };
}

/**
 * Inverse Mercator projection
 */
export function mercatorInverse(projected: ProjectedCoordinate, params: ProjectionParams = { type: ProjectionType.MERCATOR }): Coordinate {
  const centralMeridian = params.centralMeridian || 0;
  const lon = toDegrees(projected.x / EARTH_RADIUS) + centralMeridian;
  const lat = toDegrees(2 * Math.atan(Math.exp(projected.y / EARTH_RADIUS)) - Math.PI / 2);

  return { latitude: lat, longitude: lon };
}

/**
 * UTM zone calculation
 */
export function calculateUTMZone(coord: Coordinate): number {
  const zone = Math.floor((coord.longitude + 180) / 6) + 1;
  return zone;
}

/**
 * Simplified UTM projection (approximate)
 */
export function utmProject(coord: Coordinate, zone?: number): ProjectedCoordinate {
  const utmZone = zone || calculateUTMZone(coord);
  const centralMeridian = (utmZone - 1) * 6 - 180 + 3;

  const lonRad = toRadians(coord.longitude - centralMeridian);
  const latRad = toRadians(coord.latitude);

  // Simplified UTM formulas
  const k0 = 0.9996; // scale factor
  const ecc = 0.0818191908; // eccentricity

  const N = EARTH_RADIUS / Math.sqrt(1 - ecc * ecc * Math.sin(latRad) ** 2);
  const T = Math.tan(latRad) ** 2;
  const C = (ecc * ecc * Math.cos(latRad) ** 2) / (1 - ecc * ecc);
  const A = (coord.longitude - centralMeridian) * Math.cos(latRad);

  const M = EARTH_RADIUS * (
    latRad -
    (ecc * ecc / 4) * (latRad + Math.sin(2 * latRad) / 2) +
    (ecc * ecc * ecc * ecc / 192) * (3 * latRad + Math.sin(2 * latRad) / 2 + Math.sin(4 * latRad) / 4)
  );

  const x = 500000 + k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T ** 2 + 72 * C - 58 * ecc * ecc) * A ** 5 / 120);
  const y = k0 * (M + N * Math.tan(latRad) * (A ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24));

  return { x, y, projection: ProjectionType.UTM };
}

/**
 * Calculate bounding box from coordinates
 */
export function calculateGeoBoundingBox(coordinates: Coordinate[]): BoundingBox {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const coord of coordinates) {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLon = Math.min(minLon, coord.longitude);
    maxLon = Math.max(maxLon, coord.longitude);
  }

  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Check if coordinate is within bounding box
 */
export function isCoordinateInBoundingBox(coord: Coordinate, bbox: BoundingBox): boolean {
  return coord.latitude >= bbox.minLat &&
         coord.latitude <= bbox.maxLat &&
         coord.longitude >= bbox.minLon &&
         coord.longitude <= bbox.maxLon;
}

/**
 * Calculate 3D distance (including altitude)
 */
export function calculate3DDistance(coord1: Coordinate3D, coord2: Coordinate3D): number {
  const horizontal = haversineDistance(coord1, coord2, 'meters').distance;
  const vertical = (coord1.altitude || 0) - (coord2.altitude || 0);
  return Math.sqrt(horizontal * horizontal + vertical * vertical);
}
