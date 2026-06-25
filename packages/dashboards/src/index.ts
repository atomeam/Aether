/**
 * @aether/dashboards - Dashboard system
 * 
 * Provides widget library, real-time updates, custom layouts,
 * data visualization, and export capabilities.
 * 
 * @version 1.0.0
 */

import { z } from 'zod';

// =============================================================================
// TYPES AND SCHEMAS
// =============================================================================

/**
 * Widget types
 */
export const WidgetTypeSchema = z.enum([
  'stat',
  'chart',
  'list',
  'status',
  'gauge',
  'table',
  'metric',
  'progress',
  'timeline',
  'heatmap',
  'map',
  'image',
  'text',
  'spacer',
]);

export type WidgetType = z.infer<typeof WidgetTypeSchema>;

/**
 * Chart types for visualization widgets
 */
export const ChartTypeSchema = z.enum([
  'line',
  'bar',
  'pie',
  'area',
  'scatter',
  'bubble',
  'radar',
  'polarArea',
  'doughnut',
]);

export type ChartType = z.infer<typeof ChartTypeSchema>;

/**
 * Widget configuration
 */
export const WidgetConfigSchema = z.object({
  id: z.string().min(1),
  type: WidgetTypeSchema,
  title: z.string().optional(),
  description: z.string().optional(),
  position: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    width: z.number().int().min(1),
    height: z.number().int().min(1),
  }),
  props: z.record(z.unknown()).optional(),
  dataSource: z.string().optional(),
  refreshInterval: z.number().int().min(0).optional(),
  visible: z.boolean().default(true),
  styles: z.record(z.string()).optional(),
});

export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;

/**
 * Widget data structure
 */
export const WidgetDataSchema = z.object({
  widgetId: z.string().min(1),
  timestamp: z.string(),
  data: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.unknown()),
    z.record(z.unknown()),
  ]),
  metadata: z.record(z.unknown()).optional(),
});

export type WidgetData = z.infer<typeof WidgetDataSchema>;

/**
 * Dashboard layout configuration
 */
export const LayoutConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  columns: z.number().int().min(1).default(12),
  rows: z.number().int().min(1).default(12),
  gap: z.number().default(16),
  widgets: z.array(WidgetConfigSchema),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  responsive: z.boolean().default(true),
});

export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;

/**
 * Dashboard configuration
 */
