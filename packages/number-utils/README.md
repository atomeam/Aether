# @aether/number-utils

Number utility functions for common numeric operations.

## Installation

```bash
npm install @aether/number-utils
```

## Usage

```typescript
import { numberUtils } from '@aether/number-utils';

// Clamp value
numberUtils.clamp(5, 10, 20); // 10

// Random number
numberUtils.random(0, 10); // 5.234...

// Random integer
numberUtils.randomInt(0, 10); // 5

// Round to precision
numberUtils.round(1.2345, 2); // 1.23

// Format number
numberUtils.format(1.2345, 2); // '1.23'
```

## API

### clamp(num, min, max)
Clamps number between min and max values.

### random(min, max)
Returns random number in range (inclusive).

### randomInt(min, max)
Returns random integer in range (inclusive).

### round(num, precision)
Rounds number to specified decimal precision.

### format(num, decimals)
Formats number as string with specified decimals.