/**
 * Integration Manager - Unit Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  IntegrationManager, 
  IntegrationConfig, 
  RouteRequest,
  MCPClient,
  MCPJSONRPCRequest,
  MCPJSONRPCResponse,
} from '../src/core/integration_manager';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Create a temporary config file for testing
function createTempConfig(config: object): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integration-test-'));
  const configPath = path.join(tempDir, 'integrations.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return configPath;
}

// Mock logger for testing
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe('IntegrationManager', () => {
  let tempConfigPath: string;

  afterEach(() => {
    // Cleanup temp files
    if (tempConfigPath) {
      const dir = path.dirname(tempConfigPath);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create an instance with default logger', () => {
      const configPath = createTempConfig({ integrations: [] });
      const manager = new IntegrationManager(configPath);
      expect(manager).toBeDefined();
    });

    it('should create an instance with custom logger', () => {
      const configPath = createTempConfig({ integrations: [] });
      const manager = new IntegrationManager(configPath, mockLogger);
      expect(manager).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should load integrations from config file', async () => {
      const config = {
        integrations: [
          { name: 'test-api', type: 'api', enabled: true, baseUrl: 'https://api.test.com' },
        ],
      };
      tempConfigPath = createTempConfig(config);

      const manager = new IntegrationManager(tempConfigPath, mockLogger);
      await manager.initialize();

      expect(manager.isInitialized()).toBe(true);
      const integrations = manager.listIntegrations();
      expect(integrations).toHaveLength(1);
      expect(integrations[0].name).toBe('test-api');
    });

    it('should throw error for invalid config', async () => {
      tempConfigPath = createTempConfig({});
      const manager = new IntegrationManager(tempConfigPath, mockLogger);

      await expect(manager.initialize()).rejects.toThrow('Invalid config');
    });

    it('should not reinitialize if already initialized', async () => {
      const config = { integrations: [] };
      tempConfigPath = createTempConfig(config);

      const manager = new IntegrationManager(tempConfigPath, mockLogger);
      await manager.initialize();
      await manager.initialize();

      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('getIntegration', () => {
    it('should return integration config by name', async () => {
      const config = {
        integrations: [
          { name: 'my-api', type: 'api', enabled: true, baseUrl: 'https://api.test.com' },
        ],
      };
      tempConfigPath = createTempConfig(config);

      const manager = new IntegrationManager(tempConfigPath, mockLogger);
      await manager.initialize();

      const integration = manager.getIntegration('my-api');
      expect(integration).toBeDefined();
      expect(integration?.type).toBe('api');
    });

    it('should return undefined for non-existent integration', async () => {
      const config = { integrations: [] };
      tempConfigPath = createTempConfig(config);

      const manager = new IntegrationManager(tempConfigPath, mockLogger);
      await manager.initialize();

      const integration = manager.getIntegration('non-existent');
      expect(integration).toBeUndefined();
    });
  });

  describe('listIntegrations', () => {
    it('should list all registered integrations', async () => {
      const config = {
        integrations: [
          { name: 'api-1', type: 'api', enabled: true },
          { name: 'api-2', type: 'api', enabled: false },
          { name: 'mcp-1', type: 'mcp', enabled: true },
        ],
      };
      tempConfigPath = createTempConfig(config);

      const manager = new IntegrationManager(tempConfigPath, mockLogger);
      await manager.initialize();

      const integrations = manager.listIntegrations();
      expect(integrations).toHaveLength(3);
    });
  });

  describe('getStatus', () => {
    it('should return status for existing integration', async () => {
      const config = {
        integrations: [
          { name: 'test-api', type: 'api', enabled: true },
        ],
      };
      tempConfigPath = createTempConfig(config);

      const manager = new IntegrationManager(tempConfigPath, mockLogger);
      await manager.initialize();

      const status = manager.getStatus('test-api');
      expect(status).toBeDefined();
      expect(status?.status).toBe('initialized');
    });
  });

  describe('setEnabled', () => {
    it('should enable/disable an integration', async () => {
      const config = {
        integrations: [
          { name: 'toggle-api', type: 'api', enabled: false },
        ],
      };
      tempConfigPath = createTempConfig(config);

      const manager = new IntegrationManager(tempConfigPath, mockLogger);
      await manager.initialize();

      const result = manager.setEnabled('toggle-api', true);
      expect(result).toBe(true);

      const status = manager.getStatus('toggle-api');
      expect(status?.status).toBe('active');
    });

    it('should return false for non-existent integration', async () => {
      const config = { integrations: [] };
      tempConfigPath = createTempConfig(config);

      const manager = new IntegrationManager(tempConfigPath, mockLogger);
      await manager.initialize();

      const result = manager.setEnabled('non-existent', true);
      expect(result).toBe(false);
    });
  });

  describe('route', () => {
    it('should return 404 for non-existent integration', async () => {
      const config = { integrations: [] };
      tempConfigPath = createTempConfig(config);

      const manager = new IntegrationManager(tempConfigPath, mockLogger);
      await manager.initialize();

      const request: RouteRequest = {
        integration: 'non-existent',
        endpoint: '/test',
      };

      const response = await manager.route(request);
      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(404);
    });

    it('should return 403 for disabled integration', async () => {
      const config = {
        integrations: [
          { name: 'disabled-api', type: 'api', enabled: false, baseUrl: 'https://api.test.com' },
        ],
      };
      tempConfigPath = createTempConfig(config);

      const manager = new IntegrationManager(tempConfigPath, mockLogger);
      await manager.initialize();

      const request: RouteRequest = {
        integration: 'disabled-api',
        endpoint: '/test',
      };

      const response = await manager.route(request);
      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(403);
    });
  });

  describe('registerIntegration', () => {
    it('should throw error for missing name', async () => {
      const config = { integrations: [] };
      tempConfigPath = createTempConfig(config);

      const manager = new IntegrationManager(tempConfigPath, mockLogger);
      await manager.initialize();

      const invalidConfig: IntegrationConfig = {
        name: '',
        type: 'api',
        enabled: true,
      };

      await expect(manager.registerIntegration(invalidConfig)).rejects.toThrow();
    });

    it('should throw error for invalid type', async () => {
      const config = { integrations: [] };
      tempConfigPath = createTempConfig(config);

      const manager = new IntegrationManager(tempConfigPath, mockLogger);
      await manager.initialize();

      const invalidConfig: IntegrationConfig = {
        name: 'invalid-type',
        type: 'invalid' as 'api',
        enabled: true,
      };

      await expect(manager.registerIntegration(invalidConfig)).rejects.toThrow('Invalid integration type');
    });
  });
});

describe('Routing Logic', () => {
  let tempConfigPath: string;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock fetch for all routing logic tests
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (tempConfigPath) {
      const dir = path.dirname(tempConfigPath);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should correctly route to API-type integrations', async () => {
    const config = {
      integrations: [
        { 
          name: 'test-api', 
          type: 'api', 
          enabled: true, 
          baseUrl: 'https://api.test.com',
        },
      ],
    };
    tempConfigPath = createTempConfig(config);

    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    } as Response);

    const manager = new IntegrationManager(tempConfigPath, mockLogger);
    await manager.initialize();

    const request: RouteRequest = {
      integration: 'test-api',
      endpoint: '/get',
      method: 'GET',
    };

    const response = await manager.route(request);
    expect(response.statusCode).toBe(200);
    expect(response.success).toBe(true);
  });

  it('should correctly route POST requests', async () => {
    const config = {
      integrations: [
        { 
          name: 'post-api', 
          type: 'api', 
          enabled: true, 
          baseUrl: 'https://api.test.com',
        },
      ],
    };
    tempConfigPath = createTempConfig(config);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    const manager = new IntegrationManager(tempConfigPath, mockLogger);
    await manager.initialize();

    const request: RouteRequest = {
      integration: 'post-api',
      endpoint: '/post',
      method: 'POST',
      body: { test: 'data' },
    };

    const response = await manager.route(request);
    expect(response.statusCode).toBe(200);
    expect(response.success).toBe(true);
  });

  it('should route MCP-type integrations to MCP server URL', async () => {
    const config = {
      integrations: [
        { 
          name: 'test-mcp', 
          type: 'mcp', 
          enabled: true, 
          mcpServerUrl: 'https://mcp.test.com',
        },
      ],
    };
    tempConfigPath = createTempConfig(config);

    // Mock MCP JSON-RPC response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        jsonrpc: '2.0',
        id: '1',
        result: { success: true },
      }),
    } as Response);

    const manager = new IntegrationManager(tempConfigPath, mockLogger);
    await manager.initialize();

    const request: RouteRequest = {
      integration: 'test-mcp',
      endpoint: '/read_file',
      method: 'POST',
      body: { path: '/test.txt' },
    };

    const response = await manager.route(request);
    expect(response.statusCode).toBe(200);
    expect(response.success).toBe(true);
  });

  it('should inject API key from environment variables', async () => {
    const originalEnv = process.env;
    
    const config = {
      integrations: [
        { 
          name: 'stripe-api', 
          type: 'api', 
          enabled: true, 
          baseUrl: 'https://api.stripe.com',
          apiKeyEnvVar: 'STRIPE_API_KEY',
        },
      ],
    };
    tempConfigPath = createTempConfig(config);

    // Set env var
    process.env.STRIPE_API_KEY = 'sk_test_123';
    
    let capturedHeaders: Record<string, string> = {};
    mockFetch.mockImplementationOnce(async (url: string, options: RequestInit) => {
      capturedHeaders = options.headers as Record<string, string>;
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as Response;
    });

    const manager = new IntegrationManager(tempConfigPath, mockLogger);
    await manager.initialize();

    await manager.route({
      integration: 'stripe-api',
      endpoint: '/customers',
    });

    expect(capturedHeaders['Authorization']).toBe('Bearer sk_test_123');
    
    // Restore env
    process.env = originalEnv;
  });

  describe('MCP Client', () => {
    it('should create MCP client for MCP-type integrations', async () => {
      const config = {
        integrations: [
          { 
            name: 'test-mcp', 
            type: 'mcp', 
            enabled: true, 
            mcpServerUrl: 'https://mcp.test.com',
            mcpTools: ['read_file', 'write_file'],
          },
        ],
      };
      tempConfigPath = createTempConfig(config);

      const manager = new IntegrationManager(tempConfigPath, mockLogger);
      await manager.initialize();

      const client = manager.createMCPClient('test-mcp');
      expect(client).toBeDefined();
      await expect(client?.listTools()).resolves.toEqual(['read_file', 'write_file']);
    });

    it('should return null for non-MCP integration when creating MCP client', async () => {
      const config = {
        integrations: [
          { 
            name: 'test-api', 
            type: 'api', 
            enabled: true, 
            baseUrl: 'https://api.test.com',
          },
        ],
      };
      tempConfigPath = createTempConfig(config);

      const manager = new IntegrationManager(tempConfigPath, mockLogger);
      await manager.initialize();

      const client = manager.createMCPClient('test-api');
      expect(client).toBeNull();
    });
  });
});