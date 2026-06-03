import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, DollarSign, Zap } from 'lucide-react';

interface ActivityItem {
  user: string;
  action: string;
  amount?: number;
  time: string;
  icon: 'earnings' | 'action' | 'bonus';
}

export default function LiveActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([
    { user: 'Sarah M.', action: 'earned', amount: 23.45, time: '2s ago', icon: 'earnings' },
    { user: 'James K.', action: 'optimized', time: '15s ago', icon: 'action' },
    { user: 'Emily R.', action: 'earned', amount: 67.89, time: '32s ago', icon: 'earnings' },
    { user: 'Michael T.', action: 'claimed bonus', amount: 15, time: '1m ago', icon: 'bonus' },
    { user: 'Jessica L.', action: 'earned', amount: 45.12, time: '2m ago', icon: 'earnings' }
  ]);

  const actions = ['optimized costs', 'revenue spike', 'conversion boost', 'AI adjustment'];
  const names = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Quinn', 'Sam', 'Drew'];

  useEffect(() => {
    const interval = setInterval(() => {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const randomAmount = Math.random() > 0.5 ? (Math.random() * 100).toFixed(2) : undefined;
      
      const newActivity: ActivityItem = {
        user: `${randomName}.`,
        action: randomAction,
        amount: randomAmount ? parseFloat(randomAmount) : undefined,
        time: 'Just now',
        icon: randomAmount ? 'earnings' : 'action'
      };

      setActivities(prev => [newActivity, ...prev].slice(0, 6));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getIcon = (icon: ActivityItem['icon']) => {
    switch (icon) {
      case 'earnings':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'action':
        return <Zap className="w-4 h-4 text-[#c4a661]" />;
      case 'bonus':
        return <TrendingUp className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#c4a661]" />
          Live Activity
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm text-white/60">Live</span>
        </div>
      </div>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              {getIcon(activity.icon)}
            </div>
            <div className="flex-1">
              <div className="text-sm">
                <span className="font-medium">{activity.user}</span>
                <span className="text-white/60"> {activity.action}</span>
                {activity.amount && (
                  <span className="text-emerald-400 font-bold ml-1">+${activity.amount.toFixed(2)}</span>
                )}
              </div>
              <div className="text-xs text-white/40">{activity.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
