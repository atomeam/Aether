/**
 * @aether/math - Math Utilities
 */

export class MathUtils {
  clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
  
  lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
  
  mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }
  
  degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
  radToDeg(rad: number): number {
    return rad * (180 / Math.PI);
  }
  
  random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
  
  randomInt(min: number, max: number): number {
    return Math.floor(this.random(min, max + 1));
  }
  
  randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }
  
  lcm(a: number, b: number): number {
    return Math.abs(a * b) / this.gcd(a, b);
  }
  
  isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }
    
    return true;
  }
  
  fibonacci(n: number): number {
    if (n <= 1) return n;
    
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    
    return b;
  }
  
  factorial(n: number): number {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }
  
  combination(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    
    return this.factorial(n) / (this.factorial(k) * this.factorial(n - k));
  }
  
  permutation(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    return this.factorial(n) / this.factorial(n - k);
  }
  
  average(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
  
  median(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  mode(numbers: number[]): number[] {
    const frequency: Record<number, number> = {};
    let maxFreq = 0;
    
    for (const num of numbers) {
      frequency[num] = (frequency[num] || 0) + 1;
      maxFreq = Math.max(maxFreq, frequency[num]);
    }
    
    return Object.keys(frequency)
      .map(Number)
      .filter(num => frequency[num] === maxFreq);
  }
  
  standardDeviation(numbers: number[]): number {
    const mean = this.average(numbers);
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }
  
  variance(numbers: number[]): number {
    const mean = this.average(numbers);
    return numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
  }
}

export const mathUtils = new MathUtils();