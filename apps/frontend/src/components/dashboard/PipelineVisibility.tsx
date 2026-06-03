import React, { useState, useEffect } from 'react';
import { GitBranch, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink, Activity } from 'lucide-react';

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  head_commit: {
    id: string;
    message: string;
    timestamp: string;
  };
}

interface Deployment {
  id: number;
  sha: string;
  ref: string;
  environment: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function PipelineVisibility() {
  const [workflows, setWorkflows] = useState<WorkflowRun[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        // Fetch workflow runs and deployments from our backend proxy
        const [workflowsRes, deploymentsRes] = await Promise.all([
          fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/github/workflows'),
          fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/github/deployments')
        ]);

        const workflowsData = await workflowsRes.json();
        const deploymentsData = await deploymentsRes.json();

        setWorkflows(workflowsData.workflows || []);
        setDeployments(deploymentsData.deployments || []);
        setPendingApproval(deploymentsData.pending_approval || false);
        setLoading(false);
      } catch (e: any) {
        console.error('Failed to fetch pipeline data:', e);
        setError('Failed to fetch pipeline data');
        setLoading(false);
      }
    };

    fetchPipelineData();
    const interval = setInterval(fetchPipelineData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getWorkflowStatus = (workflow: WorkflowRun) => {
    if (workflow.status === 'completed') {
      return workflow.conclusion === 'success' ? 'success' : 'failed';
    }
    return workflow.status; // 'queued', 'in_progress'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'failed': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'in_progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20 animate-pulse';
      case 'queued': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      default: return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'in_progress': return <Activity className="w-4 h-4 animate-spin" />;
      case 'queued': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatCommitSha = (sha: string) => {
    return sha.substring(0, 7);
  };

  const formatCommitMessage = (message: string) => {
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Pipeline Visibility</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {workflows.length} workflows
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Live
          </span>
        </div>
      </div>

      {/* Production Gate Status */}
      <div className={`mb-4 p-4 rounded-xl border ${pendingApproval ? 'bg-amber-400/10 border-amber-400/20' : 'bg-emerald-400/10 border-emerald-400/20'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {pendingApproval ? (
              <AlertCircle className="w-6 h-6 text-amber-400" />
            ) : (
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            )}
            <div>
              <div className={`font-bold ${pendingApproval ? 'text-amber-400' : 'text-emerald-400'}`}>
                {pendingApproval ? 'Deployment Awaiting Approval' : 'No Pending Approvals'}
              </div>
              <div className="text-xs text-slate-400">
                {pendingApproval ? 'Manual gate requires terminal approval' : 'Production gate is clear'}
              </div>
            </div>
          </div>
          {pendingApproval && (
            <button className="px-3 py-1 bg-amber-400/20 text-amber-400 rounded text-xs hover:bg-amber-400/30 transition-colors">
              View in GitHub
            </button>
          )}
        </div>
      </div>

      {/* Live Workflow Ticker */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 border-b border-slate-800 pb-2">
          <span className="text-emerald-400">●</span>
          <span>LIVE WORKFLOW STATUS</span>
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="text-slate-500 text-sm">Loading pipeline data...</div>
          ) : error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : workflows.length === 0 ? (
            <div className="text-slate-500 text-sm">No recent workflow runs</div>
          ) : (
            workflows.slice(0, 5).map((workflow) => {
              const status = getWorkflowStatus(workflow);
              return (
                <div
                  key={workflow.id}
                  className={`flex items-center gap-3 p-2 rounded-lg border ${getStatusColor(status)}`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {getStatusIcon(status)}
                    <span className="font-medium text-white">{workflow.name}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatTimestamp(workflow.created_at)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Deployment Ledger */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 border-b border-slate-800 pb-2">
          <span className="text-emerald-400">●</span>
          <span>RECENT DEPLOYMENTS</span>
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="text-slate-500 text-sm">Loading deployments...</div>
          ) : deployments.length === 0 ? (
            <div className="text-slate-500 text-sm">No recent deployments</div>
          ) : (
            deployments.slice(0, 5).map((deployment) => (
              <div
                key={deployment.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-slate-700 px-2 py-0.5 rounded text-emerald-400">
                      {formatCommitSha(deployment.sha)}
                    </code>
                    <span className="text-xs text-slate-400">{deployment.environment}</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-1">
                    {deployment.ref}
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  {formatTimestamp(deployment.created_at)}
                </div>
                <a
                  href={`https://github.com/adammichaelbrown/Aether/commit/${deployment.sha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
