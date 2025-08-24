import backend from '~backend/client';
import { backendBaseUrl } from '../config';

interface HttpConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  response?: any;
}

class HttpClient {
  private client: any;
  private config: HttpConfig;
  private healthCheckCache: { isHealthy: boolean; lastCheck: number } = {
    isHealthy: true,
    lastCheck: 0
  };

  constructor(config: HttpConfig = {}) {
    this.config = {
      timeout: 15000,
      retries: 3,
      retryDelay: 1000,
      ...config
    };

    // Initialize the backend client with proper configuration
    if (backendBaseUrl) {
      console.log('🔧 Initializing HTTP client with custom backend URL:', backendBaseUrl);
      this.client = backend.with({ 
        baseURL: backendBaseUrl,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    } else {
      console.log('🔧 Initializing HTTP client with default configuration');
      this.client = backend;
    }
  }

  // Enhanced health check with multiple endpoints and detailed logging
  async isBackendHealthy(): Promise<boolean> {
    const now = Date.now();
    const cacheTimeout = 30000; // 30 seconds

    // Return cached result if recent
    if (now - this.healthCheckCache.lastCheck < cacheTimeout) {
      console.log(`🏥 Using cached health status: ${this.healthCheckCache.isHealthy}`);
      return this.healthCheckCache.isHealthy;
    }

    console.group('🏥 Comprehensive Backend Health Check');
    console.log('Backend URL:', backendBaseUrl || 'default');
    console.log('Current time:', new Date().toISOString());

    try {
      // Try multiple health endpoints for better reliability
      const healthChecks = [
        { name: 'ping', endpoint: () => this.client.health.ping() },
        { name: 'production', endpoint: () => this.client.health.productionCheck() }
      ];

      let anySuccess = false;
      
      for (const check of healthChecks) {
        try {
          console.log(`Testing ${check.name} endpoint...`);
          
          const response = await Promise.race([
            check.endpoint(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`${check.name} health check timeout`)), 8000)
            )
          ]);

          console.log(`✅ ${check.name} health check passed:`, response);
          anySuccess = true;
          break; // If any check passes, we're good
        } catch (error) {
          console.log(`❌ ${check.name} health check failed:`, error);
        }
      }

      if (anySuccess) {
        console.log('✅ Backend is healthy');
        this.healthCheckCache = { isHealthy: true, lastCheck: now };
        console.groupEnd();
        return true;
      } else {
        throw new Error('All health checks failed');
      }
    } catch (error) {
      console.log('❌ All backend health checks failed:', error);
      
      // Additional debugging for production
      if (typeof window !== 'undefined' && window.location.hostname === 'renosteps.app') {
        console.log('🔍 Production debugging info:');
        console.log('- Current URL:', window.location.href);
        console.log('- Backend URL:', backendBaseUrl);
        console.log('- User Agent:', navigator.userAgent);
        console.log('- Network status:', navigator.onLine ? 'online' : 'offline');
        
        // Test direct fetch to backend
        try {
          const directUrl = 'https://renovation-task-manager-d2evcgk82vjt19ur26rg.lp.dev/health/ping';
          console.log('🧪 Testing direct fetch to:', directUrl);
          
          const directResponse = await fetch(directUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          console.log('🧪 Direct fetch result:', {
            status: directResponse.status,
            statusText: directResponse.statusText,
            ok: directResponse.ok
          });
        } catch (directError) {
          console.log('🧪 Direct fetch failed:', directError);
        }
      }
      
      this.healthCheckCache = { isHealthy: false, lastCheck: now };
      console.groupEnd();
      return false;
    }
  }

  // Centralized request wrapper with timeout, retry, and health checks
  async request<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    // Check backend health first
    const isHealthy = await this.isBackendHealthy();
    if (!isHealthy) {
      throw new Error(`Backend service is not available. Please ensure the backend is running.`);
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retries!; attempt++) {
      try {
        console.log(`📡 Attempting ${operationName} (attempt ${attempt}/${this.config.retries})`);
        
        // Add timeout to the operation
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${operationName} timed out after ${this.config.timeout}ms`)), this.config.timeout)
          )
        ]);

        console.log(`✅ ${operationName} completed successfully`);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.log(`❌ ${operationName} failed (attempt ${attempt}/${this.config.retries}):`, error);

        // Don't retry for certain types of errors
        if (this.shouldNotRetry(error)) {
          console.log(`🚫 Not retrying ${operationName} due to error type`);
          break;
        }

        // Wait before retrying (except on last attempt)
        if (attempt < this.config.retries!) {
          const delay = this.config.retryDelay! * attempt; // Exponential backoff
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    console.error(`💥 ${operationName} failed after ${this.config.retries} attempts`);
    throw this.enhanceError(lastError!, operationName);
  }

  // Determine if an error should not be retried
  private shouldNotRetry(error: any): boolean {
    // Don't retry authentication errors
    if (error?.message?.includes('Unauthorized') || error?.message?.includes('401')) {
      return true;
    }

    // Don't retry validation errors
    if (error?.message?.includes('validation') || error?.message?.includes('invalid')) {
      return true;
    }

    // Don't retry duplicate errors
    if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
      return true;
    }

    // Don't retry 4xx errors (except 408, 429)
    const status = error?.status || error?.statusCode;
    if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
      return true;
    }

    return false;
  }

  // Enhance error with more context
  private enhanceError(error: Error, operationName: string): HttpError {
    const enhanced = error as HttpError;
    
    if (error.message.includes('Failed to fetch')) {
      enhanced.message = `Network error during ${operationName}. Please check your connection and ensure the backend is running.`;
    } else if (error.message.includes('timeout')) {
      enhanced.message = `${operationName} timed out. Please try again.`;
    } else if (!enhanced.message.includes(operationName)) {
      enhanced.message = `${operationName} failed: ${error.message}`;
    }

    return enhanced;
  }

  // Get authenticated client
  withAuth(token: string) {
    const authenticatedClient = this.client.with({
      auth: async () => ({
        authorization: `Bearer ${token}`,
      }),
    });

    return new HttpClient(this.config).setClient(authenticatedClient);
  }

  private setClient(client: any): HttpClient {
    this.client = client;
    return this;
  }

  // Expose the underlying client for direct access when needed
  get raw() {
    return this.client;
  }
}

// Export singleton instance
export const http = new HttpClient();

// Export class for creating custom instances
export { HttpClient };

// Helper function for common operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  config?: HttpConfig
): Promise<T> {
  const client = new HttpClient(config);
  return client.request(operation, operationName);
}
