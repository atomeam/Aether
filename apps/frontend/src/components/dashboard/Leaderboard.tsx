import React from 'react';
import { Crown } from 'lucide-react';

interface LeaderboardEntry {
  name: string;
  earnings: number;
  badge: string;
  streak?: number;
  joined?: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  userEntry?: { name: string; earnings: number };
}

export default function Leaderboard({ entries, userEntry }: LeaderboardProps) {
  const getStatusText = (index: number) => {
    if (index === 0) return '🔥 On fire! ';
    if (index === 1) return '⚡ Rising fast! ';
    if (index === 2) return '💎 Consistent! ';
    return '';
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#c4a661]" />
          Top Earners This Month
        </h3>
        <div className="text-sm text-white/60">Updated live</div>
      </div>
      <div className="space-y-3">
        {entries.map((user, index) => (
          <div key={index} className={`flex items-center justify-between p-4 rounded-xl ${
            index === 0 ? 'bg-gradient-to-r from-[#c4a661]/20 to-emerald-500/20 border border-[#c4a661]/30' : 'bg-white/5'
          }`}>
            <div className="flex items-center gap-4">
              <div className="text-2xl">{user.badge}</div>
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-white/60">
                  {getStatusText(index)}
                  {user.joined && `Joined ${user.joined}`}
                </div>
              </div>
            </div>
            <div className="text-lg font-bold text-emerald-400">
              ${user.earnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
        {userEntry && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#c4a661]/10 border border-[#c4a661]/30">
            <div className="flex items-center gap-4">
              <div className="text-2xl">🎯</div>
              <div>
                <div className="font-medium">{userEntry.name}</div>
                <div className="text-sm text-white/60">Keep going!</div>
              </div>
            </div>
            <div className="text-lg font-bold text-[#c4a661]">
              ${userEntry.earnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
