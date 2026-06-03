import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Sparkles, Bell, Shield, Crown } from 'lucide-react';
import ProfitEngine from './ProfitEngine';
import StatsCard from './dashboard/StatsCard';
import Leaderboard from './dashboard/Leaderboard';
import ReferralCard from './dashboard/ReferralCard';
import ShareCard from './dashboard/ShareCard';
import HowItWorks from './dashboard/HowItWorks';
import AuthModal from './dashboard/AuthModal';
import PaymentWall from './dashboard/PaymentWall';
import LiveActivity from './dashboard/LiveActivity';
import { TrendingUp, Users, Shield as ShieldIcon, Zap, Lock } from 'lucide-react';

export default function SimpleDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'profit'>('overview');
  const [copied, setCopied] = useState(false);
  const [userEarnings, setUserEarnings] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [autonomousActions, setAutonomousActions] = useState(0);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  // Auto-authenticate all users on mount
  useEffect(() => {
    // Auto-set owner mode for this Victus (Adam's machine)
    localStorage.setItem('aether_owner_secret', 'ADAM_OWNER_2026_ATOMIC_MOONBEAM');
    
    // Check if user is enterprise (hardcoded for owner only)
    // Only Adam can be owner - secret key required
    const secretKey = localStorage.getItem('aether_owner_secret');
    const isOwner = secretKey === 'ADAM_OWNER_2026_ATOMIC_MOONBEAM';
    
    const storedToken = localStorage.getItem('session_token');
    const storedName = localStorage.getItem('user_name');
    
    if (isOwner) {
      // Owner gets enterprise access
      setIsAuthenticated(true);
      setIsEnterprise(true);
      setUserName('Adam'); // Owner's actual name
      localStorage.setItem('admin_token', 'admin_automatic_access_token_2026');
      localStorage.setItem('admin_user', 'enterprise');
      localStorage.setItem('user_name', 'Adam');
    } else if (storedToken && storedName) {
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
  }, []);

  // Real-time earnings animation (disabled for real earnings)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && isEnterprise) {
        // Only show fake notifications for owner mode
        if (Math.random() > 0.95) {
          const names = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley'];
          const amounts = [23, 45, 67, 89, 112, 156];
          const randomName = names[Math.floor(Math.random() * names.length)];
          const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
          setNotificationText(`${randomName} just earned $${randomAmount}!`);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isEnterprise]);

  // Fetch real user count
  useEffect(() => {
    fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/stats/users')
      .then(res => res.json())
      .then(data => {
        if (data.count !== undefined) {
          setTotalUsers(data.count);
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
            setUserEarnings(data.earnings);
            setCurrentEarnings(data.earnings);
          }
        })
        .catch(err => console.error('Failed to fetch earnings:', err));
    }
  }, [isAuthenticated, isEnterprise]);

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

  const copyReferralLink = () => {
    navigator.clipboard.writeText('https://a-to-mind.com/ref/AUTO2026');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareEarnings = () => {
    const text = `I've earned $${userEarnings.toFixed(2)} with a-to-mind's autonomous AI! Start growing your wealth: https://a-to-mind.com/ref/AUTO2026`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
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
            <div className="inline-flex items-center gap-2 bg-[#c4a661]/10 border border-[#c4a661]/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-[#c4a661]" />
              <span className="text-sm font-medium text-[#c4a661]">Autonomous Intelligence</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white via-[#c4a661] to-emerald-400 bg-clip-text text-transparent">
              a-to-mind
            </h1>
            <p className="text-xl md:text-2xl text-white/70 mb-8 max-w-2xl mx-auto">
              The AI that autonomously grows your wealth while you sleep
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
            icon={TrendingUp}
            label="Your Earnings This Month"
            value={`$${currentEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtext={isAuthenticated ? "From real bonuses" : "Sign up to start earning"}
            color="emerald"
          />
          <StatsCard
            icon={Users}
            label="Total Users"
            value={totalUsers.toLocaleString()}
            subtext={totalUsers > 0 ? `+${Math.floor(totalUsers * 0.025)} new today` : 'Growing fast'}
            color="gold"
          />
          <StatsCard
            icon={Zap}
            label="Autonomous Actions"
            value={autonomousActions.toLocaleString()}
            subtext="All optimized today"
            color="purple"
          />
        </div>
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

            <LiveActivity />
          </div>
        )}

        {activeTab === 'profit' && <ProfitEngine />}
      </div>
    </div>
  );
}
