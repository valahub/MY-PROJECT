// Pricing Status Engine
// Manages Active, Draft, Archived statuses with visibility rules

import type { PricingPlan, PricingStatus } from './pricing-types';
import type { PricingStatusConfig } from './pricing-types';
import { PRICING_STATUS_CONFIG } from './pricing-types';

export { PRICING_STATUS_CONFIG };

// ============================================
// STATUS TRANSITION RULES
// ============================================

export interface StatusTransition {
  from: PricingStatus;
  to: PricingStatus;
  allowed: boolean;
  requiresConfirmation: boolean;
  reason?: string;
}

export const STATUS_TRANSITIONS: StatusTransition[] = [
  // Draft -> Active
  { from: 'Draft', to: 'Active', allowed: true, requiresConfirmation: false },
  // Draft -> Archived
  { from: 'Draft', to: 'Archived', allowed: true, requiresConfirmation: false },
  // Active -> Draft
  { from: 'Active', to: 'Draft', allowed: true, requiresConfirmation: true, reason: 'Active plan will be hidden from checkout' },
  // Active -> Archived
  { from: 'Active', to: 'Archived', allowed: true, requiresConfirmation: true, reason: 'Active plan will be archived and read-only' },
  // Archived -> Draft
  { from: 'Archived', to: 'Draft', allowed: true, requiresConfirmation: false },
  // Archived -> Active
  { from: 'Archived', to: 'Active', allowed: true, requiresConfirmation: false },
];

// ============================================
// STATUS ENGINE
// ============================================

export class PricingStatusEngine {
  // ============================================
  // GET STATUS CONFIG
  // ============================================

  getStatusConfig(status: PricingStatus): PricingStatusConfig {
    return PRICING_STATUS_CONFIG[status];
  }

  // ============================================
  // CHECK IF TRANSITION IS ALLOWED
  // ============================================

  canTransition(from: PricingStatus, to: PricingStatus): {
    allowed: boolean;
    requiresConfirmation: boolean;
    reason?: string;
  } {
    if (from === to) {
      return {
        allowed: false,
        requiresConfirmation: false,
        reason: 'Status is already set to this value',
      };
    }

    const transition = STATUS_TRANSITIONS.find((t) => t.from === from && t.to === to);

    if (!transition) {
      return {
        allowed: false,
        requiresConfirmation: false,
        reason: 'Invalid status transition',
      };
    }

    return {
      allowed: transition.allowed,
      requiresConfirmation: transition.requiresConfirmation,
      reason: transition.reason,
    };
  }

  // ============================================
  // GET ALLOWED TRANSITIONS
  // ============================================

  getAllowedTransitions(currentStatus: PricingStatus): PricingStatus[] {
    return STATUS_TRANSITIONS
      .filter((t) => t.from === currentStatus && t.allowed)
      .map((t) => t.to);
  }

  // ============================================
  // CHECK IF PLAN IS VISIBLE TO CHECKOUT
  // ============================================

  isVisibleToCheckout(plan: PricingPlan): boolean {
    const config = this.getStatusConfig(plan.status);
    return config.visibleToCheckout;
  }

  // ============================================
  // CHECK IF PLAN IS EDITABLE
  // ============================================

  isEditable(plan: PricingPlan): boolean {
    const config = this.getStatusConfig(plan.status);
    return config.editable;
  }

  // ============================================
  // CHECK IF PLAN IS DELETABLE
  // ============================================

  isDeletable(plan: PricingPlan): boolean {
    const config = this.getStatusConfig(plan.status);
    return config.deletable;
  }

  // ============================================
  // TRANSITION STATUS
  // ============================================

