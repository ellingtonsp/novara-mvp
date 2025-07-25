import { describe, it, expect, vi } from 'vitest';
import { 
  EnvironmentTestUtils, 
  developmentConfig, 
  stagingConfig, 
  productionConfig 
} from './environment-configs';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Environment Tests', () => {

  describe('Development Environment', () => {
    const devUtils = new EnvironmentTestUtils(developmentConfig);

    it('should have correct development configuration', () => {
      expect(developmentConfig.name).toBe('Development');
      expect(developmentConfig.apiUrl).toBe('http://localhost:9002');
      expect(developmentConfig.frontendUrl).toBe('http://localhost:4200');
      expect(developmentConfig.environment).toBe('development');
      expect(developmentConfig.debug).toBe(true);
    });

    it('should test API connectivity in development', async () => {
      // Mock successful API response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', environment: 'development' }),
      });

      const result = await devUtils.testApiConnectivity();
      expect(result).toBe(true);
    });

    it('should test frontend accessibility in development', async () => {
      // Mock successful frontend response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '<!DOCTYPE html><html><body>React App</body></html>',
      });

      const result = await devUtils.testFrontendAccessibility();
      expect(result).toBe(true);
    });

    it('should test frontend content in development', async () => {
      // Mock frontend content with React app
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => `
          <!DOCTYPE html>
          <html>
            <body>
              <div id="root">
                <div>You don't have to navigate IVF alone</div>
              </div>
            </body>
          </html>
        `,
      });

      const result = await devUtils.testFrontendContent();
      expect(result.success).toBe(true);
      expect(result.content).toContain('You don\'t have to navigate');
    });
  });

  describe('Staging Environment', () => {
    const stagingUtils = new EnvironmentTestUtils(stagingConfig);

    it('should have correct staging configuration', () => {
      expect(stagingConfig.name).toBe('Staging');
      expect(stagingConfig.apiUrl).toBe('https://novara-staging-staging.up.railway.app');
      expect(stagingConfig.frontendUrl).toBe('https://novara-bd6xsx1ru-novara-fertility.vercel.app');
      expect(stagingConfig.environment).toBe('staging');
      expect(stagingConfig.debug).toBe(true);
    });

    it('should test API connectivity in staging', async () => {
      // Mock successful API response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', environment: 'staging' }),
      });

      const result = await stagingUtils.testApiConnectivity();
      expect(result).toBe(true);
    });

    it('should test user authentication in staging', async () => {
      // Mock successful login response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ 
          success: true, 
          token: 'test-jwt-token',
          user: { email: 'test@novara.staging' }
        }),
      });

      const result = await stagingUtils.testUserAuthentication();
      expect(result.success).toBe(true);
      expect(result.token).toBe('test-jwt-token');
    });
  });

  describe('Production Environment', () => {
    const prodUtils = new EnvironmentTestUtils(productionConfig);

    it('should have correct production configuration', () => {
      expect(productionConfig.name).toBe('Production');
      expect(productionConfig.apiUrl).toBe('https://novara-mvp-production.up.railway.app');
      expect(productionConfig.frontendUrl).toBe('https://novara-mvp.vercel.app');
      expect(productionConfig.environment).toBe('production');
      expect(productionConfig.debug).toBe(false);
    });

    it('should test API connectivity in production', async () => {
      // Mock successful API response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', environment: 'production' }),
      });

      const result = await prodUtils.testApiConnectivity();
      expect(result).toBe(true);
    });

    it('should test protected endpoints in production', async () => {
      // Mock successful authentication
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ 
          success: true, 
          token: 'test-jwt-token',
          user: { email: 'test@novara.prod' }
        }),
      });

      // Mock successful protected endpoint response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ 
          success: true, 
          user: { email: 'test@novara.prod', nickname: 'TestUser' }
        }),
      });

      const authResult = await prodUtils.testUserAuthentication();
      expect(authResult.success).toBe(true);

      if (authResult.token) {
        const protectedResult = await prodUtils.testProtectedEndpoints(authResult.token);
        expect(protectedResult.success).toBe(true);
      }
    });
  });

  describe('Comprehensive Environment Testing', () => {
    it('should run comprehensive test for development environment', async () => {
      const devUtils = new EnvironmentTestUtils(developmentConfig);

      // Mock all successful responses
      (fetch as any)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ status: 'ok' }) }) // API health
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '<!DOCTYPE html><html><body>React App</body></html>' }) // Frontend accessibility
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '<!DOCTYPE html><html><body><div>You don\'t have to navigate</div></body></html>' }) // Frontend content
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true, token: 'test-token' }) }) // Authentication
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true, token: 'test-token' }) }) // Authentication (second call)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true, user: { email: 'test@novara.dev' } }) }); // Protected endpoints

      const result = await devUtils.runComprehensiveTest();
      
      expect(result.apiConnectivity).toBe(true);
      expect(result.frontendAccessibility).toBe(true);
      expect(result.frontendContent).toBe(true);
      expect(result.authentication).toBe(true);
      expect(result.protectedEndpoints).toBe(true);
      expect(result.overall).toBe(true);
    });

    it('should handle API connectivity failures', async () => {
      const devUtils = new EnvironmentTestUtils(developmentConfig);

      // Mock API failure
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await devUtils.testApiConnectivity();
      expect(result).toBe(false);
    });

    it('should handle frontend content validation failures', async () => {
      const devUtils = new EnvironmentTestUtils(developmentConfig);

      // Mock frontend response without React content
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '<!DOCTYPE html><html><body><div>Static content</div></body></html>',
      });

      const result = await devUtils.testFrontendContent();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing React app content');
    });
  });
}); 