# Automation Consolidation v2

**Consolidated automation backbone with orchestrator for managing workflows across multiple projects.**

## Overview

This is a centralized automation system that consolidates your existing automation stack (Aether, ALPHA, HomeBase, etc.) into a single Node.js/TypeScript orchestrator with standardized configuration, logging, and scheduling.

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Windows PowerShell (for setup scripts)

### Installation

1. **Clone or navigate to the directory**:
   ```bash
   cd automation_consolidation_v2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp config/.env.example config/.env
   # Edit config/.env with your values
   ```

4. **Start the orchestrator**:
   ```bash
   npm run dev
   ```

The orchestrator will start on port 3333 (configurable via `config.yaml`).

## Project Structure

```
automation_consolidation_v2/
├── orchestrator/              # Central orchestrator
│   ├── src/
│   │   ├── index.ts          # Main entry point
│   │   ├── scheduler.ts      # Job scheduler
│   │   └── workflow.ts       # Workflow engine
│   └── dist/                 # Compiled JavaScript
├── workflows/                # Individual workflow definitions
│   └── homebase_health_check/
│       └── handler.ts        # Workflow handler
├── shared/                  # Shared utilities
│   ├── config/              # Configuration management
│   ├── logger/              # Unified logging
│   ├── errors/              # Error handling
│   └── types/               # TypeScript types
├── runs/                    # Run history (auto-created)
├── config/                  # Configuration files
│   ├── .env.example         # Environment variables template
│   └── config.yaml          # Workflow configuration
├── tests/                   # Tests
│   └── sample_inputs/       # Test input data
├── scripts/                 # Utility scripts
├── docs/                    # Documentation
└── README.md                # This file
```

## Configuration

### Environment Variables (.env)

Copy `config/.env.example` to `config/.env` and configure:

```bash
# Orchestrator
ORCHESTRATOR_PORT=3333
ORCHESTRATOR_LOG_LEVEL=info
ORCHESTRATOR_RUNS_DIR=./runs

# Scheduler
SCHEDULER_ENABLED=true
SCHEDULER_TIMEZONE=America/New_York

# AI Services
OLLAMA_BASE_URL=http://localhost:11434
LM_STUDIO_BASE_URL=http://localhost:1234
GEMINI_API_KEY=your_key_here
```

### Workflow Configuration (config.yaml)

Edit `config/config.yaml` to enable/disable workflows and set schedules:

```yaml
workflows:
  homebase_health_check:
    enabled: true
    schedule: "*/15 * * * *"  # Every 15 minutes
    timeout: 60000
    retries: 1
```

## Usage

### Starting the Orchestrator

