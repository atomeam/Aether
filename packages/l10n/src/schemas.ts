/**
 * @aether/l10n - Zod Schemas
 */

import { z } from 'zod';

/**
 * Time zone schema (IANA time zone database)
 */
export const TimeZoneSchema = z.string().refine(
  (val) => {
    // Common IANA time zones
    const commonTimeZones = [
      'UTC', 'GMT', 'EST', 'EDT', 'CST', 'CDT', 'MST', 'MDT', 'PST', 'PDT',
      'America/New_York', 'America/Los_Angeles', 'America/Chicago', 'America/Denver',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
      'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore',
      'Australia/Sydney', 'Australia/Melbourne',
      'Pacific/Auckland',
    ];
    return commonTimeZones.includes(val) || val.startsWith('America/') || val.startsWith('Europe/') || val.startsWith('Asia/') || val.startsWith('Australia/') || val.startsWith('Pacific/') || val.startsWith('Africa/') || val.startsWith('Indian/');
  },
  { message: 'Invalid IANA time zone identifier' }
);

/**
 * Calendar system schema
 */
export const CalendarSystemSchema = z.enum([
  'gregorian', 'buddhist', 'chinese', 'coptic', 'dangi', 'ethiopic',
  'ethiopic-amete-alem', 'hebrew', 'indian', 'islamic', 'islamic-umalqura',
  'islamic-tbla', 'islamic-civil', 'islamic-rgsa', 'iso8601', 'japanese',
  'persian', 'roc',
]);

/**
 * Numbering system schema
 */
export const NumberingSystemSchema = z.enum([
  'arab', 'arabext', 'bali', 'beng', 'deva', 'fullwide', 'gujr', 'guru',
  'hanidec', 'khmr', 'knda', 'laoo', 'latn', 'limb', 'mlym', 'mong', 'mymr',
  'orya', 'tamldec', 'telu', 'thai', 'tibt',
]);

/**
 * Text direction schema
 */
export const TextDirectionSchema = z.enum(['ltr', 'rtl']);

/**
 * First day of week schema
 */
export const FirstDayOfWeekSchema = z.number().int().min(0).max(6);

/**
 * Week day name schema
 */
export const WeekDayNameSchema = z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);

/**
 * Measurement system schema
 */
export const MeasurementSystemSchema = z.enum(['metric', 'us', 'uk']);

/**
 * Paper size schema
 */
export const PaperSizeSchema = z.enum(['a4', 'letter', 'legal']);

/**
 * Date separator schema
 */
export const DateSeparatorSchema = z.enum(['/', '-', '.', ' ']);

/**
 * Time separator schema
 */
export const TimeSeparatorSchema = z.enum([':', '.']);

/**
 * Decimal separator schema
 */
export const DecimalSeparatorSchema = z.enum(['.', ',']);

/**
 * Grouping separator schema
 */
export const GroupingSeparatorSchema = z.enum([',', '.', ' ', '_', "'"]);

/**
 * Currency symbol position schema
 */
export const CurrencySymbolPositionSchema = z.enum(['before', 'after']);

/**
 * Regional settings schema
 */
export const RegionalSettingsSchema = z.object({
  locale: z.string().min(1),
  timeZone: TimeZoneSchema,
  calendar: CalendarSystemSchema,
  numberingSystem: NumberingSystemSchema,
  textDirection: TextDirectionSchema,
  firstDayOfWeek: FirstDayOfWeekSchema,
  weekStartDay: WeekDayNameSchema,
  measurementSystem: MeasurementSystemSchema,
  paperSize: PaperSizeSchema,
  dateSeparator: DateSeparatorSchema,
  timeSeparator: TimeSeparatorSchema,
  decimalSeparator: DecimalSeparatorSchema,
  groupingSeparator: GroupingSeparatorSchema,
  currencySymbolPosition: CurrencySymbolPositionSchema,
});

/**
 * Time zone info schema
 */
export const TimeZoneInfoSchema = z.object({
  id: TimeZoneSchema,
  name: z.string().min(1),
  offset: z.number(),
  offsetString: z.string(),
  dstOffset: z.number().optional(),
  dstOffsetString: z.string().optional(),
  isDST: z.boolean().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
});

/**
 * Time zone conversion options schema
 */
export const TimeZoneConversionOptionsSchema = z.object({
  targetTimeZone: TimeZoneSchema,
  keepLocalTime: z.boolean().optional().default(false),
});

/**
 * Calendar date schema
 */
export const CalendarDateSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  calendar: CalendarSystemSchema,
  locale: z.string().optional(),
});

/**
 * Calendar conversion options schema
 */
export const CalendarConversionOptionsSchema = z.object({
  targetCalendar: CalendarSystemSchema,
  locale: z.string().optional(),
});

/**
 * Text direction context schema
 */
export const TextDirectionContextSchema = z.object({
  direction: TextDirectionSchema,
  locale: z.string().min(1),
});

/**
 * Cultural formatting options schema
 */
export const CulturalFormattingOptionsSchema = z.object({
  locale: z.string().min(1),
  timeZone: TimeZoneSchema.optional(),
  calendar: CalendarSystemSchema.optional(),
  numberingSystem: NumberingSystemSchema.optional(),
});

/**
 * Address format schema
 */
export const AddressFormatSchema = z.object({
  format: z.array(z.string()),
  requiredFields: z.array(z.string()),
  upperFields: z.array(z.string()),
  postalCodePattern: z.string().optional(),
  postalCodeExample: z.string().optional(),
});

/**
 * Name format schema
 */
export const NameFormatSchema = z.object({
  format: z.string().min(1),
  order: z.enum(['given-first', 'family-first']),
  requireFamilyName: z.boolean(),
  requireGivenName: z.boolean(),
});

