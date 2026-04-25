// AI Security Layer
// Encrypt API keys, restrict usage per role, prevent abuse

export interface APIKeyConfig {
  id: string;
  provider: string;
  encryptedKey: string;
  role: string;
  permissions: string[];
  rateLimit: number;
  createdAt: number;
  lastUsed?: number;
}

// Simple encryption/decryption (in production, use proper crypto library)
function encrypt(text: string): string {
  return btoa(text);
}

function decrypt(encoded: string): string {
  return atob(encoded);
}

export class AISecurityLayer {
  private apiKeys: Map<string, APIKeyConfig> = new Map();
  private rolePermissions: Map<string, string[]> = new Map();

  constructor() {
    this.initializeDefaultRoles();
  }

  private initializeDefaultRoles() {
    this.rolePermissions.set('admin', ['all']);
    this.rolePermissions.set('user', ['read', 'write']);
    this.rolePermissions.set('guest', ['read']);
  }

  registerAPIKey(config: Omit<APIKeyConfig, 'id' | 'createdAt'>): string {
    const id = this.generateId();
    const encryptedKey = encrypt(config.encryptedKey);

    const newConfig: APIKeyConfig = {
      ...config,
      id,
      encryptedKey,
      createdAt: Date.now(),
    };

    this.apiKeys.set(id, newConfig);
    return id;
  }

  getAPIKey(id: string): APIKeyConfig | undefined {
    return this.apiKeys.get(id);
  }

  decryptAPIKey(id: string): string | null {
    const config = this.apiKeys.get(id);
    if (!config) return null;

    return decrypt(config.encryptedKey);
  }

  hasPermission(role: string, permission: string): boolean {
    const permissions = this.rolePermissions.get(role);
    if (!permissions) return false;

    return permissions.includes('all') || permissions.includes(permission);
  }

  checkRateLimit(id: string, currentUsage: number): boolean {
    const config = this.apiKeys.get(id);
    if (!config) return false;

    return currentUsage < config.rateLimit;
  }

  updateLastUsed(id: string) {
    const config = this.apiKeys.get(id);
    if (config) {
      config.lastUsed = Date.now();
    }
  }

  revokeAPIKey(id: string): boolean {
    return this.apiKeys.delete(id);
  }

  private generateId(): string {
    return `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiSecurityLayer = new AISecurityLayer();
