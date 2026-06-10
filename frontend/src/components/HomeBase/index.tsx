/**
 * HomeBase Component
 * 
 * Main control panel for Alpha execution engine.
 * Provides objective input, execution controls, AI dashboard, and workflow builder.
 */

import { useState, useEffect } from 'react';
import { AIDashboard } from '../AIDashboard';
import { WorkflowBuilder } from '../WorkflowBuilder';
import { RealTimeMonitor } from '../RealTimeMonitor';
import './HomeBase.css';

interface ExecutionStatus {
  status: string;
  currentStep: number;
  totalSteps: number;
  steps: any[];
  objective: string;
  startedAt: string;
  completedAt: string;
  error: string;
}

interface HomeBaseProps {
  runtimeUrl?: string;
}

type Tab = 'execute' | 'dashboard' | 'workflows' | 'monitor';

export function HomeBase({ runtimeUrl = '' }: HomeBaseProps) {
  const [activeTab, setActiveTab] = useState<Tab>('execute');
  const [objective, setObjective] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [execStatus, setExecStatus] = useState<ExecutionStatus | null>(null);

  // Polling for execution status
  useEffect(() => {
    if (!loading) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/execute/status');
        const data = await res.json();
        setExecStatus(data);
        if (data.status === 'completed' || data.status === 'error') {
          setLoading(false);
        }
      } catch (e) {
        // Ignore polling errors
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [loading]);

  const execute = async () => {
    if (!objective.trim()) return;
    setLoading(true);
    setResult(null);
    setExecStatus(null);
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const handleWorkflowCreate = (workflowSteps: any[]) => {
    // Convert workflow steps to objective
    const workflowDescription = workflowSteps
      .map(step => `${step.service}: ${step.action}`)
      .join(' → ');
    setObjective(`Execute workflow: ${workflowDescription}`);
    setActiveTab('execute');
  };

  return (
    <div className="homebase">
      <div className="homebase-header">
        <h1>⚡ Alpha - AI Connection Hub</h1>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'execute' ? 'active' : ''}`}
            onClick={() => setActiveTab('execute')}
          >
            🚀 Execute
          </button>
          <button
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            🔗 Dashboard
          </button>
          <button
            className={`tab ${activeTab === 'workflows' ? 'active' : ''}`}
            onClick={() => setActiveTab('workflows')}
          >
            🔧 Workflows
          </button>
          <button
            className={`tab ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitor')}
          >
            📊 Monitor
          </button>
        </div>
      </div>
      
      {activeTab === 'execute' && (
        <div className="tab-content">
          <section className="control-panel">
            <input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Enter objective or describe your AI task..."
              onKeyDown={(e) => e.key === 'Enter' && execute()}
            />
            <button onClick={execute} disabled={loading}>
              {loading ? '◌ Launching...' : '▶ Launch Objective'}
            </button>
          </section>

          <div className="quick-actions">
            <button onClick={() => setObjective('Analyze this data using OpenAI and provide insights')}>
              📊 Data Analysis
            </button>
            <button onClick={() => setObjective('Generate content using multiple AI models')}>
              ✍️ Content Generation
            </button>
            <button onClick={() => setObjective('Process customer support query with AI classification')}>
              🎧 Customer Support
            </button>
            <button onClick={() => setObjective('Translate and summarize document using AI')}>
              🌐 Document Processing
            </button>
          </div>

          {(loading || execStatus) && (
            <section className="status-panel">
              <h3>Execution Log</h3>
              <div className="status-header">
                <span>Status: {execStatus?.status || 'idle'}</span>
                <span>Step: {execStatus?.currentStep || 0} / {execStatus?.totalSteps || 0}</span>
              </div>
              <div className="steps-log">
                {execStatus?.steps?.map((step: any, i: number) => (
                  <div key={i} className={`step ${step.status || 'pending'}`}>
                    <span className="step-num">[{i + 1}]</span>
                    <span className="step-name">{step.name || step.action || 'pending'}</span>
                    <span className="step-status">{step.status || ''}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {result && (
            <section className="result-panel">
              <h3>Execution Result</h3>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </section>
          )}
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="tab-content">
          <AIDashboard runtimeUrl={runtimeUrl} />
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="tab-content">
          <WorkflowBuilder onWorkflowCreate={handleWorkflowCreate} />
        </div>
      )}

      {activeTab === 'monitor' && (
        <div className="tab-content">
          <RealTimeMonitor />
        </div>
      )}
    </div>
  );
}

export default HomeBase;