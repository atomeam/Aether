import React from 'react';
import { LucideIcon, Database, AlertCircle, Link as LinkIcon, Info, ChevronRight } from 'lucide-react';
import { VerifiedData } from '../../types/verifiedData';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  data: VerifiedData<number>;
  color: 'emerald' | 'gold' | 'purple';
  showRawLink?: boolean;
  showDefinition?: boolean;
  onViewCalculation?: () => void;
}

export default function StatsCard({ icon: Icon, label, data, color, showRawLink = false, showDefinition = false, onViewCalculation }: StatsCardProps) {
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

  const displayValue = data.verified ? data.value : 'Not connected';
  const displayColor = data.verified ? colorClasses[color].split(' ')[1] : 'text-slate-400';

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
            <div className={`text-3xl font-bold ${displayColor}`}>
              {typeof displayValue === 'number' ? displayValue.toLocaleString('en-US') : displayValue}
            </div>
          </div>
        </div>
        <div className="text-sm text-white/40">
          {data.verified ? (
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>{data.source}</span>
              <span>• {new Date(data.computed_at).toLocaleTimeString()}</span>
              {showRawLink && data.raw_url && (
                <a
                  href={data.raw_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-white/30 hover:text-white"
                  title="View raw data"
                >
                  <LinkIcon className="w-3 h-3" />
                </a>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span>{data.source}</span>
            </div>
          )}
        </div>
        {showDefinition && data.definition && (
          <div className="mt-2 flex items-start gap-1 text-xs text-white/30">
            <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
            <span>{data.definition}</span>
          </div>
        )}
        {onViewCalculation && data.verified && (
          <button
            onClick={onViewCalculation}
            className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View calculation details
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
