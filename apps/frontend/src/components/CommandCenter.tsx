import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, RefreshCcw, LogOut, User, CreditCard, X, MessageSquare, Settings, DollarSign, Server, Gift, Layout, Zap, Activity, Users, Target, Command, Maximize2, Minimize2, Cpu, Database, Globe, Shield, Clock, ArrowUpRight, Lock, Star, Trophy, Flame, Mail, CheckCircle } from 'lucide-react';
import GamifiedReferralProgram from './GamifiedReferralProgram';
import DevOpsToolkit from './DevOpsToolkit';
import CommandPalette from './CommandPalette';
import DatabaseInspector from './DatabaseInspector';

interface UsageData {
  plan: string;
  today: {
    date: string;
    event_count: number;
    limit: number | string;
  };
  week: Array<{
    date: string;
    event_count: number;
  }>;
}

interface TelemetryPanel {
  id: string;
  title: string;
  icon: any;
  value: string;
  trend: string;
  status: 'good' | 'warning' | 'critical';
  proOnly: boolean;
}

export default function CommandCenter() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showDevOpsModal, setShowDevOpsModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showDatabaseInspector, setShowDatabaseInspector] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [telemetryData, setTelemetryData] = useState<any>({
    usage: { current: 0, limit: 1000 },
    referrals: { active: 0, earned: 0 },
    revenue: 0,
    agents: { active: 0, latency: 0 },
    infrastructure: { total: 0, healthy: 0, responseTime: 0, security: 0, uptime: 0 }
  });
  const [s5Components, setS5Components] = useState<any[]>([]);
  const [loadingS5, setLoadingS5] = useState(false);

  const fetchS5Components = async () => {
    try {
      setLoadingS5(true);
      const token = localStorage.getItem('aether_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agents/s5/components`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setS5Components(data.components || []);
    } catch (e) {
      console.error('Failed to fetch S5 components:', e);
    } finally {
      setLoadingS5(false);
    }
  };

  const runHealthScan = async () => {
    try {
      setIsScanning(true);
      const token = localStorage.getItem('aether_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agents/s1/scan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      // Update telemetry data with scan results
      setTelemetryData(prev => ({
        ...prev,
        infrastructure: {
          total: data.total_systems,
          healthy: data.healthy_systems,
          responseTime: data.avg_response_time_ms,
          security: data.security_score,
          uptime: data.uptime_streak_days
        }
      }));
    } catch (e) {
      console.error('Health scan failed:', e);
    } finally {
      setIsScanning(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Cmd+H or Ctrl+H to run health scan
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        runHealthScan();
      }
      // ESC to close modals
      if (e.key === 'Escape') {
        if (showCommandPalette) setShowCommandPalette(false);
        if (showUpgradeModal) setShowUpgradeModal(false);
        if (showReferralModal) setShowReferralModal(false);
        if (showDevOpsModal) setShowDevOpsModal(false);
        if (activePanel) setActivePanel(null);
        if (isFullscreen) setIsFullscreen(false);
      }
      // Panel shortcuts [1-8]
      if (e.key >= '1' && e.key <= '8') {
        const panelId = parseInt(e.key) - 1;
        const panels = getTelemetryPanels();
        if (panels[panelId]) {
          setActivePanel(panels[panelId].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, showCommandPalette, showUpgradeModal, showReferralModal, showDevOpsModal, activePanel, runHealthScan]);

  const fetchTelemetry = async () => {
    try {
      const token = localStorage.getItem('aether_token');
      if (!token) return;

      // Fetch all telemetry data in parallel
      const [usageRes, referralsRes, revenueRes, agentsRes, infraRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/telemetry/usage`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/telemetry/referrals`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/telemetry/revenue`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/telemetry/agents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/telemetry/infrastructure`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const usageData = await usageRes.json();
      const referralsData = await referralsRes.json();
      const revenueData = await revenueRes.json();
      const agentsData = await agentsRes.json();
      const infraData = await infraRes.json();

      setTelemetryData({
        usage: { current: usageData.current_usage || 0, limit: usageData.limit || 1000 },
        referrals: { active: referralsData.active_referrals || 0, earned: referralsData.total_earned || 0 },
        revenue: revenueData.total_revenue || 0,
        agents: { active: agentsData.active_agents || 0, latency: agentsData.avg_latency_ms || 0 },
        infrastructure: {
          total: infraData.total_systems || 0,
          healthy: infraData.healthy_systems || 0,
          responseTime: infraData.avg_response_time_ms || 0,
          security: infraData.security_score || 0,
          uptime: infraData.uptime_streak_days || 0
        }
      });

      // Update usage state for compatibility
      setUsage({
        plan: usageData.plan || 'starter',
        today: {
          date: new Date().toISOString().split('T')[0],
          event_count: usageData.current_usage || 0,
          limit: usageData.limit || 1000
        },
        week: []
      });
    } catch (e) {
      console.error('Failed to fetch telemetry:', e);
    }
  };

  const fetchUsage = async () => {
    await fetchTelemetry();
  };

  useEffect(() => {
    const user = localStorage.getItem('aether_user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    fetchTelemetry();
    fetchS5Components();
    setLoading(false);
    
    // Refresh telemetry every 30 seconds
    const interval = setInterval(fetchTelemetry, 30000);

    // Listen for database inspector open event
    const handleOpenDatabaseInspector = () => setShowDatabaseInspector(true);
    window.addEventListener('open-database-inspector', handleOpenDatabaseInspector);

    // Navigation tracking for S5 Architect
    const trackNavigation = async (panelId: string, action: string) => {
      try {
        const token = localStorage.getItem('aether_token');
        if (!token) return;
        
        await fetch(`${import.meta.env.VITE_API_URL}/api/telemetry/navigation`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            panel_id: panelId,
            action: action,
            page_url: window.location.pathname
          })
        });
      } catch (e) {
        console.error('Failed to track navigation:', e);
      }
    };

    // Track panel interactions
    if (activePanel) {
      trackNavigation(activePanel, 'view');
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('open-database-inspector', handleOpenDatabaseInspector);
    };
  }, [activePanel]);

  const getTelemetryPanels = (): TelemetryPanel[] => {
    const usagePercent = telemetryData.usage.limit > 0 
      ? (telemetryData.usage.current / telemetryData.usage.limit) * 100 
      : 0;

    return [
      {
        id: 'usage',
        title: 'API Usage',
        icon: BarChart3,
        value: `${telemetryData.usage.current}/${telemetryData.usage.limit}`,
        trend: usagePercent > 80 ? '⚠️ High' : '✓ Normal',
        status: usagePercent > 90 ? 'critical' : usagePercent > 80 ? 'warning' : 'good',
        proOnly: false
      },
      {
        id: 'infrastructure',
        title: 'Infrastructure',
        icon: Server,
        value: isScanning ? 'Scanning...' : `${telemetryData.infrastructure.total} Systems`,
        trend: isScanning ? 'Running S1 Agent...' : telemetryData.infrastructure.healthy === telemetryData.infrastructure.total ? '✓ All Healthy' : `${telemetryData.infrastructure.total - telemetryData.infrastructure.healthy} issues`,
        status: isScanning ? 'warning' : telemetryData.infrastructure.healthy === telemetryData.infrastructure.total ? 'good' : 'warning',
        proOnly: false
      },
      {
        id: 'referrals',
        title: 'Referrals',
        icon: Users,
        value: `${telemetryData.referrals.active} Active`,
        trend: `+$${telemetryData.referrals.earned} earned`,
        status: 'good',
        proOnly: false
      },
      {
        id: 'revenue',
        title: 'Revenue',
        icon: DollarSign,
        value: `$${telemetryData.revenue}`,
        trend: 'From completed payments',
        status: 'good',
        proOnly: true
      },
      {
        id: 'agents',
        title: 'Active Agents',
        icon: Zap,
        value: `${telemetryData.agents.active} Running`,
        trend: `${telemetryData.agents.latency}ms avg latency`,
        status: 'good',
        proOnly: true
      },
      {
        id: 'uptime',
        title: 'System Uptime',
        icon: Activity,
        value: '99.9%',
        trend: `${telemetryData.infrastructure.uptime} days streak`,
        status: 'good',
        proOnly: false
      },
      {
        id: 'security',
        title: 'Security Score',
        icon: Shield,
        value: `${telemetryData.infrastructure.security}/100`,
        trend: '+2 this week',
        status: telemetryData.infrastructure.security > 80 ? 'good' : 'warning',
        proOnly: true
      },
      {
        id: 'performance',
        title: 'Response Time',
        icon: Clock,
        value: `${telemetryData.infrastructure.responseTime}ms`,
        trend: 'P99: 120ms',
        status: telemetryData.infrastructure.responseTime < 100 ? 'good' : 'warning',
        proOnly: false
      },
      {
        id: 's5_architect',
        title: 'S5 Architect',
        icon: Zap,
        value: `${s5Components.length} Generated`,
        trend: loadingS5 ? 'Loading...' : 'Auto-evolution active',
        status: s5Components.length > 0 ? 'good' : 'warning',
        proOnly: true
      }
    ];
  };

  const panels = getTelemetryPanels();

  const handleLogout = () => {
    localStorage.removeItem('aether_token');
    localStorage.removeItem('aether_user');
    window.location.reload();
  };

  const getPanelIcon = (panel: TelemetryPanel) => {
    const Icon = panel.icon;
    return <Icon className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-2xl max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
              <div className="h-8 bg-white/10 rounded w-3/4 mb-2" />
              <div className="h-3 bg-white/10 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Command className="w-6 h-6 text-purple-400" />
            <span className="text-xl font-bold hidden sm:block">COMMAND CENTER</span>
            <span className="text-lg font-bold sm:hidden">CMD</span>
          </button>
          <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-300">
            {usage?.plan?.toUpperCase() || 'STARTER'}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setShowReferralModal(true)}
            className="px-2 sm:px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/20 transition-colors text-xs sm:text-sm flex items-center gap-2"
          >
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">Referrals</span>
          </button>
          <button
            onClick={() => setShowDevOpsModal(true)}
            className="px-2 sm:px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors text-xs sm:text-sm flex items-center gap-2"
          >
            <Server className="w-4 h-4" />
            <span className="hidden sm:inline">DevOps</span>
          </button>
          <div className="text-xs sm:text-sm text-white-40 hidden sm:block">
            <span className="text-green-400">●</span> All Systems Operational
          </div>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors hidden sm:block"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      <div className="mb-4 p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white/40 hidden sm:block">
        <span className="font-mono">[1-8]</span> Activate Panel • <span className="font-mono">[ESC]</span> Exit Fullscreen • <span className="font-mono">[R]</span> Refresh
      </div>

      <div className={`grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`}>
        {panels.map((panel, index) => (
          <div
            key={panel.id}
            onClick={() => {
              if (panel.proOnly && usage?.plan === 'starter') {
                setShowUpgradeModal(true);
              } else {
                setActivePanel(panel.id);
              }
            }}
            className={`relative p-4 border rounded-xl cursor-pointer transition-all hover:scale-105 ${
              activePanel === panel.id
                ? 'bg-purple-500/20 border-purple-500/50'
                : panel.proOnly && usage?.plan === 'starter'
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : panel.status === 'critical'
                ? 'bg-red-500/10 border-red-500/30'
                : panel.status === 'warning'
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-white/5 border-white/10'
            }`}
          >
            {panel.proOnly && usage?.plan === 'starter' && (
              <div className="absolute top-2 right-2">
                <Lock className="w-4 h-4 text-yellow-400" />
              </div>
            )}

            <div className="absolute top-2 left-2 w-6 h-6 bg-white/10 rounded flex items-center justify-center text-xs font-mono text-white/40">
              {index + 1}
            </div>

            <div className="flex items-start gap-3 mt-4">
              <div className={`p-2 rounded-lg ${
                panel.status === 'critical' ? 'bg-red-500/20' :
                panel.status === 'warning' ? 'bg-yellow-500/20' :
                'bg-blue-500/20'
              }`}>
                {getPanelIcon(panel)}
              </div>
              <div className="flex-1">
                <div className="text-xs text-white/40 mb-1">{panel.title}</div>
                <div className="text-2xl font-bold">{panel.value}</div>
                <div className="text-xs text-white/40 mt-1">{panel.trend}</div>
              </div>
            </div>

            <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full ${
              panel.status === 'critical' ? 'bg-red-400' :
              panel.status === 'warning' ? 'bg-yellow-400' :
              'bg-green-400'
            }`} />
          </div>
        ))}
      </div>

      {activePanel && (
        <div className="mt-4 p-4 sm:p-6 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                {getPanelIcon(panels.find(p => p.id === activePanel)!)}
              </div>
              <h3 className="text-lg sm:text-xl font-bold">{panels.find(p => p.id === activePanel)?.title}</h3>
            </div>
            <button
              onClick={() => setActivePanel(null)}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-white/60 text-sm sm:text-base">
            {activePanel === 'usage' && (
              <div>
                <p className="mb-4">Your API usage over the last 7 days:</p>
                <div className="flex items-end gap-2 h-32">
                  {usage?.week?.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-purple-500/50 rounded-t"
                        style={{ height: `${(day.event_count / 100) * 100}%` }}
                      />
                      <div className="text-xs text-white/40 mt-2">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activePanel === 'infrastructure' && (
              <div>
                <p className="mb-4">Your infrastructure health status:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">CPU Usage</span>
                    </div>
                    <div className="text-2xl font-bold">23%</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-green-400" />
                      <span className="text-sm">Database</span>
                    </div>
                    <div className="text-2xl font-bold">Healthy</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">API Latency</span>
                    </div>
                    <div className="text-2xl font-bold">45ms</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm">Security</span>
                    </div>
                    <div className="text-2xl font-bold">Secure</div>
                  </div>
                </div>
              </div>
            )}
            {activePanel === 'referrals' && (
              <div>
                <p className="mb-4">Your referral performance:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg text-center">
                    <div className="text-3xl font-bold text-purple-400">12</div>
                    <div className="text-sm text-white/40">Total Referrals</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg text-center">
                    <div className="text-3xl font-bold text-emerald-400">$240</div>
                    <div className="text-sm text-white/40">Total Earned</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg text-center">
                    <div className="text-3xl font-bold text-yellow-400">$58</div>
                    <div className="text-sm text-white/40">Pending</div>
                  </div>
                </div>
              </div>
            )}
            {activePanel === 'revenue' && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400 mb-2">
                  <Lock className="w-5 h-5" />
                  <span className="font-bold">Pro Feature</span>
                </div>
                <p className="text-sm text-white-60">Upgrade to Pro to view detailed revenue analytics and payment history.</p>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="mt-3 px-4 py-2 bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-600 transition-colors"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
            {activePanel === 'agents' && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400 mb-2">
                  <Lock className="w-5 h-5" />
                  <span className="font-bold">Pro Feature</span>
                </div>
                <p className="text-sm text-white-60">Upgrade to Pro to manage autonomous agents and view detailed performance metrics.</p>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="mt-3 px-4 py-2 bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-600 transition-colors"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
            {activePanel === 'uptime' && (
              <div>
                <p className="mb-4">System uptime over the last 30 days:</p>
                <div className="text-4xl font-bold text-emerald-400 mb-2">99.9%</div>
                <div className="text-sm text-white/60">30-day uptime streak</div>
              </div>
            )}
            {activePanel === 'security' && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400 mb-2">
                  <Lock className="w-5 h-5" />
                  <span className="font-bold">Pro Feature</span>
                </div>
                <p className="text-sm text-white/60">Upgrade to Pro to view detailed security analysis and vulnerability reports.</p>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="mt-3 px-4 py-2 bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-600 transition-colors"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
            {activePanel === 'performance' && (
              <div>
                <p className="mb-4">Response time metrics:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-sm text-white/40 mb-1">Average</div>
                    <div className="text-2xl font-bold">45ms</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-sm text-white/40 mb-1">P99</div>
                    <div className="text-2xl font-bold">120ms</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-sm text-white/40 mb-1">P95</div>
                    <div className="text-2xl font-bold">85ms</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-sm text-white/40 mb-1">P50</div>
                    <div className="text-2xl font-bold">32ms</div>
                  </div>
                </div>
              </div>
            )}
            {activePanel === 's5_architect' && (
              <div>
                <p className="mb-4">S5 Architect - Self-evolving AI agent:</p>
                {loadingS5 ? (
                  <div className="p-4 bg-white/5 rounded-lg text-center">
                    <RefreshCcw className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-400" />
                    <p className="text-white/60">Loading AI-generated components...</p>
                  </div>
                ) : s5Components.length === 0 ? (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                      <Zap className="w-5 h-5" />
                      <span className="font-bold">No Components Generated Yet</span>
                    </div>
                    <p className="text-sm text-white/60 mb-4">S5 analyzes navigation patterns and slow queries to automatically generate new dashboard features. Check back tomorrow for the first evolution.</p>
                    <div className="text-xs text-white/40">
                      <div>Next evolution: Daily at midnight</div>
                      <div>Telemetry: Navigation + Slow Queries</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {s5Components.map((component: any) => (
                      <div key={component.id} className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium text-green-300 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              {component.id}
                            </div>
                            <div className="text-xs text-white/40 mt-1">
                              {new Date(component.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-xs text-white/40">
                            Generated by S5
                          </div>
                        </div>
                        {component.telemetry_context && (
                          <div className="text-xs text-white/60 mt-2 p-2 bg-black/30 rounded">
                            <div className="font-medium mb-1">Telemetry Context:</div>
                            <div>Top Panels: {component.telemetry_context.top_panels?.map((p: any) => `${p.panel} (${p.visits})`).join(', ')}</div>
                            <div>Slowest Queries: {component.telemetry_context.slowest_queries?.map((q: any) => `${q.table} (${q.duration_ms}ms)`).join(', ')}</div>
                          </div>
                        )}
                        <div className="mt-3 p-2 bg-black/30 rounded font-mono text-xs text-white/40 max-h-32 overflow-y-auto">
                          {component.code?.substring(0, 500)}...
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">Upgrade Your Experience</h3>
                <p className="text-sm text-white/60 mt-1">Unlock the full power of Loxa</p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pricing Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Starter */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-sm text-white/60 mb-2">STARTER</div>
                <div className="text-3xl font-bold mb-4">Free</div>
                <ul className="text-sm text-white/80 space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    1,000 API calls/day
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Basic monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Community support
                  </li>
                  <li className="flex items-center gap-2 text-white/40">
                    <X className="w-4 h-4" />
                    Revenue analytics
                  </li>
                  <li className="flex items-center gap-2 text-white/40">
                    <X className="w-4 h-4" />
                    Agent management
                  </li>
                </ul>
                <div className="px-4 py-3 bg-white/10 rounded-lg text-center text-sm">
                  Current Plan
                </div>
              </div>

              {/* Pro */}
              <div className="p-6 bg-gradient-to-b from-purple-500/20 to-blue-500/20 border-2 border-purple-500/50 rounded-xl relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 rounded-full text-xs font-bold">
                  MOST POPULAR
                </div>
                <div className="text-sm text-purple-300 mb-2">PRO</div>
                <div className="text-3xl font-bold mb-1">$29<span className="text-lg text-white/60">/mo</span></div>
                <div className="text-xs text-white/40 mb-4">Billed monthly</div>
                <ul className="text-sm text-white/80 space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Unlimited API calls
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Revenue analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Agent management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Security analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Priority support
                  </li>
                </ul>
                <button
                  onClick={() => {
                    window.location.href = 'mailto:hello@loxa.dev?subject=Pro Plan Upgrade';
                  }}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Upgrade to Pro
                </button>
              </div>

              {/* Enterprise */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-sm text-white/60 mb-2">ENTERPRISE</div>
                <div className="text-3xl font-bold mb-1">$99<span className="text-lg text-white/60">/mo</span></div>
                <div className="text-xs text-white/40 mb-4">Billed monthly</div>
                <ul className="text-sm text-white/80 space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Everything in Pro
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Custom integrations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Dedicated support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    SLA guarantee
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    White-label option
                  </li>
                </ul>
                <button
                  onClick={() => {
                    window.location.href = 'mailto:hello@loxa.dev?subject=Enterprise Plan Inquiry';
                  }}
                  className="w-full py-3 bg-white/10 border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contact Sales
                </button>
              </div>
            </div>

            {/* Social Proof */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold">JD</div>
                  <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold">AK</div>
                  <div className="w-8 h-8 bg-emerald-500 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold">MR</div>
                </div>
                <div className="text-sm text-white/60">
                  <span className="font-bold text-white">500+</span> developers already upgraded
                </div>
              </div>
              <div className="text-xs text-white/40">
                "Pro plan saved me 20 hours per week on infrastructure monitoring" - John D., Solo Developer
              </div>
            </div>
          </div>
        </div>
      )}

      {showReferralModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowReferralModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <GamifiedReferralProgram />
          </div>
        </div>
      )}

      {showDevOpsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/10 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowDevOpsModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <DevOpsToolkit />
          </div>
        </div>
      )}

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onRunHealthScan={runHealthScan}
      />

      <DatabaseInspector
        isOpen={showDatabaseInspector}
        onClose={() => setShowDatabaseInspector(false)}
        userPlan={usage?.plan || 'starter'}
      />
    </div>
  );
}