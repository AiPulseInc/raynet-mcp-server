/**
 * Raynet MCP Server - HTTP Transport
 *
 * HTTP-based MCP server for remote deployment (Railway, n8n integration)
 * Uses simple HTTP JSON-RPC for maximum compatibility with n8n HTTP Streamable
 * Includes Bearer token authentication for security
 */

// Early startup logging for debugging
console.log('[STARTUP] Raynet MCP HTTP Server starting...');
console.log('[STARTUP] PORT env:', process.env.PORT);
console.log('[STARTUP] NODE_ENV env:', process.env.NODE_ENV);

import express, { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { loadConfig, validateConfig } from './config/env';
import { logger } from './utils/logger';
import { allToolDefinitions, handleTool } from './tools';
import { getRaynetClient } from './api/client';

// ============================================================================
// Authentication
// ============================================================================

const MCP_API_KEY = process.env.MCP_API_KEY || '';

/**
 * Bearer token authentication middleware
 */
function authenticateBearer(req: Request, res: Response, next: NextFunction): void {
  // Skip auth if no API key is configured (development mode)
  if (!MCP_API_KEY) {
    logger.warn('MCP_API_KEY not set - authentication disabled');
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn('Unauthorized request - no Authorization header', { ip: req.ip });
    res.status(401).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32001,
        message: 'Unauthorized: Missing Authorization header',
      },
    });
    return;
  }

  // Parse Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || !parts[0] || parts[0].toLowerCase() !== 'bearer') {
    logger.warn('Unauthorized request - invalid Authorization format', { ip: req.ip });
    res.status(401).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32001,
        message: 'Unauthorized: Invalid Authorization format. Use: Bearer <token>',
      },
    });
    return;
  }

  const token = parts[1];

  // Validate token
  if (token !== MCP_API_KEY) {
    logger.warn('Unauthorized request - invalid token', { ip: req.ip });
    res.status(401).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32001,
        message: 'Unauthorized: Invalid API key',
      },
    });
    return;
  }

  // Token is valid
  next();
}

// ============================================================================
// Types
// ============================================================================

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  id?: string | number;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface Session {
  id: string;
  createdAt: Date;
  lastAccess: Date;
}

// ============================================================================
// Session Management
// ============================================================================

const sessions = new Map<string, Session>();

// Clean up old sessions every 5 minutes
setInterval(() => {
  const now = new Date();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  for (const [id, session] of sessions.entries()) {
    if (now.getTime() - session.lastAccess.getTime() > maxAge) {
      sessions.delete(id);
      logger.debug('Session expired', { sessionId: id });
    }
  }
}, 5 * 60 * 1000);

// ============================================================================
// MCP Protocol Handlers
// ============================================================================

function handleInitialize(params: Record<string, unknown>): JsonRpcResponse['result'] {
  logger.info('MCP initialize', { params });
  return {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: 'raynet-mcp-server',
      version: '1.0.0',
    },
  };
}

function handleInitialized(): JsonRpcResponse['result'] {
  logger.debug('MCP initialized notification received');
  return {};
}

function handleListTools(): JsonRpcResponse['result'] {
  logger.debug('Listing tools', { count: allToolDefinitions.length });
  return {
    tools: allToolDefinitions,
  };
}

async function handleCallTool(params: Record<string, unknown>): Promise<JsonRpcResponse['result']> {
  const name = params.name as string;
  const args = (params.arguments || {}) as Record<string, unknown>;

  logger.info('Tool called', { tool: name, args });

  try {
    const result = await handleTool(name, args);
    return result;
  } catch (error) {
    logger.error('Tool execution error', { tool: name, error });
    const errorMessage = error instanceof Error ? error.message : 'Wystąpił nieznany błąd';
    return {
      content: [{ type: 'text', text: `Błąd wykonania narzędzia: ${errorMessage}` }],
      isError: true,
    };
  }
}

