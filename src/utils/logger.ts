import type { AgentAction } from '../types/agent';

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, message: string): string {
    return `[${this.formatTimestamp()}] [${level}] ${message}`;
  }

  /**
   * Logs an agent action with structured formatting
   */
  logAgentAction(action: AgentAction): void {
    const message = `Agent Action - Type: ${action.type}, Status: ${action.status}`;
    console.log(this.formatMessage('AGENT', message), {
      action,
      timestamp: this.formatTimestamp(),
    });
  }

  /**
   * Logs an informational message
   */
  logInfo(message: string): void {
    console.log(this.formatMessage('INFO', message));
  }

  /**
   * Logs an error with stack trace
   */
  logError(error: Error): void {
    console.error(this.formatMessage('ERROR', error.message), {
      error: error.message,
      stack: error.stack,
      timestamp: this.formatTimestamp(),
    });
  }

  /**
   * Logs a warning message
   */
  logWarning(message: string): void {
    console.warn(this.formatMessage('WARNING', message));
  }

  /**
   * Logs a debug message (only in development)
   */
  logDebug(message: string, data?: unknown): void {
    if (import.meta.env.DEV) {
      console.debug(this.formatMessage('DEBUG', message), data);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;