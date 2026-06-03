import React from 'react';
import { Sparkles, Shield, Zap } from 'lucide-react';

interface HowItWorksProps {
  isAuthenticated: boolean;
  onConnectBank: () => void;
}

export default function HowItWorks({ isAuthenticated, onConnectBank }: HowItWorksProps) {
  const steps = [
    {
      icon: '1',
      title: 'Connect Your Accounts',
      description: 'Link your financial data sources securely via Plaid'
    },
    {
      icon: '2',
      title: 'AI Analyzes 24/7',
      description: 'Our engine finds optimization opportunities autonomously'
    },
    {
      icon: '3',
      title: 'Watch Your Wealth Grow',
      description: 'Sit back while a-to-mind maximizes your returns'
    }
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#c4a661]" />
        How a-to-mind Works
      </h3>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-4">
            <div className="w-8 h-8 bg-[#c4a661]/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-[#c4a661] font-bold">{step.icon}</span>
            </div>
            <div>
              <div className="font-medium">{step.title}</div>
              <div className="text-sm text-white/60">{step.description}</div>
            </div>
          </div>
        ))}
      </div>
      
      {isAuthenticated && (
        <button 
          onClick={onConnectBank}
          className="w-full mt-6 bg-gradient-to-r from-[#c4a661] to-[#d4b671] text-black font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-[#c4a661]/30 transition-all flex items-center justify-center gap-2"
        >
          <Shield className="w-5 h-5" />
          Connect Bank Account
        </button>
      )}
    </div>
  );
}
