/**
 * @aether/i18n - Internationalization Core Implementation
 */

import type {
  LocaleCode,
  TranslationKey,
  TranslationDictionary,
  TranslationParams,
  DateFormatOptions,
  TimeFormatOptions,
  DateTimeFormatOptions,
  NumberFormatOptions,
  CurrencyFormatOptions,
  RelativeTimeFormatOptions,
  LocaleDetectionResult,
  TranslationStats,
  I18nConfig,
  LocaleConfig,
} from './types';
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
  LocaleDetectionResultSchema,
  TranslationStatsSchema,
  LocaleConfigSchema,
} from './schemas';

/**
 * Built-in locale configurations
 */
const BUILTIN_LOCALES: Record<LocaleCode, LocaleConfig> = {
  'en': {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'USD',
  },
  'en-US': {
    code: 'en-US',
    name: 'English (United States)',
    nativeName: 'English (United States)',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'USD',
  },
  'en-GB': {
    code: 'en-GB',
    name: 'English (United Kingdom)',
    nativeName: 'English (United Kingdom)',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'GBP',
  },
  'es': {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'EUR',
  },
  'es-ES': {
    code: 'es-ES',
    name: 'Spanish (Spain)',
    nativeName: 'Español (España)',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'EUR',
  },
  'fr': {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'EUR',
  },
  'fr-FR': {
    code: 'fr-FR',
    name: 'French (France)',
    nativeName: 'Français (France)',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'EUR',
  },
  'de': {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'EUR',
  },
  'de-DE': {
    code: 'de-DE',
    name: 'German (Germany)',
    nativeName: 'Deutsch (Deutschland)',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'EUR',
  },
  'it': {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'EUR',
  },
  'it-IT': {
    code: 'it-IT',
    name: 'Italian (Italy)',
    nativeName: 'Italiano (Italia)',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'EUR',
  },
  'pt': {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'EUR',
  },
  'pt-BR': {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'BRL',
  },
  'zh': {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'CNY',
  },
  'zh-CN': {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '中文 (简体)',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'CNY',
  },
  'zh-TW': {
    code: 'zh-TW',
    name: 'Chinese (Traditional)',
    nativeName: '中文 (繁體)',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'TWD',
  },
  'ja': {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'JPY',
  },
  'ja-JP': {
    code: 'ja-JP',
    name: 'Japanese (Japan)',
    nativeName: '日本語 (日本)',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'JPY',
  },
  'ko': {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'KRW',
  },
  'ko-KR': {
    code: 'ko-KR',
    name: 'Korean (South Korea)',
    nativeName: '한국어 (대한민국)',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'KRW',
  },
  'ar': {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    rtl: true,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'SAR',
  },
  'ar-SA': {
    code: 'ar-SA',
    name: 'Arabic (Saudi Arabia)',
    nativeName: 'العربية (المملكة العربية السعودية)',
    rtl: true,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'SAR',
  },
  'he': {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    rtl: true,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'ILS',
  },
  'he-IL': {
    code: 'he-IL',
    name: 'Hebrew (Israel)',
    nativeName: 'עברית (ישראל)',
    rtl: true,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'ILS',
  },
  'ru': {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'RUB',
  },
  'ru-RU': {
    code: 'ru-RU',
    name: 'Russian (Russia)',
    nativeName: 'Русский (Россия)',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'RUB',
  },
  'hi': {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'INR',
  },
  'hi-IN': {
    code: 'hi-IN',
    name: 'Hindi (India)',
    nativeName: 'हिन्दी (भारत)',
    rtl: false,
    dateFormat: 'short',
    timeFormat: 'short',
    numberFormat: 'decimal',
    currency: 'INR',
  },
};

/**
 * Translation cache entry
 */
interface CacheEntry {
  value: string;
  timestamp: number;
}

/**
 * I18n class for internationalization
 */
export class I18n {
  private currentLocale: LocaleCode;
  private fallbackLocale: LocaleCode;
  private translations: Record<LocaleCode, TranslationDictionary>;
  private cache: Map<string, CacheEntry>;
  private cacheEnabled: boolean;
  private cacheTTL: number;
  private missingKeyHandler: ((key: TranslationKey, locale: LocaleCode) => string) | null;
  private localeConfigs: Record<LocaleCode, LocaleConfig>;

