# @aether/mcp-tools

MCP Tool Registry for AtoMind agent system.

## Tools

| Tool | Description |
|------|-------------|
| `file_read` | Read file contents (workspace-restricted) |
| `file_write` | Write file contents (workspace-restricted) |
| `git_status` | Check git repository status |
| `git_commit` | Create git commits |
| `git_diff` | Show uncommitted changes |
| `http_request` | Make HTTP requests (GET/HEAD only) |
| `lessons_write` | Write lessons to Lessons DB |
| `get_agent_state` | Retrieve execution counts and failure rates |
| `trigger_workflow` | Trigger predefined workflows |
| `chaos_inject` | Inject synthetic failure patterns |

## Usage

```typescript
import { invokeTool, registerTool } from '@aether/mcp-tools';

// Invoke a tool
const result = await invokeTool('file_read', { path: '/path/to/file' });

// Register a new tool
registerTool({
  name: 'my_tool',
  description: 'My custom tool',
  schema: myZodSchema,
  handler: async (params) => ({ success: true, data: result }),
});