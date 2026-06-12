/**
 * @aether/query-parser - Query Parser Middleware
 * 
 * Provides query string parsing middleware for Express applications.
 * Parses and validates query parameters.
 */

export interface QueryParserConfig {
  parseArrays?: boolean;
  parseBooleans?: boolean;
  parseNumbers?: boolean;
  customParsers?: Record<string, (value: string) => any>;
}

export function queryParser(config: QueryParserConfig = {}) {
  const {
    parseArrays = true,
    parseBooleans = true,
    parseNumbers = true,
    customParsers = {}
  } = config;

  return function (req: any, res: any, next: any) {
    if (!req.query) {
      req.query = {};
      return next();
    }

    const parsed: Record<string, any> = {};

    for (const [key, value] of Object.entries(req.query)) {
      // Check for custom parser
      if (customParsers[key]) {
        parsed[key] = customParsers[key](value as string);
        continue;
      }

      // Parse arrays (key[]=value or key=value1&key=value2)
      if (parseArrays && Array.isArray(value)) {
        parsed[key] = value.map(v => parseValue(v, parseBooleans, parseNumbers));
        continue;
      }

      // Parse single value
      parsed[key] = parseValue(value, parseBooleans, parseNumbers);
    }

    req.query = parsed;
    next();
  };
}

function parseValue(value: any, parseBooleans: boolean, parseNumbers: boolean): any {
  if (typeof value === 'string') {
    // Parse booleans
    if (parseBooleans) {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }

    // Parse numbers
    if (parseNumbers) {
      const num = Number(value);
      if (!isNaN(num) && isFinite(num)) {
        return num;
      }
    }
  }

  return value;
}

// Pre-configured query parsers
export const standardQueryParser = queryParser({
  parseArrays: true,
  parseBooleans: true,
  parseNumbers: true
});

export const strictQueryParser = queryParser({
  parseArrays: false,
  parseBooleans: true,
  parseNumbers: true
});

export const rawQueryParser = queryParser({
  parseArrays: false,
  parseBooleans: false,
  parseNumbers: false
});