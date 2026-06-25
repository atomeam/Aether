/**
 * @aether/request-signing - Request Signing Verification
 * 
 * Provides request signing verification middleware.
 * Validates HMAC signatures for request authentication.
 */

import crypto from 'crypto';

export interface SigningConfig {
  secret: string;
  algorithm?: 'sha256' | 'sha512' | 'sha1';
  headerName?: string;
  timestampHeader?: string;
  timestampTolerance?: number;
}

export function requestSigning(config: SigningConfig) {
  const {
    secret,
    algorithm = 'sha256',
    headerName = 'X-Signature',
    timestampHeader = 'X-Timestamp',
    timestampTolerance = 300000  // 5 minutes
  } = config;

  return function (req: any, res: any, next: any) {
    const signature = req.headers[headerName.toLowerCase()];
    const timestamp = req.headers[timestampHeader?.toLowerCase()];

    if (!signature) {
      return res.status(401).json({
        error: 'Missing signature',
        message: 'Request signature is required'
      });
    }

    // Check timestamp if provided
    if (timestamp) {
      const now = Date.now();
      const timestampNum = parseInt(timestamp, 10);
      
      if (isNaN(timestampNum)) {
        return res.status(401).json({
          error: 'Invalid timestamp',
          message: 'Timestamp must be a number'
        });
      }

      if (Math.abs(now - timestampNum) > timestampTolerance) {
        return res.status(401).json({
          error: 'Timestamp expired',
          message: 'Request timestamp is too old'
        });
      }
    }

    // Generate expected signature
    const expectedSignature = generateSignature(req, secret, algorithm);

    // Compare signatures (constant-time comparison)
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return res.status(401).json({
        error: 'Invalid signature',
        message: 'Request signature verification failed'
      });
    }

    next();
  };
}

function generateSignature(req: any, secret: string, algorithm: string): string {
  const hmac = crypto.createHmac(algorithm, secret);
  
  // Sign method, path, and body
  const data = `${req.method}:${req.path}:${JSON.stringify(req.body)}`;
  hmac.update(data);
  
  return hmac.digest('hex');
}

// Helper function to generate signature for client
export function generateClientSignature(method: string, path: string, body: any, secret: string, algorithm: 'sha256' | 'sha512' | 'sha1' = 'sha256'): string {
  const hmac = crypto.createHmac(algorithm, secret);
  const data = `${method}:${path}:${JSON.stringify(body)}`;
  hmac.update(data);
  return hmac.digest('hex');
}