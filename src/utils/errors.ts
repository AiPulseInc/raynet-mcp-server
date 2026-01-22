/**
 * Error Handling Utilities
 *
 * Custom error classes for Raynet API operations
 * Polish error messages for user-facing errors
 */

import type { RaynetErrorResponse } from '../types';

// ============================================================================
// Base Error Class
// ============================================================================

export class RaynetError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown> | undefined;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RaynetError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// ============================================================================
// Specific Error Classes
// ============================================================================

/**
 * Authentication error (401)
 */
export class AuthenticationError extends RaynetError {
  constructor(message?: string, details?: Record<string, unknown>) {
    super(
      message ?? 'Błąd uwierzytelniania. Sprawdź dane logowania do Raynet API.',
      'AUTHENTICATION_ERROR',
      401,
      details
    );
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends RaynetError {
  constructor(message?: string, details?: Record<string, unknown>) {
    super(
      message ?? 'Brak uprawnień do wykonania tej operacji.',
      'AUTHORIZATION_ERROR',
      403,
      details
    );
    this.name = 'AuthorizationError';
  }
}

/**
 * Resource not found error (404)
 */
export class NotFoundError extends RaynetError {
  constructor(
    resourceType?: string,
    resourceId?: number | string,
    details?: Record<string, unknown>
  ) {
    const message =
      resourceType && resourceId
        ? `Nie znaleziono ${resourceType} o ID: ${resourceId}`
        : resourceType
          ? `Nie znaleziono ${resourceType}`
          : 'Żądany zasób nie został znaleziony.';
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends RaynetError {
  public readonly validationErrors: string[];

  constructor(errors: string[], details?: Record<string, unknown>) {
    const message =
      errors.length === 1
        ? `Błąd walidacji: ${errors[0]}`
        : `Błędy walidacji:\n${errors.map((e) => `  - ${e}`).join('\n')}`;
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
    this.validationErrors = errors;
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends RaynetError {
  public readonly resetAt: Date;
  public readonly retryAfter: number;

  constructor(resetTimestamp: number, details?: Record<string, unknown>) {
    const resetAt = new Date(resetTimestamp * 1000);
    const retryAfter = Math.max(0, Math.ceil((resetTimestamp * 1000 - Date.now()) / 1000));
    const resetTimeStr = resetAt.toLocaleString('pl-PL');

    super(
      `Przekroczono limit zapytań API. Spróbuj ponownie po ${resetTimeStr}.`,
      'RATE_LIMIT_ERROR',
      429,
      { ...details, resetAt: resetAt.toISOString(), retryAfter }
    );
    this.name = 'RateLimitError';
    this.resetAt = resetAt;
    this.retryAfter = retryAfter;
  }
}

/**
 * Network/Connection error
 */
export class ConnectionError extends RaynetError {
  constructor(message?: string, details?: Record<string, unknown>) {
    super(
      message ?? 'Błąd połączenia z serwerem Raynet. Sprawdź połączenie internetowe.',
      'CONNECTION_ERROR',
      503,
      details
    );
    this.name = 'ConnectionError';
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends RaynetError {
  constructor(timeoutMs: number, details?: Record<string, unknown>) {
    super(
      `Przekroczono limit czasu oczekiwania (${timeoutMs}ms). Serwer nie odpowiada.`,
      'TIMEOUT_ERROR',
      504,
      details
    );
    this.name = 'TimeoutError';
  }
}

/**
 * Conflict error (409) - e.g., duplicate resource
 */
export class ConflictError extends RaynetError {
  constructor(message?: string, details?: Record<string, unknown>) {
    super(
      message ?? 'Konflikt danych. Zasób już istnieje lub został zmodyfikowany.',
      'CONFLICT_ERROR',
      409,
      details
    );
    this.name = 'ConflictError';
  }
}

/**
 * Server error (500+)
 */
export class ServerError extends RaynetError {
  constructor(message?: string, details?: Record<string, unknown>) {
    super(
      message ?? 'Błąd serwera Raynet. Spróbuj ponownie później.',
      'SERVER_ERROR',
      500,
      details
    );
    this.name = 'ServerError';
  }
}

// ============================================================================
// Error Factory
// ============================================================================

/**
 * Convert HTTP status code to appropriate error
 */
export function createErrorFromStatus(
  statusCode: number,
  response?: RaynetErrorResponse,
  details?: Record<string, unknown>
): RaynetError {
  const message = response?.translatedMessage ?? response?.message;

  switch (statusCode) {
    case 400:
      return new ValidationError(message ? [message] : ['Nieprawidłowe dane wejściowe.'], details);
    case 401:
      return new AuthenticationError(message, details);
    case 403:
      return new AuthorizationError(message, details);
    case 404:
      return new NotFoundError(undefined, undefined, { ...details, originalMessage: message });
    case 409:
      return new ConflictError(message, details);
    case 429:
      // Try to get reset time from details or default to 1 hour from now
      const resetTime = (details?.['reset'] as number) ?? Math.floor(Date.now() / 1000) + 3600;
      return new RateLimitError(resetTime, details);
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message, details);
    default:
      return new RaynetError(
        message ?? `Nieoczekiwany błąd (kod ${statusCode})`,
        'UNKNOWN_ERROR',
        statusCode,
        details
      );
  }
}

/**
 * Convert any error to RaynetError
 */
export function normalizeError(error: unknown): RaynetError {
  if (error instanceof RaynetError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return new ConnectionError(
        'Nie można połączyć się z serwerem Raynet. Sprawdź adres URL i połączenie internetowe.',
        { originalError: error.message }
      );
    }

    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return new TimeoutError(30000, { originalError: error.message });
    }

    return new RaynetError(error.message, 'UNKNOWN_ERROR', 500, { originalError: error.message });
  }

  return new RaynetError('Wystąpił nieznany błąd.', 'UNKNOWN_ERROR', 500, {
    originalError: String(error),
  });
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Check if error is retryable
 */
export function isRetryableError(error: RaynetError): boolean {
  // Rate limit, server errors, and connection errors are retryable
  return (
    error instanceof RateLimitError ||
    error instanceof ServerError ||
    error instanceof ConnectionError ||
    error instanceof TimeoutError
  );
}

/**
 * Get Polish error message for user
 */
export function getPolishErrorMessage(error: unknown): string {
  const raynetError = normalizeError(error);
  return raynetError.message;
}

/**
 * Format error for logging (includes details, no sensitive data)
 */
export function formatErrorForLogging(error: RaynetError): Record<string, unknown> {
  return {
    name: error.name,
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    details: error.details,
    stack: error.stack,
  };
}

// ============================================================================
// Resource Name Translations (Polish)
// ============================================================================

export const RESOURCE_NAMES_PL: Record<string, string> = {
  company: 'firmy',
  companies: 'firm',
  person: 'kontaktu',
  persons: 'kontaktów',
  contact: 'kontaktu',
  contacts: 'kontaktów',
  businessCase: 'szansy sprzedaży',
  businessCases: 'szans sprzedaży',
  deal: 'szansy sprzedaży',
  deals: 'szans sprzedaży',
  activity: 'aktywności',
  activities: 'aktywności',
  product: 'produktu',
  products: 'produktów',
  offer: 'oferty',
  offers: 'ofert',
};

/**
 * Get Polish resource name
 */
export function getPolishResourceName(resource: string, plural = false): string {
  const key = plural ? `${resource}s` : resource;
  return RESOURCE_NAMES_PL[key] ?? RESOURCE_NAMES_PL[resource] ?? resource;
}
