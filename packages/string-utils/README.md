# @aether/string-utils

String utility functions for common string operations.

## Installation

```bash
npm install @aether/string-utils
```

## Usage

```typescript
import { stringUtils } from '@aether/string-utils';

// Capitalize
stringUtils.capitalize('hello'); // 'Hello'

// Truncate
stringUtils.truncate('hello world', 5); // 'hel...'

// Convert to camelCase
stringUtils.camelCase('hello-world'); // 'helloWorld'

// Convert to kebab-case
stringUtils.kebabCase('helloWorld'); // 'hello-world'

// Convert to snake_case
stringUtils.snakeCase('helloWorld'); // 'hello_world'
```

## API

### capitalize(str)
Capitalizes the first letter and lowercases the rest.

### truncate(str, length, suffix?)
Truncates string to specified length with optional suffix.

### camelCase(str)
Converts string to camelCase.

### kebabCase(str)
Converts string to kebab-case.

### snakeCase(str)
Converts string to snake_case.