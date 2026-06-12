/**
 * @aether/l10n - Localization Core Implementation
 */

import type {
  TimeZone,
  CalendarSystem,
  NumberingSystem,
  TextDirection,
  FirstDayOfWeek,
  WeekDayName,
  MeasurementSystem,
  PaperSize,
  DateSeparator,
  TimeSeparator,
  DecimalSeparator,
  GroupingSeparator,
  CurrencySymbolPosition,
  RegionalSettings,
  TimeZoneInfo,
  TimeZoneConversionOptions,
  CalendarDate,
  CalendarConversionOptions,
  TextDirectionContext,
  CulturalFormattingOptions,
  AddressFormat,
  NameFormat,
  PhoneNumberFormat,
  RegionalConfig,
  L10nConfig,
  TimeZoneDetectionResult,
  CalendarConversionResult,
  TextDirectionDetectionResult,
  CulturalFormatResult,
} from './types';
import {
  L10nConfigSchema,
  TimeZoneSchema,
  CalendarSystemSchema,
  NumberingSystemSchema,
  TextDirectionSchema,
  RegionalSettingsSchema,
  TimeZoneConversionOptionsSchema,
  CalendarDateSchema,
  CalendarConversionOptionsSchema,
  CulturalFormattingOptionsSchema,
  TimeZoneDetectionResultSchema,
  TextDirectionDetectionResultSchema,
  CulturalFormatResultSchema,
} from './schemas';

/**
 * Built-in regional settings for common locales
 */
