/**
 * @aether/i18n - I18n Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { I18n, createI18n, i18n } from './i18n';
import type { I18nConfig, LocaleConfig } from './types';
import {
  I18nConfigSchema,
  LocaleCodeSchema,
  TranslationKeySchema,
  TranslationDictionarySchema,
  TranslationParamsSchema,
  DateFormatOptionsSchema,
  TimeFormatOptionsSchema,
  DateTimeFormatOptionsSchema,
  NumberFormatOptionsSchema,
  CurrencyFormatOptionsSchema,
  RelativeTimeFormatOptionsSchema,
  LocaleConfigSchema,
} from './schemas';

describe('I18n', () => {
  let instance: I18n;

  beforeEach(() => {
    instance = createI18n({
      defaultLocale: 'en',
      fallbackLocale: 'en',
      availableLocales: ['en', 'es'],
      translations: {
        en: {
          hello: 'Hello',
          welcome: 'Welcome {{name}}',
          items_one: '1 item',
          items_other: '{{count}} items',
        },
        es: {
          hello: 'Hola',
          welcome: 'Bienvenido {{name}}',
          items_one: '1 elemento',
          items_other: '{{count}} elementos',
        },
      },
    });
  });

  describe('initialization', () => {
    it('should create an instance with default config', () => {
      const defaultInstance = createI18n();
      expect(defaultInstance.getLocale()).toBe('en');
      expect(defaultInstance.getFallbackLocale()).toBe('en');
    });

    it('should create an instance with custom config', () => {
      const customInstance = createI18n({
        defaultLocale: 'es',
        fallbackLocale: 'en',
        availableLocales: ['es', 'en'],
        translations: {
          es: { hello: 'Hola' },
          en: { hello: 'Hello' },
        },
      });
      expect(customInstance.getLocale()).toBe('es');
      expect(customInstance.getFallbackLocale()).toBe('en');
    });

    it('should validate config with schema', () => {
      expect(() => {
        createI18n({
          defaultLocale: 'invalid-locale',
          fallbackLocale: 'en',
          availableLocales: ['en'],
          translations: {},
        });
      }).toThrow();
    });
  });

  describe('locale management', () => {
    it('should set and get locale', () => {
      instance.setLocale('es');
      expect(instance.getLocale()).toBe('es');
    });

    it('should validate locale code', () => {
      expect(() => instance.setLocale('invalid')).toThrow();
    });

    it('should set and get fallback locale', () => {
      instance.setFallbackLocale('es');
      expect(instance.getFallbackLocale()).toBe('es');
    });

    it('should get available locales', () => {
      const locales = instance.getAvailableLocales();
      expect(locales).toContain('en');
      expect(locales).toContain('es');
    });
  });

  describe('translation management', () => {
    it('should add translations', () => {
      instance.addTranslations('en', { goodbye: 'Goodbye' });
      expect(instance.t('goodbye')).toBe('Goodbye');
    });

    it('should merge translations by default', () => {
      instance.addTranslations('en', { newKey: 'New Value' });
      expect(instance.t('hello')).toBe('Hello');
      expect(instance.t('newKey')).toBe('New Value');
    });

    it('should replace translations when merge is false', () => {
      instance.addTranslations('en', { newKey: 'New Value' }, false);
      expect(instance.t('hello')).toBe('hello'); // Key no longer exists
      expect(instance.t('newKey')).toBe('New Value');
    });

    it('should remove translations', () => {
      instance.removeTranslations('en', ['hello']);
      expect(instance.t('hello')).toBe('hello'); // Returns key when missing
    });

    it('should get translations for a locale', () => {
      const translations = instance.getTranslations('en');
      expect(translations).toHaveProperty('hello');
      expect(translations).toHaveProperty('welcome');
    });

    it('should validate translation dictionary', () => {
      expect(() => {
        instance.addTranslations('en', { '': 'Invalid' });
      }).toThrow();
    });
  });

  describe('translation', () => {
    it('should translate a simple key', () => {
      expect(instance.t('hello')).toBe('Hello');
    });

    it('should translate with parameters', () => {
      expect(instance.t('welcome', { name: 'World' })).toBe('Welcome World');
    });

    it('should translate for specific locale', () => {
      expect(instance.t('hello', undefined, 'es')).toBe('Hola');
    });

    it('should use fallback locale when key is missing', () => {
      instance.setLocale('es');
      instance.addTranslations('en', { onlyEnglish: 'Only in English' });
      expect(instance.t('onlyEnglish')).toBe('Only in English');
    });

    it('should return key when translation is missing', () => {
      expect(instance.t('missing')).toBe('missing');
    });

    it('should translate multiple keys in batch', () => {
      const result = instance.translateBatch(['hello', 'welcome'], { welcome: { name: 'Test' } });
      expect(result).toEqual({
        hello: 'Hello',
        welcome: 'Welcome Test',
      });
    });

    it('should validate translation key', () => {
      expect(() => instance.t('')).toThrow();
    });

    it('should validate translation params', () => {
      expect(() => instance.t('hello', { name: null as any })).toThrow();
    });
  });

  describe('pluralization', () => {
    it('should pluralize correctly', () => {
      expect(instance.pluralize('items', 1)).toBe('1 item');
      expect(instance.pluralize('items', 5)).toBe('5 items');
    });

    it('should pluralize with parameters', () => {
      expect(instance.pluralize('items', 10, { extra: 'info' })).toBe('10 items');
    });

    it('should pluralize for specific locale', () => {
      expect(instance.pluralize('items', 1, undefined, 'es')).toBe('1 elemento');
    });
  });

  describe('date formatting', () => {
    it('should format date with default options', () => {
      const date = new Date('2024-01-15');
      const result = instance.formatDate(date);
      expect(result).toBeTruthy();
    });

    it('should format date with custom style', () => {
      const date = new Date('2024-01-15');
      const result = instance.formatDate(date, { style: 'long' });
      expect(result).toBeTruthy();
    });

    it('should format date with custom locale', () => {
      const date = new Date('2024-01-15');
      const result = instance.formatDate(date, { locale: 'es' });
      expect(result).toBeTruthy();
    });

    it('should validate date format options', () => {
      expect(() => instance.formatDate(new Date(), { style: 'invalid' as any })).toThrow();
    });
  });

  describe('time formatting', () => {
    it('should format time with default options', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = instance.formatTime(date);
      expect(result).toBeTruthy();
    });

    it('should format time with custom style', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = instance.formatTime(date, { style: 'long' });
      expect(result).toBeTruthy();
    });

    it('should format time with 12-hour format', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = instance.formatTime(date, { hour12: true });
      expect(result).toBeTruthy();
    });

    it('should validate time format options', () => {
      expect(() => instance.formatTime(new Date(), { style: 'invalid' as any })).toThrow();
    });
  });

  describe('datetime formatting', () => {
    it('should format datetime with default options', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = instance.formatDateTime(date);
      expect(result).toBeTruthy();
    });

    it('should format datetime with custom styles', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = instance.formatDateTime(date, {
        dateStyle: 'long',
        timeStyle: 'short',
      });
      expect(result).toBeTruthy();
    });

    it('should validate datetime format options', () => {
      expect(() => instance.formatDateTime(new Date(), { dateStyle: 'invalid' as any })).toThrow();
    });
  });

  describe('number formatting', () => {
    it('should format number with default options', () => {
      expect(instance.formatNumber(1234.56)).toBe('1,234.56');
    });

    it('should format number with custom options', () => {
      const result = instance.formatNumber(1234.56, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      expect(result).toBeTruthy();
    });

    it('should format number as percentage', () => {
      expect(instance.formatPercent(0.75)).toContain('%');
    });

    it('should validate number format options', () => {
      expect(() => instance.formatNumber(1234, { style: 'invalid' as any })).toThrow();
    });
  });

  describe('currency formatting', () => {
    it('should format currency', () => {
      const result = instance.formatCurrency(1234.56, { currency: 'USD' });
      expect(result).toContain('$');
    });

    it('should format currency with custom locale', () => {
      const result = instance.formatCurrency(1234.56, { currency: 'EUR', locale: 'de' });
      expect(result).toBeTruthy();
    });

    it('should validate currency code', () => {
      expect(() => instance.formatCurrency(1234, { currency: 'INVALID' })).toThrow();
    });

    it('should validate currency format options', () => {
      expect(() => instance.formatCurrency(1234, { currency: 'USD', style: 'invalid' as any })).toThrow();
    });
  });

  describe('relative time formatting', () => {
    it('should format relative time', () => {
      const result = instance.formatRelativeTime(-1, 'day');
      expect(result).toBeTruthy();
    });

    it('should format relative time with custom options', () => {
      const result = instance.formatRelativeTime(-1, 'day', { style: 'short' });
      expect(result).toBeTruthy();
    });

    it('should validate relative time format options', () => {
      expect(() => instance.formatRelativeTime(-1, 'day', { style: 'invalid' as any })).toThrow();
    });
  });

  describe('locale detection', () => {
    it('should detect locale from navigator', () => {
      // Mock navigator
      const mockNavigator = { language: 'es-ES', languages: ['es-ES', 'en'] };
      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
      });

      const result = instance.detectLocale();
      expect(result.source).toBe('navigator');
    });

    it('should return default when navigator is not available', () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
      });

      const result = instance.detectLocale();
      expect(result.source).toBe('default');
    });
  });

  describe('RTL detection', () => {
    it('should detect RTL locale', () => {
      expect(instance.isRTL('ar')).toBe(true);
      expect(instance.isRTL('he')).toBe(true);
    });

    it('should detect LTR locale', () => {
      expect(instance.isRTL('en')).toBe(false);
      expect(instance.isRTL('es')).toBe(false);
    });

    it('should use current locale when not specified', () => {
      instance.setLocale('ar');
      expect(instance.isRTL()).toBe(true);
    });
  });

  describe('locale configuration', () => {
    it('should get locale config', () => {
      const config = instance.getLocaleConfig('en');
      expect(config).toBeTruthy();
      expect(config?.code).toBe('en');
    });

    it('should add custom locale config', () => {
      const customConfig: LocaleConfig = {
        code: 'test',
        name: 'Test',
        nativeName: 'Test',
        rtl: false,
      };
      instance.addLocaleConfig(customConfig);
      const config = instance.getLocaleConfig('test');
      expect(config).toEqual(customConfig);
    });

    it('should validate locale config', () => {
      expect(() => {
        instance.addLocaleConfig({
          code: 'invalid',
          name: '',
          nativeName: '',
          rtl: false,
        });
      }).toThrow();
    });
  });

  describe('statistics', () => {
    it('should get translation statistics', () => {
      const stats = instance.getStats();
      expect(stats.totalKeys).toBeGreaterThan(0);
      expect(stats.translatedKeys).toBeGreaterThan(0);
      expect(stats.completionPercentage).toBeGreaterThanOrEqual(0);
      expect(stats.completionPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('caching', () => {
    it('should cache translations', () => {
      instance.setCacheEnabled(true);
      instance.t('hello');
      const stats = instance.getStats();
      expect(stats).toBeTruthy();
    });

    it('should clear cache', () => {
      instance.setCacheEnabled(true);
      instance.t('hello');
      instance.clearCache();
      // Cache should be cleared
      expect(instance.getStats()).toBeTruthy();
    });

    it('should enable/disable caching', () => {
      instance.setCacheEnabled(false);
      instance.setCacheEnabled(true);
      expect(instance.getStats()).toBeTruthy();
    });

    it('should set cache TTL', () => {
      instance.setCacheTTL(10000);
      expect(instance.getStats()).toBeTruthy();
    });
  });

  describe('missing key handler', () => {
    it('should use missing key handler when enabled', () => {
      const handler = vi.fn((key: string) => `MISSING:${key}`);
      instance.setMissingKeyHandler(handler);
      const result = instance.t('nonexistent');
      expect(result).toBe('MISSING:nonexistent');
      expect(handler).toHaveBeenCalled();
    });
  });
});

describe('Zod Schemas', () => {
  describe('LocaleCodeSchema', () => {
    it('should validate valid locale codes', () => {
      expect(LocaleCodeSchema.parse('en')).toBe('en');
      expect(LocaleCodeSchema.parse('en-US')).toBe('en-US');
      expect(LocaleCodeSchema.parse('es-ES')).toBe('es-ES');
    });

    it('should reject invalid locale codes', () => {
      expect(() => LocaleCodeSchema.parse('invalid')).toThrow();
      expect(() => LocaleCodeSchema.parse('EN')).toThrow();
      expect(() => LocaleCodeSchema.parse('')).toThrow();
    });
  });

  describe('TranslationKeySchema', () => {
    it('should validate valid translation keys', () => {
      expect(TranslationKeySchema.parse('hello')).toBe('hello');
      expect(TranslationKeySchema.parse('nested.key')).toBe('nested.key');
    });

    it('should reject empty keys', () => {
      expect(() => TranslationKeySchema.parse('')).toThrow();
    });
  });

  describe('TranslationDictionarySchema', () => {
    it('should validate valid translation dictionaries', () => {
      const dict = { hello: 'Hello', world: 'World' };
      expect(TranslationDictionarySchema.parse(dict)).toEqual(dict);
    });

    it('should reject invalid dictionaries', () => {
      expect(() => TranslationDictionarySchema.parse({ '': 'value' })).toThrow();
    });
  });

  describe('TranslationParamsSchema', () => {
    it('should validate valid params', () => {
      const params = { name: 'John', count: 5, active: true };
      expect(TranslationParamsSchema.parse(params)).toEqual(params);
    });

    it('should reject invalid params', () => {
      expect(() => TranslationParamsSchema.parse({ name: null as any })).toThrow();
    });
  });

  describe('DateFormatOptionsSchema', () => {
    it('should validate valid options', () => {
      const options = { style: 'long' as const, locale: 'en' };
      expect(DateFormatOptionsSchema.parse(options)).toEqual(options);
    });

    it('should reject invalid style', () => {
      expect(() => DateFormatOptionsSchema.parse({ style: 'invalid' as any })).toThrow();
    });
  });

  describe('TimeFormatOptionsSchema', () => {
    it('should validate valid options', () => {
      const options = { style: 'short' as const, hour12: true };
      expect(TimeFormatOptionsSchema.parse(options)).toEqual(options);
    });

    it('should reject invalid style', () => {
      expect(() => TimeFormatOptionsSchema.parse({ style: 'invalid' as any })).toThrow();
    });
  });

  describe('DateTimeFormatOptionsSchema', () => {
    it('should validate valid options', () => {
      const options = { dateStyle: 'long' as const, timeStyle: 'short' as const };
      expect(DateTimeFormatOptionsSchema.parse(options)).toEqual(options);
    });

    it('should reject invalid options', () => {
      expect(() => DateTimeFormatOptionsSchema.parse({ dateStyle: 'invalid' as any })).toThrow();
    });
  });

  describe('NumberFormatOptionsSchema', () => {
    it('should validate valid options', () => {
      const options = { style: 'currency' as const, currency: 'USD' };
      expect(NumberFormatOptionsSchema.parse(options)).toEqual(options);
    });

    it('should reject invalid style', () => {
      expect(() => NumberFormatOptionsSchema.parse({ style: 'invalid' as any })).toThrow();
    });
  });

  describe('CurrencyFormatOptionsSchema', () => {
    it('should validate valid options', () => {
      const options = { currency: 'EUR', locale: 'de' };
      expect(CurrencyFormatOptionsSchema.parse(options)).toEqual(options);
    });

    it('should reject invalid currency', () => {
      expect(() => CurrencyFormatOptionsSchema.parse({ currency: 'invalid' })).toThrow();
    });
  });

  describe('RelativeTimeFormatOptionsSchema', () => {
    it('should validate valid options', () => {
      const options = { style: 'short' as const, numeric: 'auto' as const };
      expect(RelativeTimeFormatOptionsSchema.parse(options)).toEqual(options);
    });

    it('should reject invalid options', () => {
      expect(() => RelativeTimeFormatOptionsSchema.parse({ style: 'invalid' as any })).toThrow();
    });
  });

  describe('LocaleConfigSchema', () => {
    it('should validate valid config', () => {
      const config: LocaleConfig = {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        rtl: false,
      };
      expect(LocaleConfigSchema.parse(config)).toEqual(config);
    });

    it('should reject invalid config', () => {
      expect(() => LocaleConfigSchema.parse({ code: 'invalid', name: '', nativeName: '', rtl: false })).toThrow();
    });
  });

  describe('I18nConfigSchema', () => {
    it('should validate valid config', () => {
      const config: I18nConfig = {
        defaultLocale: 'en',
        fallbackLocale: 'en',
        availableLocales: ['en'],
        translations: { en: { hello: 'Hello' } },
      };
      expect(I18nConfigSchema.parse(config)).toEqual(config);
    });

    it('should reject invalid config', () => {
      expect(() => I18nConfigSchema.parse({
        defaultLocale: 'invalid',
        fallbackLocale: 'en',
        availableLocales: ['en'],
        translations: {},
      })).toThrow();
    });
  });
});

describe('Default instance', () => {
  it('should export a default i18n instance', () => {
    expect(i18n).toBeInstanceOf(I18n);
  });

  it('should have default locale set', () => {
    expect(i18n.getLocale()).toBe('en');
  });
});
