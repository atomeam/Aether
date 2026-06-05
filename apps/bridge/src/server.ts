import express from 'express';
import path from 'path';
import { IntegrationManager } from './core/integration_manager';
import { VictusBridge } from './core/victus_bridge';
import { Orchestrator } from './core/orchestrator';

const app: express.Express = express();
const PORT = 8080;

// In-memory execution state for frontend polling
let executionState = {
  status: 'idle',
  currentStep: 0,
  totalSteps: 0,
  steps: [] as any[],
  objective: '',
  startedAt: '',
  completedAt: '',
  error: ''
};

app.use(express.json());

// Initialize services with correct constructor signatures
const configPath = path.join(process.cwd(), 'config', 'integrations.json');
const integrationManager = new IntegrationManager(configPath);
const victusBridge = new VictusBridge({ runtimeUrl: 'http://localhost:8080' });
const orchestrator = new Orchestrator(integrationManager, victusBridge, { stopOnFailure: true });

// POST /api/execute - Main entry point for frontend
app.post('/api/execute', async (req, res) => {
  try {
    const { objective, plan } = req.body || {};
    
    if (!objective && !plan) {
      return res.status(400).json({ success: false, error: 'Missing objective or plan' });
    }
    
    // Reset execution state
    executionState = {
      status: 'running',
      currentStep: 0,
      totalSteps: plan?.length || 0,
      steps: [],
      objective: objective || '',
      startedAt: new Date().toISOString(),
      completedAt: '',
      error: ''
    };
    
    if (objective) {
      orchestrator.setObjective(objective);
    }
    
    if (plan) {
      orchestrator.setPlan(plan);
      executionState.totalSteps = plan.length;
    }
    
    const result = await orchestrator.executePlan();
    
    // Update state on completion
    executionState.status = 'completed';
    executionState.completedAt = new Date().toISOString();
    executionState.steps = result.steps || [];
    
    res.json({ success: true, result });
  } catch (error: any) {
    executionState.status = 'error';
    executionState.error = error.message;
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/execute/status - Poll for execution progress
app.get('/api/execute/status', (req, res) => {
  res.json(executionState);
});

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/stack - Backend health check for frontend status
app.get('/api/stack', (req, res) => {
  res.json({ 
    status: 'online',
    backend: 'alpha-backend',
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`HomeBase runtime running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  Execute: POST http://localhost:${PORT}/api/execute`);
  console.log(`  Status: GET http://localhost:${PORT}/api/execute/status`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});

export default app;