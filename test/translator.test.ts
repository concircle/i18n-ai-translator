import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Translator } from '../src/translator';

const createMock = vi.fn();

vi.mock('openai', () => ({
  default: vi.fn(() => ({
    responses: {
      create: createMock,
    },
  })),
}));

const fixtureDir = path.join(process.cwd(), 'test', 'fixtures', 'runtime');
const sourceFile = path.join(fixtureDir, 'i18n.properties');
const targetFile = path.join(fixtureDir, 'i18n_de.properties');

describe('Translator', () => {
  beforeEach(() => {
    createMock.mockReset();
    fs.rmSync(fixtureDir, { recursive: true, force: true });
    fs.mkdirSync(fixtureDir, { recursive: true });
    fs.writeFileSync(
      sourceFile,
      ['# Source file', 'app.title=My Application', 'msg.save=Save {0} items', ''].join('\n'),
      'utf-8'
    );
  });

  afterEach(() => {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  });

  it('translates only missing keys in missing mode', async () => {
    fs.writeFileSync(targetFile, 'app.title=Bestehender Titel\n', 'utf-8');
    createMock.mockResolvedValue({
      output_text: JSON.stringify({
        items: [{ key: 'msg.save', translatedValue: 'Speichern __I18N_PH_0__ Eintrage' }],
      }),
    });

    const translator = new Translator({
      sourceLanguage: 'en',
      targetLanguages: ['de'],
      translationMode: 'missing',
      provider: 'openai',
      providerOptions: { apiKey: 'test-key' },
      files: { input: sourceFile },
      cache: { enabled: false },
    });

    const result = await translator.translateFile();
    const written = fs.readFileSync(targetFile, 'utf-8');

    expect(result.translations.de.translatedKeysCount).toBe(1);
    expect(result.translations.de.skippedKeysCount).toBe(1);
    expect(written).toContain('app.title=Bestehender Titel');
    expect(written).toContain('msg.save=Speichern {0} Eintrage');
  });

  it('overwrites all keys in overwrite mode', async () => {
    fs.writeFileSync(targetFile, 'app.title=Alt\nmsg.save=Alt\n', 'utf-8');
    createMock.mockResolvedValue({
      output_text: JSON.stringify({
        items: [
          { key: 'app.title', translatedValue: 'Meine Anwendung' },
          { key: 'msg.save', translatedValue: 'Speichern __I18N_PH_0__ Eintrage' },
        ],
      }),
    });

    const translator = new Translator({
      sourceLanguage: 'en',
      targetLanguages: ['de'],
      translationMode: 'overwrite',
      provider: 'openai',
      providerOptions: { apiKey: 'test-key' },
      files: { input: sourceFile },
      cache: { enabled: false },
    });

    await translator.translateFile();
    const written = fs.readFileSync(targetFile, 'utf-8');

    expect(written).toContain('app.title=Meine Anwendung');
    expect(written).toContain('msg.save=Speichern {0} Eintrage');
  });

  it('rejects translations that drop placeholders', async () => {
    createMock.mockResolvedValue({
      output_text: JSON.stringify({
        items: [
          { key: 'app.title', translatedValue: 'Meine Anwendung' },
          { key: 'msg.save', translatedValue: 'Speichern Eintrage' },
        ],
      }),
    });

    const translator = new Translator({
      sourceLanguage: 'en',
      targetLanguages: ['de'],
      translationMode: 'overwrite',
      provider: 'openai',
      providerOptions: { apiKey: 'test-key' },
      files: { input: sourceFile },
      cache: { enabled: false },
    });

    await expect(translator.translateFile()).rejects.toThrow('Placeholder validation failed');
  });

  it('writes unicode escapes when encodeUnicode is enabled', async () => {
    createMock.mockResolvedValue({
      output_text: JSON.stringify({
        items: [
          { key: 'app.title', translatedValue: 'Menüführung' },
          { key: 'msg.save', translatedValue: 'Speichern __I18N_PH_0__ für München' },
        ],
      }),
    });

    const translator = new Translator({
      sourceLanguage: 'en',
      targetLanguages: ['de'],
      translationMode: 'overwrite',
      encodeUnicode: true,
      provider: 'openai',
      providerOptions: { apiKey: 'test-key' },
      files: { input: sourceFile },
      cache: { enabled: false },
    });

    await translator.translateFile();
    const written = fs.readFileSync(targetFile, 'utf-8');

    expect(written).toContain('app.title=Men\\u00fcf\\u00fchrung');
    expect(written).toContain('msg.save=Speichern {0} f\\u00fcr M\\u00fcnchen');
  });
});
