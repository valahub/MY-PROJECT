// Pricing Self-Heal Logic
// Auto disable invalid plans, flag duplicates, fix data integrity issues

import type { PricingPlan, ValidationResult } from './pricing-types';
import { pricingValidationEngine } from './pricing-validation';
import { pricingStatusEngine } from './pricing-status';

// ============================================
// SELF-HEAL RESULT
// ============================================

export interface SelfHealResult {
  success: boolean;
  healedPlans: PricingPlan[];
  flaggedPlans: PricingPlan[];
  errors: string[];
  warnings: string[];
}

// ============================================
// SELF-HEAL ACTION
// ============================================

export interface SelfHealAction {
  type: 'disable' | 'flag' | 'fix' | 'archive';
  planId: string;
  reason: string;
  autoApplied: boolean;
}

// ============================================
// SELF-HEAL ENGINE
// ============================================

export class PricingSelfHealEngine {
  private healHistory: SelfHealAction[] = [];

  // ============================================
  // DETECT AND HEAL ALL PLANS
  // ============================================

  async detectAndHeal(plans: PricingPlan[]): Promise<SelfHealResult> {
    const healedPlans: PricingPlan[] = [];
    const flaggedPlans: PricingPlan[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const plan of plans) {
      // Validate plan
      const validation = pricingValidationEngine.validatePlanForSelfHeal(plan);

      if (!validation.isValid) {
        const action = await this.healInvalidPlan(plan, validation);
        
        if (action.type === 'disable' || action.type === 'archive') {
          const healedPlan = this.applyHealAction(plan, action);
          if (healedPlan) {
            healedPlans.push(healedPlan);
          }
        } else if (action.type === 'flag') {
          flaggedPlans.push(plan);
        }

        this.healHistory.push(action);
      }

      // Check for duplicates
      const duplicateCheck = pricingValidationEngine.detectDuplicatePricing(plans);
      if (duplicateCheck.warnings.length > 0) {
        const isDuplicate = duplicateCheck.warnings.some(
          (w) => w.field === 'pricing' && w.message.includes(plan.name)
        );
        
        if (isDuplicate) {
          const action: SelfHealAction = {
            type: 'flag',
            planId: plan.id,
            reason: 'Duplicate pricing detected',
            autoApplied: false,
          };
          flaggedPlans.push(plan);
          this.healHistory.push(action);
          warnings.push(`Plan "${plan.name}" has duplicate pricing`);
        }
      }

      // Check status consistency
      const statusValidation = pricingStatusEngine.validatePlanStatus(plan);
      if (!statusValidation.isValid) {
        errors.push(`Plan "${plan.name}" has invalid status: ${statusValidation.errors.join(', ')}`);
      }
      if (statusValidation.warnings.length > 0) {
        warnings.push(`Plan "${plan.name}" status warnings: ${statusValidation.warnings.join(', ')}`);
      }
    }

    return {
      success: errors.length === 0,
      healedPlans,
      flaggedPlans,
      errors,
      warnings,
    };
  }

  // ============================================
  // HEAL INVALID PLAN
  // ============================================

  private async healInvalidPlan(
    plan: PricingPlan,
    validation: ValidationResult
  ): Promise<SelfHealAction> {
    // Determine the appropriate heal action based on errors
    const hasCriticalError = validation.errors.some((e) => 
      e.code === 'INVALID_CURRENT_PRICE' || 
      e.code === 'CURRENT_VERSION_MISSING' ||
      e.code === 'ACTIVE_NO_VERSION'
    );

    if (hasCriticalError && plan.status === 'Active') {
      // Auto-disable active plans with critical errors
      return {
        type: 'disable',
        planId: plan.id,
        reason: 'Critical validation errors detected',
        autoApplied: true,
      };
    }

    // Flag for manual review if not critical
    return {
      type: 'flag',
      planId: plan.id,
      reason: `Validation errors: ${validation.errors.map((e) => e.message).join(', ')}`,
      autoApplied: false,
    };
  }

  // ============================================
  // APPLY HEAL ACTION
  // ============================================

  private applyHealAction(plan: PricingPlan, action: SelfHealAction): PricingPlan | null {
    try {
      let updatedPlan = { ...plan };

      switch (action.type) {
        case 'disable':
          // Change to Draft status
          updatedPlan = {
            ...plan,
            status: 'Draft',
            updatedAt: new Date().toISOString(),
            updatedBy: 'system',
            metadata: {
              ...plan.metadata,
              autoDisabled: true,
              autoDisabledReason: action.reason,
              autoDisabledAt: new Date().toISOString(),
            },
          };
          break;

        case 'archive':
          // Archive the plan
          updatedPlan = {
            ...plan,
            status: 'Archived',
            updatedAt: new Date().toISOString(),
            updatedBy: 'system',
            metadata: {
              ...plan.metadata,
              autoArchived: true,
              autoArchivedReason: action.reason,
              autoArchivedAt: new Date().toISOString(),
            },
          };
          break;

        case 'fix':
          // Attempt to fix the issue (placeholder for specific fix logic)
          break;

        case 'flag':
          // Just flag, no changes
          return null;
      }

      return updatedPlan;
    } catch (error) {
      console.error(`[PricingSelfHealEngine] Failed to apply heal action:`, error);
      return null;
    }
  }

