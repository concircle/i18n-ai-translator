# @concircle/i18n-ai-translator

<table>
  <tr>
    <td width="200" valign="top">
      <img src="https://raw.githubusercontent.com/concircle/i18n-ai-translator/main/assets/logo.png" alt="Concircle logo" />
    </td>
    <td valign="top">
      Translates UI5 <code>i18n.properties</code> files with OpenAI, preserves placeholders, supports glossary terms, and writes language-specific <code>.properties</code> files.
    </td>
  </tr>
</table>

## Features

- Preserves placeholders like `{0}`, `{name}`, `%s`, `${variable}`, and `%1$s`
- Supports `missing` and `overwrite` translation modes
- Applies shared and language-specific glossary terms
- Writes UI5-style language files such as `i18n_de.properties`
- Supports optional Unicode escaping with per-language overrides
- Uses a local cache to avoid repeated translation requests

## Installation

```bash
npm install @concircle/i18n-ai-translator
```

## CLI

Example `package.json` script:

```json
{
  "scripts": {
    "i18n:translate": "i18n-ai-translator --input ./webapp/i18n/i18n.properties --languages de,fr --mode missing"
  }
}
```

Show CLI help:

```bash
npx i18n-ai-translator --help
```

Enable Unicode escaping:

```json
{
  "scripts": {
    "i18n:translate": "i18n-ai-translator --input ./webapp/i18n/i18n.properties --languages de,fr --mode missing --encode-unicode"
  }
}
```

## Configuration

Example `i18n-ai.config.json`:

```json
{
  "sourceLanguage": "en",
  "targetLanguages": ["de", "uk"],
  "translationMode": "missing",
  "encodeUnicode": false,
  "languageOptions": {
    "de": { "encodeUnicode": true },
    "uk": { "encodeUnicode": false }
  },
  "provider": "openai",
  "providerOptions": {
    "apiKey": "sk-...",
    "model": "gpt-4.1-mini",
    "temperature": 0,
    "maxOutputTokens": 4000
  },
  "files": {
    "input": "./webapp/i18n/i18n.properties"
  },
  "cache": {
    "enabled": true,
    "ttlMs": 604800000
  },
  "batchSize": 20,
  "verbose": false
}
```

Supported top-level config fields:

```ts
interface TranslatorConfig {
  sourceLanguage?: string;
  targetLanguages: string[];
  translationMode?: 'missing' | 'overwrite';
  encodeUnicode?: boolean;
  languageOptions?: Record<string, { encodeUnicode?: boolean }>;
  provider?: 'openai';
  providerOptions?: {
    apiKey?: string;
    model?: string;
    baseURL?: string;
    organization?: string;
    temperature?: number;
    maxOutputTokens?: number;
  };
  files?: {
    input?: string;
    outputDir?: string;
    languageFilePattern?: string;
  };
  glossary?: GlossaryConfig | string;
  cache?: {
    enabled?: boolean;
    ttlMs?: number;
    dir?: string;
  };
  rules?: string[];
  batchSize?: number;
  verbose?: boolean;
}
```

## Glossary

Example glossary file:

```json
{
  "shared": [
    {
      "source": "Order",
      "target": "Auftrag",
      "context": "SAP sales document"
    }
  ],
  "languages": {
    "de": [
      {
        "source": "Plant",
        "target": "Werk"
      }
    ],
    "uk": [
      {
        "source": "AI",
        "target": "ШI"
      }
    ]
  }
}
```

## Programmatic Usage

Translate a file directly:

```js
import { Translator } from '@concircle/i18n-ai-translator';

const translator = new Translator({
  sourceLanguage: 'en',
  targetLanguages: ['de'],
  translationMode: 'missing',
  provider: 'openai',
  providerOptions: {
    apiKey: process.env.OPENAI_API_KEY
  },
  files: {
    input: './webapp/i18n/i18n.properties'
  }
});

const result = await translator.translateFile();
console.log(result);
```

Load config from file:

```js
import { Translator } from '@concircle/i18n-ai-translator';

const translator = await Translator.fromConfig({
  configPath: './i18n-ai.config.json'
});

const result = await translator.translateProject();
console.log(result);
```

Use the top-level helper:

```js
import { translateProject } from '@concircle/i18n-ai-translator';

const result = await translateProject({
  inputPath: './webapp/i18n/i18n.properties',
  languages: ['de'],
  dryRun: true
});

console.log(result);
```

## Translation Modes

- `missing`: only translates keys that are missing or empty in the target file
- `overwrite`: retranslates all keys from the source file

## Placeholder Handling

The translator masks placeholders before sending text to the model and validates that they are still present afterwards.

Supported placeholder styles:

- `{0}`, `{1}`
- `{name}`, `{email}`
- `%s`, `%d`
- `%1$s`, `%2$d`
- `${variable}`

## Output Files

By default, UI5-style language files are generated next to the source file:

- `i18n.properties`
- `i18n_de.properties`
- `i18n_fr.properties`

You can override the output directory or file naming pattern in `files.outputDir` and `files.languageFilePattern`.

## Cache

Caching is enabled by default. Cache keys include:

- provider
- model
- source language
- target language
- source value
- glossary terms
- translation rules

Default cache location:

```text
~/.i18n-ai-translator-cache/
```

## Environment Variables

Supported environment variables:

```bash
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=gpt-4.1-mini
```

## Examples

See [`examples/`](./examples/) for small runnable examples:

- [`basic.mjs`](./examples/basic.mjs)
- [`with-glossary.mjs`](./examples/with-glossary.mjs)
- [`advanced.mjs`](./examples/advanced.mjs)

## Development

```bash
npm run build
npm run lint
npm test
```

## License

MIT © 2026 Herbert Kaintz - Concircle

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Security

See [`SECURITY.md`](./SECURITY.md).
