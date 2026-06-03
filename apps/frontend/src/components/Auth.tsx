import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, LogIn, UserPlus, RefreshCcw } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (token: string, user: any) => void;
  mode?: 'login' | 'signup';
}

export default function Auth({ onAuthSuccess, mode = 'login' }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [currentMode, setCurrentMode] = useState(mode);
  const [resending, setResending] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  // Capture referral code from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      sessionStorage.setItem('referral_code', ref);
    } else {
      // Check if we have a stored code
      const stored = sessionStorage.getItem('referral_code');
      if (stored) {
        setReferralCode(stored);
      }
    }
  }, []);

  const handleAuth = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      const endpoint = currentMode === 'login' ? '/auth/login' : '/auth/signup';
      const payload: any = { email, password };
      
      // Include referral code for signup
      if (currentMode === 'signup' && referralCode) {
        payload.referral_code = referralCode;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Authentication failed');
        return;
      }
      
      if (currentMode === 'signup') {
        // Track signup event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'sign_up', {
            method: 'email'
          });
        }
        
        // For signup, show verification message
        setMessage(data.message || 'Account created! Please check your email to verify your account.');
        return;
      }
      
      // Track login event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'login', {
          method: 'email'
        });
      }
      
      // For login, pass token to parent
      onAuthSuccess(data.token, data.user);
    } catch (e: any) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setResending(true);
      setError('');
      setMessage('');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to resend verification email');
        return;
      }
      
      setMessage(data.message || 'Verification email sent. Please check your inbox.');
    } catch (e: any) {
      setError('Failed to connect to server');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="p-8 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-2xl max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="p-3 bg-purple-500/10 rounded-xl inline-block mb-4">
          <User className="w-6 h-6 text-purple-400" />
        </div>
        <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-white/90 mb-2">
          {currentMode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-[8px] text-white/30 uppercase tracking-widest">
          {currentMode === 'login' ? 'Login to access your dashboard' : 'Start your free trial'}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[8px] text-white/40 uppercase tracking-widest mb-2 block">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full pl-10 pr-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-[8px] text-white/40 uppercase tracking-widest mb-2 block">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50"
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[8px] text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[8px] text-emerald-400">
            {message}
            {currentMode === 'signup' && (
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="mt-2 text-xs underline hover:text-emerald-300 disabled:opacity-50 flex items-center gap-1"
              >
                {resending ? (
                  <>
                    <RefreshCcw className="w-3 h-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend verification email'
                )}
              </button>
            )}
          </div>
        )}

        <button
          onClick={handleAuth}
          disabled={loading || !email || !password}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : currentMode === 'login' ? (
            <>
              <LogIn className="w-4 h-4" />
              Login
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Sign Up
            </>
          )}
        </button>

        <div className="text-center">
          <button
            onClick={() => {
              setCurrentMode(currentMode === 'login' ? 'signup' : 'login');
              setError('');
              setMessage('');
            }}
            className="text-[8px] text-white/40 hover:text-white/60 transition-colors"
          >
            {currentMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}