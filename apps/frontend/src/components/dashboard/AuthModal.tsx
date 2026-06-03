import React from 'react';
import { X, Mail, Lock, User, Gift } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'signup';
  onClose: () => void;
  onModeChange: (mode: 'login' | 'signup') => void;
  onSubmit: (data: { email: string; password: string; name: string }) => void;
  formData: { email: string; password: string; name: string };
  onFormDataChange: (data: { email: string; password: string; name: string }) => void;
}

export default function AuthModal({ isOpen, mode, onClose, onModeChange, onSubmit, formData, onFormDataChange }: AuthModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {mode === 'signup' ? 'Start Autonomous Growth' : 'Welcome Back'}
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-sm text-white/60 mb-2 block">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => onFormDataChange({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#c4a661]"
                  required
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
                onChange={(e) => onFormDataChange({...formData, email: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#c4a661]"
                required
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
                onChange={(e) => onFormDataChange({...formData, password: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#c4a661]"
                required
              />
            </div>
          </div>
          
          {mode === 'signup' && (
            <div className="bg-[#c4a661]/10 border border-[#c4a661]/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-[#c4a661] font-medium">
                <Gift className="w-5 h-5" />
                <span>$50 Welcome Bonus</span>
              </div>
              <p className="text-sm text-white/60 mt-1">Start with $50 in autonomous earnings</p>
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#c4a661] to-[#d4b671] text-black font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-[#c4a661]/30 transition-all"
          >
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
          
          <div className="text-center text-sm text-white/60">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => onModeChange('login')} className="text-[#c4a661] hover:underline">Sign in</button>
              </>
            ) : (
              <>
                New to a-to-mind?{' '}
                <button type="button" onClick={() => onModeChange('signup')} className="text-[#c4a661] hover:underline">Create account</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
