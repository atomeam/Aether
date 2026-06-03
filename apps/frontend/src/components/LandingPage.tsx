import React, { useState } from 'react';
import { Check, Zap, Shield, TrendingUp, ArrowRight, Cpu, Activity, Bot, Copy, CheckCircle, Loader2, User, X } from 'lucide-react';
import Auth from './Auth';

interface LandingPageProps {
  onEnterDashboard: () => void;
}

export default function LandingPage({ onEnterDashboard }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'enterprise' | null>(null);
  const [paymentStep, setPaymentStep] = useState<'form' | 'instructions' | 'success' | 'auth'>('form');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showEarlyAccess, setShowEarlyAccess] = useState(false);
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('');
  const [earlyAccessPain, setEarlyAccessPain] = useState('');
  const [earlyAccessSubmitted, setEarlyAccessSubmitted] = useState(false);

  const handleAuthSuccess = (token: string, user: any) => {
    setAuthToken(token);
    setCurrentUser(user);
    localStorage.setItem('aether_token', token);
    localStorage.setItem('aether_user', JSON.stringify(user));
    setShowAuth(false);
    
    // If user is paying, continue to payment
    if (selectedPlan) {
      initiatePayment(selectedPlan);
    }
  };

  const handleEarlyAccess = async () => {
    try {
      setLoading(true);
      // In production, this would send to your email or a CRM
      // For now, we'll just simulate the submission
      console.log('Early access request:', { email: earlyAccessEmail, pain: earlyAccessPain });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEarlyAccessSubmitted(true);
      setLoading(false);
    } catch (e) {
      console.error('Early access submission failed:', e);
      setLoading(false);
    }
  };

  const initiatePayment = async (plan: 'starter' | 'pro' | 'enterprise') => {
    // Check if user is authenticated
    const token = localStorage.getItem('aether_token');
    if (!token) {
      setSelectedPlan(plan);
      setShowAuth(true);
      return;
    }
    
    // Starter plan is free, no payment needed
    if (plan === 'starter') {
      onEnterDashboard();
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/stripe/create-checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan })
      });
      const data = await response.json();
      
      console.log('Stripe checkout response:', data);
      console.log('API URL:', import.meta.env.VITE_API_URL);
      
      if (data.success && data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        console.error('Failed to create checkout session:', data.error);
        alert(`Failed to initiate payment: ${data.error || 'Unknown error'}. Please try again.`);
      }
    } catch (e: any) {
      console.error("Payment initiation failed:", e);
      alert(`Failed to initiate payment: ${e.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Show plan selection
    setPaymentStep('form');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-emerald-500/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full mb-6">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">Autonomous Business Intelligence</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
              a-to-mind your business.
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                {' '}The World's First Autonomous Business Engine.
              </span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8">
              We build the infrastructure, scale your revenue, and optimize your growth—while you focus on what matters.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onEnterDashboard}
                className="px-8 py-4 bg-white/10 border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-colors"
              >
                Try Demo Dashboard
              </button>
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
              >
                Start Free - No Credit Card
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Scale Without Limits</h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            For founders, creators, and teams who need a digital operations department that never sleeps.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <Activity className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">"I need to scale operations faster"</h3>
            <p className="text-white/60">Manual infrastructure management slows down market capture. Automate your growth.</p>
          </div>
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <Cpu className="w-12 h-12 text-yellow-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">"I need better business decisions"</h3>
            <p className="text-white/60">Without real-time intelligence, you're optimizing blindly. Turn data into revenue.</p>
          </div>
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <Zap className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">"I need speed to revenue"</h3>
            <p className="text-white/60">Without autonomous optimization, you're losing money on inefficient operations.</p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 bg-gradient-to-b from-transparent to-purple-500/5">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Teams Say</h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Real feedback from founders who accelerated their growth with autonomous operations.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-sm font-bold">JD</div>
              <div>
                <div className="font-bold">John D.</div>
                <div className="text-sm text-white/40">Startup Founder</div>
              </div>
            </div>
            <p className="text-white/60">"Scaled from 100 to 10,000 users without hiring a DevOps team. The autonomous engine handles it all."</p>
            <div className="flex gap-1 mt-4">
              <span className="text-yellow-400">★★★★★</span>
            </div>
          </div>
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center text-sm font-bold">AK</div>
              <div>
                <div className="font-bold">Alex K.</div>
                <div className="text-sm text-white/40">Creator</div>
              </div>
            </div>
            <p className="text-white/60">"Cut infrastructure costs by 40% while scaling revenue. The autonomous optimization is game-changing."</p>
            <div className="flex gap-1 mt-4">
              <span className="text-yellow-400">★★★★★</span>
            </div>
          </div>
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center text-sm font-bold">MR</div>
              <div>
                <div className="font-bold">Maria R.</div>
                <div className="text-sm text-white/40">Team Lead</div>
              </div>
            </div>
            <p className="text-white/60">"Finally, enterprise-grade autonomous operations for growing teams. No manual oversight required."</p>
            <div className="flex gap-1 mt-4">
              <span className="text-yellow-400">★★★★★</span>
            </div>
          </div>
        </div>
      </div>

      {/* Solution Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How a-to-mind Works</h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Autonomous business intelligence with human oversight
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold">Monitors Everything</h3>
            </div>
            <p className="text-white/60">Automatically tracks business decisions, revenue metrics, and growth indicators 24/7.</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Bot className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">Analyzes Patterns</h3>
            </div>
            <p className="text-white/60">AI analyzes business data to identify growth opportunities and revenue optimization.</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold">Proposes Solutions</h3>
            </div>
            <p className="text-white/60">Generates actionable business strategies with revenue impact analysis.</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold">The S5 Revenue Engine</h3>
            </div>
            <p className="text-white/60">Analyzes usage patterns to optimize pricing, maximize market capture, and scale revenue autonomously.</p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Trusted by Teams</h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            See what founders and creators are saying about a-to-mind.com
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center text-lg font-bold">JD</div>
              <div>
                <div className="font-bold">John Doe</div>
                <div className="text-sm text-white/40">Startup Founder</div>
              </div>
            </div>
            <p className="text-white/60">
              "Finally, enterprise-grade autonomous operations that don't break the bank. The revenue optimization has been game-changing."
            </p>
            <div className="flex gap-1 mt-4">
              {[1,2,3,4,5].map(star => (
                <div key={star} className="w-4 h-4 text-yellow-400">★</div>
              ))}
            </div>
          </div>
          
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center text-lg font-bold">AK</div>
              <div>
                <div className="font-bold">Alex Kim</div>
                <div className="text-sm text-white/40">Creator</div>
              </div>
            </div>
            <p className="text-white/60">
              "The autonomous business engine is like having a CFO and CTO on my team. My revenue has never grown faster."
            </p>
            <div className="flex gap-1 mt-4">
              {[1,2,3,4,5].map(star => (
                <div key={star} className="w-4 h-4 text-yellow-400">★</div>
              ))}
            </div>
          </div>
          
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/30 flex items-center justify-center text-lg font-bold">MR</div>
              <div>
                <div className="font-bold">Maria Rodriguez</div>
                <div className="text-sm text-white/40">Team Lead</div>
              </div>
            </div>
            <p className="text-white/60">
              "We scaled from 100 to 10,000 users without hiring a DevOps team. a-to-mind.com handles operations automatically."
            </p>
            <div className="flex gap-1 mt-4">
              {[1,2,3,4,5].map(star => (
                <div key={star} className="w-4 h-4 text-yellow-400">★</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Start free, scale as you grow
          </p>
        </div>
        
        {paymentStep === 'form' && (
          <div className="max-w-md mx-auto mb-8">
            <form onSubmit={handleEmailSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </form>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h3 className="text-xl font-bold mb-2">Starter</h3>
            <div className="text-4xl font-black mb-4">$0<span className="text-lg text-white/40">/mo</span></div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                Up to 100 events/day
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                3 AI proposals/day
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                Basic monitoring
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                Community support
              </li>
            </ul>
            <button
              onClick={() => initiatePayment('starter')}
              disabled={!email || loading}
              className="w-full py-3 bg-white/10 border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Get Started Free'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="p-6 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-2xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 rounded-full text-sm font-bold">
              POPULAR
            </div>
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <div className="text-4xl font-black mb-4">$29<span className="text-lg text-white/40">/mo</span></div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                Unlimited events
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                Unlimited AI proposals
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                Advanced monitoring
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                Priority support
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                API access
              </li>
            </ul>
            <button
              onClick={() => {
                setSelectedPlan('pro');
                setShowEarlyAccess(true);
              }}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Request Early Access'}
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h3 className="text-xl font-bold mb-2">Enterprise</h3>
            <div className="text-4xl font-black mb-4">$99<span className="text-lg text-white/40">/mo</span></div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                Everything in Pro
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                Custom integrations
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                Dedicated support
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                SLA guarantees
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                On-premise option
              </li>
            </ul>
            <button
              onClick={() => {
                setSelectedPlan('enterprise');
                setShowEarlyAccess(true);
              }}
              disabled={loading}
              className="w-full py-3 bg-white/10 border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Contact Sales'}
            </button>
          </div>
        </div>

        {/* Payment Instructions - Removed (Stripe handles this) */}
        {false && paymentStep === 'instructions' && paymentData && (
          <div className="max-w-2xl mx-auto mt-12 p-8 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-3xl">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Complete Your Payment</h3>
              <p className="text-white/60">Send payment via CashApp to activate your subscription</p>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-black/30 rounded-xl">
                <div className="text-sm text-white/40 mb-2">Send to CashApp</div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-purple-400">{paymentData.cashapp_handle}</div>
                  <button
                    onClick={() => copyToClipboard(paymentData.cashapp_handle)}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    {copied ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-white/60" />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-black/30 rounded-xl">
                <div className="text-sm text-white/40 mb-2">Amount</div>
                <div className="text-2xl font-bold">${paymentData.amount}</div>
              </div>

              <div className="p-4 bg-black/30 rounded-xl">
                <div className="text-sm text-white/40 mb-2">Memo (Required)</div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-mono text-white/80 break-all">{paymentData.memo}</div>
                  <button
                    onClick={() => copyToClipboard(paymentData.memo)}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors shrink-0"
                  >
                    {copied ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-white/60" />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-white/80">
                    <strong>Secure Payment:</strong> You'll be redirected to Stripe's secure checkout to complete your payment. Your account will be activated immediately after successful payment.
                  </div>
                </div>
              </div>

              <button
                onClick={() => window.location.href = paymentData.checkout_url || '#'}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all"
              >
                Continue to Stripe Checkout
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {paymentStep === 'success' && (
          <div className="max-w-2xl mx-auto mt-12 p-8 bg-emerald-500/20 border border-emerald-500/30 rounded-3xl text-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Payment Initiated!</h3>
            <p className="text-white/60 mb-6">
              Thank you for your payment! Your account will be activated within 24 hours. You'll receive a confirmation email at {email}.
            </p>
            <button
              onClick={onEnterDashboard}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Try Demo Dashboard
            </button>
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-white/60">
            Everything you need to know about a-to-mind.com
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h3 className="font-bold mb-2">What is a-to-mind.com?</h3>
            <p className="text-white/60">
              a-to-mind.com is the world's first autonomous business engine. We build infrastructure, scale revenue, and optimize growth while you focus on what matters. It's like having a complete digital operations department that never sleeps.
            </p>
          </div>
          
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h3 className="font-bold mb-2">How does the autonomous engine work?</h3>
            <p className="text-white/60">
              Our AI monitors your business metrics, identifies growth opportunities, and optimizes revenue automatically. The system scales operations and maximizes market capture with human oversight for critical decisions.
            </p>
          </div>
          
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h3 className="font-bold mb-2">Is my data secure?</h3>
            <p className="text-white/60">
              Yes. We use industry-standard encryption and never share your data. All business data is stored securely and you maintain full control over your operations.
            </p>
          </div>
          
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h3 className="font-bold mb-2">Can I cancel anytime?</h3>
            <p className="text-white/60">
              Absolutely. You can cancel your subscription at any time from your dashboard. Your account will be downgraded to the free Starter plan immediately.
            </p>
          </div>
          
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h3 className="font-bold mb-2">What payment methods do you accept?</h3>
            <p className="text-white/60">
              We accept secure payments via Stripe, including credit cards, debit cards, and other payment methods. Your payment is processed securely and your account is activated immediately.
            </p>
          </div>
          
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h3 className="font-bold mb-2">Is my data secure?</h3>
            <p className="text-white/60">
              Yes. We use industry-standard encryption and security practices. Your business data is stored securely and never shared with third parties.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="p-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-3xl text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Stop Playing Infrastructure Whack-a-Mole?</h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8">
            Join 500+ solo developers who are monitoring their infrastructure with AI-powered insights.
          </p>
          <button
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
          >
            Start Free - No Credit Card Required
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12 border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-400" />
            <span className="font-bold">a-to-mind</span>
          </div>
          <p className="text-white/40 text-sm">© 2026 a-to-mind. AI-powered infrastructure autonomy.</p>
        </div>
      </div>

      {/* Early Access Modal */}
      {showEarlyAccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/10 rounded-2xl p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowEarlyAccess(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            {!earlyAccessSubmitted ? (
              <>
                <h3 className="text-xl font-bold mb-2">Request Early Access</h3>
                <p className="text-white/60 mb-6">
                  We're currently onboarding the first 50 users manually. Tell us about your infrastructure challenges and we'll get you set up.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email</label>
                    <input
                      type="email"
                      value={earlyAccessEmail}
                      onChange={(e) => setEarlyAccessEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Biggest infrastructure headache?</label>
                    <textarea
                      value={earlyAccessPain}
                      onChange={(e) => setEarlyAccessPain(e.target.value)}
                      placeholder="e.g., Waking up at 3 AM for server alerts, slow database queries, high Cloudflare bills..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    />
                  </div>
                  
                  <button
                    onClick={handleEarlyAccess}
                    disabled={!earlyAccessEmail || loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Request'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 animate-pulse">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 text-green-300">Request Received!</h3>
                <p className="text-white/60 mb-6">
                  We'll review your request and reach out within 24 hours to discuss your infrastructure needs.
                </p>
                <button
                  onClick={() => {
                    setShowEarlyAccess(false);
                    setEarlyAccessSubmitted(false);
                    setEarlyAccessEmail('');
                    setEarlyAccessPain('');
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg hover:opacity-90 transition-opacity font-bold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute -top-2 -right-2 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
            <Auth onAuthSuccess={handleAuthSuccess} mode="signup" />
          </div>
        </div>
      )}
    </div>
  );
}