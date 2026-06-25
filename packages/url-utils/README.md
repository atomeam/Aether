# @aether/url-utils

URL parsing and manipulation utilities.

## Installation

```bash
npm install @aether/url-utils
```

## Usage

```typescript
import { urlUtils } from '@aether/url-utils';

// Parse URL
const parsed = urlUtils.parse('https://example.com/path?query=value');

// Build URL
const url = urlUtils.build('https://example.com', '/path', { key: 'value' });

// Query params
urlUtils.getQueryParam(url, 'key');
urlUtils.setQueryParam(url, 'key', 'value');
urlUtils.removeQueryParam(url, 'key');

// URL parts
urlUtils.getDomain(url); // 'example.com'
urlUtils.getPath(url); // '/path'

// Check if absolute/relative
urlUtils.isAbsolute('https://example.com'); // true
urlUtils.isRelative('/path'); // true

// Join paths
urlUtils.join('/a', '/b/', 'c'); // 'a/b/c'
```

## API

### parse(url)
Parse URL string.

### build(base, path, params?)
Build URL from components.

### getQueryParam(url, param)
Get query parameter value.

### setQueryParam(url, param, value)
Set query parameter value.

### removeQueryParam(url, param)
Remove query parameter.

### getDomain(url)
Get domain from URL.

### getPath(url)
Get path from URL.

### isAbsolute(url)
Check if URL is absolute.

### isRelative(url)
Check if URL is relative.

### join(...parts)
Join path parts.