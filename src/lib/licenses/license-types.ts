// License Management System Types
// Offline + SaaS Hybrid Core - License Data Models

// ============================================
// LICENSE STATUS
// ============================================

export type LicenseStatus = 'active' | 'expired' | 'disabled' | 'revoked';

// ============================================
// DEVICE INFO
// ============================================

export interface DeviceInfo {
  deviceId: string;
  ipAddress?: string;
  osFingerprint: string;
  osVersion?: string;
  browserFingerprint?: string;
  firstActivatedAt: string;
  lastActiveAt: string;
}

// ============================================
// LICENSE
// ============================================

export interface License {
  id: string;
  licenseKey: string; // EVLA-XXXX-XXXX-XXXX format
  productId: string;
  customerId: string;
  planId: string;
  status: LicenseStatus;
  activationLimit: number;
  activationCount: number;
  boundDevices: DeviceInfo[];
  expiresAt: string;
  issuedAt: string;
  lastCheckAt: string;
  offlineToken: string; // Encrypted JWT for offline validation
  tenantId: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// LICENSE GENERATION REQUEST
// ============================================

export interface GenerateLicenseRequest {
  productId: string;
  customerId: string;
  planId: string;
  activationLimit: number;
  expiresAt: string;
  tenantId: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// LICENSE ACTIVATION REQUEST
// ============================================

export interface ActivateLicenseRequest {
  licenseKey: string;
  deviceId: string;
  ipAddress?: string;
  osFingerprint: string;
  osVersion?: string;
  browserFingerprint?: string;
}

// ============================================
// LICENSE ACTIVATION RESULT
// ============================================

export interface ActivationResult {
  success: boolean;
  license: License | null;
  offlineToken: string | null;
  error?: string;
  timestamp: string;
}

// ============================================
// LICENSE VALIDATION RESULT
// ============================================

export interface ValidationResult {
  valid: boolean;
  expired: boolean;
  blocked: boolean;
  license: License | null;
  deviceAllowed: boolean;
  message: string;
  timestamp: string;
}

// ============================================
// LICENSE ANALYTICS
// ============================================

export interface LicenseAnalytics {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  disabledLicenses: number;
  revokedLicenses: number;
  activeRatio: number;
  totalActivations: number;
  averageActivationsPerLicense: number;
  expiringNext7Days: number;
  expiringNext30Days: number;
}

// ============================================
// LICENSE SEARCH FILTERS
// ============================================

export interface LicenseSearchFilters {
  query?: string;
  status?: LicenseStatus;
  productId?: string;
  customerId?: string;
  planId?: string;
  sortBy?: 'licenseKey' | 'expiresAt' | 'issuedAt' | 'activationCount' | 'lastCheckAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================
// LICENSE SEARCH RESULT
// ============================================

export interface LicenseSearchResult {
  licenses: License[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// LICENSE EVENT TYPE
// ============================================

export type LicenseEventType =
  | 'license.created'
  | 'license.generated'
  | 'license.activated'
  | 'license.deactivated'
  | 'license.revoked'
  | 'license.disabled'
  | 'license.enabled'
  | 'license.expired'
  | 'license.extended'
  | 'license.validated';

// ============================================
// LICENSE EVENT
// ============================================

export interface LicenseEvent {
  type: LicenseEventType;
  data: {
    licenseId?: string;
    licenseKey?: string;
    customerId?: string;
    productId?: string;
    deviceId?: string;
    [key: string]: unknown;
  };
  timestamp: string;
  userId?: string;
  tenantId?: string;
}

// ============================================
// LICENSE ACTION RESULT
// ============================================

export interface LicenseActionResult {
  success: boolean;
  license: License | null;
  error?: string;
  timestamp: string;
}
