/**
 * MCP API Client
 * Real API calls to Aether backend for MCP tools
 */

import { MCPTool, MCPToolResult } from './types';

const AETHER_BACKEND_URL = import.meta.env.VITE_AETHER_BACKEND_URL || '';

export class MCPApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = AETHER_BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Invoke an MCP tool by making a real API call to the backend
   */
  async invokeTool(tool: MCPTool, parameters: Record<string, any>): Promise<MCPToolResult> {
    const url = `${this.baseUrl}${tool.endpoint}`;
    const options: RequestInit = {
      method: tool.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add body for POST requests
    if (tool.method === 'POST' && Object.keys(parameters).length > 0) {
      options.body = JSON.stringify(parameters);
    }

    // Add query parameters for GET requests
    let finalUrl = url;
    if (tool.method === 'GET' && Object.keys(parameters).length > 0) {
      const params = new URLSearchParams();
      Object.entries(parameters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      finalUrl = `${url}?${params.toString()}`;
    }

    try {
      const response = await fetch(finalUrl, options);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check if the MCP server (backend) is accessible
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stack`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get server status information
   */
  async getServerStatus() {
    try {
      const [stackResponse, agentsResponse] = await Promise.all([
        fetch(`${this.baseUrl}/api/stack`),
        fetch(`${this.baseUrl}/api/agents`),
      ]);

      const stackData = stackResponse.ok ? await stackResponse.json() : null;
      const agentsData = agentsResponse.ok ? await agentsResponse.json() : null;

      return {
        connected: true,
        stack: stackData,
        agents: agentsData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export const mcpApi = new MCPApiClient();