async function handleJsonRpcRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  const { method, params, id } = request;

  try {
    let result: unknown;

    switch (method) {
      case 'initialize':
        result = handleInitialize(params || {});
        break;
      case 'notifications/initialized':
      case 'initialized':
        result = handleInitialized();
        break;
      case 'tools/list':
        result = handleListTools();
        break;
      case 'tools/call':
        result = await handleCallTool(params || {});
        break;
      case 'ping':
        result = {};
        break;
      default:
        logger.warn('Unknown method', { method });
        return {
          jsonrpc: '2.0',
          id: id ?? null,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        };
    }

    return {
      jsonrpc: '2.0',
      id: id ?? null,
      result,
    };
  } catch (error) {
    logger.error('JSON-RPC handler error', { method, error });
    return {
      jsonrpc: '2.0',
      id: id ?? null,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error',
      },
    };
  }
}

// ============================================================================
// HTTP Server
// ============================================================================

const app = express();

// Middleware - parse JSON
app.use(express.json());

// CORS for n8n and other external clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id, Accept');
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
    authentication: MCP_API_KEY ? 'Bearer token required' : 'disabled',
    endpoints: {
      health: '/health (public)',
      mcp: '/mcp (POST, requires Bearer auth)',
    },
  });
});

// MCP endpoint - handles JSON-RPC over HTTP (requires authentication)
app.post('/mcp', authenticateBearer, async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  logger.info('MCP request received', {
    method: req.method,
    sessionId,
    body: req.body,
  });

  try {
    const body = req.body;

    // Handle batch requests
    if (Array.isArray(body)) {
      const responses = await Promise.all(
        body.map((request: JsonRpcRequest) => handleJsonRpcRequest(request))
      );

      // Generate session ID if this is an initialize request
      const hasInitialize = body.some((r: JsonRpcRequest) => r.method === 'initialize');
      if (hasInitialize && !sessionId) {
        const newSessionId = randomUUID();
        sessions.set(newSessionId, {
          id: newSessionId,
          createdAt: new Date(),
          lastAccess: new Date(),
        });
        res.header('Mcp-Session-Id', newSessionId);
        logger.info('New session created', { sessionId: newSessionId });
      }

      res.json(responses);
      return;
    }

    // Handle single request
    const request = body as JsonRpcRequest;
    const response = await handleJsonRpcRequest(request);

    // Generate session ID for initialize
    if (request.method === 'initialize' && !sessionId) {
      const newSessionId = randomUUID();
      sessions.set(newSessionId, {
        id: newSessionId,
        createdAt: new Date(),
        lastAccess: new Date(),
      });
      res.header('Mcp-Session-Id', newSessionId);
      logger.info('New session created', { sessionId: newSessionId });
    }

    // Update session access time
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      session.lastAccess = new Date();
    }

    res.json(response);
  } catch (error) {
    logger.error('MCP request error', { error });
    res.status(500).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: 'Internal server error',
      },
    });
  }
});

// Handle DELETE for session cleanup (MCP spec) (requires authentication)
app.delete('/mcp', authenticateBearer, (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
    logger.info('Session deleted', { sessionId });
    res.sendStatus(204);
  } else {
    res.status(404).json({ error: 'Session not found' });
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
  const authStatus = MCP_API_KEY ? 'Enabled (Bearer token)' : 'DISABLED (set MCP_API_KEY)';

  app.listen(port, () => {
    logger.info(`Raynet MCP HTTP Server started on port ${port}`, { auth: !!MCP_API_KEY });
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║           Raynet MCP Server - HTTP Transport                   ║
╠════════════════════════════════════════════════════════════════╣
║  Status:    Running                                            ║
║  Port:      ${String(port).padEnd(50)}║
║  Tools:     ${String(allToolDefinitions.length).padEnd(50)}║
║  Auth:      ${authStatus.padEnd(50)}║
║  Endpoints:                                                    ║
║    GET  /         - Server info (public)                       ║
║    GET  /health   - Health check (public)                      ║
║    POST /mcp      - MCP JSON-RPC (auth required)               ║
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
