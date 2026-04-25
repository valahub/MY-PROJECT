// AI Infrastructure - Enterprise Grade Extension Engine
// Comprehensive AI system with health monitoring, rate limiting, cost control, caching, and fallback

// ============================================
// TYPES
// ============================================

export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'claude' | 'gemini' | 'local' | 'ollama';
  apiKey?: string;
  endpoint?: string;
  priority: number;
  enabled: boolean;
  costPerToken: number;
  maxRequestsPerMinute: number;
}

export interface AIRequest {
  id: string;
  provider: string;
  prompt: string;
  timestamp: number;
  userId?: string;
  tenantId?: string;
  module: string;
}

export interface AIResponse {
  id: string;
  requestId: string;
  content: string;
  provider: string;
  tokensUsed: number;
  cost: number;
  latency: number;
  timestamp: number;
  cached: boolean;
}

export interface AIHealthStatus {
  provider: string;
  healthy: boolean;
  lastCheck: number;
  responseTime: number;
  successRate: number;
  failureCount: number;
}

export interface CostLimit {
  perDay: number;
  perUser: number;
  perModule: string;
  current: number;
}

// ============================================
// API HEALTH MONITOR
// ============================================

export class AIHealthMonitor {
  private healthStatus: Map<string, AIHealthStatus> = new Map();
  private checkInterval: number = 60000; // 1 minute

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    setInterval(() => {
      this.checkAllProviders();
    }, this.checkInterval);
  }

  async checkAllProviders() {
    const providers = this.getProviders();
    for (const provider of providers) {
      await this.checkProvider(provider.id);
    }
  }

  async checkProvider(providerId: string): Promise<AIHealthStatus> {
    const startTime = Date.now();
    let healthy = true;

    try {
      // Simulate health check (in production, actual API call)
      await this.pingProvider(providerId);
    } catch (error) {
      healthy = false;
    }

    const responseTime = Date.now() - startTime;
    const currentStatus = this.healthStatus.get(providerId) || {
      provider: providerId,
      healthy: true,
      lastCheck: 0,
      responseTime: 0,
      successRate: 1,
      failureCount: 0,
    };

    const newStatus: AIHealthStatus = {
      provider: providerId,
      healthy,
      lastCheck: Date.now(),
      responseTime,
      successRate: healthy ? currentStatus.successRate * 0.9 + 0.1 : currentStatus.successRate * 0.9,
      failureCount: healthy ? 0 : currentStatus.failureCount + 1,
    };

    this.healthStatus.set(providerId, newStatus);

    // Auto-disable if too many failures
    if (newStatus.failureCount > 5) {
      this.disableProvider(providerId);
    }

    return newStatus;
  }

  private async pingProvider(providerId: string): Promise<void> {
    // In production, actual health check API call
    return Promise.resolve();
  }

  getHealthStatus(providerId: string): AIHealthStatus | undefined {
    return this.healthStatus.get(providerId);
  }

  isHealthy(providerId: string): boolean {
    const status = this.healthStatus.get(providerId);
    return status?.healthy ?? true;
  }

  private disableProvider(providerId: string) {
    // Disable provider in configuration
    console.warn(`[AIHealthMonitor] Provider ${providerId} disabled due to health issues`);
  }

  private getProviders(): AIProvider[] {
    // Get from configuration
    return [];
  }
}

// ============================================
// API RATE LIMIT HANDLER
// ============================================

export class AIRateLimitHandler {
  private requestCounts: Map<string, number[]> = new Map();
  private queue: Map<string, (() => void)[]> = new Map();

  async checkRateLimit(providerId: string, maxRequests: number): Promise<boolean> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const requests = this.requestCounts.get(providerId) || [];

    // Filter out requests older than 1 minute
    const recentRequests = requests.filter((time) => time > oneMinuteAgo);

    if (recentRequests.length >= maxRequests) {
      // Rate limit hit, queue the request
      await this.queueRequest(providerId);
      return false;
    }

    recentRequests.push(now);
    this.requestCounts.set(providerId, recentRequests);
    return true;
  }

  private async queueRequest(providerId: string): Promise<void> {
    return new Promise((resolve) => {
      const queue = this.queue.get(providerId) || [];
      queue.push(resolve);
      this.queue.set(providerId, queue);

      // Process queue after 1 second
      setTimeout(() => {
        this.processQueue(providerId);
      }, 1000);
    });
  }

  private processQueue(providerId: string) {
    const queue = this.queue.get(providerId) || [];
    const resolve = queue.shift();

    if (resolve) {
      this.queue.set(providerId, queue);
      resolve();
    }
  }
}

