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

  it('leaves encodeUnicode undefined when the flag is not provided', () => {
    const parsed = parseArgs([
      '--config',
      'i18n-ai.config.json',
    ]);

    expect(parsed.encodeUnicode).toBeUndefined();
  });

  it('rejects unknown values for mode', async () => {
    const log = vi.fn();
    const error = vi.fn();

    const exitCode = await runCli(['--mode', 'override'], { log, error });

    expect(exitCode).toBe(1);
    expect(error).toHaveBeenCalledWith(
      'Unknown value "override" for option "--mode". Expected one of: missing, overwrite.'
    );
    expect(log).toHaveBeenCalled();
  });

  it('rejects unknown options', async () => {
    const log = vi.fn();
    const error = vi.fn();

    const exitCode = await runCli(['--mod', 'overwrite'], { log, error });

    expect(exitCode).toBe(1);
    expect(error).toHaveBeenCalledWith(
      'Unknown option "--mod". Use --help to see supported options.'
    );
    expect(log).toHaveBeenCalled();
  });

  it('rejects missing option values', async () => {
    const log = vi.fn();
    const error = vi.fn();

    const exitCode = await runCli(['--mode'], { log, error });

    expect(exitCode).toBe(1);
    expect(error).toHaveBeenCalledWith('Missing value for option "--mode".');
    expect(log).toHaveBeenCalled();
  });

  it('prints help for explicit help command', async () => {
    const log = vi.fn();
    const error = vi.fn();

    const exitCode = await runCli(['help'], { log, error });

    expect(exitCode).toBe(0);
    expect(log).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
