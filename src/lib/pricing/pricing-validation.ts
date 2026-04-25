// Pricing Validation Engine
// Validates pricing plans with comprehensive rules

import type {
  PricingPlan,
  PlanChangeRequest,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  BillingCycle,
} from './pricing-types';

// ============================================
// VALIDATION RULES
// ============================================

export interface ValidationRule {
  field: string;
  validate: (value: unknown, context: ValidationContext) => boolean;
  errorMessage: string;
  errorCode: string;
  severity: 'error' | 'warning';
}

export interface ValidationContext {
  existingPlans: PricingPlan[];
  planId?: string;
  isUpdate: boolean;
}

// ============================================
// VALIDATION ENGINE
// ============================================

export class PricingValidationEngine {
  private rules: ValidationRule[] = [
    // Price validation
    {
      field: 'price',
      validate: (value) => typeof value === 'number' && value > 0,
      errorMessage: 'Price must be greater than 0',
      errorCode: 'INVALID_PRICE',
      severity: 'error',
    },
    {
      field: 'price',
      validate: (value) => typeof value === 'number' && Number.isFinite(value),
      errorMessage: 'Price must be a valid number',
      errorCode: 'INVALID_PRICE_FORMAT',
      severity: 'error',
    },
    {
      field: 'price',
      validate: (value) => {
        if (typeof value !== 'number') return true;
        return value <= 1000000; // Max price limit
      },
      errorMessage: 'Price exceeds maximum allowed value ($1,000,000)',
      errorCode: 'PRICE_TOO_HIGH',
      severity: 'warning',
    },

    // Name validation
    {
      field: 'name',
      validate: (value, context) => {
        if (typeof value !== 'string') return false;
        if (value.trim().length === 0) return false;
        
        // Check for unique name (case-insensitive)
        if (!context.isUpdate) {
          const exists = context.existingPlans.some(
            (plan) => plan.name.toLowerCase() === value.toLowerCase()
          );
          return !exists;
        }
        
        // For updates, check if name conflicts with other plans
        if (context.planId) {
          const exists = context.existingPlans.some(
            (plan) => plan.id !== context.planId && plan.name.toLowerCase() === value.toLowerCase()
          );
          return !exists;
        }
        
        return true;
      },
      errorMessage: 'Plan name must be unique',
      errorCode: 'DUPLICATE_NAME',
      severity: 'error',
    },
    {
      field: 'name',
      validate: (value) => typeof value === 'string' && value.length >= 2 && value.length <= 100,
      errorMessage: 'Plan name must be between 2 and 100 characters',
      errorCode: 'INVALID_NAME_LENGTH',
      severity: 'error',
    },

    // Billing cycle validation
    {
      field: 'billingCycle',
      validate: (value) => {
        const validCycles: BillingCycle[] = ['monthly', 'yearly', 'weekly', 'quarterly'];
        return validCycles.includes(value as BillingCycle);
      },
      errorMessage: 'Billing cycle is required',
      errorCode: 'INVALID_BILLING_CYCLE',
      severity: 'error',
    },

    // Trial days validation
    {
      field: 'trialDays',
      validate: (value) => typeof value === 'number' && value >= 0,
      errorMessage: 'Trial days must be non-negative',
      errorCode: 'INVALID_TRIAL_DAYS',
      severity: 'error',
    },
    {
      field: 'trialDays',
      validate: (value) => {
        if (typeof value !== 'number') return true;
        return value <= 365; // Max trial days
      },
      errorMessage: 'Trial days cannot exceed 365',
      errorCode: 'TRIAL_DAYS_TOO_HIGH',
      severity: 'warning',
    },

    // Features validation
    {
      field: 'features',
      validate: (value) => Array.isArray(value) && value.length <= 50,
      errorMessage: 'Cannot have more than 50 features',
      errorCode: 'TOO_MANY_FEATURES',
      severity: 'warning',
    },

    // Limits validation
    {
      field: 'limits',
      validate: (value) => {
        if (typeof value !== 'object' || value === null) return true;
        for (const [key, val] of Object.entries(value)) {
          if (typeof val !== 'number' || val < 0) return false;
        }
        return true;
      },
      errorMessage: 'All limits must be non-negative numbers',
      errorCode: 'INVALID_LIMITS',
      severity: 'error',
    },
  ];

  // ============================================
  // VALIDATE PLAN CHANGE REQUEST
  // ============================================

  validate(request: PlanChangeRequest, context: ValidationContext): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate each field
    for (const rule of this.rules) {
      const value = this.getFieldValue(request, rule.field);
      const isValid = rule.validate(value, context);

      if (!isValid) {
        if (rule.severity === 'error') {
          errors.push({
            field: rule.field,
            message: rule.errorMessage,
            code: rule.errorCode,
          });
        } else {
          warnings.push({
            field: rule.field,
            message: rule.errorMessage,
            code: rule.errorCode,
          });
        }
      }
    }