const BUILTIN_REGIONAL_SETTINGS: Record<string, RegionalSettings> = {
  'en-US': {
    locale: 'en-US',
    timeZone: 'America/New_York',
    calendar: 'gregorian',
    numberingSystem: 'latn',
    textDirection: 'ltr',
    firstDayOfWeek: 0,
    weekStartDay: 'sunday',
    measurementSystem: 'us',
    paperSize: 'letter',
    dateSeparator: '/',
    timeSeparator: ':',
    decimalSeparator: '.',
    groupingSeparator: ',',
    currencySymbolPosition: 'before',
  },
  'en-GB': {
    locale: 'en-GB',
    timeZone: 'Europe/London',
    calendar: 'gregorian',
    numberingSystem: 'latn',
    textDirection: 'ltr',
    firstDayOfWeek: 1,
    weekStartDay: 'monday',
    measurementSystem: 'metric',
    paperSize: 'a4',
    dateSeparator: '/',
    timeSeparator: ':',
    decimalSeparator: '.',
    groupingSeparator: ',',
    currencySymbolPosition: 'before',
  },
  'es-ES': {
    locale: 'es-ES',
    timeZone: 'Europe/Madrid',
    calendar: 'gregorian',
    numberingSystem: 'latn',
    textDirection: 'ltr',
    firstDayOfWeek: 1,
    weekStartDay: 'monday',
    measurementSystem: 'metric',
    paperSize: 'a4',
    dateSeparator: '/',
    timeSeparator: ':',
    decimalSeparator: ',',
    groupingSeparator: '.',
    currencySymbolPosition: 'after',
  },
  'fr-FR': {
    locale: 'fr-FR',
    timeZone: 'Europe/Paris',
    calendar: 'gregorian',
    numberingSystem: 'latn',
    textDirection: 'ltr',
    firstDayOfWeek: 1,
    weekStartDay: 'monday',
    measurementSystem: 'metric',
    paperSize: 'a4',
    dateSeparator: '/',
    timeSeparator: ':',
    decimalSeparator: ',',
    groupingSeparator: ' ',
    currencySymbolPosition: 'after',
  },
  'de-DE': {
    locale: 'de-DE',
    timeZone: 'Europe/Berlin',
    calendar: 'gregorian',
    numberingSystem: 'latn',
    textDirection: 'ltr',
    firstDayOfWeek: 1,
    weekStartDay: 'monday',
    measurementSystem: 'metric',
    paperSize: 'a4',
    dateSeparator: '.',
    timeSeparator: ':',
    decimalSeparator: ',',
    groupingSeparator: '.',
    currencySymbolPosition: 'before',
  },
  'ja-JP': {
    locale: 'ja-JP',
    timeZone: 'Asia/Tokyo',
    calendar: 'gregorian',
    numberingSystem: 'latn',
    textDirection: 'ltr',
    firstDayOfWeek: 0,
    weekStartDay: 'sunday',
    measurementSystem: 'metric',
    paperSize: 'a4',
    dateSeparator: '/',
    timeSeparator: ':',
    decimalSeparator: '.',
    groupingSeparator: ',',
    currencySymbolPosition: 'before',
  },
  'zh-CN': {
    locale: 'zh-CN',
    timeZone: 'Asia/Shanghai',
    calendar: 'gregorian',
    numberingSystem: 'latn',
    textDirection: 'ltr',
    firstDayOfWeek: 1,
    weekStartDay: 'monday',
    measurementSystem: 'metric',
    paperSize: 'a4',
    dateSeparator: '/',
    timeSeparator: ':',
    decimalSeparator: '.',
    groupingSeparator: ',',
    currencySymbolPosition: 'before',
  },
  'ar-SA': {
    locale: 'ar-SA',
    timeZone: 'Asia/Riyadh',
    calendar: 'islamic-umalqura',
    numberingSystem: 'arab',
    textDirection: 'rtl',
    firstDayOfWeek: 0,
    weekStartDay: 'sunday',
    measurementSystem: 'metric',
    paperSize: 'a4',
    dateSeparator: '/',
    timeSeparator: ':',
    decimalSeparator: '.',
    groupingSeparator: ',',
    currencySymbolPosition: 'before',
  },
  'he-IL': {
    locale: 'he-IL',
    timeZone: 'Asia/Jerusalem',
    calendar: 'gregorian',
    numberingSystem: 'latn',
    textDirection: 'rtl',
    firstDayOfWeek: 0,
    weekStartDay: 'sunday',
    measurementSystem: 'metric',
    paperSize: 'a4',
    dateSeparator: '/',
    timeSeparator: ':',
    decimalSeparator: '.',
    groupingSeparator: ',',
    currencySymbolPosition: 'before',
  },
  'ru-RU': {
    locale: 'ru-RU',
    timeZone: 'Europe/Moscow',
    calendar: 'gregorian',
    numberingSystem: 'latn',
    textDirection: 'ltr',
    firstDayOfWeek: 1,
    weekStartDay: 'monday',
    measurementSystem: 'metric',
    paperSize: 'a4',
    dateSeparator: '.',
    timeSeparator: ':',
    decimalSeparator: ',',
    groupingSeparator: ' ',
    currencySymbolPosition: 'after',
  },
};

/**
 * Built-in address formats
 */
const BUILTIN_ADDRESS_FORMATS: Record<string, AddressFormat> = {
  'en-US': {
    format: ['recipient', 'street', 'city', 'region', 'postalCode', 'country'],
    requiredFields: ['street', 'city', 'region', 'postalCode'],
    upperFields: ['region'],
    postalCodePattern: '\\d{5}(-\\d{4})?',
    postalCodeExample: '12345',
  },
  'en-GB': {
    format: ['recipient', 'street', 'city', 'region', 'postalCode', 'country'],
    requiredFields: ['street', 'city', 'postalCode'],
    upperFields: ['postalCode'],
    postalCodePattern: '[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}',
    postalCodeExample: 'SW1A 1AA',
  },
  'de-DE': {
    format: ['recipient', 'street', 'postalCode', 'city', 'country'],
    requiredFields: ['street', 'postalCode', 'city'],
    upperFields: [],
    postalCodePattern: '\\d{5}',
    postalCodeExample: '10115',
  },
  'ja-JP': {
    format: ['recipient', 'postalCode', 'region', 'city', 'street', 'country'],
    requiredFields: ['postalCode', 'region', 'city', 'street'],
    upperFields: [],
    postalCodePattern: '\\d{3}-\\d{4}',
    postalCodeExample: '100-0001',
  },
};

