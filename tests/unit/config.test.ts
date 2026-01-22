/**
 * Configuration Module Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// We'll test the validation logic
describe('Configuration Module', () => {
  beforeEach(() => {
    // Reset environment for each test
    vi.resetModules();
  });

  describe('Environment Variables', () => {
    it('should have test environment variables set', () => {
      expect(process.env['NODE_ENV']).toBe('test');
      expect(process.env['RAYNET_INSTANCE_URL']).toBeDefined();
      expect(process.env['RAYNET_INSTANCE_NAME']).toBeDefined();
      expect(process.env['RAYNET_USERNAME']).toBeDefined();
      expect(process.env['RAYNET_API_KEY']).toBeDefined();
    });

    it('should have valid test instance URL', () => {
      const url = process.env['RAYNET_INSTANCE_URL'];
      expect(url).toContain('raynetcrm.com');
      expect(url).toContain('/api/v2');
    });

    it('should have valid test email format', () => {
      const email = process.env['RAYNET_USERNAME'];
      expect(email).toMatch(/@/);
    });
  });

  describe('Configuration Loading', () => {
    it('should load configuration without errors', async () => {
      const { loadConfig } = await import('@/config/env');
      expect(() => loadConfig()).not.toThrow();
    });

    it('should return valid configuration object', async () => {
      const { loadConfig } = await import('@/config/env');
      const config = loadConfig();

      expect(config).toHaveProperty('raynet');
      expect(config).toHaveProperty('server');
      expect(config.raynet).toHaveProperty('instanceUrl');
      expect(config.raynet).toHaveProperty('instanceName');
      expect(config.raynet).toHaveProperty('username');
      expect(config.raynet).toHaveProperty('apiKey');
      expect(config.server).toHaveProperty('port');
      expect(config.server).toHaveProperty('nodeEnv');
    });

    it('should validate configuration correctly', async () => {
      const { validateConfig } = await import('@/config/env');
      const result = validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });

  describe('Environment Helpers', () => {
    it('should correctly identify test environment', async () => {
      const { isTest, isDevelopment, isProduction } = await import('@/config/env');

      expect(isTest()).toBe(true);
      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(false);
    });
  });
});
