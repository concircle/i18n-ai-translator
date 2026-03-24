# API Documentation

## Complete API Reference for @concircle/i18n-ai-translator

### Table of Contents

- [Translator Class](#translator-class)
- [Configuration Types](#configuration-types)
- [Utility Functions](#utility-functions)
- [Advanced Features](#advanced-features)

## Translator Class

Main class for managing i18n translations.

### Constructor

```typescript
new Translator(config: TranslatorConfig): Translator
```

**Parameters:**
- `config`: TranslatorConfig object with provider and language settings

**Throws:**
- Error if configuration is invalid

**Example:**

```typescript
const translator = new Translator({
  provider: 'openai',
  openai: { apiKey: 'sk-...' },
  targetLanguages: ['de', 'fr'],
  cache: { enabled: true },
});
```

### Methods

#### `translate(job: TranslationJob): Promise<TranslationResult>`

Main method to translate a properties file.

**Parameters:**
- `job.inputPath` (string): Path to source i18n.properties file
- `job.outputFormat` (string, optional): 'new-files' | 'update-existing'
- `job.outputDir` (string, optional): Output directory for new files
- `job.languages` (string[], optional): Override config languages

**Returns:**
- `Promise<TranslationResult>` with results per language

**Example:**

```typescript
const result = await translator.translate({
  inputPath: './src/i18n/i18n.properties',
  outputFormat: 'new-files',
  outputDir: './src/i18n',
});

// Check results
console.log(result.translations.de.success);
console.log(result.translations.de.outputFile);
```

#### `clearCache(): void`

Clear all cached translations. Useful after glossary updates or for testing.

```typescript
translator.clearCache();
```

#### `getCacheStats(): CacheStats`

Get current cache statistics.

**Returns:**
- Object with:
  - `enabled`: boolean
  - `cacheDir`: string
  - `ttl`: number
  - `entriesCount`: number

```typescript
const stats = translator.getCacheStats();
console.log(`${stats.entriesCount} cached translations`);
```

#### `getGlossary(): Glossary`

Get the current glossary object.

```typescript
const glossary = translator.getGlossary();
```

#### `getGlossaryTerms(): string[]`

Get array of all glossary terms.

```typescript
const terms = translator.getGlossaryTerms();
console.log(`Glossary has ${terms.length} terms`);
```

---

## Configuration Types

### TranslatorConfig

Main configuration interface.

```typescript
interface TranslatorConfig {
  provider: 'openai';                    // Provider type
  openai: OpenAIConfig;                  // Provider-specific config
  targetLanguages: string[];             // Languages to translate to
  glossary?: Glossary | string;          // Glossary or path to glossary file
  cache?: CacheOptions;                  // Cache configuration
  batchSize?: number;                    // Parallel translation batch size
  debug?: boolean;                       // Enable debug logging
}
```

### OpenAIConfig

OpenAI-specific configuration.

```typescript
interface OpenAIConfig {
  apiKey: string;              // Required: OpenAI API key
  model?: string;              // Default: 'gpt-4'
  temperature?: number;        // Default: 0.3 (0-2 range)
  maxTokens?: number;          // Default: 2000
}
```

### CacheOptions

Cache configuration.

```typescript
interface CacheOptions {
  enabled: boolean;            // Enable/disable caching
  ttl?: number;                // TTL in milliseconds (default: 7 days)
  dir?: string;                // Cache directory (default: ~/.i18n-ai-translator-cache)
}
```

### Glossary / GlossaryEntry

Domain-specific vocabulary definitions.

```typescript
type Glossary = Record<string, GlossaryEntry>;

interface GlossaryEntry {
  term: string;                // The term
  translation?: string;        // Optional: direct translation
  context?: string;            // Optional: usage context
  doNotTranslate?: boolean;    // If true, term should not be translated
}
```

**Example:**

```typescript
const glossary: Glossary = {
  'SAP': {
    translation: 'SAP',
    doNotTranslate: true,
    context: 'Enterprise software company',
  },
  'HANA': {
    translation: 'SAP HANA',
    doNotTranslate: true,
    context: 'In-memory database',
  },
};
```

### TranslationJob

Specification for a translation job.

```typescript
interface TranslationJob {
  inputPath: string;                  // Source properties file path
  outputFormat?: 'new-files' | 'update-existing';  // Output method
  outputDir?: string;                 // Output directory
  languages?: string[];               // Override config languages
}
```

### TranslationResult

Result of a translation job.

```typescript
interface TranslationResult {
  sourceFile: string;
  translations: {
    [language: string]: {
      outputFile: string;           // Path to generated file
      success: boolean;             // Whether translation succeeded
      error?: string;               // Error message if failed
      translatedKeysCount?: number; // Number of translated keys
    };
  };
}
```

---

## Utility Functions

### Config Utilities

#### `loadConfig(configPath?: string): TranslatorConfig`

Load configuration from JSON file or environment variables.

```typescript
import { loadConfig } from '@concircle/i18n-ai-translator';

// Load from file
const config = loadConfig('./config.json');

// Or use environment variables:
// OPENAI_API_KEY, OPENAI_MODEL, TARGET_LANGUAGES, GLOSSARY_FILE
```

#### `validateConfig(config: TranslatorConfig): void`

Validate a configuration object. Throws error if invalid.

```typescript
import { validateConfig } from '@concircle/i18n-ai-translator';

try {
  validateConfig(config);
  console.log('Config is valid');
} catch (error) {
  console.error('Invalid config:', error.message);
}
```

#### `createDefaultConfig(apiKey: string, languages: string[]): TranslatorConfig`

Create a default configuration.

```typescript
import { createDefaultConfig } from '@concircle/i18n-ai-translator';

const config = createDefaultConfig(
  process.env.OPENAI_API_KEY,
  ['de', 'fr', 'es']
);
```

### Placeholder Utilities

#### `extractPlaceholders(text: string, config?: PlaceholderConfig): PlaceholderInfo`

Extract placeholders from text.

```typescript
import { extractPlaceholders } from '@concircle/i18n-ai-translator';

const result = extractPlaceholders('Save {0} items');
// {
//   original: 'Save {0} items',
//   clean: 'Save [[PH_0]] items',
//   placeholders: Map { ... }
// }
```

#### `restorePlaceholders(text: string, placeholders: Map): string`

Restore placeholders in translated text.

```typescript
import { restorePlaceholders } from '@concircle/i18n-ai-translator';

const result = extractPlaceholders('Save {0} items');
const translated = 'Speichern Sie [[PH_0]] Elemente';
const restored = restorePlaceholders(translated, result.placeholders);
// 'Speichern Sie {0} Elemente'
```

#### `hasPlaceholders(text: string, config?: PlaceholderConfig): boolean`

Check if text contains placeholders.

```typescript
import { hasPlaceholders } from '@concircle/i18n-ai-translator';

if (hasPlaceholders('Text with {0}')) {
  console.log('Has placeholders');
}
```

#### `getPlaceholdersInText(text: string): string[]`

Extract unique placeholder strings.

```typescript
import { getPlaceholdersInText } from '@concircle/i18n-ai-translator';

const placeholders = getPlaceholdersInText('Error {0}: {message}');
// ['{0}', '{message}']
```

### Properties File Utilities

#### `parsePropertiesFile(filePath: string, config?: PlaceholderConfig): ParsedProperties`

Parse a properties file.

```typescript
import { parsePropertiesFile } from '@concircle/i18n-ai-translator';

const parsed = parsePropertiesFile('./i18n.properties');
// {
//   keys: [...],
//   values: [...],
//   placeholders: Map { ... }
// }
```

#### `writePropertiesFile(filePath, keys, values, language?, placeholders?): void`

Write properties to file with placeholder restoration.

```typescript
import { writePropertiesFile } from '@concircle/i18n-ai-translator';

writePropertiesFile(
  './i18n_de.properties',
  ['msg.save'],
  ['Speichern Sie [[PH_0]] Elemente'],
  'de',
  placeholderMap
);
```

#### `getLanguageFilePath(basePath: string, language: string): string`

Generate output filename for language variant.

```typescript
import { getLanguageFilePath } from '@concircle/i18n-ai-translator';

const outPath = getLanguageFilePath('./i18n.properties', 'de');
// './i18n_de.properties'
```

---

## Advanced Features

### Custom Logging

```typescript
import { ConsoleLogger, SilentLogger } from '@concircle/i18n-ai-translator';

// Use console logger (debug mode)
const logger = new ConsoleLogger('my-app', true);

// Or silent logger
const silent = new SilentLogger();
```

### Glossary Management

```typescript
import { GlossaryManager } from '@concircle/i18n-ai-translator';

// Load from file
const glossary = GlossaryManager.loadFromFile('./glossary.json');

// Or manage programmatically
const manager = new GlossaryManager(glossary);
manager.addEntry('newTerm', { translation: 'Neuer Begriff' });
manager.saveToFile('./updated-glossary.json');
```

### Cache Management

```typescript
import { FileCache } from '@concircle/i18n-ai-translator';

const cache = new FileCache(true, './my-cache', 7*24*60*60*1000);

// Manual cache operations
cache.set('Hello', 'de', 'Hallo');
const cached = cache.get('Hello', 'de');
cache.delete('Hello', 'de');
cache.clear();

// Get glossary hash for cache invalidation
const hash = FileCache.generateGlossaryHash(glossary);
```

### AI Provider Interface

For future custom provider implementations:

```typescript
import { BaseAIProvider } from '@concircle/i18n-ai-translator';

class MyCustomProvider extends BaseAIProvider {
  async translateTexts(
    texts: string[],
    targetLanguage: string,
    context?: string
  ): Promise<string[]> {
    // Implementation here
    return translatedTexts;
  }

  getName(): string {
    return 'my-provider';
  }
}
```

---

## Error Handling

All functions provide detailed error messages:

```typescript
try {
  const result = await translator.translate({...});
  
  for (const [lang, langResult] of Object.entries(result.translations)) {
    if (!langResult.success) {
      console.error(`${lang}: ${langResult.error}`);
    }
  }
} catch (error) {
  console.error('Translation failed:', error);
}
```

Common errors:
- `OpenAI API key is required` - Missing API key
- `At least one target language is required` - No languages configured
- `Properties file not found` - Input file doesn't exist
- `Failed to load glossary` - Invalid glossary format
- `Translation batch failed` - API error during translation
