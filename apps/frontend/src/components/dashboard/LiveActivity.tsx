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
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  useEffect(() => {
    // Fetch real activity from API
    const fetchActivity = async () => {
      try {
        const response = await fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/activity/recent');
        const data = await response.json();
        if (data.activities) {
          const formattedActivities = data.activities.map((item: any) => ({
            user: item.user,
            action: item.action,
            amount: item.amount,
            time: formatTime(item.time),
            icon: item.amount ? 'earnings' : 'action'
          }));
          setActivities(formattedActivities);
        }
      } catch (err) {
        console.error('Failed to fetch activity:', err);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 10000); // Update every 10 seconds
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
        {activities.length > 0 ? (
          activities.map((activity, index) => (
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
          ))
        ) : (
          <div className="text-center text-white/40 py-8">
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
}
