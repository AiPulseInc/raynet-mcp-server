/**
 * Raynet MCP Server
 *
 * Model Context Protocol server for Raynet CRM integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { loadConfig, validateConfig } from './config/env';
import { logger } from './utils/logger';
import { allToolDefinitions, handleTool } from './tools';
import { getRaynetClient } from './api/client';

// ============================================================================
// Server Setup
// ============================================================================

/**
 * Create and configure the MCP server
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: 'raynet-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ==========================================================================
  // List Tools Handler
  // ==========================================================================

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Listing available tools', { count: allToolDefinitions.length });

    return {
      tools: allToolDefinitions,
    };
  });

  // ==========================================================================
  // Call Tool Handler
  // ==========================================================================

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.info('Tool called', { tool: name, args });

    try {
      return await handleTool(name, args);
    } catch (error) {
      logger.error('Tool execution error', { tool: name, error });

      const errorMessage =
        error instanceof Error ? error.message : 'Wystąpił nieznany błąd';

      return {
        content: [
          {
            type: 'text',
            text: `Błąd wykonania narzędzia: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// ============================================================================
// Server Startup
// ============================================================================

/**
 * Start the MCP server
 */
export async function startServer(): Promise<void> {
  // Validate configuration
  const configValidation = validateConfig();
  if (!configValidation.valid) {
    logger.error('Invalid configuration', { errors: configValidation.errors });
    throw new Error(`Błąd konfiguracji: ${configValidation.errors?.join(', ')}`);
  }

  const config = loadConfig();
  logger.info('Starting Raynet MCP Server', {
    instanceName: config.raynet.instanceName,
    nodeEnv: config.server.nodeEnv,
    toolCount: allToolDefinitions.length,
  });

  // Initialize API client to verify connection
  try {
    const client = getRaynetClient();
    const rateLimitInfo = client.getRateLimitInfo();
    logger.info('API client initialized', { rateLimitInfo });
  } catch (error) {
    logger.error('Failed to initialize API client', { error });
    throw error;
  }

  // Create and start server
  const server = createServer();
  const transport = new StdioServerTransport();

  logger.info('Connecting to stdio transport...');

  await server.connect(transport);

  logger.info('Raynet MCP Server started successfully');

  // Handle shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down...');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down...');
    await server.close();
    process.exit(0);
  });
}

// ============================================================================
// Main Entry Point (when run directly)
// ============================================================================

if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Fatal error starting server', { error });
    process.exit(1);
  });
}
