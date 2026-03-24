import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { CacheOptions, GlossaryTerm } from '../types.js';

interface CacheEntry {
  translation: string;
  createdAt: number;
}

export class FileCache {
  private readonly enabled: boolean;
  private readonly ttlMs: number;
  private readonly cacheDir: string;

  constructor(options?: CacheOptions) {
    this.enabled = options?.enabled ?? true;
    this.ttlMs = options?.ttlMs ?? 7 * 24 * 60 * 60 * 1000;
    const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp';
    this.cacheDir =
      options?.dir ?? path.join(homeDir, '.i18n-ai-translator-cache');

    if (this.enabled && !fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  get(cacheKey: string): string | null {
    if (!this.enabled) {
      return null;
    }

    const filePath = path.join(this.cacheDir, `${cacheKey}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const entry = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as CacheEntry;
      if (Date.now() - entry.createdAt > this.ttlMs) {
        fs.unlinkSync(filePath);
        return null;
      }

      return entry.translation;
    } catch {
      return null;
    }
  }

  set(cacheKey: string, translation: string): void {
    if (!this.enabled) {
      return;
    }

    const filePath = path.join(this.cacheDir, `${cacheKey}.json`);
    const entry: CacheEntry = {
      translation,
      createdAt: Date.now(),
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(entry), 'utf-8');
    } catch {
      // Best-effort cache only.
    }
  }

  clear(): void {
    if (!this.enabled || !fs.existsSync(this.cacheDir)) {
      return;
    }

    for (const fileName of fs.readdirSync(this.cacheDir)) {
      if (fileName.endsWith('.json')) {
        fs.unlinkSync(path.join(this.cacheDir, fileName));
      }
    }
  }

  getStats(): { enabled: boolean; ttlMs: number; cacheDir: string; entriesCount: number } {
    let entriesCount = 0;
    if (this.enabled && fs.existsSync(this.cacheDir)) {
      entriesCount = fs
        .readdirSync(this.cacheDir)
        .filter((fileName) => fileName.endsWith('.json')).length;
    }

    return {
      enabled: this.enabled,
      ttlMs: this.ttlMs,
      cacheDir: this.cacheDir,
      entriesCount,
    };
  }

  static createKey(input: {
    provider: string;
    model: string;
    sourceLanguage: string;
    targetLanguage: string;
    sourceValue: string;
    glossaryTerms: GlossaryTerm[];
    rules: string[];
  }): string {
    const json = JSON.stringify(input);
    return crypto.createHash('sha256').update(json).digest('hex');
  }
}
