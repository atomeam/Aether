import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, AlertTriangle, CheckCircle, RefreshCcw, BarChart3 } from 'lucide-react';

interface BootstrapResult {
  id: string;
  strategy_id: string;
  observed_metric: number;
  p_value: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  threshold: number;
  action_needed: number;
  timestamp: string;
}

export default function ProfitEngine() {
  const [results, setResults] = useState<BootstrapResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState('default');
  const [threshold, setThreshold] = useState(0.05);
  const [bootstrapSamples, setBootstrapSamples] = useState(1000);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profit/bootstrap/history?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || data);
      }
    } catch (e) {
      console.error('Failed to fetch bootstrap results:', e);
    } finally {
      setLoading(false);
    }
  };

  const runBootstrapAnalysis = async () => {
    try {
      setAnalyzing(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profit/bootstrap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: selectedStrategy,
          threshold,
          bootstrapSamples
        })
      });

      if (response.ok) {
        const result = await response.json();
        setResults(prev => [result, ...prev]);
      }
    } catch (e) {
      console.error('Failed to run bootstrap analysis:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatMetric = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatPValue = (value: number) => {
    return value < 0.001 ? '< 0.001' : value.toFixed(4);
  };

  return (
    <div className="p-8 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Profit Engine</h2>
            <p className="text-sm text-white/60">Bootstrap P-Value Analysis</p>
          </div>
        </div>
        <button
          onClick={fetchResults}
          disabled={loading}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Analysis Controls */}
      <div className="mb-8 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">
              Strategy ID
            </label>
            <input
              type="text"
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm"
              placeholder="default"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">
              P-Value Threshold
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">
              Bootstrap Samples
            </label>
            <input
              type="number"
              min="100"
              max="10000"
              value={bootstrapSamples}
              onChange={(e) => setBootstrapSamples(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
        </div>
        <button
          onClick={runBootstrapAnalysis}
          disabled={analyzing}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {analyzing ? (
            <>
              <RefreshCcw className="w-4 h-4 animate-spin" />
              Running Bootstrap Analysis...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4" />
              Run Bootstrap Analysis
            </>
          )}
        </button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl opacity-20">
            <Activity className="w-8 h-8 mb-4" />
            <span className="text-sm uppercase tracking-[0.3em]">No bootstrap results yet</span>
          </div>
        ) : (
          results.map((result) => (
            <div
              key={result.id}
              className={`p-6 bg-white/[0.02] border rounded-2xl ${
                result.action_needed
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-emerald-500/30 bg-emerald-500/5'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {result.action_needed ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  )}
                  <div>
                    <div className="font-bold text-white">{result.strategy_id}</div>
                    <div className="text-xs text-white/40">
                      {new Date(result.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  result.action_needed
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {result.action_needed ? 'ACTION NEEDED' : 'OPTIMAL'}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-widest mb-1">
                    Observed Metric
                  </div>
                  <div className="text-lg font-bold text-white">
                    {formatMetric(result.observed_metric)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-widest mb-1">
                    P-Value
                  </div>
                  <div className={`text-lg font-bold ${
                    result.p_value > result.threshold ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {formatPValue(result.p_value)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-widest mb-1">
                    Threshold
                  </div>
                  <div className="text-lg font-bold text-white">
                    {result.threshold.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-widest mb-1">
                    95% CI
                  </div>
                  <div className="text-sm font-bold text-white">
                    [{formatMetric(result.confidence_interval_lower)}, {formatMetric(result.confidence_interval_upper)}]
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
