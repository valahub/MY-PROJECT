// License Activation & Device Binding System
// Device ID, IP, OS fingerprint capture and validation

import type { License, DeviceInfo, ActivateLicenseRequest, ActivationResult } from './license-types';

// ============================================
// LICENSE ACTIVATION ENGINE
// ============================================

export class LicenseActivationEngine {
  private licenses: Map<string, License> = new Map();

  // ============================================
  // ACTIVATE LICENSE
  // ============================================

  async activate(request: ActivateLicenseRequest, license: License): Promise<ActivationResult> {
    // Check if license is active and not expired
    if (license.status !== 'active') {
      return {
        success: false,
        license: null,
        offlineToken: null,
        error: `License is ${license.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    // Check if expired
    if (new Date(license.expiresAt) < new Date()) {
      return {
        success: false,
        license: null,
        offlineToken: null,
        error: 'License has expired',
        timestamp: new Date().toISOString(),
      };
    }

    // Check activation limit
    if (license.activationCount >= license.activationLimit) {
      return {
        success: false,
        license: null,
        offlineToken: null,
        error: 'Activation limit reached',
        timestamp: new Date().toISOString(),
      };
    }

    // Check if device already bound
    const existingDevice = license.boundDevices.find((d) => d.deviceId === request.deviceId);
    if (existingDevice) {
      // Update last active time
      existingDevice.lastActiveAt = new Date().toISOString();
      license.lastCheckAt = new Date().toISOString();

      return {
        success: true,
        license,
        offlineToken: license.offlineToken,
        timestamp: new Date().toISOString(),
      };
    }

    // Create new device binding
    const deviceInfo: DeviceInfo = {
      deviceId: request.deviceId,
      ipAddress: request.ipAddress,
      osFingerprint: request.osFingerprint,
      osVersion: request.osVersion,
      browserFingerprint: request.browserFingerprint,
      firstActivatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    // Add device to license
    license.boundDevices.push(deviceInfo);
    license.activationCount++;
    license.lastCheckAt = new Date().toISOString();

    console.log(`[LicenseActivation] Activated license ${license.id} for device ${request.deviceId}`);

    return {
      success: true,
      license,
      offlineToken: license.offlineToken,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // DEACTIVATE LICENSE
  // ============================================

  async deactivate(licenseId: string, deviceId: string): Promise<ActivationResult> {
    const license = this.licenses.get(licenseId);
    if (!license) {
      return {
        success: false,
        license: null,
        offlineToken: null,
        error: 'License not found',
        timestamp: new Date().toISOString(),
      };
    }

    // Find and remove device
    const deviceIndex = license.boundDevices.findIndex((d) => d.deviceId === deviceId);
    if (deviceIndex === -1) {
      return {
        success: false,
        license: null,
        offlineToken: null,
        error: 'Device not found',
        timestamp: new Date().toISOString(),
      };
    }

    license.boundDevices.splice(deviceIndex, 1);
    license.activationCount = Math.max(0, license.activationCount - 1);
    license.lastCheckAt = new Date().toISOString();

    console.log(`[LicenseActivation] Deactivated license ${licenseId} for device ${deviceId}`);

    return {
      success: true,
      license,
      offlineToken: null,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // GET DEVICE FINGERPRINT
  // ============================================

  generateDeviceFingerprint(): string {
    // In production, this would collect actual device information
    // For now, generate a mock fingerprint
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `dev_${timestamp}_${random}`;
  }

  // ============================================
  // GET OS FINGERPRINT
  // ============================================

  getOSFingerprint(userAgent?: string): string {
    // In production, this would parse user agent string
    // For now, return a mock fingerprint
    if (!userAgent) return 'unknown';

    if (userAgent.includes('Windows')) return 'windows';
    if (userAgent.includes('Mac')) return 'macos';
    if (userAgent.includes('Linux')) return 'linux';
    if (userAgent.includes('Android')) return 'android';
    if (userAgent.includes('iOS')) return 'ios';

    return 'unknown';
  }

  // ============================================
  // GET BROWSER FINGERPRINT
  // ============================================

  getBrowserFingerprint(userAgent?: string): string {
    // In production, this would parse user agent string
    // For now, return a mock fingerprint
    if (!userAgent) return 'unknown';

    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';

    return 'unknown';
  }

  // ============================================
  // VALIDATE DEVICE
  // ============================================

  validateDevice(license: License, deviceId: string): boolean {
    return license.boundDevices.some((d) => d.deviceId === deviceId);
  }

  // ============================================
  // GET DEVICE INFO
  // ============================================

  getDeviceInfo(license: License, deviceId: string): DeviceInfo | null {
    return license.boundDevices.find((d) => d.deviceId === deviceId) || null;
  }

  // ============================================
  // GET ALL DEVICES
  // ============================================

  getAllDevices(license: License): DeviceInfo[] {
    return license.boundDevices;
  }

  // ============================================
  // REVOKE DEVICE
  // ============================================

  revokeDevice(license: License, deviceId: string): boolean {
    const deviceIndex = license.boundDevices.findIndex((d) => d.deviceId === deviceId);
    if (deviceIndex === -1) return false;

    license.boundDevices.splice(deviceIndex, 1);
    license.activationCount = Math.max(0, license.activationCount - 1);

    console.log(`[LicenseActivation] Revoked device ${deviceId} from license ${license.id}`);

    return true;
  }

  // ============================================
  // REVOKE ALL DEVICES
  // ============================================

  revokeAllDevices(license: License): void {
    license.boundDevices = [];
    license.activationCount = 0;

    console.log(`[LicenseActivation] Revoked all devices from license ${license.id}`);
  }

  // ============================================
  // UPDATE DEVICE ACTIVITY
  // ============================================

  updateDeviceActivity(license: License, deviceId: string): boolean {
    const device = license.boundDevices.find((d) => d.deviceId === deviceId);
    if (!device) return false;

    device.lastActiveAt = new Date().toISOString();
    license.lastCheckAt = new Date().toISOString();

    return true;
  }

  // ============================================
  // GET ACTIVATION SUMMARY
  // ============================================

  getActivationSummary(license: License): {
    totalActivations: number;
    activationLimit: number;
    remainingActivations: number;
    devices: DeviceInfo[];
  } {
    return {
      totalActivations: license.activationCount,
      activationLimit: license.activationLimit,
      remainingActivations: Math.max(0, license.activationLimit - license.activationCount),
      devices: license.boundDevices,
    };
  }

  // ============================================
  // REGISTER LICENSE
  // ============================================

  registerLicense(license: License): void {
    this.licenses.set(license.id, license);
  }

  // ============================================
  // UNREGISTER LICENSE
  // ============================================

  unregisterLicense(licenseId: string): void {
    this.licenses.delete(licenseId);
  }

  // ============================================
  // GET LICENSE
  // ============================================

  getLicense(licenseId: string): License | null {
    return this.licenses.get(licenseId) || null;
  }
}

// Export singleton instance
export const licenseActivationEngine = new LicenseActivationEngine();

// ============================================
// REACT HOOK FOR LICENSE ACTIVATION
// ============================================

import { useState, useCallback } from 'react';

export function useLicenseActivation() {
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activate = useCallback(async (request: ActivateLicenseRequest, license: License) => {
    setIsActivating(true);
    setError(null);

    try {
      const result = await licenseActivationEngine.activate(request, license);
      if (!result.success) {
        setError(result.error || 'Failed to activate license');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate license';
      setError(errorMessage);
      return {
        success: false,
        license: null,
        offlineToken: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsActivating(false);
    }
  }, []);

  const deactivate = useCallback(async (licenseId: string, deviceId: string) => {
    setIsActivating(true);
    setError(null);

    try {
      const result = await licenseActivationEngine.deactivate(licenseId, deviceId);
      if (!result.success) {
        setError(result.error || 'Failed to deactivate license');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate license';
      setError(errorMessage);
      return {
        success: false,
        license: null,
        offlineToken: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsActivating(false);
    }
  }, []);

  const revokeDevice = useCallback((license: License, deviceId: string) => {
    const success = licenseActivationEngine.revokeDevice(license, deviceId);
    if (!success) {
      setError('Failed to revoke device');
    }
    return success;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isActivating,
    error,
    activate,
    deactivate,
    revokeDevice,
    clearError,
  };
}
