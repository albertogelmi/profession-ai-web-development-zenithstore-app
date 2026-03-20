/**
 * Centralized logging utility
 * Logs DEBUG messages are only shown when NEXT_PUBLIC_DEBUG_LOGS is set to 'true'
 * Logs INFO messages are only shown when NEXT_PUBLIC_INFO_LOGS is set to 'true'
 */

const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true';
const isInfoEnabled = process.env.NEXT_PUBLIC_INFO_LOGS === 'true';

/**
 * Debug logger - only logs when debug mode is enabled
 * Info logger - only logs when info mode is enabled
 * Warn and Error loggers - always log
 */
export const logger = {
  /**
   * Log debug information
   */
  debug: (...args: any[]) => {
    if (isDebugEnabled) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log info messages
   */
  info: (...args: any[]) => {
    if (isInfoEnabled) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Log warnings (always shown)
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Log errors (always shown)
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};
