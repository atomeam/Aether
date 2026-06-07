import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Zap, Activity, Brain, Database, Workflow, Globe, Shield, BarChart, Cpu } from 'lucide-react';

interface SystemStatus {
  backend: string;
  frontend: string;
  mcp: string;
  performance: string;
}

interface KnowledgeItem {
  id: string;
  title: string;
  type: string;
  source: string;
  extractedAt: string;
  insights: string[];
  related: string[];
  tags: string[];
}

interface OneHubProps {
  apiUrl: string;
}

export function OneHub({ apiUrl }: OneHubProps) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    backend: 'online',
    frontend: 'online',
    mcp: 'active',
    performance: 'optimized'
  });
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKnowledge();
    fetchSystemStatus();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/knowledge`);
      const data = await response.json();
      setKnowledge(data);
    } catch (error) {
      console.error('Failed to fetch knowledge:', error);
      setKnowledge(getSampleKnowledge());
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/stack`);
      const data = await response.json();
      setSystemStatus({
        backend: data.status || 'online',
        frontend: 'online',
        mcp: 'active',
        performance: 'optimized'
      });
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">a-to-mind OneHub</h1>
              <p className="text-slate-300 text-lg">Universal extraction & assimilation system</p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Backend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.backend === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-white font-medium">{systemStatus.backend}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Frontend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.frontend === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-white font-medium">{systemStatus.frontend}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm flex items-center gap-2">
                <Brain className="w-4 h-4" />
                MCP Server
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.mcp === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-white font-medium">{systemStatus.mcp}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.performance === 'optimized' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-white font-medium">{systemStatus.performance}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Total Knowledge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{knowledge.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">8</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{knowledge.reduce((acc, k) => acc + k.related.length, 0)}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Last Update</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white">{knowledge.length > 0 ? new Date(knowledge[0].extractedAt).toLocaleDateString() : 'N/A'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Knowledge Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Extracted Knowledge</h2>
          {loading ? (
            <div className="text-center text-slate-300 py-12">Loading knowledge base...</div>
          ) : knowledge.length === 0 ? (
            <div className="text-center text-slate-300 py-12">No knowledge found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {knowledge.map((item) => (
                <Card key={item.id} className="bg-slate-800/50 border-slate-700 hover:border-purple-500 transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white">{item.title}</CardTitle>
                      <Badge variant="outline" className="border-purple-500 text-purple-300">{item.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Source</div>
                        <div className="text-sm text-slate-200">{item.source}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Extracted</div>
                        <div className="text-sm text-slate-200">{new Date(item.extractedAt).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Key Insights</div>
                        <div className="space-y-1">
                          {item.insights.slice(0, 3).map((insight, idx) => (
                            <div key={idx} className="text-sm text-slate-300">• {insight}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Related</div>
                        <div className="flex flex-wrap gap-1">
                          {item.related.slice(0, 3).map((rel, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{rel}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Tags</div>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs border-slate-600 text-slate-400">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Capabilities */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">System Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Workflow, name: 'Workflow Automation', desc: 'Automate complex business processes' },
              { icon: Database, name: 'Data Integration', desc: 'Connect any data source instantly' },
              { icon: Cpu, name: 'AI-Powered', desc: 'Intelligent decision automation' },
              { icon: Globe, name: 'Global Scale', desc: 'Deploy anywhere in the world' },
              { icon: Shield, name: 'Enterprise Security', desc: 'Bank-grade security standards' },
              { icon: BarChart, name: 'Real-time Analytics', desc: 'Monitor performance instantly' },
              { icon: Brain, name: 'Knowledge Hub', desc: 'Universal extraction & assimilation' },
              { icon: Activity, name: 'System Monitoring', desc: '32 MCP tools for control' },
            ].map((cap, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <cap.icon className="w-8 h-8 text-purple-400 mb-3" />
                  <h3 className="text-white font-semibold mb-1">{cap.name}</h3>
                  <p className="text-slate-400 text-sm">{cap.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getSampleKnowledge(): KnowledgeItem[] {
  return [
    {
      id: 'moon-child',
      title: 'Moon Child Pocket PC Game',
      type: 'mobile',
      source: 'Review Analysis',
      extractedAt: '2026-06-07T01:15:00Z',
      insights: [
        'Dual control schemes (D-Pad + stylus)',
        'Real-time interpolated graphics',
        'Optical illusion level design',
        'Performance tuning options'
      ],
      related: ['Citra Emulator', 'BitTV'],
      tags: ['gaming', 'platformer', 'pocket-pc', 'retro']
    },
    {
      id: 'citra-emulator',
      title: 'Citra 3DS Emulator',
      type: 'emulation',
      source: 'APK Analysis',
      extractedAt: '2026-06-07T01:30:00Z',
      insights: [
        'JIT compilation for performance',
        'OpenGL ES rendering',
        'Multi-threaded rendering pipeline',
        'Thermal throttling management'
      ],
      related: ['Moon Child', 'BitTV'],
      tags: ['emulation', '3ds', 'android', 'performance']
    },
    {
      id: 'bittv-apk',
      title: 'BitTV Streaming App',
      type: 'streaming',
      source: 'APK Analysis',
      extractedAt: '2026-06-07T01:35:00Z',
      insights: [
        'Universal APK architecture',
        'Mobile video streaming optimization',
        'Creative Commons licensing',
        'Android TV compatibility'
      ],
      related: ['Citra Emulator', 'Moon Child'],
      tags: ['streaming', 'android', 'video', 'universal-apk']
    },
    {
      id: 'fast-backend',
      title: 'Fast Backend Manager',
      type: 'skills',
      source: 'Performance Skill',
      extractedAt: '2026-06-07T01:00:00Z',
      insights: [
        'One-command backend restart',
        'Port cleanup automation',
        'Health check integration',
        'PowerShell escaping fixes'
      ],
      related: ['ultra-fast-execution', 'git-push-protection'],
      tags: ['performance', 'automation', 'devops']
    },
    {
      id: 'ultra-fast',
      title: 'Ultra Fast Execution',
      type: 'skills',
      source: 'Performance Skill',
      extractedAt: '2026-06-07T01:00:00Z',
      insights: [
        'Batch command execution',
        'Background process management',
        'Aggressive optimization',
        'Skip verification patterns'
      ],
      related: ['fast-backend', 'git-push-protection'],
      tags: ['performance', 'automation', 'optimization']
    },
    {
      id: 'git-protection',
      title: 'Git Push Protection Handler',
      type: 'skills',
      source: 'Security Skill',
      extractedAt: '2026-06-07T01:20:00Z',
      insights: [
        'Pre-push secret scanning',
        'Automatic secret removal',
        'Git secrets integration',
        'Pre-commit hooks'
      ],
      related: ['fast-backend', 'ultra-fast'],
      tags: ['security', 'git', 'automation']
    },
    {
      id: 'dr-sbaitso',
      title: 'Dr. Sbaitso CGA',
      type: 'ai',
      source: 'Internet Archive',
      extractedAt: '2026-06-07T01:46:00Z',
      insights: [
        'Early AI speech synthesis (1991)',
        'Text-to-speech technology evolution',
        'Conversational AI patterns',
        'SoundBlaster hardware integration'
      ],
      related: ['Citra Emulator', 'BitTV'],
      tags: ['ai', 'speech-synthesis', 'msdos', 'retro', 'soundblaster']
    },
    {
      id: 'cracky-coco',
      title: 'Cracky Coco',
      type: 'retro',
      source: 'Internet Archive',
      extractedAt: '2026-06-07T01:50:00Z',
      insights: [
        'MS-DOS game preservation',
        'Disk image format (DSK)',
        'DOSBox emulation compatibility',
        'Software archival techniques'
      ],
      related: ['Dr. Sbaitso', 'Citra Emulator'],
      tags: ['retro', 'gaming', 'msdos', 'disk-image', 'emulation']
    },
    {
      id: 'cryengine',
      title: 'CryEngine 5.6.5',
      type: 'game-engine',
      source: 'GitHub Bundle',
      extractedAt: '2026-06-07T01:57:00Z',
      insights: [
        'AAA game engine architecture',
        'Render pipeline design',
        'Component-based systems',
        'Cross-platform development'
      ],
      related: ['Citra Emulator', 'Dr. Sbaitso'],
      tags: ['game-engine', 'cpp', 'graphics', 'physics', 'aaa']
    },
    {
      id: 'cryengine-build-skill',
      title: 'CryEngine Build Environment',
      type: 'skills',
      source: 'Build Automation',
      extractedAt: '2026-06-07T02:05:00Z',
      insights: [
        'Permanent build environment setup',
        'Auto-recovery from 5 sources',
        'Dependency management automation',
        'Visual Studio, FBX SDK, CMake, Python setup'
      ],
      related: ['fast-backend', 'git-push-protection'],
      tags: ['build-automation', 'dependency-management', 'cryengine']
    },
    {
      id: 'universal-automation',
      title: 'Universal Automation Pattern',
      type: 'skills',
      source: 'System Architecture',
      extractedAt: '2026-06-07T02:15:00Z',
      insights: [
        'Infinite integration pattern',
        'Clean schema for all items',
        'Automatic organization via tags',
        'System always works (no breaking changes)',
        '25-minute integration cycle'
      ],
      related: ['fast-backend', 'ultra-fast'],
      tags: ['automation', 'integration', 'scalability', 'uniapp']
    }
  ];
}
