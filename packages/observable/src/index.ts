/**
 * @aether/observable - Observable Pattern
 */

export type Observer<T> = (value: T) => void;
export type Unsubscribe = () => void;

export class Observable<T> {
  private observers: Set<Observer<T>> = new Set();
  
  subscribe(observer: Observer<T>): Unsubscribe {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }
  
  next(value: T): void {
    this.observers.forEach(observer => observer(value));
  }
  
  complete(): void {
    this.observers.clear();
  }
  
  pipe<R>(...operators: Array<(source: Observable<any>) => Observable<R>>): Observable<R> {
    return operators.reduce((source: any, operator) => operator(source), this) as Observable<R>;
  }
  
  static from<T>(values: T[]): Observable<T> {
    const observable = new Observable<T>();
    values.forEach(value => observable.next(value));
    return observable;
  }
  
  static of<T>(...values: T[]): Observable<T> {
    return Observable.from(values);
  }
  
  map<R>(fn: (value: T) => R): Observable<R> {
    const result = new Observable<R>();
    this.subscribe(value => result.next(fn(value)));
    return result;
  }
  
  filter(predicate: (value: T) => boolean): Observable<T> {
    const result = new Observable<T>();
    this.subscribe(value => {
      if (predicate(value)) result.next(value);
    });
    return result;
  }
  
  debounce(delay: number): Observable<T> {
    const result = new Observable<T>();
    let timeout: any;
    this.subscribe(value => {
      clearTimeout(timeout);
      timeout = setTimeout(() => result.next(value), delay);
    });
    return result;
  }
  
  throttle(delay: number): Observable<T> {
    const result = new Observable<T>();
    let lastTime = 0;
    this.subscribe(value => {
      const now = Date.now();
      if (now - lastTime >= delay) {
        lastTime = now;
        result.next(value);
      }
    });
    return result;
  }
}

export function createObservable<T>(): Observable<T> {
  return new Observable<T>();
}