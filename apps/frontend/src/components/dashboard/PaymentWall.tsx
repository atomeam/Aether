import React from 'react';
import { Crown, Lock, Check, X } from 'lucide-react';

interface PaymentWallProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (plan: 'starter' | 'pro' | 'enterprise') => void;
}

export default function PaymentWall({ isOpen, onClose, onSubscribe }: PaymentWallProps) {
  if (!isOpen) return null;

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$9',
      period: '/month',
      features: ['Basic autonomous optimization', 'Weekly reports', 'Email support'],
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$29',
      period: '/month',
      features: ['Advanced AI optimization', 'Daily reports', 'Priority support', 'Unlimited strategies'],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      features: ['Full autonomous control', 'Real-time API access', 'Dedicated support', 'Custom integrations', 'Unlimited everything'],
      popular: false
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-[#c4a661]" />
            <h2 className="text-2xl font-bold">Choose Your Plan</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <p className="text-white/60 mb-8">Unlock the full power of autonomous AI wealth optimization</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`relative bg-white/5 border rounded-2xl p-6 ${
              plan.popular ? 'border-[#c4a661] shadow-lg shadow-[#c4a661]/30' : 'border-white/10'
            }`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c4a661] text-black text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-white">
                  {plan.price}
                  <span className="text-lg text-white/60">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-white/80">
                    <Check className="w-4 h-4 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onSubscribe(plan.id as 'starter' | 'pro' | 'enterprise')}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-[#c4a661] text-black hover:bg-[#d4b671]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {plan.id === 'enterprise' ? 'Contact Sales' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center text-sm text-white/40">
          <Lock className="w-4 h-4 inline mr-2" />
          Secure payment processing via Stripe
        </div>
      </div>
    </div>
  );
}
