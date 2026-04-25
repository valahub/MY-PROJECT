// Download/License Logic
// Product download management with license validation

import { ITEMS } from '../marketplace-data';

export interface LicenseInfo {
  licenseType: 'single' | 'multi' | 'enterprise' | 'commercial';
  downloadLimit: number;
  downloadsUsed: number;
  purchaseRequired: boolean;
  expiresAt?: string;
  licenseKey?: string;
}

export interface DownloadResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
  remainingDownloads?: number;
}

// Product license configuration (in production, from DB)
const productLicenses = new Map<string, LicenseInfo>();

// Initialize default licenses for products
export function initializeProductLicenses(): void {
  ITEMS.forEach((item) => {
    if (!productLicenses.has(item.id)) {
      productLicenses.set(item.id, {
        licenseType: 'single',
        downloadLimit: 5,
        downloadsUsed: 0,
        purchaseRequired: true,
      });
    }
  });
}

// Get license info for a product
export function getLicenseInfo(productId: string): LicenseInfo | null {
  return productLicenses.get(productId) || null;
}

// Check if user can download product
export function canDownload(userId: string, productId: string): {
  allowed: boolean;
  reason?: string;
} {
  const license = getLicenseInfo(productId);
  
  if (!license) {
    return { allowed: false, reason: 'Product not found' };
  }

  if (license.purchaseRequired) {
    // In production, check if user has purchased
    // For now, assume purchase required
    return { allowed: false, reason: 'Purchase required' };
  }

  if (license.downloadLimit > 0 && license.downloadsUsed >= license.downloadLimit) {
    return { allowed: false, reason: 'Download limit exceeded' };
  }

  if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
    return { allowed: false, reason: 'License expired' };
  }

  return { allowed: true };
}

// Record download
export function recordDownload(userId: string, productId: string): void {
  const license = productLicenses.get(productId);
  if (license) {
    license.downloadsUsed++;
    productLicenses.set(productId, license);
  }
}

// Generate download URL
export function generateDownloadUrl(productId: string, userId: string): string {
  const timestamp = Date.now();
  const signature = btoa(`${productId}-${userId}-${timestamp}`);
  return `/api/download/${productId}?token=${signature}&ts=${timestamp}`;
}

// Request download
export async function requestDownload(userId: string, productId: string): Promise<DownloadResponse> {
  const canDownloadResult = canDownload(userId, productId);
  
  if (!canDownloadResult.allowed) {
    return {
      success: false,
      error: canDownloadResult.reason,
    };
  }

  // Record the download
  recordDownload(userId, productId);

  // Generate download URL
  const downloadUrl = generateDownloadUrl(productId, userId);
  const license = getLicenseInfo(productId);

  return {
    success: true,
    downloadUrl,
    remainingDownloads: license ? license.downloadLimit - license.downloadsUsed : 0,
  };
}

// Update license info
export function updateLicenseInfo(productId: string, updates: Partial<LicenseInfo>): void {
  const existing = productLicenses.get(productId);
  if (existing) {
    const updated = { ...existing, ...updates };
    productLicenses.set(productId, updated);
  }
}

// Grant license to user
export function grantLicense(userId: string, productId: string, licenseType: LicenseInfo['licenseType']): void {
  const licenseKey = generateLicenseKey(userId, productId);
  
  updateLicenseInfo(productId, {
    licenseType,
    licenseKey,
    purchaseRequired: false,
  });
}

// Generate license key
export function generateLicenseKey(userId: string, productId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `ERP-${productId.substring(0, 4).toUpperCase()}-${random}-${timestamp}`.toUpperCase();
}

// Validate license key
export function validateLicenseKey(licenseKey: string, productId: string): boolean {
  const license = getLicenseInfo(productId);
  if (!license || !license.licenseKey) return false;
  
  return license.licenseKey === licenseKey;
}

// Get download statistics
export function getDownloadStats(userId: string): {
  totalDownloads: number;
  byProduct: Record<string, number>;
  remainingDownloads: Record<string, number>;
} {
  let totalDownloads = 0;
  const byProduct: Record<string, number> = {};
  const remainingDownloads: Record<string, number> = {};

  productLicenses.forEach((license, productId) => {
    totalDownloads += license.downloadsUsed;
    byProduct[productId] = license.downloadsUsed;
    remainingDownloads[productId] = Math.max(0, license.downloadLimit - license.downloadsUsed);
  });

  return {
    totalDownloads,
    byProduct,
    remainingDownloads,
  };
}

// Reset download count (admin function)
export function resetDownloadCount(productId: string): void {
  const license = productLicenses.get(productId);
  if (license) {
    license.downloadsUsed = 0;
    productLicenses.set(productId, license);
  }
}

// Extend download limit
export function extendDownloadLimit(productId: string, additionalDownloads: number): void {
  const license = productLicenses.get(productId);
  if (license) {
    license.downloadLimit += additionalDownloads;
    productLicenses.set(productId, license);
  }
}

// Check license expiry
export function checkLicenseExpiry(productId: string): {
  expired: boolean;
  daysRemaining?: number;
} {
  const license = getLicenseInfo(productId);
  
  if (!license || !license.expiresAt) {
    return { expired: false };
  }

  const expiryDate = new Date(license.expiresAt);
  const now = new Date();
  const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    expired: expiryDate < now,
    daysRemaining: Math.max(0, daysRemaining),
  };
}

// Set license expiry
export function setLicenseExpiry(productId: string, days: number): void {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  updateLicenseInfo(productId, {
    expiresAt: expiryDate.toISOString(),
  });
}

// Export license data
export function exportLicenseData(): string {
  return JSON.stringify(Array.from(productLicenses.entries()), null, 2);
}

// Import license data
export function importLicenseData(json: string): void {
  const data = JSON.parse(json) as Array<[string, LicenseInfo]>;
  data.forEach(([productId, license]) => {
    productLicenses.set(productId, license);
  });
}

// Clear all licenses
export function clearAllLicenses(): void {
  productLicenses.clear();
}

// Initialize on module load
initializeProductLicenses();
