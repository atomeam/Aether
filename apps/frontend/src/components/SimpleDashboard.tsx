import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Server, Users, Zap } from 'lucide-react';

export default function SimpleDashboard() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#c4a661]">a-to-mind Dashboard</h1>
          <div className="text-sm text-white/60">Enterprise Plan</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-[#c4a661]" />
              <span className="text-sm text-white/60">Revenue</span>
            </div>
            <div className="text-2xl font-bold">$0.00</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-[#c4a661]" />
              <span className="text-sm text-white/60">Users</span>
            </div>
            <div className="text-2xl font-bold">0</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Server className="w-5 h-5 text-[#c4a661]" />
              <span className="text-sm text-white/60">Uptime</span>
            </div>
            <div className="text-2xl font-bold">100%</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-[#c4a661]" />
              <span className="text-sm text-white/60">API Calls</span>
            </div>
            <div className="text-2xl font-bold">0</div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Welcome to a-to-mind</h2>
          <p className="text-white/60">Your autonomous business engine is ready. Use the tabs above to manage your operations.</p>
        </div>
      </div>
    </div>
  );
}
