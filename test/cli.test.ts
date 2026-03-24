import { describe, expect, it, vi } from 'vitest';
import { parseArgs, runCli } from '../src/cli';

describe('CLI', () => {
  it('prints help for missing command', async () => {
    const log = vi.fn();
    const error = vi.fn();

    const exitCode = await runCli([], { log, error });

    expect(exitCode).toBe(0);
    expect(log).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('parses translate arguments', () => {
    const parsed = parseArgs([
      'translate',
      '--config',
      'i18n-ai.config.json',
      '--input',
      'webapp/i18n/i18n.properties',
      '--languages',
      'de,fr',
      '--mode',
      'overwrite',
      '--model',
      'gpt-4.1',
      '--dry-run',
      '--encode-unicode',
      '--verbose',
    ]);

    expect(parsed).toEqual({
      command: 'translate',
      config: 'i18n-ai.config.json',
      input: 'webapp/i18n/i18n.properties',
      languages: ['de', 'fr'],
      mode: 'overwrite',
      provider: undefined,
      model: 'gpt-4.1',
      dryRun: true,
      encodeUnicode: true,
      verbose: true,
      help: false,
    });
  });
});
