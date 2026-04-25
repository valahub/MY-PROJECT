// AI Multi-Tenant Support
// Different API config per user/company, isolation between tenants

export interface TenantConfig {
  id: string;
  name: string;
  apiKeys: Map<string, string>;
  costLimits: {
    daily: number;
    monthly: number;
  };
  enabledProviders: string[];
  customSettings: Record<string, any>;
}

export class AIMultiTenantSupport {
  private tenantConfigs: Map<string, TenantConfig> = new Map();
  private currentCosts: Map<string, { daily: number; monthly: number }> = new Map();

  registerTenant(config: Omit<TenantConfig, 'id'>): string {
    const id = this.generateId();
    const apiKeysMap = new Map<string, string>();
    
    if (config.apiKeys instanceof Map) {
      config.apiKeys.forEach((value, key) => apiKeysMap.set(key, value));
    } else {
      Object.entries(config.apiKeys as Record<string, string>).forEach(([key, value]) => {
        apiKeysMap.set(key, value);
      });
    }

    const newConfig: TenantConfig = {
      ...config,
      id,
      apiKeys: apiKeysMap,
    };

    this.tenantConfigs.set(id, newConfig);
    this.currentCosts.set(id, { daily: 0, monthly: 0 });

    return id;
  }

  getTenantConfig(tenantId: string): TenantConfig | undefined {
    return this.tenantConfigs.get(tenantId);
  }

  getAPIKey(tenantId: string, provider: string): string | undefined {
    const config = this.tenantConfigs.get(tenantId);
    return config?.apiKeys.get(provider);
  }

  setAPIKey(tenantId: string, provider: string, key: string): boolean {
    const config = this.tenantConfigs.get(tenantId);
    if (!config) return false;

    config.apiKeys.set(provider, key);
    return true;
  }

  checkCostLimit(tenantId: string, cost: number): boolean {
    const config = this.tenantConfigs.get(tenantId);
    if (!config) return false;

    const current = this.currentCosts.get(tenantId) || { daily: 0, monthly: 0 };

    return current.daily + cost <= config.costLimits.daily &&
           current.monthly + cost <= config.costLimits.monthly;
  }

  trackCost(tenantId: string, cost: number) {
    const current = this.currentCosts.get(tenantId) || { daily: 0, monthly: 0 };
    this.currentCosts.set(tenantId, {
      daily: current.daily + cost,
      monthly: current.monthly + cost,
    });
  }

  resetDailyCosts() {
    const today = new Date().toDateString();
    // In production, store last reset date and only reset if new day
    for (const [tenantId, costs] of this.currentCosts.entries()) {
      this.currentCosts.set(tenantId, { daily: 0, monthly: costs.monthly });
    }
  }

  resetMonthlyCosts() {
    const currentMonth = new Date().getMonth();
    // In production, store last reset month and only reset if new month
    for (const [tenantId] of this.currentCosts.entries()) {
      this.currentCosts.set(tenantId, { daily: 0, monthly: 0 });
    }
  }

  isProviderEnabled(tenantId: string, provider: string): boolean {
    const config = this.tenantConfigs.get(tenantId);
    return config?.enabledProviders.includes(provider) ?? false;
  }

  updateCustomSettings(tenantId: string, settings: Record<string, any>): boolean {
    const config = this.tenantConfigs.get(tenantId);
    if (!config) return false;

    config.customSettings = { ...config.customSettings, ...settings };
    return true;
  }

  private generateId(): string {
    return `tenant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiMultiTenantSupport = new AIMultiTenantSupport();