export const DashboardConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  layout: LayoutConfigSchema,
  permissions: z.object({
    view: z.array(z.string()).default([]),
    edit: z.array(z.string()).default([]),
    share: z.array(z.string()).default([]),
  }).default({ view: [], edit: [], share: [] }),
  settings: z.record(z.unknown()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;

/**
 * Real-time update event
 */
export const UpdateEventSchema = z.object({
  type: z.enum(['widget_update', 'layout_change', 'data_refresh', 'widget_add', 'widget_remove']),
  widgetId: z.string().optional(),
  timestamp: z.string(),
  payload: z.record(z.unknown()),
});

export type UpdateEvent = z.infer<typeof UpdateEventSchema>;

/**
 * Export configuration
 */
export const ExportConfigSchema = z.object({
  format: z.enum(['pdf', 'png', 'json', 'csv']),
  includeData: z.boolean().default(true),
  includeLayout: z.boolean().default(true),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  filters: z.record(z.unknown()).optional(),
});

export type ExportConfig = z.infer<typeof ExportConfigSchema>;

/**
 * Export result
 */
export const ExportResultSchema = z.object({
  id: z.string().min(1),
  format: z.enum(['pdf', 'png', 'json', 'csv']),
  filename: z.string(),
  data: z.instanceof(Buffer),
  size: z.number(),
  createdAt: z.string(),
});

export type ExportResult = z.infer<typeof ExportResultSchema>;

// =============================================================================
// WIDGET LIBRARY
// =============================================================================

/**
 * Widget library for managing widget types and configurations
 */
export class WidgetLibrary {
  private widgetTypes: Map<WidgetType, WidgetConfig> = new Map();
  private customWidgets: Map<string, WidgetConfig> = new Map();

  /**
   * Register a built-in widget type
   */
  registerWidgetType(type: WidgetType, config: Partial<WidgetConfig>): void {
    this.widgetTypes.set(type, {
      id: `type_${type}`,
      type,
      position: { x: 0, y: 0, width: 1, height: 1 },
      ...config,
    } as WidgetConfig);
  }

  /**
   * Register a custom widget
   */
  registerCustomWidget(id: string, config: WidgetConfig): void {
    const validated = WidgetConfigSchema.parse(config);
    this.customWidgets.set(id, validated);
  }

  /**
   * Get widget type configuration
   */
  getWidgetType(type: WidgetType): WidgetConfig | undefined {
    return this.widgetTypes.get(type);
  }

  /**
   * Get custom widget
   */
  getCustomWidget(id: string): WidgetConfig | undefined {
    return this.customWidgets.get(id);
  }

  /**
   * Get all widget types
   */
  getAllWidgetTypes(): WidgetType[] {
    return Array.from(this.widgetTypes.keys());
  }

  /**
   * Get all custom widgets
   */
  getAllCustomWidgets(): WidgetConfig[] {
    return Array.from(this.customWidgets.values());
  }

  /**
   * Create a widget instance from type
   */
  createWidget(type: WidgetType, overrides: Partial<WidgetConfig> = {}): WidgetConfig {
    const typeConfig = this.widgetTypes.get(type);
    if (!typeConfig) {
      throw new Error(`Widget type ${type} not registered`);
    }

    return WidgetConfigSchema.parse({
      ...typeConfig,
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...overrides,
    });
  }

  /**
   * Validate widget configuration
   */
  validateWidget(config: unknown): WidgetConfig {
    return WidgetConfigSchema.parse(config);
  }
}

// =============================================================================
// REAL-TIME UPDATES
// =============================================================================

/**
 * Event listener type
 */
type EventListener = (event: UpdateEvent) => void;

/**
 * Real-time update manager for dashboard events
 */
export class RealTimeManager {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private eventHistory: UpdateEvent[] = [];
  private maxHistorySize: number = 100;

  /**
   * Subscribe to events
   */
  subscribe(eventType: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(eventType: string, listener: EventListener): void {
    this.listeners.get(eventType)?.delete(listener);
  }

  /**
   * Emit an event
   */
  emit(event: UpdateEvent): void {
    const validated = UpdateEventSchema.parse(event);
    
    // Add to history
    this.eventHistory.push(validated);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
    
    // Notify listeners
    const listeners = this.listeners.get(validated.type);
    if (listeners) {
      listeners.forEach(listener => listener(validated));
    }
  }

  /**
   * Get event history
   */
  getHistory(limit?: number): UpdateEvent[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get listener count for event type
   */
  getListenerCount(eventType: string): number {
    return this.listeners.get(eventType)?.size || 0;
  }
}

// =============================================================================
// CUSTOM LAYOUTS
// =============================================================================

/**
 * Layout manager for dashboard layouts
 */
export class LayoutManager {
  private layouts: Map<string, LayoutConfig> = new Map();

  /**
   * Create a new layout
   */
  createLayout(config: LayoutConfig): LayoutConfig {
    const validated = LayoutConfigSchema.parse(config);
    this.layouts.set(validated.id, validated);
    return validated;
  }

  /**
   * Get a layout by ID
   */
  getLayout(id: string): LayoutConfig | undefined {
    return this.layouts.get(id);
  }

  /**
   * Get all layouts
   */
  getAllLayouts(): LayoutConfig[] {
    return Array.from(this.layouts.values());
  }

  /**
   * Update a layout
   */
  updateLayout(id: string, updates: Partial<LayoutConfig>): LayoutConfig | null {
    const existing = this.layouts.get(id);
    if (!existing) return null;

    const updated = LayoutConfigSchema.parse({ ...existing, ...updates });
    this.layouts.set(id, updated);
    return updated;
  }

  /**
   * Delete a layout
   */
  deleteLayout(id: string): boolean {
    return this.layouts.delete(id);
  }

  /**
   * Add widget to layout
   */
  addWidget(layoutId: string, widget: WidgetConfig): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout) return false;

    const validatedWidget = WidgetConfigSchema.parse(widget);
    layout.widgets.push(validatedWidget);
    this.layouts.set(layoutId, layout);
    return true;
  }

  /**
   * Remove widget from layout
   */
  removeWidget(layoutId: string, widgetId: string): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout) return false;

    const index = layout.widgets.findIndex(w => w.id === widgetId);
    if (index === -1) return false;

    layout.widgets.splice(index, 1);
    this.layouts.set(layoutId, layout);
    return true;
  }

  /**
   * Update widget in layout
   */
  updateWidget(layoutId: string, widgetId: string, updates: Partial<WidgetConfig>): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout) return false;

    const widget = layout.widgets.find(w => w.id === widgetId);
    if (!widget) return false;

    const updatedWidget = WidgetConfigSchema.parse({ ...widget, ...updates });
    const index = layout.widgets.findIndex(w => w.id === widgetId);
    layout.widgets[index] = updatedWidget;
    this.layouts.set(layoutId, layout);
    return true;
  }

  /**
   * Validate layout
   */
  validateLayout(config: unknown): LayoutConfig {
    return LayoutConfigSchema.parse(config);
  }
}

