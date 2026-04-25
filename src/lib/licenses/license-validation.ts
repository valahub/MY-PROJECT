// License Validation Endpoint
// Validates license_key + device_id combination

import type { License, ValidationResult } from './license-types';
import { licenseAPI } from './license-api';
import { licenseActivationEngine } from './license-activation';

// ============================================
// LICENSE VALIDATION ENGINE
// ============================================

export class LicenseValidationEngine {
  // ============================================
  // VALIDATE LICENSE
  // ============================================

  async validateLicense(licenseKey: string, deviceId: string): Promise<ValidationResult> {
    try {
      // Validate license format
      if (!this.validateLicenseKeyFormat(licenseKey)) {
        return {
          valid: false,
          expired: false,
          blocked: true,
          license: null,
          deviceAllowed: false,
          message: 'Invalid license key format',
          timestamp: new Date().toISOString(),
        };
      }

      // Call API to validate
      const result = await licenseAPI.validateLicense(licenseKey, deviceId);

      return result;
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
  // VALIDATE LICENSE KEY FORMAT
  // ============================================

  private validateLicenseKeyFormat(licenseKey: string): boolean {
    const pattern = /^EVLA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-F0-9]{2}$/;
    return pattern.test(licenseKey);
  }

  // ============================================
  // VALIDATE OFFLINE TOKEN
  // ============================================

  async validateOfflineToken(encryptedToken: string, deviceId: string): Promise<ValidationResult> {
    try {
      const { offlineValidationEngine } = await import('./license-offline');
      const result = offlineValidationEngine.validateOfflineToken(encryptedToken, deviceId);

      if (!result.valid || !result.payload) {
        return {
          valid: false,
          expired: result.expired,
          blocked: true,
          license: null,
          deviceAllowed: false,
          message: result.expired ? 'License has expired' : 'Invalid offline token',
          timestamp: new Date().toISOString(),
        };
      }

      // Get license from API
      const licenseResult = await licenseAPI.getLicense(result.payload.licenseId);

      if (!licenseResult.success || !licenseResult.data) {
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

      const license = licenseResult.data;

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
        message: error instanceof Error ? error.message : 'Failed to validate offline token',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // BATCH VALIDATE LICENSES
  // ============================================

  async batchValidateLicenses(validations: Array<{ licenseKey: string; deviceId: string }>): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    for (const validation of validations) {
      const key = `${validation.licenseKey}:${validation.deviceId}`;
      const result = await this.validateLicense(validation.licenseKey, validation.deviceId);
      results.set(key, result);
    }

    return results;
  }

  // ============================================
  // GET VALIDATION SUMMARY
  // ============================================

  getValidationSummary(results: Map<string, ValidationResult>): {
    totalValidations: number;
    validCount: number;
    invalidCount: number;
    expiredCount: number;
    blockedCount: number;
  } {
    let validCount = 0;
    let invalidCount = 0;
    let expiredCount = 0;
    let blockedCount = 0;

    for (const result of results.values()) {
      if (result.valid) {
        validCount++;
      } else {
        invalidCount++;
      }

      if (result.expired) {
        expiredCount++;
      }

      if (result.blocked) {
        blockedCount++;
      }
    }

    return {
      totalValidations: results.size,
      validCount,
      invalidCount,
      expiredCount,
      blockedCount,
    };
  }
}

// Export singleton instance
export const licenseValidationEngine = new LicenseValidationEngine();

// ============================================
// REACT HOOK FOR LICENSE VALIDATION
// ============================================

import { useState, useCallback } from 'react';

export function useLicenseValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateLicense = useCallback(async (licenseKey: string, deviceId: string) => {
    setIsValidating(true);
    setError(null);

    try {
      const result = await licenseValidationEngine.validateLicense(licenseKey, deviceId);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate license';
      setError(errorMessage);
      return {
        valid: false,
        expired: false,
        blocked: true,
        license: null,
        deviceAllowed: false,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateOfflineToken = useCallback(async (encryptedToken: string, deviceId: string) => {
    setIsValidating(true);
    setError(null);

    try {
      const result = await licenseValidationEngine.validateOfflineToken(encryptedToken, deviceId);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate offline token';
      setError(errorMessage);
      return {
        valid: false,
        expired: false,
        blocked: true,
        license: null,
        deviceAllowed: false,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isValidating,
    error,
    validateLicense,
    validateOfflineToken,
    clearError,
  };
}
