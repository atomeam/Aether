# MCP Dashboard Components

Frontend UI components for interacting with the Aether MCP server tools.

## Components

### MCPDashboard
Main dashboard component that provides:
- Server status monitoring
- Tool listing with category filtering
- Tool search functionality
- Tool execution interface
- Invocation history

### MCPServerStatus
Displays the connection status and health of the MCP server backend.

### MCPToolList
Displays a filtered list of available MCP tools with:
- Category badges
- Parameter counts
- HTTP method indicators
- Selection highlighting

### MCPToolExecutor
Handles parameter input and tool invocation with:
- Dynamic form generation based on tool parameters
- Type-specific input fields (string, number, boolean, object, array)
- Enum select dropdowns
- Result display with JSON formatting
- Copy to clipboard functionality

### MCPToolHistory
Shows recent tool invocations with:
- Success/error status indicators
- Timestamps
- Parameter preview
- Re-run functionality

## API Client

### mcpApi
Singleton instance of MCPApiClient that provides:
- `invokeTool(tool, parameters)` - Execute an MCP tool
- `checkConnection()` - Check backend connectivity
- `getServerStatus()` - Get detailed server status

## Usage

```tsx
import { MCPDashboard } from './components/mcp';

function App() {
  return <MCPDashboard />;
}
```

## Configuration

Set the backend URL in your environment:

```bash
VITE_AETHER_BACKEND_URL=http://localhost:3000
```

## MCP Tools

The dashboard supports all 33 MCP server tools across 9 categories:

- **System**: Stack health, agent status, telemetry, scheduler, notifier
- **Agents**: Council evaluation, reflection, learned patterns
- **Monitoring**: Metrics, health dashboard, vital signs
- **Workflows**: List and trigger workflows
- **Alerts**: Get and create alerts
- **Queues**: Human queue, triage queue
- **Learning**: Foresight predictions, journal, compaction, adversarial evaluation
- **Chaos**: Execute and list chaos scenarios
- **Journal**: Get and generate journal entries

## Type Safety

All types are shared with `@aether/contracts` to ensure consistency between the MCP server, backend, and frontend.
