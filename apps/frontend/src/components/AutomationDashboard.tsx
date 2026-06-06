import React, { useState, useEffect } from 'react';
import { Activity, Play, Pause, RefreshCw, Zap, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface ScheduledJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
}

interface Workflow {
  name: string;
  description: string;
}

export default function AutomationDashboard() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/automations');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.scheduledJobs || []);
        setWorkflows(data.availableWorkflows || []);
        setError(null);
      } else {
        throw new Error('Failed to fetch automations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load automations');
    } finally {
      setLoading(false);
    }
  };

  const toggleJob = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch('http://localhost:3000/api/automations/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled }),
      });
      if (response.ok) {
        setJobs(jobs.map(job => 
          job.id === id ? { ...job, enabled } : job
        ));
      }
    } catch (err) {
      console.error('Failed to toggle job:', err);
    }
  };

  const triggerWorkflow = async (workflowName: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/automations/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: workflowName, input: {} }),
      });
      if (response.ok) {
        alert(`Workflow ${workflowName} triggered successfully`);
      }
    } catch (err) {
      console.error('Failed to trigger workflow:', err);
    }
  };

  useEffect(() => {
    fetchAutomations();
    const interval = setInterval(fetchAutomations, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 border border-white/5 bg-white/[0.01] rounded-2xl">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
          <span className="text-sm text-white/60">Loading automations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Automation Dashboard</h2>
            <p className="text-xs text-white/40">Manage scheduled jobs and workflows</p>
          </div>
        </div>
        <button 
          onClick={fetchAutomations}
          className="text-white/60 hover:text-white/90 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="p-4 border border-red-500/20 bg-red-500/[0.02] rounded-lg">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Scheduled Jobs */}
      <div className="p-6 border border-white/5 bg-white/[0.01] rounded-2xl">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Scheduled Jobs
        </h3>
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="p-4 border border-white/5 bg-white/[0.01] rounded-lg flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${job.enabled ? 'bg-green-400' : 'bg-gray-400'}`} />
                  <div className="font-medium text-white/90">{job.name}</div>
                </div>
                <div className="text-xs text-white/40 mt-1">
                  Schedule: {job.schedule}
                  {job.lastRun && ` • Last run: ${new Date(job.lastRun).toLocaleString()}`}
                </div>
              </div>
              <button
                onClick={() => toggleJob(job.id, !job.enabled)}
                className={`p-2 rounded-lg transition-colors ${
                  job.enabled 
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                }`}
              >
                {job.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          ))}
          {jobs.length === 0 && (
            <div className="text-center text-white/40 py-8">
              No scheduled jobs configured
            </div>
          )}
        </div>
      </div>

      {/* Workflows */}
      <div className="p-6 border border-white/5 bg-white/[0.01] rounded-2xl">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Available Workflows
        </h3>
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <div key={workflow.name} className="p-4 border border-white/5 bg-white/[0.01] rounded-lg flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-white/90">{workflow.name}</div>
                <div className="text-xs text-white/40 mt-1">{workflow.description}</div>
              </div>
              <button
                onClick={() => triggerWorkflow(workflow.name)}
                className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm font-medium"
              >
                Run Now
              </button>
            </div>
          ))}
          {workflows.length === 0 && (
            <div className="text-center text-white/40 py-8">
              No workflows configured
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 border border-white/5 bg-white/[0.01] rounded-2xl">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors">
            + New Job
          </button>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors">
            + New Workflow
          </button>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors">
            View Logs
          </button>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors">
            Export Config
          </button>
        </div>
      </div>
    </div>
  );
}
