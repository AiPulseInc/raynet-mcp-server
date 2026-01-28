/**
 * Raynet MCP Server - HTTP Transport
 *
 * HTTP-based MCP server for remote deployment (Railway, n8n integration)
 * Uses StreamableHTTPServerTransport for HTTP/SSE communication
 */

// Early startup logging for debugging
console.log('[STARTUP] Raynet MCP HTTP Server starting...');
console.log('[STARTUP] PORT env:', process.env.PORT);
console.log('[STARTUP] NODE_ENV env:', process.env.NODE_ENV);

import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
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
function createMCPServer(): Server {
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

  // List Tools Handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Listing available tools', { count: allToolDefinitions.length });
    return { tools: allToolDefinitions };
  });

  // Call Tool Handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.info('Tool called', { tool: name, args });

    try {
      return await handleTool(name, args);
    } catch (error) {
      logger.error('Tool execution error', { tool: name, error });
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił nieznany błąd';
      return {
        content: [{ type: 'text', text: `Błąd wykonania narzędzia: ${errorMessage}` }],
        isError: true,
      };
    }
  });

  return server;
}

// ============================================================================
// HTTP Server
// ============================================================================

const app = express();

// Middleware
app.use(express.json());

// CORS for n8n and other external clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id');
  res.header('Access-Control-Expose-Headers', 'Mcp-Session-Id');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'raynet-mcp-server',
    version: '1.0.0',
    tools: allToolDefinitions.length,
    timestamp: new Date().toISOString(),
  });
});

// Info endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Raynet MCP Server',
    version: '1.0.0',
    description: 'MCP server for Raynet CRM integration',
    tools: allToolDefinitions.length,
    endpoints: {
      health: '/health',
      mcp: '/mcp (POST for messages, GET for SSE stream)',
    },
  });
});

// Store transports by session ID for stateful mode
const transports = new Map<string, StreamableHTTPServerTransport>();

// MCP endpoint - handles both POST (messages) and GET (SSE stream)
app.all('/mcp', async (req: Request, res: Response) => {
  logger.info('MCP request received', { method: req.method, sessionId: req.headers['mcp-session-id'] });

  try {
    // Check for existing session
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.has(sessionId)) {
      // Reuse existing transport for this session
      transport = transports.get(sessionId)!;
    } else if (req.method === 'POST' && !sessionId) {
      // New session - create transport and server
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      });

      const server = createMCPServer();
      await server.connect(transport);

      // Store transport by session ID after connection
      if (transport.sessionId) {
        transports.set(transport.sessionId, transport);
        logger.info('New MCP session created', { sessionId: transport.sessionId });

        // Clean up on close
        transport.onclose = () => {
          if (transport.sessionId) {
            transports.delete(transport.sessionId);
            logger.info('MCP session closed', { sessionId: transport.sessionId });
          }
        };
      }
    } else if (req.method === 'GET' && !sessionId) {
      // GET without session - reject
      res.status(400).json({ error: 'Missing Mcp-Session-Id header for GET request' });
      return;
    } else {
      // Session ID provided but not found
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    logger.error('MCP request error', { error });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// ============================================================================
// Server Startup
// ============================================================================

async function startHTTPServer(): Promise<void> {
  // Validate configuration
  const configValidation = validateConfig();
  if (!configValidation.valid) {
    logger.error('Invalid configuration', { errors: configValidation.errors });
    throw new Error(`Błąd konfiguracji: ${configValidation.errors?.join(', ')}`);
  }

  const config = loadConfig();
  const port = config.server.port || 3000;

  logger.info('Starting Raynet MCP HTTP Server', {
    instanceName: config.raynet.instanceName,
    nodeEnv: config.server.nodeEnv,
    toolCount: allToolDefinitions.length,
    port,
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

  // Start HTTP server
  app.listen(port, () => {
    logger.info(`Raynet MCP HTTP Server started on port ${port}`);
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║           Raynet MCP Server - HTTP Transport                   ║
╠════════════════════════════════════════════════════════════════╣
║  Status:    Running                                            ║
║  Port:      ${String(port).padEnd(50)}║
║  Tools:     ${String(allToolDefinitions.length).padEnd(50)}║
║  Endpoints:                                                    ║
║    GET  /         - Server info                                ║
║    GET  /health   - Health check                               ║
║    POST /mcp      - MCP messages                               ║
║    GET  /mcp      - MCP SSE stream (requires session)          ║
╚════════════════════════════════════════════════════════════════╝
    `);
  });

  // Handle shutdown
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down...');
    process.exit(0);
  });
}

// ============================================================================
// Main Entry Point
// ============================================================================

startHTTPServer().catch((error) => {
  // Use console.error for fatal errors as logger might not be initialized
  console.error('Fatal error starting HTTP server:', error);
  try {
    logger.error('Fatal error starting HTTP server', { error });
  } catch {
    // Logger not available, already logged to console
  }
  process.exit(1);
});
