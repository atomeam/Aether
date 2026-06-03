import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, Sparkles, Bell, Shield, Crown } from 'lucide-react';
import ProfitEngine from './ProfitEngine';
import StatsCard from './dashboard/StatsCard';
import Leaderboard from './dashboard/Leaderboard';
import ReferralCard from './dashboard/ReferralCard';
import ShareCard from './dashboard/ShareCard';
import HowItWorks from './dashboard/HowItWorks';
import AuthModal from './dashboard/AuthModal';
import PaymentWall from './dashboard/PaymentWall';
import CouncilTelemetry from './dashboard/CouncilTelemetry';
import SystemStatus from './dashboard/SystemStatus';
import PipelineVisibility from './dashboard/PipelineVisibility';
import DemoBanner from './ui/DemoBanner';
import PaymentCalculationPanel from './admin/PaymentCalculationPanel';
import { TrendingUp, Users, Shield as ShieldIcon, Zap, Lock } from 'lucide-react';
import { createVerifiedData, createUnverifiedData, VerifiedData } from '../types/verifiedData';

export default function SimpleDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'profit'>('overview');
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
  // const [optimizationResults, setOptimizationResults] = useState<any[]>([]);
  // DISABLED - compliance fix: removed fake financial data
  // const [financialData, setFinancialData] = useState<any[]>([]);
  // const [showOptimizationPanel, setShowOptimizationPanel] = useState(false);
  // const [showFinancialPanel, setShowFinancialPanel] = useState(false);
  // DISABLED - compliance fix: removed fake revenue summary
  // const [revenueSummary, setRevenueSummary] = useState<any>(null);
  // const [showRevenuePanel, setShowRevenuePanel] = useState(false);
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
    // Remove any automatic owner/enterprise access
    localStorage.removeItem('aether_owner_secret');

    const storedToken = localStorage.getItem('session_token');
    const storedName = localStorage.getItem('user_name');

    if (storedToken && storedName) {
      // Returning user with real session - validate with API
      fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/user/dashboard', {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      })
        .then(res => {
          if (res.ok) {
            setIsAuthenticated(true);
            setIsEnterprise(false);
            setUserName(storedName);
          } else {
            // Invalid token, clear and show auth modal
            localStorage.removeItem('session_token');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_id');
            setShowAuthModal(true);
          }
        })
        .catch(() => {
          // API error, show auth modal
          setShowAuthModal(true);
        });
    } else {
      // New user - show auth modal
      setShowAuthModal(true);
    }
    
    // Secret function to set owner mode - only Adam knows this
    (window as any).setOwnerMode = (secret: string) => {
      if (secret === 'ADAM_OWNER_2026_ATOMIC_MOONBEAM') {
        localStorage.setItem('aether_owner_secret', secret);
        location.reload();
      } else {
        console.error('Invalid secret key');
      }
    };
    
    // Allow user to logout: window.logout()
    (window as any).logout = () => {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_id');
      localStorage.removeItem('aether_owner_secret');
      location.reload();
    };
    
    // Allow owner to view all users: window.viewUsers()
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

    // DISABLED - compliance fix: removed fake optimization results
    // (window as any).viewOptimizations = async () => {
    //   console.log('Loading optimizations...');
    //   try {
    //     const response = await fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/optimization/results', {
    //       headers: { 'Authorization': 'Bearer ADAM_OWNER_2026_ATOMIC_MOONBEAM' }
    //     });
    //     const data = await response.json();

    //     if (response.ok) {
    //       setOptimizationResults(data.optimizations);
    //       setShowOptimizationPanel(true);
    //       console.log('Optimizations loaded:', data.optimizations.length);
    //     } else {
    //       console.error('Failed to load optimizations:', data.error);
    //       alert('Failed to load optimizations: ' + data.error);
    //     }
    //   } catch (e) {
    //     console.error('Error loading optimizations:', e);
    //     alert('Error loading optimizations: ' + e);
    //   }
    // };

    // DISABLED - compliance fix: removed fake financial data
    // (window as any).viewFinancialData = async () => {
    //   console.log('Loading financial data...');
    //   try {
    //     const response = await fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/financial/summary', {
    //       headers: { 'Authorization': 'Bearer ADAM_OWNER_2026_ATOMIC_MOONBEAM' }
    //     });
    //     const data = await response.json();

    //     if (response.ok) {
    //       setFinancialData(data.financialData);
    //       setShowFinancialPanel(true);
    //       console.log('Financial data loaded:', data.financialData.length, 'data types');
    //     } else {
    //       console.error('Failed to load financial data:', data.error);
    //       alert('Failed to load financial data: ' + data.error);
    //     }
    //   } catch (e) {
    //     console.error('Error loading financial data:', e);
    //     alert('Error loading financial data: ' + e);
    //   }
    // };

    // DISABLED - compliance fix: removed fake revenue summary
    // (window as any).viewRevenueSummary = async () => {
    //   console.log('Loading revenue summary...');
    //   try {
    //     const response = await fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/revenue/summary', {
    //       headers: { 'Authorization': 'Bearer ADAM_OWNER_2026_ATOMIC_MOONBEAM' }
    //     });
    //     const data = await response.json();

    //     if (response.ok) {
    //       setRevenueSummary(data);
    //       setShowRevenuePanel(true);
    //       console.log('Revenue summary loaded:', data);
    //     } else {
    //       console.error('Failed to load revenue summary:', data.error);
    //       alert('Failed to load revenue summary: ' + data.error);
    //     }
    //   } catch (e) {
    //     console.error('Error loading revenue summary:', e);
    //     alert('Error loading revenue summary: ' + e);
    //   }
    // };

    // Allow owner to trigger manual optimization: window.runOptimization()
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
          // DISABLED - compliance fix: removed fake optimization results refresh
          // setTimeout(() => (window as any).viewOptimizations(), 1000);
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

  // Real-time earnings animation (DISABLED - compliance fix: no fake data)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (isAuthenticated && isEnterprise) {
  //       // Only show fake notifications for owner mode
  //       if (Math.random() > 0.95) {
  //         const names = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley'];
  //         const amounts = [23, 45, 67, 89, 112, 156];
  //         const randomName = names[Math.floor(Math.random() * names.length)];
  //         const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
  //         setNotificationText(`${randomName} just earned $${randomAmount}!`);
  //         setShowNotification(true);
  //         setTimeout(() => setShowNotification(false), 3000);
  //       }
  //     }
  //   }, 2000);
  //   return () => clearInterval(interval);
  // }, [isAuthenticated, isEnterprise]);

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

  // Fetch real user earnings (Net cash received from Stripe)
  useEffect(() => {
    const token = localStorage.getItem('session_token');
    if (token && isAuthenticated && !isEnterprise) {
      fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/user/earnings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.earnings !== undefined) {
            // Use VerifiedData with definition for real money
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
          // Keep unverified state on error
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
      // For owner mode, count all profit_engine actions
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
            // Refresh all data when update signal detected
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
            
            // Refresh earnings for authenticated users
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
    }, 30000); // Check every 30 seconds

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
        
        // Store real session token
        if (result.sessionToken) {
          localStorage.setItem('session_token', result.sessionToken);
        }
        localStorage.setItem('user_name', result.name || data.name || data.email.split('@')[0]);
        localStorage.setItem('user_id', result.userId);
        
        if (authMode === 'signup' && result.welcomeBonus) {
          setUserEarnings(prev => prev + result.welcomeBonus);
          setCurrentEarnings(prev => prev + result.welcomeBonus);
        }
        
        // Show payment wall for non-enterprise users
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

  const handleSubscribe = async (plan: 'starter' | 'pro' | 'enterprise') => {
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('session_token');
    
    try {
      const response = await fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/payment/create-checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan, userId, email: formData.email })
      });
      const result = await response.json();
      if (response.ok && result.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = result.checkoutUrl;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (e) {
      console.error('Checkout error:', e);
      alert('Connection error. Please try again.');
    }
  };

  const connectBankAccount = () => {
    console.log('Connect bank account clicked');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#0f0f0f] text-white">
      {/* Demo Banner - 0 Lies Mode */}
      {showDemoBanner && <DemoBanner />}

      {/* Social Proof Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-xl rounded-xl p-4 flex items-center gap-3 z-50 animate-in slide-in-from-right">
          <Bell className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{notificationText}</span>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        mode={authMode}
        onClose={() => setShowAuthModal(false)}
        onModeChange={setAuthMode}
        onSubmit={handleAuth}
        formData={formData}
        onFormDataChange={setFormData}
      />

      {/* DISABLED - compliance fix: removed fake panels */}
      {/* - Optimization Results panel (fake metrics) */}
      {/* - Revenue Summary panel (fake metrics) */}
      {/* - Financial Data panel (fake metrics) */}

      {/* Users Panel (Owner Only) */}
      {showUsersPanel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">All Users ({allUsers.length})</h2>
              <button
                onClick={() => setShowUsersPanel(false)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              {allUsers.map((user, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.name || 'Unknown'}</div>
                      <div className="text-sm text-white/60">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white/60">Referral: {user.referral_code}</div>
                      <div className="text-xs text-white/40">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toastType === 'success' ? 'bg-emerald-500' : 
          toastType === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white font-medium animate-pulse`}>
          {toastMessage}
        </div>
      )}

      {/* Payment Wall */}
      <PaymentWall
        isOpen={showPaymentWall}
        onClose={() => setShowPaymentWall(false)}
        onSubscribe={handleSubscribe}
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#c4a661]/20 to-emerald-500/20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-8 py-16">
          <div className="text-center">
            <div className="flex items-center gap-2 bg-[#c4a661]/10 border border-[#c4a661]/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-[#c4a661]" />
              <span className="text-sm font-medium text-[#c4a661]">Autonomous Intelligence</span>
              {isEnterprise && (
                <>
                  <button
                    onClick={() => (window as any).runOptimization()}
                    className="ml-2 text-xs text-white/60 hover:text-white cursor-pointer"
                    title="Run optimization now (Owner only)"
                    disabled={isOptimizing}
                  >
                    {isOptimizing ? '⏳' : '🚀'}
                  </button>
                  <button
                    onClick={() => (window as any).viewUsers()}
                    className="ml-2 text-xs text-white/60 hover:text-white cursor-pointer"
                    title="View all users (Owner only)"
                  >
                    👥
                  </button>
                  {/* DISABLED - compliance fix: removed fake optimization results button */}
                  {/* <button
                    onClick={() => (window as any).viewOptimizations()}
                    className="ml-2 text-xs text-white/60 hover:text-white cursor-pointer"
                    title="View optimization results (Owner only)"
                  >
                    ⚡
                  </button> */}
                  {/* DISABLED - compliance fix: removed fake financial data button */}
                  {/* <button
                    onClick={() => (window as any).viewFinancialData()}
                    className="ml-2 text-xs text-white/60 hover:text-white cursor-pointer"
                    title="View financial data (Owner only)"
                  >
                    💰
                  </button> */}
                  {/* DISABLED - compliance fix: removed fake revenue summary button */}
                  {/* <button
                    onClick={() => (window as any).viewRevenueSummary()}
                    className="ml-2 text-xs text-white/60 hover:text-white cursor-pointer"
                    title="View revenue summary (Owner only)"
                  >
                    📊
                  </button> */}
                </>
              )}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white via-[#c4a661] to-emerald-400 bg-clip-text text-transparent">
              Loxa
            </h1>
            <p className="text-xl md:text-2xl text-white/70 mb-8 max-w-2xl mx-auto">
              The World's First Autonomous Business Engine. Aether's S1-S5 agent council builds infrastructure, scales revenue, and optimizes growth while you focus on what matters.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isAuthenticated ? (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="group bg-gradient-to-r from-[#c4a661] to-[#d4b671] text-black font-bold px-8 py-4 rounded-full text-lg hover:shadow-lg hover:shadow-[#c4a661]/30 transition-all flex items-center gap-2"
                >
                  Start Autonomous Growth
                  <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              ) : (
                <div className={`rounded-full px-6 py-3 flex items-center gap-2 ${
                  isEnterprise 
                    ? 'bg-[#c4a661]/20 border border-[#c4a661]/50' 
                    : 'bg-emerald-500/20 border border-emerald-500/30'
                }`}>
                  {isEnterprise ? (
                    <>
                      <Crown className="w-5 h-5 text-[#c4a661]" />
                      <span className="text-[#c4a661] font-medium">Enterprise Admin</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Welcome, {userName}!</span>
                    </>
                  )}
                </div>
              )}
              <button className="bg-white/5 border border-white/20 text-white font-medium px-8 py-4 rounded-full text-lg hover:bg-white/10 transition-all">
                See How It Works
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="max-w-7xl mx-auto px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            icon={Users}
            label="Total Users"
            data={totalUsers}
            color="emerald"
          />
          <StatsCard
            icon={Zap}
            label="Autonomous Actions"
            data={autonomousActions}
            color="gold"
          />
          <StatsCard
            icon={TrendingUp}
            label="Your Earnings"
            data={userEarnings}
            color="purple"
            showDefinition={true}
            showRawLink={userEarnings.verified}
            onViewCalculation={() => setShowPaymentCalculationPanel(true)}
          />
        </div>
      </div>

      {/* System Status */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <SystemStatus />
      </div>

      {/* Pipeline Visibility */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <PipelineVisibility />
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

            <CouncilTelemetry />
          </div>
        )}

        {activeTab === 'profit' && <ProfitEngine />}
      </div>

      {/* Payment Calculation Panel (Admin) */}
      <PaymentCalculationPanel
        isOpen={showPaymentCalculationPanel}
        onClose={() => setShowPaymentCalculationPanel(false)}
        calculation={null}
      />
    </div>
  );
}
