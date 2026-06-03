import React, { useState } from 'react';
import { Database, AlertTriangle, Zap, Lock, TrendingUp, DollarSign, Clock, FileText, CheckCircle, XCircle, RefreshCcw, X } from 'lucide-react';

interface S3Analysis {
  scan_id: string;
  timestamp: string;
  total_slow_queries: number;
  avg_duration_ms: number;
  worst_offenders: Array<{
    query_text: string;
    duration_ms: number;
    table_name: string;
    query_type: string;
    timestamp: string;
  }>;
  proposals?: Array<{
    id: string;
    table: string;
    sql_statement: string;
    current_latency_ms: number;
    projected_latency_ms: number;
    expected_improvement: string;
    priority: string;
  }>;
  estimated_cost_savings?: string | null;
}

interface DatabaseInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  userPlan: string;
}

export default function DatabaseInspector({ isOpen, onClose, userPlan }: DatabaseInspectorProps) {
  const [analysis, setAnalysis] = useState<S3Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [executedProposals, setExecutedProposals] = useState<Set<string>>(new Set());

  const runAnalysis = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('aether_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agents/s3/analyze`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAnalysis(data);
    } catch (e) {
      setError('Failed to analyze database performance');
    } finally {
      setLoading(false);
    }
  };

  const executeProposal = async (proposal: any) => {
    try {
      setExecuting(proposal.id);
      setError('');
      const token = localStorage.getItem('aether_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agents/s3/execute`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposal_id: proposal.id,
          sql_statement: proposal.sql_statement,
          table_name: proposal.table,
          expected_improvement: proposal.expected_improvement
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setExecutedProposals(prev => new Set([...prev, proposal.id]));
      } else {
        setError(data.error || 'Execution failed');
      }
    } catch (e) {
      setError('Failed to execute proposal');
    } finally {
      setExecuting(null);
    }
  };

  if (!isOpen) return null;

  const isPro = userPlan === 'pro' || userPlan === 'enterprise';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">S3 Database Inspector</h3>
            <p className="text-sm text-white/60">Query performance analysis and optimization</p>
          </div>
        </div>

        {!analysis && (
          <div className="text-center py-8">
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {loading ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Run Analysis
                </>
              )}
            </button>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white/60">Slow Queries</span>
                </div>
                <div className="text-2xl font-bold">{analysis.total_slow_queries}</div>
                <div className="text-xs text-white/40">Last 7 days</div>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-white/60">Avg Duration</span>
                </div>
                <div className="text-2xl font-bold">{analysis.avg_duration_ms}ms</div>
                <div className="text-xs text-white/40">Per query</div>
              </div>
              {isPro && analysis.estimated_cost_savings && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-white-60">Est. Savings</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{analysis.estimated_cost_savings}</div>
                  <div className="text-xs text-white/40">Monthly</div>
                </div>
              )}
            </div>

            {/* Urgency Banner for Free Users */}
            {!isPro && analysis.total_slow_queries > 0 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <div className="flex-1">
                  <div className="font-medium text-yellow-300">Performance Issue Detected</div>
                  <div className="text-sm text-white/60">
                    {analysis.total_slow_queries} slow queries detected. Upgrade to Pro for automated resolution proposals with 1-click execution.
                  </div>
                </div>
                <Lock className="w-5 h-5 text-yellow-400" />
              </div>
            )}

            {/* Worst Offenders */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Worst Offenders
              </h4>
              <div className="space-y-2">
                {analysis.worst_offenders.map((query, index) => (
                  <div key={index} className="p-3 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40">{query.query_type}</span>
                        <span className="text-xs text-white/40">{query.table_name}</span>
                      </div>
                      <div className="text-sm font-mono text-orange-400">{query.duration_ms}ms</div>
                    </div>
                    <div className="text-xs text-white/40 font-mono truncate">
                      {query.query_text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution Proposals - Pro Only */}
            {isPro && analysis.proposals && analysis.proposals.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Resolution Proposals
                </h4>
                <div className="space-y-3">
                  {analysis.proposals.map((proposal) => {
                    const isExecuted = executedProposals.has(proposal.id);
                    const isExecuting = executing === proposal.id;
                    
                    return (
                      <div key={proposal.id} className={`p-4 border rounded-lg ${
                        isExecuted 
                          ? 'border-green-500/30 bg-green-500/10' 
                          : proposal.priority === 'high' 
                            ? 'border-red-500/30 bg-red-500/10' 
                            : 'border-yellow-500/30 bg-yellow-500/10'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {proposal.table}
                              {isExecuted && <CheckCircle className="w-4 h-4 text-green-400" />}
                            </div>
                            <div className="text-sm text-white/60 mt-1">
                              {proposal.current_latency_ms}ms → {proposal.projected_latency_ms}ms
                            </div>
                          </div>
                          <div className="text-sm text-green-400 font-medium">
                            {proposal.expected_improvement}
                          </div>
                        </div>
                        
                        <div className="text-xs text-white/40 font-mono mb-3 bg-black/30 p-2 rounded">
                          {proposal.sql_statement}
                        </div>
                        
                        {!isExecuted && (
                          <button
                            onClick={() => executeProposal(proposal)}
                            disabled={isExecuting}
                            className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            {isExecuting ? (
                              <>
                                <RefreshCcw className="w-4 h-4 animate-spin" />
                                Applying...
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4" />
                                Approve & Apply
                              </>
                            )}
                          </button>
                        )}
                        
                        {isExecuted && (
                          <div className="text-center text-sm text-green-400 font-medium">
                            ✓ Index applied successfully
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isPro && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-purple-400" />
                  <span className="font-medium text-purple-300">Pro Feature</span>
                </div>
                <p className="text-sm text-white/60">
                  Upgrade to Pro for autonomous resolution proposals with 1-click execution
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}