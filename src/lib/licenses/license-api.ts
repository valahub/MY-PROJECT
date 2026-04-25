// License API Client
// Zod validation for license API requests/responses

import type { License, GenerateLicenseRequest, ActivateLicenseRequest, ActivationResult, ValidationResult, LicenseSearchFilters, LicenseSearchResult, LicenseAnalytics, LicenseActionResult } from './license-types';
import { licenseKeyGenerator } from './license-generator';
import { licenseActivationEngine } from './license-activation';
import { offlineValidationEngine } from './license-offline';
import { licenseSelfHealingEngine } from './license-self-heal';

// ============================================
// LICENSE API CLIENT
// ============================================

export class LicenseAPI {
  private licenses: Map<string, License> = new Map();

  // ============================================
  // GET ALL LICENSES
  // ============================================

  async getAllLicenses(tenantId: string): Promise<{
    success: boolean;
    data: License[] | null;
    error: string | null;
  }> {
    try {
      const licenses = Array.from(this.licenses.values()).filter((l) => l.tenantId === tenantId);
      return {
        success: true,
        data: licenses,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch licenses',
      };
    }
  }

  // ============================================
  // GET LICENSE BY ID
  // ============================================

  async getLicense(licenseId: string): Promise<{
    success: boolean;
    data: License | null;
    error: string | null;
  }> {
    try {
      const license = this.licenses.get(licenseId);
      if (!license) {
        return {
          success: false,
          data: null,
          error: 'License not found',
        };
      }

      return {
        success: true,
        data: license,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch license',
      };
    }
  }

  // ============================================
  // GENERATE LICENSE
  // ============================================

  async generateLicense(request: GenerateLicenseRequest): Promise<{
    success: boolean;
    data: License | null;
    error: string | null;
  }> {
    try {
      // Generate license
      const license = licenseKeyGenerator.generateLicense(request);

      // Generate offline token
      const offlineToken = offlineValidationEngine.generateOfflineToken(license, 'INITIAL');
      license.offlineToken = offlineToken;

      // Store license
      this.licenses.set(license.id, license);
      licenseActivationEngine.registerLicense(license);
      licenseSelfHealingEngine.registerLicense(license);

      console.log(`[LicenseAPI] Generated license ${license.id}`);

      return {
        success: true,
        data: license,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to generate license',
      };
    }
  }

  // ============================================
  // ACTIVATE LICENSE
  // ============================================

