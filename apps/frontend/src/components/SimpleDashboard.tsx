import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Sparkles, TrendingUp, Shield, Zap, Users, Gift, Copy, Check, X, Mail, Lock, User } from 'lucide-react';
import ProfitEngine from './ProfitEngine';

export default function SimpleDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'profit'>('overview');
  const [copied, setCopied] = useState(false);
  const [userEarnings, setUserEarnings] = useState(1247.83);
  const [totalUsers, setTotalUsers] = useState(12483);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');

  const copyReferralLink = () => {
    navigator.clipboard.writeText('https://a-to-mind.com/ref/AUTO2026');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAuth = async () => {
    const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
    try {
      const response = await fetch(`https://aether-api.atomicmoonbeam88.workers.dev${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        setIsAuthenticated(true);
        setUserName(data.name || formData.email.split('@')[0]);
        setShowAuthModal(false);
        if (authMode === 'signup' && data.welcomeBonus) {
          setUserEarnings(prev => prev + data.welcomeBonus);
        }
      }
    } catch (e) {
      console.error('Auth error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#0f0f0f] text-white">
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{authMode === 'signup' ? 'Start Autonomous Growth' : 'Welcome Back'}</h2>
              <button onClick={() => setShowAuthModal(false)} className="text-white/60 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#c4a661]"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm text-white/60 mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#c4a661]"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-white/60 mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#c4a661]"
                  />
                </div>
              </div>
              
              {authMode === 'signup' && (
                <div className="bg-[#c4a661]/10 border border-[#c4a661]/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#c4a661] font-medium">
                    <Gift className="w-5 h-5" />
                    <span>$50 Welcome Bonus</span>
                  </div>
                  <p className="text-sm text-white/60 mt-1">Start with $50 in autonomous earnings</p>
                </div>
              )}
              
              <button
                onClick={handleAuth}
                className="w-full bg-gradient-to-r from-[#c4a661] to-[#d4b671] text-black font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-[#c4a661]/30 transition-all"
              >
                {authMode === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
              
              <div className="text-center text-sm text-white/60">
                {authMode === 'signup' ? (
                  <>
                    Already have an account?{' '}
                    <button onClick={() => setAuthMode('login')} className="text-[#c4a661] hover:underline">Sign in</button>
                  </>
                ) : (
                  <>
                    New to a-to-mind?{' '}
                    <button onClick={() => setAuthMode('signup')} className="text-[#c4a661] hover:underline">Create account</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
            
            {/* Main CTA */}
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
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-full px-6 py-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Welcome, {userName}!</span>
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
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm text-white/60">Your Earnings This Month</div>
                <div className="text-3xl font-bold text-emerald-400">${userEarnings.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
              </div>
            </div>
            <div className="text-sm text-white/40">+${124.73} today</div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#c4a661]/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-[#c4a661]" />
              </div>
              <div>
                <div className="text-sm text-white/60">Total Users</div>
                <div className="text-3xl font-bold text-[#c4a661]">{totalUsers.toLocaleString()}</div>
              </div>
            </div>
            <div className="text-sm text-white/40">+247 new today</div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-white/60">Autonomous Actions</div>
                <div className="text-3xl font-bold text-purple-400">1,247</div>
              </div>
            </div>
            <div className="text-sm text-white/40">All optimized today</div>
          </div>
        </div>
      </div>

      {/* Referral Program */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="bg-gradient-to-r from-[#c4a661]/10 to-emerald-500/10 border border-[#c4a661]/30 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#c4a661]/20 rounded-2xl flex items-center justify-center">
                <Gift className="w-8 h-8 text-[#c4a661]" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Earn $50 for every friend</h3>
                <p className="text-white/60">Share a-to-mind and you both get $50 when they sign up</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex-1 bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-sm text-white/60 font-mono">
                a-to-mind.com/ref/AUTO2026
              </div>
              <button 
                onClick={copyReferralLink}
                className="bg-[#c4a661] text-black font-medium px-4 py-3 rounded-lg hover:bg-[#d4b671] transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#c4a661]" />
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

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#c4a661]" />
                How a-to-mind Works
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-[#c4a661]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[#c4a661] font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-medium">Connect Your Accounts</div>
                    <div className="text-sm text-white/60">Link your financial data sources securely via Plaid</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-[#c4a661]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[#c4a661] font-bold">2</span>
                  </div>
                  <div>
                    <div className="font-medium">AI Analyzes 24/7</div>
                    <div className="text-sm text-white/60">Our engine finds optimization opportunities autonomously</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-[#c4a661]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[#c4a661] font-bold">3</span>
                  </div>
                  <div>
                    <div className="font-medium">Watch Your Wealth Grow</div>
                    <div className="text-sm text-white/60">Sit back while a-to-mind maximizes your returns</div>
                  </div>
                </div>
              </div>
              
              {isAuthenticated && (
                <button className="w-full mt-6 bg-gradient-to-r from-[#c4a661] to-[#d4b671] text-black font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-[#c4a661]/30 transition-all flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5" />
                  Connect Bank Account
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profit' && <ProfitEngine />}
      </div>
    </div>
  );
}
