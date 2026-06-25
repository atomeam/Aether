/**
 * @aether/websocket - WebSocket Support
 * 
 * Provides WebSocket support for Express applications.
 * Real-time bidirectional communication.
 */

export interface WebSocketConfig {
  path?: string;
  cors?: boolean;
}

export function websocket(config: WebSocketConfig = {}) {
  const { path = '/ws', cors = true } = config;
  return { path, cors };
}