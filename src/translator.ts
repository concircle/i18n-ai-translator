import path from 'path';
import { FileCache } from './cache/fileCache.js';
import { GlossaryManager } from './glossary/glossaryManager.js';
import {
  maskPlaceholders,
  restorePlaceholders,
  validatePlaceholderIntegrity,
} from './parsers/placeholderExtractor.js';
import {
  cloneDocument,
  createEmptyPropertiesDocument,
  getLanguageFilePath,
  listPropertiesEntries,
  readPropertiesDocument,
  upsertPropertiesValue,
  writePropertiesDocument,
} from './parsers/propertiesParser.js';
import { OpenAIProvider } from './providers/openai/client.js';
import {
  AIProvider,
  GlossaryConfig,
  TranslationBatchResponseItem,
  TranslationFileOptions,
  TranslationProjectOptions,
  TranslationResult,
  TranslatorConfig,
} from './types.js';
import { loadTranslatorConfig, resolveTranslationMode, validateConfig } from './utils/config.js';
import { ConsoleLogger, SilentLogger } from './utils/logger.js';

export class Translator {
  private readonly config: TranslatorConfig;
  private readonly provider: AIProvider;
  private readonly glossaryManager: GlossaryManager;
  private readonly cache: FileCache;
  private readonly logger: ConsoleLogger | SilentLogger;

  constructor(config: TranslatorConfig) {
    validateConfig(config);
    this.config = config;
    this.provider = createProvider(config);
    this.glossaryManager = new GlossaryManager(config.glossary as GlossaryConfig | undefined);
    this.cache = new FileCache(config.cache);
    this.logger = config.verbose
      ? new ConsoleLogger('@concircle/i18n-ai-translator', true)
      : new SilentLogger();
  }

  static async fromConfig(options?: {
    configPath?: string;
    cwd?: string;
  }): Promise<Translator> {
    const config = await loadTranslatorConfig(options);
    return new Translator(config);
  }

  async translateProject(options?: TranslationProjectOptions): Promise<TranslationResult> {
    const config =
      options?.configPath || options?.cwd
        ? await loadTranslatorConfig({
            configPath: options.configPath,
            cwd: options.cwd,
          overrides: {
            input: options.inputPath,
            targetLanguages: options.languages,
            translationMode: options.mode,
            encodeUnicode: options.encodeUnicode,
            provider: options.provider,
            model: options.model,
            verbose: options.verbose,
          },
        })
        : this.config;

    const translator =
      config === this.config ? this : new Translator(config);

    return translator.translateFile({
      inputPath: options?.inputPath,
      languages: options?.languages,
      mode: options?.mode,
      dryRun: options?.dryRun,
    });
  }