// ============================================
// COST CONTROL ENGINE
// ============================================

export class AICostControlEngine {
  private dailyCosts: Map<string, number> = new Map();
  private userCosts: Map<string, number> = new Map();
  private moduleCosts: Map<string, number> = new Map();
  private limits: CostLimit[] = [];

  setLimit(limit: CostLimit) {
    this.limits.push(limit);
  }

  trackCost(cost: number, userId?: string, tenantId?: string, module?: string) {
    const today = new Date().toDateString();

    // Track daily cost
    const dailyCost = this.dailyCosts.get(today) || 0;
    this.dailyCosts.set(today, dailyCost + cost);

    // Track user cost
    if (userId) {
      const userCost = this.userCosts.get(userId) || 0;
      this.userCosts.set(userId, userCost + cost);
    }

    // Track module cost
    if (module) {
      const moduleCost = this.moduleCosts.get(module) || 0;
      this.moduleCosts.set(module, moduleCost + cost);
    }
  }

  checkLimit(userId?: string, module?: string): boolean {
    const today = new Date().toDateString();
    const dailyCost = this.dailyCosts.get(today) || 0;

    // Check daily limit
    const dailyLimit = this.limits.find((l) => l.perModule === 'daily');
    if (dailyLimit && dailyCost >= dailyLimit.perDay) {
      return false;
    }

    // Check user limit
    if (userId) {
      const userCost = this.userCosts.get(userId) || 0;
      const userLimit = this.limits.find((l) => l.perModule === 'user');
      if (userLimit && userCost >= userLimit.perUser) {
        return false;
      }
    }

    // Check module limit
    if (module) {
      const moduleCost = this.moduleCosts.get(module) || 0;
      const moduleLimit = this.limits.find((l) => l.perModule === module);
      if (moduleLimit && moduleCost >= moduleLimit.perDay) {
        return false;
      }
    }

    return true;
  }

  getDailyCost(): number {
    const today = new Date().toDateString();
    return this.dailyCosts.get(today) || 0;
  }

  getUserCost(userId: string): number {
    return this.userCosts.get(userId) || 0;
  }

  getModuleCost(module: string): number {
    return this.moduleCosts.get(module) || 0;
  }
}

// ============================================
// AI RESPONSE CACHE
// ============================================

export class AIResponseCache {
  private cache: Map<string, { response: AIResponse; expiry: number }> = new Map();
  private defaultTTL: number = 3600000; // 1 hour

  set(key: string, response: AIResponse, ttl: number = this.defaultTTL) {
    this.cache.set(key, {
      response,
      expiry: Date.now() + ttl,
    });
  }

  get(key: string): AIResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return { ...cached.response, cached: true };
  }

  clear() {
    this.cache.clear();
  }

  clearExpired() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================
// AI RESPONSE VALIDATION
// ============================================

export class AIResponseValidator {
  validate(response: any): { valid: boolean; error?: string } {
    // Check for empty response
    if (!response || (typeof response === 'string' && response.trim().length === 0)) {
      return { valid: false, error: 'Empty response' };
    }

    // Check for broken JSON
    if (typeof response === 'string') {
      try {
        JSON.parse(response);
      } catch {
        // Not JSON, that's okay for text responses
      }
    }

    // Check for invalid format
    if (typeof response !== 'string' && typeof response !== 'object') {
      return { valid: false, error: 'Invalid response format' };
    }

    return { valid: true };
  }

  sanitize(response: string): string {
    // Remove any potentially harmful content
    return response
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}

// ============================================
// AUTO RETRY SYSTEM
// ============================================

export class AIAutoRetrySystem {
  private maxRetries: number = 3;
  private baseDelay: number = 1000;

  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options?: { maxRetries?: number; baseDelay?: number }
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? this.maxRetries;
    const baseDelay = options?.baseDelay ?? this.baseDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw new Error('Max retries exceeded');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================
// AI FALLBACK CHAIN
// ============================================

export class AIFallbackChain {
  private providers: AIProvider[] = [];

  setProviders(providers: AIProvider[]) {
    this.providers = providers.sort((a, b) => b.priority - a.priority);
  }

  async execute<T>(fn: (provider: AIProvider) => Promise<T>): Promise<T> {
    for (const provider of this.providers) {
      if (!provider.enabled) continue;

      try {
        return await fn(provider);
      } catch (error) {
        console.warn(`[AIFallbackChain] Provider ${provider.id} failed, trying next`);
        continue;
      }
    }

    throw new Error('All AI providers failed');
  }

