/**
 * Base Crew Member Interface
 * All crew members must implement this interface
 */
export interface CrewMember {
  id: string;
  name: string;
  role: CrewRole;
  status: CrewStatus;
  capabilities: string[];
  priority: number; // 1-4, where 1 is highest priority
  execute: (task: CrewTask) => Promise<CrewTaskResult>;
  healthCheck: () => Promise<boolean>;
  
  // Visual Identity (Recraft integration)
  visuals?: {
    avatarUrl?: string;
    color: string;
    symbol: string;
    theme?: string;
  };
}

export enum CrewRole {
  INFRASTRUCTURE = 'infrastructure', // Cloudflare
  PLANNING = 'planning', // AI Studio
  EXECUTION = 'execution', // Task execution
  ANALYSIS = 'analysis' // Data analysis
}

export enum CrewStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  OFFLINE = 'offline'
}

export interface CrewTask {
  id: string;
  type: string;
  description: string;
  payload: any;
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string;
  dependencies?: string[];
  createdAt: Date;
  deadline?: Date;
}

export interface CrewTaskResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  crewMemberId: string;
  timestamp: Date;
}

export interface CrewCoordination {
  crewMembers: CrewMember[];
  activeTasks: Map<string, CrewTask>;
  taskQueue: CrewTask[];
  coordinationStrategy: CoordinationStrategy;
}

export enum CoordinationStrategy {
  PRIORITY_BASED = 'priority_based',
  ROUND_ROBIN = 'round_robin',
  CAPABILITY_MATCH = 'capability_match',
  LOAD_BALANCED = 'load_balanced'
}