# a-to-mind Agent Utility Layer

**Optimized for AI Agent Tool-Calling**

The a-to-mind Agent Utility Layer provides 7 essential text and data operations in a single API, designed specifically for autonomous agents, RAG implementations, and AI-powered systems.

## Why Agents Need This

AI agents require fast, predictable, and reliable utility functions for:
- Text processing and analysis
- Data validation and extraction
- Content generation
- Data transformation
- Comparison operations

**Agent-Optimized Design:**
- Single authentication token for all operations
- Unified rate limiting across all endpoints
- Fast response times (Cloudflare Workers edge deployment)
- Predictable schemas (Zod-validated)
- No AI dependency costs (pure logic)

## Available Operations

### 1. Analyze Text
```typescript
// Sentiment analysis, keyword extraction, text statistics
POST /api/a-to-mind/analyze
{
  "text": "The quick brown fox jumps over the lazy dog",
  "type": "sentiment"  // "general" | "sentiment" | "keywords"
}
```

### 2. Generate Content
```typescript
// Summaries, titles, hashtags
POST /api/a-to-mind/generate
{
  "prompt": "Artificial intelligence is transforming the world",
  "type": "summary",  // "summary" | "title" | "hashtags"
  "length": "short"  // "short" | "medium" | "long"
}
```

### 3. Transform Data
```typescript
// Case conversion, base64, JSON formatting
POST /api/a-to-mind/transform
{
  "data": "Hello World",
  "operation": "uppercase"  // "uppercase" | "lowercase" | "reverse" | "base64_encode" | "base64_decode" | "json_prettify" | "json_minify"
}
```

### 4. Validate Data
```typescript
// Email, URL, phone, JSON validation
POST /api/a-to-mind/validate
{
  "data": "user@example.com",
  "type": "email"  // "email" | "url" | "phone" | "json"
}
```

### 5. Extract Data
```typescript
// Extract emails, URLs, phone numbers, hashtags, mentions
POST /api/a-to-mind/extract
{
  "text": "Contact us at info@example.com or support@test.org",
  "type": "emails"  // "emails" | "urls" | "phone_numbers" | "hashtags" | "mentions"
}
```

### 6. Compare Data
```typescript
// Text similarity, JSON comparison
POST /api/a-to-mind/compare
{
  "data1": "The quick brown fox",
  "data2": "The quick brown dog",
  "type": "text"  // "text" | "json"
}
```

### 7. Health Check
```typescript
// API status monitoring
GET /api/a-to-mind/health
```

## Authentication

All endpoints require Bearer token authentication:

```http
Authorization: Bearer YOUR_API_KEY
```

## Agent Integration Example

```typescript
// TypeScript/JavaScript agent integration
class AgentUtilityClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://aether-bridge.atomicmoonbeam88.workers.dev';
  }

  async analyze(text: string, type = 'general') {
    const response = await fetch(`${this.baseUrl}/api/a-to-mind/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, type })
    });
    return response.json();
  }

  async validate(data: string, type: string) {
    const response = await fetch(`${this.baseUrl}/api/a-to-mind/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data, type })
    });
    return response.json();
  }

  // ... other methods
}
```

## Python Agent Integration

```python
import requests

class AgentUtilityClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://aether-bridge.atomicmoonbeam88.workers.dev"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def analyze(self, text, type="general"):
        response = requests.post(
            f"{self.base_url}/api/a-to-mind/analyze",
            headers=self.headers,
            json={"text": text, "type": type}
        )
        return response.json()

    def validate(self, data, type):
        response = requests.post(
            f"{self.base_url}/api/a-to-mind/validate",
            headers=self.headers,
            json={"data": data, "type": type}
        )
        return response.json()
```

## Performance Characteristics

- **Latency:** <100ms (Cloudflare Workers edge deployment)
- **Uptime:** 99.9% SLA
- **Rate Limiting:** 500 requests/day (Basic), 10,000/month (Pro)
- **Response Size:** <10KB typical
- **Concurrent Requests:** 100+ (edge scaling)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

HTTP Status Codes:
- `200 OK` - Success
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Missing or invalid API key
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Pricing

| Plan | Price | Requests | Use Case |
|------|-------|----------|----------|
| Basic | Free | 500/day | Development, testing |
| Pro | $25/mo | 10,000/mo | Production agents |
| Ultra | $75/mo | 50,000/mo | High-volume systems |
| Mega | $150/mo | 200,000/mo | Enterprise deployments |

## Getting Started

1. **Get API Key:** Sign up at [a-to-mind.com](https://a-to-mind.com)
2. **Test Endpoints:** Use the Basic plan (free) for development
3. **Integrate:** Copy the agent integration code for your language
4. **Deploy:** Upgrade to Pro plan for production use

## Support

- Documentation: [API_SPEC.md](API_SPEC.md)
- Status: [Health Check](https://aether-bridge.atomicmoonbeam88.workers.dev/api/a-to-mind/health)
- Issues: [GitHub Issues](https://github.com/atomeam/Aether/issues)

## Roadmap

- [ ] Add streaming responses for long operations
- [ ] Add batch processing endpoints
- [ ] Add webhook support for async operations
- [ ] Add SDK for Python, Go, Rust
- [ ] Add regional endpoints for lower latency
