import { createPagesHandler } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';

export const onRequest: PagesFunction = async (context) => {
  // Serve OneHub as the only page
  const url = new URL(context.request.url);
  
  // Always serve the OneHub page
  return new NextResponse(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>a-to-mind OneHub</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect } = React;
    const { Activity, Zap, Brain, Database, Workflow, Globe, Shield, BarChart, Cpu } = lucide;

    function OneHub() {
      const [systemStatus, setSystemStatus] = useState({
        backend: 'online',
        frontend: 'online',
        mcp: 'active',
        performance: 'optimized'
      });
      const [knowledge, setKnowledge] = useState([
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
        }
      ]);

      const Card = ({ children, className }) => (
        <div className={\`bg-slate-800/50 border border-slate-700 rounded-lg \${className || ''}\`}>
          {children}
        </div>
      );

      const Badge = ({ children, variant }) => (
        <span className={\`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold \${variant === 'outline' ? 'border-purple-500 text-purple-300' : 'bg-slate-700 text-slate-300'}\`}>
          {children}
        </span>
      );

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
          <div className="max-w-7xl mx-auto">
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-6">
                <div className="text-slate-200 text-sm mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Backend
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-white font-medium">{systemStatus.backend}</span>
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-slate-200 text-sm mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Frontend
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-white font-medium">{systemStatus.frontend}</span>
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-slate-200 text-sm mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  MCP Server
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-white font-medium">{systemStatus.mcp}</span>
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-slate-200 text-sm mb-2 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Performance
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-white font-medium">{systemStatus.performance}</span>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-6">
                <div className="text-slate-200 text-sm mb-2">Total Knowledge</div>
                <div className="text-3xl font-bold text-white">{knowledge.length}</div>
              </Card>
              <Card className="p-6">
                <div className="text-slate-200 text-sm mb-2">Categories</div>
                <div className="text-3xl font-bold text-white">5</div>
              </Card>
              <Card className="p-6">
                <div className="text-slate-200 text-sm mb-2">Connections</div>
                <div className="text-3xl font-bold text-white">{knowledge.reduce((acc, k) => acc + k.related.length, 0)}</div>
              </Card>
              <Card className="p-6">
                <div className="text-slate-200 text-sm mb-2">Last Update</div>
                <div className="text-lg font-bold text-white">June 7, 2026</div>
              </Card>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Extracted Knowledge</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {knowledge.map((item) => (
                  <Card key={item.id} className="p-6 hover:border-purple-500 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-white font-semibold">{item.title}</h3>
                      <Badge variant="outline">{item.type}</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Source</div>
                        <div className="text-sm text-slate-200">{item.source}</div>
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
                        <div className="text-xs text-slate-400 mb-1">Tags</div>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="border-slate-600 text-slate-400">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
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
                  <Card key={idx} className="p-6">
                    <cap.icon className="w-8 h-8 text-purple-400 mb-3" />
                    <h3 className="text-white font-semibold mb-1">{cap.name}</h3>
                    <p className="text-slate-400 text-sm">{cap.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<OneHub />);
  </script>
</body>
</html>
  `, {
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

export default {
  fetch: onRequest,
};
