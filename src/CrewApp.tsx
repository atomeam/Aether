import React, { useState } from 'react';
import CrewDashboard from './components/CrewDashboard';
import { Users, Zap, Brain, Cpu, BarChart3, X, ArrowLeft } from 'lucide-react';

interface AppMode {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export default function CrewApp() {
  const [activeMode, setActiveMode] = useState('crew');

  return (
    <div className="min-h-screen bg-black text-slate-300">
      {/* Header */}
      <header className="bg-black border-b border-green-900/30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = '/'}
              className="p-2 hover:bg-slate-900 rounded-lg transition"
              title="Back to ALPHA"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-950/20 border border-green-900/50 rounded-lg">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-green-400 tracking-tight">ALPHA Crew System</h1>
                <p className="text-slate-600 text-[10px] uppercase tracking-[0.2em] font-bold">4-Member AI Coordination Platform</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-green-950/10 border border-green-950/30 px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]" />
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Operational</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 flex flex-col items-center">
        <div className="w-full">
          <CrewDashboard />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-green-900/20 px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-slate-700 text-[10px] uppercase font-bold tracking-widest">
          <div>ALPHA Crew System v1.0.3-RC</div>
          <div className="flex items-center gap-4">
            <span className="text-green-900">Cloudflare: <span className="text-green-700">Online</span></span>
            <span className="text-green-900">AI Studio: <span className="text-green-700">Online</span></span>
            <span className="text-green-900">Crew: <span className="text-green-700">4/4 Active</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}