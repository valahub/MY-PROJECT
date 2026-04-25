// Pricing Store with State Management (React Context)
// Manages pricing plans state across the application

import { useState, useCallback, useContext, createContext, ReactNode } from 'react';
import type { PricingPlan, PlanChangeRequest, PricingStatus } from './pricing-types';
import { pricingAPI } from './pricing-api';
import { pricingValidationEngine } from './pricing-validation';
import { pricingEventEmitter } from './pricing-events';
import { generateMockPlans } from './pricing-api';

// ============================================
// STORE STATE
// ============================================

interface PricingState {
  plans: PricingPlan[];
  selectedPlan: PricingPlan | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isArchiving: boolean;
  error: string | null;
  filters: {
    status?: PricingStatus;
    search?: string;
  };
}

// ============================================
// STORE ACTIONS
// ============================================

interface PricingActions {
  loadPlans: () => Promise<void>;
  loadPlan: (planId: string) => Promise<void>;
  createPlan: (request: PlanChangeRequest, userId: string) => Promise<{ success: boolean; plan: PricingPlan | null; error: string | null }>;
  updatePlan: (planId: string, request: PlanChangeRequest, userId: string) => Promise<{ success: boolean; plan: PricingPlan | null; error: string | null }>;
  archivePlan: (planId: string, userId: string) => Promise<{ success: boolean; plan: PricingPlan | null; error: string | null }>;
  restorePlan: (planId: string, userId: string) => Promise<{ success: boolean; plan: PricingPlan | null; error: string | null }>;
  selectPlan: (plan: PricingPlan | null) => void;
  setFilters: (filters: { status?: PricingStatus; search?: string }) => void;
  clearError: () => void;
  refreshPlans: () => Promise<void>;
}

// ============================================
// STORE CONTEXT
// ============================================

interface PricingContextValue extends PricingState, PricingActions {}

const PricingContext = createContext<PricingContextValue | undefined>(undefined);

// ============================================
// STORE PROVIDER
// ============================================

interface PricingProviderProps {
  children: ReactNode;
  initialPlans?: PricingPlan[];
}

