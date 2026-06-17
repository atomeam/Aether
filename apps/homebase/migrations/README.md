# Migrations Folder

This folder contains **wrapper functions** that call existing automation projects without modifying them.

## Wrapper Strategy

Instead of editing existing projects, we create lightweight wrappers that:

1. **Call existing scripts/commands** via child_process
2. **Capture output and errors** for centralized logging
3. **Provide standardized interface** to the orchestrator
4. **Preserve original functionality** completely

## Available Wrappers

### aether_backend_wrapper.ts
- **Purpose**: Wraps the Aether backend npm scripts
- **Original**: `../Aether/`
- **Command**: `npm run dev:backend`
- **Usage**: Execute Aether backend via orchestrator

### homebase_wrapper.ts
- **Purpose**: Wraps HomeBase health checks
- **Original**: `../HomeBase/`
- **Method**: HTTP health check
- **Usage**: Monitor HomeBase status via orchestrator

### devour_wad_wrapper.ts
- **Purpose**: Wraps the DOOM WAD Python processor
- **Original**: `../devour_wad.py`
- **Command**: `python devour_wad.py <wad_file> [source_url] [output_file]`
- **Usage**: Process WAD files via orchestrator

## Adding New Wrappers

To create a wrapper for an existing project:

1. **Create new wrapper file**: `migrations/my_project_wrapper.ts`
2. **Implement handler function**:
   ```typescript
   import { JobContext, JobResult } from '../backbone/shared/types/job';

   export async function handler(context: JobContext): Promise<JobResult> {
     const { input, config, logger, runId } = context;
     
     try {
       // Call your existing project here
       // Use child_process.spawn for CLI commands
       // Use fetch/axios for HTTP requests
       
       return {
         runId,
         status: 'completed',
         startTime: new Date(),
         endTime: new Date(),
         duration: 1000,
         output: { success: true, data: '...' }
       };
     } catch (error) {
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

3. **Add to backbone config**: Update `backbone/config/config.yaml`
4. **Test manually**: Use orchestrator API to test wrapper

## Migration Process

### Phase 1: Wrap (Current)
- Create wrappers for existing projects
- Test each wrapper independently
- Verify output matches original behavior

### Phase 2: Schedule
- Add wrapped workflows to scheduler
- Monitor execution and logs
- Verify reliability

### Phase 3: Cutover
- Update shortcuts/scripts to point to orchestrator
- Monitor for issues
- Roll back if needed

### Phase 4: Archive
- Move original projects to `_archive/`
- Keep for reference/rollback
- Delete only after confirmed stable

## Safety Notes

- **No modifications** to original projects
- **Read-only access** to existing code
- **Gradual cutover** with rollback capability
- **Archive before delete** policy

## Testing Wrappers

Test a wrapper via the orchestrator API:

```bash
curl -X POST http://localhost:3000/workflows/my_workflow/execute \
  -H "Content-Type: application/json" \
  -d '{"wadFile": "test.wad", "sourceUrl": "http://example.com"}'
```

## Monitoring

Check wrapper execution in:
- **Orchestrator logs**: `backbone/logs/orchestrator.log`
- **Run history**: `runs/runs.jsonl`
- **API status**: `GET /workflows/:workflowId/status`
