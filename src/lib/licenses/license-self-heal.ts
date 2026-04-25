// License Self-Healing Engine
// Auto-fix expired, sync activations, detect corrupted keys

import type { License, LicenseStatus } from './license-types';

// ============================================
// SELF-HEAL RESULT
// ============================================

export interface SelfHealResult {
  success: boolean;
  license: License;
  fixes: string[];
  issues: string[];
  timestamp: string;
}

// ============================================
// LICENSE SELF-HEALING ENGINE
// ============================================

export class LicenseSelfHealingEngine {
  private licenses: Map<string, License> = new Map();

  // ============================================
  // HEAL LICENSE
  // ============================================

  async healLicense(license: License): Promise<SelfHealResult> {
    const fixes: string[] = [];
    const issues: string[] = [];
    const healedLicense = { ...license };

    // 1. Check if expired but status is active
    if (healedLicense.status === 'active' && new Date(healedLicense.expiresAt) < new Date()) {
      healedLicense.status = 'expired';
      fixes.push('Expired status updated');
    }

    // 2. Sync activation count with bound devices
    const actualActivationCount = healedLicense.boundDevices.length;
    if (healedLicense.activationCount !== actualActivationCount) {
      healedLicense.activationCount = actualActivationCount;
      fixes.push('Activation count synchronized with bound devices');
    }

    // 3. Check for corrupted license key format
    if (!this.validateLicenseKeyFormat(healedLicense.licenseKey)) {
      healedLicense.status = 'disabled';
      issues.push('Corrupted license key format - license disabled');
    }

    // 4. Check for device removal but count not updated
    const devicesToRemove = this.detectOrphanedDevices(healedLicense);
    if (devicesToRemove.length > 0) {
      healedLicense.boundDevices = healedLicense.boundDevices.filter(
        (d) => !devicesToRemove.includes(d.deviceId)
      );
      healedLicense.activationCount = healedLicense.boundDevices.length;
      fixes.push(`Removed ${devicesToRemove.length} orphaned devices`);
    }

    // 5. Update last check time
    healedLicense.lastCheckAt = new Date().toISOString();

    const success = fixes.length > 0 || issues.length === 0;

    console.log(`[LicenseSelfHeal] Healed license ${license.id}: ${fixes.join(', ')}`);

    return {
      success,
      license: healedLicense,
      fixes,
      issues,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // BATCH HEAL LICENSES
  // ============================================

  async batchHealLicenses(licenses: License[]): Promise<Map<string, SelfHealResult>> {
    const results = new Map<string, SelfHealResult>();

    for (const license of licenses) {
      const result = await this.healLicense(license);
      results.set(license.id, result);
    }

    return results;
  }

  // ============================================
  // VALIDATE LICENSE KEY FORMAT
  // ============================================

  private validateLicenseKeyFormat(licenseKey: string): boolean {
    const pattern = /^EVLA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-F0-9]{2}$/;
    return pattern.test(licenseKey);
  }

  // ============================================
  // DETECT ORPHANED DEVICES
  // ============================================

  private detectOrphanedDevices(license: License): string[] {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Devices not active in 30 days are considered orphaned
    return license.boundDevices
      .filter((d) => new Date(d.lastActiveAt) < thirtyDaysAgo)
      .map((d) => d.deviceId);
  }

  // ============================================
  // DETECT INCONSISTENCIES
  // ============================================

  detectInconsistencies(license: License): string[] {
    const issues: string[] = [];

    // Check status vs expiry
    if (license.status === 'active' && new Date(license.expiresAt) < new Date()) {
      issues.push('License is expired but status is active');
    }

    // Check activation count vs bound devices
    if (license.activationCount !== license.boundDevices.length) {
      issues.push('Activation count does not match bound devices count');
    }

    // Check license key format
    if (!this.validateLicenseKeyFormat(license.licenseKey)) {
      issues.push('License key format is corrupted');
    }

    // Check for orphaned devices
    const orphanedDevices = this.detectOrphanedDevices(license);
    if (orphanedDevices.length > 0) {
      issues.push(`${orphanedDevices.length} orphaned devices detected`);
    }

    // Check offline token
    if (!license.offlineToken) {
      issues.push('Offline token is missing');
    }

    return issues;
  }

  // ============================================
  // GET HEALTH SUMMARY
  // ============================================

  getHealthSummary(licenses: License[]): {
    totalLicenses: number;
    healthyLicenses: number;
    licensesWithIssues: number;
    issues: Map<string, string[]>;
  } {
    const issues = new Map<string, string[]>();
    let licensesWithIssues = 0;

    for (const license of licenses) {
      const licenseIssues = this.detectInconsistencies(license);
      if (licenseIssues.length > 0) {
        issues.set(license.id, licenseIssues);
        licensesWithIssues++;
      }
    }

    const healthyLicenses = licenses.length - licensesWithIssues;

    return {
      totalLicenses: licenses.length,
      healthyLicenses,
      licensesWithIssues,
      issues,
    };
  }

  // ============================================
  // AUTO-FIX EXPIRED LICENSES
  // ============================================

  async autoFixExpiredLicenses(licenses: License[]): Promise<License[]> {
    const fixedLicenses: License[] = [];

    for (const license of licenses) {
      if (license.status === 'active' && new Date(license.expiresAt) < new Date()) {
        license.status = 'expired';
        license.lastCheckAt = new Date().toISOString();
        fixedLicenses.push(license);
        console.log(`[LicenseSelfHeal] Auto-fixed expired license ${license.id}`);
      }
    }

    return fixedLicenses;
  }

  // ============================================
  // SYNC ACTIVATION COUNTS
  // ============================================

  async syncActivationCounts(licenses: License[]): Promise<License[]> {
    const fixedLicenses: License[] = [];

    for (const license of licenses) {
      const actualCount = license.boundDevices.length;
      if (license.activationCount !== actualCount) {
        license.activationCount = actualCount;
        license.lastCheckAt = new Date().toISOString();
        fixedLicenses.push(license);
        console.log(`[LicenseSelfHeal] Synced activation count for license ${license.id}`);
      }
    }

    return fixedLicenses;
  }

  // ============================================
  // CLEAN ORPHANED DEVICES
  // ============================================

  async cleanOrphanedDevices(licenses: License[]): Promise<License[]> {
    const fixedLicenses: License[] = [];

    for (const license of licenses) {
      const orphanedDevices = this.detectOrphanedDevices(license);
      if (orphanedDevices.length > 0) {
        license.boundDevices = license.boundDevices.filter(
          (d) => !orphanedDevices.includes(d.deviceId)
        );
        license.activationCount = license.boundDevices.length;
        license.lastCheckAt = new Date().toISOString();
        fixedLicenses.push(license);
        console.log(`[LicenseSelfHeal] Cleaned ${orphanedDevices.length} orphaned devices for license ${license.id}`);
      }
    }

    return fixedLicenses;
  }

  // ============================================
  // DISABLE CORRUPTED LICENSES
  // ============================================

  async disableCorruptedLicenses(licenses: License[]): Promise<License[]> {
    const fixedLicenses: License[] = [];

    for (const license of licenses) {
      if (!this.validateLicenseKeyFormat(license.licenseKey)) {
        license.status = 'disabled';
        license.lastCheckAt = new Date().toISOString();
        fixedLicenses.push(license);
        console.log(`[LicenseSelfHeal] Disabled corrupted license ${license.id}`);
      }
    }

    return fixedLicenses;
  }

  // ============================================
  // REGENERATE OFFLINE TOKENS
  // ============================================

  async regenerateOfflineTokens(licenses: License[]): Promise<License[]> {
    const fixedLicenses: License[] = [];

    for (const license of licenses) {
      if (!license.offlineToken && license.status === 'active') {
        // In production, generate new offline token
        // For now, set a placeholder
        license.offlineToken = 'TOKEN_PLACEHOLDER';
        license.lastCheckAt = new Date().toISOString();
        fixedLicenses.push(license);
        console.log(`[LicenseSelfHeal] Regenerated offline token for license ${license.id}`);
      }
    }

    return fixedLicenses;
  }

  // ============================================
  // RUN FULL HEAL
  // ============================================

  async runFullHeal(licenses: License[]): Promise<{
    expiredFixed: number;
    activationsSynced: number;
    orphanedCleaned: number;
    corruptedDisabled: number;
    tokensRegenerated: number;
  }> {
    const expiredFixed = (await this.autoFixExpiredLicenses(licenses)).length;
    const activationsSynced = (await this.syncActivationCounts(licenses)).length;
    const orphanedCleaned = (await this.cleanOrphanedDevices(licenses)).length;
    const corruptedDisabled = (await this.disableCorruptedLicenses(licenses)).length;
    const tokensRegenerated = (await this.regenerateOfflineTokens(licenses)).length;

    return {
      expiredFixed,
      activationsSynced,
      orphanedCleaned,
      corruptedDisabled,
      tokensRegenerated,
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
export const licenseSelfHealingEngine = new LicenseSelfHealingEngine();

// ============================================
// REACT HOOK FOR LICENSE SELF-HEALING
// ============================================

import { useState, useCallback } from 'react';

export function useLicenseSelfHealing() {
  const [isHealing, setIsHealing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const healLicense = useCallback(async (license: License) => {
    setIsHealing(true);
    setError(null);

    try {
      const result = await licenseSelfHealingEngine.healLicense(license);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to heal license';
      setError(errorMessage);
      return {
        success: false,
        license,
        fixes: [],
        issues: [errorMessage],
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsHealing(false);
    }
  }, []);

  const runFullHeal = useCallback(async (licenses: License[]) => {
    setIsHealing(true);
    setError(null);

    try {
      const result = await licenseSelfHealingEngine.runFullHeal(licenses);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to run full heal';
      setError(errorMessage);
      return {
        expiredFixed: 0,
        activationsSynced: 0,
        orphanedCleaned: 0,
        corruptedDisabled: 0,
        tokensRegenerated: 0,
      };
    } finally {
      setIsHealing(false);
    }
  }, []);

  const getHealthSummary = useCallback((licenses: License[]) => {
    return licenseSelfHealingEngine.getHealthSummary(licenses);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isHealing,
    error,
    healLicense,
    runFullHeal,
    getHealthSummary,
    clearError,
  };
}
