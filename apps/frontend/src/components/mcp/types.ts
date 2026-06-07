/**
 * MCP Tool Types
 * Type definitions for Aether MCP server tools
 */

export interface MCPTool {
  name: string;
  description: string;
  category: MCPToolCategory;
  method: 'GET' | 'POST';
  parameters: MCPParameter[];
  endpoint: string;
}

export type MCPToolCategory =
  | 'system'
  | 'agents'
  | 'monitoring'
  | 'workflows'
  | 'alerts'
  | 'queues'
  | 'learning'
  | 'chaos'
  | 'journal';

export interface MCPParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  enum?: string[];
}

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface MCPToolInvocation {
  toolName: string;
  parameters: Record<string, any>;
  result?: MCPToolResult;
  status: 'idle' | 'loading' | 'success' | 'error';
  timestamp: string;
}

export interface MCPServerStatus {
  connected: boolean;
  lastUpdate: string;
  toolCount: number;
  version: string;
}

// Tool definitions matching the MCP server
export const MCP_TOOLS: MCPTool[] = [
  // System tools
  {
    name: 'get_stack_health',
    description: 'Get Aether stack health status and system information',
    category: 'system',
    method: 'GET',
    parameters: [],
    endpoint: '/api/stack'
  },
  {
    name: 'get_agent_status',
    description: 'Get status of Aether agent system (curator, executor, evaluator)',
    category: 'agents',
    method: 'GET',
    parameters: [],
    endpoint: '/api/agents'
  },
  {
    name: 'get_metrics',
    description: 'Get Aether system metrics snapshot',
    category: 'monitoring',
    method: 'GET',
    parameters: [],
    endpoint: '/api/metrics'
  },
  {
    name: 'get_health_dashboard',
    description: 'Get unified health dashboard with all system metrics',
    category: 'monitoring',
    method: 'GET',
    parameters: [],
    endpoint: '/api/health'
  },
  {
    name: 'get_vital_signs',
    description: 'Get Aether system vital signs and throttle recommendations',
    category: 'monitoring',
    method: 'GET',
    parameters: [],
    endpoint: '/api/vitals'
  },
  {
    name: 'get_telemetry',
    description: 'Get Aether system telemetry data',
    category: 'monitoring',
    method: 'GET',
    parameters: [
      {
        name: 'format',
        type: 'string',
        required: false,
        description: 'Export format',
        enum: ['json', 'prometheus', 'csv']
      }
    ],
    endpoint: '/api/telemetry'
  },
  // Alert tools
  {
    name: 'get_alerts',
    description: 'Get active alerts from the Aether alert engine',
    category: 'alerts',
    method: 'GET',
    parameters: [],
    endpoint: '/api/alerts'
  },
  {
    name: 'create_alert',
    description: 'Create a new alert in the Aether alert engine',
    category: 'alerts',
    method: 'POST',
    parameters: [
      {
        name: 'severity',
        type: 'string',
        required: true,
        description: 'Alert severity',
        enum: ['low', 'medium', 'high', 'critical']
      },
      {
        name: 'message',
        type: 'string',
        required: true,
        description: 'Alert message'
      },
      {
        name: 'source',
        type: 'string',
        required: true,
        description: 'Alert source/subsystem'
      }
    ],
    endpoint: '/api/alerts'
  },
  // Workflow tools
  {
    name: 'get_workflows',
    description: 'List available Aether workflows',
    category: 'workflows',
    method: 'GET',
    parameters: [],
    endpoint: '/api/workflows'
  },
  {
    name: 'trigger_workflow',
    description: 'Trigger an Aether workflow execution',
    category: 'workflows',
    method: 'POST',
    parameters: [
      {
        name: 'workflowId',
        type: 'string',
        required: true,
        description: 'Workflow ID to trigger'
      },
      {
        name: 'params',
        type: 'object',
        required: false,
        description: 'Workflow parameters'
      }
    ],
    endpoint: '/api/workflows/trigger'
  },
  // Scheduler and notifier
  {
    name: 'get_dream_status',
    description: 'Get Aether dream state status and analysis',
    category: 'system',
    method: 'GET',
    parameters: [],
    endpoint: '/api/dream'
  },
  {
    name: 'get_scheduler_status',
    description: 'Get Aether scheduler status and pending tasks',
    category: 'system',
    method: 'GET',
    parameters: [],
    endpoint: '/api/scheduler'
  },
  {
    name: 'get_notifier_channels',
    description: 'Get Aether notifier channel status',
    category: 'system',
    method: 'GET',
    parameters: [],
    endpoint: '/api/notifier'
  },
  {
    name: 'send_notification',
    description: 'Send a notification through Aether notifier',
    category: 'system',
    method: 'POST',
    parameters: [
      {
        name: 'channel',
        type: 'string',
        required: true,
        description: 'Notification channel'
      },
      {
        name: 'message',
        type: 'string',
        required: true,
        description: 'Notification message'
      },
      {
        name: 'priority',
        type: 'string',
        required: false,
        description: 'Notification priority'
      }
    ],
    endpoint: '/api/notifier'
  },
  // Queue tools
  {
    name: 'get_human_queue',
    description: 'Get pending items in Aether human intervention queue',
    category: 'queues',
    method: 'GET',
    parameters: [],
    endpoint: '/api/human-queue'
  },
  {
    name: 'add_to_human_queue',
    description: 'Add an item to the Aether human intervention queue',
    category: 'queues',
    method: 'POST',
    parameters: [
      {
        name: 'type',
        type: 'string',
        required: true,
        description: 'Queue item type'
      },
      {
        name: 'description',
        type: 'string',
        required: true,
        description: 'Item description'
      },
      {
        name: 'priority',
        type: 'string',
        required: false,
        description: 'Item priority'
      }
    ],
    endpoint: '/api/human-queue'
  },
  {
    name: 'get_triage_queue',
    description: 'Get pending items in Aether triage queue',
    category: 'queues',
    method: 'GET',
    parameters: [],
    endpoint: '/api/triage'
  },
  {
    name: 'add_to_triage',
    description: 'Add an item to the Aether triage queue',
    category: 'queues',
    method: 'POST',
    parameters: [
      {
        name: 'severity',
        type: 'string',
        required: true,
        description: 'Triage severity'
      },
      {
        name: 'description',
        type: 'string',
        required: true,
        description: 'Item description'
      },
      {
        name: 'source',
        type: 'string',
        required: true,
        description: 'Item source'
      }
    ],
    endpoint: '/api/triage'
  },
  // Foresight and journal
  {
    name: 'get_foresight_predictions',
    description: 'Get pending foresight predictions and scores',
    category: 'learning',
    method: 'GET',
    parameters: [],
    endpoint: '/api/foresight'
  },
  {
    name: 'get_journal',
    description: 'Get Aether storyteller journal entries',
    category: 'journal',
    method: 'GET',
    parameters: [
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Number of entries to retrieve'
      }
    ],
    endpoint: '/api/journal'
  },
  {
    name: 'generate_auto_journal',
    description: 'Generate an automatic journal entry based on recent events',
    category: 'journal',
    method: 'POST',
    parameters: [
      {
        name: 'focus',
        type: 'string',
        required: false,
        description: 'Journal focus area'
      }
    ],
    endpoint: '/api/journal'
  },
  // System configuration
  {
    name: 'get_rate_limits',
    description: 'Get Aether rate limit status and configuration',
    category: 'system',
    method: 'GET',
    parameters: [],
    endpoint: '/api/rate-limits'
  },
  {
    name: 'get_secrets_list',
    description: 'Get list of Aether secret keys (names only, not values)',
    category: 'system',
    method: 'GET',
    parameters: [],
    endpoint: '/api/secrets'
  },
  {
    name: 'get_profile',
    description: 'Get Aether system profile (read-only external access)',
    category: 'system',
    method: 'GET',
    parameters: [],
    endpoint: '/api/profile'
  },
  // Agent learning
  {
    name: 'council_evaluate',
    description: 'Evaluate a proposal using the Council of Evaluators',
    category: 'agents',
    method: 'POST',
    parameters: [
      {
        name: 'proposal',
        type: 'string',
        required: true,
        description: 'Proposal to evaluate'
      },
      {
        name: 'context',
        type: 'string',
        required: false,
        description: 'Additional context'
      }
    ],
    endpoint: '/api/council/evaluate'
  },
  {
    name: 'agent_reflect',
    description: 'Write a lesson to the agent reflection system',
    category: 'agents',
    method: 'POST',
    parameters: [
      {
        name: 'lesson',
        type: 'string',
        required: true,
        description: 'Lesson learned'
      },
      {
        name: 'context',
        type: 'string',
        required: false,
        description: 'Context of the lesson'
      }
    ],
    endpoint: '/api/agents/reflect'
  },
  {
    name: 'get_learned_patterns',
    description: 'Get patterns learned by the agent reflection system',
    category: 'agents',
    method: 'GET',
    parameters: [],
    endpoint: '/api/agents/reflect'
  },
  // Chaos engineering
  {
    name: 'execute_chaos',
    description: 'Execute a chaos engineering scenario',
    category: 'chaos',
    method: 'POST',
    parameters: [
      {
        name: 'scenario',
        type: 'string',
        required: true,
        description: 'Chaos scenario to execute'
      },
      {
        name: 'intensity',
        type: 'string',
        required: false,
        description: 'Chaos intensity',
        enum: ['low', 'medium', 'high']
      }
    ],
    endpoint: '/api/agents/chaos'
  },
  {
    name: 'get_chaos_scenarios',
    description: 'Get available chaos engineering scenarios',
    category: 'chaos',
    method: 'GET',
    parameters: [],
    endpoint: '/api/agents/chaos'
  },
  {
    name: 'compact_lessons',
    description: 'Compact and optimize learned lessons',
    category: 'learning',
    method: 'POST',
    parameters: [
      {
        name: 'threshold',
        type: 'number',
        required: false,
        description: 'Similarity threshold for compaction'
      }
    ],
    endpoint: '/api/compactor'
  },
  {
    name: 'evaluate_adversarial',
    description: 'Evaluate a proposal for adversarial patterns',
    category: 'learning',
    method: 'POST',
    parameters: [
      {
        name: 'proposal',
        type: 'string',
        required: true,
        description: 'Proposal to evaluate'
      },
      {
        name: 'context',
        type: 'string',
        required: false,
        description: 'Additional context'
      }
    ],
    endpoint: '/api/adversarial'
  },
  {
    name: 'replay_events',
    description: 'Replay historical events for analysis',
    category: 'learning',
    method: 'POST',
    parameters: [
      {
        name: 'events',
        type: 'array',
        required: true,
        description: 'Events to replay'
      },
      {
        name: 'dryRun',
        type: 'boolean',
        required: false,
        description: 'Dry run without execution'
      }
    ],
    endpoint: '/api/replay'
  }
];
