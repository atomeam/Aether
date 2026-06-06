import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, Sparkles, Bell, Shield, Crown, Server, Zap, RefreshCw, Activity } from 'lucide-react';
import ProfitEngine from './ProfitEngine';
import StatsCard from './dashboard/StatsCard';
import Leaderboard from './dashboard/Leaderboard';
import ReferralCard from './dashboard/ReferralCard';
import ShareCard from './dashboard/ShareCard';
import HowItWorks from './dashboard/HowItWorks';
import AuthModal from './dashboard/AuthModal';
import PaymentWall from './dashboard/PaymentWall';
import DemoBanner from './ui/DemoBanner';
import PaymentCalculationPanel from './admin/PaymentCalculationPanel';
import { UAPSystemStatus } from './UAPSystemStatus';
import AutomationDashboard from './AutomationDashboard';
import { TrendingUp, Users, Shield as ShieldIcon, Lock } from 'lucide-react';
import { createVerifiedData, createUnverifiedData, VerifiedData } from '../types/verifiedData';

// Inline System Status Component
function InlineSystemStatus() {
  const [systemStatus, setSystemStatus] = React.useState<any>(null);
  const [agentStatus, setAgentStatus] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const stackRes = await fetch('http://localhost:3000/api/stack');
      const stackData = await stackRes.json();
      setSystemStatus(stackData);

      const agentsRes = await fetch('http://localhost:3000/api/agents');
      const agentsData = await agentsRes.json();
      setAgentStatus(agentsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 border border-white/5 bg-white/[0.01] rounded-lg">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="text-sm text-white/60">Loading system status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-500/20 bg-red-500/[0.02] rounded-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="text-red-400 text-sm">Error: {error}</div>
          <button 
            onClick={fetchAllData}
            className="text-red-400 hover:text-red-300"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-[#c4a661]" />
          System Status
        </h2>
        <button 
          onClick={fetchAllData}
          className="text-white/60 hover:text-white/90 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-3 flex items-center gap-2">
            <Server className="w-4 h-4" />
            Backend
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">Status</span>
              <span className={`text-xs font-medium ${systemStatus?.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                {systemStatus?.status || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">Backend</span>
              <span className="text-xs font-medium text-white/90">
                {systemStatus?.backend || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Agents
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">Curator</span>
              <span className={`text-xs font-medium ${agentStatus?.curator === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                {agentStatus?.curator || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">Executor</span>
              <span className={`text-xs font-medium ${agentStatus?.executor === 'ready' ? 'text-green-400' : 'text-yellow-400'}`}>
                {agentStatus?.executor || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">MCP Server</span>
              <span className={`text-xs font-medium ${agentStatus?.mcpServer === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                {agentStatus?.mcpServer || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-3 flex items-center gap-2">
          <Server className="w-4 h-4" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button 
            onClick={() => window.open('http://localhost:3000/api/stack', '_blank')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors"
          >
            View Stack
          </button>
          <button 
            onClick={() => window.open('http://localhost:3000/api/agents', '_blank')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors"
          >
            View Agents
          </button>
          <button 
            onClick={() => window.open('http://localhost:3000/api/health', '_blank')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors"
          >
            Health Check
          </button>
          <button 
            onClick={() => window.open('http://localhost:3000/api/nexus/registry', '_blank')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors"
          >
            Nexus Registry
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SimpleDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'profit' | 'automations'>('overview');
  const [copied, setCopied] = useState(false);
  const [userEarnings, setUserEarnings] = useState<VerifiedData<number>>(createUnverifiedData(0, 'Stripe: payments table'));
  const [totalUsers, setTotalUsers] = useState<VerifiedData<number>>(createUnverifiedData(0, 'D1: users table'));
  const [autonomousActions, setAutonomousActions] = useState<VerifiedData<number>>(createUnverifiedData(0, 'D1: agent_actions table'));
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(false);
  const [showPaymentCalculationPanel, setShowPaymentCalculationPanel] = useState(false);

  // Check if any data is in demo mode
  useEffect(() => {
    const hasDemoData = totalUsers.is_demo || autonomousActions.is_demo;
    setShowDemoBanner(hasDemoData);
  }, [totalUsers, autonomousActions]);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const optimizingRef = useRef(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEnterprise, setIsEnterprise] = useState(false);
  const [userName, setUserName] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [currentEarnings, setCurrentEarnings] = useState(0);
  const [showPaymentWall, setShowPaymentWall] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  // Check for existing authentication session
  useEffect(() => {
    localStorage.removeItem('aether_owner_secret');

    const storedToken = localStorage.getItem('session_token');
    const storedName = localStorage.getItem('user_name');

    if (storedToken && storedName) {
      fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/user/dashboard', {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      })
        .then(res => {
          if (res.ok) {
            setIsAuthenticated(true);
            setIsEnterprise(false);
            setUserName(storedName);
          } else {
            localStorage.removeItem('session_token');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_id');
            setShowAuthModal(true);
          }
        })
        .catch(() => {
          setShowAuthModal(true);
        });
    } else {
      setShowAuthModal(true);
    }
    
    (window as any).setOwnerMode = (secret: string) => {
      if (secret === 'ADAM_OWNER_2026_ATOMIC_MOONBEAM') {
        localStorage.setItem('aether_owner_secret', secret);
        location.reload();
      } else {
        console.error('Invalid secret key');
      }
    };
    
    (window as any).logout = () => {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_id');
      localStorage.removeItem('aether_owner_secret');
      location.reload();
    };
    
    (window as any).viewUsers = async () => {
      console.log('Loading users...');
      try {
        const response = await fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/admin/users', {
          headers: { 'Authorization': 'Bearer ADAM_OWNER_2026_ATOMIC_MOONBEAM' }
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
          setAllUsers(data.users);
          setShowUsersPanel(true);
          console.log('Users loaded successfully:', data.users.length, 'users');
        } else {
          console.error('Failed to load users:', data.error);
          alert('Failed to load users: ' + data.error);
        }
      } catch (e) {
        console.error('Error loading users:', e);
        alert('Error loading users: ' + e);
      }
    };

    (window as any).runOptimization = async () => {
      if (optimizingRef.current) {
        showToastMessage('Optimization already in progress', 'info');
        return;
      }
      
      optimizingRef.current = true;
      setIsOptimizing(true);
      showToastMessage('Starting optimization...', 'info');
      
      try {
        const response = await fetch('https://aether-api.atomicmoonbeam88.workers.dev/cron/5min', {
          method: 'GET'
        });
        const data = await response.json();
        
        if (response.ok) {
          showToastMessage(`Optimization complete! ${data.tasksExecuted} tasks executed`, 'success');
        } else {
          showToastMessage('Optimization failed: ' + data.error, 'error');
        }
      } catch (e) {
        showToastMessage('Error running optimization: ' + e, 'error');
      } finally {
        optimizingRef.current = false;
        setIsOptimizing(false);
      }
    };
  }, []);

  // Fetch real user count
  useEffect(() => {
    fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/stats/users')
      .then(res => res.json())
      .then(data => {
        if (data.count !== undefined) {
          setTotalUsers(createVerifiedData(data.count, 'D1: users table'));
        }
      })
      .catch(err => console.error('Failed to fetch user count:', err));
  }, []);

  // Fetch real user earnings
  useEffect(() => {
    const token = localStorage.getItem('session_token');
    if (token && isAuthenticated && !isEnterprise) {
      fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/user/earnings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.earnings !== undefined) {
            setUserEarnings(createVerifiedData(
              data.earnings,
              'Stripe: payments table',
              {
                definition: 'Net cash received = Stripe payments captured - refunds - fees'
              }
            ));
          }
        })
        .catch(err => {
          console.error('Failed to fetch earnings:', err);
        });
    }
  }, [isAuthenticated, isEnterprise]);

  // Fetch real autonomous actions
  useEffect(() => {
    fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/activity/recent')
      .then(res => res.json())
      .then(data => {
        if (data.actions && data.actions.length > 0) {
          setAutonomousActions(createVerifiedData(data.actions.length, 'D1: agent_actions table'));
        }
      })
      .catch(err => console.error('Failed to fetch autonomous actions:', err));
  }, []);

  // Fetch real leaderboard
  useEffect(() => {
    fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch(err => console.error('Failed to fetch leaderboard:', err));
  }, []);

  // Fetch real autonomous actions
  useEffect(() => {
    const token = localStorage.getItem('session_token');
    if (token && isAuthenticated) {
      fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/actions/recent', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.actions) {
            setRecentActions(data.actions);
            setAutonomousActions(data.totalCount || data.actions.length);
          }
        })
        .catch(err => console.error('Failed to fetch actions:', err));
    } else {
      fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/actions/recent')
        .then(res => res.json())
        .then(data => {
          if (data.totalCount) {
            setAutonomousActions(data.totalCount);
          }
        })
        .catch(err => console.error('Failed to fetch actions:', err));
    }
  }, [isAuthenticated]);

  // Check for frontend update signals every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/frontend/update-check')
        .then(res => res.json())
        .then(data => {
          if (data.needsUpdate) {
            fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/stats/users')
              .then(res => res.json())
              .then(userData => {
                if (userData.count !== undefined) {
                  setTotalUsers(userData.count);
                }
              });
            
            fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/leaderboard')
              .then(res => res.json())
              .then(lbData => {
                if (lbData.leaderboard) {
                  setLeaderboard(lbData.leaderboard);
                }
              });
            
            const token = localStorage.getItem('session_token');
            if (token && isAuthenticated && !isEnterprise) {
              fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/user/earnings', {
                headers: { 'Authorization': `Bearer ${token}` }
              })
                .then(res => res.json())
                .then(earningsData => {
                  if (earningsData.earnings !== undefined) {
                    setUserEarnings(earningsData.earnings);
                    setCurrentEarnings(earningsData.earnings);
                  }
                });
            }
          }
        })
        .catch(err => console.error('Failed to check for updates:', err));
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isEnterprise]);

  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText('https://a-to-mind.com/ref/AUTO2026');
    setCopied(true);
    showToastMessage('Referral link copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareEarnings = () => {
    const text = `I've earned $${userEarnings.toFixed(2)} with Loxa's autonomous AI! Start growing your wealth: https://a-to-mind.com/ref/AUTO2026`;
    if (navigator.share) {
      navigator.share({ text });
      showToastMessage('Shared successfully!', 'success');
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      showToastMessage('Earnings copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAuth = async (data: { email: string; password: string; name: string }) => {
    const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
    try {
      const response = await fetch(`https://aether-api.atomicmoonbeam88.workers.dev${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (response.ok) {
        setIsAuthenticated(true);
        setIsEnterprise(result.isEnterprise || false);
        setUserName(result.name || data.name || data.email.split('@')[0]);
        setShowAuthModal(false);
        
        if (result.sessionToken) {
          localStorage.setItem('session_token', result.sessionToken);
        }
        localStorage.setItem('user_name', result.name || data.name || data.email.split('@')[0]);
        localStorage.setItem('user_id', result.userId);
        
        if (authMode === 'signup' && result.welcomeBonus) {
          setUserEarnings(prev => prev + result.welcomeBonus);
          setCurrentEarnings(prev => prev + result.welcomeBonus);
        }
        
        if (!result.isEnterprise) {
          setTimeout(() => {
            setShowPaymentWall(true);
          }, 3000);
        }
      } else {
        alert(result.error || 'Authentication failed');
      }
    } catch (e) {
      console.error('Auth error:', e);
      alert('Connection error. Please try again.');
    }
  };

  const connectBankAccount = () => {
    showToastMessage('Bank account connection coming soon!', 'info');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {showDemoBanner && <DemoBanner />}
      
      {showToast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          toastType === 'success' ? 'bg-green-500' : toastType === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {toastMessage}
        </div>
      )}

      {showNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-[#c4a661] text-black rounded-lg shadow-lg z-50">
          {notificationText}
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#c4a661] to-[#8b7355] rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Aether</h1>
              <p className="text-xs text-white/60">Autonomous Business Engine</p>
            </div>
          </div>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">{userName}</div>
                <div className="text-xs text-white/60">
                  {isEnterprise ? 'Enterprise' : 'Free Plan'}
                </div>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#c4a661]" />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2 bg-[#c4a661] text-black rounded-lg font-medium hover:bg-[#d4b671] transition-colors"
            >
              Get Started
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Users"
            value={totalUsers.value}
            icon={<Users className="w-5 h-5" />}
            source={totalUsers.source}
            isDemo={totalUsers.is_demo}
          />
          <StatsCard
            title="Autonomous Actions"
            value={autonomousActions.value}
            icon={<Zap className="w-5 h-5" />}
            source={autonomousActions.source}
            isDemo={autonomousActions.is_demo}
          />
          {isAuthenticated && (
            <StatsCard
              title="Your Earnings"
              value={userEarnings.value}
              icon={<TrendingUp className="w-5 h-5" />}
              source={userEarnings.source}
              isDemo={userEarnings.is_demo}
              definition={userEarnings.definition}
            />
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <InlineSystemStatus />
      </div>

      {/* UAP Detection System - 20 Subsystems */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <UAPSystemStatus />
      </div>

      {/* Share Earnings CTA */}
      {isAuthenticated && (
        <div className="max-w-7xl mx-auto px-8 py-8">
          <ShareCard onShare={shareEarnings} earnings={userEarnings} />
        </div>
      )}

      {/* Leaderboard */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Leaderboard
          entries={leaderboard}
          userEntry={isAuthenticated ? { name: `You (${userName})`, earnings: currentEarnings } : undefined}
        />
      </div>

      {/* Referral Program */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <ReferralCard
          referralLink="a-to-mind.com/ref/AUTO2026"
          onCopy={copyReferralLink}
          copied={copied}
        />
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-[#c4a661] text-black shadow-lg shadow-[#c4a661]/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('profit')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'profit'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Profit Engine
          </button>
          <button
            onClick={() => setActiveTab('automations')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'automations'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Automations
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#c4a661]" />
                Recent Autonomous Actions
              </h3>
              <div className="space-y-3">
                {recentActions.length > 0 ? (
                  recentActions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <div className="font-medium capitalize">{action.action.replace(/_/g, ' ')}</div>
                        <div className="text-sm text-white/60">Status: {action.status}</div>
                      </div>
                      {action.amount && (
                        <div className="text-emerald-400 font-bold">+${action.amount.toFixed(2)}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/40 py-4">
                    No recent actions
                  </div>
                )}
              </div>
            </div>

            <HowItWorks
              isAuthenticated={isAuthenticated}
              onConnectBank={connectBankAccount}
            />
          </div>
        )}

        {activeTab === 'profit' && <ProfitEngine />}

        {activeTab === 'automations' && <AutomationDashboard />}
      </div>

      {/* Payment Calculation Panel (Admin) */}
      <PaymentCalculationPanel
        isOpen={showPaymentCalculationPanel}
        onClose={() => setShowPaymentCalculationPanel(false)}
      />

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
          onModeChange={setAuthMode}
        />
      )}

      {/* Payment Wall */}
      {showPaymentWall && (
        <PaymentWall
          onClose={() => setShowPaymentWall(false)}
        />
      )}

      {/* Users Panel (Admin) */}
      {showUsersPanel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">All Users</h2>
              <button
                onClick={() => setShowUsersPanel(false)}
                className="text-white/60 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="space-y-2">
              {allUsers.map((user, index) => (
                <div key={index} className="p-3 bg-white/5 rounded-lg">
                  <div className="font-medium">{user.name || user.email}</div>
                  <div className="text-sm text-white/60">{user.email}</div>
                  <div className="text-xs text-white/40">Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}