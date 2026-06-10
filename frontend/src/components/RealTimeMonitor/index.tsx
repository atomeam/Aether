/**
 * Real-time Monitor Component
 * 
 * Provides live monitoring of AI service executions, system health, and activity logs.
 */

import { useState, useEffect } from 'react';
import './RealTimeMonitor.css';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  cpu: number;
  memory: number;
  activeExecutions: number;
  uptime: number;
}

interface ExecutionMetrics {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  activeServices: number;
  errorsLastHour: number;
}

interface RealTimeMonitorProps {
  refreshInterval?: number;
}

export function RealTimeMonitor({ refreshInterval = 5000 }: RealTimeMonitorProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<ExecutionMetrics | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedLogLevel, setSelectedLogLevel] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    if (isStreaming) {
      const eventSource = new EventSource('/api/system/stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'LOG') {
            addLogEntry(data.log);
          }
        } catch (error) {
          console.error('Failed to parse SSE data:', error);
        }
      };
      return () => eventSource.close();
    }
  }, [isStreaming]);

  const fetchSystemData = async () => {
    try {
      const [healthRes, metricsRes] = await Promise.all([
        fetch('/api/system/health'),
        fetch('/api/execute/metrics')
      ]);

      if (healthRes.ok) {
        const health = await healthRes.json();
        setSystemHealth(health);
      }

      if (metricsRes.ok) {
        const execMetrics = await metricsRes.json();
        setMetrics(execMetrics);
      }
    } catch (error) {
      console.error('Failed to fetch system data:', error);
    }
  };

  const addLogEntry = (logMessage: string) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level: parseLogLevel(logMessage),
      service: parseService(logMessage),
      message: logMessage,
    };
    setLogs(prev => [entry, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  const parseLogLevel = (message: string): LogEntry['level'] => {
    const lower = message.toLowerCase();
    if (lower.includes('error') || lower.includes('fatal')) return 'error';
    if (lower.includes('warn')) return 'warn';
    if (lower.includes('debug')) return 'debug';
    return 'info';
  };

  const parseService = (message: string): string => {
    if (message.includes('Orchestrator')) return 'Orchestrator';
    if (message.includes('IntegrationManager')) return 'IntegrationManager';
    if (message.includes('VictusBridge')) return 'VictusBridge';
    if (message.includes('AI')) return 'AI Service';
    return 'System';
  };

  const filteredLogs = selectedLogLevel === 'all' 
    ? logs 
    : logs.filter(log => log.level === selectedLogLevel);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warn': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'debug': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="realtime-monitor">
      <div className="monitor-header">
        <h2>📊 Real-time Monitor</h2>
        <div className="monitor-controls">
          <button
            className={`stream-btn ${isStreaming ? 'active' : ''}`}
            onClick={() => setIsStreaming(!isStreaming)}
          >
            {isStreaming ? '🔴 Live' : '⚪ Offline'}
          </button>
          <select
            value={selectedLogLevel}
            onChange={(e) => setSelectedLogLevel(e.target.value as any)}
            className="log-filter"
          >
            <option value="all">All Logs</option>
            <option value="error">Errors</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>
      </div>

      <div className="monitor-grid">
        {/* System Health Card */}
        <div className="monitor-card health-card">
          <h3>System Health</h3>
          {systemHealth ? (
            <div className="health-content">
              <div className={`health-status ${getHealthColor(systemHealth.status)}`}>
                Status: {systemHealth.status.toUpperCase()}
              </div>
              <div className="health-metrics">
                <div className="metric">
                  <span className="metric-label">CPU</span>
                  <span className="metric-value">{systemHealth.cpu.toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Memory</span>
                  <span className="metric-value">{systemHealth.memory.toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Active</span>
                  <span className="metric-value">{systemHealth.activeExecutions}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Uptime</span>
                  <span className="metric-value">{Math.floor(systemHealth.uptime / 60)}m</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="loading">Loading health data...</div>
          )}
        </div>

        {/* Execution Metrics Card */}
        <div className="monitor-card metrics-card">
          <h3>Execution Metrics</h3>
          {metrics ? (
            <div className="metrics-content">
              <div className="metric-row">
                <span className="metric-label">Total Executions</span>
                <span className="metric-value">{metrics.totalExecutions}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Success Rate</span>
                <span className="metric-value">{(metrics.successRate * 100).toFixed(1)}%</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Avg Duration</span>
                <span className="metric-value">{metrics.averageDuration.toFixed(2)}s</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Active Services</span>
                <span className="metric-value">{metrics.activeServices}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Errors (1h)</span>
                <span className="metric-value error">{metrics.errorsLastHour}</span>
              </div>
            </div>
          ) : (
            <div className="loading">Loading metrics...</div>
          )}
        </div>

        {/* Activity Log Card */}
        <div className="monitor-card logs-card">
          <h3>Activity Log</h3>
          <div className="logs-content">
            {filteredLogs.length === 0 ? (
              <div className="empty-logs">No logs to display</div>
            ) : (
              <div className="logs-list">
                {filteredLogs.map((log) => (
                  <div key={log.id} className={`log-entry ${getLogColor(log.level)}`}>
                    <div className="log-header">
                      <span className="log-time">{log.timestamp.toLocaleTimeString()}</span>
                      <span className="log-level">{log.level.toUpperCase()}</span>
                      <span className="log-service">{log.service}</span>
                    </div>
                    <div className="log-message">{log.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RealTimeMonitor;