/**
 * Vitest Global Test Setup
 *
 * This file is run before all tests
 */

import { beforeAll, afterAll, vi } from 'vitest';

// ============================================================================
// Environment Setup
// ============================================================================

// Set test environment variables
beforeAll(() => {
  process.env['NODE_ENV'] = 'test';
  process.env['LOG_LEVEL'] = 'error'; // Reduce logging noise in tests
  process.env['RAYNET_INSTANCE_URL'] = 'https://test.raynetcrm.com/api/v2/';
  process.env['RAYNET_INSTANCE_NAME'] = 'test-instance';
  process.env['RAYNET_USERNAME'] = 'test@example.com';
  process.env['RAYNET_API_KEY'] = 'test-api-key';
});

// ============================================================================
// Global Mocks
// ============================================================================

// Mock console methods to reduce noise
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'info').mockImplementation(() => {});
vi.spyOn(console, 'debug').mockImplementation(() => {});

// Allow warnings and errors to show
// vi.spyOn(console, 'warn').mockImplementation(() => {});
// vi.spyOn(console, 'error').mockImplementation(() => {});

// ============================================================================
// Cleanup
// ============================================================================

afterAll(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a mock Raynet API response
 */
export function createMockResponse<T>(
  data: T,
  totalCount?: number
): { success: boolean; totalCount?: number; data: T } {
  return {
    success: true,
    ...(totalCount !== undefined && { totalCount }),
    data,
  };
}

/**
 * Create a mock error response
 */
export function createMockErrorResponse(
  type: string,
  message: string,
  status: number
): { type: string; message: string; translatedMessage?: string; status: number } {
  return {
    type,
    message,
    translatedMessage: message,
    status,
  };
}

/**
 * Wait for a specified time (useful for async tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock company
 */
export function createMockCompany(
  overrides?: Partial<{
    id: number;
    name: string;
    rating: string;
    state: string;
  }>
): {
  id: number;
  name: string;
  rating: string;
  state: string;
} {
  return {
    id: 1,
    name: 'Test Company Sp. z o.o.',
    rating: 'A',
    state: 'A_POTENTIAL',
    ...overrides,
  };
}

/**
 * Create a mock contact
 */
export function createMockContact(
  overrides?: Partial<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  }>
): {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
} {
  return {
    id: 1,
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'jan.kowalski@test.pl',
    ...overrides,
  };
}

/**
 * Create a mock deal
 */
export function createMockDeal(
  overrides?: Partial<{
    id: number;
    name: string;
    price: number;
    probability: number;
  }>
): {
  id: number;
  name: string;
  price: number;
  probability: number;
} {
  return {
    id: 1,
    name: 'Test Deal',
    price: 10000,
    probability: 50,
    ...overrides,
  };
}
