/**
 * @aether/i18n - TypeScript Types
 */

/**
 * Supported locale codes (ISO 639-1 with optional region)
 */
export type LocaleCode = string;

/**
 * Translation key path (dot notation for nested keys)
 */
export type TranslationKey = string;

/**
 * Translation value with optional interpolation
 */
export type TranslationValue = string;

/**
 * Translation dictionary structure
 */
export type TranslationDictionary = Record<TranslationKey, TranslationValue>;

/**
 * Nested translation structure
 */
export type NestedTranslations = Record<string, string | NestedTranslations>;

/**
 * Translation parameters for interpolation
 */
export type TranslationParams = Record<string, string | number | boolean>;

/**
 * Date format styles
 */
export type DateFormatStyle = 'short' | 'medium' | 'long' | 'full';

/**
 * Time format styles
 */
export type TimeFormatStyle = 'short' | 'medium' | 'long' | 'full';

/**
 * Number format styles
 */
export type NumberFormatStyle = 'decimal' | 'currency' | 'percent' | 'unit';

/**
 * Currency codes (ISO 4217)
 */
export type CurrencyCode = string;

/**
 * Plural forms
 */
export type PluralForm = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/**
 * Plural rules for a locale
 */
export type PluralRules = Record<PluralForm, string>;

/**
 * Locale configuration
 */
export interface LocaleConfig {
  code: LocaleCode;
  name: string;
  nativeName: string;
  rtl: boolean;
  dateFormat?: DateFormatStyle;
  timeFormat?: TimeFormatStyle;
  numberFormat?: NumberFormatStyle;
  currency?: CurrencyCode;
  pluralRules?: PluralRules;
}

/**
 * Translation entry with metadata
 */
export interface TranslationEntry {
  key: TranslationKey;
  value: TranslationValue;
  locale: LocaleCode;
  context?: string;
  plural?: PluralRules;
}

/**
 * I18n configuration options
 */
export interface I18nConfig {
  defaultLocale: LocaleCode;
  fallbackLocale: LocaleCode;
  availableLocales: LocaleCode[];
  translations: Record<LocaleCode, TranslationDictionary>;
  enableCache?: boolean;
  enableMissingKeyHandler?: boolean;
  missingKeyHandler?: (key: TranslationKey, locale: LocaleCode) => string;
}

/**
 * Date formatting options
 */
export interface DateFormatOptions {
  style?: DateFormatStyle;
  locale?: LocaleCode;
  timeZone?: string;
  calendar?: string;
  numberingSystem?: string;
}

/**
 * Time formatting options
 */
export interface TimeFormatOptions {
  style?: TimeFormatStyle;
  locale?: LocaleCode;
  timeZone?: string;
  hour12?: boolean;
}

/**
 * DateTime formatting options
 */
export interface DateTimeFormatOptions extends DateFormatOptions, TimeFormatOptions {
  dateStyle?: DateFormatStyle;
  timeStyle?: TimeFormatStyle;
}

/**
 * Number formatting options
 */
export interface NumberFormatOptions {
  style?: NumberFormatStyle;
  locale?: LocaleCode;
  currency?: CurrencyCode;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  minimumSignificantDigits?: number;
  maximumSignificantDigits?: number;
  useGrouping?: boolean;
}

/**
 * Currency formatting options
 */
export interface CurrencyFormatOptions {
  currency: CurrencyCode;
  locale?: LocaleCode;
  style?: 'symbol' | 'code' | 'name';
  display?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
}

/**
 * Relative time formatting options
 */
export interface RelativeTimeFormatOptions {
  locale?: LocaleCode;
  numeric?: 'always' | 'auto';
  style?: 'long' | 'short' | 'narrow';
}

/**
 * Locale detection result
 */
export interface LocaleDetectionResult {
  detected: LocaleCode;
  confidence: number;
  source: 'navigator' | 'header' | 'query' | 'cookie' | 'storage' | 'default';
}

/**
 * Translation statistics
 */
export interface TranslationStats {
  totalKeys: number;
  translatedKeys: number;
  missingKeys: number;
  completionPercentage: number;
  locales: Record<LocaleCode, number>;
}

/**
 * Translation namespace
 */
export interface TranslationNamespace {
  name: string;
  translations: TranslationDictionary;
  locale: LocaleCode;
}
