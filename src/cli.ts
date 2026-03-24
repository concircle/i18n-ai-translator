import { translateProject } from './translator.js';
import { TranslationMode } from './types.js';

interface CliIO {
  log(message: string): void;
  error(message: string): void;
}

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

  if (args.help || args.command === 'help' || !args.command) {
    io.log(getHelpText());
    return 0;
  }

  if (args.command !== 'translate') {
    io.error(`Unknown command: ${args.command}`);
    io.log(getHelpText());
    return 1;
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
  command?: string;
  config?: string;
  input?: string;
  languages?: string[];
  mode?: TranslationMode;
  provider?: string;
  model?: string;
  dryRun: boolean;
  encodeUnicode: boolean;
  verbose: boolean;
  help: boolean;
} {
  const result = {
    dryRun: false,
    encodeUnicode: false,
    verbose: false,
    help: false,
  } as {
    command?: string;
    config?: string;
    input?: string;
    languages?: string[];
    mode?: TranslationMode;
    provider?: string;
    model?: string;
    dryRun: boolean;
    encodeUnicode: boolean;
    verbose: boolean;
    help: boolean;
  };

  const tokens = [...argv];
  result.command = tokens.shift();

  while (tokens.length > 0) {
    const token = tokens.shift()!;

    switch (token) {
      case '--config':
        result.config = tokens.shift();
        break;
      case '--input':
        result.input = tokens.shift();
        break;
      case '--languages':
        result.languages = tokens.shift()?.split(',').map((value) => value.trim()).filter(Boolean);
        break;
      case '--mode':
        result.mode = tokens.shift() as TranslationMode;
        break;
      case '--provider':
        result.provider = tokens.shift();
        break;
      case '--model':
        result.model = tokens.shift();
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
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return result;
}

function getHelpText(): string {
  return [
    'ui5-ai-i18n translate [options]',
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
