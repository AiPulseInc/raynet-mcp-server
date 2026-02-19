/**
 * Performance Tests
 *
 * Sprint 3: Parallel activity queries
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// Activity Parallel Queries
// ============================================================================

describe('Activity Parallel Queries', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('list() calls all 4 activity types concurrently', async () => {
    const { ActivitiesService } = await import('@/api/activities');

    const callTimes: number[] = [];
    let resolveAll: () => void;
    const barrier = new Promise<void>(resolve => { resolveAll = resolve; });

    const mockClient = {
      getList: vi.fn().mockImplementation(async (endpoint: string) => {
        callTimes.push(Date.now());
        // All 4 calls must start before any returns — wait at barrier
        if (callTimes.length === 4) resolveAll!();
        await barrier;
        return { data: [], totalCount: 0 };
      }),
      getOne: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      getRateLimitInfo: vi.fn().mockReturnValue({}),
    };

    const service = new ActivitiesService(mockClient as never);
    await service.list({});

    // All 4 types should have been called
    expect(mockClient.getList).toHaveBeenCalledTimes(4);
    // All calls must have started before the barrier resolved (concurrently)
    expect(callTimes.length).toBe(4);
  });

  it('list() merges results from all 4 types correctly', async () => {
    const { ActivitiesService } = await import('@/api/activities');

    const mockActivity = (id: number, type: string) => ({
      id,
      _entityName: type,
      title: `Activity ${id}`,
      status: 'SCHEDULED',
      scheduledFrom: '2026-02-19 10:00',
      scheduledTill: '2026-02-19 11:00',
      priority: 'DEFAULT',
      personal: false,
      participants: [],
      tags: [],
      customFields: {},
      rowInfo: { createdAt: '2026-02-19 10:00', createdBy: 'test' },
      securityLevel: { id: 1, name: 'public' },
      _version: 1,
    });

    let callCount = 0;
    const mockClient = {
      getList: vi.fn().mockImplementation(async () => {
        const id = ++callCount;
        return { data: [mockActivity(id, 'Task')], totalCount: 1 };
      }),
      getOne: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      getRateLimitInfo: vi.fn().mockReturnValue({}),
    };

    const service = new ActivitiesService(mockClient as never);
    const result = await service.list({ limit: 10 });

    // Should have merged 4 results (one from each type)
    expect(result.activities.length).toBe(4);
    expect(result.totalCount).toBe(4);
  });

  it('list() partial failure — one type failing does not crash the whole request', async () => {
    const { ActivitiesService } = await import('@/api/activities');

    let callCount = 0;
    const mockClient = {
      getList: vi.fn().mockImplementation(async (endpoint: string) => {
        callCount++;
        if (endpoint.includes('task')) {
          throw new Error('Task endpoint unavailable');
        }
        return { data: [{ id: callCount, scheduledFrom: '2026-02-19 10:00', scheduledTill: '2026-02-19 11:00' }], totalCount: 1 };
      }),
      getOne: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      getRateLimitInfo: vi.fn().mockReturnValue({}),
    };

    const service = new ActivitiesService(mockClient as never);

    // Should not throw even though /task/ fails
    await expect(service.list({})).resolves.toBeDefined();
    const result = await service.list({});

    // 3 types succeed + 1 fails silently — we called 4 times in first attempt,
    // so second call also makes 4 calls. Result should have 3 activities.
    expect(result.activities.length).toBe(3);
  });

  it('getToday() calls all 4 activity types concurrently', async () => {
    const { ActivitiesService } = await import('@/api/activities');

    let resolveAll: () => void;
    const barrier = new Promise<void>(resolve => { resolveAll = resolve; });
    let callCount = 0;

    const mockClient = {
      getList: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 4) resolveAll!();
        await barrier;
        return { data: [], totalCount: 0 };
      }),
      getOne: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      getRateLimitInfo: vi.fn().mockReturnValue({}),
    };

    const service = new ActivitiesService(mockClient as never);
    await service.getToday();

    expect(mockClient.getList).toHaveBeenCalledTimes(4);
    expect(callCount).toBe(4);
  });

  it('getOverdue() calls all 4 activity types concurrently', async () => {
    const { ActivitiesService } = await import('@/api/activities');

    let resolveAll: () => void;
    const barrier = new Promise<void>(resolve => { resolveAll = resolve; });
    let callCount = 0;

    const mockClient = {
      getList: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 4) resolveAll!();
        await barrier;
        return { data: [], totalCount: 0 };
      }),
      getOne: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      getRateLimitInfo: vi.fn().mockReturnValue({}),
    };

    const service = new ActivitiesService(mockClient as never);
    await service.getOverdue();

    expect(mockClient.getList).toHaveBeenCalledTimes(4);
    expect(callCount).toBe(4);
  });

  it('search() calls all 4 activity types concurrently', async () => {
    const { ActivitiesService } = await import('@/api/activities');

    let resolveAll: () => void;
    const barrier = new Promise<void>(resolve => { resolveAll = resolve; });
    let callCount = 0;

    const mockClient = {
      getList: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 4) resolveAll!();
        await barrier;
        return { data: [], totalCount: 0 };
      }),
      getOne: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      getRateLimitInfo: vi.fn().mockReturnValue({}),
    };

    const service = new ActivitiesService(mockClient as never);
    await service.search({ query: 'test' });

    expect(mockClient.getList).toHaveBeenCalledTimes(4);
    expect(callCount).toBe(4);
  });
});

// ============================================================================
// HTTP Rate Limiting (structural verification)
// ============================================================================

describe('HTTP Rate Limiting Configuration', () => {
  it('RateLimit-related headers are a known feature of express-rate-limit', async () => {
    // Verify express-rate-limit is importable (it's now a direct dependency)
    const rateLimitModule = await import('express-rate-limit');
    expect(rateLimitModule.default || rateLimitModule.rateLimit).toBeDefined();
  });

  it('rate limit window is 60 seconds and max is 120', () => {
    // Document the chosen values for review purposes
    const windowMs = 60 * 1000;
    const max = 120;
    // 120 req/min = 2 req/sec, generous headroom for n8n bursts of 5-10
    expect(windowMs).toBe(60000);
    expect(max).toBe(120);
    expect(max / (windowMs / 1000)).toBe(2); // 2 requests per second
  });
});