export function PricingProvider({ children, initialPlans }: PricingProviderProps) {
  const [state, setState] = useState<PricingState>({
    plans: initialPlans || [],
    selectedPlan: null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isArchiving: false,
    error: null,
    filters: {},
  });

  // ============================================
  // LOAD PLANS
  // ============================================

  const loadPlans = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await pricingAPI.getPlans();

      if (result.success) {
        setState((prev) => ({
          ...prev,
          plans: result.data,
          isLoading: false,
        }));
      } else {
        // Use mock data as fallback
        const mockPlans = generateMockPlans(5);
        setState((prev) => ({
          ...prev,
          plans: mockPlans,
          isLoading: false,
          error: result.error,
        }));
      }
    } catch (error) {
      console.error('[PricingStore] Failed to load plans:', error);
      // Use mock data as fallback
      const mockPlans = generateMockPlans(5);
      setState((prev) => ({
        ...prev,
        plans: mockPlans,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load plans',
      }));
    }
  }, []);

  // ============================================
  // LOAD SINGLE PLAN
  // ============================================

  const loadPlan = useCallback(async (planId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await pricingAPI.getPlan(planId);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          selectedPlan: result.data,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Plan not found',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load plan',
      }));
    }
  }, []);

  // ============================================
  // CREATE PLAN
  // ============================================

  const createPlan = useCallback(async (
    request: PlanChangeRequest,
    userId: string
  ): Promise<{ success: boolean; plan: PricingPlan | null; error: string | null }> => {
    setState((prev) => ({ ...prev, isCreating: true, error: null }));

    try {
      // Validate before creating
      const validation = pricingValidationEngine.validate(request, {
        existingPlans: state.plans,
        isUpdate: false,
      });

      if (!validation.isValid) {
        setState((prev) => ({
          ...prev,
          isCreating: false,
          error: validation.errors.map((e) => e.message).join(', '),
        }));
        return {
          success: false,
          plan: null,
          error: validation.errors.map((e) => e.message).join(', '),
        };
      }

      // Create plan
      const result = await pricingAPI.createPlan(request);

      if (result.success && result.data) {
        // Optimistic update
        setState((prev) => ({
          ...prev,
          plans: [...prev.plans, result.data!],
          isCreating: false,
        }));

        // Emit event
        pricingEventEmitter.emitCreated(result.data, userId);

        return {
          success: true,
          plan: result.data,
          error: null,
        };
      } else {
        setState((prev) => ({
          ...prev,
          isCreating: false,
          error: result.error || 'Failed to create plan',
        }));
        return {
          success: false,
          plan: null,
          error: result.error || 'Failed to create plan',
        };
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isCreating: false,
        error: error instanceof Error ? error.message : 'Failed to create plan',
      }));
      return {
        success: false,
        plan: null,
        error: error instanceof Error ? error.message : 'Failed to create plan',
      };
    }
  }, [state.plans]);

  // ============================================
  // UPDATE PLAN
  // ============================================

  const updatePlan = useCallback(async (
    planId: string,
    request: PlanChangeRequest,
    userId: string
  ): Promise<{ success: boolean; plan: PricingPlan | null; error: string | null }> => {
    setState((prev) => ({ ...prev, isUpdating: true, error: null }));

    try {
      const oldPlan = state.plans.find((p) => p.id === planId) || null;

      // Validate before updating
      const validation = pricingValidationEngine.validate(request, {
        existingPlans: state.plans,
        isUpdate: true,
        planId,
      });

      if (!validation.isValid) {
        setState((prev) => ({
          ...prev,
          isUpdating: false,
          error: validation.errors.map((e) => e.message).join(', '),
        }));
        return {
          success: false,
          plan: null,
          error: validation.errors.map((e) => e.message).join(', '),
        };
      }

      // Update plan
      const result = await pricingAPI.updatePlan(planId, request);

      if (result.success && result.data) {
        // Optimistic update
        setState((prev) => ({
          ...prev,
          plans: prev.plans.map((p) => (p.id === planId ? result.data! : p)),
          selectedPlan: prev.selectedPlan?.id === planId ? result.data! : prev.selectedPlan,
          isUpdating: false,
        }));

        // Emit event
        pricingEventEmitter.emitUpdated(result.data, oldPlan || undefined, userId);

        return {
          success: true,
          plan: result.data,
          error: null,
        };
      } else {
        setState((prev) => ({
          ...prev,
          isUpdating: false,
          error: result.error || 'Failed to update plan',
        }));
        return {
          success: false,
          plan: null,
          error: result.error || 'Failed to update plan',
        };
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update plan',
      }));
      return {
        success: false,
        plan: null,
        error: error instanceof Error ? error.message : 'Failed to update plan',
      };
    }
  }, [state.plans, state.selectedPlan]);

  // ============================================
  // ARCHIVE PLAN
  // ============================================

  const archivePlan = useCallback(async (
    planId: string,
    userId: string
  ): Promise<{ success: boolean; plan: PricingPlan | null; error: string | null }> => {
    setState((prev) => ({ ...prev, isArchiving: true, error: null }));

    try {
      const oldPlan = state.plans.find((p) => p.id === planId) || null;

      const result = await pricingAPI.archivePlan(planId);

      if (result.success && result.data) {
        // Optimistic update
        setState((prev) => ({
          ...prev,
          plans: prev.plans.map((p) => (p.id === planId ? result.data! : p)),
          selectedPlan: prev.selectedPlan?.id === planId ? result.data! : prev.selectedPlan,
          isArchiving: false,
        }));

        // Emit event
        pricingEventEmitter.emitArchived(result.data, oldPlan || undefined, userId);

        return {
          success: true,
          plan: result.data,
          error: null,
        };
      } else {
        setState((prev) => ({
          ...prev,
          isArchiving: false,
          error: result.error || 'Failed to archive plan',
        }));
        return {
          success: false,
          plan: null,
          error: result.error || 'Failed to archive plan',
        };
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isArchiving: false,
        error: error instanceof Error ? error.message : 'Failed to archive plan',
      }));
      return {
        success: false,
        plan: null,
        error: error instanceof Error ? error.message : 'Failed to archive plan',
      };
    }
  }, [state.plans, state.selectedPlan]);

  // ============================================
  // RESTORE PLAN
  // ============================================

  const restorePlan = useCallback(async (
    planId: string,
    userId: string
  ): Promise<{ success: boolean; plan: PricingPlan | null; error: string | null }> => {
    setState((prev) => ({ ...prev, isUpdating: true, error: null }));

    try {
      const oldPlan = state.plans.find((p) => p.id === planId) || null;

      const result = await pricingAPI.restorePlan(planId);

      if (result.success && result.data) {
        // Optimistic update
        setState((prev) => ({
          ...prev,
          plans: prev.plans.map((p) => (p.id === planId ? result.data! : p)),
          selectedPlan: prev.selectedPlan?.id === planId ? result.data! : prev.selectedPlan,
          isUpdating: false,
        }));

        // Emit event
        pricingEventEmitter.emitRestored(result.data, oldPlan || undefined, userId);

        return {
          success: true,
          plan: result.data,
          error: null,
        };
      } else {
        setState((prev) => ({
          ...prev,
          isUpdating: false,
          error: result.error || 'Failed to restore plan',
        }));
        return {
          success: false,
          plan: null,
          error: result.error || 'Failed to restore plan',
        };
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to restore plan',
      }));
      return {
        success: false,
        plan: null,
        error: error instanceof Error ? error.message : 'Failed to restore plan',
      };
    }
  }, [state.plans, state.selectedPlan]);

  // ============================================
  // SELECT PLAN
  // ============================================

  const selectPlan = useCallback((plan: PricingPlan | null) => {
    setState((prev) => ({ ...prev, selectedPlan: plan }));
  }, []);

  // ============================================
  // SET FILTERS
  // ============================================

  const setFilters = useCallback((filters: { status?: PricingStatus; search?: string }) => {
    setState((prev) => ({ ...prev, filters }));
  }, []);

  // ============================================
  // CLEAR ERROR
  // ============================================

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ============================================
  // REFRESH PLANS
  // ============================================

  const refreshPlans = useCallback(async () => {
    await loadPlans();
  }, [loadPlans]);

  // ============================================
  // GET FILTERED PLANS
  // ============================================

  const getFilteredPlans = useCallback(() => {
    let filtered = [...state.plans];

    if (state.filters.status) {
      filtered = filtered.filter((p) => p.status === state.filters.status);
    }

    if (state.filters.search) {
      const searchLower = state.filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [state.plans, state.filters]);

  const contextValue: PricingContextValue = {
    ...state,
    loadPlans,
    loadPlan,
    createPlan,
    updatePlan,
    archivePlan,
    restorePlan,
    selectPlan,
    setFilters,
    clearError,
    refreshPlans,
  };

  return (
    <PricingContext.Provider value={contextValue}>
      {children}
    </PricingContext.Provider>
  );
}

// ============================================
// USE PRICING STORE HOOK
// ============================================

export function usePricingStore(): PricingContextValue {
  const context = useContext(PricingContext);

  if (context === undefined) {
    throw new Error('usePricingStore must be used within a PricingProvider');
  }

  return context;
}

// ============================================
// HELPER HOOK FOR FILTERED PLANS
// ============================================

export function useFilteredPlans() {
  const { plans, filters } = usePricingStore();

  const filtered = plans.filter((plan) => {
    if (filters.status && plan.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !plan.name.toLowerCase().includes(searchLower) &&
        !plan.description?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    return true;
  });

  return filtered;
}
