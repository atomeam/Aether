# @aether/i18n

A comprehensive internationalization library for JavaScript/TypeScript applications. Provides translation management, locale detection, and formatting utilities for dates, times, numbers, and currencies.

## Features

- **Translation Management**: Add, remove, and manage translations for multiple locales
- **Locale Detection**: Automatically detect user's preferred locale
- **Date/Time Formatting**: Format dates and times according to locale conventions
- **Number Formatting**: Format numbers with locale-specific grouping and separators
- **Currency Formatting**: Format currency amounts with proper symbols and placement
- **Pluralization**: Handle plural forms for different languages
- **RTL Support**: Detect and handle right-to-left languages
- **Caching**: Built-in translation caching for performance
- **TypeScript Support**: Full TypeScript types and Zod schemas
- **Missing Key Handling**: Custom handlers for missing translations

## Installation

```bash
npm install @aether/i18n
```

## Quick Start

```typescript
import { i18n } from '@aether/i18n';

// Set locale
i18n.setLocale('en');

// Add translations
i18n.addTranslations('en', {
  hello: 'Hello',
  welcome: 'Welcome {{name}}!',
  items_one: '1 item',
  items_other: '{{count}} items',
});

// Translate
console.log(i18n.t('hello')); // "Hello"
console.log(i18n.t('welcome', { name: 'World' })); // "Welcome World!"

// Pluralize
console.log(i18n.pluralize('items', 1)); // "1 item"
console.log(i18n.pluralize('items', 5)); // "5 items"
```

## Usage

### Basic Translation

```typescript
import { i18n } from '@aether/i18n';

// Simple translation
i18n.t('hello');

// Translation with parameters
i18n.t('welcome', { name: 'John' });

// Translation for specific locale
i18n.t('hello', undefined, 'es');
```

### Locale Management

```typescript
// Set current locale
i18n.setLocale('es');

// Get current locale
const locale = i18n.getLocale();

// Set fallback locale
i18n.setFallbackLocale('en');

// Get available locales
const locales = i18n.getAvailableLocales();

// Detect user's locale
const detected = i18n.detectLocale();
console.log(detected.detected); // e.g., "en-US"
console.log(detected.confidence); // 0.9
console.log(detected.source); // "navigator"
```

### Translation Management

```typescript
// Add translations (merge by default)
i18n.addTranslations('en', {
  hello: 'Hello',
  goodbye: 'Goodbye',
});

// Add translations (replace)
i18n.addTranslations('en', { newKey: 'New Value' }, false);

// Remove translations
i18n.removeTranslations('en', ['hello', 'goodbye']);

// Get all translations for a locale
const translations = i18n.getTranslations('en');

// Batch translate
const results = i18n.translateBatch(['hello', 'welcome'], {
  welcome: { name: 'Test' }
});
```

### Date Formatting

```typescript
const date = new Date('2024-01-15');

// Default format
i18n.formatDate(date); // "1/15/2024"

// Custom style
i18n.formatDate(date, { style: 'long' }); // "January 15, 2024"

// Custom locale
i18n.formatDate(date, { locale: 'es' }); // "15 de enero de 2024"

// With time zone
i18n.formatDate(date, { timeZone: 'UTC' });
```

### Time Formatting

```typescript
const date = new Date('2024-01-15T14:30:00');

// Default format
i18n.formatTime(date); // "2:30 PM"

// Custom style
i18n.formatTime(date, { style: 'long' }); // "2:30:00 PM"

// 24-hour format
i18n.formatTime(date, { hour12: false }); // "14:30"
```

### DateTime Formatting

```typescript
const date = new Date('2024-01-15T14:30:00');

// Default format
i18n.formatDateTime(date); // "1/15/2024, 2:30 PM"

// Custom styles
i18n.formatDateTime(date, {
  dateStyle: 'long',
  timeStyle: 'short',
}); // "January 15, 2024 at 2:30 PM"
```

### Number Formatting

```typescript
// Default format
i18n.formatNumber(1234.56); // "1,234.56"

// Custom options
i18n.formatNumber(1234.56, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

// Percentage
i18n.formatPercent(0.75); // "75%"
```

### Currency Formatting

```typescript
// Default currency
i18n.formatCurrency(1234.56, { currency: 'USD' }); // "$1,234.56"

// Custom locale
i18n.formatCurrency(1234.56, { currency: 'EUR', locale: 'de' }); // "1.234,56 €"

// Display as code
i18n.formatCurrency(1234.56, {
  currency: 'USD',
  display: 'code',
}); // "USD 1,234.56"
```

### Relative Time Formatting

```typescript
// Default format
i18n.formatRelativeTime(-1, 'day'); // "yesterday"

// Custom style
i18n.formatRelativeTime(-1, 'day', { style: 'short' }); // "1 day ago"

// Auto numeric
i18n.formatRelativeTime(0, 'day', { numeric: 'auto' }); // "today"
```

### RTL Detection

```typescript
// Check if current locale is RTL
i18n.isRTL(); // false

// Check specific locale
i18n.isRTL('ar'); // true
i18n.isRTL('he'); // true
i18n.isRTL('en'); // false
```

