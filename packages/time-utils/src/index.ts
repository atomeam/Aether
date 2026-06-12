/**
 * @aether/time-utils - Time Utilities
 */

export class Stopwatch {
  private startTime: number = 0;
  private endTime: number = 0;
  private running: boolean = false;
  
  start(): void {
    if (!this.running) {
      this.startTime = performance.now();
      this.running = true;
    }
  }
  
  stop(): number {
    if (this.running) {
      this.endTime = performance.now();
      this.running = false;
    }
    return this.elapsed();
  }
  
  reset(): void {
    this.startTime = 0;
    this.endTime = 0;
    this.running = false;
  }
  
  elapsed(): number {
    if (this.running) {
      return performance.now() - this.startTime;
    }
    return this.endTime - this.startTime;
  }
  
  elapsedMs(): number {
    return this.elapsed();
  }
  
  elapsedSeconds(): number {
    return this.elapsed() / 1000;
  }
  
  isRunning(): boolean {
    return this.running;
  }
}

export class Timer {
  private timeoutId: any = null;
  private startTime: number = 0;
  
  constructor(private callback: () => void, private delay: number) {}
  
  start(): void {
    if (this.timeoutId === null) {
      this.startTime = Date.now();
      this.timeoutId = setTimeout(() => {
        this.callback();
        this.timeoutId = null;
      }, this.delay);
    }
  }
  
  stop(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  
  restart(): void {
    this.stop();
    this.start();
  }
  
  remaining(): number {
    if (this.timeoutId === null) return 0;
    const elapsed = Date.now() - this.startTime;
    return Math.max(0, this.delay - elapsed);
  }
  
  isRunning(): boolean {
    return this.timeoutId !== null;
  }
}

export class Interval {
  private intervalId: any = null;
  
  constructor(private callback: () => void, private interval: number) {}
  
  start(): void {
    if (this.intervalId === null) {
      this.intervalId = setInterval(this.callback, this.interval);
    }
  }
  
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

export class Delay {
  static async ms(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static async seconds(seconds: number): Promise<void> {
    return this.ms(seconds * 1000);
  }
  
  static async minutes(minutes: number): Promise<void> {
    return this.seconds(minutes * 60);
  }
  
  static async hours(hours: number): Promise<void> {
    return this.minutes(hours * 60);
  }
}

export class Debounce {
  private timeoutId: any = null;
  
  constructor(
    private fn: (...args: any[]) => void,
    private delay: number
  ) {}
  
  execute(...args: any[]): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = setTimeout(() => {
      this.fn(...args);
      this.timeoutId = null;
    }, this.delay);
  }
  
  cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  
  flush(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.fn();
      this.timeoutId = null;
    }
  }
}

export class Throttle {
  private lastExecuted: number = 0;
  private timeoutId: any = null;
  
  constructor(
    private fn: (...args: any[]) => void,
    private delay: number,
    private trailing: boolean = true
  ) {}
  
  execute(...args: any[]): void {
    const now = Date.now();
    const timeSinceLastExecuted = now - this.lastExecuted;
    
    if (timeSinceLastExecuted >= this.delay) {
      this.fn(...args);
      this.lastExecuted = now;
    } else if (this.trailing && this.timeoutId === null) {
      this.timeoutId = setTimeout(() => {
        this.fn(...args);
        this.lastExecuted = Date.now();
        this.timeoutId = null;
      }, this.delay - timeSinceLastExecuted);
    }
  }
  
  cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

export function createStopwatch(): Stopwatch {
  return new Stopwatch();
}

export function createTimer(callback: () => void, delay: number): Timer {
  return new Timer(callback, delay);
}

export function createInterval(callback: () => void, interval: number): Interval {
  return new Interval(callback, interval);
}

export function createDebounce(fn: (...args: any[]) => void, delay: number): Debounce {
  return new Debounce(fn, delay);
}

export function createThrottle(fn: (...args: any[]) => void, delay: number, trailing?: boolean): Throttle {
  return new Throttle(fn, delay, trailing);
}