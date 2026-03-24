/**
 * Logging utility for debug output
 */

import { Logger } from '../types.js';

/**
 * Default logger implementation
 * Uses console for output, respects DEBUG environment variable
 */
export class ConsoleLogger implements Logger {
  private debug_enabled: boolean;
  private prefix: string;

  constructor(prefix: string = '@concircle/i18n-ai-translator', debug?: boolean) {
    this.prefix = prefix;
    this.debug_enabled =
      debug ??
      (typeof process !== 'undefined' &&
        process.env.DEBUG?.includes('i18n-ai-translator')) ??
      false;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (this.debug_enabled) {
      console.debug(`[${this.prefix}:DEBUG] ${message}`, data || '');
    }
  }

  info(message: string, data?: Record<string, unknown>): void {
    console.info(`[${this.prefix}:INFO] ${message}`, data || '');
  }

  warn(message: string, data?: Record<string, unknown>): void {
    console.warn(`[${this.prefix}:WARN] ${message}`, data || '');
  }

  error(message: string, error?: Error): void {
    console.error(`[${this.prefix}:ERROR] ${message}`, error?.message || '');
    if (error?.stack && this.debug_enabled) {
      console.error(error.stack);
    }
  }

  setDebug(enabled: boolean): void {
    this.debug_enabled = enabled;
  }

  isDebugEnabled(): boolean {
    return this.debug_enabled;
  }
}

/**
 * No-op logger (for silent mode)
 */
export class SilentLogger implements Logger {
  debug(_message: string, _data?: Record<string, unknown>): void {
    // no-op
  }

  info(_message: string, _data?: Record<string, unknown>): void {
    // no-op
  }

  warn(_message: string, _data?: Record<string, unknown>): void {
    // no-op
  }

  error(_message: string, _error?: Error): void {
    // no-op
  }
}

/**
 * Create a logger instance
 *
 * @param debug Enable debug output
 * @param silent Enable silent mode (no output)
 * @returns Logger instance
 */
export function createLogger(debug: boolean = false, silent: boolean = false): Logger {
  if (silent) {
    return new SilentLogger();
  }

  return new ConsoleLogger('@concircle/i18n-ai-translator', debug);
}
