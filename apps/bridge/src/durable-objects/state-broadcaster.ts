/**
 * StateBroadcaster Durable Object
 * 
 * Multi-Crew Controller: Manages WebSocket connections and broadcasts state changes
 * to connected clients for the React Control Tower real-time dashboard.
 * Supports dynamic multi-room routing with persistence to crew_events D1 table.
 */

import { DurableObject } from 'cloudflare:workers';

export interface Env {
  STATE_BROADCASTER: DurableObjectNamespace;
  RELIABILITY_TRACING: D1Database;
}

// Unified Telemetry Schema
export interface CrewTelemetry {
  agentId: string;
  crew: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  action: 'detect' | 'remediate' | 'broadcast' | 'command';
  payload: any;
}

export interface Session {
  websocket: WebSocket;
  id: string;
  roomId: string;
  agentId?: string;
  crew?: string;
}

export class StateBroadcaster extends DurableObject {
  // Track active WebSocket connections
  sessions: Map<string, Session> = new Map();
  
  // Track registered crews (agentId -> crew mapping)
  crewRegistry: Map<string, { crew: string; status: string; lastHeartbeat: string }> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    // Load crew registry from storage on initialization
    this.loadCrewRegistry();
  }

  /**
   * Load crew registry from Durable Object storage
   */
  private async loadCrewRegistry(): Promise<void> {
    try {
      const stored = await this.state.storage.get<CrewRegistry>('crewRegistry');
      if (stored) {
        this.crewRegistry = new Map(Object.entries(stored));
        console.log('[StateBroadcaster] Loaded crew registry:', this.crewRegistry.size, 'crews');
      }
    } catch (error) {
      console.error('[StateBroadcaster] Failed to load crew registry:', error);
    }
  }

  /**
   * Save crew registry to Durable Object storage
   */
  private async saveCrewRegistry(): Promise<void> {
    try {
      const registry = Object.fromEntries(this.crewRegistry);
      await this.state.storage.put('crewRegistry', registry);
    } catch (error) {
      console.error('[StateBroadcaster] Failed to save crew registry:', error);
    }
  }

  /**
   * Handle incoming fetch requests (WebSocket upgrades)
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const roomId = url.searchParams.get('room') || 'default-room';
    const agentId = url.searchParams.get('agentId') || undefined;
    const crew = url.searchParams.get('crew') || undefined;

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocketUpgrade(request, roomId, agentId, crew);
    }

    // Handle HTTP requests
    return new Response('StateBroadcaster Durable Object', { status: 200 });
  }

  /**
   * Handle WebSocket connection upgrade
   */
  private async handleWebSocketUpgrade(request: Request, roomId: string, agentId?: string, crew?: string): Promise<Response> {
    const { 0: client, 1: server } = Object.values(new WebSocketPair());
    server.accept();

    const sessionId = crypto.randomUUID();
    const session: Session = {
      websocket: server,
      id: sessionId,
      roomId,
      agentId,
      crew
    };

    // Track the session
    this.sessions.set(sessionId, session);

    // Register crew if provided
    if (agentId && crew) {
      this.crewRegistry.set(agentId, {
        crew,
        status: 'running',
        lastHeartbeat: new Date().toISOString()
      });
      await this.saveCrewRegistry();
      console.log(`[StateBroadcaster] Registered crew: ${agentId} -> ${crew}`);
    }

    // Send welcome message
    server.send(JSON.stringify({
      type: 'connected',
      sessionId,
      roomId,
      agentId,
      crew,
      timestamp: new Date().toISOString()
    }));

    // Handle WebSocket events
    server.addEventListener('message', (event) => {
      this.handleMessage(session, event.data);
    });

    server.addEventListener('close', () => {
      this.sessions.delete(sessionId);
      console.log(`[StateBroadcaster] Session ${sessionId} disconnected from room ${roomId}`);
    });

    server.addEventListener('error', (error) => {
      console.error(`[StateBroadcaster] WebSocket error for session ${sessionId}:`, error);
      this.sessions.delete(sessionId);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(session: Session, data: string | ArrayBuffer): void {
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : null;
      
      if (message && message.type === 'ping') {
        session.websocket.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        
        // Update heartbeat for this agent
        if (session.agentId) {
          const crewInfo = this.crewRegistry.get(session.agentId);
          if (crewInfo) {
            crewInfo.lastHeartbeat = new Date().toISOString();
            this.crewRegistry.set(session.agentId, crewInfo);
            this.saveCrewRegistry();
          }
        }
      }
    } catch (error) {
      console.error(`[StateBroadcaster] Error handling message from session ${session.id}:`, error);
    }
  }

  /**
   * Broadcast payload to all connected sessions in a room with persistence
   */
  async broadcast(telemetry: CrewTelemetry, roomId?: string): Promise<void> {
    const message = JSON.stringify({
      ...telemetry,
      timestamp: new Date().toISOString()
    });

    // Persist to D1 crew_events table
    await this.persistEvent(telemetry);

    // Broadcast to WebSocket sessions
    for (const [sessionId, session] of this.sessions) {
      // Filter by room if specified
      if (roomId && session.roomId !== roomId) continue;

      try {
        session.websocket.send(message);
      } catch (error) {
        console.error(`[StateBroadcaster] Failed to send to session ${sessionId}:`, error);
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Persist event to crew_events D1 table
   */
  private async persistEvent(telemetry: CrewTelemetry): Promise<void> {
    try {
      if (!this.env.RELIABILITY_TRACING) {
        console.warn('[StateBroadcaster] RELIABILITY_TRACING not available for persistence');
        return;
      }

      await this.env.RELIABILITY_TRACING.prepare(
        'INSERT INTO crew_events (agent_id, crew, level, action, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        telemetry.agentId,
        telemetry.crew,
        telemetry.level,
        telemetry.action,
        JSON.stringify(telemetry.payload),
        telemetry.timestamp
      ).run();

      console.log(`[StateBroadcaster] Persisted event: ${telemetry.agentId} - ${telemetry.action}`);
    } catch (error) {
      console.error('[StateBroadcaster] Failed to persist event:', error);
    }
  }

  /**
   * Get connection count for a room
   */
  getConnectionCount(roomId?: string): number {
    if (!roomId) {
      return this.sessions.size;
    }

    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.roomId === roomId) count++;
    }
    return count;
  }

  /**
   * Get crew registry status
   */
  getCrewRegistry(): Map<string, { crew: string; status: string; lastHeartbeat: string }> {
    return this.crewRegistry;
  }

  /**
   * Update crew status
   */
  async updateCrewStatus(agentId: string, status: string): Promise<void> {
    const crewInfo = this.crewRegistry.get(agentId);
    if (crewInfo) {
      crewInfo.status = status;
      crewInfo.lastHeartbeat = new Date().toISOString();
      this.crewRegistry.set(agentId, crewInfo);
      await this.saveCrewRegistry();
      
      // Broadcast status change
      await this.broadcast({
        agentId,
        crew: crewInfo.crew,
        timestamp: new Date().toISOString(),
        level: 'info',
        action: 'command',
        payload: { status, type: 'status_update' }
      });
    }
  }
}

interface CrewRegistry {
  [agentId: string]: {
    crew: string;
    status: string;
    lastHeartbeat: string;
  };
}