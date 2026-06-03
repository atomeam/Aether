import React from 'react';
import { Trophy, Share2 } from 'lucide-react';

interface ShareCardProps {
  onShare: () => void;
  earnings: number;
}

export default function ShareCard({ onShare, earnings }: ShareCardProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-[#c4a661]/10 border border-emerald-500/30 rounded-2xl p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Share Your Success</h3>
            <p className="text-sm text-white/60">Show others how a-to-mind is growing your wealth</p>
          </div>
        </div>
        <button
          onClick={onShare}
          className="bg-emerald-500 text-white font-medium px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          Share Earnings
        </button>
      </div>
    </div>
  );
}