  async activateLicense(request: ActivateLicenseRequest): Promise<ActivationResult> {
    try {
      // Find license by key
      const license = Array.from(this.licenses.values()).find((l) => l.licenseKey === request.licenseKey);
      if (!license) {
        return {
          success: false,
          license: null,
          offlineToken: null,
          error: 'License not found',
          timestamp: new Date().toISOString(),
        };
      }

      // Activate license
      const result = await licenseActivationEngine.activate(request, license);

      // Update stored license
      if (result.success && result.license) {
        this.licenses.set(license.id, result.license);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        license: null,
        offlineToken: null,
        error: error instanceof Error ? error.message : 'Failed to activate license',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // DEACTIVATE LICENSE
  // ============================================

  async deactivateLicense(licenseId: string, deviceId: string): Promise<ActivationResult> {
    try {
      const result = await licenseActivationEngine.deactivate(licenseId, deviceId);

      // Update stored license
      if (result.success && result.license) {
        this.licenses.set(licenseId, result.license);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        license: null,
        offlineToken: null,
        error: error instanceof Error ? error.message : 'Failed to deactivate license',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // VALIDATE LICENSE
  // ============================================

  async validateLicense(licenseKey: string, deviceId: string): Promise<ValidationResult> {
    try {
      // Find license by key
      const license = Array.from(this.licenses.values()).find((l) => l.licenseKey === licenseKey);
      if (!license) {
        return {
          valid: false,
          expired: false,
          blocked: true,
          license: null,
          deviceAllowed: false,
          message: 'License not found',
          timestamp: new Date().toISOString(),
        };
      }

      // Check status
      if (license.status === 'disabled' || license.status === 'revoked') {
        return {
          valid: false,
          expired: false,
          blocked: true,
          license,
          deviceAllowed: false,
          message: `License is ${license.status}`,
          timestamp: new Date().toISOString(),
        };
      }

      // Check expiry
      const now = new Date();
      const expiresAt = new Date(license.expiresAt);
      const expired = now > expiresAt;

      if (expired) {
        return {
          valid: false,
          expired: true,
          blocked: false,
          license,
          deviceAllowed: false,
          message: 'License has expired',
          timestamp: new Date().toISOString(),
        };
      }

      // Check device
      const deviceAllowed = licenseActivationEngine.validateDevice(license, deviceId);

      // Update last check time
      license.lastCheckAt = new Date().toISOString();
      this.licenses.set(license.id, license);

      return {
        valid: true,
        expired: false,
        blocked: false,
        license,
        deviceAllowed,
        message: 'License is valid',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        valid: false,
        expired: false,
        blocked: true,
        license: null,
        deviceAllowed: false,
        message: error instanceof Error ? error.message : 'Failed to validate license',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // SEARCH LICENSES
  // ============================================

  async searchLicenses(filters: LicenseSearchFilters, tenantId: string): Promise<{
    success: boolean;
    data: LicenseSearchResult | null;
    error: string | null;
  }> {
    try {
      let licenses = Array.from(this.licenses.values()).filter((l) => l.tenantId === tenantId);

      // Text search
      if (filters.query) {
        const query = filters.query.toLowerCase();
        licenses = licenses.filter((l) =>
          l.licenseKey.toLowerCase().includes(query) ||
          l.productId.toLowerCase().includes(query) ||
          l.customerId.toLowerCase().includes(query)
        );
      }

      // Status filter
      if (filters.status) {
        licenses = licenses.filter((l) => l.status === filters.status);
      }

      // Product filter
      if (filters.productId) {
        licenses = licenses.filter((l) => l.productId === filters.productId);
      }

      // Customer filter
      if (filters.customerId) {
        licenses = licenses.filter((l) => l.customerId === filters.customerId);
      }

      // Sort
      if (filters.sortBy) {
        licenses = this.sortLicenses(licenses, filters.sortBy, filters.sortOrder || 'desc');
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const total = licenses.length;
      const totalPages = Math.ceil(total / limit);

      const startIndex = (page - 1) * limit;
      const paginated = licenses.slice(startIndex, startIndex + limit);

      const result: LicenseSearchResult = {
        licenses: paginated,
        total,
        page,
        limit,
        totalPages,
      };

      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to search licenses',
      };
    }
  }

  // ============================================
  // SORT LICENSES
  // ============================================

  private sortLicenses(licenses: License[], sortBy: string, sortOrder: 'asc' | 'desc'): License[] {
    const sorted = [...licenses];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'licenseKey':
          comparison = a.licenseKey.localeCompare(b.licenseKey);
          break;
        case 'expiresAt':
          comparison = new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
          break;
        case 'issuedAt':
          comparison = new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
          break;
        case 'activationCount':
          comparison = a.activationCount - b.activationCount;
          break;
        case 'lastCheckAt':
          comparison = new Date(a.lastCheckAt).getTime() - new Date(b.lastCheckAt).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  // ============================================
  // GET ANALYTICS
  // ============================================

  async getAnalytics(tenantId: string): Promise<{
    success: boolean;
    data: LicenseAnalytics | null;
    error: string | null;
  }> {
    try {
      const licenses = Array.from(this.licenses.values()).filter((l) => l.tenantId === tenantId);

      const totalLicenses = licenses.length;
      const activeLicenses = licenses.filter((l) => l.status === 'active').length;
      const expiredLicenses = licenses.filter((l) => l.status === 'expired').length;
      const disabledLicenses = licenses.filter((l) => l.status === 'disabled').length;
      const revokedLicenses = licenses.filter((l) => l.status === 'revoked').length;
      const activeRatio = totalLicenses > 0 ? (activeLicenses / totalLicenses) * 100 : 0;
      const totalActivations = licenses.reduce((sum, l) => sum + l.activationCount, 0);
      const averageActivationsPerLicense = totalLicenses > 0 ? totalActivations / totalLicenses : 0;

      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const expiringNext7Days = licenses.filter((l) => {
        const expiresAt = new Date(l.expiresAt);
        return l.status === 'active' && expiresAt <= sevenDaysFromNow && expiresAt > now;
      }).length;

      const expiringNext30Days = licenses.filter((l) => {
        const expiresAt = new Date(l.expiresAt);
        return l.status === 'active' && expiresAt <= thirtyDaysFromNow && expiresAt > now;
      }).length;

      const analytics: LicenseAnalytics = {
        totalLicenses,
        activeLicenses,
        expiredLicenses,
        disabledLicenses,
        revokedLicenses,
        activeRatio,
        totalActivations,
        averageActivationsPerLicense,
        expiringNext7Days,
        expiringNext30Days,
      };

      return {
        success: true,
        data: analytics,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      };
    }
  }

  // ============================================
  // DELETE LICENSE
  // ============================================

  async deleteLicense(licenseId: string): Promise<{
    success: boolean;
    data: License | null;
    error: string | null;
  }> {
    try {
      const license = this.licenses.get(licenseId);
      if (!license) {
        return {
          success: false,
          data: null,
          error: 'License not found',
        };
      }

      this.licenses.delete(licenseId);
      licenseActivationEngine.unregisterLicense(licenseId);
      licenseSelfHealingEngine.unregisterLicense(licenseId);

      console.log(`[LicenseAPI] Deleted license ${licenseId}`);

      return {
        success: true,
        data: license,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete license',
      };
    }
  }

  // ============================================
  // GENERATE MOCK LICENSES
  // ============================================

  generateMockLicenses(count: number, tenantId: string): License[] {
    const licenses: License[] = [];

    for (let i = 0; i < count; i++) {
      const request: GenerateLicenseRequest = {
        productId: `prod_${i % 3}`,
        customerId: `cust_${i % 5}`,
        planId: `plan_${i % 2}`,
        activationLimit: 1 + (i % 5),
        expiresAt: new Date(Date.now() + (30 + i * 10) * 24 * 60 * 60 * 1000).toISOString(),
        tenantId,
      };

      const license = licenseKeyGenerator.generateLicense(request);
      const offlineToken = offlineValidationEngine.generateOfflineToken(license, `dev_${i}`);
      license.offlineToken = offlineToken;

      this.licenses.set(license.id, license);
      licenses.push(license);
    }

    return licenses;
  }
}

// Export singleton instance
export const licenseAPI = new LicenseAPI();

// Export mock data generator
export const generateMockLicenses = (count: number, tenantId: string) => licenseAPI.generateMockLicenses(count, tenantId);
