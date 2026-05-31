import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, DollarSign, Users, Target, ArrowUpRight, ArrowDownRight, Calendar, BarChart3, PieChart } from 'lucide-react';
import { cn } from '../lib/utils';

interface MetricDefinition {
  id: string;
  name: string;
  formula: string;
  dataSource: string;
  currentValue: number;
  targetValue: number;
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

interface WeeklyData {
  week: string;
  mrr: number;
  pipelineValue: number;
  newCustomers: number;
  churnRate: number;
}

const ProfitLoopMetrics = () => {
  const [metrics, setMetrics] = useState<MetricDefinition[]>([
    {
      id: 'mrr_growth',
      name: 'MRR Growth Rate',
      formula: '(Current MRR - Previous MRR) / Previous MRR * 100',
      dataSource: 'Stripe + HubSpot',
      currentValue: 12.5,
      targetValue: 15,
      trend: 'up',
      history: [8, 9, 10, 11, 12, 12.5]
    },
    {
      id: 'pipeline_velocity',
      name: 'Pipeline Velocity',
      formula: 'Pipeline Value / Average Deal Cycle (days)',
      dataSource: 'HubSpot CRM',
      currentValue: 2450,
      targetValue: 3000,
      trend: 'up',
      history: [1800, 2000, 2100, 2300, 2400, 2450]
    },
    {
      id: 'customer_acquisition',
      name: 'Customer Acquisition Efficiency',
      formula: 'New Customers / Marketing Spend * 1000',
      dataSource: 'HubSpot + Stripe',
      currentValue: 8.5,
      targetValue: 10,
      trend: 'stable',
      history: [7, 7.5, 8, 8.2, 8.4, 8.5]
    },
    {
      id: 'retention_rate',
      name: 'Net Revenue Retention',
      formula: '(MRR + Expansion - Churn) / MRR * 100',
      dataSource: 'Stripe Analytics',
      currentValue: 92,
      targetValue: 95,
      trend: 'down',
      history: [95, 94, 93, 93, 92.5, 92]
    }
  ]);

  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([
    { week: 'W1', mrr: 45000, pipelineValue: 120000, newCustomers: 12, churnRate: 2.1 },
    { week: 'W2', mrr: 47500, pipelineValue: 135000, newCustomers: 15, churnRate: 1.8 },
    { week: 'W3', mrr: 49000, pipelineValue: 142000, newCustomers: 18, churnRate: 2.3 },
    { week: 'W4', mrr: 52000, pipelineValue: 155000, newCustomers: 22, churnRate: 1.9 },
    { week: 'W5', mrr: 54000, pipelineValue: 168000, newCustomers: 25, churnRate: 2.0 },
    { week: 'W6', mrr: 56500, pipelineValue: 180000, newCustomers: 28, churnRate: 1.7 },
  ]);

  const [selectedMetric, setSelectedMetric] = useState<MetricDefinition | null>(null);
  const [viewMode, setViewMode] = useState<'metrics' | 'weekly'>('metrics');

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getTrendIcon = (trend: MetricDefinition['trend']) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="w-4 h-4 text-green-400" />;
      case 'down': return <ArrowDownRight className="w-4 h-4 text-red-400" />;
      case 'stable': return <div className="w-4 h-4 border-l-2 border-white/40" />;
    }
  };

  const getProgressColor = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio >= 1) return 'bg-green-400';
    if (ratio >= 0.8) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <div className="p-8 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-xl">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-white/90">Profit Loop Metrics</h2>
            <p className="text-[8px] text-white/30 uppercase tracking-widest">Weekly Scoreboard & Projections</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('metrics')}
            className={cn(
              "px-4 py-2 border text-[8px] uppercase tracking-widest transition-all cursor-pointer",
              viewMode === 'metrics' 
                ? "bg-green-500/20 text-green-400 border-green-500/30" 
                : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
            )}
          >
            <BarChart3 className="w-3 h-3 inline mr-1" />
            Metrics
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={cn(
              "px-4 py-2 border text-[8px] uppercase tracking-widest transition-all cursor-pointer",
              viewMode === 'weekly' 
                ? "bg-green-500/20 text-green-400 border-green-500/30" 
                : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
            )}
          >
            <Calendar className="w-3 h-3 inline mr-1" />
            Weekly
          </button>
        </div>
      </div>

      {viewMode === 'metrics' ? (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-6">
            {metrics.map((metric) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedMetric(metric)}
                className={cn(
                  "p-6 bg-white/[0.01] border border-white/5 rounded-sm cursor-pointer transition-all hover:bg-white/[0.03] hover:border-white/10",
                  selectedMetric?.id === metric.id && "border-green-500/30 bg-green-500/5"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(metric.trend)}
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-white/80">{metric.name}</h3>
                  </div>
                  <span className="text-[7px] text-white/20 font-mono">{metric.dataSource}</span>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-[24px] font-mono text-white">
                    {metric.id.includes('rate') || metric.id.includes('retention') 
                      ? `${metric.currentValue}%` 
                      : (metric.id.includes('pipeline') ? formatCurrency(metric.currentValue) : metric.currentValue.toFixed(1))}
                  </span>
                  <span className="text-[10px] text-white/40">/ {metric.targetValue}</span>
                </div>

                <div className="h-[2px] w-full bg-white/5 relative overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (metric.currentValue / metric.targetValue) * 100)}%` }}
                    transition={{ duration: 1 }}
                    className={cn("absolute inset-y-0 left-0", getProgressColor(metric.currentValue, metric.targetValue))}
                  />
                </div>

                <div className="text-[7px] text-white/20 font-mono uppercase tracking-tighter">
                  {metric.formula}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Selected Metric Detail */}
          <AnimatePresence>
            {selectedMetric && (
              <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-6 bg-green-500/5 border border-green-500/20 rounded-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-green-400">
                  {selectedMetric.name} - Analysis
                </h3>
                <button
                  onClick={() => setSelectedMetric(null)}
                  className="text-white/20 hover:text-white transition-colors cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-[8px] text-white/20 uppercase tracking-wider mb-2">Data Source Contract</div>
                  <div className="text-[10px] text-white/60 font-mono">{selectedMetric.dataSource}</div>
                </div>
                <div>
                  <div className="text-[8px] text-white/20 uppercase tracking-wider mb-2">Calculation Formula</div>
                  <div className="text-[10px] text-white/60 font-mono">{selectedMetric.formula}</div>
                </div>
              </div>

              <div>
                <div className="text-[8px] text-white/20 uppercase tracking-wider mb-4">6-Week Trend</div>
                <div className="flex items-end gap-2 h-24">
                  {selectedMetric.history.map((value, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${(value / Math.max(...selectedMetric.history)) * 100}%` }}
                      transition={{ delay: i * 0.1 }}
                      className="flex-1 bg-green-500/20 hover:bg-green-500/40 transition-colors rounded-t-sm relative group"
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[7px] text-white/40 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {value.toFixed(1)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Weekly Scoreboard */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-[8px] uppercase tracking-widest text-white/30 text-left pb-4">Week</th>
                  <th className="text-[8px] uppercase tracking-widest text-white/30 text-right pb-4">MRR</th>
                  <th className="text-[8px] uppercase tracking-widest text-white/30 text-right pb-4">Pipeline</th>
                  <th className="text-[8px] uppercase tracking-widest text-white/30 text-right pb-4">New Cust</th>
                  <th className="text-[8px] uppercase tracking-widest text-white/30 text-right pb-4">Churn %</th>
                  <th className="text-[8px] uppercase tracking-widest text-white/30 text-right pb-4">Score</th>
                </tr>
              </thead>
              <tbody>
                {weeklyData.map((week, i) => (
                  <motion.tr
                    key={week.week}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 text-[10px] font-mono text-white/60">{week.week}</td>
                    <td className="py-4 text-[10px] font-mono text-green-400 text-right">{formatCurrency(week.mrr)}</td>
                    <td className="py-4 text-[10px] font-mono text-blue-400 text-right">{formatCurrency(week.pipelineValue)}</td>
                    <td className="py-4 text-[10px] font-mono text-purple-400 text-right">{week.newCustomers}</td>
                    <td className="py-4 text-[10px] font-mono text-red-400 text-right">{week.churnRate}%</td>
                    <td className="py-4 text-[10px] font-mono text-white/80 text-right">
                      {((week.mrr / 60000) * 0.4 + (week.pipelineValue / 200000) * 0.3 + (week.newCustomers / 30) * 0.2 + ((100 - week.churnRate * 10) / 100) * 0.1).toFixed(2)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Projections */}
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-sm">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-green-400" />
                <h3 className="text-[10px] font-black uppercase tracking-wider text-white/80">MRR Projection</h3>
              </div>
              <div className="text-[20px] font-mono text-white mb-2">$62.5K</div>
              <div className="text-[8px] text-green-400">+10.7% from current</div>
              <div className="text-[7px] text-white/20 mt-2">Based on 4-week trend</div>
            </div>

            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-sm">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-blue-400" />
                <h3 className="text-[10px] font-black uppercase tracking-wider text-white/80">Pipeline Target</h3>
              </div>
              <div className="text-[20px] font-mono text-white mb-2">$200K</div>
              <div className="text-[8px] text-blue-400">+11.1% gap to target</div>
              <div className="text-[7px] text-white/20 mt-2">Q3 forecast</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLoopMetrics;