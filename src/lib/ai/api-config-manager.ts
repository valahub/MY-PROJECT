// AI API Config Manager
// Manage API configurations, storage, and encryption

import { allAIAPIs, type AIAPIConfig } from './api-configurations';
import { aiSecurityLayer } from './security-layer';
import { aiPluginManager } from './plugin-manager';

export interface StoredAPIConfig extends AIAPIConfig {
  encryptedKey?: string;
  lastUpdated: number;
}

export class AIAPIConfigManager {
  private configs: Map<string, StoredAPIConfig> = new Map();
  private storageKey: string = 'ai-api-configs';

  constructor() {
    this.loadFromStorage();
    this.registerWithPluginManager();
  }

  // Save API configuration
  saveConfig(config: Omit<StoredAPIConfig, 'id' | 'lastUpdated'> & { id?: string }): string {
    const id = config.id || this.generateId();
    const { id: _id, ...configWithoutId } = config;
    const storedConfig: StoredAPIConfig = {
      ...configWithoutId,
      id,
      lastUpdated: Date.now(),
    };

    this.configs.set(id, storedConfig);
    this.saveToStorage();

    // Register with security layer if API key is provided
    if (config.apiKey) {
      aiSecurityLayer.registerAPIKey({
        provider: id,
        encryptedKey: config.apiKey,
        role: 'user',
        permissions: ['read', 'write'],
        rateLimit: 1000,
      });
    }

    return id;
  }

  // Get API configuration
  getConfig(id: string): StoredAPIConfig | undefined {
    return this.configs.get(id);
  }

  // Get all configurations
  getAllConfigs(): StoredAPIConfig[] {
    return Array.from(this.configs.values());
  }

  // Get configurations by type
  getConfigsByType(type: AIAPIConfig['type']): StoredAPIConfig[] {
    return Array.from(this.configs.values()).filter((c) => c.type === type);
  }

  // Update API configuration
  updateConfig(id: string, updates: Partial<StoredAPIConfig>): boolean {
    const config = this.configs.get(id);
    if (!config) return false;

    const updated: StoredAPIConfig = {
      ...config,
      ...updates,
      lastUpdated: Date.now(),
    };

    this.configs.set(id, updated);
    this.saveToStorage();
    return true;
  }

  // Delete API configuration
  deleteConfig(id: string): boolean {
    const deleted = this.configs.delete(id);
    if (deleted) {
      this.saveToStorage();
      aiSecurityLayer.revokeAPIKey(id);
    }
    return deleted;
  }

  // Enable/disable API
  setAPIStatus(id: string, status: 'active' | 'inactive'): boolean {
    return this.updateConfig(id, { status });
  }

  // Update API key
  updateAPIKey(id: string, apiKey: string): boolean {
    const success = this.updateConfig(id, { apiKey });
    if (success) {
      aiSecurityLayer.registerAPIKey({
        provider: id,
        encryptedKey: apiKey,
        role: 'user',
        permissions: ['read', 'write'],
        rateLimit: 1000,
      });
    }
    return success;
  }

  // Get decrypted API key
  getDecryptedKey(id: string): string | null {
    const config = this.configs.get(id);
    if (!config || !config.apiKey) return null;

    return aiSecurityLayer.decryptAPIKey(id);
  }

  // Validate API configuration
  validateConfig(config: Partial<AIAPIConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!config.type) {
      errors.push('Type is required');
    }

    if (!config.apiUrl || config.apiUrl.trim().length === 0) {
      errors.push('API URL is required');
    }

    if (config.fallbackPriority === undefined || config.fallbackPriority < 1) {
      errors.push('Fallback priority must be at least 1');
    }

    if (!config.status || !['active', 'inactive'].includes(config.status)) {
      errors.push('Status must be active or inactive');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Import configurations from array
  importConfigs(configs: Partial<AIAPIConfig>[]): { success: number; failed: number } {
    let success = 0;
    let failed = 0;

    for (const config of configs) {
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        failed++;
        continue;
      }

      try {
        this.saveConfig(config as Omit<StoredAPIConfig, 'id' | 'lastUpdated'>);
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }

  // Export configurations to array
  exportConfigs(): Partial<AIAPIConfig>[] {
    return Array.from(this.configs.values()).map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      apiUrl: c.apiUrl,
      fallbackPriority: c.fallbackPriority,
      status: c.status,
      usageLimit: c.usageLimit,
      costPerRequest: c.costPerRequest,
      description: c.description,
      // Exclude API key for security
    }));
  }

  // Reset to default configurations
  resetToDefaults() {
    this.configs.clear();
    allAIAPIs.forEach((api) => {
      this.configs.set(api.id, {
        ...api,
        lastUpdated: Date.now(),
      });
    });
    this.saveToStorage();
  }

  // Get configuration statistics
  getStats() {
    const configs = Array.from(this.configs.values());
    const byType: Record<string, number> = {};
    const activeCount = configs.filter((c) => c.status === 'active').length;
    const inactiveCount = configs.filter((c) => c.status === 'inactive').length;

    configs.forEach((c) => {
      byType[c.type] = (byType[c.type] || 0) + 1;
    });

    return {
      total: configs.length,
      active: activeCount,
      inactive: inactiveCount,
      byType,
    };
  }

  // Save to local storage
  private saveToStorage() {
    if (typeof window === 'undefined') return;

    try {
      const data = Array.from(this.configs.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('[AIAPIConfigManager] Failed to save to storage:', error);
    }
  }

  // Load from local storage
  private loadFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.configs = new Map(parsed);
      } else {
        // Initialize with default configs
        this.resetToDefaults();
      }
    } catch (error) {
      console.error('[AIAPIConfigManager] Failed to load from storage:', error);
      this.resetToDefaults();
    }
  }

  // Register with plugin manager
  private registerWithPluginManager() {
    allAIAPIs.forEach((api) => {
      aiPluginManager.registerPlugin({
        name: api.name,
        type: this.mapTypeToPluginType(api.type),
        provider: api.id,
        enabled: api.status === 'active',
        priority: api.fallbackPriority,
        config: {},
      });
    });
  }

  private mapTypeToPluginType(type: AIAPIConfig['type']): 'llm' | 'image' | 'audio' | 'translation' | 'analysis' {
    switch (type) {
      case 'text':
      case 'chat':
      case 'coding':
        return 'llm';
      case 'image':
        return 'image';
      case 'voice':
        return 'audio';
      case 'translation':
        return 'translation';
      case 'seo':
      case 'analytics':
      case 'trend':
        return 'analysis';
      default:
        return 'llm';
    }
  }

  private generateId(): string {
    return `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiAPIConfigManager = new AIAPIConfigManager();
