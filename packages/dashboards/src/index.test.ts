/**
 * Tests for @aether/dashboards
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  WidgetConfigSchema,
  WidgetDataSchema,
  LayoutConfigSchema,
  DashboardConfigSchema,
  UpdateEventSchema,
  ExportConfigSchema,
  ChartDataSchema,
  WidgetLibrary,
  RealTimeManager,
  LayoutManager,
  VisualizationManager,
  ExportManager,
  DashboardManager,
  parseWidgetConfig,
  parseWidgetData,
  parseLayoutConfig,
  parseDashboardConfig,
  parseUpdateEvent,
  parseExportConfig,
  safeParseWidgetConfig,
  type WidgetConfig,
  type WidgetData,
  type LayoutConfig,
  type DashboardConfig,
  type UpdateEvent,
  type ExportConfig,
  type ChartData,
} from './index';

describe('@aether/dashboards', () => {
  // =============================================================================
  // SCHEMA VALIDATION TESTS
  // =============================================================================

  describe('Schema Validation', () => {
    it('should validate widget config', () => {
      const config: WidgetConfig = {
        id: 'widget-1',
        type: 'stat',
        title: 'Test Widget',
        position: { x: 0, y: 0, width: 2, height: 1 },
        visible: true,
      };

      const result = WidgetConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it('should validate widget data', () => {
      const data: WidgetData = {
        widgetId: 'widget-1',
        timestamp: '2024-01-01T00:00:00Z',
        data: { value: 100 },
      };

      const result = WidgetDataSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should validate layout config', () => {
      const config: LayoutConfig = {
        id: 'layout-1',
        name: 'Test Layout',
        columns: 12,
        rows: 12,
        widgets: [],
        gap: 0,
        theme: 'light',
        responsive: true,
      };

      const result = LayoutConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it('should validate dashboard config', () => {
      const config: DashboardConfig = {
        id: 'dashboard-1',
        name: 'Test Dashboard',
        layout: {
          id: 'layout-1',
          name: 'Test Layout',
          columns: 12,
          rows: 12,
          widgets: [],
          gap: 0,
          theme: 'light',
          responsive: true,
        },
        permissions: { view: ['*'], edit: ['*'], share: ['*'] },
      };

      const result = DashboardConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it('should validate update event', () => {
      const event: UpdateEvent = {
        type: 'widget_update',
        widgetId: 'widget-1',
        timestamp: '2024-01-01T00:00:00Z',
        payload: { value: 100 },
      };

      const result = UpdateEventSchema.parse(event);
      expect(result).toEqual(event);
    });

    it('should validate export config', () => {
      const config: ExportConfig = {
        format: 'json',
        includeData: true,
        includeLayout: true,
      };

      const result = ExportConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it('should validate chart data', () => {
      const data: ChartData = {
        labels: ['A', 'B', 'C'],
        datasets: [
          {
            label: 'Dataset 1',
            data: [10, 20, 30],
            backgroundColor: ['#ff0000', '#00ff00', '#0000ff'],
          },
        ],
      };

      const result = ChartDataSchema.parse(data);
      expect(result).toEqual(data);
    });
  });

  // =============================================================================
  // WIDGET LIBRARY TESTS
  // =============================================================================

  describe('WidgetLibrary', () => {
    let library: WidgetLibrary;

    beforeEach(() => {
      library = new WidgetLibrary();
    });

    it('should register widget type', () => {
      library.registerWidgetType('stat', { title: 'Stat Widget' });

      const widgetType = library.getWidgetType('stat');
      expect(widgetType).toBeDefined();
      expect(widgetType?.type).toBe('stat');
    });

    it('should register custom widget', () => {
      const customWidget: WidgetConfig = {
        id: 'custom-1',
        type: 'stat',
        title: 'Custom Widget',
        position: { x: 0, y: 0, width: 1, height: 1 },
        visible: true,
      };

      library.registerCustomWidget('custom-1', customWidget);

      const retrieved = library.getCustomWidget('custom-1');
      expect(retrieved).toEqual(customWidget);
    });

    it('should get all widget types', () => {
      library.registerWidgetType('stat', {});
      library.registerWidgetType('chart', {});

      const types = library.getAllWidgetTypes();
      expect(types).toContain('stat');
      expect(types).toContain('chart');
    });

    it('should create widget from type', () => {
      library.registerWidgetType('stat', { title: 'Stat Widget' });

      const widget = library.createWidget('stat', { title: 'My Stat' });

      expect(widget.type).toBe('stat');
      expect(widget.title).toBe('My Stat');
      expect(widget.id).toMatch(/^widget_/);
    });

    it('should throw error for unregistered widget type', () => {
      expect(() => library.createWidget('stat')).toThrow();
    });

    it('should validate widget config', () => {
      const config = {
        id: 'widget-1',
        type: 'stat' as const,
        position: { x: 0, y: 0, width: 1, height: 1 },
      };

      const validated = library.validateWidget(config);
      expect(validated.id).toBe('widget-1');
    });
  });

  // =============================================================================
  // REAL-TIME MANAGER TESTS
  // =============================================================================

  describe('RealTimeManager', () => {
    let manager: RealTimeManager;

    beforeEach(() => {
      manager = new RealTimeManager();
    });

    it('should subscribe to events', () => {
      let callCount = 0;
      const listener = () => { callCount++; };
      const unsubscribe = manager.subscribe('widget_update', listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should emit events to listeners', () => {
      let receivedEvent: UpdateEvent | null = null;
      const listener = (event: UpdateEvent) => { receivedEvent = event; };
      manager.subscribe('widget_update', listener);

      const event: UpdateEvent = {
        type: 'widget_update',
        widgetId: 'widget-1',
        timestamp: '2024-01-01T00:00:00Z',
        payload: { value: 100 },
      };

      manager.emit(event);

      expect(receivedEvent).toEqual(event);
    });

    it('should unsubscribe from events', () => {
      let callCount = 0;
      const listener = () => { callCount++; };
      const unsubscribe = manager.subscribe('widget_update', listener);

      unsubscribe();

      const event: UpdateEvent = {
        type: 'widget_update',
        widgetId: 'widget-1',
        timestamp: '2024-01-01T00:00:00Z',
        payload: { value: 100 },
      };

      manager.emit(event);

      expect(callCount).toBe(0);
    });

    it('should maintain event history', () => {
      const event: UpdateEvent = {
        type: 'widget_update',
        widgetId: 'widget-1',
        timestamp: '2024-01-01T00:00:00Z',
        payload: { value: 100 },
      };

      manager.emit(event);

      const history = manager.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(event);
    });

    it('should limit event history', () => {
      for (let i = 0; i < 150; i++) {
        manager.emit({
          type: 'widget_update',
          timestamp: '2024-01-01T00:00:00Z',
          payload: { index: i },
        });
      }

      const history = manager.getHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should clear event history', () => {
      manager.emit({
        type: 'widget_update',
        timestamp: '2024-01-01T00:00:00Z',
        payload: {},
      });

      manager.clearHistory();

      expect(manager.getHistory()).toHaveLength(0);
    });

    it('should get listener count', () => {
      manager.subscribe('widget_update', () => {});
      manager.subscribe('widget_update', () => {});

      expect(manager.getListenerCount('widget_update')).toBe(2);
    });
  });

  // =============================================================================
  // LAYOUT MANAGER TESTS
  // =============================================================================

  describe('LayoutManager', () => {
    let manager: LayoutManager;
    let testLayout: LayoutConfig;

    beforeEach(() => {
      manager = new LayoutManager();
      testLayout = {
        id: 'layout-1',
        name: 'Test Layout',
        columns: 12,
        rows: 12,
        widgets: [],
        gap: 0,
        theme: 'light',
        responsive: true,
      };
    });

    it('should create layout', () => {
      const created = manager.createLayout(testLayout);

      expect(created).toEqual(testLayout);
      expect(manager.getLayout('layout-1')).toEqual(testLayout);
    });

    it('should get all layouts', () => {
      manager.createLayout(testLayout);
      manager.createLayout({
        ...testLayout,
        id: 'layout-2',
      });

      const layouts = manager.getAllLayouts();
      expect(layouts).toHaveLength(2);
    });

    it('should update layout', () => {
      manager.createLayout(testLayout);

      const updated = manager.updateLayout('layout-1', { name: 'Updated Layout' });

      expect(updated?.name).toBe('Updated Layout');
    });

    it('should return null when updating non-existent layout', () => {
      const updated = manager.updateLayout('non-existent', { name: 'New Name' });
      expect(updated).toBeNull();
    });

    it('should delete layout', () => {
      manager.createLayout(testLayout);

      const deleted = manager.deleteLayout('layout-1');

      expect(deleted).toBe(true);
      expect(manager.getLayout('layout-1')).toBeUndefined();
    });

    it('should add widget to layout', () => {
      manager.createLayout(testLayout);

      const widget: WidgetConfig = {
        id: 'widget-1',
        type: 'stat',
        position: { x: 0, y: 0, width: 1, height: 1 },
        visible: true,
      };

      const added = manager.addWidget('layout-1', widget);

      expect(added).toBe(true);
      expect(manager.getLayout('layout-1')?.widgets).toHaveLength(1);
    });

    it('should remove widget from layout', () => {
      manager.createLayout(testLayout);

      const widget: WidgetConfig = {
        id: 'widget-1',
        type: 'stat',
        position: { x: 0, y: 0, width: 1, height: 1 },
        visible: true,
      };

      manager.addWidget('layout-1', widget);
      const removed = manager.removeWidget('layout-1', 'widget-1');

      expect(removed).toBe(true);
      expect(manager.getLayout('layout-1')?.widgets).toHaveLength(0);
    });

    it('should update widget in layout', () => {
      manager.createLayout(testLayout);

      const widget: WidgetConfig = {
        id: 'widget-1',
        type: 'stat',
        title: 'Original Title',
        position: { x: 0, y: 0, width: 1, height: 1 },
        visible: true,
      };

      manager.addWidget('layout-1', widget);
      const updated = manager.updateWidget('layout-1', 'widget-1', { title: 'Updated Title' });

      expect(updated).toBe(true);
      expect(manager.getLayout('layout-1')?.widgets[0].title).toBe('Updated Title');
    });
  });

  // =============================================================================
  // VISUALIZATION MANAGER TESTS
  // =============================================================================

  describe('VisualizationManager', () => {
    let manager: VisualizationManager;
    let testData: ChartData;

    beforeEach(() => {
      manager = new VisualizationManager();
      testData = {
        labels: ['A', 'B', 'C'],
        datasets: [
          {
            label: 'Dataset 1',
            data: [10, 20, 30],
          },
        ],
      };
    });

    it('should set chart data', () => {
      manager.setChartData('chart-1', testData);

      const retrieved = manager.getChartData('chart-1');
      expect(retrieved).toEqual(testData);
    });

    it('should remove chart data', () => {
      manager.setChartData('chart-1', testData);

      const removed = manager.removeChartData('chart-1');

      expect(removed).toBe(true);
      expect(manager.getChartData('chart-1')).toBeUndefined();
    });

    it('should transform data for chart', () => {
      const data = { metric1: 100, metric2: 200, metric3: 300 };

      const chartData = manager.transformForChart(data, 'bar');

      expect(chartData.labels).toEqual(['metric1', 'metric2', 'metric3']);
      expect(chartData.datasets[0].data).toEqual([100, 200, 300]);
    });

    it('should aggregate data', () => {
      const data = [
        { category: 'A', value: 10 },
        { category: 'A', value: 20 },
        { category: 'B', value: 30 },
      ];

      const chartData = manager.aggregateData(data, 'category', 'value');

      expect(chartData.labels).toContain('A');
      expect(chartData.labels).toContain('B');
    });

    it('should validate chart data', () => {
      const validated = manager.validateChartData(testData);

      expect(validated).toEqual(testData);
    });
  });

  // =============================================================================
  // EXPORT MANAGER TESTS
  // =============================================================================

  describe('ExportManager', () => {
    let manager: ExportManager;
    let testDashboard: DashboardConfig;

    beforeEach(() => {
      manager = new ExportManager();
      testDashboard = {
        id: 'dashboard-1',
        name: 'Test Dashboard',
        description: 'A test dashboard',
        layout: {
          id: 'layout-1',
          name: 'Test Layout',
          columns: 12,
          rows: 12,
          widgets: [
            {
              id: 'widget-1',
              type: 'stat',
              title: 'Test Widget',
              position: { x: 0, y: 0, width: 1, height: 1 },
              visible: true,
            },
          ],
          gap: 0,
          theme: 'light',
          responsive: true,
        },
        permissions: { view: ['*'], edit: ['*'], share: ['*'] },
      };
    });

    it('should export as JSON', async () => {
      const config: ExportConfig = {
        format: 'json',
        includeData: true,
        includeLayout: true,
      };

      const result = await manager.exportDashboard(testDashboard, config);

      expect(result.format).toBe('json');
      expect(result.filename).toBe('dashboard_dashboard-1.json');
      expect(Buffer.isBuffer(result.data)).toBe(true);
    });

    it('should export as CSV', async () => {
      const config: ExportConfig = {
        format: 'csv',
        includeData: true,
        includeLayout: true,
      };

      const result = await manager.exportDashboard(testDashboard, config);

      expect(result.format).toBe('csv');
      expect(result.filename).toBe('dashboard_dashboard-1.csv');
      expect(Buffer.isBuffer(result.data)).toBe(true);
    });

    it('should export as PDF placeholder', async () => {
      const config: ExportConfig = {
        format: 'pdf',
        includeData: true,
        includeLayout: true,
      };

      const result = await manager.exportDashboard(testDashboard, config);

      expect(result.format).toBe('pdf');
      expect(Buffer.isBuffer(result.data)).toBe(true);
    });

    it('should validate export config', () => {
      const config = {
        format: 'json' as const,
        includeData: true,
      };

      const validated = manager.validateExportConfig(config);

      expect(validated.format).toBe('json');
    });
  });

  // =============================================================================
  // DASHBOARD MANAGER TESTS
  // =============================================================================

  describe('DashboardManager', () => {
    let manager: DashboardManager;
    let testDashboard: DashboardConfig;

    beforeEach(() => {
      manager = new DashboardManager();
      testDashboard = {
        id: 'dashboard-1',
        name: 'Test Dashboard',
        layout: {
          id: 'layout-1',
          name: 'Test Layout',
          columns: 12,
          rows: 12,
          widgets: [],
          gap: 0,
          theme: 'light',
          responsive: true,
        },
        permissions: { view: ['*'], edit: ['*'], share: ['*'] },
      };
    });

    it('should create dashboard', () => {
      const created = manager.createDashboard(testDashboard);

      expect(created.id).toBe('dashboard-1');
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();
    });

    it('should get dashboard by ID', () => {
      manager.createDashboard(testDashboard);

      const retrieved = manager.getDashboard('dashboard-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('dashboard-1');
    });

    it('should get all dashboards', () => {
      manager.createDashboard(testDashboard);
      manager.createDashboard({
        ...testDashboard,
        id: 'dashboard-2',
      });

      const dashboards = manager.getAllDashboards();

      expect(dashboards).toHaveLength(2);
    });

    it('should update dashboard', () => {
      manager.createDashboard(testDashboard);

      const updated = manager.updateDashboard('dashboard-1', { name: 'Updated Dashboard' });

      expect(updated?.name).toBe('Updated Dashboard');
      expect(updated?.updatedAt).toBeDefined();
    });

    it('should delete dashboard', () => {
      manager.createDashboard(testDashboard);

      const deleted = manager.deleteDashboard('dashboard-1');

      expect(deleted).toBe(true);
      expect(manager.getDashboard('dashboard-1')).toBeUndefined();
    });

    it('should provide access to widget library', () => {
      const library = manager.getWidgetLibrary();

      expect(library).toBeInstanceOf(WidgetLibrary);
    });

    it('should provide access to real-time manager', () => {
      const rtManager = manager.getRealTimeManager();

      expect(rtManager).toBeInstanceOf(RealTimeManager);
    });

    it('should provide access to layout manager', () => {
      const layoutManager = manager.getLayoutManager();

      expect(layoutManager).toBeInstanceOf(LayoutManager);
    });

    it('should provide access to visualization manager', () => {
      const vizManager = manager.getVisualizationManager();

      expect(vizManager).toBeInstanceOf(VisualizationManager);
    });

    it('should provide access to export manager', () => {
      const exportManager = manager.getExportManager();

      expect(exportManager).toBeInstanceOf(ExportManager);
    });

    it('should export dashboard', async () => {
      manager.createDashboard(testDashboard);

      const result = await manager.exportDashboard('dashboard-1', {
        format: 'json',
        includeData: true,
        includeLayout: true,
      });

      expect(result.format).toBe('json');
    });

    it('should throw error when exporting non-existent dashboard', async () => {
      await expect(
        manager.exportDashboard('non-existent', { format: 'json', includeData: true, includeLayout: true })
      ).rejects.toThrow();
    });
  });

  // =============================================================================
  // VALIDATOR FUNCTION TESTS
  // =============================================================================

  describe('Validator Functions', () => {
    it('should parse widget config', () => {
      const config = {
        id: 'widget-1',
        type: 'stat' as const,
        position: { x: 0, y: 0, width: 1, height: 1 },
        visible: true,
      };

      const result = parseWidgetConfig(config);

      expect(result.id).toBe('widget-1');
    });

    it('should parse widget data', () => {
      const data = {
        widgetId: 'widget-1',
        timestamp: '2024-01-01T00:00:00Z',
        data: { value: 100 },
      };

      const result = parseWidgetData(data);

      expect(result.widgetId).toBe('widget-1');
    });

    it('should parse layout config', () => {
      const config = {
        id: 'layout-1',
        name: 'Layout',
        widgets: [],
        gap: 0,
        theme: 'light',
        responsive: true,
      };

      const result = parseLayoutConfig(config);

      expect(result.id).toBe('layout-1');
    });

    it('should parse dashboard config', () => {
      const config = {
        id: 'dashboard-1',
        name: 'Dashboard',
        layout: {
          id: 'layout-1',
          name: 'Layout',
          columns: 12,
          rows: 12,
          widgets: [],
          gap: 0,
          theme: 'light',
          responsive: true,
        },
        permissions: { view: ['*'], edit: ['*'], share: ['*'] },
      };

      const result = parseDashboardConfig(config);

      expect(result.id).toBe('dashboard-1');
    });

    it('should parse update event', () => {
      const event = {
        type: 'widget_update' as const,
        timestamp: '2024-01-01T00:00:00Z',
        payload: {},
      };

      const result = parseUpdateEvent(event);

      expect(result.type).toBe('widget_update');
    });

    it('should parse export config', () => {
      const config = {
        format: 'json' as const,
        includeData: true,
      };

      const result = parseExportConfig(config);

      expect(result.format).toBe('json');
    });

    it('should safe parse widget config', () => {
      const valid = safeParseWidgetConfig({
        id: 'widget-1',
        type: 'stat' as const,
        position: { x: 0, y: 0, width: 1, height: 1 },
        visible: true,
      });

      expect(valid.success).toBe(true);
    });

    it('should return error for invalid widget config', () => {
      const invalid = safeParseWidgetConfig({ invalid: 'data' });

      expect(invalid.success).toBe(false);
    });
  });
});