    // Additional cross-field validations
    this.validateCrossFields(request, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================
  // CROSS-FIELD VALIDATIONS
  // ============================================

  private validateCrossFields(request: PlanChangeRequest, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Validate price vs trial days relationship
    if (request.price !== undefined && request.trialDays !== undefined) {
      const dailyPrice = request.price / 30; // Approximate monthly
      const trialValue = dailyPrice * request.trialDays;
      
      if (trialValue > request.price * 0.5) {
        warnings.push({
          field: 'trialDays',
          message: 'Trial duration is too long relative to price',
          code: 'TRIAL_TOO_LONG',
        });
      }
    }

    // Validate yearly price discount
    if (request.billingCycle === 'yearly' && request.price !== undefined) {
      // Check if yearly price provides reasonable discount (at least 10%)
      // This is a suggestion, not a hard error
      warnings.push({
        field: 'billingCycle',
        message: 'Consider offering a discount for yearly billing',
        code: 'YEARLY_DISCOUNT_SUGGESTION',
      });
    }

    // Validate feature uniqueness
    if (request.features && Array.isArray(request.features)) {
      const uniqueFeatures = new Set(request.features);
      if (uniqueFeatures.size !== request.features.length) {
        errors.push({
          field: 'features',
          message: 'Features must be unique',
          code: 'DUPLICATE_FEATURES',
        });
      }
    }
  }

  // ============================================
  // GET FIELD VALUE FROM REQUEST
  // ============================================

  private getFieldValue(request: PlanChangeRequest, field: string): unknown {
    switch (field) {
      case 'price':
        return request.price;
      case 'name':
        return request.name;
      case 'billingCycle':
        return request.billingCycle;
      case 'trialDays':
        return request.trialDays;
      case 'features':
        return request.features;
      case 'limits':
        return request.limits;
      default:
        return undefined;
    }
  }

  // ============================================
  // VALIDATE EXISTING PLAN FOR SELF-HEAL
  // ============================================

  validatePlanForSelfHeal(plan: PricingPlan): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check current version validity
    const currentVersion = plan.versions.find((v) => v.version === plan.currentVersion);
    
    if (!currentVersion) {
      errors.push({
        field: 'currentVersion',
        message: 'Current version not found in version history',
        code: 'CURRENT_VERSION_MISSING',
      });
    } else {
      // Validate version data
      if (currentVersion.price <= 0) {
        errors.push({
          field: 'price',
          message: 'Current version price is invalid',
          code: 'INVALID_CURRENT_PRICE',
        });
      }

      if (currentVersion.trialDays < 0) {
        errors.push({
          field: 'trialDays',
          message: 'Current version trial days is invalid',
          code: 'INVALID_CURRENT_TRIAL',
        });
      }
    }

    // Check for empty features
    if (plan.features.length === 0) {
      warnings.push({
        field: 'features',
        message: 'Plan has no features defined',
        code: 'NO_FEATURES',
      });
    }

    // Check for version consistency
    if (plan.versions.length === 0) {
      errors.push({
        field: 'versions',
        message: 'Plan has no versions',
        code: 'NO_VERSIONS',
      });
    }

    // Check status consistency
    if (plan.status === 'Active' && !currentVersion) {
      errors.push({
        field: 'status',
        message: 'Active plan must have a valid current version',
        code: 'ACTIVE_NO_VERSION',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================
  // DETECT DUPLICATE PRICING
  // ============================================

  detectDuplicatePricing(plans: PricingPlan[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Group by price and billing cycle
    const pricingGroups = new Map<string, PricingPlan[]>();

    for (const plan of plans) {
      const currentVersion = plan.versions.find((v) => v.version === plan.currentVersion);
      if (currentVersion) {
        const key = `${currentVersion.price}_${currentVersion.billingCycle}`;
        if (!pricingGroups.has(key)) {
          pricingGroups.set(key, []);
        }
        pricingGroups.get(key)!.push(plan);
      }
    }

    // Check for duplicates
    for (const [key, groupPlans] of pricingGroups.entries()) {
      if (groupPlans.length > 1) {
        const names = groupPlans.map((p) => p.name).join(', ');
        warnings.push({
          field: 'pricing',
          message: `Multiple plans with same pricing (${key}): ${names}`,
          code: 'DUPLICATE_PRICING',
        });
      }
    }

    return {
      isValid: true, // Duplicates are warnings, not errors
      errors,
      warnings,
    };
  }

  // ============================================
  // QUICK VALIDATION FOR INLINE EDIT
  // ============================================

  quickValidate(field: string, value: unknown): { isValid: boolean; error?: string } {
    const rule = this.rules.find((r) => r.field === field);
    if (!rule) {
      return { isValid: true };
    }

    const isValid = rule.validate(value, { existingPlans: [], isUpdate: false });
    return {
      isValid,
      error: isValid ? undefined : rule.errorMessage,
    };
  }
}

// Export singleton instance
export const pricingValidationEngine = new PricingValidationEngine();

// ============================================
// REACT HOOK FOR VALIDATION
// ============================================

import { useState, useCallback } from 'react';

export function usePricingValidation() {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  });

  const validate = useCallback(
    (request: PlanChangeRequest, context: ValidationContext) => {
      const result = pricingValidationEngine.validate(request, context);
      setValidationResult(result);
      return result;
    },
    []
  );

  const quickValidate = useCallback((field: string, value: unknown) => {
    return pricingValidationEngine.quickValidate(field, value);
  }, []);

  const validateForSelfHeal = useCallback((plan: PricingPlan) => {
    return pricingValidationEngine.validatePlanForSelfHeal(plan);
  }, []);

  const detectDuplicates = useCallback((plans: PricingPlan[]) => {
    return pricingValidationEngine.detectDuplicatePricing(plans);
  }, []);

  return {
    validationResult,
    validate,
    quickValidate,
    validateForSelfHeal,
    detectDuplicates,
  };
}
