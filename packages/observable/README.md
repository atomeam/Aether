# @aether/observable

Observable pattern implementation with operators.

## Installation

```bash
npm install @aether/observable
```

## Usage

```typescript
import { Observable } from '@aether/observable';

const observable = new Observable<number>();

// Subscribe
const unsubscribe = observable.subscribe(value => console.log(value));

// Emit
observable.next(1);
observable.next(2);
observable.complete();

// Operators
observable
  .map(x => x * 2)
  .filter(x => x > 5)
  .debounce(100)
  .throttle(50);

// Static methods
Observable.from([1, 2, 3]);
Observable.of(1, 2, 3);
```

## API

### subscribe(observer)
Subscribe to observable. Returns unsubscribe function.

### next(value)
Emit value to observers.

### complete()
Complete observable and clear observers.

### pipe(...operators)
Pipe operators through observable.

### map(fn)
Map values through function.

### filter(predicate)
Filter values by predicate.

### debounce(delay)
Debounce emissions.

### throttle(delay)
Throttle emissions.

### Static from(values)
Create observable from array.

### Static of(...values)
Create observable from values.