  async transitionStatus(
    plan: PricingPlan,
    newStatus: PricingStatus,
    userId: string
  ): Promise<{ success: boolean; plan: PricingPlan | null; error: string | null }> {
    // Check if transition is allowed
    const check = this.canTransition(plan.status, newStatus);

    if (!check.allowed) {
      return {
        success: false,
        plan: null,
        error: check.reason || 'Status transition not allowed',
      };
    }

    try {
      // Create updated plan
      const updatedPlan: PricingPlan = {
        ...plan,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      };

      // In production, this would call the API
      // const result = await pricingAPI.updatePlan(plan.id, { status: newStatus });

      return {
        success: true,
        plan: updatedPlan,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        plan: null,
        error: error instanceof Error ? error.message : 'Failed to transition status',
      };
    }
  }

  // ============================================
  // GET STATUS DESCRIPTION
  // ============================================

  getStatusDescription(status: PricingStatus): string {
    return PRICING_STATUS_CONFIG[status].description;
  }

  // ============================================
  // VALIDATE STATUS FOR PLAN
  // ============================================

  validatePlanStatus(plan: PricingPlan): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if active plan has valid current version
    if (plan.status === 'Active') {
      const currentVersion = plan.versions.find((v) => v.version === plan.currentVersion);
      if (!currentVersion) {
        errors.push('Active plan must have a valid current version');
      }
    }

    // Check if draft plan has incomplete data
    if (plan.status === 'Draft') {
      if (!plan.name || plan.name.trim().length === 0) {
        warnings.push('Draft plan is missing name');
      }
      if (plan.versions.length === 0) {
        warnings.push('Draft plan has no pricing version');
      }
    }

    // Check if archived plan has dependencies
    if (plan.status === 'Archived') {
      // This would check for dependencies in production
      // For now, just log a note
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================
  // GET STATUS COLOR FOR UI
  // ============================================

  getStatusColor(status: PricingStatus): string {
    switch (status) {
      case 'Active':
        return 'green';
      case 'Draft':
        return 'yellow';
      case 'Archived':
        return 'gray';
      default:
        return 'gray';
    }
  }

  // ============================================
  // GET STATUS ICON
  // ============================================

  getStatusIcon(status: PricingStatus): string {
    switch (status) {
      case 'Active':
        return 'check-circle';
      case 'Draft':
        return 'edit';
      case 'Archived':
        return 'archive';
      default:
        return 'help-circle';
    }
  }
}

// Export singleton instance
export const pricingStatusEngine = new PricingStatusEngine();

// ============================================
// REACT HOOK FOR STATUS MANAGEMENT
// ============================================

import { useState, useCallback } from 'react';

export function usePricingStatus() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const canTransition = useCallback((from: PricingStatus, to: PricingStatus) => {
    return pricingStatusEngine.canTransition(from, to);
  }, []);

  const getAllowedTransitions = useCallback((currentStatus: PricingStatus) => {
    return pricingStatusEngine.getAllowedTransitions(currentStatus);
  }, []);

  const transitionStatus = useCallback(async (plan: PricingPlan, newStatus: PricingStatus, userId: string) => {
    setIsTransitioning(true);

    try {
      const result = await pricingStatusEngine.transitionStatus(plan, newStatus, userId);
      return result;
    } finally {
      setIsTransitioning(false);
    }
  }, []);

  const isVisibleToCheckout = useCallback((plan: PricingPlan) => {
    return pricingStatusEngine.isVisibleToCheckout(plan);
  }, []);

  const isEditable = useCallback((plan: PricingPlan) => {
    return pricingStatusEngine.isEditable(plan);
  }, []);

  const isDeletable = useCallback((plan: PricingPlan) => {
    return pricingStatusEngine.isDeletable(plan);
  }, []);

  const getStatusDescription = useCallback((status: PricingStatus) => {
    return pricingStatusEngine.getStatusDescription(status);
  }, []);

  const validatePlanStatus = useCallback((plan: PricingPlan) => {
    return pricingStatusEngine.validatePlanStatus(plan);
  }, []);

  return {
    isTransitioning,
    canTransition,
    getAllowedTransitions,
    transitionStatus,
    isVisibleToCheckout,
    isEditable,
    isDeletable,
    getStatusDescription,
    validatePlanStatus,
  };
}
