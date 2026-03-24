export { Translator, translateFile, translateProject } from './translator.js';
export {
  createDefaultConfig,
  loadTranslatorConfig,
  resolveTranslationMode,
  validateConfig,
} from './utils/config.js';
export { createLogger, ConsoleLogger, SilentLogger } from './utils/logger.js';
export { FileCache } from './cache/fileCache.js';
export { GlossaryManager } from './glossary/glossaryManager.js';
export {
  cloneDocument,
  createDocumentFromEntries,
  createEmptyPropertiesDocument,
  getLanguageFilePath,
  listPropertiesEntries,
  parsePropertiesDocument,
  readPropertiesDocument,
  serializePropertiesDocument,
  upsertPropertiesValue,
  writePropertiesDocument,
} from './parsers/propertiesParser.js';
export {
  extractPlaceholders,
  hasPlaceholders,
  maskPlaceholders,
  restorePlaceholders,
  validatePlaceholderIntegrity,
} from './parsers/placeholderExtractor.js';
export { BaseAIProvider } from './providers/base.js';
export { OpenAIProvider } from './providers/openai/client.js';
export type {
  AIProvider,
  CacheOptions,
  FileConfig,
  GlossaryConfig,
  GlossaryTerm,
  LanguageTranslationSummary,
  Logger,
  OpenAIProviderOptions,
  PlaceholderInfo,
  PlaceholderToken,
  PropertiesDocument,
  PropertiesLine,
  SupportedProvider,
  TranslationBatchRequest,
  TranslationBatchResponse,
  TranslationBatchResponseItem,
  TranslationFileOptions,
  TranslationMode,
  TranslationProjectOptions,
  TranslationResult,
  TranslatorConfig,
  TranslatorConfigOverrides,
} from './types.js';
