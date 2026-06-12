/**
 * @aether/security-headers - Security Headers Middleware
 * 
 * Provides security headers middleware for Express applications.
 * Implements OWASP recommended security headers.
 */

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  xContentTypeOptions?: boolean;
  xXSSProtection?: '0' | '1; mode=block';
  strictTransportSecurity?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: boolean;
}

export function securityHeaders(config: SecurityHeadersConfig = {}) {
  return function (req: any, res: any, next: any) {
    // Content Security Policy
    if (config.contentSecurityPolicy) {
      res.setHeader('Content-Security-Policy', config.contentSecurityPolicy);
    }

    // X-Frame-Options (prevent clickjacking)
    if (config.xFrameOptions) {
      res.setHeader('X-Frame-Options', config.xFrameOptions);
    } else {
      res.setHeader('X-Frame-Options', 'DENY');
    }

    // X-Content-Type-Options (prevent MIME sniffing)
    if (config.xContentTypeOptions !== false) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // X-XSS-Protection (XSS filter)
    if (config.xXSSProtection) {
      res.setHeader('X-XSS-Protection', config.xXSSProtection);
    } else {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // Strict-Transport-Security (HSTS)
    if (config.strictTransportSecurity) {
      res.setHeader('Strict-Transport-Security', config.strictTransportSecurity);
    }

    // Referrer-Policy
    if (config.referrerPolicy) {
      res.setHeader('Referrer-Policy', config.referrerPolicy);
    } else {
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // Permissions-Policy (formerly Feature-Policy)
    if (config.permissionsPolicy) {
      res.setHeader('Permissions-Policy', config.permissionsPolicy);
    }

    // Cross-Origin-Embedder-Policy
    if (config.crossOriginEmbedderPolicy) {
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    }

    // Cross-Origin-Opener-Policy
    if (config.crossOriginOpenerPolicy) {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    }

    // Cross-Origin-Resource-Policy
    if (config.crossOriginResourcePolicy) {
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    }

    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');

    next();
  };
}

// Pre-configured security headers
export const standardSecurityHeaders = securityHeaders({
  contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
  xFrameOptions: 'DENY',
  xContentTypeOptions: true,
  xXSSProtection: '1; mode=block',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
});

export const developmentSecurityHeaders = securityHeaders({
  xFrameOptions: 'SAMEORIGIN',
  xContentTypeOptions: true,
  xXSSProtection: '1; mode=block',
  referrerPolicy: 'strict-origin-when-cross-origin'
});

export const strictSecurityHeaders = securityHeaders({
  contentSecurityPolicy: "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none';",
  xFrameOptions: 'DENY',
  xContentTypeOptions: true,
  xXSSProtection: '1; mode=block',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  referrerPolicy: 'no-referrer',
  permissionsPolicy: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true
});