/**
 * Phone number format schema
 */
export const PhoneNumberFormatSchema = z.object({
  pattern: z.string().min(1),
  example: z.string().min(1),
  countryCallingCode: z.string().min(1),
  maxLength: z.number().int().optional(),
  minLength: z.number().int().optional(),
});

/**
 * Regional configuration schema
 */
export const RegionalConfigSchema = z.object({
  settings: RegionalSettingsSchema,
  timeZoneInfo: TimeZoneInfoSchema,
  addressFormat: AddressFormatSchema,
  nameFormat: NameFormatSchema,
  phoneNumberFormat: PhoneNumberFormatSchema,
});

/**
 * L10n configuration schema
 */
export const L10nConfigSchema = z.object({
  defaultLocale: z.string().min(1),
  defaultTimeZone: TimeZoneSchema,
  defaultCalendar: CalendarSystemSchema,
  defaultNumberingSystem: NumberingSystemSchema,
  enableTimeZoneDetection: z.boolean().optional().default(true),
  enableCalendarConversion: z.boolean().optional().default(true),
  customRegionalSettings: z.record(RegionalSettingsSchema).optional(),
});

/**
 * Time zone detection result schema
 */
export const TimeZoneDetectionResultSchema = z.object({
  detected: TimeZoneSchema,
  confidence: z.number().min(0).max(1),
  source: z.enum(['iana', 'offset', 'default']),
});

/**
 * Calendar conversion result schema
 */
export const CalendarConversionResultSchema = z.object({
  original: CalendarDateSchema,
  converted: CalendarDateSchema,
  conversionMethod: z.string().min(1),
});

/**
 * Text direction detection result schema
 */
export const TextDirectionDetectionResultSchema = z.object({
  direction: TextDirectionSchema,
  locale: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

/**
 * Cultural format result schema
 */
export const CulturalFormatResultSchema = z.object({
  formatted: z.string(),
  locale: z.string().min(1),
  options: CulturalFormattingOptionsSchema,
});

/**
 * Set regional settings request schema
 */
export const SetRegionalSettingsRequestSchema = z.object({
  locale: z.string().min(1),
  settings: RegionalSettingsSchema.partial(),
});

/**
 * Convert time zone request schema
 */
export const ConvertTimeZoneRequestSchema = z.object({
  date: z.union([z.date(), z.string(), z.number()]),
  sourceTimeZone: TimeZoneSchema.optional(),
  options: TimeZoneConversionOptionsSchema,
});

/**
 * Convert calendar request schema
 */
export const ConvertCalendarRequestSchema = z.object({
  date: CalendarDateSchema,
  options: CalendarConversionOptionsSchema,
});

/**
 * Detect text direction request schema
 */
export const DetectTextDirectionRequestSchema = z.object({
  text: z.string(),
  locale: z.string().optional(),
});

/**
 * Export type for all schemas
 */
export type TimeZone = z.infer<typeof TimeZoneSchema>;
export type CalendarSystem = z.infer<typeof CalendarSystemSchema>;
export type NumberingSystem = z.infer<typeof NumberingSystemSchema>;
export type TextDirection = z.infer<typeof TextDirectionSchema>;
export type FirstDayOfWeek = z.infer<typeof FirstDayOfWeekSchema>;
export type WeekDayName = z.infer<typeof WeekDayNameSchema>;
export type MeasurementSystem = z.infer<typeof MeasurementSystemSchema>;
export type PaperSize = z.infer<typeof PaperSizeSchema>;
export type DateSeparator = z.infer<typeof DateSeparatorSchema>;
export type TimeSeparator = z.infer<typeof TimeSeparatorSchema>;
export type DecimalSeparator = z.infer<typeof DecimalSeparatorSchema>;
export type GroupingSeparator = z.infer<typeof GroupingSeparatorSchema>;
export type CurrencySymbolPosition = z.infer<typeof CurrencySymbolPositionSchema>;
export type RegionalSettings = z.infer<typeof RegionalSettingsSchema>;
export type TimeZoneInfo = z.infer<typeof TimeZoneInfoSchema>;
export type TimeZoneConversionOptions = z.infer<typeof TimeZoneConversionOptionsSchema>;
export type CalendarDate = z.infer<typeof CalendarDateSchema>;
export type CalendarConversionOptions = z.infer<typeof CalendarConversionOptionsSchema>;
export type TextDirectionContext = z.infer<typeof TextDirectionContextSchema>;
export type CulturalFormattingOptions = z.infer<typeof CulturalFormattingOptionsSchema>;
export type AddressFormat = z.infer<typeof AddressFormatSchema>;
export type NameFormat = z.infer<typeof NameFormatSchema>;
export type PhoneNumberFormat = z.infer<typeof PhoneNumberFormatSchema>;
export type RegionalConfig = z.infer<typeof RegionalConfigSchema>;
export type L10nConfig = z.infer<typeof L10nConfigSchema>;
export type TimeZoneDetectionResult = z.infer<typeof TimeZoneDetectionResultSchema>;
export type CalendarConversionResult = z.infer<typeof CalendarConversionResultSchema>;
export type TextDirectionDetectionResult = z.infer<typeof TextDirectionDetectionResultSchema>;
export type CulturalFormatResult = z.infer<typeof CulturalFormatResultSchema>;
export type SetRegionalSettingsRequest = z.infer<typeof SetRegionalSettingsRequestSchema>;
export type ConvertTimeZoneRequest = z.infer<typeof ConvertTimeZoneRequestSchema>;
export type ConvertCalendarRequest = z.infer<typeof ConvertCalendarRequestSchema>;
export type DetectTextDirectionRequest = z.infer<typeof DetectTextDirectionRequestSchema>;
