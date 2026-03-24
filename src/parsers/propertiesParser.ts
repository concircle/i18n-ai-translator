import fs from 'fs';
import path from 'path';
import { PropertiesDocument, PropertiesLine } from '../types.js';

export function parsePropertiesDocument(content: string): PropertiesDocument {
  const eolMatch = content.match(/\r\n|\n/);
  const eol = eolMatch?.[0] ?? '\n';
  const hasTrailingNewline = content.length > 0 && content.endsWith(eol);
  const rawLines = content.length === 0 ? [] : content.split(/\r?\n/);
  if (hasTrailingNewline && rawLines[rawLines.length - 1] === '') {
    rawLines.pop();
  }
  const lines = rawLines.map(parseLine);

  return {
    lines,
    eol,
    hasTrailingNewline,
  };
}

export function readPropertiesDocument(filePath: string): PropertiesDocument {
  if (!fs.existsSync(filePath)) {
    return createEmptyPropertiesDocument();
  }

  return parsePropertiesDocument(fs.readFileSync(filePath, 'utf-8'));
}

export function createEmptyPropertiesDocument(): PropertiesDocument {
  return {
    lines: [],
    eol: '\n',
    hasTrailingNewline: true,
  };
}

export function listPropertiesEntries(document: PropertiesDocument): Record<string, string> {
  const entries: Record<string, string> = {};

  for (const line of document.lines) {
    if (line.type === 'entry') {
      entries[line.key] = line.value;
    }
  }

  return entries;
}

export function cloneDocument(document: PropertiesDocument): PropertiesDocument {
  return {
    eol: document.eol,
    hasTrailingNewline: document.hasTrailingNewline,
    lines: document.lines.map((line) => ({ ...line })),
  };
}

export function upsertPropertiesValue(
  document: PropertiesDocument,
  key: string,
  value: string
): void {
  const existing = findEntryLine(document, key);

  if (existing) {
    existing.value = value;
    return;
  }

  if (document.lines.length > 0 && document.lines[document.lines.length - 1].type !== 'blank') {
    document.lines.push({ type: 'blank', raw: '' });
  }

  document.lines.push({
    type: 'entry',
    raw: '',
    key,
    value,
    separator: '=',
    leadingWhitespace: '',
  });
}

export function serializePropertiesDocument(document: PropertiesDocument): string {
  const serializedLines = document.lines.map(serializeLine);
  const body = serializedLines.join(document.eol);

  if (body.length === 0) {
    return '';
  }

  return document.hasTrailingNewline ? `${body}${document.eol}` : body;
}

export function writePropertiesDocument(
  filePath: string,
  document: PropertiesDocument
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, serializePropertiesDocument(document), 'utf-8');
}

export function createDocumentFromEntries(
  entries: Record<string, string>
): PropertiesDocument {
  const lines: PropertiesLine[] = Object.entries(entries).map(([key, value]) => ({
    type: 'entry',
    raw: '',
    key,
    value,
    separator: '=',
    leadingWhitespace: '',
  }));

  return {
    lines,
    eol: '\n',
    hasTrailingNewline: true,
  };
}

export function getLanguageFilePath(
  sourceFilePath: string,
  language: string,
  pattern?: string,
  outputDir?: string
): string {
  const sourceDir = outputDir ?? path.dirname(sourceFilePath);
  const ext = path.extname(sourceFilePath) || '.properties';
  const baseName = path.basename(sourceFilePath, ext);

  if (pattern) {
    const fileName = pattern
      .replace('{baseName}', baseName)
      .replace('{language}', language)
      .replace('{ext}', ext);
    return path.join(sourceDir, fileName);
  }

  const fileName = baseName === 'i18n' ? `i18n_${language}${ext}` : `${baseName}_${language}${ext}`;
  return path.join(sourceDir, fileName);
}

function parseLine(raw: string): PropertiesLine {
  if (raw.trim() === '') {
    return { type: 'blank', raw };
  }

  if (/^\s*[#!]/.test(raw)) {
    return { type: 'comment', raw };
  }

  const leadingWhitespace = raw.match(/^\s*/)![0];
  const body = raw.slice(leadingWhitespace.length);

  let separatorIndex = -1;
  let separator = '=';

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    const previous = index > 0 ? body[index - 1] : '';
    if (previous === '\\') {
      continue;
    }

    if (char === '=' || char === ':') {
      separatorIndex = index;
      separator = char;
      break;
    }

    if (char === ' ' || char === '\t' || char === '\f') {
      separatorIndex = index;
      separator = char;
      break;
    }
  }

  const rawKey = separatorIndex >= 0 ? body.slice(0, separatorIndex) : body;
  const rawValue =
    separatorIndex >= 0
      ? body.slice(separatorIndex + 1).replace(/^[ \t\f]*/, '')
      : '';

  return {
    type: 'entry',
    raw,
    key: decodePropertiesToken(rawKey.trimEnd()),
    value: decodePropertiesToken(rawValue),
    separator,
    leadingWhitespace,
  };
}

function serializeLine(line: PropertiesLine): string {
  if (line.type !== 'entry') {
    return line.raw;
  }

  return `${line.leadingWhitespace}${escapePropertiesToken(line.key)}${line.separator}${escapePropertiesValue(
    line.value
  )}`;
}

function findEntryLine(document: PropertiesDocument, key: string): Extract<PropertiesLine, { type: 'entry' }> | undefined {
  return document.lines.find(
    (line): line is Extract<PropertiesLine, { type: 'entry' }> =>
      line.type === 'entry' && line.key === key
  );
}

function decodePropertiesToken(value: string): string {
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\f/g, '\f')
    .replace(/\\:/g, ':')
    .replace(/\\=/g, '=')
    .replace(/\\\\/g, '\\');
}

function escapePropertiesToken(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/=/g, '\\=');
}

function escapePropertiesValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
