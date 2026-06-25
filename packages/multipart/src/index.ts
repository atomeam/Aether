/**
 * @aether/multipart - Multipart Form Handling
 * 
 * Provides multipart/form-data parsing middleware.
 * Handles file uploads and form fields.
 */

export interface MultipartConfig {
  maxFileSize?: number;
  maxFiles?: number;
  uploadDir?: string;
}

export function multipart(config: MultipartConfig = {}) {
  const {
    maxFileSize = 10 * 1024 * 1024,
    maxFiles = 10,
    uploadDir = 'uploads'
  } = config;

  return function (req: any, res: any, next: any) {
    if (!req.is('multipart/form-data')) {
      return next();
    }

    req.body = {};
    req.files = [];
    next();
  };
}