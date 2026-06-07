import React from 'react';
import { Zap, Workflow, Database, Cpu, Globe, Shield, BarChart, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onLaunchDashboard: () => void;
  onShowKnowledgeHub: () => void;
}

export default function LandingPage({ onLaunchDashboard, onShowKnowledgeHub }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
        <div className="relative max-w-7xl mx-auto px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <Zap className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              a-to-mind
            </h1>
            <p className="text-2xl text-white/80 mb-4">Automation Intelligence</p>
            <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
              Enterprise automation platform. Build, deploy, and scale intelligent automation workflows for your business.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={onLaunchDashboard}
                className="px-8 py-3 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                Launch Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={onShowKnowledgeHub}
                className="px-8 py-3 bg-blue-600 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Knowledge Hub
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="px-8 py-3 bg-white/10 rounded-lg font-medium hover:bg-white/20 transition-colors">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-8 py-20">
        <h2 className="text-3xl font-bold mb-12 text-center">Enterprise Automation Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Workflow, name: 'Workflow Automation', desc: 'Automate complex business processes' },
            { icon: Database, name: 'Data Integration', desc: 'Connect any data source instantly' },
            { icon: Cpu, name: 'AI-Powered', desc: 'Intelligent decision automation' },
            { icon: Globe, name: 'Global Scale', desc: 'Deploy anywhere in the world' },
            { icon: Shield, name: 'Enterprise Security', desc: 'Bank-grade security standards' },
            { icon: BarChart, name: 'Real-time Analytics', desc: 'Monitor performance instantly' },
            { icon: Zap, name: 'Lightning Fast', desc: 'Sub-second execution times' },
            { icon: Database, name: 'API Integration', desc: 'Connect to 1000+ services' },
          ].map((feature, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-colors">
              <feature.icon className="w-8 h-8 text-purple-500 mb-4" />
              <h3 className="font-semibold mb-2">{feature.name}</h3>
              <p className="text-sm text-white/60">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-500 mb-2">1000+</div>
            <div className="text-white/60">Integrations</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-500 mb-2">99.9%</div>
            <div className="text-white/60">Uptime SLA</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-500 mb-2">&lt;100ms</div>
            <div className="text-white/60">Response Time</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-8 py-8 border-t border-white/10">
        <div className="text-center text-white/40 text-sm">
          a-to-mind Automation Intelligence © 2026
        </div>
      </div>
    </div>
  );
}