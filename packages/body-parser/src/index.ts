/**
 * @aether/body-parser - Body Parser Middleware
 * 
 * Provides body parsing middleware for Express applications.
 * Supports JSON, URL-encoded, raw, and text bodies.
 */

export interface BodyParserConfig {
  json?: boolean | { limit?: string; strict?: boolean };
  urlencoded?: boolean | { extended?: boolean; limit?: string };
  raw?: boolean | { limit?: string; type?: string };
  text?: boolean | { limit?: string; type?: string };
}

export function bodyParser(config: BodyParserConfig = {}) {
  const {
    json = true,
    urlencoded = true,
    raw = false,
    text = false
  } = config;

  return function (req: any, res: any, next: any) {
    // Parse JSON body
    if (json && isJSON(req)) {
      parseJSONBody(req, typeof json === 'object' ? json : {});
    }

    // Parse URL-encoded body
    if (urlencoded && isURLEncoded(req)) {
      parseURLEncodedBody(req, typeof urlencoded === 'object' ? urlencoded : {});
    }

    // Parse raw body
    if (raw) {
      parseRawBody(req, typeof raw === 'object' ? raw : {});
    }

    // Parse text body
    if (text) {
      parseTextBody(req, typeof text === 'object' ? text : {});
    }

    next();
  };
}

function isJSON(req: any): boolean {
  const contentType = req.headers['content-type'];
  return contentType?.includes('application/json');
}

function isURLEncoded(req: any): boolean {
  const contentType = req.headers['content-type'];
  return contentType?.includes('application/x-www-form-urlencoded');
}

function parseJSONBody(req: any, config: { limit?: string; strict?: boolean }): void {
  const { limit = '100kb', strict = true } = config;
  const body = req.body;

  if (typeof body === 'string') {
    try {
      req.body = JSON.parse(body);
    } catch (error) {
      throw new Error('Invalid JSON body');
    }
  }
}

function parseURLEncodedBody(req: any, config: { extended?: boolean; limit?: string }): void {
  const { extended = true, limit = '100kb' } = config;
  const body = req.body;

  if (typeof body === 'string') {
    const parsed = new URLSearchParams(body);
    const result: Record<string, any> = {};

    parsed.forEach((value, key) => {
      if (extended) {
        // Handle nested keys like user[name]
        const keys = key.split(/\[|\]/).filter(k => k);
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
      } else {
        result[key] = value;
      }
    });

    req.body = result;
  }
}

function parseRawBody(req: any, config: { limit?: string; type?: string }): void {
  const { limit = '100kb', type = 'application/octet-stream' } = config;
  // Raw body is already in req.body
}

function parseTextBody(req: any, config: { limit?: string; type?: string }): void {
  const { limit = '100kb', type = 'text/plain' } = config;
  // Text body is already in req.body
}

// Pre-configured body parsers
export const standardBodyParser = bodyParser({
  json: { limit: '100kb', strict: true },
  urlencoded: { extended: true, limit: '100kb' }
});

export const largeBodyParser = bodyParser({
  json: { limit: '10mb', strict: true },
  urlencoded: { extended: true, limit: '10mb' }
});

export const strictBodyParser = bodyParser({
  json: { limit: '100kb', strict: true },
  urlencoded: { extended: false, limit: '100kb' }
});