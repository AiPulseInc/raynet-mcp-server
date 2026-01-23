/**
 * Raynet CRM MCP Server
 *
 * Model Context Protocol server for Raynet CRM integration
 * Provides AI-powered CRM operations through Claude AI
 *
 * @author AiPulse Inc.
 * @license MIT
 */

import { startServer } from './server';
import { logger } from './utils/logger';

// ============================================================================
// Error Handling
// ============================================================================

process.on('uncaughtException', (error) => {
  logger.error('Nieobsłużony wyjątek', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Nieobsłużone odrzucenie Promise', { reason });
  process.exit(1);
});

// ============================================================================
// Run Application
// ============================================================================

startServer().catch((error) => {
  logger.error('Błąd uruchamiania serwera', { error: error.message });
  process.exit(1);
});
