# @concircle/i18n-ai-translator

AI-powered internationalization (i18n) translator for UI5 applications. Automatically translates `i18n.properties` files to multiple languages using OpenAI, with support for glossaries, placeholder preservation, and intelligent caching.

## Features

- 🤖 **AI-Powered Translation**: Uses OpenAI GPT-4 for accurate, context-aware translations
- 🔒 **Placeholder Preservation**: Protects UI5 placeholders like `{0}`, `{name}`, `%s`, `${variable}` from being translated
- 📚 **Glossary Support**: Define domain-specific vocabulary (e.g., SAP terminology) for consistent translations
- 🚀 **Batch Processing**: Parallel translation requests for efficiency
- 💾 **Smart Caching**: Local file-based cache with TTL and glossary hash invalidation
- 🔌 **Extensible Architecture**: Plugin-ready for future AI providers (Claude, Gemini, etc.)
- 📦 **Dual Format**: CommonJS and ES Modules support
- ✅ **Fully Tested**: Comprehensive test suite with focus on placeholder preservation
- 📄 **TypeScript**: Full type safety and IntelliSense support

## Installation

```bash
npm install @concircle/i18n-ai-translator
```

### Install From Git In Another App

If you want to use the CLI from another application's `npm run` scripts without publishing to npm yet, install this package directly from your Git remote:

```bash
npm install -D git+ssh://git@github.com/DEIN-ORG/DEIN-REPO.git#main
```

This package runs `prepare` on Git-based installs, so the CLI is built automatically during installation.

Then add a script in the consuming app:

```json
{
  "scripts": {
    "i18n:translate": "ai-i18n-translate --input ./webapp/i18n/i18n.properties --languages de,fr --mode missing"
  }
}
```

If your target system expects Java-style Unicode escapes in `.properties` files, enable them with:

```json
{
  "scripts": {
    "i18n:translate": "ai-i18n-translate --input ./webapp/i18n/i18n.properties --languages de,fr --mode missing --encode-unicode"
  }
}
```

Or set it in your config file:

```json
{
  "encodeUnicode": true
}
```

If you only want escapes for specific target languages, use per-language overrides:

```json
{
  "encodeUnicode": false,
  "languageOptions": {
    "de": { "encodeUnicode": true },
    "uk": { "encodeUnicode": false }
  }
}
```

This keeps languages like Ukrainian readable in UTF-8:

```properties
ai.button_tooltip = ШІ планувальник
```

Run it with:

```bash
npm run i18n:translate
```

## Quick Start

### Basic Usage (ES Modules)

```javascript
import { Translator } from '@concircle/i18n-ai-translator';

const translator = new Translator({
  provider: 'openai',
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  targetLanguages: ['de', 'fr'],
});

const result = await translator.translate({
  inputPath: './src/i18n/i18n.properties',
  outputFormat: 'new-files',
});

console.log('Translation complete!', result);
```

### With Glossary (Domain Vocabulary)

```javascript
const translator = new Translator({
  provider: 'openai',
  openai: { apiKey: process.env.OPENAI_API_KEY },
  targetLanguages: ['de'],
  glossary: {
    'SAP': { doNotTranslate: true },
    'HANA': { translation: 'SAP HANA', context: 'database' },
    'Fiori': { doNotTranslate: true },
  },
});

// Ensures SAP terms are correctly handled during translation
```

### Load Config from File

```javascript
import { loadConfig, Translator } from '@concircle/i18n-ai-translator';

const config = loadConfig('./config.json');
const translator = new Translator(config);
```

## Configuration

### TranslatorConfig Interface

```typescript
interface TranslatorConfig {
  provider: 'openai'; // Future: 'claude', 'gemini'
  openai: {
    apiKey: string;         // Required: OpenAI API key
    model?: string;         // Default: 'gpt-4'
    temperature?: number;   // Default: 0.3
    maxTokens?: number;     // Default: 2000
  };
  targetLanguages: string[]; // Required: e.g., ['de', 'fr', 'es']
  encodeUnicode?: boolean; // Default: false, escape non-ASCII as \uXXXX
  languageOptions?: Record<string, {
    encodeUnicode?: boolean; // Per-language override
  }>;
  glossary?: Glossary;       // Optional: Domain-specific vocabulary
  cache?: {
    enabled?: boolean;      // Default: true
    ttl?: number;          // Default: 7 days (ms)
    dir?: string;          // Default: ~/.i18n-ai-translator-cache
  };
  batchSize?: number;       // Default: 10 (parallel requests)
  debug?: boolean;          // Default: false
}
```

### Example Configuration File (config.json)

```json
{
  "provider": "openai",
  "openai": {
    "apiKey": "sk-...",
    "model": "gpt-4",
    "temperature": 0.3,
    "maxTokens": 2000
  },
  "targetLanguages": ["de", "fr", "es"],
  "encodeUnicode": false,
  "languageOptions": {
    "de": { "encodeUnicode": true },
    "uk": { "encodeUnicode": false }
  },
  "glossary": "./glossary.json",
  "cache": {
    "enabled": true,
    "ttl": 604800000
  },
  "batchSize": 10,
  "debug": false
}
```

### Example Glossary File (glossary.json)

```json
{
  "SAP": {
    "term": "SAP",
    "translation": "SAP",
    "doNotTranslate": true,
    "context": "Enterprise Resource Planning System"
  },
  "HANA": {
    "term": "HANA",
    "translation": "SAP HANA",
    "doNotTranslate": true,
    "context": "In-memory database"
  },
  "module": {
    "term": "module",
    "translation": "Modul",
    "context": "German translation"
  }
}
```

## API Reference

### Translator Class

#### Constructor

```typescript
new Translator(config: TranslatorConfig): Translator
```