/**
 * Built-in name formats
 */
const BUILTIN_NAME_FORMATS: Record<string, NameFormat> = {
  'en-US': {
    format: '{given} {family}',
    order: 'given-first',
    requireFamilyName: true,
    requireGivenName: true,
  },
  'ja-JP': {
    format: '{family} {given}',
    order: 'family-first',
    requireFamilyName: true,
    requireGivenName: true,
  },
  'zh-CN': {
    format: '{family}{given}',
    order: 'family-first',
    requireFamilyName: true,
    requireGivenName: true,
  },
  'es-ES': {
    format: '{given} {family}',
    order: 'given-first',
    requireFamilyName: true,
    requireGivenName: true,
  },
};

/**
 * Built-in phone number formats
 */
const BUILTIN_PHONE_FORMATS: Record<string, PhoneNumberFormat> = {
  'en-US': {
    pattern: '+1 (XXX) XXX-XXXX',
    example: '+1 (555) 123-4567',
    countryCallingCode: '1',
    minLength: 10,
    maxLength: 10,
  },
  'en-GB': {
    pattern: '+44 XXXX XXXXXX',
    example: '+44 7911 123456',
    countryCallingCode: '44',
    minLength: 10,
    maxLength: 11,
  },
  'de-DE': {
    pattern: '+49 XXX XXXXXXXX',
    example: '+49 151 12345678',
    countryCallingCode: '49',
    minLength: 10,
    maxLength: 11,
  },
  'ja-JP': {
    pattern: '+81 XX-XXXX-XXXX',
    example: '+81 90-1234-5678',
    countryCallingCode: '81',
    minLength: 10,
    maxLength: 11,
  },
};

/**
 * L10n class for localization
 */
export class L10n {
  private currentLocale: string;
  private currentTimeZone: TimeZone;
  private currentCalendar: CalendarSystem;
  private currentNumberingSystem: NumberingSystem;
  private regionalSettings: Record<string, RegionalSettings>;
  private addressFormats: Record<string, AddressFormat>;
  private nameFormats: Record<string, NameFormat>;
  private phoneNumberFormats: Record<string, PhoneNumberFormat>;
  private enableTimeZoneDetection: boolean;
  private enableCalendarConversion: boolean;

  constructor(config?: Partial<L10nConfig>) {
    const validatedConfig = L10nConfigSchema.parse({
      defaultLocale: config?.defaultLocale || 'en-US',
      defaultTimeZone: config?.defaultTimeZone || 'UTC',
      defaultCalendar: config?.defaultCalendar || 'gregorian',
      defaultNumberingSystem: config?.defaultNumberingSystem || 'latn',
      enableTimeZoneDetection: config?.enableTimeZoneDetection ?? true,
      enableCalendarConversion: config?.enableCalendarConversion ?? true,
      customRegionalSettings: config?.customRegionalSettings,
    });

    this.currentLocale = validatedConfig.defaultLocale;
    this.currentTimeZone = validatedConfig.defaultTimeZone;
    this.currentCalendar = validatedConfig.defaultCalendar;
    this.currentNumberingSystem = validatedConfig.defaultNumberingSystem;
    this.enableTimeZoneDetection = validatedConfig.enableTimeZoneDetection;
    this.enableCalendarConversion = validatedConfig.enableCalendarConversion;

    this.regionalSettings = {
      ...BUILTIN_REGIONAL_SETTINGS,
      ...(validatedConfig.customRegionalSettings || {}),
    } as Record<string, RegionalSettings>;
    this.addressFormats = { ...BUILTIN_ADDRESS_FORMATS };
    this.nameFormats = { ...BUILTIN_NAME_FORMATS };
    this.phoneNumberFormats = { ...BUILTIN_PHONE_FORMATS };
  }

  /**
   * Set the current locale
   */
  setLocale(locale: string): void {
    this.currentLocale = locale;
    const settings = this.getRegionalSettings(locale);
    if (settings) {
      this.currentTimeZone = settings.timeZone;
      this.currentCalendar = settings.calendar;
      this.currentNumberingSystem = settings.numberingSystem;
    }
  }

