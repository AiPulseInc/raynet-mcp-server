/**
 * Environment Configuration Module
 *
 * Loads and validates environment variables from .env file
 * Provides typed configuration objects for the application
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import type { AppConfig, RaynetConfig, ServerConfig } from '../types';

// Load .env file
dotenv.config();

// ============================================================================
// Validation Schemas
// ============================================================================

const RaynetConfigSchema = z.object({
  instanceUrl: z
    .string()
    .url('RAYNET_INSTANCE_URL musi być poprawnym adresem URL')
    .refine((url) => url.endsWith('/api/v2/') || url.endsWith('/api/v2'), {
      message: 'RAYNET_INSTANCE_URL powinien kończyć się na /api/v2/',
    }),
  instanceName: z.string().min(1, 'RAYNET_INSTANCE_NAME jest wymagany'),
  username: z.string().email('RAYNET_USERNAME musi być poprawnym adresem email'),
  apiKey: z.string().min(1, 'RAYNET_API_KEY jest wymagany'),
  maxRetries: z.number().int().min(0).max(10).default(3),
  timeoutMs: z.number().int().min(1000).max(120000).default(30000),
  rateLimitBuffer: z.number().int().min(0).max(1000).default(100),
});

const ServerConfigSchema = z.object({
  port: z.number().int().min(1).max(65535).default(3000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  logFormat: z.enum(['json', 'pretty']).default('pretty'),
});

// ============================================================================
// Environment Variable Parsing
// ============================================================================

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function loadRaynetConfig(): RaynetConfig {
  const config = {
    instanceUrl: process.env['RAYNET_INSTANCE_URL'] ?? '',
    instanceName: process.env['RAYNET_INSTANCE_NAME'] ?? '',
    username: process.env['RAYNET_USERNAME'] ?? '',
    apiKey: process.env['RAYNET_API_KEY'] ?? '',
    maxRetries: parseNumber(process.env['RAYNET_MAX_RETRIES'], 3),
    timeoutMs: parseNumber(process.env['RAYNET_TIMEOUT_MS'], 30000),
    rateLimitBuffer: parseNumber(process.env['RAYNET_RATE_LIMIT_BUFFER'], 100),
  };

  // Normalize URL to always end with /
  if (!config.instanceUrl.endsWith('/')) {
    config.instanceUrl += '/';
  }

  return RaynetConfigSchema.parse(config);
}

function loadServerConfig(): ServerConfig {
  const config = {
    port: parseNumber(process.env['PORT'], 3000),
    nodeEnv: (process.env['NODE_ENV'] ?? 'development') as ServerConfig['nodeEnv'],
    logLevel: (process.env['LOG_LEVEL'] ?? 'info') as ServerConfig['logLevel'],
    logFormat: (process.env['LOG_FORMAT'] ?? 'pretty') as ServerConfig['logFormat'],
  };

  return ServerConfigSchema.parse(config);
}

// ============================================================================
// Configuration Loading
// ============================================================================

let cachedConfig: AppConfig | null = null;

/**
 * Load and validate all configuration
 * Throws ZodError if validation fails
 */
export function loadConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    cachedConfig = {
      raynet: loadRaynetConfig(),
      server: loadServerConfig(),
    };
    return cachedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`);
      throw new Error(
        `Błąd konfiguracji środowiska:\n${messages.join('\n')}\n\nSprawdź plik .env i upewnij się, że wszystkie wymagane zmienne są ustawione.`
      );
    }
    throw error;
  }
}

/**
 * Get configuration (loads if not already loaded)
 */
export function getConfig(): AppConfig {
  return loadConfig();
}

/**
 * Validate configuration without caching
 * Useful for testing
 */
export function validateConfig(): { valid: boolean; errors?: string[] } {
  try {
    loadRaynetConfig();
    loadServerConfig();
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { valid: false, errors: [(error as Error).message] };
  }
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getConfig().server.nodeEnv === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getConfig().server.nodeEnv === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getConfig().server.nodeEnv === 'test';
}

// ============================================================================
// Export configuration object for direct access
// ============================================================================

export const config = {
  get raynet(): RaynetConfig {
    return getConfig().raynet;
  },
  get server(): ServerConfig {
    return getConfig().server;
  },
};

export default config;
