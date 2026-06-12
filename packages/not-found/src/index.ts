/**
 * @aether/not-found - 404 Error Handler
 * 
 * Provides 404 error handling middleware for Express applications.
 * Returns consistent 404 responses for unmatched routes.
 */

export interface NotFoundConfig {
  json?: boolean;
  html?: boolean;
  message?: string;
  customHandler?: (req: any, res: any) => void;
}

export function notFound(config: NotFoundConfig = {}) {
  const {
    json = true,
    html = false,
    message = 'Resource not found',
    customHandler
  } = config;

  return function (req: any, res: any, next: any) {
    if (customHandler) {
      return customHandler(req, res);
    }

    if (json) {
      return res.status(404).json({
        error: 'Not Found',
        message,
        path: req.path,
        method: req.method
      });
    }

    if (html) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>404 - Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { font-size: 72px; margin: 0; }
            p { font-size: 18px; color: #666; }
          </style>
        </head>
        <body>
          <h1>404</h1>
          <p>${message}</p>
          <p>Path: ${req.path}</p>
        </body>
        </html>
      `);
    }

    res.status(404).send(message);
  };
}

// Pre-configured 404 handlers
export const jsonNotFound = notFound({ json: true });
export const htmlNotFound = notFound({ html: true });