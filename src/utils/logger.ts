/**
 * Logger Utility
 *
 * Structured logging with Winston
 * Supports both JSON (production) and pretty (development) formats
 * Automatically sanitizes sensitive data from logs
 */

import winston from 'winston';
import { config } from '../config/env';

// ============================================================================
// Sensitive Data Patterns
// ============================================================================

const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /apikey/i,
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /auth/i,
  /credential/i,
];

const SENSITIVE_KEYS = new Set([
  'apiKey',
  'api_key',
  'password',
  'secret',
  'token',
  'authorization',
  'Authorization',
  'RAYNET_API_KEY',
]);

// ============================================================================
// Sanitization
// ============================================================================

/**
 * Redact sensitive values from an object
 */
function sanitizeObject(obj: unknown, depth = 0): unknown {
  if (depth > 10) return obj; // Prevent infinite recursion

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Check if the string looks like a sensitive value
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(obj)) {
        return '***REDACTED***';
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key)) {
        sanitized[key] = '***REDACTED***';
      } else {
        let isSensitiveKey = false;
        for (const pattern of SENSITIVE_PATTERNS) {
          if (pattern.test(key)) {
            isSensitiveKey = true;
            break;
          }
        }
        sanitized[key] = isSensitiveKey ? '***REDACTED***' : sanitizeObject(value, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Format function that sanitizes all log data
 */
const sanitizeFormat = winston.format((info) => {
  return sanitizeObject(info) as winston.Logform.TransformableInfo;
});

// ============================================================================
// Formatters
// ============================================================================

/**
 * Pretty format for development
 */
const prettyFormat = winston.format.combine(
  sanitizeFormat(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaString}`;
  })
);

/**
 * JSON format for production
 */
const jsonFormat = winston.format.combine(
  sanitizeFormat(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ============================================================================
// Logger Instance
// ============================================================================

/**
 * Create logger instance based on configuration
 */
function createLogger(): winston.Logger {
  let logConfig: { level: string; format: winston.Logform.Format };

  try {
    const serverConfig = config.server;
    logConfig = {
      level: serverConfig.logLevel,
      format: serverConfig.logFormat === 'json' ? jsonFormat : prettyFormat,
    };
  } catch {
    // Fallback if config is not yet loaded
    logConfig = {
      level: 'info',
      format: prettyFormat,
    };
  }

  return winston.createLogger({
    level: logConfig.level,
    format: logConfig.format,
    transports: [new winston.transports.Console()],
    // Don't exit on error
    exitOnError: false,
  });
}

// Create singleton logger instance
const logger = createLogger();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Log with request context
 */
export function logWithContext(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>
): void {
  logger.log(level, message, context ? sanitizeObject(context) : undefined);
}

/**
 * Log API request
 */
export function logApiRequest(
  method: string,
  endpoint: string,
  statusCode?: number,
  duration?: number,
  error?: Error
): void {
  const meta: Record<string, unknown> = {
    method,
    endpoint,
  };

  if (statusCode !== undefined) {
    meta['statusCode'] = statusCode;
  }

  if (duration !== undefined) {
    meta['durationMs'] = duration;
  }

  if (error) {
    meta['error'] = error.message;
    logger.error(`API Request Failed: ${method} ${endpoint}`, meta);
  } else {
    logger.info(`API Request: ${method} ${endpoint}`, meta);
  }
}

/**
 * Log rate limit information
 */
export function logRateLimit(remaining: number, limit: number, reset: number): void {
  const percentUsed = ((limit - remaining) / limit) * 100;

  if (remaining < 100) {
    logger.warn('Zbliżamy się do limitu API', {
      remaining,
      limit,
      percentUsed: percentUsed.toFixed(1) + '%',
      resetAt: new Date(reset * 1000).toISOString(),
    });
  } else {
    logger.debug('Status limitu API', {
      remaining,
      limit,
      percentUsed: percentUsed.toFixed(1) + '%',
    });
  }
}

/**
 * Log tool execution
 */
export function logToolExecution(
  toolName: string,
  success: boolean,
  duration?: number,
  error?: string
): void {
  const meta: Record<string, unknown> = {
    tool: toolName,
    success,
  };

  if (duration !== undefined) {
    meta['durationMs'] = duration;
  }

  if (error) {
    meta['error'] = error;
    logger.error(`Narzędzie ${toolName} zakończone niepowodzeniem`, meta);
  } else {
    logger.info(`Narzędzie ${toolName} wykonane pomyślnie`, meta);
  }
}

// ============================================================================
// Export
// ============================================================================

export { logger };
export default logger;
