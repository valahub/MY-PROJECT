// Safe Delete/Archive Logic
// Blocks delete if active users exist, else archives the plan

import type { PricingPlan, PricingStatus, DependencyCheckResult } from './pricing-types';
import { dependencyCheckEngine } from './dependency-check';

// ============================================
// ARCHIVE RESULT
// ============================================

export interface ArchiveResult {
  success: boolean;
  archivedPlan: PricingPlan | null;
  error: string | null;
  blockedReason?: string;
}

// ============================================
// SAFE DELETE MANAGER
// ============================================

export class SafeDeleteManager {
  // ============================================
  // CHECK IF PLAN CAN BE DELETED
  // ============================================

  canDelete(plan: PricingPlan): DependencyCheckResult {
    return dependencyCheckEngine.checkDependencies(plan.id);
  }

  // ============================================
  // ARCHIVE PLAN (SAFE DELETE)
  // ============================================

  async archivePlan(plan: PricingPlan, userId: string): Promise<ArchiveResult> {
    // First check dependencies
    const dependencyCheck = this.canDelete(plan);

    if (!dependencyCheck.canDelete) {
      return {
        success: false,
        archivedPlan: null,
        error: 'Cannot archive plan with active dependencies',
        blockedReason: dependencyCheck.blockingReason,
      };
    }

    // If no active dependencies, proceed with archive
    try {
      // Create archived version of the plan
      const archivedPlan: PricingPlan = {
        ...plan,
        status: 'Archived',
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      };

      // In production, this would call the API
      // const result = await pricingAPI.archivePlan(plan.id);

      return {
        success: true,
        archivedPlan,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        archivedPlan: null,
        error: error instanceof Error ? error.message : 'Failed to archive plan',
      };
    }
  }

  // ============================================
  // RESTORE ARCHIVED PLAN
  // ============================================

  async restorePlan(plan: PricingPlan, userId: string): Promise<ArchiveResult> {
    try {
      // Restore to Active status
      const restoredPlan: PricingPlan = {
        ...plan,
        status: 'Active',
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      };

      // In production, this would call the API
      // const result = await pricingAPI.restorePlan(plan.id);

      return {
        success: true,
        archivedPlan: restoredPlan,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        archivedPlan: null,
        error: error instanceof Error ? error.message : 'Failed to restore plan',
      };
    }
  }

  // ============================================
  // FORCE ARCHIVE (ADMIN ONLY)
  // ============================================

  async forceArchivePlan(plan: PricingPlan, userId: string, reason: string): Promise<ArchiveResult> {
    // Force archive regardless of dependencies (admin only)
    try {
      const archivedPlan: PricingPlan = {
        ...plan,
        status: 'Archived',
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
        metadata: {
          ...plan.metadata,
          forceArchived: true,
          forceArchiveReason: reason,
          forceArchivedAt: new Date().toISOString(),
          forceArchivedBy: userId,
        },
      };

      // In production, this would call the API
      // const result = await pricingAPI.archivePlan(plan.id);

      return {
        success: true,
        archivedPlan,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        archivedPlan: null,
        error: error instanceof Error ? error.message : 'Failed to force archive plan',
      };
    }
  }

  // ============================================
  // GET BLOCKING REASONS
  // ============================================

  getBlockingReasons(plan: PricingPlan): string[] {
    const check = this.canDelete(plan);
    const reasons: string[] = [];

    if (check.hasActiveSubscriptions) {
      reasons.push(`${check.activeSubscriptionCount} active subscription(s)`);
    }
    if (check.hasPendingInvoices) {
      reasons.push(`${check.pendingInvoiceCount} pending invoice(s)`);
    }
    if (check.hasTrialUsers) {
      reasons.push(`${check.trialUserCount} active trial user(s)`);
    }

    return reasons;
  }

  // ============================================
  // CHECK IF PLAN CAN BE EDITED
  // ============================================

  canEdit(plan: PricingPlan): { canEdit: boolean; warnings: string[] } {
    const check = this.canDelete(plan);
    const warnings: string[] = [];

    // Even if editing is allowed, warn about active dependencies
    if (check.hasActiveSubscriptions) {
      warnings.push(`Editing will affect ${check.activeSubscriptionCount} active subscription(s)`);
    }
    if (check.hasPendingInvoices) {
      warnings.push(`Pending invoices may be affected`);
    }

    return {
      canEdit: true, // Editing is always allowed, but with warnings
      warnings,
    };
  }
}

// Export singleton instance
export const safeDeleteManager = new SafeDeleteManager();

// ============================================
// REACT HOOK FOR SAFE DELETE
// ============================================

import { useState, useCallback } from 'react';

export function useSafeDelete() {
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveResult, setArchiveResult] = useState<ArchiveResult | null>(null);

  const archivePlan = useCallback(async (plan: PricingPlan, userId: string) => {
    setIsArchiving(true);
    setArchiveResult(null);

    try {
      const result = await safeDeleteManager.archivePlan(plan, userId);
      setArchiveResult(result);
      return result;
    } finally {
      setIsArchiving(false);
    }
  }, []);

  const restorePlan = useCallback(async (plan: PricingPlan, userId: string) => {
    setIsArchiving(true);
    setArchiveResult(null);

    try {
      const result = await safeDeleteManager.restorePlan(plan, userId);
      setArchiveResult(result);
      return result;
    } finally {
      setIsArchiving(false);
    }
  }, []);

  const forceArchivePlan = useCallback(async (plan: PricingPlan, userId: string, reason: string) => {
    setIsArchiving(true);
    setArchiveResult(null);

    try {
      const result = await safeDeleteManager.forceArchivePlan(plan, userId, reason);
      setArchiveResult(result);
      return result;
    } finally {
      setIsArchiving(false);
    }
  }, []);

  const canDelete = useCallback((plan: PricingPlan) => {
    return safeDeleteManager.canDelete(plan);
  }, []);

  const getBlockingReasons = useCallback((plan: PricingPlan) => {
    return safeDeleteManager.getBlockingReasons(plan);
  }, []);

  const canEdit = useCallback((plan: PricingPlan) => {
    return safeDeleteManager.canEdit(plan);
  }, []);

  return {
    isArchiving,
    archiveResult,
    archivePlan,
    restorePlan,
    forceArchivePlan,
    canDelete,
    getBlockingReasons,
    canEdit,
  };
}
