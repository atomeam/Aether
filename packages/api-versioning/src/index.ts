/**
 * @aether/api-versioning - API Versioning Strategy
 * 
 * Provides API versioning middleware for Express applications.
 * Supports URL-based, header-based, and query parameter versioning.
 */

export interface VersioningConfig {
  type?: 'url' | 'header' | 'query';
  headerName?: string;
  queryParam?: string;
  defaultVersion?: string;
  supportedVersions?: string[];
}

export function apiVersioning(config: VersioningConfig = {}) {
  const {
    type = 'url',
    headerName = 'API-Version',
    queryParam = 'version',
    defaultVersion = 'v1',
    supportedVersions = ['v1', 'v2']
  } = config;

  return function (req: any, res: any, next: any) {
    let version = defaultVersion;

    switch (type) {
      case 'url':
        // Extract version from URL path (e.g., /api/v1/users)
        const urlMatch = req.path.match(/\/api\/(v\d+)/);
        if (urlMatch) {
          version = urlMatch[1];
        }
        break;

      case 'header':
        // Extract version from header
        version = req.headers[headerName.toLowerCase()] || defaultVersion;
        break;

      case 'query':
        // Extract version from query parameter
        version = req.query[queryParam] || defaultVersion;
        break;
    }

    // Validate version
    if (!supportedVersions.includes(version)) {
      return res.status(400).json({
        error: 'Invalid API version',
        supportedVersions,
        requestedVersion: version
      });
    }

    // Add version to request
    req.apiVersion = version;
    res.setHeader('API-Version', version);

    next();
  };
}

// Pre-configured versioning strategies
export const urlVersioning = apiVersioning({ type: 'url' });
export const headerVersioning = apiVersioning({ type: 'header' });
export const queryVersioning = apiVersioning({ type: 'query' });

// Version-aware middleware
export function requireVersion(version: string) {
  return function (req: any, res: any, next: any) {
    if (req.apiVersion !== version) {
      return res.status(400).json({
        error: 'API version mismatch',
        required: version,
        provided: req.apiVersion
      });
    }
    next();
  };
}

export function requireMinVersion(minVersion: string) {
  return function (req: any, res: any, next: any) {
    const versionOrder = ['v1', 'v2', 'v3'];
    const minIndex = versionOrder.indexOf(minVersion);
    const currentIndex = versionOrder.indexOf(req.apiVersion);

    if (currentIndex < minIndex) {
      return res.status(400).json({
        error: 'API version too old',
        minimum: minVersion,
        provided: req.apiVersion
      });
    }
    next();
  };
}