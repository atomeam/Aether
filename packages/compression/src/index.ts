/**
 * @aether/compression - Request/Response Compression Middleware
 * 
 * Provides compression middleware for Express applications.
 * Supports gzip, deflate, and brotli compression.
 */

import zlib from 'zlib';

export interface CompressionConfig {
  threshold?: number;      // Minimum size to compress (bytes)
  level?: number;          // Compression level (0-9)
  chunkSize?: number;      // Chunk size for compression
  filter?: (req: any) => boolean;  // Filter function
}

export function compression(config: CompressionConfig = {}) {
  const {
    threshold = 1024,      // 1KB
    level = 6,
    chunkSize = 16 * 1024,  // 16KB
    filter = () => true
  } = config;

  return function (req: any, res: any, next: any) {
    // Check if request should be compressed
    if (!filter(req)) {
      return next();
    }

    // Check if client accepts encoding
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    // Check for brotli support
    if (acceptEncoding.includes('br')) {
      res.setHeader('Content-Encoding', 'br');
      return compressResponse(res, zlib.createBrotliCompress({
        chunkSize,
        params: {
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_GENERIC,
          [zlib.constants.BROTLI_PARAM_QUALITY]: level,
          [zlib.constants.BROTLI_PARAM_SIZE_HINT]: chunkSize
        }
      }), threshold, next);
    }

    // Check for gzip support
    if (acceptEncoding.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      return compressResponse(res, zlib.createGzip({
        level,
        chunkSize
      }), threshold, next);
    }

    // Check for deflate support
    if (acceptEncoding.includes('deflate')) {
      res.setHeader('Content-Encoding', 'deflate');
      return compressResponse(res, zlib.createDeflate({
        level,
        chunkSize
      }), threshold, next);
    }

    next();
  };
}

function compressResponse(res: any, compressor: any, threshold: number, next: any) {
  const originalSend = res.send;
  const originalWrite = res.write;
  const originalEnd = res.end;
  const chunks: Buffer[] = [];
  let totalSize = 0;

  res.write = function (chunk: any, encoding?: any) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
      totalSize += chunk.length;
    } else {
      const buffer = Buffer.from(chunk, encoding);
      chunks.push(buffer);
      totalSize += buffer.length;
    }
    return true;
  };

  res.end = function (chunk?: any, encoding?: any) {
    if (chunk) {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
        totalSize += chunk.length;
      } else {
        const buffer = Buffer.from(chunk, encoding);
        chunks.push(buffer);
        totalSize += buffer.length;
      }
    }

    if (totalSize < threshold) {
      // Don't compress small responses
      res.removeHeader('Content-Encoding');
      const body = Buffer.concat(chunks);
      originalEnd.call(res, body);
      return;
    }

    // Compress the response
    const body = Buffer.concat(chunks);
    compressor.on('data', (compressedChunk: Buffer) => {
      originalWrite.call(res, compressedChunk);
    });

    compressor.on('end', () => {
      originalEnd.call(res);
    });

    compressor.write(body);
    compressor.end();
  };

  next();
}

// Pre-configured compression
export const standardCompression = compression({
  threshold: 1024,
  level: 6
});

export const aggressiveCompression = compression({
  threshold: 512,
  level: 9
});

export const lightCompression = compression({
  threshold: 2048,
  level: 3
});

export const noCompression = compression({
  threshold: Infinity
});