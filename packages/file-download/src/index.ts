/**
 * @aether/file-download - File Download Handling
 * 
 * Provides file download handling middleware for Express applications.
 * Supports streaming files with proper headers and caching.
 */

import fs from 'fs';
import path from 'path';

export interface FileDownloadConfig {
  rootDir?: string;         // Root directory for files
  enableCache?: boolean;    // Enable caching
  cacheMaxAge?: number;     // Cache max age in seconds
  enableRange?: boolean;    // Enable range requests
}

export function fileDownload(config: FileDownloadConfig = {}) {
  const {
    rootDir = 'public',
    enableCache = true,
    cacheMaxAge = 86400,  // 24 hours
    enableRange = true
  } = config;

  return function (req: any, res: any, next: any) {
    const filepath = path.join(rootDir, req.path);

    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        error: 'File not found',
        path: req.path
      });
    }

    // Check if it's a file
    const stats = fs.statSync(filepath);
    if (!stats.isFile()) {
      return next();
    }

    // Set cache headers
    if (enableCache) {
      res.setHeader('Cache-Control', `public, max-age=${cacheMaxAge}`);
      res.setHeader('ETag', `"${stats.mtime.getTime()}-${stats.size}"`);
    }

    // Handle range requests
    if (enableRange && req.headers.range) {
      const range = req.headers.range;
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunksize);

      const stream = fs.createReadStream(filepath, { start, end });
      stream.pipe(res);
      return;
    }

    // Set content type
    const ext = path.extname(filepath);
    const contentType = getContentType(ext);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);

    // Stream file
    const stream = fs.createReadStream(filepath);
    stream.pipe(res);
  };
}

function getContentType(ext: string): string {
  const contentTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
  };

  return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
}

// Helper function to send file as attachment
export function sendFileAsAttachment(res: any, filepath: string, filename?: string): void {
  if (!fs.existsSync(filepath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  const stats = fs.statSync(filepath);
  const downloadName = filename || path.basename(filepath);

  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', stats.size);

  const stream = fs.createReadStream(filepath);
  stream.pipe(res);
}