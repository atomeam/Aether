import { describe, it, expect } from 'vitest';
import { stringUtils } from './index';

describe('StringUtils', () => {
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(stringUtils.capitalize('hello')).toBe('Hello');
    });

    it('should lowercase rest of string', () => {
      expect(stringUtils.capitalize('HELLO')).toBe('Hello');
    });
  });

  describe('truncate', () => {
    it('should truncate string', () => {
      expect(stringUtils.truncate('hello world', 5)).toBe('hel...');
    });

    it('should not truncate if shorter than length', () => {
      expect(stringUtils.truncate('hi', 5)).toBe('hi');
    });
  });

  describe('camelCase', () => {
    it('should convert to camelCase', () => {
      expect(stringUtils.camelCase('hello-world')).toBe('helloWorld');
      expect(stringUtils.camelCase('hello_world')).toBe('helloWorld');
    });
  });

  describe('kebabCase', () => {
    it('should convert to kebab-case', () => {
      expect(stringUtils.kebabCase('helloWorld')).toBe('hello-world');
    });
  });

  describe('snakeCase', () => {
    it('should convert to snake_case', () => {
      expect(stringUtils.snakeCase('helloWorld')).toBe('hello_world');
    });
  });
});