  async translateFile(options?: TranslationFileOptions): Promise<TranslationResult> {
    const inputPath = path.resolve(
      process.cwd(),
      options?.inputPath ?? this.config.files?.input ?? 'i18n/i18n.properties'
    );
    const sourceDocument = readPropertiesDocument(inputPath);
    const sourceEntries = listPropertiesEntries(sourceDocument);
    const sourceKeys = Object.keys(sourceEntries);
    const languages = options?.languages ?? this.config.targetLanguages;
    const translationMode = resolveTranslationMode(
      options?.mode,
      this.config.translationMode
    );

    const result: TranslationResult = {
      sourceFile: inputPath,
      translationMode,
      translations: {},
    };

    for (const language of languages) {
      this.logger.info('Translating language', { language });
      const targetPath = getLanguageFilePath(
        inputPath,
        language,
        this.config.files?.languageFilePattern,
        this.config.files?.outputDir
      );
      const targetDocument = readPropertiesDocument(targetPath);
      const targetEntries = listPropertiesEntries(targetDocument);
      const keysToTranslate = sourceKeys.filter((key) => {
        if (translationMode === 'overwrite') {
          return true;
        }

        const existingValue = targetEntries[key];
        return existingValue === undefined || existingValue === '';
      });

      const translatedMap = await this.translateEntries(sourceEntries, keysToTranslate, language);
      const outputDocument =
        targetDocument.lines.length > 0
          ? cloneDocument(targetDocument)
          : cloneDocument(sourceDocument);

      for (const [key, translatedValue] of Object.entries(translatedMap)) {
        upsertPropertiesValue(outputDocument, key, translatedValue);
      }

      const errors: string[] = [];
      if (!options?.dryRun) {
        writePropertiesDocument(targetPath, outputDocument, {
          encodeUnicode: this.resolveEncodeUnicode(language),
        });
      }

      result.translations[language] = {
        outputFile: targetPath,
        success: errors.length === 0,
        translatedKeysCount: Object.keys(translatedMap).length,
        skippedKeysCount: sourceKeys.length - keysToTranslate.length,
        errors,
        dryRun: options?.dryRun ?? false,
      };
    }

    return result;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  getGlossaryTerms(language: string) {
    return this.glossaryManager.getTermsForLanguage(language);
  }

  private async translateEntries(
    sourceEntries: Record<string, string>,
    keys: string[],
    language: string
  ): Promise<Record<string, string>> {
    const glossaryTerms = this.glossaryManager.getTermsForLanguage(language);
    const rules = this.config.rules ?? [];
    const batchSize = this.config.batchSize ?? 20;
    const translatedMap: Record<string, string> = {};

    for (let start = 0; start < keys.length; start += batchSize) {
      const batchKeys = keys.slice(start, start + batchSize);
      const uncachedItems: Array<{
        key: string;
        sourceValue: string;
        maskedValue: string;
        placeholders: ReturnType<typeof maskPlaceholders>['tokens'];
      }> = [];

      for (const key of batchKeys) {
        const sourceValue = sourceEntries[key];
        const placeholderInfo = maskPlaceholders(sourceValue);
        const cacheKey = FileCache.createKey({
          provider: this.provider.getName(),
          model: this.config.providerOptions?.model ?? 'default',
          sourceLanguage: this.config.sourceLanguage ?? 'en',
          targetLanguage: language,
          sourceValue,
          glossaryTerms,
          rules,
        });
        const cached = this.cache.get(cacheKey);

        if (cached) {
          translatedMap[key] = cached;
          continue;
        }

        uncachedItems.push({
          key,
          sourceValue,
          maskedValue: placeholderInfo.masked,
          placeholders: placeholderInfo.tokens,
        });
      }

      if (uncachedItems.length === 0) {
        continue;
      }

      const response = await this.provider.translateBatch({
        sourceLanguage: this.config.sourceLanguage ?? 'en',
        targetLanguage: language,
        items: uncachedItems,
        glossaryTerms,
        rules,
        model: this.config.providerOptions?.model,
      });

      for (const item of uncachedItems) {
        const translated = findResponseItem(response.items, item.key);
        const restored = restorePlaceholders(
          translated.translatedValue,
          item.placeholders
        );
        const validation = validatePlaceholderIntegrity(item.sourceValue, restored);

        if (!validation.valid) {
          throw new Error(
            `Placeholder validation failed for key "${item.key}" in ${language}: expected ${validation.expected.join(
              ', '
            )}, got ${validation.actual.join(', ')}`
          );
        }

        translatedMap[item.key] = restored;

        const cacheKey = FileCache.createKey({
          provider: this.provider.getName(),
          model: this.config.providerOptions?.model ?? 'default',
          sourceLanguage: this.config.sourceLanguage ?? 'en',
          targetLanguage: language,
          sourceValue: item.sourceValue,
          glossaryTerms,
          rules,
        });
        this.cache.set(cacheKey, restored);
      }
    }

    return translatedMap;
  }

  private resolveEncodeUnicode(language: string): boolean {
    const languageOverride = this.config.languageOptions?.[language]?.encodeUnicode;
    return languageOverride ?? this.config.encodeUnicode ?? false;
  }
}

export async function translateProject(
  options?: TranslationProjectOptions
): Promise<TranslationResult> {
  const config = await loadTranslatorConfig({
    configPath: options?.configPath,
    cwd: options?.cwd,
      overrides: {
        input: options?.inputPath,
        targetLanguages: options?.languages,
        translationMode: options?.mode,
        encodeUnicode: options?.encodeUnicode,
        provider: options?.provider,
        model: options?.model,
        verbose: options?.verbose,
      },
    });

  const translator = new Translator(config);
  return translator.translateProject(options);
}

export async function translateFile(
  config: TranslatorConfig,
  options?: TranslationFileOptions
): Promise<TranslationResult> {
  const translator = new Translator(config);
  return translator.translateFile(options);
}

function createProvider(config: TranslatorConfig): AIProvider {
  if (config.provider === 'openai') {
    return new OpenAIProvider(config.providerOptions ?? {});
  }

  throw new Error(`Unsupported provider: ${config.provider}`);
}

function findResponseItem(
  items: TranslationBatchResponseItem[],
  key: string
): TranslationBatchResponseItem {
  const item = items.find((candidate) => candidate.key === key);
  if (!item) {
    throw new Error(`Provider response is missing translation for key "${key}"`);
  }

  return item;
}

export function createNewTranslationDocument() {
  return createEmptyPropertiesDocument();
}
