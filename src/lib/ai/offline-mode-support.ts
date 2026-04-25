// Offline Mode Support
// Use cached data or local AI when no internet

export class OfflineModeSupport {
  private isOnline: boolean = true;
  private offlineCache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheExpiry: number = 86400000; // 24 hours

  constructor() {
    this.initializeNetworkMonitoring();
  }

  private initializeNetworkMonitoring() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        console.log('[OfflineMode] Back online');
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        console.log('[OfflineMode] Gone offline');
      });

      this.isOnline = navigator.onLine;
    }
  }

  isAvailable(): boolean {
    return this.isOnline;
  }

  setOfflineCache(key: string, data: any) {
    this.offlineCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  getOfflineCache(key: string): any | null {
    const cached = this.offlineCache.get(key);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.offlineCache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearOfflineCache() {
    this.offlineCache.clear();
  }

  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.offlineCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.offlineCache.delete(key);
      }
    }
  }

  async executeWithOfflineFallback<T>(
    onlineFn: () => Promise<T>,
    offlineFn: () => T,
    cacheKey?: string
  ): Promise<T> {
    if (this.isOnline) {
      try {
        const result = await onlineFn();
        if (cacheKey) {
          this.setOfflineCache(cacheKey, result);
        }
        return result;
      } catch (error) {
        console.warn('[OfflineMode] Online request failed, trying offline');
        // Fall through to offline
      }
    }

    // Try offline cache first
    if (cacheKey) {
      const cached = this.getOfflineCache(cacheKey);
      if (cached) {
        return cached as T;
      }
    }

    // Use offline function
    return offlineFn();
  }
}

// Export singleton instance
export const offlineModeSupport = new OfflineModeSupport();
