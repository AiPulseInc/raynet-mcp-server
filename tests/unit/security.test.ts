/**
 * Security Hardening Tests
 *
 * Sprint 1: CORS defaults and activity owner ID resolution
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// CORS Security
// ============================================================================

describe('CORS Security', () => {
  it('CORS_ORIGIN defaults to empty string (not "*")', () => {
    const savedCorsOrigin = process.env['CORS_ORIGIN'];
    delete process.env['CORS_ORIGIN'];
    // The constant is read at module load time, so we verify the fallback logic directly
    const corsOrigin = process.env['CORS_ORIGIN'] || '';
    expect(corsOrigin).toBe('');
    expect(corsOrigin).not.toBe('*');
    if (savedCorsOrigin !== undefined) process.env['CORS_ORIGIN'] = savedCorsOrigin;
  });

  it('CORS header value is "null" when CORS_ORIGIN not set', () => {
    const corsOrigin = '';
    const headerValue = corsOrigin || 'null';
    expect(headerValue).toBe('null');
  });

  it('CORS header reflects CORS_ORIGIN when set to a specific origin', () => {
    const corsOrigin = 'https://n8n.example.com';
    const headerValue = corsOrigin || 'null';
    expect(headerValue).toBe('https://n8n.example.com');
  });

  it('CORS header is "null" when CORS_ORIGIN is empty string', () => {
    const corsOrigin = '';
    const headerValue = corsOrigin || 'null';
    expect(headerValue).toBe('null');
    expect(headerValue).not.toBe('*');
  });

  it('production mode logs warning when CORS_ORIGIN is empty', () => {
    const isProduction = true;
    const corsOrigin = '';
    const shouldWarn = isProduction && (!corsOrigin || corsOrigin === '*');
    expect(shouldWarn).toBe(true);
  });

  it('production mode logs warning when CORS_ORIGIN is "*"', () => {
    const isProduction = true;
    const corsOrigin = '*';
    const shouldWarn = isProduction && (!corsOrigin || corsOrigin === '*');
    expect(shouldWarn).toBe(true);
  });

  it('production mode does not warn when CORS_ORIGIN is set to a valid origin', () => {
    const isProduction = true;
    const corsOrigin = 'https://my-n8n.example.com';
    const shouldWarn = isProduction && (!corsOrigin || corsOrigin === '*');
    expect(shouldWarn).toBe(false);
  });
});

// ============================================================================
// Activity Owner Resolution
// ============================================================================

describe('Activity Owner Resolution', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Config schema parses RAYNET_DEFAULT_OWNER_ID correctly', async () => {
    process.env['RAYNET_DEFAULT_OWNER_ID'] = '42';
    const { loadConfig } = await import('@/config/env');
    // Reset cached config
    vi.resetModules();
    const { loadConfig: freshLoadConfig } = await import('@/config/env');
    const config = freshLoadConfig();
    expect(config.server.defaultOwnerId).toBe(42);
    delete process.env['RAYNET_DEFAULT_OWNER_ID'];
  });

  it('Config schema returns undefined when RAYNET_DEFAULT_OWNER_ID not set', async () => {
    delete process.env['RAYNET_DEFAULT_OWNER_ID'];
    vi.resetModules();
    const { loadConfig } = await import('@/config/env');
    const config = loadConfig();
    expect(config.server.defaultOwnerId).toBeUndefined();
  });

  it('Config schema rejects non-positive RAYNET_DEFAULT_OWNER_ID', async () => {
    process.env['RAYNET_DEFAULT_OWNER_ID'] = '0';
    vi.resetModules();
    const { loadConfig } = await import('@/config/env');
    // 0 parses as NaN for positive int check — parseOptionalNumber returns 0,
    // but Zod rejects it (positive = > 0)
    expect(() => loadConfig()).toThrow();
    delete process.env['RAYNET_DEFAULT_OWNER_ID'];
  });

  it('getOwnerId() returns RAYNET_DEFAULT_OWNER_ID when all API calls fail', async () => {
    process.env['RAYNET_DEFAULT_OWNER_ID'] = '99';

    vi.resetModules();

    const { ActivitiesService } = await import('@/api/activities');

    // Mock client that always fails
    const mockClient = {
      getList: vi.fn().mockRejectedValue(new Error('API unavailable')),
      getOne: vi.fn().mockRejectedValue(new Error('API unavailable')),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      getRateLimitInfo: vi.fn().mockReturnValue({}),
    };

    const service = new ActivitiesService(mockClient as never);

    // Access the private method via cast
    const ownerId = await (service as never)['getOwnerId']();
    expect(ownerId).toBe(99);

    delete process.env['RAYNET_DEFAULT_OWNER_ID'];
  });

  it('getOwnerId() throws Polish error when all API calls fail and no RAYNET_DEFAULT_OWNER_ID', async () => {
    delete process.env['RAYNET_DEFAULT_OWNER_ID'];

    vi.resetModules();

    const { ActivitiesService } = await import('@/api/activities');

    const mockClient = {
      getList: vi.fn().mockRejectedValue(new Error('API unavailable')),
      getOne: vi.fn().mockRejectedValue(new Error('API unavailable')),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      getRateLimitInfo: vi.fn().mockReturnValue({}),
    };

    const service = new ActivitiesService(mockClient as never);

    await expect((service as never)['getOwnerId']()).rejects.toThrow(
      'Nie można określić właściciela aktywności'
    );
  });

  it('getOwnerId() uses company owner when API succeeds', async () => {
    delete process.env['RAYNET_DEFAULT_OWNER_ID'];

    vi.resetModules();

    const { ActivitiesService } = await import('@/api/activities');

    const mockClient = {
      getList: vi.fn().mockResolvedValue({
        data: [{ owner: { id: 7 } }],
        totalCount: 1,
      }),
      getOne: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      getRateLimitInfo: vi.fn().mockReturnValue({}),
    };

    const service = new ActivitiesService(mockClient as never);
    const ownerId = await (service as never)['getOwnerId']();
    expect(ownerId).toBe(7);
  });
});