// =============================================================================
// DATA VISUALIZATION
// =============================================================================

/**
 * Chart data structure
 */
export const ChartDataSchema = z.object({
  labels: z.array(z.string()),
  datasets: z.array(z.object({
    label: z.string(),
    data: z.array(z.number()),
    backgroundColor: z.array(z.string()).optional(),
    borderColor: z.array(z.string()).optional(),
    borderWidth: z.number().optional(),
  })),
});

export type ChartData = z.infer<typeof ChartDataSchema>;

/**
 * Visualization manager for data visualization
 */
export class VisualizationManager {
  private chartData: Map<string, ChartData> = new Map();

  /**
   * Set chart data
   */
  setChartData(id: string, data: ChartData): void {
    const validated = ChartDataSchema.parse(data);
    this.chartData.set(id, validated);
  }

  /**
   * Get chart data
   */
  getChartData(id: string): ChartData | undefined {
    return this.chartData.get(id);
  }

  /**
   * Remove chart data
   */
  removeChartData(id: string): boolean {
    return this.chartData.delete(id);
  }

  /**
   * Transform data for chart
   */
  transformForChart(data: Record<string, unknown>, chartType: ChartType): ChartData {
    // Simple transformation logic
    const labels = Object.keys(data);
    const values = Object.values(data).map(v => Number(v) || 0);

    return ChartDataSchema.parse({
      labels,
      datasets: [
        {
          label: 'Data',
          data: values,
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
          borderColor: ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'],
          borderWidth: 2,
        },
      ],
    });
  }

  /**
   * Aggregate data for visualization
   */
  aggregateData(data: Array<Record<string, unknown>>, groupBy: string, aggregateBy: string): ChartData {
    const groups: Record<string, number[]> = {};

    data.forEach(item => {
      const key = String(item[groupBy] || 'unknown');
      const value = Number(item[aggregateBy]) || 0;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(value);
    });

    const labels = Object.keys(groups);
    const aggregatedData = labels.map(key => {
      const values = groups[key];
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    });

    return ChartDataSchema.parse({
      labels,
      datasets: [
        {
          label: aggregateBy,
          data: aggregatedData,
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
          borderColor: ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'],
          borderWidth: 2,
        },
      ],
    });
  }