  /**
   * Get the current locale
   */
  getLocale(): string {
    return this.currentLocale;
  }

  /**
   * Set the current time zone
   */
  setTimeZone(timeZone: TimeZone): void {
    const validated = TimeZoneSchema.parse(timeZone);
    this.currentTimeZone = validated;
  }

  /**
   * Get the current time zone
   */
  getTimeZone(): TimeZone {
    return this.currentTimeZone;
  }

  /**
   * Set the current calendar system
   */
  setCalendar(calendar: CalendarSystem): void {
    const validated = CalendarSystemSchema.parse(calendar);
    this.currentCalendar = validated;
  }

  /**
   * Get the current calendar system
   */
  getCalendar(): CalendarSystem {
    return this.currentCalendar;
  }

  /**
   * Set the current numbering system
   */
  setNumberingSystem(numberingSystem: NumberingSystem): void {
    const validated = NumberingSystemSchema.parse(numberingSystem);
    this.currentNumberingSystem = validated;
  }

  /**
   * Get the current numbering system
   */
  getNumberingSystem(): NumberingSystem {
    return this.currentNumberingSystem;
  }

  /**
   * Get regional settings for a locale
   */
  getRegionalSettings(locale?: string): RegionalSettings | null {
    const targetLocale = locale || this.currentLocale;
    return this.regionalSettings[targetLocale] || null;
  }

  /**
   * Set regional settings for a locale
   */
  setRegionalSettings(locale: string, settings: Partial<RegionalSettings>): void {
    const current = this.regionalSettings[locale] || this.regionalSettings['en-US'];
    this.regionalSettings[locale] = { ...current, ...settings, locale };
  }

  /**
   * Detect the user's time zone
   */
  detectTimeZone(): TimeZoneDetectionResult {
    if (this.enableTimeZoneDetection && typeof Intl !== 'undefined') {
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const validated = TimeZoneSchema.parse(detected);
        return {
          detected: validated,
          confidence: 0.9,
          source: 'iana',
        };
      } catch (e) {
        // Fall through to offset detection
      }
    }

