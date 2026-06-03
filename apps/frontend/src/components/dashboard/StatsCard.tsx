import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext: string;
  color: 'emerald' | 'gold' | 'purple';
}

export default function StatsCard({ icon: Icon, label, value, subtext, color }: StatsCardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    gold: 'bg-[#c4a661]/20 text-[#c4a661]',
    purple: 'bg-purple-500/20 text-purple-400'
  };

  const bgColors = {
    emerald: 'bg-emerald-500/10',
    gold: 'bg-[#c4a661]/10',
    purple: 'bg-purple-500/10'
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 ${bgColors[color]} rounded-full blur-3xl`} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-white/60">{label}</div>
            <div className={`text-3xl font-bold ${colorClasses[color].split(' ')[1]}`}>
              {typeof value === 'number' ? value.toLocaleString('en-US') : value}
            </div>
          </div>
        </div>
        <div className="text-sm text-white/40">{subtext}</div>
      </div>
    </div>
  );
}
