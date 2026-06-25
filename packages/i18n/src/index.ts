/**
 * @aether/i18n - Internationalization Package
 *
 * A comprehensive internationalization library for JavaScript/TypeScript applications.
 * Provides translation management, locale detection, and formatting utilities.
 *
 * @example
 * ```ts
 * import { i18n } from '@aether/i18n';
 *
 * i18n.setLocale('en');
 * i18n.addTranslations('en', { hello: 'Hello {{name}}!' });
 * console.log(i18n.t('hello', { name: 'World' })); // "Hello World!"
 * ```
 */

// Core I18n class and instances
export { I18n, i18n, createI18n } from './i18n';

// TypeScript types
export type {
  LocaleCode,
  TranslationKey,
  TranslationValue,
  TranslationDictionary,
  NestedTranslations,
  TranslationParams,
  DateFormatStyle,
  TimeFormatStyle,
  NumberFormatStyle,
  CurrencyCode,
  PluralForm,
  PluralRules,
  LocaleConfig,
  TranslationEntry,
  I18nConfig,
  DateFormatOptions,
  TimeFormatOptions,
  DateTimeFormatOptions,
  NumberFormatOptions,
  CurrencyFormatOptions,
  RelativeTimeFormatOptions,
  LocaleDetectionResult,
  TranslationStats,
  TranslationNamespace,
} from './types';

// Zod schemas
export {
  LocaleCodeSchema,
  TranslationKeySchema,
  TranslationValueSchema,
  TranslationDictionarySchema,
  NestedTranslationsSchema,
  TranslationParamsSchema,
  DateFormatStyleSchema,
  TimeFormatStyleSchema,
  NumberFormatStyleSchema,
  CurrencyCodeSchema,
  PluralFormSchema,
  PluralRulesSchema,
  LocaleConfigSchema,
  TranslationEntrySchema,
  I18nConfigSchema,
  DateFormatOptionsSchema,
  TimeFormatOptionsSchema,
  DateTimeFormatOptionsSchema,
  NumberFormatOptionsSchema,
  CurrencyFormatOptionsSchema,
  RelativeTimeFormatOptionsSchema,
  LocaleDetectionResultSchema,
  TranslationStatsSchema,
  TranslationNamespaceSchema,
  TranslationRequestSchema,
  BatchTranslationRequestSchema,
  LocaleChangeRequestSchema,
  AddTranslationsRequestSchema,
  RemoveTranslationsRequestSchema,
} from './schemas';

// Re-export schema types for convenience
export type {
  LocaleCode as SchemaLocaleCode,
  TranslationKey as SchemaTranslationKey,
  TranslationValue as SchemaTranslationValue,
  TranslationDictionary as SchemaTranslationDictionary,
  NestedTranslations as SchemaNestedTranslations,
  TranslationParams as SchemaTranslationParams,
  DateFormatStyle as SchemaDateFormatStyle,
  TimeFormatStyle as SchemaTimeFormatStyle,
  NumberFormatStyle as SchemaNumberFormatStyle,
  CurrencyCode as SchemaCurrencyCode,
  PluralForm as SchemaPluralForm,
  PluralRules as SchemaPluralRules,
  LocaleConfig as SchemaLocaleConfig,
  TranslationEntry as SchemaTranslationEntry,
  I18nConfig as SchemaI18nConfig,
  DateFormatOptions as SchemaDateFormatOptions,
  TimeFormatOptions as SchemaTimeFormatOptions,
  DateTimeFormatOptions as SchemaDateTimeFormatOptions,
  NumberFormatOptions as SchemaNumberFormatOptions,
  CurrencyFormatOptions as SchemaCurrencyFormatOptions,
  RelativeTimeFormatOptions as SchemaRelativeTimeFormatOptions,
  LocaleDetectionResult as SchemaLocaleDetectionResult,
  TranslationStats as SchemaTranslationStats,
  TranslationNamespace as SchemaTranslationNamespace,
  TranslationRequest,
  BatchTranslationRequest,
  LocaleChangeRequest,
  AddTranslationsRequest,
  RemoveTranslationsRequest,
} from './schemas';