  /**
   * Validate chart data
   */
  validateChartData(data: unknown): ChartData {
    return ChartDataSchema.parse(data);
  }
}

// =============================================================================
// EXPORT CAPABILITIES
// =============================================================================

/**
 * Export manager for dashboard exports
 */
export class ExportManager {
  /**
   * Export dashboard configuration
   */
  async exportDashboard(dashboard: DashboardConfig, config: ExportConfig): Promise<ExportResult> {
    const validatedConfig = ExportConfigSchema.parse(config);
    const validatedDashboard = DashboardConfigSchema.parse(dashboard);

    let content: string;

    switch (validatedConfig.format) {
      case 'json':
        content = this.exportAsJSON(validatedDashboard, validatedConfig);
        break;
      case 'csv':
        content = this.exportAsCSV(validatedDashboard, validatedConfig);
        break;
      case 'pdf':
      case 'png':
        content = this.exportAsText(validatedDashboard, validatedConfig);
        break;
      default:
        throw new Error(`Unsupported export format: ${validatedConfig.format}`);
    }

    const buffer = Buffer.from(content, 'utf-8');
    const filename = `dashboard_${validatedDashboard.id}.${validatedConfig.format}`;

    return ExportResultSchema.parse({
      id: `export_${Date.now()}`,
      format: validatedConfig.format,
      filename,
      data: buffer,
      size: buffer.length,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Export as JSON
   */
  private exportAsJSON(dashboard: DashboardConfig, config: ExportConfig): string {
    const exportData: Record<string, unknown> = {};

    if (config.includeLayout) {
      exportData.layout = dashboard.layout;
    }

    if (config.includeData) {
      exportData.settings = dashboard.settings;
    }

    exportData.metadata = {
      id: dashboard.id,
      name: dashboard.name,
      description: dashboard.description,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export as CSV
   */
  private exportAsCSV(dashboard: DashboardConfig, config: ExportConfig): string {
    const rows: string[] = [];

    rows.push('Widget ID,Type,Title,X,Y,Width,Height');

    dashboard.layout.widgets.forEach(widget => {
      rows.push(
        `${widget.id},${widget.type},${widget.title || ''},${widget.position.x},${widget.position.y},${widget.position.width},${widget.position.height}`
      );
    });

    return rows.join('\n');
  }

  /**
   * Export as text (for PDF/PNG placeholders)
   */
  private exportAsText(dashboard: DashboardConfig, config: ExportConfig): string {
    let content = '';

    content += `Dashboard: ${dashboard.name}\n`;
    content += `ID: ${dashboard.id}\n`;
    if (dashboard.description) {
      content += `Description: ${dashboard.description}\n`;
    }
    content += '\n';
    content += 'Widgets:\n';
    content += '='.repeat(50) + '\n';

    dashboard.layout.widgets.forEach(widget => {
      content += `- ${widget.type}: ${widget.title || 'Untitled'}\n`;
      content += `  Position: (${widget.position.x}, ${widget.position.y})\n`;
      content += `  Size: ${widget.position.width}x${widget.position.height}\n`;
    });

    return content;
  }

  /**
   * Validate export configuration
   */
  validateExportConfig(config: unknown): ExportConfig {
    return ExportConfigSchema.parse(config);
  }
}

// =============================================================================
// DASHBOARD MANAGER (MAIN API)
// =============================================================================

/**
 * Main dashboard manager that orchestrates all dashboard functionality
 */
export class DashboardManager {
  private widgetLibrary: WidgetLibrary;
  private realTimeManager: RealTimeManager;
  private layoutManager: LayoutManager;
  private visualizationManager: VisualizationManager;
  private exportManager: ExportManager;
  private dashboards: Map<string, DashboardConfig> = new Map();

  constructor() {
    this.widgetLibrary = new WidgetLibrary();
    this.realTimeManager = new RealTimeManager();
    this.layoutManager = new LayoutManager();
    this.visualizationManager = new VisualizationManager();
    this.exportManager = new ExportManager();

    // Register default widget types
    this.registerDefaultWidgets();
  }

  /**
   * Register default widget types
   */
  private registerDefaultWidgets(): void {
    const defaultTypes: WidgetType[] = ['stat', 'chart', 'list', 'status', 'gauge', 'table', 'metric', 'progress', 'timeline', 'heatmap', 'map', 'image', 'text', 'spacer'];

    defaultTypes.forEach(type => {
      this.widgetLibrary.registerWidgetType(type, {
        type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
      });
    });
  }

  /**
   * Create a new dashboard
   */
  createDashboard(config: DashboardConfig): DashboardConfig {
    const validated = DashboardConfigSchema.parse({
      ...config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create layout
    this.layoutManager.createLayout(validated.layout);

    this.dashboards.set(validated.id, validated);
    return validated;
  }

  /**
   * Get a dashboard by ID
   */
  getDashboard(id: string): DashboardConfig | undefined {
    return this.dashboards.get(id);
  }

  /**
   * Get all dashboards
   */
  getAllDashboards(): DashboardConfig[] {
    return Array.from(this.dashboards.values());
  }

  /**
   * Update a dashboard
   */
  updateDashboard(id: string, updates: Partial<DashboardConfig>): DashboardConfig | null {
    const existing = this.dashboards.get(id);
    if (!existing) return null;

    const updated = DashboardConfigSchema.parse({
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    this.dashboards.set(id, updated);
    return updated;
  }

  /**
   * Delete a dashboard
   */
  deleteDashboard(id: string): boolean {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) return false;

    this.layoutManager.deleteLayout(dashboard.layout.id);
    return this.dashboards.delete(id);
  }

  /**
   * Get widget library
   */
  getWidgetLibrary(): WidgetLibrary {
    return this.widgetLibrary;
  }

  /**
   * Get real-time manager
   */
  getRealTimeManager(): RealTimeManager {
    return this.realTimeManager;
  }

  /**
   * Get layout manager
   */
  getLayoutManager(): LayoutManager {
    return this.layoutManager;
  }

  /**
   * Get visualization manager
   */
  getVisualizationManager(): VisualizationManager {
    return this.visualizationManager;
  }

  /**
   * Get export manager
   */
  getExportManager(): ExportManager {
    return this.exportManager;
  }

  /**
   * Export dashboard
   */
  async exportDashboard(id: string, config: ExportConfig): Promise<ExportResult> {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard ${id} not found`);
    }

    return this.exportManager.exportDashboard(dashboard, config);
  }
}

// =============================================================================
// VALIDATORS
// =============================================================================

/**
 * Parse and validate widget config
 */
export function parseWidgetConfig(data: unknown): WidgetConfig {
  return WidgetConfigSchema.parse(data);
}

/**
 * Parse and validate widget data
 */
export function parseWidgetData(data: unknown): WidgetData {
  return WidgetDataSchema.parse(data);
}

/**
 * Parse and validate layout config
 */
export function parseLayoutConfig(data: unknown): LayoutConfig {
  return LayoutConfigSchema.parse(data);
}

/**
 * Parse and validate dashboard config
 */
export function parseDashboardConfig(data: unknown): DashboardConfig {
  return DashboardConfigSchema.parse(data);
}

/**
 * Parse and validate update event
 */
export function parseUpdateEvent(data: unknown): UpdateEvent {
  return UpdateEventSchema.parse(data);
}

/**
 * Parse and validate export config
 */
export function parseExportConfig(data: unknown): ExportConfig {
  return ExportConfigSchema.parse(data);
}

/**
 * Safe parse widget config
 */
export function safeParseWidgetConfig(data: unknown): z.SafeParseReturnType<WidgetConfig, WidgetConfig> {
  return WidgetConfigSchema.safeParse(data);
}

// =============================================================================
// EXPORTS
// =============================================================================
// All classes are exported inline where they are defined
