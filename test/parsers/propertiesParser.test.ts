import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  cloneDocument,
  createDocumentFromEntries,
  getLanguageFilePath,
  listPropertiesEntries,
  parsePropertiesDocument,
  readPropertiesDocument,
  serializePropertiesDocument,
  upsertPropertiesValue,
  writePropertiesDocument,
} from '../../src/parsers/propertiesParser';

const fixturesDir = path.join(process.cwd(), 'test', 'fixtures');
const outputFile = path.join(fixturesDir, 'tmp.properties');

afterEach(() => {
  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
  }
});

describe('propertiesParser', () => {
  it('preserves comments, blank lines, and order through round-trip', () => {
    const input = fs.readFileSync(path.join(fixturesDir, 'i18n.properties'), 'utf-8');
    const document = parsePropertiesDocument(input);
    const serialized = serializePropertiesDocument(document);

    expect(serialized).toBe(input);
  });

  it('updates existing keys without dropping surrounding structure', () => {
    const input = fs.readFileSync(path.join(fixturesDir, 'i18n_de.properties'), 'utf-8');
    const document = parsePropertiesDocument(input);
    upsertPropertiesValue(document, 'app.title', 'Meine Anwendung');

    const serialized = serializePropertiesDocument(document);
    expect(serialized).toContain('app.title=Meine Anwendung');
    expect(serialized).toContain('# Existing German translations');
  });

  it('preserves raw encoding for untouched existing entries', () => {
    const input = 'title = Best\\u00E4tigt\\nquote = l\\u0027utilisateur\\n';
    const document = parsePropertiesDocument(input);

    const serialized = serializePropertiesDocument(document, { encodeUnicode: true });

    expect(serialized).toBe(input);
  });

  it('parses repeated equals as a key that ends with equals', () => {
    const input = 'ai.rerun_prompt== test\n';
    const document = parsePropertiesDocument(input);
    const entries = listPropertiesEntries(document);

    expect(entries['ai.rerun_prompt=']).toBe('test');
    expect(serializePropertiesDocument(document)).toBe(input);
  });

  it('adds new keys at the end of the document', () => {
    const document = createDocumentFromEntries({ 'app.title': 'My App' });
    upsertPropertiesValue(document, 'nav.home', 'Home');

    const serialized = serializePropertiesDocument(document);
    expect(serialized).toContain('app.title=My App');
    expect(serialized).toContain('nav.home=Home');
  });

  it('reads and writes documents from disk', () => {
    const document = readPropertiesDocument(path.join(fixturesDir, 'i18n.properties'));
    const clone = cloneDocument(document);
    upsertPropertiesValue(clone, 'app.title', 'Cloned App');
    writePropertiesDocument(outputFile, clone);

    const written = fs.readFileSync(outputFile, 'utf-8');
    expect(written).toContain('app.title=Cloned App');
  });

  it('encodes non-ascii characters when requested', () => {
    const document = createDocumentFromEntries({ city: 'Zürich', greeting: 'Grüß Gott' });

    const serialized = serializePropertiesDocument(document, { encodeUnicode: true });

    expect(serialized).toContain('city=Z\\u00fcrich');
    expect(serialized).toContain('greeting=Gr\\u00fc\\u00df Gott');
  });

  it('lists entry values by key', () => {
    const document = readPropertiesDocument(path.join(fixturesDir, 'i18n.properties'));
    const entries = listPropertiesEntries(document);

    expect(entries['app.title']).toBe('My Application');
    expect(entries['dialog.confirm']).toContain('{username}');
  });

  it('builds UI5 language file names by default', () => {
    expect(
      getLanguageFilePath('./webapp/i18n/i18n.properties', 'de')
    ).toBe(path.join('./webapp/i18n', 'i18n_de.properties'));
  });

  it('supports a custom language file pattern', () => {
    expect(
      getLanguageFilePath('./webapp/i18n/messages.properties', 'fr', '{baseName}.{language}{ext}')
    ).toBe(path.join('./webapp/i18n', 'messages.fr.properties'));
  });
});