  constructor(config?: Partial<I18nConfig>) {
    const validatedConfig = I18nConfigSchema.parse({
      defaultLocale: config?.defaultLocale || 'en',
      fallbackLocale: config?.fallbackLocale || 'en',
      availableLocales: config?.availableLocales || ['en'],
      translations: config?.translations || {},
      enableCache: config?.enableCache ?? true,
      enableMissingKeyHandler: config?.enableMissingKeyHandler ?? false,
      missingKeyHandler: config?.missingKeyHandler,
    });

    this.currentLocale = validatedConfig.defaultLocale;
    this.fallbackLocale = validatedConfig.fallbackLocale;
    this.translations = validatedConfig.translations;
    this.cacheEnabled = validatedConfig.enableCache;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    this.cache = new Map();
    this.missingKeyHandler = validatedConfig.enableMissingKeyHandler ? validatedConfig.missingKeyHandler || null : null;
    this.localeConfigs = { ...BUILTIN_LOCALES };
  }

  /**
   * Set the current locale
   */
  setLocale(locale: LocaleCode): void {
    const validated = LocaleCodeSchema.parse(locale);
    this.currentLocale = validated;
    this.clearCache();
  }

  /**
   * Get the current locale
   */
  getLocale(): LocaleCode {
    return this.currentLocale;
  }

  /**
   * Set the fallback locale
   */
  setFallbackLocale(locale: LocaleCode): void {
    const validated = LocaleCodeSchema.parse(locale);
    this.fallbackLocale = validated;
  }

  /**
   * Get the fallback locale
   */
  getFallbackLocale(): LocaleCode {
    return this.fallbackLocale;
  }

  /**
   * Add translations for a locale
   */
  addTranslations(locale: LocaleCode, translations: TranslationDictionary, merge: boolean = true): void {
    const validatedLocale = LocaleCodeSchema.parse(locale);
    const validatedTranslations = TranslationDictionarySchema.parse(translations);

    if (merge && this.translations[validatedLocale]) {
      this.translations[validatedLocale] = {
        ...this.translations[validatedLocale],
        ...validatedTranslations,
      };
    } else {
      this.translations[validatedLocale] = { ...validatedTranslations };
    }

    this.clearCache();
  }

  /**
   * Remove translations for a locale
   */
  removeTranslations(locale: LocaleCode, keys: TranslationKey[]): void {
    const validatedLocale = LocaleCodeSchema.parse(locale);
    const validatedKeys = keys.map(key => TranslationKeySchema.parse(key));

    if (this.translations[validatedLocale]) {
      validatedKeys.forEach(key => {
        delete this.translations[validatedLocale][key];
      });
    }

    this.clearCache();
  }

  /**
   * Get translations for a locale
   */
  getTranslations(locale?: LocaleCode): TranslationDictionary {
    const targetLocale = locale || this.currentLocale;
    return { ...this.translations[targetLocale] };
  }

  /**
   * Translate a key with optional parameters
   */
  translate(key: TranslationKey, params?: TranslationParams, locale?: LocaleCode): string {
    return this.t(key, params, locale);
  }

  /**
   * Alias for translate
   */
  t(key: TranslationKey, params?: TranslationParams, locale?: LocaleCode): string {
    const validatedKey = TranslationKeySchema.parse(key);
    const targetLocale = locale || this.currentLocale;
    const validatedParams = params ? TranslationParamsSchema.parse(params) : undefined;

    // Check cache
    const cacheKey = this.getCacheKey(validatedKey, targetLocale, validatedParams);
    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;
      if (Date.now() - entry.timestamp < this.cacheTTL) {
        return entry.value;
      }
      this.cache.delete(cacheKey);
    }

    // Get translation
    let translation = this.translations[targetLocale]?.[validatedKey];

    // Try fallback locale
    if (!translation && targetLocale !== this.fallbackLocale) {
      translation = this.translations[this.fallbackLocale]?.[validatedKey];
    }

    // Handle missing key
    if (!translation) {
      if (this.missingKeyHandler) {
        translation = this.missingKeyHandler(validatedKey, targetLocale);
      } else {
        translation = validatedKey;
      }
    }

    // Interpolate parameters
    if (validatedParams) {
      translation = this.interpolate(translation, validatedParams);
    }

    // Cache result
    if (this.cacheEnabled) {
      this.cache.set(cacheKey, { value: translation, timestamp: Date.now() });
    }

