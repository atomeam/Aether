import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

export function GETapinexusregistry() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/nexus/registry');
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="text-sm text-white/60">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-500/20 bg-red-500/[0.02] rounded-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="text-red-400 text-sm">Error: {error}</div>
          <button 
            onClick={fetchData}
            className="text-red-400 hover:text-red-300"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90">
          GETapinexusregistry
        </h3>
        <button 
          onClick={fetchData}
          className="text-white/60 hover:text-white/90"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <pre className="text-[8px] text-white/60 font-mono overflow-auto max-h-64">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