**Development mode** (with hot reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

### API Endpoints

#### Health Check
```bash
GET http://localhost:3333/health
```

#### Execute Workflow Manually
```bash
POST http://localhost:3333/workflows/homebase_health_check/execute
Content-Type: application/json

{}
```

#### Get Workflow Status
```bash
GET http://localhost:3333/workflows/homebase_health_check/status
```

#### Get Run History
```bash
GET http://localhost:3333/runs?limit=50
```

#### Get Scheduled Workflows
```bash
GET http://localhost:3333/scheduler/workflows
```

### Creating New Workflows

1. **Create workflow directory**:
   ```bash
   mkdir workflows/my_workflow
   ```

2. **Create handler.ts**:
   ```typescript
   import { JobContext, JobResult } from '../../../shared/types/job';

   export async function handler(context: JobContext): Promise<JobResult> {
     const { input, config, logger, runId } = context;
     
     try {
       logger.info('Workflow started');
       
       // Your workflow logic here
       const result = { success: true, data: '...' };
       
       return {
         runId,
         status: 'completed',
         startTime: new Date(),
         endTime: new Date(),
         duration: 1000,
         output: result
       };
     } catch (error) {
       logger.error('Workflow failed', { error });
       
       return {
         runId,
         status: 'failed',
         startTime: new Date(),
         endTime: new Date(),
         error: error as Error
       };
     }
   }
   ```

3. **Add to config.yaml**:
   ```yaml
   workflows:
     my_workflow:
       enabled: true
       schedule: "0 * * * *"  # Every hour
       timeout: 60000
       retries: 2
       description: "My custom workflow"
   ```

4. **Restart orchestrator** to pick up new workflow.

## Logging

Logs are written to:
- **Console**: Colored output for development
- **File**: `logs/orchestrator.log` (JSON format)

Run history is tracked in:
- **runs/runs.jsonl**: JSONL format with all workflow executions

## Error Handling

The orchestrator includes automatic retry logic for transient errors:
- **Retryable errors**: Network timeouts, rate limits (429), service unavailable (503)
- **Permanent errors**: Authentication failures (401), permission errors (403), invalid input (400)
- **Configuration errors**: Missing environment variables, invalid configuration

Default retry configuration:
- Max retries: 3
- Initial delay: 1 second
- Max delay: 30 seconds
- Backoff multiplier: 2

## Monitoring

### Health Checks

The orchestrator provides a health check endpoint:
```bash
curl http://localhost:3333/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-26T17:32:00.000Z",
  "uptime": 123.456
}
```

### Workflow Status

Check the status of any workflow:
```bash
curl http://localhost:3333/workflows/homebase_health_check/status
```

Response:
```json
{
  "enabled": true,
  "lastRun": {
    "timestamp": "2026-05-26T17:30:00.000Z",
    "workflow": "homebase_health_check",
    "status": "completed",
    "duration_ms": 1234
  },
  "successRate": 95.5
}
```

## Testing

### Manual Testing

Test a workflow manually via API:
```bash
curl -X POST http://localhost:3333/workflows/homebase_health_check/execute \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Sample Inputs

Place test input files in `tests/sample_inputs/`:
```bash
tests/sample_inputs/
├── homebase_health_check.json
└── other_workflow.json
```

## Troubleshooting

### Workflow Not Executing

1. Check if workflow is enabled in `config.yaml`
2. Verify schedule syntax (cron expression)
3. Check logs for errors: `tail -f logs/orchestrator.log`
4. Verify handler.ts exists and has no syntax errors

### Permission Errors

1. Ensure `runs/` directory is writable
2. Check file permissions on `logs/` directory
3. Verify environment variables are set correctly

### Port Already in Use

Change the port in `backbone/config/config.yaml`:
```yaml
orchestrator:
  port: 3334  # Change from 3333
```

## Development

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Running Tests

```bash
npm test
```

## Migration from Existing Projects

### Migrating Aether Backend

1. Wrap existing Aether backend in a workflow handler
2. Add workflow configuration to `config.yaml`
3. Test manually before scheduling
4. Gradually switch from manual to scheduled execution

### Migrating PowerShell Scripts

1. Create workflow handler that calls PowerShell script
2. Use Node.js `child_process.spawn` to execute script
3. Capture stdout/stderr for logging
4. Add error handling and retry logic

### Migrating Python Scripts

1. Create workflow handler that calls Python script
2. Use Node.js `child_process.spawn` to execute script
3. Capture stdout/stderr for logging
4. Add input validation and error handling

## Next Steps

1. **Add more workflows**: Migrate your existing automation scripts
2. **Set up monitoring**: Configure Sentry or other monitoring
3. **Add scheduling**: Use Windows Task Scheduler for reliability
4. **Create dashboard**: Build web UI for monitoring workflows
5. **Implement secret management**: Use HashiCorp Vault or similar

## Support

For issues or questions:
1. Check logs in `logs/orchestrator.log`
2. Review run history in `runs/runs.jsonl`
3. Verify configuration in `config/config.yaml`
4. Check environment variables in `config/.env`

## License

MIT

---

**Generated**: 2026-05-26  
**Version**: 1.0.0
