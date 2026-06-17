import React, { useEffect, useState } from 'react';
import { useCrew } from '../contexts/CrewContext';
import { AlertTriangle, Bell, CheckCircle, XCircle } from 'lucide-react';

interface Alert {
  id: string;
  level: 'info' | 'warn' | 'critical';
  message: string;
  timestamp: string;
  crew: string;
  acknowledged: boolean;
}

export default function AlertMonitor() {
  const { crews } = useCrew();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  }, []);

  // Trigger browser notification for critical alerts
  const triggerBrowserNotification = (alert: Alert) => {
    if (notificationPermission === 'granted' && alert.level === 'critical') {
      new Notification(`Aether Alert: ${alert.crew}`, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.id,
        requireInteraction: true
      });
    }
  };

  // Monitor crew events for Red Line breaches
  useEffect(() => {
    const checkRedLines = async () => {
      try {
        // Check health check endpoint for Red Line violations
        const response = await fetch('https://aether-bridge.atomicmoonbeam88.workers.dev/api/health-check');
        const data = await response.json();
        
        if (data.ok && data.alerts) {
          const newAlerts: Alert[] = data.alerts.map((alert: any) => ({
            id: `alert-${alert.agentId}-${Date.now()}-${Math.random()}`,
            level: alert.level,
            message: alert.message,
            timestamp: alert.timestamp,
            crew: alert.crew,
            acknowledged: false
          }));

          // Add new alerts if they don't already exist
          setAlerts(prev => {
            const existingAlertIds = new Set(prev.map(a => a.message));
            const uniqueNewAlerts = newAlerts.filter(a => !existingAlertIds.has(a.message));
            return [...uniqueNewAlerts, ...prev].slice(0, 10);
          });

          // Trigger browser notifications for critical alerts
          newAlerts.forEach(alert => {
            if (alert.level === 'critical') {
              triggerBrowserNotification(alert);
            }
          });
        }
      } catch (error) {
        console.error('[AlertMonitor] Failed to check Red Lines:', error);
      }
    };

    // Check a-to-mind API health (via backend proxy to avoid exposing secret)
    const checkAtomindHealth = async () => {
      try {
        // Call backend proxy endpoint instead of direct Worker access
        const response = await fetch('/api/atomind-health');
        
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status !== 'healthy') {
          const alert: Alert = {
            id: `atomind-health-${Date.now()}-${Math.random()}`,
            level: 'critical',
            message: `a-to-mind API unhealthy: ${data.status}`,
            timestamp: data.timestamp,
            crew: 'a-to-mind',
            acknowledged: false
          };
          
          setAlerts(prev => {
            const existingAlertIds = new Set(prev.map(a => a.message));
            if (!existingAlertIds.has(alert.message)) {
              triggerBrowserNotification(alert);
              return [alert, ...prev].slice(0, 10);
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('[AlertMonitor] Failed to check a-to-mind health:', error);
        const alert: Alert = {
          id: `atomind-health-${Date.now()}-${Math.random()}`,
          level: 'critical',
          message: 'a-to-mind API health check failed',
          timestamp: new Date().toISOString(),
          crew: 'a-to-mind',
          acknowledged: false
        };
        
        setAlerts(prev => {
          const existingAlertIds = new Set(prev.map(a => a.message));
          if (!existingAlertIds.has(alert.message)) {
            triggerBrowserNotification(alert);
            return [alert, ...prev].slice(0, 10);
          }
          return prev;
        });
      }
    };

    // Check every 30 seconds
    const interval = setInterval(() => {
      checkRedLines();
      checkAtomindHealth();
    }, 30000);
    
    checkRedLines();
    checkAtomindHealth();

    return () => clearInterval(interval);
  }, [notificationPermission]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warn':
        return <Bell className="w-4 h-4 text-yellow-400" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/10';
      case 'warn':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'info':
        return 'border-blue-500/50 bg-blue-500/10';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);

  return (
    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-500/10 rounded-sm">
            <Bell className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/90">
              Alert Monitor
            </h3>
            <p className="text-[7px] text-white/30 uppercase tracking-widest">
              Browser-Native Notifications
            </p>
          </div>
        </div>
        <div className="text-[7px] text-white/30 font-mono">
          Permission: {notificationPermission === 'granted' ? 'Granted' : 'Pending'}
        </div>
      </div>

      {activeAlerts.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-white/20">
          <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-[8px] uppercase tracking-[0.3em]">All Systems Normal</span>
        </div>
      ) : (
        <div className="space-y-2">
          {activeAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3 border-l-2 rounded-lg flex items-start gap-3 ${getAlertColor(alert.level)}`}
            >
              <div className="mt-0.5">
                {getAlertIcon(alert.level)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[7px] font-mono text-white/40 uppercase">
                    {alert.crew}
                  </span>
                  <span className="text-[6px] text-white/30">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[8px] text-white/80 leading-tight">
                  {alert.message}
                </p>
              </div>
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                className="text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                title="Acknowledge"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-[7px] text-white/20 font-mono">
        <span>Active Alerts: {activeAlerts.length}</span>
        <span>Total Alerts: {alerts.length}</span>
      </div>
    </div>
  );
}