import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadTranslatorConfig } from '../src/utils/config';

const runtimeDir = path.join(process.cwd(), 'test', 'fixtures', 'runtime-config');

afterEach(() => {
  fs.rmSync(runtimeDir, { recursive: true, force: true });
});

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

  it('rejects unknown top-level options in config files', async () => {
    fs.mkdirSync(runtimeDir, { recursive: true });
    const configPath = path.join(runtimeDir, 'invalid.config.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        targetLanguages: ['de'],
        provider: 'openai',
        providerOptions: { apiKey: 'config-key' },
        files: { input: 'test/fixtures/i18n.properties' },
        asd: 'mission',
      }),
      'utf-8'
    );

    await expect(
      loadTranslatorConfig({
        configPath,
        cwd: process.cwd(),
      })
    ).rejects.toThrow(`Unknown option "asd" in Config file of ${configPath}.`);
  });

  it('rejects unknown nested options in language-specific config', async () => {
    fs.mkdirSync(runtimeDir, { recursive: true });
    const configPath = path.join(runtimeDir, 'invalid-language.config.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        targetLanguages: ['uk'],
        provider: 'openai',
        providerOptions: { apiKey: 'config-key' },
        files: { input: 'test/fixtures/i18n.properties' },
        languageOptions: {
          uk: {
            encoding: false,
          },
        },
      }),
      'utf-8'
    );

    await expect(
      loadTranslatorConfig({
        configPath,
        cwd: process.cwd(),
      })
    ).rejects.toThrow(
      `Unknown option "encoding" in config.languageOptions.uk of ${configPath}.`
    );
  });
});
