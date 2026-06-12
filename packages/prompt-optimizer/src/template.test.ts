import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateEngine } from './template';
import { PromptVariable } from './types';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  describe('createTemplate', () => {
    it('should create a template with variables', () => {
      const template = engine.createTemplate(
        'test-template',
        'Hello {{name}}, you are {{age}} years old.',
        'A test template'
      );

      expect(template).toBeDefined();
      expect(template.name).toBe('test-template');
      expect(template.variables).toEqual(['name', 'age']);
      expect(template.id).toBeDefined();
    });

    it('should extract variables from template', () => {
      const template = engine.createTemplate(
        'test',
        '{{var1}} and {{var2}} and {{var1}} again'
      );

      expect(template.variables).toEqual(['var1', 'var2']);
    });
  });

  describe('compile', () => {
    it('should compile template with variables', () => {
      const template = engine.createTemplate(
        'test',
        'Hello {{name}}'
      );

      const compiled = engine.compile(template.id, [
        { name: 'name', value: 'World' }
      ]);

      expect(compiled.text).toBe('Hello World');
      expect(compiled.variables).toEqual({ name: 'World' });
    });

    it('should throw error for missing variables', () => {
      const template = engine.createTemplate(
        'test',
        'Hello {{name}} and {{age}}'
      );

      expect(() =>
        engine.compile(template.id, [{ name: 'name', value: 'World' }])
      ).toThrow('Missing variables: age');
    });

    it('should replace all occurrences of variable', () => {
      const template = engine.createTemplate(
        'test',
        '{{name}} says hello to {{name}}'
      );

      const compiled = engine.compile(template.id, [
        { name: 'name', value: 'Alice' }
      ]);

      expect(compiled.text).toBe('Alice says hello to Alice');
    });
  });

  describe('updateTemplate', () => {
    it('should update template', () => {
      const template = engine.createTemplate('test', 'Hello {{name}}');
      const updated = engine.updateTemplate(template.id, {
        name: 'updated-test',
        template: 'Hi {{name}}'
      });

      expect(updated.name).toBe('updated-test');
      expect(updated.template).toBe('Hi {{name}}');
    });

    it('should throw error for non-existent template', () => {
      expect(() =>
        engine.updateTemplate('non-existent', { name: 'test' })
      ).toThrow('Template not found');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template', () => {
      const template = engine.createTemplate('test', 'Hello {{name}}');
      const deleted = engine.deleteTemplate(template.id);

      expect(deleted).toBe(true);
      expect(engine.getTemplate(template.id)).toBeUndefined();
    });
  });

  describe('searchTemplates', () => {
    it('should search templates by name', () => {
      engine.createTemplate('hello-world', 'Hello {{name}}', 'A greeting');
      engine.createTemplate('goodbye', 'Goodbye {{name}}', 'A farewell');

      const results = engine.searchTemplates('hello');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('hello-world');
    });

    it('should search templates by description', () => {
      engine.createTemplate('test1', 'Hello {{name}}', 'A greeting template');
      engine.createTemplate('test2', 'Hi {{name}}', 'Another template');

      const results = engine.searchTemplates('greeting');
      expect(results).toHaveLength(1);
    });

    it('should search templates by tags', () => {
      engine.createTemplate('test1', 'Hello {{name}}', 'desc', ['greeting', 'friendly']);
      engine.createTemplate('test2', 'Hi {{name}}', 'desc', ['formal']);

      const results = engine.searchTemplates('greeting');
      expect(results).toHaveLength(1);
    });
  });
});
