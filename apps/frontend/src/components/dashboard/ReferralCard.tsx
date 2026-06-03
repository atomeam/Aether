import React from 'react';
import { Gift, Copy, Check } from 'lucide-react';

interface ReferralCardProps {
  referralLink: string;
  onCopy: () => void;
  copied: boolean;
}

export default function ReferralCard({ referralLink, onCopy, copied }: ReferralCardProps) {
  return (
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
            {referralLink}
          </div>
          <button 
            onClick={onCopy}
            className="bg-[#c4a661] text-black font-medium px-4 py-3 rounded-lg hover:bg-[#d4b671] transition-colors flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
