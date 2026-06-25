/**
 * @aether/l10n - TypeScript Types
 */

/**
 * Time zone identifier (IANA time zone database)
 */
export type TimeZone = string;

/**
 * Calendar system types
 */
export type CalendarSystem = 'gregorian' | 'buddhist' | 'chinese' | 'coptic' | 'dangi' | 'ethiopic' | 'ethiopic-amete-alem' | 'hebrew' | 'indian' | 'islamic' | 'islamic-umalqura' | 'islamic-tbla' | 'islamic-civil' | 'islamic-rgsa' | 'iso8601' | 'japanese' | 'persian' | 'roc';

/**
 * Numbering system types
 */
export type NumberingSystem = 'arab' | 'arabext' | 'bali' | 'beng' | 'deva' | 'fullwide' | 'gujr' | 'guru' | 'hanidec' | 'khmr' | 'knda' | 'laoo' | 'latn' | 'limb' | 'mlym' | 'mong' | 'mymr' | 'orya' | 'tamldec' | 'telu' | 'thai' | 'tibt';

/**
 * Text direction
 */
export type TextDirection = 'ltr' | 'rtl';

/**
 * First day of week
 */
export type FirstDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Week start day names
 */
export type WeekDayName = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

/**
 * Measurement system
 */
export type MeasurementSystem = 'metric' | 'us' | 'uk';

/**
 * Paper size
 */
export type PaperSize = 'a4' | 'letter' | 'legal';

/**
 * Date separator
 */
export type DateSeparator = '/' | '-' | '.' | ' ';

/**
 * Time separator
 */
export type TimeSeparator = ':' | '.';

/**
 * Decimal separator
 */
export type DecimalSeparator = '.' | ',';

/**
 * Grouping separator
 */
export type GroupingSeparator = ',' | '.' | ' ' | '_' | "'";

/**
 * Currency symbol position
 */
export type CurrencySymbolPosition = 'before' | 'after';

/**
 * Regional settings
 */
export interface RegionalSettings {
  locale: string;
  timeZone: TimeZone;
  calendar: CalendarSystem;
  numberingSystem: NumberingSystem;
  textDirection: TextDirection;
  firstDayOfWeek: FirstDayOfWeek;
  weekStartDay: WeekDayName;
  measurementSystem: MeasurementSystem;
  paperSize: PaperSize;
  dateSeparator: DateSeparator;
  timeSeparator: TimeSeparator;
  decimalSeparator: DecimalSeparator;
  groupingSeparator: GroupingSeparator;
  currencySymbolPosition: CurrencySymbolPosition;
}

/**
 * Time zone information
 */
export interface TimeZoneInfo {
  id: TimeZone;
  name: string;
  offset: number;
  offsetString: string;
  dstOffset?: number;
  dstOffsetString?: string;
  isDST?: boolean;
  country?: string;
  city?: string;
}

/**
 * Time zone conversion options
 */
export interface TimeZoneConversionOptions {
  targetTimeZone: TimeZone;
  keepLocalTime?: boolean;
}

/**
 * Calendar date
 */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
  calendar: CalendarSystem;
  locale?: string;
}

/**
 * Calendar conversion options
 */
export interface CalendarConversionOptions {
  targetCalendar: CalendarSystem;
  locale?: string;
}

/**
 * Text direction context
 */
export interface TextDirectionContext {
  direction: TextDirection;
  locale: string;
}

/**
 * Cultural formatting options
 */
export interface CulturalFormattingOptions {
  locale: string;
  timeZone?: TimeZone;
  calendar?: CalendarSystem;
  numberingSystem?: NumberingSystem;
}

/**
 * Address format
 */
export interface AddressFormat {
  format: string[];
  requiredFields: string[];
  upperFields: string[];
  postalCodePattern?: string;
  postalCodeExample?: string;
}

/**
 * Name format
 */
export interface NameFormat {
  format: string;
  order: 'given-first' | 'family-first';
  requireFamilyName: boolean;
  requireGivenName: boolean;
}

/**
 * Phone number format
 */
export interface PhoneNumberFormat {
  pattern: string;
  example: string;
  countryCallingCode: string;
  maxLength?: number;
  minLength?: number;
}

/**
 * Regional configuration
 */
export interface RegionalConfig {
  settings: RegionalSettings;
  timeZoneInfo: TimeZoneInfo;
  addressFormat: AddressFormat;
  nameFormat: NameFormat;
  phoneNumberFormat: PhoneNumberFormat;
}

/**
 * L10n configuration options
 */
export interface L10nConfig {
  defaultLocale: string;
  defaultTimeZone: TimeZone;
  defaultCalendar: CalendarSystem;
  defaultNumberingSystem: NumberingSystem;
  enableTimeZoneDetection?: boolean;
  enableCalendarConversion?: boolean;
  customRegionalSettings?: Record<string, RegionalSettings>;
}

/**
 * Time zone detection result
 */
export interface TimeZoneDetectionResult {
  detected: TimeZone;
  confidence: number;
  source: 'iana' | 'offset' | 'default';
}

/**
 * Calendar conversion result
 */
export interface CalendarConversionResult {
  original: CalendarDate;
  converted: CalendarDate;
  conversionMethod: string;
}

/**
 * Text direction detection result
 */
export interface TextDirectionDetectionResult {
  direction: TextDirection;
  locale: string;
  confidence: number;
}

/**
 * Cultural format result
 */
export interface CulturalFormatResult {
  formatted: string;
  locale: string;
  options: CulturalFormattingOptions;
}
