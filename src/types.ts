export type SupportedProvider = 'openai';

export type TranslationMode = 'missing' | 'overwrite';

export interface PlaceholderToken {
  token: string;
  placeholder: string;
}

export interface PlaceholderInfo {
  original: string;
  masked: string;
  tokens: PlaceholderToken[];
}

export interface GlossaryTerm {
  source: string;
  target?: string;
  context?: string;
  doNotTranslate?: boolean;
}

export interface GlossaryConfig {
  shared?: GlossaryTerm[];
  languages?: Record<string, GlossaryTerm[]>;
}

export interface CacheOptions {
  enabled?: boolean;
  ttlMs?: number;
  dir?: string;
}

export interface OpenAIProviderOptions {
  apiKey?: string;
  model?: string;
  baseURL?: string;
  organization?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface FileConfig {
  input?: string;
  outputDir?: string;
  languageFilePattern?: string;
}

export interface TranslatorConfig {
  sourceLanguage?: string;
  targetLanguages: string[];
  translationMode?: TranslationMode;
  encodeUnicode?: boolean;
  provider?: SupportedProvider;
  providerOptions?: OpenAIProviderOptions;
  files?: FileConfig;
  glossary?: GlossaryConfig | string;
  cache?: CacheOptions;
  rules?: string[];
  batchSize?: number;
  verbose?: boolean;
}

export interface TranslatorConfigOverrides {
  targetLanguages?: string[];
  translationMode?: TranslationMode;
  encodeUnicode?: boolean;
  provider?: SupportedProvider;
  input?: string;
  verbose?: boolean;
  model?: string;
}

export interface TranslationInputItem {
  key: string;
  sourceValue: string;
  maskedValue: string;
  placeholders: PlaceholderToken[];
}

export interface TranslationBatchRequest {
  sourceLanguage: string;
  targetLanguage: string;
  items: TranslationInputItem[];
  glossaryTerms: GlossaryTerm[];
  rules: string[];
  model?: string;
}

export interface TranslationBatchResponseItem {
  key: string;
  translatedValue: string;
}

export interface TranslationBatchResponse {
  provider: SupportedProvider;
  items: TranslationBatchResponseItem[];
  rawResponse?: string;
}

export interface AIProvider {
  getName(): SupportedProvider;
  translateBatch(request: TranslationBatchRequest): Promise<TranslationBatchResponse>;
}

export interface TranslationFileOptions {
  inputPath?: string;
  languages?: string[];
  mode?: TranslationMode;
  dryRun?: boolean;
}

export interface TranslationProjectOptions extends TranslationFileOptions {
  configPath?: string;
  cwd?: string;
  encodeUnicode?: boolean;
  provider?: SupportedProvider;
  model?: string;
  verbose?: boolean;
}

export interface PropertiesSerializationOptions {
  encodeUnicode?: boolean;
}

export interface LanguageTranslationSummary {
  outputFile: string;
  success: boolean;
  translatedKeysCount: number;
  skippedKeysCount: number;
  errors: string[];
  dryRun?: boolean;
}

export interface TranslationResult {
  sourceFile: string;
  translationMode: TranslationMode;
  translations: Record<string, LanguageTranslationSummary>;
}

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error): void;
}

export type PropertiesLine =
  | { type: 'blank'; raw: string }
  | { type: 'comment'; raw: string }
  | {
      type: 'entry';
      raw: string;
      key: string;
      value: string;
      separator: string;
      leadingWhitespace: string;
      modified: boolean;
    };

export interface PropertiesDocument {
  lines: PropertiesLine[];
  eol: string;
  hasTrailingNewline: boolean;
}
