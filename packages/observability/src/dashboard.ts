/**
 * @aether/observability - Dashboard Integration
 * 
 * Dashboard management system for creating, updating,
 * and exporting dashboards with various widget types.
 */

import type {
  Dashboard,
  DashboardWidget,
  DashboardQuery,
  WidgetLayout,
  DashboardIntegration,
} from './types';
import { globalMetricRegistry } from './metrics';

// ============================================================================
// Dashboard Integration Implementation
// ============================================================================

export class DefaultDashboardIntegration implements DashboardIntegration {
  private dashboards: Map<string, Dashboard> = new Map();

  createDashboard(dashboard: Dashboard): Dashboard {
    if (this.dashboards.has(dashboard.id)) {
      throw new Error(`Dashboard with id ${dashboard.id} already exists`);
    }
    this.dashboards.set(dashboard.id, dashboard);
    return dashboard;
  }

  updateDashboard(id: string, updates: Partial<Dashboard>): Dashboard {
    const existing = this.dashboards.get(id);
    if (!existing) {
      throw new Error(`Dashboard with id ${id} not found`);
    }

    const updated: Dashboard = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
    };

    this.dashboards.set(id, updated);
    return updated;
  }

  deleteDashboard(id: string): void {
    this.dashboards.delete(id);
  }

  getDashboard(id: string): Dashboard | null {
    return this.dashboards.get(id) || null;
  }

  listDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }

  exportDashboard(id: string): string {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard with id ${id} not found`);
    }
    return JSON.stringify(dashboard, null, 2);
  }

  importDashboard(data: string): Dashboard {
    try {
      const dashboard = JSON.parse(data) as Dashboard;
      this.createDashboard(dashboard);
      return dashboard;
    } catch (error) {
      throw new Error(`Failed to import dashboard: ${error}`);
    }
  }

  // Widget management
  addWidget(dashboardId: string, widget: DashboardWidget): Dashboard {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard with id ${dashboardId} not found`);
    }

    // Check for duplicate widget ID
    if (dashboard.widgets.some(w => w.id === widget.id)) {
      throw new Error(`Widget with id ${widget.id} already exists in dashboard`);
    }

    dashboard.widgets.push(widget);
    this.dashboards.set(dashboardId, dashboard);
    return dashboard;
  }

  updateWidget(dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>): Dashboard {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard with id ${dashboardId} not found`);
    }

    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
      throw new Error(`Widget with id ${widgetId} not found in dashboard`);
    }

    dashboard.widgets[widgetIndex] = {
      ...dashboard.widgets[widgetIndex],
      ...updates,
      id: widgetId, // Ensure ID doesn't change
    };

    this.dashboards.set(dashboardId, dashboard);
    return dashboard;
  }

  removeWidget(dashboardId: string, widgetId: string): Dashboard {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard with id ${dashboardId} not found`);
    }

    dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
    this.dashboards.set(dashboardId, dashboard);
    return dashboard;
  }

  // Query dashboard data
  queryWidgetData(widget: DashboardWidget): Record<string, any>[] {
    const results: Record<string, any>[] = [];

    for (const query of widget.queries) {
      const metric = globalMetricRegistry.get(query.metric);
      if (!metric) {
        continue;
      }

      const dataPoint: Record<string, any> = {
        metric: query.metric,
        value: metric.value,
        timestamp: metric.timestamp || Date.now(),
      };

      // Add labels
      if (metric.labels) {
        for (const label of metric.labels) {
          dataPoint[label.name] = label.value;
        }
      }

      // Apply aggregation (simplified - in production would aggregate over time series)
      if (query.aggregation) {
        dataPoint.aggregation = query.aggregation;
      }

      results.push(dataPoint);
    }

    return results;
  }

  queryDashboardData(dashboardId: string): Map<string, Record<string, any>[]> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard with id ${dashboardId} not found`);
    }

    const data = new Map<string, Record<string, any>[]>();

    for (const widget of dashboard.widgets) {
      data.set(widget.id, this.queryWidgetData(widget));
    }

    return data;
  }
}

// ============================================================================
// Global Dashboard Integration
// ============================================================================

export const globalDashboardIntegration = new DefaultDashboardIntegration();

// Convenience functions for global dashboard integration
export function createDashboard(dashboard: Dashboard): Dashboard {
  return globalDashboardIntegration.createDashboard(dashboard);
}

export function updateDashboard(id: string, updates: Partial<Dashboard>): Dashboard {
  return globalDashboardIntegration.updateDashboard(id, updates);
}

export function deleteDashboard(id: string): void {
  globalDashboardIntegration.deleteDashboard(id);
}

export function getDashboard(id: string): Dashboard | null {
  return globalDashboardIntegration.getDashboard(id);
}

export function listDashboards(): Dashboard[] {
  return globalDashboardIntegration.listDashboards();
}

export function exportDashboard(id: string): string {
  return globalDashboardIntegration.exportDashboard(id);
}

export function importDashboard(data: string): Dashboard {
  return globalDashboardIntegration.importDashboard(data);
}

export function addWidget(dashboardId: string, widget: DashboardWidget): Dashboard {
  return globalDashboardIntegration.addWidget(dashboardId, widget);
}

export function updateWidget(
  dashboardId: string,
  widgetId: string,
  updates: Partial<DashboardWidget>,
): Dashboard {
  return globalDashboardIntegration.updateWidget(dashboardId, widgetId, updates);
}

export function removeWidget(dashboardId: string, widgetId: string): Dashboard {
  return globalDashboardIntegration.removeWidget(dashboardId, widgetId);
}

export function queryWidgetData(widget: DashboardWidget): Record<string, any>[] {
  return globalDashboardIntegration.queryWidgetData(widget);
}

export function queryDashboardData(dashboardId: string): Map<string, Record<string, any>[]> {
  return globalDashboardIntegration.queryDashboardData(dashboardId);
}

// ============================================================================
// Dashboard Builders
// ============================================================================

export class DashboardBuilder {
  private dashboard: Partial<Dashboard> = {
    widgets: [],
    tags: [],
  };

  withId(id: string): DashboardBuilder {
    this.dashboard.id = id;
    return this;
  }

  withName(name: string): DashboardBuilder {
    this.dashboard.name = name;
    return this;
  }

  withDescription(description: string): DashboardBuilder {
    this.dashboard.description = description;
    return this;
  }

  withWidget(widget: DashboardWidget): DashboardBuilder {
    this.dashboard.widgets!.push(widget);
    return this;
  }

  withRefreshInterval(interval: number): DashboardBuilder {
    this.dashboard.refreshInterval = interval;
    return this;
  }

  withTag(tag: string): DashboardBuilder {
    this.dashboard.tags!.push(tag);
    return this;
  }

  build(): Dashboard {
    if (!this.dashboard.id || !this.dashboard.name) {
      throw new Error('Dashboard must have id and name');
    }
    return this.dashboard as Dashboard;
  }
}

export class DashboardWidgetBuilder {
  private widget: Partial<DashboardWidget> = {
    queries: [],
  };

  withId(id: string): DashboardWidgetBuilder {
    this.widget.id = id;
    return this;
  }

  withType(type: 'graph' | 'stat' | 'table' | 'heatmap' | 'gauge'): DashboardWidgetBuilder {
    this.widget.type = type;
    return this;
  }

  withTitle(title: string): DashboardWidgetBuilder {
    this.widget.title = title;
    return this;
  }

  withQuery(query: DashboardQuery): DashboardWidgetBuilder {
    this.widget.queries!.push(query);
    return this;
  }

  withLayout(x: number, y: number, w: number, h: number): DashboardWidgetBuilder {
    this.widget.layout = { x, y, w, h };
    return this;
  }

  withOption(key: string, value: any): DashboardWidgetBuilder {
    if (!this.widget.options) {
      this.widget.options = {};
    }
    this.widget.options[key] = value;
    return this;
  }

  build(): DashboardWidget {
    if (!this.widget.id || !this.widget.type || !this.widget.title) {
      throw new Error('Widget must have id, type, and title');
    }
    if (this.widget.queries!.length === 0) {
      throw new Error('Widget must have at least one query');
    }
    if (!this.widget.layout) {
      // Default layout
      this.widget.layout = { x: 0, y: 0, w: 6, h: 4 };
    }
    return this.widget as DashboardWidget;
  }
}

export class DashboardQueryBuilder {
  private query: Partial<DashboardQuery> = {};

  withMetric(metric: string): DashboardQueryBuilder {
    this.query.metric = metric;
    return this;
  }

  withLabel(name: string, value: string): DashboardQueryBuilder {
    if (!this.query.labels) {
      this.query.labels = {};
    }
    this.query.labels[name] = value;
    return this;
  }

  withAggregation(aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'rate'): DashboardQueryBuilder {
    this.query.aggregation = aggregation;
    return this;
  }

  withGroupBy(field: string): DashboardQueryBuilder {
    if (!this.query.groupBy) {
      this.query.groupBy = [];
    }
    this.query.groupBy.push(field);
    return this;
  }

  build(): DashboardQuery {
    if (!this.query.metric) {
      throw new Error('Query must have a metric');
    }
    return this.query as DashboardQuery;
  }
}

// ============================================================================
// Predefined Dashboard Templates
// ============================================================================

export function createSystemOverviewDashboard(): Dashboard {
  const widgets: DashboardWidget[] = [
    new DashboardWidgetBuilder()
      .withId('cpu-gauge')
      .withType('gauge')
      .withTitle('CPU Usage')
      .withQuery(new DashboardQueryBuilder().withMetric('cpu_usage_percent').build())
      .withLayout(0, 0, 3, 3)
      .withOption('min', 0)
      .withOption('max', 100)
      .build(),

    new DashboardWidgetBuilder()
      .withId('memory-gauge')
      .withType('gauge')
      .withTitle('Memory Usage')
      .withQuery(new DashboardQueryBuilder().withMetric('memory_usage_percent').build())
      .withLayout(3, 0, 3, 3)
      .withOption('min', 0)
      .withOption('max', 100)
      .build(),

    new DashboardWidgetBuilder()
      .withId('request-rate')
      .withType('stat')
      .withTitle('Request Rate')
      .withQuery(new DashboardQueryBuilder().withMetric('http_requests_total').withAggregation('rate').build())
      .withLayout(6, 0, 3, 3)
      .build(),

    new DashboardWidgetBuilder()
      .withId('error-rate')
      .withType('stat')
      .withTitle('Error Rate')
      .withQuery(new DashboardQueryBuilder().withMetric('http_errors_total').withAggregation('rate').build())
      .withLayout(9, 0, 3, 3)
      .build(),

    new DashboardWidgetBuilder()
      .withId('request-latency')
      .withType('graph')
      .withTitle('Request Latency')
      .withQuery(new DashboardQueryBuilder().withMetric('request_latency_ms').build())
      .withLayout(0, 3, 12, 4)
      .build(),
  ];

  return new DashboardBuilder()
    .withId('system-overview')
    .withName('System Overview')
    .withDescription('Overview of system metrics including CPU, memory, and request statistics')
    .withRefreshInterval(5000)
    .withTag('system')
    .withTag('overview')
    .build();
}

export function createApplicationPerformanceDashboard(): Dashboard {
  const widgets: DashboardWidget[] = [
    new DashboardWidgetBuilder()
      .withId('response-time')
      .withType('graph')
      .withTitle('Response Time')
      .withQuery(new DashboardQueryBuilder().withMetric('response_time_ms').build())
      .withLayout(0, 0, 6, 4)
      .build(),

    new DashboardWidgetBuilder()
      .withId('throughput')
      .withType('graph')
      .withTitle('Throughput')
      .withQuery(new DashboardQueryBuilder().withMetric('requests_per_second').build())
      .withLayout(6, 0, 6, 4)
      .build(),

    new DashboardWidgetBuilder()
      .withId('error-count')
      .withType('graph')
      .withTitle('Error Count')
      .withQuery(new DashboardQueryBuilder().withMetric('error_count').build())
      .withLayout(0, 4, 6, 4)
      .build(),

    new DashboardWidgetBuilder()
      .withId('active-connections')
      .withType('graph')
      .withTitle('Active Connections')
      .withQuery(new DashboardQueryBuilder().withMetric('active_connections').build())
      .withLayout(6, 4, 6, 4)
      .build(),
  ];

  return new DashboardBuilder()
    .withId('application-performance')
    .withName('Application Performance')
    .withDescription('Application performance metrics including response time, throughput, and errors')
    .withRefreshInterval(5000)
    .withTag('application')
    .withTag('performance')
    .build();
}

export function createBusinessMetricsDashboard(): Dashboard {
  const widgets: DashboardWidget[] = [
    new DashboardWidgetBuilder()
      .withId('active-users')
      .withType('stat')
      .withTitle('Active Users')
      .withQuery(new DashboardQueryBuilder().withMetric('active_users').build())
      .withLayout(0, 0, 3, 3)
      .build(),

    new DashboardWidgetBuilder()
      .withId('total-revenue')
      .withType('stat')
      .withTitle('Total Revenue')
      .withQuery(new DashboardQueryBuilder().withMetric('revenue_total').build())
      .withLayout(3, 0, 3, 3)
      .build(),

    new DashboardWidgetBuilder()
      .withId('conversion-rate')
      .withType('stat')
      .withTitle('Conversion Rate')
      .withQuery(new DashboardQueryBuilder().withMetric('conversion_rate').build())
      .withLayout(6, 0, 3, 3)
      .build(),

    new DashboardWidgetBuilder()
      .withId('user-growth')
      .withType('graph')
      .withTitle('User Growth')
      .withQuery(new DashboardQueryBuilder().withMetric('user_growth').build())
      .withLayout(0, 3, 12, 4)
      .build(),
  ];

  return new DashboardBuilder()
    .withId('business-metrics')
    .withName('Business Metrics')
    .withDescription('Business metrics including users, revenue, and conversion rates')
    .withRefreshInterval(60000)
    .withTag('business')
    .build();
}
