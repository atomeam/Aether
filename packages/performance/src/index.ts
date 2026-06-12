/**
 * @aether/performance - Performance Monitoring
 */

export interface PerformanceMetrics {
  fps: number;
  memory: number;
  timing: number;
}

export class PerformanceMonitor {
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fps = 0;
  private callbacks: Array<(metrics: PerformanceMetrics) => void> = [];
  private monitoring = false;
  private intervalId: any = null;
  
  startMonitoring(interval: number = 1000): void {
    if (this.monitoring) return;
    
    this.monitoring = true;
    this.lastFrameTime = performance.now();
    
    this.intervalId = setInterval(() => {
      this.updateMetrics();
    }, interval);
    
    this.measureFrames();
  }
  
  stopMonitoring(): void {
    this.monitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  private measureFrames(): void {
    if (!this.monitoring) return;
    
    const raf = (globalThis as any).requestAnimationFrame || ((fn: () => void) => setTimeout(fn, 16));
    raf(() => this.measureFrames());
    
    this.frameCount++;
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    
    if (delta >= 1000) {
      this.fps = Math.round((this.frameCount / delta) * 1000);
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }
  
  private updateMetrics(): void {
    const metrics: PerformanceMetrics = {
      fps: this.fps,
      memory: this.getMemoryUsage(),
      timing: performance.now()
    };
    
    for (const callback of this.callbacks) {
      callback(metrics);
    }
  }
  
  private getMemoryUsage(): number {
    if (typeof (performance as any).memory !== 'undefined') {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }
  
  onMetrics(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.push(callback);
    
    return () => {
      const idx = this.callbacks.indexOf(callback);
      if (idx !== -1) this.callbacks.splice(idx, 1);
    };
  }
  
  measure<T>(fn: () => T): { result: T; duration: number } {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    return { result, duration };
  }
  
  async measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    return { result, duration };
  }
  
  mark(name: string): void {
    if (typeof performance.mark === 'function') {
      performance.mark(name);
    }
  }
  
  measureMark(startMark: string, endMark: string): number {
    if (typeof performance.measure === 'function') {
      performance.measure(startMark, startMark, endMark);
      const entries = performance.getEntriesByName(startMark);
      return entries.length > 0 ? entries[entries.length - 1].duration : 0;
    }
    return 0;
  }
  
  clearMarks(): void {
    if (typeof performance.clearMarks === 'function') {
      performance.clearMarks();
    }
  }
  
  clearMeasures(): void {
    if (typeof performance.clearMeasures === 'function') {
      performance.clearMeasures();
    }
  }
}

export class Profiler {
  private samples: Array<{ name: string; duration: number; timestamp: number }> = [];
  private activeProfiles = new Map<string, number>();
  
  start(name: string): void {
    this.activeProfiles.set(name, performance.now());
  }
  
  end(name: string): number {
    const startTime = this.activeProfiles.get(name);
    if (startTime === undefined) {
      throw new Error(`No active profile found for: ${name}`);
    }
    
    const duration = performance.now() - startTime;
    this.samples.push({ name, duration, timestamp: Date.now() });
    this.activeProfiles.delete(name);
    
    return duration;
  }
  
  getSamples(name?: string): Array<{ name: string; duration: number; timestamp: number }> {
    if (name) {
      return this.samples.filter(s => s.name === name);
    }
    return [...this.samples];
  }
  
  getAverageDuration(name: string): number {
    const samples = this.getSamples(name);
    if (samples.length === 0) return 0;
    
    const total = samples.reduce((sum, s) => sum + s.duration, 0);
    return total / samples.length;
  }
  
  clear(): void {
    this.samples = [];
    this.activeProfiles.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();
export const profiler = new Profiler();