import { describe, expect, it } from 'vitest';
import {
  extractPlaceholders,
  hasPlaceholders,
  maskPlaceholders,
  restorePlaceholders,
  validatePlaceholderIntegrity,
} from '../../src/parsers/placeholderExtractor';

describe('placeholderExtractor', () => {
  it('extracts mixed placeholder styles', () => {
    const placeholders = extractPlaceholders(
      'Delete {0} for {user} at ${path} with %s and %1$d'
    );

    expect(placeholders).toEqual(['{0}', '{user}', '${path}', '%s', '%1$d']);
  });

  it('masks and restores placeholders without losing duplicates', () => {
    const masked = maskPlaceholders('Save {0} in {0} for {user}');

    expect(masked.masked).toContain('__I18N_PH_0__');
    expect(masked.masked).toContain('__I18N_PH_1__');
    expect(masked.masked).toContain('__I18N_PH_2__');

    const restored = restorePlaceholders(
      'Speichern __I18N_PH_0__ in __I18N_PH_1__ fur __I18N_PH_2__',
      masked.tokens
    );

    expect(restored).toBe('Speichern {0} in {0} fur {user}');
  });

  it('detects placeholder violations', () => {
    const validation = validatePlaceholderIntegrity(
      'Delete {0} for {user}',
      'Loschen {0} fur Benutzer'
    );

    expect(validation.valid).toBe(false);
    expect(validation.expected).toEqual(['{0}', '{user}']);
    expect(validation.actual).toEqual(['{0}']);
  });

  it('detects whether a text contains placeholders', () => {
    expect(hasPlaceholders('Found %d results')).toBe(true);
    expect(hasPlaceholders('Plain text')).toBe(false);
  });
});
