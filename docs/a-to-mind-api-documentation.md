# a-to-mind API Documentation

## Overview

The a-to-mind API is a comprehensive automation and productivity API that provides text analysis, content generation, data transformation, validation, extraction, and comparison capabilities.

## Base URL

```
https://bridge.a-to-mind.com/api/a-to-mind
```

## Authentication

Add your RapidAPI key to the request headers:

```bash
x-rapidapi-key: YOUR_API_KEY
x-rapidapi-host: bridge.a-to-mind.com
```

## Endpoints

### 1. Health Check

Check API health and status.

**Endpoint**: `GET /api/a-to-mind/health`

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-06-12T08:00:00.000Z",
  "uptime": 3600
}
```

### 2. Analyze Text

Analyze text for various metrics and insights.

**Endpoint**: `POST /api/a-to-mind/analyze`

**Request Body**:
```json
{
  "text": "Your text here",
  "type": "general" // Options: general, sentiment, keywords
}
```

**Response (general)**:
```json
{
  "success": true,
  "type": "general",
  "analysis": {
    "wordCount": 10,
    "characterCount": 50,
    "characterCountNoSpaces": 45,
    "sentenceCount": 2,
    "paragraphCount": 1,
    "averageWordLength": 4.5,
    "readingTime": 1
  }
}
```

**Response (sentiment)**:
```json
{
  "success": true,
  "type": "sentiment",
  "analysis": {
    "wordCount": 10,
    "characterCount": 50,
    "sentiment": "positive",
    "positiveCount": 3,
    "negativeCount": 1,
    "confidence": 0.2
  }
}
```

**Response (keywords)**:
```json
{
  "success": true,
  "type": "keywords",
  "analysis": {
    "wordCount": 10,
    "keywords": [
      { "word": "example", "count": 2 },
      { "word": "text", "count": 1 }
    ]
  }
}
```

### 3. Generate Content

Generate summaries, titles, hashtags, and more.

**Endpoint**: `POST /api/a-to-mind/generate`

**Request Body**:
```json
{
  "prompt": "Your text here",
  "type": "summary", // Options: summary, title, hashtags
  "length": "medium" // Options: short, medium (for summary only)
}
```

**Response (summary)**:
```json
{
  "success": true,
  "type": "summary",
  "result": "Summary of your text..."
}
```

**Response (title)**:
```json
{
  "success": true,
  "type": "title",
  "result": "Your Text Title"
}
```

**Response (hashtags)**:
```json
{
  "success": true,
  "type": "hashtags",
  "result": "#example #text #hashtags"
}
```

### 4. Transform Data

Transform data in various ways.

**Endpoint**: `POST /api/a-to-mind/transform`

**Request Body**:
```json
{
  "data": "Your data here",
  "operation": "uppercase" // Options: uppercase, lowercase, reverse, base64_encode, base64_decode, json_prettify, json_minify
}
```

**Response**:
```json
{
  "success": true,
  "operation": "uppercase",
  "result": "YOUR DATA HERE"
}
```

### 5. Validate Data

Validate various data types.

**Endpoint**: `POST /api/a-to-mind/validate`

**Request Body**:
```json
{
  "data": "your@email.com",
  "type": "email" // Options: email, url, phone, json
}
```

**Response**:
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

### 6. Extract Data

Extract specific data patterns from text.

**Endpoint**: `POST /api/a-to-mind/extract`

**Request Body**:
```json
{
  "text": "Contact us at test@example.com or visit https://example.com",
  "type": "emails" // Options: emails, urls, phone_numbers, hashtags, mentions
}
```

**Response**:
```json
{
  "success": true,
  "type": "emails",
  "extracted": ["test@example.com"],
  "count": 1
}
```

### 7. Compare Data

Compare two texts or JSON objects.

**Endpoint**: `POST /api/a-to-mind/compare`

**Request Body**:
```json
{
  "data1": "First text",
  "data2": "Second text",
  "type": "text" // Options: text, json
}
```

**Response (text)**:
```json
{
  "success": true,
  "type": "text",
  "comparison": {
    "similarity": 50.0,
    "commonWords": ["text"],
    "difference": {
      "inText1": ["first"],
      "inText2": ["second"]
    }
  }
}
```

**Response (json)**:
```json
{
  "success": true,
  "type": "json",
  "comparison": {
    "equal": false,
    "keys1": ["key1"],
    "keys2": ["key2"],
    "addedKeys": ["key2"],
    "removedKeys": ["key1"]
  }
}
```

## Use Cases

### Content Creation
- Generate summaries of long articles
- Create catchy titles for blog posts
- Generate hashtags for social media
- Analyze text sentiment

### Data Processing
- Validate user input (emails, URLs, phone numbers)
- Extract contact information from text
- Transform data formats
- Compare similar documents

### Automation
- Automate text analysis workflows
- Batch process text data
- Generate content at scale
- Clean and normalize data

## Pricing

- **Free**: 100 requests/day
- **Basic**: $5/month, 1,000 requests
- **Pro**: $15/month, 10,000 requests

## Rate Limits

- Free tier: 100 requests/day
- Basic tier: 1,000 requests/month
- Pro tier: 10,000 requests/month

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (missing parameters)
- `404` - Endpoint not found
- `500` - Internal server error

## Code Examples

### cURL

```bash
# Analyze text
curl -X POST https://bridge.a-to-mind.com/api/a-to-mind/analyze \
  -H "Content-Type: application/json" \
  -H "x-rapidapi-key: YOUR_API_KEY" \
  -H "x-rapidapi-host: bridge.a-to-mind.com" \
  -d '{"text":"Hello world","type":"general"}'

# Generate hashtags
curl -X POST https://bridge.a-to-mind.com/api/a-to-mind/generate \
  -H "Content-Type: application/json" \
  -H "x-rapidapi-key: YOUR_API_KEY" \
  -H "x-rapidapi-host: bridge.a-to-mind.com" \
  -d '{"prompt":"AI is amazing","type":"hashtags"}'

# Validate email
curl -X POST https://bridge.a-to-mind.com/api/a-to-mind/validate \
  -H "Content-Type: application/json" \
  -H "x-rapidapi-key: YOUR_API_KEY" \
  -H "x-rapidapi-host: bridge.a-to-mind.com" \
  -d '{"data":"test@example.com","type":"email"}'
```

### JavaScript

```javascript
// Analyze text
const response = await fetch('https://bridge.a-to-mind.com/api/a-to-mind/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-rapidapi-key': 'YOUR_API_KEY',
    'x-rapidapi-host': 'bridge.a-to-mind.com'
  },
  body: JSON.stringify({
    text: 'Your text here',
    type: 'general'
  })
});

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

# Analyze text
response = requests.post(
    'https://bridge.a-to-mind.com/api/a-to-mind/analyze',
    headers={
        'Content-Type': 'application/json',
        'x-rapidapi-key': 'YOUR_API_KEY',
        'x-rapidapi-host': 'bridge.a-to-mind.com'
    },
    json={
        'text': 'Your text here',
        'type': 'general'
    }
)

data = response.json()
print(data)
```

## Support

For support, contact: support@a-to-mind.com

## Changelog

### v1.0.0 (2026-06-12)
- Initial release
- 7 endpoints: health, analyze, generate, transform, validate, extract, compare
- Multiple analysis types: general, sentiment, keywords
- Multiple generation types: summary, title, hashtags
- Multiple transformation operations
- Multiple validation types
- Multiple extraction types
- Text and JSON comparison
