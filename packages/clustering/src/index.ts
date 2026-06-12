/**
 * @aether/clustering - Clustering Algorithms
 */

export interface Point {
  x: number;
  y: number;
}

export class Clustering {
  kMeans(points: Point[], k: number, maxIterations: number = 100): { clusters: Point[][]; centroids: Point[] } {
    if (points.length < k) {
      return {
        clusters: [points],
        centroids: [this.calculateCentroid(points)]
      };
    }
    
    // Initialize centroids randomly
    const centroids = this.shuffle([...points]).slice(0, k);
    
    for (let iter = 0; iter < maxIterations; iter++) {
      const clusters: Point[][] = Array.from({ length: k }, () => []);
      
      // Assign points to nearest centroid
      for (const point of points) {
        const nearestCentroid = this.findNearest(point, centroids);
        clusters[nearestCentroid].push(point);
      }
      
      // Recalculate centroids
      const newCentroids = clusters.map((cluster, i) => {
        if (cluster.length === 0) return centroids[i];
        return this.calculateCentroid(cluster);
      });
      
      // Check for convergence
      if (this.centroidsConverged(centroids, newCentroids)) {
        break;
      }
      
      centroids.splice(0, centroids.length, ...newCentroids);
    }
    
    const clusters: Point[][] = Array.from({ length: k }, () => []);
    for (const point of points) {
      const nearestCentroid = this.findNearest(point, centroids);
      clusters[nearestCentroid].push(point);
    }
    
    return { clusters, centroids };
  }
  
  private calculateCentroid(points: Point[]): Point {
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    return {
      x: sumX / points.length,
      y: sumY / points.length
    };
  }
  
  private findNearest(point: Point, centroids: Point[]): number {
    let minDist = Infinity;
    let nearest = 0;
    
    for (let i = 0; i < centroids.length; i++) {
      const dist = this.euclideanDistance(point, centroids[i]);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    }
    
    return nearest;
  }
  
  private euclideanDistance(a: Point, b: Point): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }
  
  private centroidsConverged(oldCentroids: Point[], newCentroids: Point[], threshold: number = 0.001): boolean {
    for (let i = 0; i < oldCentroids.length; i++) {
      if (this.euclideanDistance(oldCentroids[i], newCentroids[i]) > threshold) {
        return false;
      }
    }
    return true;
  }
  
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  dbscan(points: Point[], epsilon: number, minPts: number): { clusters: Point[][]; noise: Point[] } {
    const visited = new Set<number>();
    const clusters: Point[][] = [];
    const noise: Point[] = [];
    
    for (let i = 0; i < points.length; i++) {
      if (visited.has(i)) continue;
      
      const neighbors = this.regionQuery(points, i, epsilon);
      
      if (neighbors.length < minPts) {
        noise.push(points[i]);
        visited.add(i);
      } else {
        const cluster: Point[] = [];
        this.expandCluster(points, i, neighbors, cluster, visited, epsilon, minPts);
        clusters.push(cluster);
      }
    }
    
    return { clusters, noise };
  }
  
  private regionQuery(points: Point[], pointIndex: number, epsilon: number): number[] {
    const neighbors: number[] = [];
    for (let i = 0; i < points.length; i++) {
      if (this.euclideanDistance(points[pointIndex], points[i]) <= epsilon) {
        neighbors.push(i);
      }
    }
    return neighbors;
  }
  
  private expandCluster(
    points: Point[],
    pointIndex: number,
    neighbors: number[],
    cluster: Point[],
    visited: Set<number>,
    epsilon: number,
    minPts: number
  ): void {
    visited.add(pointIndex);
    cluster.push(points[pointIndex]);
    
    let i = 0;
    while (i < neighbors.length) {
      const neighborIndex = neighbors[i];
      
      if (!visited.has(neighborIndex)) {
        visited.add(neighborIndex);
        cluster.push(points[neighborIndex]);
        
        const neighborNeighbors = this.regionQuery(points, neighborIndex, epsilon);
        if (neighborNeighbors.length >= minPts) {
          neighbors.push(...neighborNeighbors.filter(n => !neighbors.includes(n)));
        }
      }
      
      i++;
    }
  }
}

export const clustering = new Clustering();