// Product Version Tracking System
// Version history in DB with update detection

import { ITEMS } from '../marketplace-data';

export interface ProductVersion {
  version: string;
  releasedAt: string;
  changelog: string;
  downloadUrl?: string;
}

export interface VersionHistory {
  productId: string;
  currentVersion: string;
  versions: ProductVersion[];
  updateAvailable: boolean;
  lastChecked: string;
}

// Version history storage (in production, use DB)
const versionHistories = new Map<string, VersionHistory>();

// Get version history for a product
export function getVersionHistory(productId: string): VersionHistory {
  const existing = versionHistories.get(productId);
  
  if (existing) {
    return existing;
  }

  // Initialize version history for product
  const product = ITEMS.find((item) => item.id === productId);
  if (!product) {
    return {
      productId,
      currentVersion: '1.0.0',
      versions: [],
      updateAvailable: false,
      lastChecked: new Date().toISOString(),
    };
  }

  const history: VersionHistory = {
    productId,
    currentVersion: product.version || '1.0.0',
    versions: [
      {
        version: product.version || '1.0.0',
        releasedAt: new Date().toISOString(),
        changelog: 'Initial release',
      },
    ],
    updateAvailable: false,
    lastChecked: new Date().toISOString(),
  };

  versionHistories.set(productId, history);
  return history;
}

// Add new version
export function addVersion(
  productId: string,
  version: string,
  changelog: string,
  downloadUrl?: string
): VersionHistory {
  const history = getVersionHistory(productId);

  const newVersion: ProductVersion = {
    version,
    releasedAt: new Date().toISOString(),
    changelog,
    downloadUrl,
  };

  history.versions.push(newVersion);
  history.currentVersion = version;
  history.lastChecked = new Date().toISOString();
  history.updateAvailable = false;

  versionHistories.set(productId, history);

  // Update product version
  const product = ITEMS.find((item) => item.id === productId);
  if (product) {
    product.version = version;
  }

  return history;
}

// Check for updates
export function checkForUpdates(productId: string): {
  updateAvailable: boolean;
  latestVersion?: string;
  currentVersion: string;
} {
  const history = getVersionHistory(productId);
  const currentVersion = history.currentVersion;

  // In production, this would check against a remote version registry
  // For now, simulate by checking if there's a newer version in history
  const latestVersion = history.versions[history.versions.length - 1].version;
  const updateAvailable = latestVersion !== currentVersion;

  history.updateAvailable = updateAvailable;
  history.lastChecked = new Date().toISOString();
  versionHistories.set(productId, history);

  return {
    updateAvailable,
    latestVersion: updateAvailable ? latestVersion : undefined,
    currentVersion,
  };
}

// Compare versions
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

// Get products with updates available
export function getProductsWithUpdates(): Array<{
  productId: string;
  currentVersion: string;
  latestVersion: string;
}> {
  const results: Array<{
    productId: string;
    currentVersion: string;
    latestVersion: string;
  }> = [];

  versionHistories.forEach((history, productId) => {
    const latestVersion = history.versions[history.versions.length - 1].version;
    if (history.updateAvailable && latestVersion !== history.currentVersion) {
      results.push({
        productId,
        currentVersion: history.currentVersion,
        latestVersion,
      });
    }
  });

  return results;
}

// Get version statistics
export function getVersionStatistics(): {
  totalProducts: number;
  withHistory: number;
  updatesAvailable: number;
  averageVersions: number;
} {
  const totalProducts = ITEMS.length;
  const withHistory = versionHistories.size;
  const updatesAvailable = Array.from(versionHistories.values()).filter(
    (h) => h.updateAvailable
  ).length;

  const totalVersions = Array.from(versionHistories.values()).reduce(
    (sum, h) => sum + h.versions.length,
    0
  );
  const averageVersions = withHistory > 0 ? totalVersions / withHistory : 0;

  return {
    totalProducts,
    withHistory,
    updatesAvailable,
    averageVersions,
  };
}

// Mark version as installed
export function markVersionInstalled(productId: string, version: string): void {
  const history = getVersionHistory(productId);
  history.currentVersion = version;
  history.updateAvailable = false;
  history.lastChecked = new Date().toISOString();
  versionHistories.set(productId, history);

  // Update product version
  const product = ITEMS.find((item) => item.id === productId);
  if (product) {
    product.version = version;
  }
}

// Get update badge HTML
export function getUpdateBadgeHTML(productId: string): string {
  const { updateAvailable, latestVersion } = checkForUpdates(productId);
  
  if (!updateAvailable || !latestVersion) return '';

  return `<span style="background: #ff6b6b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">UPDATED</span>`;
}

// Export version data
export function exportVersionData(): string {
  return JSON.stringify(Array.from(versionHistories.entries()), null, 2);
}

// Import version data
export function importVersionData(json: string): void {
  const data = JSON.parse(json) as Array<[string, VersionHistory]>;
  data.forEach(([productId, history]) => {
    versionHistories.set(productId, history);
  });
}

// Clear all version histories
export function clearAllVersionHistories(): void {
  versionHistories.clear();
}

// Schedule periodic update checks
export function scheduleUpdateChecks(intervalHours: number = 24): number {
  return setInterval(() => {
    ITEMS.forEach((item) => {
      checkForUpdates(item.id);
    });
  }, intervalHours * 60 * 60 * 1000) as unknown as number;
}