  // ============================================
  // DETECT ANOMALIES
  // ============================================

  detectAnomalies(plans: PricingPlan[]): {
    priceAnomalies: PricingPlan[];
    versionAnomalies: PricingPlan[];
    statusAnomalies: PricingPlan[];
  } {
    const priceAnomalies: PricingPlan[] = [];
    const versionAnomalies: PricingPlan[] = [];
    const statusAnomalies: PricingPlan[] = [];

    for (const plan of plans) {
      // Check price anomalies (e.g., extremely high or low prices)
      const currentVersion = plan.versions.find((v) => v.version === plan.currentVersion);
      if (currentVersion) {
        if (currentVersion.price === 0) {
          priceAnomalies.push(plan);
        }
        if (currentVersion.price > 100000) {
          priceAnomalies.push(plan);
        }
      }

      // Check version anomalies
      if (plan.versions.length === 0) {
        versionAnomalies.push(plan);
      }
      if (!currentVersion) {
        versionAnomalies.push(plan);
      }

      // Check status anomalies
      if (plan.status === 'Active' && !currentVersion) {
        statusAnomalies.push(plan);
      }
    }

    return {
      priceAnomalies,
      versionAnomalies,
      statusAnomalies,
    };
  }

  // ============================================
  // GET HEAL HISTORY
  // ============================================

  getHealHistory(): SelfHealAction[] {
    return [...this.healHistory];
  }

  clearHealHistory(): void {
    this.healHistory = [];
  }

  // ============================================
  // AUTO-HEAL SINGLE PLAN
  // ============================================

  async autoHealPlan(plan: PricingPlan): Promise<{ success: boolean; healedPlan: PricingPlan | null; action: SelfHealAction | null }> {
    const validation = pricingValidationEngine.validatePlanForSelfHeal(plan);

    if (validation.isValid) {
      return {
        success: true,
        healedPlan: plan,
        action: null,
      };
    }

    const action = await this.healInvalidPlan(plan, validation);
    const healedPlan = this.applyHealAction(plan, action);

    if (healedPlan) {
      this.healHistory.push(action);
    }

    return {
      success: healedPlan !== null,
      healedPlan,
      action,
    };
  }

  // ============================================
  // GET SELF-HEAL STATISTICS
  // ============================================

  getStatistics(): {
    totalActions: number;
    disabledPlans: number;
    flaggedPlans: number;
    archivedPlans: number;
    fixedPlans: number;
  } {
    const stats = {
      totalActions: this.healHistory.length,
      disabledPlans: 0,
      flaggedPlans: 0,
      archivedPlans: 0,
      fixedPlans: 0,
    };

    for (const action of this.healHistory) {
      switch (action.type) {
        case 'disable':
          stats.disabledPlans++;
          break;
        case 'flag':
          stats.flaggedPlans++;
          break;
        case 'archive':
          stats.archivedPlans++;
          break;
        case 'fix':
          stats.fixedPlans++;
          break;
      }
    }

    return stats;
  }
}

// Export singleton instance
export const pricingSelfHealEngine = new PricingSelfHealEngine();

// ============================================
// REACT HOOK FOR SELF-HEAL
// ============================================

import { useState, useCallback } from 'react';

export function usePricingSelfHeal() {
  const [isHealing, setIsHealing] = useState(false);
  const [healResult, setHealResult] = useState<SelfHealResult | null>(null);

  const detectAndHeal = useCallback(async (plans: PricingPlan[]) => {
    setIsHealing(true);
    setHealResult(null);

    try {
      const result = await pricingSelfHealEngine.detectAndHeal(plans);
      setHealResult(result);
      return result;
    } finally {
      setIsHealing(false);
    }
  }, []);

  const autoHealPlan = useCallback(async (plan: PricingPlan) => {
    const result = await pricingSelfHealEngine.autoHealPlan(plan);
    return result;
  }, []);

  const detectAnomalies = useCallback((plans: PricingPlan[]) => {
    return pricingSelfHealEngine.detectAnomalies(plans);
  }, []);

  const getHealHistory = useCallback(() => {
    return pricingSelfHealEngine.getHealHistory();
  }, []);

  const getStatistics = useCallback(() => {
    return pricingSelfHealEngine.getStatistics();
  }, []);

  return {
    isHealing,
    healResult,
    detectAndHeal,
    autoHealPlan,
    detectAnomalies,
    getHealHistory,
    getStatistics,
  };
}
