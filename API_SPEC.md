# a-to-mind API Specification

**Source of Truth** - This document is the canonical reference for all a-to-mind API endpoints. All agents (Devin, OpenHands, Agent Lee) must read this file before making any code changes to API-related code.

## Base URL

```
https://aether-bridge.atomicmoonbeam88.workers.dev
```

## Authentication

All a-to-mind API endpoints require Bearer token authentication:

```http
Authorization: Bearer ATOMIND_DEVIN_SECRET
```

**Environment Variables:**
- `ATOMIND_BASE_URL`: Base URL for a-to-mind API
- `ATOMIND_DEVIN_SECRET`: Authentication secret

## Endpoints

### 1. Health Check

**Endpoint:** `GET /api/a-to-mind/health`

**Authentication:** Required

**Response Schema:**
```typescript
{
  status: string;      // "healthy" | "degraded" | "down"
  version: string;      // API version
  timestamp: string | number;  // ISO timestamp or epoch
  uptime?: number;      // Worker uptime in seconds (optional)
}
```

**Example Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-06-17T22:00:00Z",
  "uptime": 3600
}
```

---

### 2. Analyze Text

**Endpoint:** `POST /api/a-to-mind/analyze`

**Authentication:** Required

**Request Schema:**
```typescript
{
  text: string;  // Text to analyze
  type?: 'general' | 'sentiment' | 'keywords';  // Analysis type (default: 'general')
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  type: string;
  analysis: {
    wordCount: number;
    characterCount: number;
    characterCountNoSpaces: number;
    sentenceCount: number;
    paragraphCount: number;
    averageWordLength: number;
    readingTime: number;
    sentiment?: string;  // "positive" | "negative" | "neutral" (sentiment type only)
    positiveCount?: number;  // Positive words count (sentiment type only)
    negativeCount?: number;  // Negative words count (sentiment type only)
    confidence?: number;  // Sentiment confidence 0-1 (sentiment type only)
    keywords?: Array<{  // Top keywords (keywords type only)
      word: string;
      count: number;
    }>;
  };
}
```

**Example Request:**
```json
{
  "text": "The quick brown fox jumps over the lazy dog.",
  "type": "general"
}
```

**Example Response:**
```json
{
  "success": true,
  "type": "general",
  "analysis": {
    "wordCount": 9,
    "characterCount": 44,
    "characterCountNoSpaces": 35,
    "sentenceCount": 1,
    "paragraphCount": 1,
    "averageWordLength": 4.67,
    "readingTime": 0.03
  }
}
```

---

### 3. Generate Content

**Endpoint:** `POST /api/a-to-mind/generate`

**Authentication:** Required

**Request Schema:**
```typescript
{
  prompt: string;  // Input text/prompt
  type?: 'summary' | 'title' | 'hashtags';  // Generation type (default: 'summary')
  length?: 'short' | 'medium' | 'long';  // Output length (default: 'medium')
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  type: string;
  result: string;  // Generated content
}
```

**Example Request:**
```json
{
  "prompt": "Artificial intelligence is transforming the world.",
  "type": "summary",
  "length": "short"
}
```

**Example Response:**
```json
{
  "success": true,
  "type": "summary",
  "result": "AI is changing the world."
}
```

---

### 4. Transform Data

**Endpoint:** `POST /api/a-to-mind/transform`

**Authentication:** Required

**Request Schema:**
```typescript
{
  data: string;  // Data to transform
  operation: 'uppercase' | 'lowercase' | 'reverse' | 'base64_encode' | 'base64_decode' | 'json_prettify' | 'json_minify';
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  operation: string;
  result: string;  // Transformed data
}
```

**Example Request:**
```json
{
  "data": "Hello World",
  "operation": "uppercase"
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "uppercase",
  "result": "HELLO WORLD"
}
```

---

### 5. Validate Data

**Endpoint:** `POST /api/a-to-mind/validate`

**Authentication:** Required

**Request Schema:**
```typescript
{
  data: string;  // Data to validate
  type: 'email' | 'url' | 'phone' | 'json';
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  type: string;
  validation: {
    valid: boolean;
    errors: string[];  // Validation error messages
  };
}
```

**Example Request:**
```json
{
  "data": "user@example.com",
  "type": "email"
}
```

**Example Response:**
```json
{
  "success": true,
  "type": "email",
  "validation": {
    "valid": true,
    "errors": []
  }
}
```

---

### 6. Extract Data

**Endpoint:** `POST /api/a-to-mind/extract`

**Authentication:** Required

**Request Schema:**
```typescript
{
  text: string;  // Text to extract from
  type: 'emails' | 'urls' | 'phone_numbers' | 'hashtags' | 'mentions';
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  type: string;
  extracted: string[];  // Extracted items
  count: number;  // Number of items extracted
}
```

**Example Request:**
```json
{
  "text": "Contact us at info@example.com or support@test.org",
  "type": "emails"
}
```

**Example Response:**
```json
{
  "success": true,
  "type": "emails",
  "extracted": ["info@example.com", "support@test.org"],
  "count": 2
}
```

---

### 7. Compare Data

**Endpoint:** `POST /api/a-to-mind/compare`

**Authentication:** Required

**Request Schema:**
```typescript
{
  data1: string;  // First data
  data2: string;  // Second data
  type?: 'text' | 'json';  // Comparison type (default: 'text')
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  type: string;
  comparison: {
    similarity?: number;  // Similarity score 0-1 (text type)
    commonWords?: string[];  // Common words (text type)
    difference?: {
      inText1: string[];  // Words only in text1
      inText2: string[];  // Words only in text2
    };
    equal?: boolean;  // Equality check (json type)
    keys1?: string[];  // Keys in data1 (json type)
    keys2?: string[];  // Keys in data2 (json type)
    addedKeys?: string[];  // Keys added in data2 (json type)
    removedKeys?: string[];  // Keys removed in data2 (json type)
    error?: string;  // Error message if comparison failed
  };
}
```

**Example Request (Text):**
```json
{
  "data1": "The quick brown fox",
  "data2": "The quick brown dog",
  "type": "text"
}
```

**Example Response (Text):**
```json
{
  "success": true,
  "type": "text",
  "comparison": {
    "similarity": 0.67,
    "commonWords": ["the", "quick", "brown"],
    "difference": {
      "inText1": ["fox"],
      "inText2": ["dog"]
    }
  }
}
```

**Example Request (JSON):**
```json
{
  "data1": "{\"name\":\"John\",\"age\":30}",
  "data2": "{\"name\":\"John\",\"age\":31}",
  "type": "json"
}
```

**Example Response (JSON):**
```json
{
  "success": true,
  "type": "json",
  "comparison": {
    "equal": false,
    "keys1": ["name", "age"],
    "keys2": ["name", "age"],
    "addedKeys": [],
    "removedKeys": []
  }
}
```

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` - Successful request
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## CI/CD Verification

**Automated Verification Step:**

In the CI/CD pipeline, add a step that:

1. Calls `GET /api/a-to-mind/health`
2. Validates the response schema against this specification
3. If schema validation fails, flag the build as "Documentation Out of Sync"

**Example verification script:**
```bash
# Test health endpoint
curl -H "Authorization: Bearer $ATOMIND_DEVIN_SECRET" \
  https://aether-bridge.atomicmoonbeam88.workers.dev/api/a-to-mind/health

# Validate response has required fields: status, version, timestamp
```

---

## Agent Instructions

**For Devin, OpenHands, and Agent Lee:**

1. **Before any code changes:** Read this `API_SPEC.md` file
2. **After any code changes:** Ensure the implementation matches this specification
3. **CI/CD gate:** The health endpoint must pass schema validation before merge
4. **Breaking changes:** Update this specification first, then implement the change

**This specification is the single source of truth.** If there's a discrepancy between this file and the actual implementation, this file takes precedence and the implementation must be updated to match.
