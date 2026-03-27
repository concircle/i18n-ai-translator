import { translateProject } from './translator.js';
import { TranslationMode } from './types.js';

interface CliIO {
  log(message: string): void;
  error(message: string): void;
}

const SUPPORTED_MODES: TranslationMode[] = ['missing', 'overwrite'];
const SUPPORTED_PROVIDERS = ['openai'] as const;

export async function runCli(
  argv: string[],
  io: CliIO = {
    log: console.log,
    error: console.error,
  }
  ): Promise<number> {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    io.error(error instanceof Error ? error.message : String(error));
    io.log(getHelpText());
    return 1;
  }

  if (args.help || argv.length === 0) {
    io.log(getHelpText());
    return 0;
  }

  try {
    const result = await translateProject({
      configPath: args.config,
      inputPath: args.input,
      languages: args.languages,
      mode: args.mode,
      provider: args.provider as 'openai' | undefined,
      model: args.model,
      dryRun: args.dryRun,
      encodeUnicode: args.encodeUnicode,
      verbose: args.verbose,
    });

    io.log(JSON.stringify(result, null, 2));
    return 0;
  } catch (error) {
    io.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

export function parseArgs(argv: string[]): {
  config?: string;
  input?: string;
  languages?: string[];
  mode?: TranslationMode;
  provider?: string;
  model?: string;
  dryRun: boolean;
  encodeUnicode?: boolean;
  verbose: boolean;
  help: boolean;
} {
  const result = {
    dryRun: false,
    verbose: false,
    help: false,
  } as {
    config?: string;
    input?: string;
    languages?: string[];
    mode?: TranslationMode;
    provider?: string;
    model?: string;
    dryRun: boolean;
    encodeUnicode?: boolean;
    verbose: boolean;
    help: boolean;
  };

  const tokens = [...argv];
  if (tokens[0] === 'help') {
    tokens.shift();
    result.help = true;
  }

  while (tokens.length > 0) {
    const token = tokens.shift()!;

    switch (token) {
      case '--config':
        result.config = readOptionValue(tokens, '--config');
        break;
      case '--input':
        result.input = readOptionValue(tokens, '--input');
        break;
      case '--languages':
        result.languages = readOptionValue(tokens, '--languages')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);
        break;
      case '--mode': {
        const value = readOptionValue(tokens, '--mode');
        if (!SUPPORTED_MODES.includes(value as TranslationMode)) {
          throw new Error(
            `Unknown value "${value}" for option "--mode". Expected one of: ${SUPPORTED_MODES.join(', ')}.`
          );
        }
        result.mode = value as TranslationMode;
        break;
      }
      case '--provider': {
        const value = readOptionValue(tokens, '--provider');
        if (!SUPPORTED_PROVIDERS.includes(value as (typeof SUPPORTED_PROVIDERS)[number])) {
          throw new Error(
            `Unknown value "${value}" for option "--provider". Expected one of: ${SUPPORTED_PROVIDERS.join(', ')}.`
          );
        }
        result.provider = value;
        break;
      }
      case '--model':
        result.model = readOptionValue(tokens, '--model');
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--encode-unicode':
        result.encodeUnicode = true;
        break;
      case '--verbose':
        result.verbose = true;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
      default:
        if (token.startsWith('-')) {
          throw new Error(`Unknown option "${token}". Use --help to see supported options.`);
        }
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return result;
}

function readOptionValue(tokens: string[], option: string): string {
  const value = tokens.shift();
  if (!value || value.startsWith('-')) {
    throw new Error(`Missing value for option "${option}".`);
  }

  return value;
}

function getHelpText(): string {
  return [
    'ai-i18n-translate [options]',
    '',
    'Options:',
    '  --config <path>      Path to i18n-ai config file',
    '  --input <path>       Source i18n.properties file',
    '  --languages <list>   Comma-separated target languages',
    '  --mode <mode>        missing | overwrite',
    '  --provider <name>    Reserved for future providers',
    '  --model <name>       Override provider model',
    '  --dry-run            Do not write files',
    '  --encode-unicode     Write non-ASCII characters as \\uXXXX escapes',
    '  --verbose            Enable verbose logs',
    '  --help               Show this help text',
  ].join('\n');
}
