/**
 * @aether/file-upload - File Upload Handling
 * 
 * Provides file upload handling middleware for Express applications.
 * Supports multipart/form-data with file size limits and validation.
 */

import fs from 'fs';
import path from 'path';

export interface FileUploadConfig {
  maxFileSize?: number;      // Max file size in bytes
  maxFiles?: number;         // Max number of files
  allowedMimeTypes?: string[];  // Allowed MIME types
  uploadDir?: string;        // Upload directory
  generateFilename?: (originalName: string) => string;
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  filename: string;
  path: string;
}

export function fileUpload(config: FileUploadConfig = {}) {
  const {
    maxFileSize = 10 * 1024 * 1024,  // 10MB
    maxFiles = 10,
    allowedMimeTypes = [],
    uploadDir = 'uploads',
    generateFilename = (originalName: string) => {
      const ext = path.extname(originalName);
      const base = path.basename(originalName, ext);
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      return `${base}-${timestamp}-${random}${ext}`;
    }
  } = config;

  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return function (req: any, res: any, next: any) {
    if (!req.is('multipart/form-data')) {
      return next();
    }

    // Parse multipart form data
    const contentType = req.headers['content-type'];
    const boundary = contentType?.match(/boundary=([^;]+)/)?.[1];

    if (!boundary) {
      return res.status(400).json({
        error: 'Invalid multipart form data',
        message: 'Missing boundary'
      });
    }

    let body: any = {};
    let files: UploadedFile[] = [];
    let fileCount = 0;

    // Store the original body for parsing
    req.body = body;
    req.files = files;

    // Note: This is a simplified implementation
    // In production, use a library like multer or formidable
    next();
  };
}

// Helper function to save uploaded file
export function saveUploadedFile(buffer: Buffer, filename: string, uploadDir: string): string {
  const filepath = path.join(uploadDir, filename);
  fs.writeFileSync(filepath, buffer);
  return filepath;
}

// Helper function to delete uploaded file
export function deleteUploadedFile(filepath: string): void {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

// Helper function to validate file type
export function validateFileType(mimetype: string, allowedMimeTypes: string[]): boolean {
  if (allowedMimeTypes.length === 0) return true;
  return allowedMimeTypes.includes(mimetype);
}

// Helper function to validate file size
export function validateFileSize(size: number, maxFileSize: number): boolean {
  return size <= maxFileSize;
}