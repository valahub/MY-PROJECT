// License Actions
// Revoke, disable, reset activations, extend expiry

import type { License, LicenseActionResult } from './license-types';
import { licenseEventEmitter } from './license-events';
import { licenseActivationEngine } from './license-activation';

// ============================================
// LICENSE ACTIONS MANAGER
// ============================================

export class LicenseActionsManager {
  // ============================================
  // REVOKE LICENSE
  // ============================================

  async revokeLicense(license: License, userId: string): Promise<LicenseActionResult> {
    try {
      // Revoke license
      const updatedLicense: License = {
        ...license,
        status: 'revoked',
        lastCheckAt: new Date().toISOString(),
      };

      // Emit event
      await licenseEventEmitter.emitLicenseRevoked(updatedLicense, userId);

      console.log(`[LicenseActions] Revoked license ${license.id}`);

      return {
        success: true,
        license: updatedLicense,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        license: null,
        error: error instanceof Error ? error.message : 'Failed to revoke license',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // DISABLE LICENSE
  // ============================================

  async disableLicense(license: License, userId: string): Promise<LicenseActionResult> {
    try {
      // Disable license
      const updatedLicense: License = {
        ...license,
        status: 'disabled',
        lastCheckAt: new Date().toISOString(),
      };

      // Emit event
      await licenseEventEmitter.emitLicenseDisabled(updatedLicense, userId);

      console.log(`[LicenseActions] Disabled license ${license.id}`);

      return {
        success: true,
        license: updatedLicense,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        license: null,
        error: error instanceof Error ? error.message : 'Failed to disable license',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // ENABLE LICENSE
  // ============================================

  async enableLicense(license: License, userId: string): Promise<LicenseActionResult> {
    try {
      // Enable license
      const updatedLicense: License = {
        ...license,
        status: 'active',
        lastCheckAt: new Date().toISOString(),
      };

      // Emit event
      await licenseEventEmitter.emitLicenseEnabled(updatedLicense, userId);

      console.log(`[LicenseActions] Enabled license ${license.id}`);

      return {
        success: true,
        license: updatedLicense,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        license: null,
        error: error instanceof Error ? error.message : 'Failed to enable license',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // RESET ACTIVATIONS
  // ============================================

  async resetActivations(license: License, userId: string): Promise<LicenseActionResult> {
    try {
      // Reset activations
      licenseActivationEngine.revokeAllDevices(license);

      const updatedLicense: License = {
        ...license,
        boundDevices: [],
        activationCount: 0,
        lastCheckAt: new Date().toISOString(),
      };

      console.log(`[LicenseActions] Reset activations for license ${license.id}`);

      return {
        success: true,
        license: updatedLicense,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        license: null,
        error: error instanceof Error ? error.message : 'Failed to reset activations',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // EXTEND EXPIRY
  // ============================================

  async extendExpiry(license: License, days: number, userId: string): Promise<LicenseActionResult> {
    try {
      // Extend expiry
      const currentExpiry = new Date(license.expiresAt);
      const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);

      const updatedLicense: License = {
        ...license,
        expiresAt: newExpiry.toISOString(),
        lastCheckAt: new Date().toISOString(),
      };

      // Emit event
      await licenseEventEmitter.emitLicenseExtended(updatedLicense, updatedLicense.expiresAt, userId);

      console.log(`[LicenseActions] Extended expiry for license ${license.id} by ${days} days`);

      return {
        success: true,
        license: updatedLicense,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        license: null,
        error: error instanceof Error ? error.message : 'Failed to extend expiry',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // REVOKE DEVICE
  // ============================================

  async revokeDevice(license: License, deviceId: string, userId: string): Promise<LicenseActionResult> {
    try {
      // Revoke device
      const success = licenseActivationEngine.revokeDevice(license, deviceId);

      if (!success) {
        return {
          success: false,
          license: null,
          error: 'Device not found',
          timestamp: new Date().toISOString(),
        };
      }

      const updatedLicense: License = {
        ...license,
        lastCheckAt: new Date().toISOString(),
      };

      console.log(`[LicenseActions] Revoked device ${deviceId} from license ${license.id}`);

      return {
        success: true,
        license: updatedLicense,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        license: null,
        error: error instanceof Error ? error.message : 'Failed to revoke device',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // REGENERATE OFFLINE TOKEN
  // ============================================

  async regenerateOfflineToken(license: License, deviceId: string, userId: string): Promise<LicenseActionResult> {
    try {
      // In production, regenerate offline token
      const { offlineValidationEngine } = await import('./license-offline');
      const newToken = offlineValidationEngine.generateOfflineToken(license, deviceId);

      const updatedLicense: License = {
        ...license,
        offlineToken: newToken,
        lastCheckAt: new Date().toISOString(),
      };

      console.log(`[LicenseActions] Regenerated offline token for license ${license.id}`);

      return {
        success: true,
        license: updatedLicense,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        license: null,
        error: error instanceof Error ? error.message : 'Failed to regenerate offline token',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // UPDATE LICENSE
  // ============================================

  async updateLicense(
    license: License,
    updates: Partial<Omit<License, 'id' | 'licenseKey' | 'createdAt' | 'tenantId'>>,
    userId: string
  ): Promise<LicenseActionResult> {
    try {
      // Update license
      const updatedLicense: License = {
        ...license,
        ...updates,
        lastCheckAt: new Date().toISOString(),
      };

      console.log(`[LicenseActions] Updated license ${license.id}`);

      return {
        success: true,
        license: updatedLicense,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        license: null,
        error: error instanceof Error ? error.message : 'Failed to update license',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // GET LICENSE DEVICES
  // ============================================

  getLicenseDevices(license: License) {
    return licenseActivationEngine.getAllDevices(license);
  }

  // ============================================
  // GET ACTIVATION SUMMARY
  // ============================================

  getActivationSummary(license: License) {
    return licenseActivationEngine.getActivationSummary(license);
  }
}

// Export singleton instance
export const licenseActionsManager = new LicenseActionsManager();

// ============================================
// REACT HOOK FOR LICENSE ACTIONS
// ============================================

import { useState, useCallback } from 'react';

export function useLicenseActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revokeLicense = useCallback(async (license: License, userId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await licenseActionsManager.revokeLicense(license, userId);
      if (!result.success) {
        setError(result.error || 'Failed to revoke license');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke license';
      setError(errorMessage);
      return {
        success: false,
        license: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const disableLicense = useCallback(async (license: License, userId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await licenseActionsManager.disableLicense(license, userId);
      if (!result.success) {
        setError(result.error || 'Failed to disable license');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable license';
      setError(errorMessage);
      return {
        success: false,
        license: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const enableLicense = useCallback(async (license: License, userId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await licenseActionsManager.enableLicense(license, userId);
      if (!result.success) {
        setError(result.error || 'Failed to enable license');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enable license';
      setError(errorMessage);
      return {
        success: false,
        license: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const resetActivations = useCallback(async (license: License, userId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await licenseActionsManager.resetActivations(license, userId);
      if (!result.success) {
        setError(result.error || 'Failed to reset activations');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset activations';
      setError(errorMessage);
      return {
        success: false,
        license: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const extendExpiry = useCallback(async (license: License, days: number, userId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await licenseActionsManager.extendExpiry(license, days, userId);
      if (!result.success) {
        setError(result.error || 'Failed to extend expiry');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to extend expiry';
      setError(errorMessage);
      return {
        success: false,
        license: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const revokeDevice = useCallback(async (license: License, deviceId: string, userId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await licenseActionsManager.revokeDevice(license, deviceId, userId);
      if (!result.success) {
        setError(result.error || 'Failed to revoke device');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke device';
      setError(errorMessage);
      return {
        success: false,
        license: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    error,
    revokeLicense,
    disableLicense,
    enableLicense,
    resetActivations,
    extendExpiry,
    revokeDevice,
    clearError,
  };
}
