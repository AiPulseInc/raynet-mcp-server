/**
 * Raynet API Client
 *
 * Core HTTP client for Raynet CRM API with:
 * - Basic authentication
 * - Rate limiting tracking
 * - Automatic retries with exponential backoff
 * - Error handling with Polish messages
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { loadConfig } from '../config/env';
import { logger } from '../utils/logger';
import {
  RaynetError,
  AuthenticationError,
  RateLimitError,
  ConnectionError,
  TimeoutError,
  createErrorFromStatus,
  isRetryableError,
} from '../utils/errors';
import type {
  RaynetResponse,
  RaynetListResponse,
  RaynetErrorResponse,
  RateLimitInfo,
} from '../types';

// ============================================================================
// Types
// ============================================================================

interface RequestOptions extends AxiosRequestConfig {
  skipRateLimitCheck?: boolean;
  retryCount?: number;
}

interface RateLimitState {
  limit: number;
  remaining: number;
  reset: number;
  lastUpdated: Date;
}

// ============================================================================
// Rate Limit Manager
// ============================================================================

class RateLimitManager {
  private state: RateLimitState = {
    limit: 24000,
    remaining: 24000,
    reset: 0,
    lastUpdated: new Date(),
  };
  private buffer: number;

  constructor(buffer: number = 100) {
    this.buffer = buffer;
  }

  update(headers: Record<string, string>): void {
    const limit = headers['x-ratelimit-limit'];
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];

    if (limit) this.state.limit = parseInt(limit, 10);
    if (remaining) this.state.remaining = parseInt(remaining, 10);
    if (reset) this.state.reset = parseInt(reset, 10);
    this.state.lastUpdated = new Date();

    logger.debug('Rate limit updated', {
      limit: this.state.limit,
      remaining: this.state.remaining,
      reset: new Date(this.state.reset * 1000).toISOString(),
    });
  }

  canMakeRequest(): boolean {
    // Check if we've passed the reset time
    if (this.state.reset && Date.now() / 1000 > this.state.reset) {
      this.state.remaining = this.state.limit;
    }
    return this.state.remaining > this.buffer;
  }

  getInfo(): RateLimitInfo {
    return {
      limit: this.state.limit,
      remaining: this.state.remaining,
      reset: this.state.reset,
    };
  }

  getResetTime(): number {
    return this.state.reset;
  }

  decrementRemaining(): void {
    if (this.state.remaining > 0) {
      this.state.remaining--;
    }
  }
}

// ============================================================================
// Raynet API Client
// ============================================================================

export class RaynetClient {
  private client: AxiosInstance;
  private rateLimitManager: RateLimitManager;
  private maxRetries: number;
  private instanceName: string;

  constructor() {
    const config = loadConfig();
    this.maxRetries = config.raynet.maxRetries;
    this.instanceName = config.raynet.instanceName;
    this.rateLimitManager = new RateLimitManager(config.raynet.rateLimitBuffer);

    // Create axios instance
    this.client = axios.create({
      baseURL: config.raynet.instanceUrl.replace(/\/$/, ''),
      timeout: config.raynet.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Raynet-MCP-Server/1.0.0',
        'X-Instance-Name': config.raynet.instanceName,
      },
      auth: {
        username: config.raynet.username,
        password: config.raynet.apiKey,
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (requestConfig: InternalAxiosRequestConfig) => {
        logger.debug('API Request', {
          method: requestConfig.method?.toUpperCase(),
          url: requestConfig.url,
          params: requestConfig.params,
        });
        return requestConfig;
      },
      (error: unknown) => {
        logger.error('Request interceptor error', { error });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Update rate limit from headers
        this.rateLimitManager.update(response.headers as Record<string, string>);

        logger.debug('API Response', {
          status: response.status,
          url: response.config.url,
          rateLimit: this.rateLimitManager.getInfo(),
        });

        return response;
      },
      (error: unknown) => {
        // Update rate limit even on error responses
        if (axios.isAxiosError(error) && error.response?.headers) {
          this.rateLimitManager.update(error.response.headers as Record<string, string>);
        }
        return Promise.reject(error);
      }
    );
  }

  // ==========================================================================
  // Public Methods
  // ==========================================================================

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url: endpoint,
      params,
    });
  }

  /**
   * GET request for list endpoints
   */
  async getList<T>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<RaynetListResponse<T>> {
    return this.request<RaynetListResponse<T>>({
      method: 'GET',
      url: endpoint,
      params,
    });
  }

  /**
   * GET request for single entity
   */
  async getOne<T>(endpoint: string): Promise<RaynetResponse<T>> {
    return this.request<RaynetResponse<T>>({
      method: 'GET',
      url: endpoint,
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<RaynetResponse<T>> {
    return this.request<RaynetResponse<T>>({
      method: 'POST',
      url: endpoint,
      data,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<RaynetResponse<T>> {
    return this.request<RaynetResponse<T>>({
      method: 'PUT',
      url: endpoint,
      data,
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint: string): Promise<void> {
    await this.request<void>({
      method: 'DELETE',
      url: endpoint,
    });
  }

  /**
   * Get current rate limit info
   */
  getRateLimitInfo(): RateLimitInfo {
    return this.rateLimitManager.getInfo();
  }

  /**
   * Check if we can make a request without hitting rate limit
   */
  canMakeRequest(): boolean {
    return this.rateLimitManager.canMakeRequest();
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Execute HTTP request with rate limiting and retries
   */
  private async request<T>(options: RequestOptions): Promise<T> {
    const retryCount = options.retryCount ?? 0;

    // Check rate limit before making request
    if (!options.skipRateLimitCheck && !this.rateLimitManager.canMakeRequest()) {
      const resetTime = this.rateLimitManager.getResetTime();
      throw new RateLimitError(resetTime);
    }

    try {
      // Decrement remaining before request
      this.rateLimitManager.decrementRemaining();

      const response = await this.client.request<T>(options);
      return response.data;
    } catch (error) {
      const raynetError = this.handleError(error);

      // Retry logic for retryable errors
      if (isRetryableError(raynetError) && retryCount < this.maxRetries) {
        const delay = this.calculateRetryDelay(retryCount, raynetError);

        logger.warn('Retrying request', {
          attempt: retryCount + 1,
          maxRetries: this.maxRetries,
          delayMs: delay,
          error: raynetError.code,
        });

        await this.sleep(delay);

        return this.request<T>({
          ...options,
          retryCount: retryCount + 1,
        });
      }

      throw raynetError;
    }
  }

  /**
   * Convert axios/unknown error to RaynetError
   */
  private handleError(error: unknown): RaynetError {
    if (error instanceof RaynetError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      // Network/connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return new ConnectionError(
          `Nie można połączyć się z serwerem Raynet: ${error.message}`,
          { originalError: error.message, code: error.code }
        );
      }

      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        return new TimeoutError(
          this.client.defaults.timeout ?? 30000,
          { originalError: error.message, code: error.code }
        );
      }

      // HTTP errors with response
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data as RaynetErrorResponse | undefined;

        // Special handling for 401
        if (status === 401) {
          return new AuthenticationError(
            data?.translatedMessage ?? data?.message ?? 'Błąd uwierzytelniania',
            { instanceName: this.instanceName }
          );
        }

        // Special handling for 429
        if (status === 429) {
          const resetTime = this.rateLimitManager.getResetTime() ||
            Math.floor(Date.now() / 1000) + 3600;
          return new RateLimitError(resetTime);
        }

        return createErrorFromStatus(status, data, {
          url: error.config?.url,
          method: error.config?.method,
        });
      }

      // Request made but no response
      if (error.request) {
        return new ConnectionError(
          'Brak odpowiedzi z serwera Raynet',
          { originalError: error.message }
        );
      }
    }

    // Unknown error
    if (error instanceof Error) {
      return new RaynetError(
        error.message,
        'UNKNOWN_ERROR',
        500,
        { originalError: error.message }
      );
    }

    return new RaynetError(
      'Wystąpił nieznany błąd',
      'UNKNOWN_ERROR',
      500,
      { originalError: String(error) }
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number, error: RaynetError): number {
    // For rate limit errors, wait until reset
    if (error instanceof RateLimitError) {
      const now = Math.floor(Date.now() / 1000);
      const waitTime = (error.resetAt.getTime() / 1000 - now) * 1000;
      return Math.max(waitTime, 1000); // At least 1 second
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, ...
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);

    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.floor(delay + jitter);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let clientInstance: RaynetClient | null = null;

/**
 * Get or create the Raynet API client singleton
 */
export function getRaynetClient(): RaynetClient {
  if (!clientInstance) {
    clientInstance = new RaynetClient();
  }
  return clientInstance;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetRaynetClient(): void {
  clientInstance = null;
}
