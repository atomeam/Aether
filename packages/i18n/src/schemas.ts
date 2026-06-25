/**
 * @aether/i18n - Zod Schemas
 */

import { z } from 'zod';

/**
 * Locale code schema (ISO 639-1 with optional region)
 */
export const LocaleCodeSchema = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid locale code format (e.g., "en" or "en-US")');

/**
 * Translation key schema
 */
export const TranslationKeySchema = z.string().min(1, 'Translation key cannot be empty');

/**
 * Translation value schema
 */
export const TranslationValueSchema = z.string();

/**
 * Translation dictionary schema
 */
export const TranslationDictionarySchema = z.record(TranslationKeySchema, TranslationValueSchema);

/**
 * Nested translations schema
 */
export const NestedTranslationsSchema = z.record(z.union([z.string(), z.lazy(() => NestedTranslationsSchema)]));

/**
 * Translation params schema
 */
export const TranslationParamsSchema = z.record(z.union([z.string(), z.number(), z.boolean()]));

/**
 * Date format style schema
 */
export const DateFormatStyleSchema = z.enum(['short', 'medium', 'long', 'full']);

/**
 * Time format style schema
 */
export const TimeFormatStyleSchema = z.enum(['short', 'medium', 'long', 'full']);

/**
 * Number format style schema
 */
export const NumberFormatStyleSchema = z.enum(['decimal', 'currency', 'percent', 'unit']);

/**
 * Currency code schema (ISO 4217)
 */
export const CurrencyCodeSchema = z.string().length(3, 'Currency code must be 3 characters (e.g., "USD")').toUpperCase();

/**
 * Plural form schema
 */
export const PluralFormSchema = z.enum(['zero', 'one', 'two', 'few', 'many', 'other']);

/**
 * Plural rules schema
 */
export const PluralRulesSchema = z.record(PluralFormSchema, z.string());

/**
 * Locale configuration schema
 */
export const LocaleConfigSchema = z.object({
  code: LocaleCodeSchema,
  name: z.string().min(1),
  nativeName: z.string().min(1),
  rtl: z.boolean(),
  dateFormat: DateFormatStyleSchema.optional(),
  timeFormat: TimeFormatStyleSchema.optional(),
  numberFormat: NumberFormatStyleSchema.optional(),
  currency: CurrencyCodeSchema.optional(),
  pluralRules: PluralRulesSchema.optional(),
});

/**
 * Translation entry schema
 */
export const TranslationEntrySchema = z.object({
  key: TranslationKeySchema,
  value: TranslationValueSchema,
  locale: LocaleCodeSchema,
  context: z.string().optional(),
  plural: PluralRulesSchema.optional(),
});

/**
 * I18n configuration schema
 */
export const I18nConfigSchema = z.object({
  defaultLocale: LocaleCodeSchema,
  fallbackLocale: LocaleCodeSchema,
  availableLocales: z.array(LocaleCodeSchema).min(1),
  translations: z.record(LocaleCodeSchema, TranslationDictionarySchema),
  enableCache: z.boolean().optional().default(true),
  enableMissingKeyHandler: z.boolean().optional().default(false),
  missingKeyHandler: z.function().optional(),
});

/**
 * Date format options schema
 */
export const DateFormatOptionsSchema = z.object({
  style: DateFormatStyleSchema.optional(),
  locale: LocaleCodeSchema.optional(),
  timeZone: z.string().optional(),
  calendar: z.string().optional(),
  numberingSystem: z.string().optional(),
});

/**
 * Time format options schema
 */
export const TimeFormatOptionsSchema = z.object({
  style: TimeFormatStyleSchema.optional(),
  locale: LocaleCodeSchema.optional(),
  timeZone: z.string().optional(),
  hour12: z.boolean().optional(),
});

/**
 * DateTime format options schema
 */
export const DateTimeFormatOptionsSchema = z.object({
  dateStyle: DateFormatStyleSchema.optional(),
  timeStyle: TimeFormatStyleSchema.optional(),
  locale: LocaleCodeSchema.optional(),
  timeZone: z.string().optional(),
  calendar: z.string().optional(),
  numberingSystem: z.string().optional(),
  hour12: z.boolean().optional(),
});

/**
 * Number format options schema
 */
export const NumberFormatOptionsSchema = z.object({
  style: NumberFormatStyleSchema.optional(),
  locale: LocaleCodeSchema.optional(),
  currency: CurrencyCodeSchema.optional(),
  minimumFractionDigits: z.number().int().min(0).max(20).optional(),
  maximumFractionDigits: z.number().int().min(0).max(20).optional(),
  minimumSignificantDigits: z.number().int().min(1).max(21).optional(),
  maximumSignificantDigits: z.number().int().min(1).max(21).optional(),
  useGrouping: z.boolean().optional(),
});

/**
 * Currency format options schema
 */