### Statistics

```typescript
const stats = i18n.getStats();
console.log(stats.totalKeys); // Total number of keys
console.log(stats.translatedKeys); // Translated keys for current locale
console.log(stats.missingKeys); // Missing keys for current locale
console.log(stats.completionPercentage); // Completion percentage
console.log(stats.locales); // Completion per locale
```

### Caching

```typescript
// Enable/disable caching
i18n.setCacheEnabled(true);
i18n.setCacheEnabled(false);

// Set cache TTL (milliseconds)
i18n.setCacheTTL(5 * 60 * 1000); // 5 minutes

// Clear cache
i18n.clearCache();
```

### Missing Key Handler

```typescript
// Set custom handler for missing keys
i18n.setMissingKeyHandler((key, locale) => {
  console.warn(`Missing translation: ${key} for locale: ${locale}`);
  return `[${key}]`;
});

// Now missing keys will use the handler
i18n.t('nonexistent'); // "[nonexistent]"
```

### Custom Instance

```typescript
import { createI18n } from '@aether/i18n';

const myI18n = createI18n({
  defaultLocale: 'es',
  fallbackLocale: 'en',
  availableLocales: ['es', 'en', 'fr'],
  translations: {
    es: { hello: 'Hola' },
    en: { hello: 'Hello' },
    fr: { hello: 'Bonjour' },
  },
  enableCache: true,
  enableMissingKeyHandler: true,
  missingKeyHandler: (key, locale) => `[${key}]`,
});
```

## Built-in Locales

The package includes configurations for 30+ locales:

- English (en, en-US, en-GB)
- Spanish (es, es-ES)
- French (fr, fr-FR)
- German (de, de-DE)
- Italian (it, it-IT)
- Portuguese (pt, pt-BR)
- Chinese (zh, zh-CN, zh-TW)
- Japanese (ja, ja-JP)
- Korean (ko, ko-KR)
- Arabic (ar, ar-SA)
- Hebrew (he, he-IL)
- Russian (ru, ru-RU)
- Hindi (hi, hi-IN)

## TypeScript Types

```typescript
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
} from '@aether/i18n';
```

## Zod Schemas

```typescript
import {
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
  I18nConfigSchema,
} from '@aether/i18n';

// Validate data
const locale = LocaleCodeSchema.parse('en-US');
const translations = TranslationDictionarySchema.parse({
  hello: 'Hello',
  world: 'World',
});
```

## API Reference

### I18n Class

#### Methods

- `setLocale(locale: LocaleCode): void` - Set the current locale
- `getLocale(): LocaleCode` - Get the current locale
- `setFallbackLocale(locale: LocaleCode): void` - Set the fallback locale
- `getFallbackLocale(): LocaleCode` - Get the fallback locale
- `addTranslations(locale: LocaleCode, translations: TranslationDictionary, merge?: boolean): void` - Add translations
- `removeTranslations(locale: LocaleCode, keys: TranslationKey[]): void` - Remove translations
- `getTranslations(locale?: LocaleCode): TranslationDictionary` - Get translations
- `translate(key: TranslationKey, params?: TranslationParams, locale?: LocaleCode): string` - Translate a key
- `t(key: TranslationKey, params?: TranslationParams, locale?: LocaleCode): string` - Alias for translate
- `translateBatch(keys: TranslationKey[], params?: Record<TranslationKey, TranslationParams>, locale?: LocaleCode): Record<TranslationKey, string>` - Translate multiple keys
- `pluralize(key: TranslationKey, count: number, params?: TranslationParams, locale?: LocaleCode): string` - Pluralize a translation
- `formatDate(date: Date | string | number, options?: DateFormatOptions): string` - Format a date
- `formatTime(date: Date | string | number, options?: TimeFormatOptions): string` - Format a time
- `formatDateTime(date: Date | string | number, options?: DateTimeFormatOptions): string` - Format a date and time
- `formatNumber(number: number, options?: NumberFormatOptions): string` - Format a number
- `formatCurrency(amount: number, options: CurrencyFormatOptions): string` - Format a currency amount
- `formatPercent(number: number, options?: Omit<NumberFormatOptions, 'style'>): string` - Format a percentage
- `formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, options?: RelativeTimeFormatOptions): string` - Format relative time
- `detectLocale(): LocaleDetectionResult` - Detect the user's locale
- `isRTL(locale?: LocaleCode): boolean` - Check if a locale is RTL
- `getAvailableLocales(): LocaleCode[]` - Get available locales
- `getLocaleConfig(locale?: LocaleCode): LocaleConfig | null` - Get locale configuration
- `addLocaleConfig(config: LocaleConfig): void` - Add a custom locale configuration
- `getStats(): TranslationStats` - Get translation statistics
- `clearCache(): void` - Clear the translation cache
- `setCacheEnabled(enabled: boolean): void` - Enable or disable caching
- `setCacheTTL(ttl: number): void` - Set cache TTL in milliseconds
- `setMissingKeyHandler(handler: (key: TranslationKey, locale: LocaleCode) => string): void` - Set missing key handler

## Testing

```bash
npm test
```

## License

MIT
