// Pricing Modal Components
// Create/edit with inline validation (NO UI CHANGE - LOGIC ONLY)

import { useState, useCallback, useEffect } from 'react';
import type { PricingPlan, PlanChangeRequest, BillingCycle, PricingStatus, DependencyCheckResult } from '../../lib/pricing/pricing-types';
import { pricingValidationEngine } from '../../lib/pricing/pricing-validation';
import { usePricingStore } from '../../lib/pricing/pricing-store';
import { usePricingErrorHandling } from '../../lib/pricing/pricing-error-handling';
import { usePricingRBAC } from '../../lib/pricing/pricing-rbac';
import { pricingAuditManager } from '../../lib/pricing/pricing-audit';
import type { ErrorResult } from '../../lib/pricing/pricing-error-handling';

// ============================================
// FORM STATE
// ============================================

export interface PricingFormState {
  name: string;
  description: string;
  price: string;
  billingCycle: BillingCycle;
  trialDays: string;
  status: PricingStatus;
  features: string[];
  limits: Record<string, string>;
}

// ============================================
// VALIDATION STATE
// ============================================

export interface FieldValidation {
  isValid: boolean;
  error: string | null;
}

// ============================================
// PRICING MODAL HOOK
// ============================================

export function usePricingModal(mode: 'create' | 'edit', initialPlan?: PricingPlan) {
  const { createPlan, updatePlan } = usePricingStore();
  const { safeAPICall, beginOptimisticUpdate, commitOptimisticUpdate, rollbackOptimisticUpdate } = usePricingErrorHandling();
  const { canCreate, canEdit } = usePricingRBAC();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PricingFormState>({
    name: '',
    description: '',
    price: '',
    billingCycle: 'monthly',
    trialDays: '0',
    status: 'Draft',
    features: [],
    limits: {},
  });

  const [validation, setValidation] = useState<Record<string, FieldValidation>>({});
  const [existingPlans, setExistingPlans] = useState<PricingPlan[]>([]);

  // Initialize form data when modal opens or plan changes
  useEffect(() => {
    if (mode === 'edit' && initialPlan) {
      const currentVersion = initialPlan.versions.find((v) => v.version === initialPlan.currentVersion);
      setFormData({
        name: initialPlan.name,
        description: initialPlan.description || '',
        price: currentVersion?.price.toString() || '',
        billingCycle: currentVersion?.billingCycle || 'monthly',
        trialDays: currentVersion?.trialDays.toString() || '0',
        status: initialPlan.status,
        features: initialPlan.features || [],
        limits: initialPlan.limits ? Object.fromEntries(
          Object.entries(initialPlan.limits).map(([k, v]) => [k, v.toString()])
        ) : {},
      });
    }
  }, [mode, initialPlan, isOpen]);

  // ============================================
  // FIELD VALIDATION
  // ============================================

  const validateField = useCallback((field: string, value: unknown): FieldValidation => {
    const result = pricingValidationEngine.quickValidate(field, value);
    return {
      isValid: result.isValid,
      error: result.isValid ? null : result.error,
    };
  }, []);

  const validateForm = useCallback((): boolean => {
    const newValidation: Record<string, FieldValidation> = {};

    // Validate name
    newValidation.name = validateField('name', formData.name);

    // Validate price
    const priceNum = parseFloat(formData.price);
    newValidation.price = validateField('price', priceNum);

    // Validate billing cycle
    newValidation.billingCycle = validateField('billingCycle', formData.billingCycle);

    // Validate trial days
    const trialDaysNum = parseInt(formData.trialDays);
    newValidation.trialDays = validateField('trialDays', trialDaysNum);

    setValidation(newValidation);

    return Object.values(newValidation).every((v) => v.isValid);
  }, [formData, validateField]);

  // ============================================
  // FORM HANDLERS
  // ============================================

  const handleFieldChange = useCallback((field: string, value: unknown) => {
    const stringValue = typeof value === 'string' ? value : String(value);
    setFormData((prev) => ({
      ...prev,
      [field]: stringValue,
    }));

    // Inline validation
    const fieldValidation = validateField(field, value);
    setValidation((prev) => ({
      ...prev,
      [field]: fieldValidation,
    }));
  }, [validateField]);

  const handleAddFeature = useCallback((feature: string) => {
    if (feature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, feature.trim()],
      }));
    }
  }, []);

  const handleRemoveFeature = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  }, []);

  const handleLimitChange = useCallback((key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      limits: {
        ...prev.limits,
        [key]: value,
      },
    }));
  }, []);

  // ============================================
  // SUBMIT HANDLER
  // ============================================

  const handleSubmit = useCallback(async () => {
    // Validate entire form
    const isValid = validateForm();
    if (!isValid) {
      return { success: false, error: 'Please fix validation errors' };
    }

    // Check permissions
    if (mode === 'create' && !canCreate()) {
      return { success: false, error: 'You do not have permission to create plans' };
    }
    if (mode === 'edit' && !canEdit()) {
      return { success: false, error: 'You do not have permission to edit plans' };
    }

    setIsSubmitting(true);

    try {
      const priceNum = parseFloat(formData.price);
      const trialDaysNum = parseInt(formData.trialDays);
      const limitsNum = Object.fromEntries(
        Object.entries(formData.limits).map(([k, v]) => [k, parseFloat(String(v)) || 0])
      );

      const request: PlanChangeRequest = {
        name: formData.name,
        description: formData.description,
        price: priceNum,
        billingCycle: formData.billingCycle,
        trialDays: trialDaysNum,
        status: formData.status,
        features: formData.features,
        limits: limitsNum,
      };

      if (mode === 'create') {
        // Create optimistic plan
        const optimisticPlan: PricingPlan = {
          id: `temp_${Date.now()}`,
          name: formData.name,
          description: formData.description,
          status: formData.status,
          currentVersion: 'v1',
          versions: [
            {
              version: 'v1',
              price: priceNum,
              trialDays: trialDaysNum,
              billingCycle: formData.billingCycle,
              createdAt: new Date().toISOString(),
              createdBy: 'current_user',
            },
          ],
          features: formData.features,
          limits: limitsNum,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current_user',
          updatedBy: 'current_user',
          merchantId: 'current_merchant',
        };

        beginOptimisticUpdate('create_plan', null, optimisticPlan);

        const result = await safeAPICall(
          'create_plan',
          () => createPlan(request, 'current_user'),
          optimisticPlan
        );

        if (result.success) {
          commitOptimisticUpdate('create_plan');
          setIsOpen(false);
          
          // Log audit
          pricingAuditManager.logChange(
            'created',
            result.data!.id,
            'current_user',
            'user@example.com',
            undefined,
            result.data!
          );
        } else {
          rollbackOptimisticUpdate('create_plan');
        }

        return result as ErrorResult<PricingPlan>;
      } else {
        // Update existing plan
        const planId = initialPlan!.id;
        const oldPlan = initialPlan;

        // Create optimistic plan
        const optimisticPlan: PricingPlan = {
          ...oldPlan,
          name: formData.name,
          description: formData.description,
          status: formData.status,
          features: formData.features,
          limits: limitsNum,
          updatedAt: new Date().toISOString(),
          updatedBy: 'current_user',
        };

        beginOptimisticUpdate(`update_plan_${planId}`, oldPlan, optimisticPlan);

        const result = await safeAPICall(
          `update_plan_${planId}`,
          () => updatePlan(planId, request, 'current_user'),
          optimisticPlan
        );

        if (result.success) {
          commitOptimisticUpdate(`update_plan_${planId}`);
          setIsOpen(false);
          
          // Log audit
          pricingAuditManager.logChange(
            'updated',
            planId,
            'current_user',
            'user@example.com',
            oldPlan,
            result.data!
          );
        } else {
          rollbackOptimisticUpdate(`update_plan_${planId}`);
        }

        return result;
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    mode,
    initialPlan,
    validateForm,
    canCreate,
    canEdit,
    safeAPICall,
    createPlan,
    updatePlan,
    beginOptimisticUpdate,
    commitOptimisticUpdate,
    rollbackOptimisticUpdate,
  ]);

  // ============================================
  // MODAL CONTROL
  // ============================================

  const openModal = useCallback(() => {
    setIsOpen(true);
    setValidation({});
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setValidation({});
    // Reset form data
    setFormData({
      name: '',
      description: '',
      price: '',
      billingCycle: 'monthly',
      trialDays: '0',
      status: 'Draft',
      features: [],
      limits: {},
    });
  }, []);

  // ============================================
  // RETURN VALUES
  // ============================================

  return {
    isOpen,
    isSubmitting,
    formData,
    validation,
    handleFieldChange,
    handleAddFeature,
    handleRemoveFeature,
    handleLimitChange,
    handleSubmit,
    openModal,
    closeModal,
    canSubmit: mode === 'create' ? canCreate() : canEdit(),
  };
}

// ============================================
// ARCHIVE CONFIRMATION MODAL HOOK
// ============================================

export function useArchiveConfirmationModal(plan: PricingPlan) {
  const { archivePlan } = usePricingStore();
  const { canArchive } = usePricingRBAC();
  const { checkDependencies } = useDependencyCheck();

  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [dependencyCheck, setDependencyCheck] = useState<DependencyCheckResult | null>(null);

  const openModal = useCallback(async () => {
    setIsOpen(true);
    
    // Check dependencies
    const check = await checkDependencies(plan.id);
    setDependencyCheck(check);
  }, [plan.id, checkDependencies]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setDependencyCheck(null);
  }, []);

  const confirmArchive = useCallback(async () => {
    if (!canArchive()) {
      return { success: false, error: 'You do not have permission to archive plans' };
    }

    if (dependencyCheck && !dependencyCheck.canDelete) {
      return {
        success: false,
        error: dependencyCheck.blockingReason || 'Cannot archive plan with active dependencies',
      };
    }

    setIsConfirming(true);

    try {
      const result = await archivePlan(plan.id, 'current_user');

      if (result.success) {
        // Log audit
        pricingAuditManager.logChange(
          'archived',
          plan.id,
          'current_user',
          'user@example.com',
          plan,
          result.plan
        );
        closeModal();
      }

      return result;
    } finally {
      setIsConfirming(false);
    }
  }, [plan, dependencyCheck, canArchive, archivePlan, closeModal]);

  return {
    isOpen,
    isConfirming,
    dependencyCheck,
    openModal,
    closeModal,
    confirmArchive,
    canArchive: canArchive(),
  };
}

// ============================================
// IMPORT DEPENDENCY CHECK HOOK
// ============================================

import { useDependencyCheck as useDependencyCheckHook } from '../../lib/pricing/dependency-check';

export function useDependencyCheck() {
  return useDependencyCheckHook();
}