export const CurrencyFormatOptionsSchema = z.object({
  currency: CurrencyCodeSchema,
  locale: LocaleCodeSchema.optional(),
  style: z.enum(['symbol', 'code', 'name']).optional(),
  display: z.enum(['symbol', 'narrowSymbol', 'code', 'name']).optional(),
});

/**
 * Relative time format options schema
 */
export const RelativeTimeFormatOptionsSchema = z.object({
  locale: LocaleCodeSchema.optional(),
  numeric: z.enum(['always', 'auto']).optional(),
  style: z.enum(['long', 'short', 'narrow']).optional(),
});

/**
 * Locale detection result schema
 */
export const LocaleDetectionResultSchema = z.object({
  detected: LocaleCodeSchema,
  confidence: z.number().min(0).max(1),
  source: z.enum(['navigator', 'header', 'query', 'cookie', 'storage', 'default']),
});

/**
 * Translation statistics schema
 */
export const TranslationStatsSchema = z.object({
  totalKeys: z.number().int().min(0),
  translatedKeys: z.number().int().min(0),
  missingKeys: z.number().int().min(0),
  completionPercentage: z.number().min(0).max(100),
  locales: z.record(LocaleCodeSchema, z.number().min(0).max(100)),
});

/**
 * Translation namespace schema
 */
export const TranslationNamespaceSchema = z.object({
  name: z.string().min(1),
  translations: TranslationDictionarySchema,
  locale: LocaleCodeSchema,
});

/**
 * Translation request schema
 */
export const TranslationRequestSchema = z.object({
  key: TranslationKeySchema,
  locale: LocaleCodeSchema.optional(),
  params: TranslationParamsSchema.optional(),
  fallback: z.boolean().optional().default(true),
});

/**
 * Batch translation request schema
 */
export const BatchTranslationRequestSchema = z.object({
  keys: z.array(TranslationKeySchema).min(1),
  locale: LocaleCodeSchema.optional(),
  params: z.record(TranslationParamsSchema).optional(),
  fallback: z.boolean().optional().default(true),
});

/**
 * Locale change request schema
 */
export const LocaleChangeRequestSchema = z.object({
  locale: LocaleCodeSchema,
  persist: z.boolean().optional().default(false),
});

/**
 * Add translations request schema
 */
export const AddTranslationsRequestSchema = z.object({
  locale: LocaleCodeSchema,
  translations: TranslationDictionarySchema,
  merge: z.boolean().optional().default(true),
});

/**
 * Remove translations request schema
 */
export const RemoveTranslationsRequestSchema = z.object({
  locale: LocaleCodeSchema,
  keys: z.array(TranslationKeySchema).min(1),
});

/**
 * Export type for all schemas
 */
export type LocaleCode = z.infer<typeof LocaleCodeSchema>;
export type TranslationKey = z.infer<typeof TranslationKeySchema>;
export type TranslationValue = z.infer<typeof TranslationValueSchema>;
export type TranslationDictionary = z.infer<typeof TranslationDictionarySchema>;
export type NestedTranslations = z.infer<typeof NestedTranslationsSchema>;
export type TranslationParams = z.infer<typeof TranslationParamsSchema>;
export type DateFormatStyle = z.infer<typeof DateFormatStyleSchema>;
export type TimeFormatStyle = z.infer<typeof TimeFormatStyleSchema>;
export type NumberFormatStyle = z.infer<typeof NumberFormatStyleSchema>;
export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;
export type PluralForm = z.infer<typeof PluralFormSchema>;
export type PluralRules = z.infer<typeof PluralRulesSchema>;
export type LocaleConfig = z.infer<typeof LocaleConfigSchema>;
export type TranslationEntry = z.infer<typeof TranslationEntrySchema>;
export type I18nConfig = z.infer<typeof I18nConfigSchema>;
export type DateFormatOptions = z.infer<typeof DateFormatOptionsSchema>;
export type TimeFormatOptions = z.infer<typeof TimeFormatOptionsSchema>;
export type DateTimeFormatOptions = z.infer<typeof DateTimeFormatOptionsSchema>;
export type NumberFormatOptions = z.infer<typeof NumberFormatOptionsSchema>;
export type CurrencyFormatOptions = z.infer<typeof CurrencyFormatOptionsSchema>;
export type RelativeTimeFormatOptions = z.infer<typeof RelativeTimeFormatOptionsSchema>;
export type LocaleDetectionResult = z.infer<typeof LocaleDetectionResultSchema>;
export type TranslationStats = z.infer<typeof TranslationStatsSchema>;
export type TranslationNamespace = z.infer<typeof TranslationNamespaceSchema>;
export type TranslationRequest = z.infer<typeof TranslationRequestSchema>;
export type BatchTranslationRequest = z.infer<typeof BatchTranslationRequestSchema>;
export type LocaleChangeRequest = z.infer<typeof LocaleChangeRequestSchema>;
export type AddTranslationsRequest = z.infer<typeof AddTranslationsRequestSchema>;
export type RemoveTranslationsRequest = z.infer<typeof RemoveTranslationsRequestSchema>;
