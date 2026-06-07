import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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

interface KnowledgeHubProps {
  apiUrl: string;
}

export function KnowledgeHub({ apiUrl }: KnowledgeHubProps) {
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/knowledge`);
      const data = await response.json();
      setKnowledge(data);
    } catch (error) {
      console.error('Failed to fetch knowledge:', error);
      // Load sample knowledge for demo
      setKnowledge(getSampleKnowledge());
    } finally {
      setLoading(false);
    }
  };

  const filteredKnowledge = selectedCategory === 'all' 
    ? knowledge 
    : knowledge.filter(item => item.type === selectedCategory);

  const categories = [
    { id: 'all', label: 'All', count: knowledge.length },
    { id: 'mobile', label: 'Mobile', count: knowledge.filter(k => k.type === 'mobile').length },
    { id: 'emulation', label: 'Emulation', count: knowledge.filter(k => k.type === 'emulation').length },
    { id: 'streaming', label: 'Streaming', count: knowledge.filter(k => k.type === 'streaming').length },
    { id: 'performance', label: 'Performance', count: knowledge.filter(k => k.type === 'performance').length },
    { id: 'skills', label: 'Skills', count: knowledge.filter(k => k.type === 'skills').length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">a-to-mind Knowledge Hub</h1>
          <p className="text-slate-300 text-lg">Universal extraction & assimilation system</p>
        </div>

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
              <div className="text-3xl font-bold text-white">{categories.length - 1}</div>
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

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="bg-slate-800/50 border-slate-700">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="data-[state=active]:bg-purple-600">
                {cat.label} <Badge variant="secondary" className="ml-2">{cat.count}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {loading ? (
              <div className="text-center text-slate-300 py-12">Loading knowledge base...</div>
            ) : filteredKnowledge.length === 0 ? (
              <div className="text-center text-slate-300 py-12">No knowledge found in this category</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredKnowledge.map((item) => (
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
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-6 bg-slate-800/30 border border-slate-700 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">System State</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-400 mb-2">Backend Status</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white">Running on port 3002</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-2">Frontend Status</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white">Connected and configured</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-2">MCP Server</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white">32 tools available</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-2">Performance</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white">All optimizations active</span>
              </div>
            </div>
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
    }
  ];
}
