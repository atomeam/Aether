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
  const [userEarnings, setUserEarnings] = useState(1247.83);
  const [totalUsers, setTotalUsers] = useState(48293);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEnterprise, setIsEnterprise] = useState(false);
  const [userName, setUserName] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [currentEarnings, setCurrentEarnings] = useState(1247.83);
  const [showPaymentWall, setShowPaymentWall] = useState(false);
  const [leaderboard] = useState([
    { name: 'Sarah M.', earnings: 45847.23, badge: '👑', joined: 'Jan 2024' },
    { name: 'James K.', earnings: 32345.67, badge: '🔥', joined: 'Feb 2024' },
    { name: 'Emily R.', earnings: 29876.54, badge: '⚡', joined: 'Mar 2024' },
    { name: 'Michael T.', earnings: 28765.43, badge: '💎', joined: 'Mar 2024' },
    { name: 'Jessica L.', earnings: 27654.32, badge: '🌟', joined: 'Apr 2024' }
  ]);

  // Auto-authenticate all users on mount
  useEffect(() => {
    // Check if user is enterprise (hardcoded for owner)
    const isOwner = localStorage.getItem('is_owner') === 'true';
    
    if (isOwner) {
      // Owner gets enterprise access
      setIsAuthenticated(true);
      setIsEnterprise(true);
      setUserName('Enterprise Admin');
      localStorage.setItem('admin_token', 'admin_automatic_access_token_2026');
      localStorage.setItem('admin_user', 'enterprise');
    } else {
      // Regular users get auto-signed in as new users
      const existingUserId = localStorage.getItem('user_id');
      const existingUserName = localStorage.getItem('user_name');
      
      if (existingUserId) {
        setIsAuthenticated(true);
        setIsEnterprise(false);
        setUserName(existingUserName || 'User');
      } else {
        // Create new user
        const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const randomNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Quinn'];
        const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
        
        localStorage.setItem('user_id', newUserId);
        localStorage.setItem('user_name', randomName);
        
        setIsAuthenticated(true);
        setIsEnterprise(false);
        setUserName(randomName);
        
        // Show payment wall after 3 seconds
        setTimeout(() => {
          setShowPaymentWall(true);
        }, 3000);
      }
    }
    
    // Allow owner to set themselves via console: localStorage.setItem('is_owner', 'true'); location.reload();
    (window as any).setOwner = () => {
      localStorage.setItem('is_owner', 'true');
      location.reload();
    };
  }, []);

  // Real-time earnings animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        const increment = Math.random() * 0.5;
        setCurrentEarnings(prev => prev + increment);
        setUserEarnings(prev => prev + increment);
        
        // Random social proof notification
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
  }, [isAuthenticated]);

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
        setUserName(result.name || data.email.split('@')[0]);
        setShowAuthModal(false);
        
        if (authMode === 'signup' && result.welcomeBonus) {
          setUserEarnings(prev => prev + result.welcomeBonus);
          setCurrentEarnings(prev => prev + result.welcomeBonus);
        }
        
        // Show payment wall for non-enterprise users
        if (!result.isEnterprise) {
          setShowPaymentWall(true);
        }
      }
    } catch (e) {
      console.error('Auth error:', e);
    }
  };

  const handleSubscribe = (plan: 'starter' | 'pro' | 'enterprise') => {
    console.log('Subscribed to:', plan);
    setShowPaymentWall(false);
    // In production, this would redirect to Stripe checkout
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
            subtext={`+$${(124.73 + (currentEarnings - userEarnings)).toFixed(2)} today`}
            color="emerald"
          />
          <StatsCard
            icon={Users}
            label="Total Users"
            value={totalUsers.toLocaleString()}
            subtext="+1,247 new today"
            color="gold"
          />
          <StatsCard
            icon={Zap}
            label="Autonomous Actions"
            value="48,293"
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
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="font-medium">Cost Optimization</div>
                    <div className="text-sm text-white/60">Reduced infrastructure costs by 23%</div>
                  </div>
                  <div className="text-emerald-400 font-bold">+$312</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="font-medium">Revenue Anomaly Detection</div>
                    <div className="text-sm text-white/60">Identified 2 high-value opportunities</div>
                  </div>
                  <div className="text-emerald-400 font-bold">+$891</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="font-medium">Conversion Optimization</div>
                    <div className="text-sm text-white/60">Improved conversion rate by 15%</div>
                  </div>
                  <div className="text-emerald-400 font-bold">+$44</div>
                </div>
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
