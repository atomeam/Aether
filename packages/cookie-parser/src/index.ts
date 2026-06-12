/**
 * @aether/cookie-parser - Cookie Parser Middleware
 * 
 * Provides cookie parsing middleware for Express applications.
 * Parses Cookie header and populates req.cookies.
 */

export interface CookieParserConfig {
  secret?: string | string[];  // Secret for signed cookies
  decode?: (val: string) => string;
}

export function cookieParser(config: CookieParserConfig = {}) {
  const {
    secret,
    decode = decodeURIComponent
  } = config;

  return function (req: any, res: any, next: any) {
    const cookieHeader = req.headers.cookie;
    
    if (!cookieHeader) {
      req.cookies = {};
      return next();
    }

    req.cookies = parseCookies(cookieHeader, decode);
    next();
  };
}

function parseCookies(cookieHeader: string, decode: (val: string) => string): Record<string, string> {
  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(';');

  for (const pair of pairs) {
    const [key, ...valueParts] = pair.trim().split('=');
    if (!key) continue;

    const value = valueParts.join('=');
    try {
      cookies[key.trim()] = decode(value);
    } catch {
      cookies[key.trim()] = value;
    }
  }

  return cookies;
}

// Pre-configured cookie parsers
export const standardCookieParser = cookieParser();
export const signedCookieParser = cookieParser({ secret: 'default-secret' });