/**
 * Tests for @aether/reports
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ReportDataSchema,
  ReportTemplateSchema,
  ScheduledReportSchema,
  ReportOptionsSchema,
  PDFConfigSchema,
  ExcelConfigSchema,
  CSVConfigSchema,
  PDFGenerator,
  ExcelGenerator,
  CSVGenerator,
  TemplateManager,
  ScheduledReportManager,
  ReportGenerator,
  parseReportData,
  parseReportTemplate,
  parseScheduledReport,
  parseReportOptions,
  safeParseReportData,
  type ReportData,
  type ReportTemplate,
  type ScheduledReport,
  type ReportOptions,
} from './index';

describe('@aether/reports', () => {
  // =============================================================================
  // SCHEMA VALIDATION TESTS
  // =============================================================================

  describe('Schema Validation', () => {
    it('should validate report data', () => {
      const data: ReportData = {
        title: 'Test Report',
        subtitle: 'Test Subtitle',
        author: 'Test Author',
        date: '2024-01-01',
        sections: [
          {
            title: 'Section 1',
            content: 'Test content',
          },
          {
            title: 'Section 2',
            content: [
              { label: 'Item 1', value: 'Value 1' },
              { label: 'Item 2', value: 100 },
            ],
          },
        ],
      };

      const result = ReportDataSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should validate report template', () => {
      const template: ReportTemplate = {
        id: 'template-1',
        name: 'Test Template',
        description: 'A test template',
        format: 'pdf',
        defaultData: {
          title: 'Default Title',
        },
      };

      const result = ReportTemplateSchema.parse(template);
      expect(result).toEqual(template);
    });

    it('should validate scheduled report', () => {
      const scheduled: ScheduledReport = {
        id: 'scheduled-1',
        templateId: 'template-1',
        schedule: 'daily',
        recipients: ['test@example.com'],
        enabled: true,
      };

      const result = ScheduledReportSchema.parse(scheduled);
      expect(result).toEqual(scheduled);
    });

    it('should validate report options', () => {
      const options: ReportOptions = {
        format: 'pdf',
        filename: 'test-report.pdf',
        includeMetadata: true,
      };

      const result = ReportOptionsSchema.parse(options);
      expect(result).toEqual(options);
    });

    it('should validate PDF config', () => {
      const config = PDFConfigSchema.parse({
        pageSize: 'A4',
        fontSize: 14,
      });

      expect(config.pageSize).toBe('A4');
      expect(config.fontSize).toBe(14);
    });

    it('should validate Excel config', () => {
      const config = ExcelConfigSchema.parse({
        creator: 'Test Creator',
        title: 'Test Workbook',
        worksheets: [
          {
            name: 'Sheet1',
            data: [
              { col1: 'value1', col2: 100 },
              { col1: 'value2', col2: 200 },
            ],
            freezeHeaderRow: true,
            autoFilter: true,
          },
        ],
      });

      expect(config.worksheets).toHaveLength(1);
      expect(config.worksheets[0].name).toBe('Sheet1');
    });

    it('should validate CSV config', () => {
      const config = CSVConfigSchema.parse({
        data: [
          { col1: 'value1', col2: 100 },
          { col1: 'value2', col2: 200 },
        ],
        headers: ['Column 1', 'Column 2'],
        delimiter: ',',
        includeHeaders: true,
        quoteStrings: true,
      });

      expect(config.data).toHaveLength(2);
      expect(config.delimiter).toBe(',');
    });
  });

  // =============================================================================
  // PDF GENERATOR TESTS
  // =============================================================================

  describe('PDFGenerator', () => {
    let generator: PDFGenerator;
    let testData: ReportData;

    beforeEach(() => {
      generator = new PDFGenerator();
      testData = {
        title: 'Test Report',
        subtitle: 'Test Subtitle',
        author: 'Test Author',
        date: '2024-01-01',
        sections: [
          {
            title: 'Section 1',
            content: 'Test content',
          },
        ],
      };
    });

    it('should create PDF generator with default config', () => {
      expect(generator).toBeDefined();
      expect(generator.getConfig().pageSize).toBe('A4');
    });

    it('should create PDF generator with custom config', () => {
      const customGenerator = new PDFGenerator({
        pageSize: 'Letter',
        fontSize: 14,
        margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
        font: 'Arial',
      });

      expect(customGenerator.getConfig().pageSize).toBe('Letter');
      expect(customGenerator.getConfig().fontSize).toBe(14);
    });

    it('should generate PDF buffer', async () => {
      const buffer = await generator.generate(testData);
      
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should format content correctly', async () => {
      const buffer = await generator.generate(testData);
      const content = buffer.toString('utf-8');
      
      expect(content).toContain('Test Report');
      expect(content).toContain('Test Subtitle');
      expect(content).toContain('Section 1');
      expect(content).toContain('Test content');
    });

    it('should update config', () => {
      generator.setConfig({ fontSize: 16 });
      
      expect(generator.getConfig().fontSize).toBe(16);
    });
  });

  // =============================================================================
  // EXCEL GENERATOR TESTS
  // =============================================================================

  describe('ExcelGenerator', () => {
    let generator: ExcelGenerator;

    beforeEach(() => {
      generator = new ExcelGenerator({
        worksheets: [
          {
            name: 'Sheet1',
            data: [
              { col1: 'value1', col2: 100 },
              { col1: 'value2', col2: 200 },
            ],
            headers: ['Column 1', 'Column 2'],
            freezeHeaderRow: true,
            autoFilter: true,
          },
        ],
      });
    });

    it('should create Excel generator', () => {
      expect(generator).toBeDefined();
    });

    it('should generate Excel buffer', async () => {
      const buffer = await generator.generate();
      
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should format content correctly', async () => {
      const buffer = await generator.generate();
      const content = buffer.toString('utf-8');
      
      expect(content).toContain('Sheet1');
      expect(content).toContain('Column 1');
      expect(content).toContain('value1');
    });

    it('should add worksheet', () => {
      const initialCount = generator.getConfig().worksheets.length;

      generator.addWorksheet({
        name: 'Sheet2',
        data: [{ col1: 'value3' }],
        freezeHeaderRow: true,
        autoFilter: true,
      });

      expect(generator.getConfig().worksheets.length).toBe(initialCount + 1);
    });
  });

  // =============================================================================
  // CSV GENERATOR TESTS
  // =============================================================================

  describe('CSVGenerator', () => {
    let generator: CSVGenerator;

    beforeEach(() => {
      generator = new CSVGenerator({
        data: [
          { col1: 'value1', col2: 100 },
          { col1: 'value2', col2: 200 },
        ],
        headers: ['Column 1', 'Column 2'],
        delimiter: ',',
        includeHeaders: true,
        quoteStrings: true,
      });
    });

    it('should create CSV generator', () => {
      expect(generator).toBeDefined();
    });

    it('should generate CSV buffer', async () => {
      const buffer = await generator.generate();
      
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should format CSV correctly', async () => {
      const buffer = await generator.generate();
      const content = buffer.toString('utf-8');
      
      expect(content).toContain('Column 1,Column 2');
      expect(content).toContain('value1');
    });

    it('should escape fields with delimiter', async () => {
      generator.setConfig({
        data: [{ col1: 'value,with,commas' }],
        headers: ['Column 1'],
      });
      
      const buffer = await generator.generate();
      const content = buffer.toString('utf-8');
      
      expect(content).toContain('"value,with,commas"');
    });

    it('should update config', () => {
      generator.setConfig({ delimiter: ';' });
      
      expect(generator.getConfig().delimiter).toBe(';');
    });
  });

  // =============================================================================
  // TEMPLATE MANAGER TESTS
  // =============================================================================

  describe('TemplateManager', () => {
    let manager: TemplateManager;
    let testTemplate: ReportTemplate;

    beforeEach(() => {
      manager = new TemplateManager();
      testTemplate = {
        id: 'template-1',
        name: 'Test Template',
        format: 'pdf',
        defaultData: {},
      };
    });

    it('should register template', () => {
      manager.register(testTemplate);
      
      expect(manager.has('template-1')).toBe(true);
    });

    it('should get template by ID', () => {
      manager.register(testTemplate);
      
      const retrieved = manager.get('template-1');
      
      expect(retrieved).toEqual(testTemplate);
    });

    it('should return undefined for non-existent template', () => {
      const retrieved = manager.get('non-existent');
      
      expect(retrieved).toBeUndefined();
    });

    it('should get all templates', () => {
      manager.register(testTemplate);
      manager.register({
        id: 'template-2',
        name: 'Test Template 2',
        format: 'excel',
        defaultData: {},
      });

      const all = manager.getAll();

      expect(all).toHaveLength(2);
    });

    it('should get templates by format', () => {
      manager.register(testTemplate);
      manager.register({
        id: 'template-2',
        name: 'Test Template 2',
        format: 'excel',
        defaultData: {},
      });

      const pdfTemplates = manager.getByFormat('pdf');

      expect(pdfTemplates).toHaveLength(1);
      expect(pdfTemplates[0].id).toBe('template-1');
    });

    it('should update template', () => {
      manager.register(testTemplate);
      
      const updated = manager.update('template-1', { name: 'Updated Name' });
      
      expect(updated).toBe(true);
      expect(manager.get('template-1')?.name).toBe('Updated Name');
    });

    it('should return false when updating non-existent template', () => {
      const updated = manager.update('non-existent', { name: 'New Name' });
      
      expect(updated).toBe(false);
    });

    it('should delete template', () => {
      manager.register(testTemplate);
      
      const deleted = manager.delete('template-1');
      
      expect(deleted).toBe(true);
      expect(manager.has('template-1')).toBe(false);
    });
  });

  // =============================================================================
  // SCHEDULED REPORT MANAGER TESTS
  // =============================================================================

  describe('ScheduledReportManager', () => {
    let manager: ScheduledReportManager;
    let templateManager: TemplateManager;
    let testTemplate: ReportTemplate;
    let testScheduled: ScheduledReport;

    beforeEach(() => {
      templateManager = new TemplateManager();
      testTemplate = {
        id: 'template-1',
        name: 'Test Template',
        format: 'pdf',
        defaultData: {},
      };
      templateManager.register(testTemplate);

      manager = new ScheduledReportManager(templateManager);

      testScheduled = {
        id: 'scheduled-1',
        templateId: 'template-1',
        schedule: 'daily',
        recipients: ['test@example.com'],
        enabled: true,
      };
    });

    it('should schedule report', () => {
      manager.schedule(testScheduled);
      
      expect(manager.get('scheduled-1')).toBeDefined();
      expect(manager.get('scheduled-1')?.nextRun).toBeDefined();
    });

    it('should throw error when template does not exist', () => {
      expect(() => {
        manager.schedule({
          ...testScheduled,
          templateId: 'non-existent',
        });
      }).toThrow();
    });

    it('should get scheduled report by ID', () => {
      manager.schedule(testScheduled);
      
      const retrieved = manager.get('scheduled-1');
      
      expect(retrieved).toEqual(expect.objectContaining({
        id: 'scheduled-1',
        templateId: 'template-1',
      }));
    });

    it('should get all scheduled reports', () => {
      manager.schedule(testScheduled);
      manager.schedule({
        ...testScheduled,
        id: 'scheduled-2',
      });
      
      const all = manager.getAll();
      
      expect(all).toHaveLength(2);
    });

    it('should get enabled reports', () => {
      manager.schedule(testScheduled);
      manager.schedule({
        ...testScheduled,
        id: 'scheduled-2',
        enabled: false,
      });
      
      const enabled = manager.getEnabled();
      
      expect(enabled).toHaveLength(1);
      expect(enabled[0].id).toBe('scheduled-1');
    });

    it('should update scheduled report', () => {
      manager.schedule(testScheduled);
      
      const updated = manager.update('scheduled-1', { enabled: false });
      
      expect(updated).toBe(true);
      expect(manager.get('scheduled-1')?.enabled).toBe(false);
    });

    it('should delete scheduled report', () => {
      manager.schedule(testScheduled);
      
      const deleted = manager.delete('scheduled-1');
      
      expect(deleted).toBe(true);
      expect(manager.get('scheduled-1')).toBeUndefined();
    });

    it('should mark report as run', () => {
      manager.schedule(testScheduled);
      
      const marked = manager.markAsRun('scheduled-1');
      
      expect(marked).toBe(true);
      expect(manager.get('scheduled-1')?.lastRun).toBeDefined();
    });
  });

  // =============================================================================
  // REPORT GENERATOR TESTS
  // =============================================================================

  describe('ReportGenerator', () => {
    let generator: ReportGenerator;
    let testData: ReportData;

    beforeEach(() => {
      generator = new ReportGenerator();
      testData = {
        title: 'Test Report',
        sections: [
          {
            title: 'Section 1',
            content: 'Test content',
          },
        ],
      };
    });

    it('should create report generator', () => {
      expect(generator).toBeDefined();
    });

    it('should generate PDF report', async () => {
      const report = await generator.generate(testData, {
        format: 'pdf',
        filename: 'test.pdf',
        includeMetadata: true,
      });

      expect(report.format).toBe('pdf');
      expect(report.filename).toBe('test.pdf');
      expect(Buffer.isBuffer(report.buffer)).toBe(true);
    });

    it('should throw error for Excel without configuration', async () => {
      await expect(
        generator.generate(testData, { format: 'excel', includeMetadata: true })
      ).rejects.toThrow('Excel generator not configured');
    });

    it('should throw error for CSV without configuration', async () => {
      await expect(
        generator.generate(testData, { format: 'csv', includeMetadata: true })
      ).rejects.toThrow('CSV generator not configured');
    });

    it('should provide access to template manager', () => {
      const templateManager = generator.getTemplateManager();
      
      expect(templateManager).toBeInstanceOf(TemplateManager);
    });

    it('should provide access to scheduled report manager', () => {
      const scheduledManager = generator.getScheduledReportManager();
      
      expect(scheduledManager).toBeInstanceOf(ScheduledReportManager);
    });

    it('should provide access to PDF generator', () => {
      const pdfGenerator = generator.getPDFGenerator();
      
      expect(pdfGenerator).toBeInstanceOf(PDFGenerator);
    });
  });

  // =============================================================================
  // VALIDATOR FUNCTION TESTS
  // =============================================================================

  describe('Validator Functions', () => {
    it('should parse report data', () => {
      const data = {
        title: 'Test',
        sections: [{ title: 'S1', content: 'Content' }],
      };
      
      const result = parseReportData(data);
      
      expect(result.title).toBe('Test');
    });

    it('should parse report template', () => {
      const template = {
        id: 't1',
        name: 'Template',
        format: 'pdf' as const,
        defaultData: {},
      };

      const result = parseReportTemplate(template);

      expect(result.id).toBe('t1');
    });

    it('should parse scheduled report', () => {
      const scheduled = {
        id: 's1',
        templateId: 't1',
        schedule: 'daily' as const,
        recipients: ['test@example.com'],
        enabled: true,
      };

      const result = parseScheduledReport(scheduled);

      expect(result.id).toBe('s1');
    });

    it('should parse report options', () => {
      const options = {
        format: 'pdf' as const,
        filename: 'test.pdf',
        includeMetadata: true,
      };

      const result = parseReportOptions(options);

      expect(result.format).toBe('pdf');
    });

    it('should safe parse report data', () => {
      const valid = safeParseReportData({
        title: 'Test',
        sections: [{ title: 'S1', content: 'Content' }],
      });
      
      expect(valid.success).toBe(true);
    });

    it('should return error for invalid data', () => {
      const invalid = safeParseReportData({ invalid: 'data' });
      
      expect(invalid.success).toBe(false);
    });
  });
});