    // Try to detect from offset
    const offset = -new Date().getTimezoneOffset() / 60;
    return {
      detected: this.getTimeZoneFromOffset(offset),
      confidence: 0.5,
      source: 'offset',
    };
  }

  /**
   * Convert a date to a different time zone
   */
  convertTimeZone(date: Date | string | number, options: TimeZoneConversionOptions): Date {
    const validatedOptions = TimeZoneConversionOptionsSchema.parse(options);
    const dateObj = date instanceof Date ? date : new Date(date);

    if (validatedOptions.keepLocalTime) {
      // Keep the same local time, change the time zone
      return new Date(dateObj);
    }

    // Convert to target time zone
    const targetDate = new Date(dateObj.toLocaleString('en-US', {
      timeZone: validatedOptions.targetTimeZone,
    }));

    return targetDate;
  }

  /**
   * Get time zone information
   */
  getTimeZoneInfo(timeZone?: TimeZone): TimeZoneInfo {
    const targetTimeZone = timeZone || this.currentTimeZone;
    const now = new Date();

    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTimeZone,
        timeZoneName: 'long',
      });

      const parts = formatter.formatToParts(now);
      const timeZoneName = parts.find(p => p.type === 'timeZoneName')?.value || targetTimeZone;

      // Calculate offset
      const offset = this.getTimeZoneOffset(targetTimeZone, now);
      const offsetHours = Math.floor(offset / 60);
      const offsetMinutes = Math.abs(offset % 60);
      const offsetString = `${offsetHours >= 0 ? '+' : ''}${offsetHours}:${offsetMinutes.toString().padStart(2, '0')}`;

      return {
        id: targetTimeZone,
        name: timeZoneName,
        offset,
        offsetString,
      };
    } catch (e) {
      return {
        id: targetTimeZone,
        name: targetTimeZone,
        offset: 0,
        offsetString: '+00:00',
      };
    }
  }

  /**
   * Convert a date between calendar systems
   */
  convertCalendar(date: CalendarDate, options: CalendarConversionOptions): CalendarConversionResult {
    const validatedDate = CalendarDateSchema.parse(date);
    const validatedOptions = CalendarConversionOptionsSchema.parse(options);

    if (!this.enableCalendarConversion) {
      throw new Error('Calendar conversion is disabled');
    }

    // Create a Date object from the input
    const jsDate = new Date(validatedDate.year, validatedDate.month - 1, validatedDate.day);

    // Format using the target calendar
    const formatter = new Intl.DateTimeFormat(validatedOptions.locale || this.currentLocale, {
      calendar: validatedOptions.targetCalendar,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });

    const formatted = formatter.format(jsDate);

    // Parse the formatted date (simplified - in production, use a proper calendar library)
    const parts = formatter.formatToParts(jsDate);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1');
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');

    return {
      original: validatedDate,
      converted: {
        year,
        month,
        day,
        calendar: validatedOptions.targetCalendar,
        locale: validatedOptions.locale,
      },
      conversionMethod: 'Intl.DateTimeFormat',
    };
  }

  /**
   * Detect text direction from text
   */
  detectTextDirection(text: string, locale?: string): TextDirectionDetectionResult {
    // Check for strong RTL characters
    const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    const ltrRegex = /[A-Za-z]/;

    const hasRTL = rtlRegex.test(text);
    const hasLTR = ltrRegex.test(text);

    let direction: TextDirection;
    let confidence: number;

    if (hasRTL && !hasLTR) {
      direction = 'rtl';
      confidence = 0.9;
    } else if (hasLTR && !hasRTL) {
      direction = 'ltr';
      confidence = 0.9;
    } else if (hasRTL && hasLTR) {
      // Mixed content - use locale as hint
      const targetLocale = locale || this.currentLocale;
      const settings = this.getRegionalSettings(targetLocale);
      direction = settings?.textDirection || 'ltr';
      confidence = 0.5;
    } else {
      // No strong direction - use locale
      const targetLocale = locale || this.currentLocale;
      const settings = this.getRegionalSettings(targetLocale);
      direction = settings?.textDirection || 'ltr';
      confidence = 0.3;
    }

    return {
      direction,
      locale: locale || this.currentLocale,
      confidence,
    };
  }

  /**
   * Get text direction for a locale
   */
  getTextDirection(locale?: string): TextDirection {
    const targetLocale = locale || this.currentLocale;
    const settings = this.getRegionalSettings(targetLocale);
    return settings?.textDirection || 'ltr';
  }

  /**
   * Format content according to cultural conventions
   */
  formatCultural(content: string, options: CulturalFormattingOptions): CulturalFormatResult {
    const validatedOptions = CulturalFormattingOptionsSchema.parse(options);
    const settings = this.getRegionalSettings(validatedOptions.locale);

    let formatted = content;

    // Apply text direction
    if (settings?.textDirection === 'rtl') {
      formatted = `\u202B${formatted}\u202C`;
    }

    // Apply numbering system
    if (validatedOptions.numberingSystem) {
      formatted = this.convertNumberingSystem(formatted, validatedOptions.numberingSystem);
    }

    return {
      formatted,
      locale: validatedOptions.locale,
      options: validatedOptions,
    };
  }

  /**
   * Get address format for a locale
   */
  getAddressFormat(locale?: string): AddressFormat | null {
    const targetLocale = locale || this.currentLocale;
    return this.addressFormats[targetLocale] || null;
  }

  /**
   * Set address format for a locale
   */
  setAddressFormat(locale: string, format: AddressFormat): void {
    this.addressFormats[locale] = format;
  }

  /**
   * Get name format for a locale
   */
  getNameFormat(locale?: string): NameFormat | null {
    const targetLocale = locale || this.currentLocale;
    return this.nameFormats[targetLocale] || null;
  }

  /**
   * Set name format for a locale
   */
  setNameFormat(locale: string, format: NameFormat): void {
    this.nameFormats[locale] = format;
  }

  /**
   * Get phone number format for a locale
   */
  getPhoneNumberFormat(locale?: string): PhoneNumberFormat | null {
    const targetLocale = locale || this.currentLocale;
    return this.phoneNumberFormats[targetLocale] || null;
  }

  /**
   * Set phone number format for a locale
   */
  setPhoneNumberFormat(locale: string, format: PhoneNumberFormat): void {
    this.phoneNumberFormats[locale] = format;
  }

  /**
   * Get first day of week for a locale
   */
  getFirstDayOfWeek(locale?: string): FirstDayOfWeek {
    const targetLocale = locale || this.currentLocale;
    const settings = this.getRegionalSettings(targetLocale);
    return settings?.firstDayOfWeek || 0;
  }

  /**
   * Get measurement system for a locale
   */
  getMeasurementSystem(locale?: string): MeasurementSystem {
    const targetLocale = locale || this.currentLocale;
    const settings = this.getRegionalSettings(targetLocale);
    return settings?.measurementSystem || 'metric';
  }

  /**
   * Get paper size for a locale
   */
  getPaperSize(locale?: string): PaperSize {
    const targetLocale = locale || this.currentLocale;
    const settings = this.getRegionalSettings(targetLocale);
    return settings?.paperSize || 'a4';
  }

  /**
   * Enable or disable time zone detection
   */
  setTimeZoneDetectionEnabled(enabled: boolean): void {
    this.enableTimeZoneDetection = enabled;
  }

  /**
   * Enable or disable calendar conversion
   */
  setCalendarConversionEnabled(enabled: boolean): void {
    this.enableCalendarConversion = enabled;
  }

  /**
   * Get time zone from offset (hours)
   */
  private getTimeZoneFromOffset(offset: number): TimeZone {
    const commonOffsets: Record<number, TimeZone> = {
      0: 'UTC',
      1: 'Europe/London',
      2: 'Europe/Paris',
      3: 'Europe/Moscow',
      4: 'Europe/Samara',
      5: 'Asia/Yekaterinburg',
      6: 'Asia/Omsk',
      7: 'Asia/Krasnoyarsk',
      8: 'Asia/Shanghai',
      9: 'Asia/Tokyo',
      10: 'Asia/Yakutsk',
      11: 'Asia/Vladivostok',
      12: 'Asia/Magadan',
      '-5': 'America/New_York',
      '-6': 'America/Chicago',
      '-7': 'America/Denver',
      '-8': 'America/Los_Angeles',
      '-9': 'America/Anchorage',
      '-10': 'Pacific/Honolulu',
    };

    return commonOffsets[offset] || 'UTC';
  }

  /**
   * Get time zone offset in minutes
   */
  private getTimeZoneOffset(timeZone: TimeZone, date: Date): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');

    const utcHour = date.getUTCHours();
    const utcMinute = date.getUTCMinutes();

    const localMinutes = hour * 60 + minute;
    const utcMinutes = utcHour * 60 + utcMinute;

    return localMinutes - utcMinutes;
  }

  /**
   * Convert numbering system in text
   */
  private convertNumberingSystem(text: string, numberingSystem: NumberingSystem): string {
    const digitMaps: Record<string, string[]> = {
      'arab': ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],
      'arabext': ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'],
      'beng': ['০', '১', '২', '৩', '৪', '৫', '٦', '٧', '৮', '٩'],
      'deva': ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
      'latn': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      // Add more numbering systems as needed
    };

    const digits = digitMaps[numberingSystem] || digitMaps['latn'];

    return text.replace(/\d/g, (match) => {
      return digits[parseInt(match)] || match;
    });
  }
}

/**
 * Default L10n instance
 */
export const l10n = new L10n();

/**
 * Create a new L10n instance
 */
export function createL10n(config?: Partial<L10nConfig>): L10n {
  return new L10n(config);
}
