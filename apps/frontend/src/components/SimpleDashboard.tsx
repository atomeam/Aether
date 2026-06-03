import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, RefreshCcw, LogOut, User, CreditCard, X, MessageSquare, Settings, DollarSign, Server, Gift, Layout, Zap, Activity, Users, Target, Command, Maximize2, Minimize2 } from 'lucide-react';
import Support from './Support';
import RevenueDashboard from './RevenueDashboard';
import PaymentHistory from './PaymentHistory';
import InfrastructureMonitor from './InfrastructureMonitor';
import UserOnboarding from './UserOnboarding';
import ReferralProgram from './ReferralProgram';
import FeedbackSystem from './FeedbackSystem';
import ProfitEngine from './ProfitEngine';
import { authenticatedFetch } from '../lib/api';

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

export default function SimpleDashboard() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'usage' | 'support' | 'revenue' | 'payments' | 'infrastructure' | 'referral' | 'profit'>('usage');
  const [changingPlan, setChangingPlan] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');

  const usagePercent = typeof usage?.today?.limit === 'number' 
    ? (usage.today.api_calls / usage.today.limit) * 100 
    : 0;
  const isNearLimit = usagePercent > 80;
  const isOverLimit = usagePercent >= 100;

  const fetchCsrfToken = async () => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/auth/csrf-token`);
      const data = await response.json();
      if (data.csrf_token) {
        setCsrfToken(data.csrf_token);
      }
    } catch (e) {
      console.error("Failed to fetch CSRF token:", e);
    }
  };

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/usage`);
      const data = await response.json();
      setUsage(data);
    } catch (e: any) {
      console.error("Failed to fetch usage:", e);
    } finally {
      setLoading(false);
    }
  };

  const changePlan = async (newPlan: string) => {
    try {
      setChangingPlan(true);
      
      // Create Stripe checkout session
      const response = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/payments/stripe/create-checkout`, {
        method: 'POST',
        body: JSON.stringify({ plan: newPlan })
      });
      const data = await response.json();
      
      if (data.success && data.checkout_url) {
        // Track plan upgrade event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'begin_checkout', {
            items: [{
              item_id: newPlan,
              item_name: `${newPlan} Plan`,
              price: 29,
              quantity: 1
            }]
          });
        }
        
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        setError(data.error || 'Failed to initiate payment');
      }
    } catch (e: any) {
      console.error("Failed to change plan:", e);
      setError('Failed to initiate payment');
    } finally {
      setChangingPlan(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setChangingPlan(true);
      const response = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/subscription/cancel`, {
        method: 'POST',
        body: JSON.stringify({ csrf_token })
      });
      const data = await response.json();
      if (data.success) {
        // Track cancellation event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'subscription_cancel', {
            method: 'dashboard'
          });
        }
        
        setShowCancelModal(false);
        fetchCsrfToken();
        fetchUsage();
      }
    } catch (e: any) {
      console.error("Failed to cancel subscription:", e);
    } finally {
      setChangingPlan(false);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('aether_user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    fetchUsage();
    fetchCsrfToken();
    
    // Listen for tab switch events from onboarding
    const handleTabSwitch = (event: CustomEvent) => {
      setActiveTab(event.detail as any);
    };
    
    window.addEventListener('switch-tab', handleTabSwitch as EventListener);
    
    return () => {
      window.removeEventListener('switch-tab', handleTabSwitch as EventListener);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('aether_token');
    localStorage.removeItem('aether_user');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-4">
          <RefreshCcw className="w-5 h-5 text-blue-400 animate-pulse" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-white/60">Welcome back, {currentUser?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('usage')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'usage'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Usage
          </button>
          <button
            onClick={() => setActiveTab('infrastructure')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'infrastructure'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Infrastructure
          </button>
          <button
            onClick={() => setActiveTab('profit')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'profit'
                ? 'bg-emerald-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Profit Engine
          </button>
          <button
            onClick={() => setActiveTab('referral')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'referral'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Referral
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'support'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Support
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'revenue'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'payments'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Payments
          </button>
        </div>

        {/* Tab Content */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-4 text-red-400 hover:text-red-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'usage' && (
          <>
            {/* Today's Usage */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Today's Usage</h2>
            {isOverLimit && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400 font-bold">LIMIT EXCEEDED</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Events</span>
              <span className="text-white/90 font-mono">
                {usage?.today.event_count} / {usage?.today.limit}
              </span>
            </div>
            
            {typeof usage?.today.limit === 'number' && (
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            )}

            {isNearLimit && !isOverLimit && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-400/80">
                    You're approaching your daily limit. Upgrade to Pro for unlimited events.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Usage */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-white/60" />
            <h2 className="text-lg font-bold">Last 7 Days</h2>
          </div>

          <div className="space-y-2">
            {usage?.week.map((day, i) => {
              const maxCount = Math.max(...usage.week.map(d => d.event_count), 1);
              const barWidth = (day.event_count / maxCount) * 100;
              
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-white/40 font-mono">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                    <div 
                      className="h-full bg-blue-500/50 transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm text-white/60 font-mono text-right">
                    {day.event_count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan Management */}
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60 mb-1">Current Plan</p>
              <p className="text-lg font-bold text-purple-400 capitalize">{usage?.plan}</p>
            </div>
            <div className="flex gap-2">
              {usage?.plan === 'starter' && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-4 py-2 bg-purple-500 text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Upgrade to Pro
                </button>
              )}
              {usage?.plan !== 'starter' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
          </>
        )}

        {activeTab === 'infrastructure' && <InfrastructureMonitor />}

        {activeTab === 'profit' && <ProfitEngine />}

        {activeTab === 'referral' && <ReferralProgram />}

        {activeTab === 'support' && <Support />}

        {activeTab === 'revenue' && <RevenueDashboard />}

        {activeTab === 'payments' && <PaymentHistory />}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-black border border-white/10 rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Upgrade Your Plan</h3>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <h4 className="font-bold text-emerald-400 mb-2">Pro Plan - $29/mo</h4>
                  <ul className="text-sm text-white/80 space-y-1">
                    <li>✓ Unlimited events</li>
                    <li>✓ Unlimited AI proposals</li>
                    <li>✓ Advanced monitoring</li>
                    <li>✓ Priority support</li>
                    <li>✓ API access</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <h4 className="font-bold text-purple-400 mb-2">Enterprise Plan - $99/mo</h4>
                  <ul className="text-sm text-white/80 space-y-1">
                    <li>✓ Everything in Pro</li>
                    <li>✓ Dedicated support</li>
                    <li>✓ Custom integrations</li>
                    <li>✓ SLA guarantee</li>
                    <li>✓ Priority feature requests</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60">
                  <p>💳 Secure payment powered by Stripe</p>
                  <p class="text-xs mt-1">You'll be redirected to Stripe's secure checkout to complete your payment.</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => changePlan('pro')}
                    disabled={changingPlan}
                    className="flex-1 py-3 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                  >
                    {changingPlan ? 'Processing...' : 'Pro - $29'}
                  </button>
                  <button
                    onClick={() => changePlan('enterprise')}
                    disabled={changingPlan}
                    className="flex-1 py-3 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                  >
                    {changingPlan ? 'Processing...' : 'Enterprise - $99'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-black border border-white/10 rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Cancel Subscription</h3>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-white/60 mb-6">
                Are you sure you want to cancel your subscription? Your account will be downgraded to the Starter plan with limited features.
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={cancelSubscription}
                  disabled={changingPlan}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {changingPlan ? 'Processing...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    <UserOnboarding />
    <FeedbackSystem />
    </>
  );
}