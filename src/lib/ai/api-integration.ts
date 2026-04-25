// AI API Integration Layer
// Integration logic with priority system for automatic fallback

import { allAIAPIs, getAPIsByPriority, getAPIsByType, type AIAPIConfig } from './api-configurations';
import { aiInfrastructure } from './ai-infrastructure';
import { aiSecurityLayer } from './security-layer';
import { aiMultiTenantSupport } from './multi-tenant-support';
import { aiResponseNormalizer } from './response-normalization';
import { aiSmartRoutingEngine } from './smart-routing-engine';
import { aiAnalyticsDashboard } from './analytics-dashboard';
import { offlineModeSupport } from './offline-mode-support';

export interface AIRequestOptions {
  type: AIAPIConfig['type'];
  prompt: string;
  tenantId?: string;
  userId?: string;
  module: string;
  prioritizeCost?: boolean;
  prioritizeSpeed?: boolean;
  prioritizeAccuracy?: boolean;
  maxCost?: number;
  maxLatency?: number;
}

export interface AIIntegrationResult {
  success: boolean;
  content: string;
  provider: string;
  tokensUsed: number;
  cost: number;
  latency: number;
  cached: boolean;
  fallbackUsed: boolean;
  error?: string;
}

export class AIAPIIntegration {
  private apiKeys: Map<string, string> = new Map();

  // Set API key for a provider
  setAPIKey(apiId: string, apiKey: string) {
    this.apiKeys.set(apiId, apiKey);
    // Also register with security layer
    aiSecurityLayer.registerAPIKey({
      provider: apiId,
      encryptedKey: apiKey,
      role: 'user',
      permissions: ['read', 'write'],
      rateLimit: 1000,
    });
  }

  // Get API key for a provider
  getAPIKey(apiId: string): string | undefined {
    return this.apiKeys.get(apiId);
  }

