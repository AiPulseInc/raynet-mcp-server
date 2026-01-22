/**
 * Raynet CRM MCP Server
 *
 * Model Context Protocol server for Raynet CRM integration
 * Provides AI-powered CRM operations through Claude AI
 *
 * @author AiPulse Inc.
 * @license MIT
 */

import { loadConfig, validateConfig } from './config/env';
import logger from './utils/logger';

// ============================================================================
// Application Entry Point
// ============================================================================

async function main(): Promise<void> {
  logger.info('🚀 Uruchamianie Raynet CRM MCP Server...');

  // Validate configuration
  const validation = validateConfig();
  if (!validation.valid) {
    logger.error('❌ Błąd konfiguracji:', { errors: validation.errors });
    process.exit(1);
  }

  // Load configuration
  const config = loadConfig();

  logger.info('✅ Konfiguracja załadowana pomyślnie', {
    instanceUrl: config.raynet.instanceUrl,
    instanceName: config.raynet.instanceName,
    port: config.server.port,
    environment: config.server.nodeEnv,
  });

  // TODO: Initialize MCP server (Sprint 1)
  // TODO: Initialize Raynet API client (Sprint 1)
  // TODO: Register tools (Sprints 2-4)
  // TODO: Start SSE server (Sprint 1)

  logger.info(`📡 Serwer MCP gotowy do pracy na porcie ${config.server.port}`);
  logger.info('⏳ Oczekiwanie na implementację serwera MCP (Sprint 1)...');

  // Keep process alive for now
  // This will be replaced with actual server in Sprint 1
  process.on('SIGINT', () => {
    logger.info('🛑 Otrzymano sygnał SIGINT, zamykanie serwera...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('🛑 Otrzymano sygnał SIGTERM, zamykanie serwera...');
    process.exit(0);
  });
}

// ============================================================================
// Error Handling
// ============================================================================

process.on('uncaughtException', (error) => {
  logger.error('❌ Nieobsłużony wyjątek:', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('❌ Nieobsłużone odrzucenie Promise:', { reason });
  process.exit(1);
});

// ============================================================================
// Run Application
// ============================================================================

main().catch((error) => {
  logger.error('❌ Błąd uruchamiania aplikacji:', { error: error.message });
  process.exit(1);
});
