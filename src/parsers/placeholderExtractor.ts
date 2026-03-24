import { PlaceholderInfo, PlaceholderToken } from '../types.js';

const PLACEHOLDER_PATTERN =
  /\{\d+\}|\{[a-zA-Z_][\w.-]*\}|\$\{[a-zA-Z_][\w.-]*\}|%\d+\$[sdif]|%[sdif]/g;
const PROTECTED_SEQUENCE_PATTERN = /\\[nrtf]/g;
const MASKABLE_PATTERN = new RegExp(
  `${PLACEHOLDER_PATTERN.source}|${PROTECTED_SEQUENCE_PATTERN.source}`,
  'g'
);

export function extractPlaceholders(text: string): string[] {
  return Array.from(text.matchAll(MASKABLE_PATTERN), (match) => match[0]);
}

export function hasPlaceholders(text: string): boolean {
  return new RegExp(MASKABLE_PATTERN).test(text);
}

export function maskPlaceholders(text: string): PlaceholderInfo {
  const tokens: PlaceholderToken[] = [];
  let index = 0;

  const masked = text.replace(MASKABLE_PATTERN, (placeholder) => {
    const token = `__I18N_PH_${index}__`;
    index += 1;
    tokens.push({ token, placeholder });
    return token;
  });

  return {
    original: text,
    masked,
    tokens,
  };
}

export function restorePlaceholders(
  text: string,
  tokens: PlaceholderToken[]
): string {
  return tokens.reduce(
    (current, token) => current.split(token.token).join(token.placeholder),
    text
  );
}

export function validatePlaceholderIntegrity(
  sourceText: string,
  translatedText: string
): { valid: boolean; expected: string[]; actual: string[] } {
  const expected = extractPlaceholders(sourceText).sort();
  const actual = extractPlaceholders(translatedText).sort();

  return {
    valid:
      expected.length === actual.length &&
      expected.every((placeholder, index) => placeholder === actual[index]),
    expected,
    actual,
  };
}