    return translation;
  }

  /**
   * Translate multiple keys
   */
  translateBatch(keys: TranslationKey[], params?: Record<TranslationKey, TranslationParams>, locale?: LocaleCode): Record<TranslationKey, string> {
    const result: Record<TranslationKey, string> = {};
    keys.forEach(key => {
      result[key] = this.t(key, params?.[key], locale);
    });
    return result;
  }

  /**
   * Pluralize a translation
   */
  pluralize(key: TranslationKey, count: number, params?: TranslationParams, locale?: LocaleCode): string {
    const targetLocale = locale || this.currentLocale;
    const pluralForm = this.getPluralForm(count, targetLocale);
    const pluralKey = `${key}_${pluralForm}`;
    return this.t(pluralKey, { ...params, count }, locale);
  }

  /**
   * Format a date
   */
  formatDate(date: Date | string | number, options?: DateFormatOptions): string {
    const validatedOptions = DateFormatOptionsSchema.parse(options || {});
    const targetLocale = validatedOptions.locale || this.currentLocale;
    const dateObj = date instanceof Date ? date : new Date(date);

    const intlOptions: Intl.DateTimeFormatOptions = {
      dateStyle: validatedOptions.style || 'short',
      timeZone: validatedOptions.timeZone,
      calendar: validatedOptions.calendar as Intl.DateTimeFormatOptions['calendar'],
      numberingSystem: validatedOptions.numberingSystem as Intl.DateTimeFormatOptions['numberingSystem'],
    };

    return new Intl.DateTimeFormat(targetLocale, intlOptions).format(dateObj);
  }

  /**
   * Format a time
   */
  formatTime(date: Date | string | number, options?: TimeFormatOptions): string {
    const validatedOptions = TimeFormatOptionsSchema.parse(options || {});
    const targetLocale = validatedOptions.locale || this.currentLocale;
    const dateObj = date instanceof Date ? date : new Date(date);

    const intlOptions: Intl.DateTimeFormatOptions = {
      timeStyle: validatedOptions.style || 'short',
      timeZone: validatedOptions.timeZone,
      hour12: validatedOptions.hour12,
    };

    return new Intl.DateTimeFormat(targetLocale, intlOptions).format(dateObj);
  }

  /**
   * Format a date and time
   */
  formatDateTime(date: Date | string | number, options?: DateTimeFormatOptions): string {
    const validatedOptions = DateTimeFormatOptionsSchema.parse(options || {});
    const targetLocale = validatedOptions.locale || this.currentLocale;
    const dateObj = date instanceof Date ? date : new Date(date);

    const intlOptions: Intl.DateTimeFormatOptions = {
      dateStyle: validatedOptions.dateStyle || 'short',
      timeStyle: validatedOptions.timeStyle || 'short',
      timeZone: validatedOptions.timeZone,
      calendar: validatedOptions.calendar as Intl.DateTimeFormatOptions['calendar'],
      numberingSystem: validatedOptions.numberingSystem as Intl.DateTimeFormatOptions['numberingSystem'],
      hour12: validatedOptions.hour12,
    };

    return new Intl.DateTimeFormat(targetLocale, intlOptions).format(dateObj);
  }

  /**
   * Format a number
   */
  formatNumber(number: number, options?: NumberFormatOptions): string {
    const validatedOptions = NumberFormatOptionsSchema.parse(options || {});
    const targetLocale = validatedOptions.locale || this.currentLocale;

    const intlOptions: Intl.NumberFormatOptions = {
      style: validatedOptions.style || 'decimal',
      currency: validatedOptions.currency,
      minimumFractionDigits: validatedOptions.minimumFractionDigits,
      maximumFractionDigits: validatedOptions.maximumFractionDigits,
      minimumSignificantDigits: validatedOptions.minimumSignificantDigits,
      maximumSignificantDigits: validatedOptions.maximumSignificantDigits,
      useGrouping: validatedOptions.useGrouping,
    };

    return new Intl.NumberFormat(targetLocale, intlOptions).format(number);
  }

  /**
   * Format a currency amount
   */
  formatCurrency(amount: number, options: CurrencyFormatOptions): string {
    const validatedOptions = CurrencyFormatOptionsSchema.parse(options);
    const targetLocale = validatedOptions.locale || this.currentLocale;

    const intlOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: validatedOptions.currency,
      currencyDisplay: validatedOptions.display || 'symbol',
    };

    return new Intl.NumberFormat(targetLocale, intlOptions).format(amount);
  }

  /**
   * Format a percentage
   */
  formatPercent(number: number, options?: Omit<NumberFormatOptions, 'style'>): string {
    return this.formatNumber(number, { ...options, style: 'percent' });
  }

  /**
   * Format relative time
   */
  formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, options?: RelativeTimeFormatOptions): string {
    const validatedOptions = RelativeTimeFormatOptionsSchema.parse(options || {});
    const targetLocale = validatedOptions.locale || this.currentLocale;

    const intlOptions: Intl.RelativeTimeFormatOptions = {
      numeric: validatedOptions.numeric || 'always',
      style: validatedOptions.style || 'long',
    };

    const formatter = new Intl.RelativeTimeFormat(targetLocale, intlOptions);
    return formatter.format(value, unit);
  }

  /**
   * Detect the user's locale
   */
  detectLocale(): LocaleDetectionResult {
    // Try navigator language (browser)
    if (typeof navigator !== 'undefined' && navigator.language) {
      const detected = this.normalizeLocale(navigator.language);
      if (this.isLocaleAvailable(detected)) {
        return {
          detected,
          confidence: 0.9,
          source: 'navigator',
        };
      }
    }

    // Try navigator languages (browser)
    if (typeof navigator !== 'undefined' && navigator.languages) {
      for (const lang of navigator.languages) {
        const detected = this.normalizeLocale(lang);
        if (this.isLocaleAvailable(detected)) {
          return {
            detected,
            confidence: 0.8,
            source: 'navigator',
          };
        }
      }
    }

    // Return default
    return {
      detected: this.currentLocale,
      confidence: 0.5,
      source: 'default',
    };
  }

  /**
   * Check if a locale is RTL
   */
  isRTL(locale?: LocaleCode): boolean {
    const targetLocale = locale || this.currentLocale;
    const config = this.localeConfigs[targetLocale];
    return config?.rtl || false;
  }

  /**
   * Get available locales
   */
  getAvailableLocales(): LocaleCode[] {
    return Object.keys(this.translations);
  }

  /**
   * Get locale configuration
   */
  getLocaleConfig(locale?: LocaleCode): LocaleConfig | null {
    const targetLocale = locale || this.currentLocale;
    return this.localeConfigs[targetLocale] || null;
  }

  /**
   * Add a custom locale configuration
   */
  addLocaleConfig(config: LocaleConfig): void {
    const validated = LocaleConfigSchema.parse(config);
    this.localeConfigs[validated.code] = validated;
  }

  /**
   * Get translation statistics
   */
  getStats(): TranslationStats {
    const locales = this.getAvailableLocales();
    const allKeys = new Set<TranslationKey>();

    // Collect all keys from all locales
    locales.forEach(locale => {
      Object.keys(this.translations[locale]).forEach(key => allKeys.add(key));
    });

    const totalKeys = allKeys.size;
    const localeStats: Record<LocaleCode, number> = {};

    locales.forEach(locale => {
      const translatedKeys = Object.keys(this.translations[locale]).length;
      localeStats[locale] = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0;
    });

    const translatedKeys = Object.keys(this.translations[this.currentLocale] || {}).length;
    const missingKeys = totalKeys - translatedKeys;
    const completionPercentage = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0;

    return {
      totalKeys,
      translatedKeys,
      missingKeys,
      completionPercentage,
      locales: localeStats,
    };
  }

  /**
   * Clear the translation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Enable or disable caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }

  /**
   * Set cache TTL in milliseconds
   */
  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
  }

  /**
   * Set missing key handler
   */
  setMissingKeyHandler(handler: (key: TranslationKey, locale: LocaleCode) => string): void {
    this.missingKeyHandler = handler;
  }

  /**
   * Interpolate parameters into a template
   */
  private interpolate(template: string, params: TranslationParams): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return String(params[key] ?? match);
    });
  }

  /**
   * Get cache key
   */
  private getCacheKey(key: TranslationKey, locale: LocaleCode, params?: TranslationParams): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${locale}:${key}:${paramsStr}`;
  }

  /**
   * Normalize locale code
   */
  private normalizeLocale(locale: string): LocaleCode {
    return locale.replace('_', '-').toLowerCase();
  }

  /**
   * Check if locale is available
   */
  private isLocaleAvailable(locale: LocaleCode): boolean {
    return this.translations[locale] !== undefined;
  }

  /**
   * Get plural form for a count
   */
  private getPluralForm(count: number, locale: LocaleCode): string {
    const pluralRules = new Intl.PluralRules(locale);
    return pluralRules.select(count);
  }
}

/**
 * Default I18n instance
 */
export const i18n = new I18n();

/**
 * Create a new I18n instance
 */
export function createI18n(config?: Partial<I18nConfig>): I18n {
  return new I18n(config);
}
