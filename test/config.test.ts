import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadTranslatorConfig } from '../src/utils/config';

describe('config loading', () => {
  it('loads config files and glossary definitions', async () => {
    const config = await loadTranslatorConfig({
      configPath: path.join('test', 'fixtures', 'i18n-ai.config.json'),
      cwd: process.cwd(),
    });

    expect(config.targetLanguages).toEqual(['de', 'fr']);
    expect(config.providerOptions?.apiKey).toBe('config-key');
    expect(config.glossary).toEqual({
      shared: [
        {
          source: 'Order',
          target: 'Auftrag',
          context: 'SAP sales document',
        },
      ],
      languages: {
        de: [
          {
            source: 'Plant',
            target: 'Werk',
          },
        ],
      },
    });
  });

  it('applies overrides on top of config values', async () => {
    const config = await loadTranslatorConfig({
      configPath: path.join('test', 'fixtures', 'i18n-ai.config.json'),
      overrides: {
        targetLanguages: ['es'],
        input: 'custom/i18n.properties',
        encodeUnicode: true,
        model: 'gpt-4.1',
      },
    });

    expect(config.targetLanguages).toEqual(['es']);
    expect(config.files?.input).toBe('custom/i18n.properties');
    expect(config.encodeUnicode).toBe(true);
    expect(config.providerOptions?.model).toBe('gpt-4.1');
  });

  it('keeps per-language options from config files', async () => {
    const config = await loadTranslatorConfig({
      configPath: path.join('test', 'fixtures', 'i18n-ai.config.json'),
      cwd: process.cwd(),
    });

    expect(config.languageOptions).toEqual({
      de: { encodeUnicode: true },
      uk: { encodeUnicode: false },
    });
  });
});
