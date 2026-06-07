import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Aether Backend API Base URL
const AETHER_BACKEND_URL = process.env.AETHER_BACKEND_URL || "http://localhost:3000";

// Create server instance
const server = new McpServer({
  name: "aether",
  version: "1.0.0",
});

// Helper function for making Aether API requests
async function makeAetherRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  const url = `${AETHER_BACKEND_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`Error making Aether request to ${endpoint}:`, error);
    return null;
  }
}

// Tool: Get Stack Health
server.registerTool(
  "get_stack_health",
  {
    description: "Get Aether stack health status and system information",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<{ status: string; services: any }>("/api/stack");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve stack health information",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Agent Status
server.registerTool(
  "get_agent_status",
  {
    description: "Get status of Aether agent system (curator, executor, evaluator)",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<{ curator: string; executor: string; evaluator: string }>("/api/agents");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve agent status",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Metrics
server.registerTool(
  "get_metrics",
  {
    description: "Get Aether system metrics snapshot",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/metrics");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve metrics",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Alerts
server.registerTool(
  "get_alerts",
  {
    description: "Get active alerts from the Aether alert engine",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/alerts");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve alerts",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Create Alert
server.registerTool(
  "create_alert",
  {
    description: "Create a new alert in the Aether alert engine",
    inputSchema: z.object({
      severity: z.string().describe("Alert severity (low, medium, high, critical)"),
      message: z.string().describe("Alert message"),
      source: z.string().describe("Alert source/subsystem"),
    }).shape,
  },
  async ({ severity, message, source }) => {
    const data = await makeAetherRequest<any>("/api/alerts", {
      method: "POST",
      body: JSON.stringify({ severity, message, source }),
    });
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to create alert",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Workflows
server.registerTool(
  "get_workflows",
  {
    description: "List available Aether workflows",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/workflows");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve workflows",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Trigger Workflow
server.registerTool(
  "trigger_workflow",
  {
    description: "Trigger an Aether workflow execution",
    inputSchema: z.object({
      workflowId: z.string().describe("Workflow ID to trigger"),
      params: z.record(z.any()).optional().describe("Workflow parameters"),
    }).shape,
  },
  async ({ workflowId, params }) => {
    const data = await makeAetherRequest<any>("/api/workflows/trigger", {
      method: "POST",
      body: JSON.stringify({ workflowId, params }),
    });
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to trigger workflow",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Health Dashboard
server.registerTool(
  "get_health_dashboard",
  {
    description: "Get unified health dashboard with all system metrics",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/health");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve health dashboard",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Vital Signs
server.registerTool(
  "get_vital_signs",
  {
    description: "Get Aether system vital signs and throttle recommendations",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/vitals");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve vital signs",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Telemetry
server.registerTool(
  "get_telemetry",
  {
    description: "Get Aether system telemetry data",
    inputSchema: z.object({
      format: z.enum(["json", "prometheus", "csv"]).optional().describe("Export format"),
    }).shape,
  },
  async ({ format = "json" }) => {
    const data = await makeAetherRequest<any>(`/api/telemetry?format=${format}`);
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve telemetry",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Dream Status
server.registerTool(
  "get_dream_status",
  {
    description: "Get Aether dream state status and analysis",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/dream");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve dream status",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Scheduler Status
server.registerTool(
  "get_scheduler_status",
  {
    description: "Get Aether scheduler status and pending tasks",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/scheduler");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve scheduler status",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Notifier Channels
server.registerTool(
  "get_notifier_channels",
  {
    description: "Get Aether notifier channel status",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/notifier");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve notifier channels",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Send Notification
server.registerTool(
  "send_notification",
  {
    description: "Send a notification through Aether notifier",
    inputSchema: z.object({
      channel: z.string().describe("Notification channel"),
      message: z.string().describe("Notification message"),
      priority: z.string().optional().describe("Notification priority"),
    }).shape,
  },
  async ({ channel, message, priority }) => {
    const data = await makeAetherRequest<any>("/api/notifier", {
      method: "POST",
      body: JSON.stringify({ channel, message, priority }),
    });
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to send notification",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Human Queue
server.registerTool(
  "get_human_queue",
  {
    description: "Get pending items in Aether human intervention queue",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/human-queue");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve human queue",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Add to Human Queue
server.registerTool(
  "add_to_human_queue",
  {
    description: "Add an item to the Aether human intervention queue",
    inputSchema: z.object({
      type: z.string().describe("Queue item type"),
      description: z.string().describe("Item description"),
      priority: z.string().optional().describe("Item priority"),
    }).shape,
  },
  async ({ type, description, priority }) => {
    const data = await makeAetherRequest<any>("/api/human-queue", {
      method: "POST",
      body: JSON.stringify({ type, description, priority }),
    });
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to add to human queue",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Triage Queue
server.registerTool(
  "get_triage_queue",
  {
    description: "Get pending items in Aether triage queue",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/triage");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve triage queue",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Add to Triage
server.registerTool(
  "add_to_triage",
  {
    description: "Add an item to the Aether triage queue",
    inputSchema: z.object({
      severity: z.string().describe("Triage severity"),
      description: z.string().describe("Item description"),
      source: z.string().describe("Item source"),
    }).shape,
  },
  async ({ severity, description, source }) => {
    const data = await makeAetherRequest<any>("/api/triage", {
      method: "POST",
      body: JSON.stringify({ severity, description, source }),
    });
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to add to triage",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Foresight Predictions
server.registerTool(
  "get_foresight_predictions",
  {
    description: "Get pending foresight predictions and scores",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/foresight");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve foresight predictions",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Journal
server.registerTool(
  "get_journal",
  {
    description: "Get Aether storyteller journal entries",
    inputSchema: z.object({
      limit: z.number().optional().describe("Number of entries to retrieve"),
    }).shape,
  },
  async ({ limit = 10 }) => {
    const data = await makeAetherRequest<any>(`/api/journal?limit=${limit}`);
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve journal",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Generate Auto Journal
server.registerTool(
  "generate_auto_journal",
  {
    description: "Generate an automatic journal entry based on recent events",
    inputSchema: z.object({
      focus: z.string().optional().describe("Journal focus area"),
    }).shape,
  },
  async ({ focus }) => {
    const data = await makeAetherRequest<any>("/api/journal", {
      method: "POST",
      body: JSON.stringify({ focus }),
    });
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to generate auto journal",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Rate Limits
server.registerTool(
  "get_rate_limits",
  {
    description: "Get Aether rate limit status and configuration",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/rate-limits");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve rate limits",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Secrets List
server.registerTool(
  "get_secrets_list",
  {
    description: "Get list of Aether secret keys (names only, not values)",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/secrets");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve secrets list",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Profile
server.registerTool(
  "get_profile",
  {
    description: "Get Aether system profile (read-only external access)",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/profile");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve profile",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Council Evaluate
server.registerTool(
  "council_evaluate",
  {
    description: "Evaluate a proposal using the Council of Evaluators",
    inputSchema: z.object({
      proposal: z.string().describe("Proposal to evaluate"),
      context: z.string().optional().describe("Additional context"),
    }).shape,
  },
  async ({ proposal, context }) => {
    const data = await makeAetherRequest<any>("/api/council/evaluate", {
      method: "POST",
      body: JSON.stringify({ proposal, context }),
    });
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to evaluate with council",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Agent Reflect
server.registerTool(
  "agent_reflect",
  {
    description: "Write a lesson to the agent reflection system",
    inputSchema: z.object({
      lesson: z.string().describe("Lesson learned"),
      context: z.string().optional().describe("Context of the lesson"),
    }).shape,
  },
  async ({ lesson, context }) => {
    const data = await makeAetherRequest<any>("/api/agents/reflect", {
      method: "POST",
      body: JSON.stringify({ lesson, context }),
    });
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to write reflection",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Learned Patterns
server.registerTool(
  "get_learned_patterns",
  {
    description: "Get patterns learned by the agent reflection system",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/agents/reflect");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve learned patterns",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Execute Chaos
server.registerTool(
  "execute_chaos",
  {
    description: "Execute a chaos engineering scenario",
    inputSchema: z.object({
      scenario: z.string().describe("Chaos scenario to execute"),
      intensity: z.string().optional().describe("Chaos intensity (low, medium, high)"),
    }).shape,
  },
  async ({ scenario, intensity }) => {
    const data = await makeAetherRequest<any>("/api/agents/chaos", {
      method: "POST",
      body: JSON.stringify({ scenario, intensity }),
    });
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to execute chaos scenario",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Chaos Scenarios
server.registerTool(
  "get_chaos_scenarios",
  {
    description: "Get available chaos engineering scenarios",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const data = await makeAetherRequest<any>("/api/agents/chaos");
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve chaos scenarios",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Compact Lessons
server.registerTool(
  "compact_lessons",
  {
    description: "Compact and optimize learned lessons",
    inputSchema: z.object({
      threshold: z.number().optional().describe("Similarity threshold for compaction"),
    }).shape,
  },
  async ({ threshold }) => {
    const data = await makeAetherRequest<any>("/api/compactor", {
      method: "POST",
      body: JSON.stringify({ threshold }),
    });
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to compact lessons",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Evaluate Adversarial
server.registerTool(
  "evaluate_adversarial",
  {
    description: "Evaluate a proposal for adversarial patterns",
    inputSchema: z.object({
      proposal: z.string().describe("Proposal to evaluate"),
      context: z.string().optional().describe("Additional context"),
    }).shape,
  },
  async ({ proposal, context }) => {
    const data = await makeAetherRequest<any>("/api/adversarial", {
      method: "POST",
      body: JSON.stringify({ proposal, context }),
    });
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to evaluate adversarial patterns",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool: Replay Events
server.registerTool(
  "replay_events",
  {
    description: "Replay historical events for analysis",
    inputSchema: z.object({
      events: z.array(z.any()).describe("Events to replay"),
      dryRun: z.boolean().optional().describe("Dry run without execution"),
    }).shape,
  },
  async ({ events, dryRun }) => {
    const data = await makeAetherRequest<any>("/api/replay", {
      method: "POST",
      body: JSON.stringify({ events, dryRun }),
    });
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to replay events",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Main function to run the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Aether MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});