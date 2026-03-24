import fs from 'fs';
import { GlossaryConfig, GlossaryTerm } from '../types.js';

export class GlossaryManager {
  private glossary: GlossaryConfig;

  constructor(glossary?: GlossaryConfig) {
    this.glossary = glossary ?? {};
  }

  static loadGlossary(source?: GlossaryConfig | string): GlossaryConfig {
    if (!source) {
      return {};
    }

    if (typeof source === 'string') {
      return GlossaryManager.loadFromFile(source);
    }

    GlossaryManager.validateGlossary(source);
    return source;
  }

  static loadFromFile(filePath: string): GlossaryConfig {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Glossary file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content) as GlossaryConfig;
    GlossaryManager.validateGlossary(parsed);
    return parsed;
  }

  static validateGlossary(glossary: unknown): void {
    if (!glossary || typeof glossary !== 'object' || Array.isArray(glossary)) {
      throw new Error('Glossary must be an object');
    }

    const typed = glossary as GlossaryConfig;
    GlossaryManager.validateTerms(typed.shared, 'shared');

    if (typed.languages) {
      for (const [language, terms] of Object.entries(typed.languages)) {
        GlossaryManager.validateTerms(terms, `languages.${language}`);
      }
    }
  }

  private static validateTerms(terms: GlossaryTerm[] | undefined, label: string): void {
    if (!terms) {
      return;
    }

    if (!Array.isArray(terms)) {
      throw new Error(`${label} glossary terms must be an array`);
    }

    for (const term of terms) {
      if (!term || typeof term !== 'object') {
        throw new Error(`${label} glossary term must be an object`);
      }

      if (!term.source || typeof term.source !== 'string') {
        throw new Error(`${label} glossary term requires a string source value`);
      }

      if (term.target !== undefined && typeof term.target !== 'string') {
        throw new Error(`${label} glossary term target must be a string`);
      }

      if (term.context !== undefined && typeof term.context !== 'string') {
        throw new Error(`${label} glossary term context must be a string`);
      }

      if (
        term.doNotTranslate !== undefined &&
        typeof term.doNotTranslate !== 'boolean'
      ) {
        throw new Error(`${label} glossary term doNotTranslate must be a boolean`);
      }
    }
  }

  getGlossary(): GlossaryConfig {
    return this.glossary;
  }

  getTermsForLanguage(language: string): GlossaryTerm[] {
    return [
      ...(this.glossary.shared ?? []),
      ...(this.glossary.languages?.[language] ?? []),
    ];
  }

  hasTerms(language: string): boolean {
    return this.getTermsForLanguage(language).length > 0;
  }

  toJSON(): string {
    return JSON.stringify(this.glossary, null, 2);
  }
}
