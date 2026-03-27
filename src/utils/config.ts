import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import dotenv from 'dotenv';
import { GlossaryManager } from '../glossary/glossaryManager.js';
import {
  TranslationMode,
  TranslatorConfig,
  TranslatorConfigOverrides,
} from '../types.js';

const DEFAULT_CONFIG_FILES = [
  'i18n-ai.config.json',
  'i18n-ai.config.mjs',
  'i18n-ai.config.js',
  'ui5-ai-i18n.config.json',
  'ui5-ai-i18n.config.mjs',
  'ui5-ai-i18n.config.js',
];

export async function loadTranslatorConfig(options?: {
  configPath?: string;
  cwd?: string;
  overrides?: TranslatorConfigOverrides;
}): Promise<TranslatorConfig> {
  const cwd = options?.cwd ?? process.cwd();
  loadEnvFiles(cwd);
  const configPath = options?.configPath
    ? path.resolve(cwd, options.configPath)
    : findDefaultConfigPath(cwd);

  const loaded = configPath ? await loadConfigFile(configPath) : {};
  const merged = applyOverrides(
    applyEnvDefaults({
      sourceLanguage: 'en',
      targetLanguages: [],
      translationMode: 'missing',
      encodeUnicode: false,
      provider: 'openai',
      batchSize: 20,
      verbose: false,
      files: {
        input: 'i18n/i18n.properties',
      },
      cache: {
        enabled: true,
      },
      rules: [],
      ...loaded,
    }),
    options?.overrides
  );

  if (merged.glossary) {
    merged.glossary = GlossaryManager.loadGlossary(merged.glossary);
  }

  validateConfig(merged);
  return merged;
}

export function validateConfig(config: TranslatorConfig): void {
  if (!config.targetLanguages || config.targetLanguages.length === 0) {
    throw new Error('At least one target language is required');
  }

  if (config.provider !== 'openai') {
    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  if (!config.files?.input) {
    throw new Error('files.input is required');
  }

  const mode = config.translationMode ?? 'missing';
  if (mode !== 'missing' && mode !== 'overwrite') {
    throw new Error(`Unsupported translationMode: ${mode}`);
  }

  if (config.batchSize !== undefined && config.batchSize < 1) {
    throw new Error('batchSize must be at least 1');
  }

  if (!config.providerOptions?.apiKey) {
    throw new Error('OpenAI API key is required via config.providerOptions.apiKey or OPENAI_API_KEY');
  }
}

export function createDefaultConfig(
  apiKey: string,
  targetLanguages: string[]
): TranslatorConfig {
  return {
    sourceLanguage: 'en',
    targetLanguages,
    translationMode: 'missing',
    encodeUnicode: false,
    provider: 'openai',
    providerOptions: {
      apiKey,
      model: 'gpt-4.1-mini',
      temperature: 0,
      maxOutputTokens: 4000,
    },
    files: {
      input: 'i18n/i18n.properties',
    },
    cache: {
      enabled: true,
    },
    rules: [],
    batchSize: 20,
    verbose: false,
  };
}

function applyEnvDefaults(config: TranslatorConfig): TranslatorConfig {
  const providerOptions = {
    ...config.providerOptions,
  };

  if (!providerOptions.apiKey && process.env.OPENAI_API_KEY) {
    providerOptions.apiKey = process.env.OPENAI_API_KEY;
  }

  if (!providerOptions.model && process.env.OPENAI_MODEL) {
    providerOptions.model = process.env.OPENAI_MODEL;
  }

  return {
    ...config,
    providerOptions,
  };
}

function applyOverrides(
  config: TranslatorConfig,
  overrides?: TranslatorConfigOverrides
): TranslatorConfig {
  if (!overrides) {
    return config;
  }

  return {
    ...config,
    provider: overrides.provider ?? config.provider,
    translationMode: overrides.translationMode ?? config.translationMode,
    encodeUnicode: overrides.encodeUnicode ?? config.encodeUnicode,
    languageOptions: config.languageOptions,
    targetLanguages: overrides.targetLanguages ?? config.targetLanguages,
    verbose: overrides.verbose ?? config.verbose,
    files: {
      ...config.files,
      input: overrides.input ?? config.files?.input,
    },
    providerOptions: {
      ...config.providerOptions,
      model: overrides.model ?? config.providerOptions?.model,
    },
  };
}

function findDefaultConfigPath(cwd: string): string | undefined {
  for (const fileName of DEFAULT_CONFIG_FILES) {
    const candidate = path.join(cwd, fileName);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

async function loadConfigFile(configPath: string): Promise<Partial<TranslatorConfig>> {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  if (configPath.endsWith('.json')) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Partial<TranslatorConfig>;
  }

  if (configPath.endsWith('.js') || configPath.endsWith('.mjs')) {
    const loaded = await import(pathToFileURL(configPath).href);
    return (loaded.default ?? loaded) as Partial<TranslatorConfig>;
  }

  throw new Error(`Unsupported config format: ${configPath}`);
}

export function resolveTranslationMode(
  preferred?: TranslationMode,
  fallback: TranslationMode = 'missing'
): TranslationMode {
  return preferred ?? fallback;
}

function loadEnvFiles(cwd: string): void {
  const envPath = path.join(cwd, '.env');
  const envLocalPath = path.join(cwd, '.env.local');

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: true });
  }
}
