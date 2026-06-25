/**
 * @aether/geometry - Geometry Utilities
 */

export interface Point {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export class Geometry {
  distance(a: Point, b: Point): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }
  
  distance3D(a: Point3D, b: Point3D): number {
    return Math.sqrt(
      Math.pow(b.x - a.x, 2) + 
      Math.pow(b.y - a.y, 2) + 
      Math.pow(b.z - a.z, 2)
    );
  }
  
  midpoint(a: Point, b: Point): Point {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2
    };
  }
  
  angle(a: Point, b: Point, c: Point): number {
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const bc = { x: c.x - b.x, y: c.y - b.y };
    
    const dot = ab.x * bc.x + ab.y * bc.y;
    const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
    const magBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);
    
    return Math.acos(dot / (magAB * magBC));
  }
  
  slope(a: Point, b: Point): number {
    return (b.y - a.y) / (b.x - a.x);
  }
  
  lineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
    const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    
    if (Math.abs(denom) < 0.0001) return null; // Parallel lines
    
    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
    
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: p1.x + ua * (p2.x - p1.x),
        y: p1.y + ua * (p2.y - p1.y)
      };
    }
    
    return null;
  }
  
  pointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }
  
  boundingBox(points: Point[]): { min: Point; max: Point } {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const point of points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    
    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY }
    };
  }
  
  area(polygon: Point[]): number {
    let area = 0;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      area += (polygon[j].x + polygon[i].x) * (polygon[j].y - polygon[i].y);
    }
    
    return Math.abs(area / 2);
  }
  
  centroid(polygon: Point[]): Point {
    let cx = 0, cy = 0;
    let area = 0;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const cross = (polygon[j].x + polygon[i].x) * (polygon[j].y - polygon[i].y);
      area += cross;
      cx += (polygon[j].x + polygon[i].x) * cross;
      cy += (polygon[j].y + polygon[i].y) * cross;
    }
    
    area /= 2;
    return {
      x: cx / (6 * area),
      y: cy / (6 * area)
    };
  }
}

export const geometry = new Geometry();