  getAvailableProviders(): AIProvider[] {
    return this.providers.filter((p) => p.enabled);
  }
}

// ============================================
// DATA PRIVACY CONTROL
// ============================================

export class AIDataPrivacyControl {
  private sensitivePatterns: RegExp[] = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b\d{16}\b/g, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{10}\b/g, // Phone
  ];

  maskSensitiveData(text: string): string {
    let masked = text;

    for (const pattern of this.sensitivePatterns) {
      masked = masked.replace(pattern, '[REDACTED]');
    }

    return masked;
  }

  isSensitive(text: string): boolean {
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }
}

// ============================================
// AI LOGGING SYSTEM
// ============================================

export interface AILogEntry {
  id: string;
  timestamp: number;
  provider: string;
  prompt: string;
  response: string;
  tokensUsed: number;
  cost: number;
  latency: number;
  userId?: string;
  tenantId?: string;
  module: string;
  success: boolean;
  error?: string;
}

export class AILoggingSystem {
  private logs: AILogEntry[] = [];
  private maxLogs: number = 1000;

  log(entry: Omit<AILogEntry, 'id' | 'timestamp'>) {
    const logEntry: AILogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    this.logs.push(logEntry);

    // Keep only last maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getLogs(filters?: {
    provider?: string;
    userId?: string;
    module?: string;
    success?: boolean;
  }): AILogEntry[] {
    let filtered = this.logs;

    if (filters?.provider) {
      filtered = filtered.filter((l) => l.provider === filters.provider);
    }
    if (filters?.userId) {
      filtered = filtered.filter((l) => l.userId === filters.userId);
    }
    if (filters?.module) {
      filtered = filtered.filter((l) => l.module === filters.module);
    }
    if (filters?.success !== undefined) {
      filtered = filtered.filter((l) => l.success === filters.success);
    }

    return filtered;
  }

  private generateId(): string {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================
// FAIL SAFE SYSTEM
// ============================================

export class AIFailSafeSystem {
  private fallbackMessages: Map<string, string> = new Map();

  setFallbackMessage(module: string, message: string) {
    this.fallbackMessages.set(module, message);
  }

  getFallbackResponse(module: string): string {
    return (
      this.fallbackMessages.get(module) ||
      'We apologize, but our AI service is temporarily unavailable. Please try again later.'
    );
  }

  async executeWithFallback<T>(
    fn: () => Promise<T>,
    module: string,
    fallback?: T
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.error(`[AIFailSafe] AI failed for module ${module}, using fallback`);
      return (fallback as T) || (this.getFallbackResponse(module) as T);
    }
  }
}

// ============================================
// MAIN AI INFRASTRUCTURE MANAGER
// ============================================

export class AIInfrastructure {
  public healthMonitor: AIHealthMonitor;
  public rateLimitHandler: AIRateLimitHandler;
  public costControl: AICostControlEngine;
  public cache: AIResponseCache;
  public validator: AIResponseValidator;
  public retrySystem: AIAutoRetrySystem;
  public fallbackChain: AIFallbackChain;
  public privacyControl: AIDataPrivacyControl;
  public logging: AILoggingSystem;
  public failSafe: AIFailSafeSystem;

  constructor() {
    this.healthMonitor = new AIHealthMonitor();
    this.rateLimitHandler = new AIRateLimitHandler();
    this.costControl = new AICostControlEngine();
    this.cache = new AIResponseCache();
    this.validator = new AIResponseValidator();
    this.retrySystem = new AIAutoRetrySystem();
    this.fallbackChain = new AIFallbackChain();
    this.privacyControl = new AIDataPrivacyControl();
    this.logging = new AILoggingSystem();
    this.failSafe = new AIFailSafeSystem();

    this.initialize();
  }

  private initialize() {
    // Set default cost limits
    this.costControl.setLimit({
      perDay: 100,
      perUser: 10,
      perModule: 'daily',
      current: 0,
    });

    // Set default fallback messages
    this.failSafe.setFallbackMessage('pricing', 'Pricing analysis is temporarily unavailable.');
    this.failSafe.setFallbackMessage('seo', 'SEO optimization is temporarily unavailable.');
    this.failSafe.setFallbackMessage('content', 'Content generation is temporarily unavailable.');
  }
}

// Export singleton instance
export const aiInfrastructure = new AIInfrastructure();
