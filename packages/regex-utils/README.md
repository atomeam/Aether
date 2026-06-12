# @aether/regex-utils

Regular expression utilities and common patterns.

## Installation

```bash
npm install @aether/regex-utils
```

## Usage

```typescript
import { regexUtils } from '@aether/regex-utils';

// Escape special characters
regexUtils.escape('hello.world'); // 'hello\\.world'

// Test pattern
regexUtils.test(/[a-z]+/, 'hello'); // true

// Match
regexUtils.match(/[a-z]+/, 'hello world'); // ['hello']

// Match all
regexUtils.matchAll(/[a-z]+/g, 'hello world'); // ['hello', 'world']

// Replace
regexUtils.replace(/l/g, 'hello', 'L'); // 'HeLLo'

// Split
regexUtils.split(/\s+/, 'hello world'); // ['hello', 'world']

// Common patterns
regexUtils.email().test('test@example.com'); // true
regexUtils.url().test('https://example.com'); // true
regexUtils.phone().test('+1 555-1234'); // true
regexUtils.hexColor().test('#ffffff'); // true
regexUtils.ipv4().test('192.168.1.1'); // true
regexUtils.ipv6().test('::1'); // true
regexUtils.uuid().test('123e4567-e89b-12d3-a456-426614174000'); // true
regexUtils.alphanumeric().test('abc123'); // true
regexUtils.numeric().test('123'); // true
regexUtils.alpha().test('abc'); // true
```

## API

### escape(str)
Escape regex special characters.

### test(pattern, str)
Test pattern against string.

### match(pattern, str)
Get first match.

### matchAll(pattern, str)
Get all matches.

### replace(pattern, str, replacement)
Replace matches.

### split(pattern, str)
Split string by pattern.

### email()
Email regex pattern.

### url()
URL regex pattern.

### phone()
Phone number regex pattern.

### hexColor()
Hex color regex pattern.

### ipv4()
IPv4 address regex pattern.

### ipv6()
IPv6 address regex pattern.

### uuid()
UUID regex pattern.

### alphanumeric()
Alphanumeric regex pattern.

### numeric()
Numeric regex pattern.

### alpha()
Alphabetic regex pattern.