  // Execute AI request with automatic fallback
  async executeRequest(options: AIRequestOptions): Promise<AIIntegrationResult> {
    const startTime = Date.now();
    let lastError: string | undefined;
    let fallbackUsed = false;

    // Check cache first
    const cacheKey = this.generateCacheKey(options);
    const cached = aiInfrastructure.cache.get(cacheKey);
    if (cached) {
      return {
        success: true,
        content: cached.content,
        provider: cached.provider,
        tokensUsed: cached.tokensUsed,
        cost: cached.cost,
        latency: cached.latency,
        cached: true,
        fallbackUsed: false,
      };
    }

    // Get available APIs by type, sorted by priority
    const availableAPIs = getAPIsByPriority(options.type);

    // Apply smart routing
    const selectedAPI = aiSmartRoutingEngine.selectProvider(
      availableAPIs.map((api) => api.id),
      {
        prioritizeCost: options.prioritizeCost,
        prioritizeSpeed: options.prioritizeSpeed,
        prioritizeAccuracy: options.prioritizeAccuracy,
        maxCost: options.maxCost,
        maxLatency: options.maxLatency,
      }
    );

    if (!selectedAPI) {
      return {
        success: false,
        content: '',
        provider: '',
        tokensUsed: 0,
        cost: 0,
        latency: 0,
        cached: false,
        fallbackUsed: false,
        error: 'No available AI provider',
      };
    }

    // Try primary and fallback APIs
    for (const api of availableAPIs) {
      if (!this.apiKeys.has(api.id)) continue;

      try {
        const result = await this.callAPI(api, options);
        const latency = Date.now() - startTime;

        // Normalize response
        const normalized = aiResponseNormalizer.normalize(result, api.id, {
          latency,
        });

        // Cache the result
        aiInfrastructure.cache.set(cacheKey, {
          id: this.generateId(),
          requestId: this.generateId(),
          content: normalized.content,
          provider: api.id,
          tokensUsed: 0,
          cost: api.costPerRequest || 0,
          latency,
          timestamp: Date.now(),
          cached: false,
        });

        // Track cost
        aiInfrastructure.costControl.trackCost(
          api.costPerRequest || 0,
          options.userId,
          options.tenantId,
          options.module
        );

        // Log the request
        aiInfrastructure.logging.log({
          provider: api.id,
          prompt: options.prompt,
          response: normalized.content,
          tokensUsed: 0,
          cost: api.costPerRequest || 0,
          latency,
          userId: options.userId,
          tenantId: options.tenantId,
          module: options.module,
          success: true,
        });

        // Update analytics
        aiAnalyticsDashboard.recordRequest(api.id, true, api.costPerRequest || 0, latency, 0);

        // Update smart routing metrics
        aiSmartRoutingEngine.updateMetrics(api.id, {
          avgLatency: latency,
          avgCost: api.costPerRequest || 0,
          accuracy: 0.95,
          successRate: 1,
        });

        return {
          success: normalized.success,
          content: normalized.content,
          provider: api.id,
          tokensUsed: normalized.metadata.tokensUsed,
          cost: normalized.metadata.cost,
          latency,
          cached: false,
          fallbackUsed,
          error: normalized.error,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        fallbackUsed = true;

        // Log failure
        aiInfrastructure.logging.log({
          provider: api.id,
          prompt: options.prompt,
          response: '',
          tokensUsed: 0,
          cost: 0,
          latency: Date.now() - startTime,
          userId: options.userId,
          tenantId: options.tenantId,
          module: options.module,
          success: false,
          error: lastError,
        });

        // Update analytics
        aiAnalyticsDashboard.recordRequest(api.id, false, 0, Date.now() - startTime, 0);

        // Update smart routing metrics
        aiSmartRoutingEngine.updateMetrics(api.id, {
          successRate: 0.9,
        });

        // Continue to next provider
        continue;
      }
    }

    // All providers failed, use fail-safe
    const fallbackResponse = aiInfrastructure.failSafe.getFallbackResponse(options.module);
    return {
      success: false,
      content: fallbackResponse,
      provider: 'fallback',
      tokensUsed: 0,
      cost: 0,
      latency: Date.now() - startTime,
      cached: false,
      fallbackUsed: true,
      error: lastError || 'All AI providers failed',
    };
  }

  // Call specific API
  private async callAPI(api: AIAPIConfig, options: AIRequestOptions): Promise<any> {
    const apiKey = this.apiKeys.get(api.id);
    if (!apiKey) {
      throw new Error(`No API key configured for ${api.id}`);
    }

    // Check rate limit
    const canProceed = await aiInfrastructure.rateLimitHandler.checkRateLimit(
      api.id,
      1000 // Default max requests
    );

    if (!canProceed) {
      throw new Error('Rate limit exceeded');
    }

    // Check cost limit
    if (!aiInfrastructure.costControl.checkLimit(options.userId, options.module)) {
      throw new Error('Cost limit exceeded');
    }

    // In production, actual HTTP call to API
    // This is a placeholder implementation
    console.log(`[AIAPIIntegration] Calling ${api.name} at ${api.apiUrl}`);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Return mock response
    return {
      choices: [
        {
          message: {
            content: `AI response from ${api.name} for: ${options.prompt}`,
          },
        },
      ],
    };
  }

  // Execute with retry
  async executeWithRetry(
    options: AIRequestOptions,
    maxRetries: number = 3
  ): Promise<AIIntegrationResult> {
    return aiInfrastructure.retrySystem.executeWithRetry(
      () => this.executeRequest(options),
      { maxRetries }
    );
  }

  // Execute with offline fallback
  async executeWithOfflineFallback(
    options: AIRequestOptions
  ): Promise<AIIntegrationResult> {
    return offlineModeSupport.executeWithOfflineFallback(
      () => this.executeRequest(options),
      () => ({
        success: false,
        content: 'Offline mode - using cached data',
        provider: 'offline',
        tokensUsed: 0,
        cost: 0,
        latency: 0,
        cached: true,
        fallbackUsed: true,
        error: 'Offline mode',
      }),
      this.generateCacheKey(options)
    );
  }

  // Get provider health status
  getProviderHealth(providerId: string) {
    return aiInfrastructure.healthMonitor.getHealthStatus(providerId);
  }

  // Get all provider health statuses
  getAllProviderHealth() {
    return allAIAPIs.map((api) => ({
      id: api.id,
      name: api.name,
      health: aiInfrastructure.healthMonitor.getHealthStatus(api.id),
    }));
  }

  // Enable/disable provider
  setProviderStatus(apiId: string, status: 'active' | 'inactive') {
    const api = allAIAPIs.find((a) => a.id === apiId);
    if (api) {
      api.status = status;
    }
  }

  // Get usage statistics
  getUsageStats() {
    return {
      dailyCost: aiInfrastructure.costControl.getDailyCost(),
      cacheSize: this.getCacheSize(),
      logs: aiInfrastructure.logging.getLogs(),
    };
  }

  private generateCacheKey(options: AIRequestOptions): string {
    return `${options.type}-${options.module}-${options.prompt.substring(0, 50)}`;
  }

  private generateId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCacheSize(): number {
    // Placeholder for cache size calculation
    return 0;
  }
}

// Export singleton instance
export const aiAPIIntegration = new AIAPIIntegration();