#### Methods

##### `translate(job: TranslationJob): Promise<TranslationResult>`

Translate a properties file to configured target languages.

**Parameters:**
- `job.inputPath`: Path to source `i18n.properties` file
- `job.outputFormat`: `'new-files'` | `'update-existing'` (default: `'new-files'`)
- `job.outputDir`: Output directory for new files
- `job.languages`: Override config languages for this job

**Returns:** Object with translation results per language

```javascript
const result = await translator.translate({
  inputPath: './src/i18n/i18n.properties',
  outputFormat: 'new-files',
  outputDir: './src/i18n',
  languages: ['de'], // Optional: override
});

// Result example:
// {
//   sourceFile: './src/i18n/i18n.properties',
//   translations: {
//     de: {
//       outputFile: './src/i18n/i18n_de.properties',
//       success: true,
//       translatedKeysCount: 42
//     },
//     fr: {
//       outputFile: './src/i18n/i18n_fr.properties',
//       success: true,
//       translatedKeysCount: 42
//     }
//   }
// }
```

##### `clearCache(): void`

Clear the translation cache (useful for testing or after glossary changes)

```javascript
translator.clearCache();
```

##### `getCacheStats(): object`

Get cache statistics

```javascript
const stats = translator.getCacheStats();
// { enabled: true, cacheDir: '...', ttl: ..., entriesCount: 5 }
```

##### `getGlossary(): Glossary`

Get current glossary

```javascript
const glossary = translator.getGlossary();
```

##### `getGlossaryTerms(): string[]`

Get all glossary terms

```javascript
const terms = translator.getGlossaryTerms();
```

## UI5 Properties File Format

### Input Example (i18n.properties)

```properties
# Application messages
app.title=My Application
app.version=1.0.0

# Messages with placeholders (will be preserved)
msg.save=Save {0} items
msg.delete=Delete {0} from {1}

# Named placeholders
form.email=Please enter {email}

# Format specifiers (preserved)
msg.count=Found %d results
msg.user=User %s not found
```

### Output Example (i18n_de.properties)

```properties
# Application messages
app.title=Meine Anwendung
app.version=1.0.0

# Messages with placeholders (PRESERVED unchanged)
msg.save=Speichern Sie {0} Elemente
msg.delete=Löschen Sie {0} von {1}

# Named placeholders
form.email=Bitte geben Sie {email} ein

# Format specifiers (PRESERVED)
msg.count=Es wurden %d Ergebnisse gefunden
msg.user=Benutzer %s nicht gefunden
```

## Placeholder Protection

All placeholder types are automatically detected and preserved during translation:

- `{0}`, `{1}`, etc. - Numeric placeholders
- `{name}`, `{email}`, etc. - Named placeholders
- `%s`, `%d`, etc. - Printf-style format specifiers
- `${variable}` - Template variable syntax
- `%1$s`, `%2$d`, etc. - Positional format specifiers

## Environment Variables

Configuration can also be provided via environment variables:

```bash
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=gpt-4
export TARGET_LANGUAGES=de,fr,es
export GLOSSARY_FILE=./glossary.json
```

## Examples

See `examples/` directory for complete working examples:

- `basic.mjs` - Minimal setup with environment variables
- `with-glossary.mjs` - Using domain-specific vocabulary
- `advanced.mjs` - Full configuration with caching and debugging

Run examples:

```bash
export OPENAI_API_KEY=sk-...
node examples/basic.mjs
```

## Caching

The translator uses smart, local file-based caching to:

- **Reduce API costs**: Skip repeated translations
- **Improve performance**: Instant retrieval from cache
- **Invalidate on glossary changes**: Cache is invalidated when glossary is updated
- **Support TTL**: Default 7-day cache expiration

Cache location: `~/.i18n-ai-translator-cache/`

### Cache Configuration

```javascript
cache: {
  enabled: true,           // Enable/disable caching
  ttl: 7 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
  dir: '/custom/cache/dir' // Custom cache directory
}
```

## Performance & Batching

Translations are processed in parallel batches for efficiency:

```javascript
batchSize: 10  // Process up to 10 translations in parallel
```

This balances between:
- **Throughput**: Parallel processing speeds up translation
- **API Limits**: Stays within OpenAI rate limits (default 10 concurrent)
- **Cost**: Fewer API calls due to combining texts

## Future Provider Support

The architecture supports adding new AI providers. Implement the `AIProvider` interface:

```typescript
interface AIProvider {
  translateTexts(texts: string[], targetLanguage: string, context?: string): Promise<string[]>;
  getName(): string;
}
```

Future providers planned:
- Claude (Anthropic)
- Gemini (Google)
- Offline/Local models

## Error Handling

The translator provides detailed error information:

```javascript
try {
  const result = await translator.translate({...});
  
  for (const [lang, langResult] of Object.entries(result.translations)) {
    if (!langResult.success) {
      console.error(`Translation failed for ${lang}: ${langResult.error}`);
    }
  }
} catch (error) {
  console.error('Translation job failed:', error.message);
}
```

## Testing

Run the comprehensive test suite:

```bash
npm test              # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

Tests include:
- ✅ Placeholder extraction and restoration (critical)
- ✅ Properties file parsing and writing
- ✅ Glossary management and injection
- ✅ Cache behavior and TTL
- ✅ Configuration validation

## License

MIT © 2026 Herbert Kaintz - Concircle

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Security

Please report security vulnerabilities to security contacts via email rather than public issues. See [SECURITY.md](./SECURITY.md) for details.

## Support

- 📖 [API Documentation](./docs/)
- 📚 [Examples](./examples/)
- 🤝 [Contributing Guide](./CONTRIBUTING.md)
- 🔒 [Security Policy](./SECURITY.md)
