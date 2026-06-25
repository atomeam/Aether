/**
 * @aether/distance - Distance and Similarity Metrics
 */

export class Distance {
  levenshtein(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(0));
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    return matrix[b.length][a.length];
  }
  
  hamming(a: string, b: string): number {
    if (a.length !== b.length) throw new Error('Strings must be same length');
    
    let distance = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) distance++;
    }
    return distance;
  }
  
  jaccard(a: Set<any>, b: Set<any>): number {
    const intersection = new Set([...a].filter(x => b.has(x)));
    const union = new Set([...a, ...b]);
    return intersection.size / union.size;
  }
  
  cosine(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error('Vectors must be same length');
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  euclidean(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error('Vectors must be same length');
    
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    
    return Math.sqrt(sum);
  }
  
  manhattan(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error('Vectors must be same length');
    
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.abs(a[i] - b[i]);
    }
    
    return sum;
  }
  
  chebyshev(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error('Vectors must be same length');
    
    let max = 0;
    for (let i = 0; i < a.length; i++) {
      max = Math.max(max, Math.abs(a[i] - b[i]));
    }
    
    return max;
  }
  
  minkowski(a: number[], b: number[], p: number): number {
    if (a.length !== b.length) throw new Error('Vectors must be same length');
    
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(Math.abs(a[i] - b[i]), p);
    }
    
    return Math.pow(sum, 1 / p);
  }
}

export const distance = new Distance();