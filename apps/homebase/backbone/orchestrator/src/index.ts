import express from 'express';
import { logger } from '../../shared/logger';
import { loadConfig } from '../../shared/config';
import { WorkflowEngine } from './workflow';
import { Scheduler } from './scheduler';
import * as path from 'path';
import * as fs from 'fs';

class Orchestrator {
  private app: express.Application;
  private workflowEngine: WorkflowEngine;
  private scheduler: Scheduler;
  private config: any;

  constructor() {
    this.config = loadConfig();
    this.app = express();
    this.workflowEngine = new WorkflowEngine();
    this.scheduler = new Scheduler(this.workflowEngine);
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      logger.info('HTTP request', { 
        method: req.method, 
        path: req.path 
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Serve static HTML UI at root
    this.app.get('/', (req, res) => {
      const htmlPath = path.join(__dirname, '../../../dashboard/index.html');
      if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
      } else {
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Automation Orchestrator</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
              .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
              .healthy { background: #d4edda; color: #155724; }
              .unhealthy { background: #f8d7da; color: #721c24; }
              .status-skipped { background: #fff3cd; color: #856404; }
              button { padding: 10px 20px; margin: 5px; cursor: pointer; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
              .error { background: #f8d7da; color: #721c24; padding: 10px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>🤖 Automation Orchestrator</h1>
            <div id="status" class="status">Loading...</div>
            <div>
              <button onclick="runWorkflow('homebase_wrapper')">Run HomeBase Wrapper</button>
              <button onclick="runWorkflow('aether_backend_wrapper')">Run Aether Wrapper</button>
              <button onclick="runWorkflow('project_health_check')">Run Project Health Check</button>
            </div>
            <h2>Recent Runs</h2>
            <div id="runs">Loading...</div>
            <div id="error" class="error" style="display:none;"></div>
            <script>
              const API_BASE = 'http://localhost:3333';
              
              async function loadStatus() {
                try {
                  const res = await fetch(API_BASE + '/health');
                  const data = await res.json();
                  const statusDiv = document.getElementById('status');
                  statusDiv.className = 'status ' + (data.status === 'healthy' ? 'healthy' : 'unhealthy');
                  statusDiv.textContent = 'Status: ' + data.status + ' (Uptime: ' + Math.floor(data.uptime) + 's)';
                } catch (error) {
                  document.getElementById('status').className = 'status unhealthy';
                  document.getElementById('status').textContent = 'Status: Error connecting to orchestrator';
                }
              }
              
              async function loadRuns() {
                try {
                  const res = await fetch(API_BASE + '/runs?limit=20');
                  const runs = await res.json();
                  const runsDiv = document.getElementById('runs');
                  
                  if (runs.length === 0) {
                    runsDiv.innerHTML = '<p>No runs recorded</p>';
                    return;
                  }
                  
                  let html = '<table><tr><th>Workflow</th><th>Status</th><th>Time</th><th>Duration</th></tr>';
                  runs.forEach(run => {
                    let statusClass = 'unhealthy';
                  if (run.status === 'completed') statusClass = 'healthy';
                  else if (run.status === 'skipped') statusClass = 'status-skipped';
                    html += '<tr><td>' + run.workflow + '</td><td class="' + statusClass + '">' + run.status + '</td><td>' + new Date(run.timestamp).toLocaleString() + '</td><td>' + (run.duration_ms || '-') + 'ms</td></tr>';
                  });
                  html += '</table>';
                  runsDiv.innerHTML = html;
                } catch (error) {
                  document.getElementById('runs').innerHTML = '<p>Error loading runs</p>';
                }
              }
              
              async function runWorkflow(workflowId) {
                try {
                  const res = await fetch(API_BASE + '/workflows/' + workflowId + '/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                  });
                  const result = await res.json();
                  document.getElementById('error').style.display = 'none';
                  loadRuns(); // Refresh runs after execution
                } catch (error) {
                  document.getElementById('error').textContent = 'Error running workflow: ' + error.message;
                  document.getElementById('error').style.display = 'block';
                }
              }
              
              loadStatus();
              loadRuns();
              setInterval(() => { loadStatus(); loadRuns(); }, 30000);
            </script>
          </body>
          </html>
        `);
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Get workflow status
    this.app.get('/workflows/:workflowId/status', (req, res) => {
      try {
        const status = this.workflowEngine.getWorkflowStatus(req.params.workflowId);
        res.json(status);
      } catch (error) {
        res.status(404).json({ 
          error: (error as Error).message 
        });
      }
    });

    // Execute workflow manually
    this.app.post('/workflows/:workflowId/execute', async (req, res) => {
      try {
        const result = await this.workflowEngine.executeWorkflow(
          req.params.workflowId,
          {
            trigger: 'manual',
            input: req.body
          }
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          error: (error as Error).message 
        });
      }
    });

    // Get run history
    this.app.get('/runs', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 100;
      const history = this.workflowEngine.getRunHistory(limit);
      res.json(history);
    });

    // Get scheduled workflows
    this.app.get('/scheduler/workflows', (req, res) => {
      const workflows = this.scheduler.getAllWorkflows();
      res.json({ workflows });
    });

    // Registry sync endpoint
    this.app.post('/ops/registry/sync', async (req, res) => {
      try {
        const result = await this.workflowEngine.executeWorkflow(
          'registry_sync',
          {
            trigger: 'manual',
            input: req.body
          }
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          error: (error as Error).message 
        });
      }
    });

    // Workflows page
    this.app.get('/workflows', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Workflows - Automation Orchestrator</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 1000px; margin: 50px auto; padding: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
              th { background: #f4f4f4; }
              .enabled { color: green; font-weight: bold; }
              .disabled { color: red; font-weight: bold; }
              .skipped { color: #856404; font-weight: bold; }
              button { padding: 8px 16px; margin: 5px; cursor: pointer; }
              .back { margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="back"><a href="/">← Back to Home</a></div>
            <h1>📋 Workflows</h1>
            <div id="workflows">Loading...</div>
            <script>
              const API_BASE = 'http://localhost:3333';
              
              async function loadWorkflows() {
                try {
                  const res = await fetch(API_BASE + '/scheduler/workflows');
                  const data = await res.json();
                  const workflows = data.workflows || [];
                  
                  if (workflows.length === 0) {
                    document.getElementById('workflows').innerHTML = '<p>No workflows configured</p>';
                    return;
                  }
                  
                  let html = '<table><tr><th>Workflow</th><th>Schedule</th><th>Status</th><th>Action</th></tr>';
                  workflows.forEach(workflow => {
                    html += '<tr><td>' + workflow + '</td><td>' + getScheduleText(workflow) + '</td><td class="enabled">Enabled</td><td><button onclick="runWorkflow(\\'' + workflow + '\\')">Run Now</button></td></tr>';
                  });
                  html += '</table>';
                  document.getElementById('workflows').innerHTML = html;
                } catch (error) {
                  document.getElementById('workflows').innerHTML = '<p>Error loading workflows</p>';
                }
              }
              
              function getScheduleText(workflow) {
                const schedules = {
                  'homebase_wrapper': 'Every 30 minutes',
                  'aether_backend_wrapper': 'Every 4 hours',
                  'project_health_check': 'Every 6 hours',
                  'system_monitor': 'Every 30 minutes',
                  'failure_monitor': 'Every 15 minutes',
                  'daily_backup': '2 AM daily',
                  'log_cleanup': '3 AM daily',
                  'auto_restart': 'Every 10 minutes',
                  'registry_sync': 'Manual trigger only'
                };
                return schedules[workflow] || 'Scheduled';
              }
              
              async function runWorkflow(workflowId) {
                try {
                  const res = await fetch(API_BASE + '/workflows/' + workflowId + '/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                  });
                  const result = await res.json();
                  alert('Workflow "' + workflowId + '" executed! Run ID: ' + result.runId);
                } catch (error) {
                  alert('Error running workflow: ' + error.message);
                }
              }
              
              loadWorkflows();
            </script>
        </body>
        </html>
      `);
    });

    // Runs page
    this.app.get('/runs-page', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Runs - Automation Orchestrator</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 1200px; margin: 50px auto; padding: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
              th { background: #f4f4f4; }
              .completed { color: green; font-weight: bold; }
              .failed { color: red; font-weight: bold; }
              .skipped { color: #856404; font-weight: bold; }
              .back { margin-bottom: 20px; }
              .filters { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
              select, button { padding: 8px; margin-right: 10px; }
            </style>
        </head>
        <body>
            <div class="back"><a href="/">← Back to Home</a></div>
            <h1>📊 Execution Runs</h1>
            <div class="filters">
              <select id="workflowFilter" onchange="filterRuns()">
                <option value="">All Workflows</option>
                <option value="homebase_wrapper">HomeBase Wrapper</option>
                <option value="aether_backend_wrapper">Aether Backend Wrapper</option>
                <option value="project_health_check">Project Health Check</option>
                <option value="system_monitor">System Monitor</option>
                <option value="failure_monitor">Failure Monitor</option>
                <option value="daily_backup">Daily Backup</option>
                <option value="log_cleanup">Log Cleanup</option>
                <option value="auto_restart">Auto Restart</option>
                <option value="registry_sync">Registry Sync</option>
              </select>
              <select id="statusFilter" onchange="filterRuns()">
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="skipped">Skipped</option>
              </select>
              <button onclick="loadRuns()">Refresh</button>
            </div>
            <div id="runs">Loading...</div>
            <script>
              const API_BASE = 'http://localhost:3333';
              let allRuns = [];
              
              async function loadRuns() {
                try {
                  const res = await fetch(API_BASE + '/runs?limit=100');
                  allRuns = await res.json();
                  filterRuns();
                } catch (error) {
                  document.getElementById('runs').innerHTML = '<p>Error loading runs</p>';
                }
              }
              
              function filterRuns() {
                const workflowFilter = document.getElementById('workflowFilter').value;
                const statusFilter = document.getElementById('statusFilter').value;
                
                let filtered = allRuns;
                if (workflowFilter) {
                  filtered = filtered.filter(run => run.workflow === workflowFilter);
                }
                if (statusFilter) {
                  filtered = filtered.filter(run => run.status === statusFilter);
                }
                
                if (filtered.length === 0) {
                  document.getElementById('runs').innerHTML = '<p>No runs match filters</p>';
                  return;
                }
                
                let html = '<table><tr><th>Workflow</th><th>Status</th><th>Time</th><th>Duration</th><th>Trigger</th></tr>';
                filtered.forEach(run => {
                  let statusClass = 'failed';
                  if (run.status === 'completed') statusClass = 'completed';
                  else if (run.status === 'skipped') statusClass = 'skipped';
                  html += '<tr><td>' + run.workflow + '</td><td class="' + statusClass + '">' + run.status + '</td><td>' + new Date(run.timestamp).toLocaleString() + '</td><td>' + (run.duration_ms || '-') + 'ms</td><td>' + (run.trigger || '-') + '</td></tr>';
                });
                html += '</table>';
                document.getElementById('runs').innerHTML = html;
              }
              
              loadRuns();
            </script>
        </body>
        </html>
      `);
    });
  }

  async start(): Promise<void> {
    const port = this.config.orchestrator.port;
    
    // Start HTTP server
    this.app.listen(port, () => {
      logger.info(`Orchestrator listening on port ${port}`);
    });

    // Start scheduler
    this.scheduler.start();

    logger.info('Orchestrator started successfully');
  }

  async stop(): Promise<void> {
    logger.info('Stopping orchestrator');
    
    this.scheduler.stop();
    
    logger.info('Orchestrator stopped');
  }
}

// Start orchestrator if run directly
if (require.main === module) {
  const orchestrator = new Orchestrator();
  
  orchestrator.start().catch(error => {
    logger.error('Failed to start orchestrator', { error });
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully');
    await orchestrator.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    await orchestrator.stop();
    process.exit(0);
  });
}

export { Orchestrator };
