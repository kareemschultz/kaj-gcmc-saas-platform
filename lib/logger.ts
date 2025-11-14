// Structured logging utility for production-ready observability

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
  service?: string;
  environment?: string;
  version?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';
  private serviceName = 'kgc-compliance-cloud';
  private version = process.env.npm_package_version || '0.1.0';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();

    // In development, use human-readable format
    if (this.isDevelopment) {
      const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
    }

    // In production, use JSON format for log aggregation (ELK, Loki, etc.)
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      service: this.serviceName,
      environment: process.env.NODE_ENV || 'production',
      version: this.version,
      ...(context && { context }),
    };

    return JSON.stringify(logEntry);
  }

  private formatError(level: LogLevel, message: string, error?: Error, context?: LogContext): string {
    const timestamp = new Date().toISOString();

    if (this.isDevelopment) {
      const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
      const errorStr = error ? `\nError: ${error.message}\nStack: ${error.stack}` : '';
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}${errorStr}`;
    }

    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      service: this.serviceName,
      environment: process.env.NODE_ENV || 'production',
      version: this.version,
      ...(context && { context }),
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }),
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment && !this.isTest) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext) {
    if (!this.isTest) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext) {
    if (!this.isTest) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  /**
   * Log error messages with optional Error object
   */
  error(message: string, error?: Error, context?: LogContext) {
    if (!this.isTest) {
      console.error(this.formatError('error', message, error, context));
    }
  }

  /**
   * Log authentication events
   */
  logAuth(event: string, userId?: string | number, context?: LogContext) {
    this.info(`Auth: ${event}`, {
      ...context,
      userId,
      category: 'authentication',
    });
  }

  /**
   * Log RBAC permission checks
   */
  logRBAC(event: string, userId: string | number, role: string, context?: LogContext) {
    this.info(`RBAC: ${event}`, {
      ...context,
      userId,
      role,
      category: 'authorization',
    });
  }

  /**
   * Log background job execution
   */
  logJob(jobName: string, status: 'started' | 'completed' | 'failed', context?: LogContext) {
    const level = status === 'failed' ? 'error' : 'info';
    const message = `Job ${jobName} ${status}`;

    if (level === 'error') {
      this.error(message, undefined, { ...context, category: 'background-job' });
    } else {
      this.info(message, { ...context, category: 'background-job' });
    }
  }

  /**
   * Log database queries (for slow query detection)
   */
  logQuery(query: string, duration: number, context?: LogContext) {
    const level = duration > 1000 ? 'warn' : 'debug';
    const message = `Query executed in ${duration}ms`;

    if (level === 'warn') {
      this.warn(message, {
        ...context,
        query: query.substring(0, 200), // Limit query length
        duration,
        category: 'database',
      });
    } else {
      this.debug(message, {
        ...context,
        query: query.substring(0, 200),
        duration,
        category: 'database',
      });
    }
  }

  /**
   * Log API requests
   */
  logRequest(method: string, path: string, statusCode: number, duration: number, context?: LogContext) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    const message = `${method} ${path} ${statusCode} (${duration}ms)`;

    if (level === 'error') {
      this.error(message, undefined, { ...context, category: 'http' });
    } else if (level === 'warn') {
      this.warn(message, { ...context, category: 'http' });
    } else {
      this.info(message, { ...context, category: 'http' });
    }
  }
}

export const logger = new Logger();
