// Merchant Pricing UI Hooks
// React hooks for merchant pricing UI components

import { useState, useCallback } from 'react';
import type { MerchantPricingPlan, MerchantRole, PricingStatus, MerchantCurrency } from '../../lib/merchant-pricing/merchant-pricing-types';

// ============================================
// MERCHANT PRICING STATUS BADGE HOOK
// ============================================

export function useMerchantPricingStatusBadge(status: PricingStatus) {
  const getStatusColor = useCallback(() => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, [status]);

  const getStatusLabel = useCallback(() => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'archived':
        return 'Archived';
      case 'draft':
        return 'Draft';
      default:
        return 'Unknown';
    }
  }, [status]);

  return {
    color: getStatusColor(),
    label: getStatusLabel(),
  };
}

// ============================================
// MERCHANT PRICING SELECTION HOOK
// ============================================

export function useMerchantPricingSelection(pricingPlans: MerchantPricingPlan[]) {
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());

  const togglePlanSelection = useCallback((planId: string) => {
    setSelectedPlanIds((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) {
        next.delete(planId);
      } else {
        next.add(planId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedPlanIds(new Set(pricingPlans.map((p) => p.id)));
  }, [pricingPlans]);

  const clearSelection = useCallback(() => {
    setSelectedPlanIds(new Set());
  }, []);

  const selectedPlans = pricingPlans.filter((p) => selectedPlanIds.has(p.id));
  const isAllSelected = selectedPlanIds.size === pricingPlans.length && pricingPlans.length > 0;
  const isSomeSelected = selectedPlanIds.size > 0;

  return {
    selectedPlanIds,
    selectedPlans,
    isAllSelected,
    isSomeSelected,
    togglePlanSelection,
    selectAll,
    clearSelection,
  };
}

// ============================================
// MERCHANT PRICING SORT HOOK
// ============================================

export function useMerchantPricingSort(pricingPlans: MerchantPricingPlan[]) {
  const [sortBy, setSortBy] = useState<'createdAt' | 'amount' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortedPlans, setSortedPlans] = useState<MerchantPricingPlan[]>(pricingPlans);

  const sortPlans = useCallback(() => {
    const sorted = [...pricingPlans];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setSortedPlans(sorted);
  }, [pricingPlans, sortBy, sortOrder]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder]);

  return {
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSortOrder,
    sortedPlans,
  };
}

// ============================================
// MERCHANT PRICING FILTER HOOK
// ============================================

export function useMerchantPricingFilter(pricingPlans: MerchantPricingPlan[]) {
  const [filters, setFilters] = useState({
    status: 'all' as PricingStatus | 'all',
    currency: 'all' as MerchantCurrency | 'all',
    interval: 'all' as string,
  });

  const filteredPlans = useCallback(() => {
    let result = pricingPlans;

    if (filters.status !== 'all') {
      result = result.filter((p) => p.status === filters.status);
    }

    if (filters.currency !== 'all') {
      result = result.filter((p) => p.currency === filters.currency);
    }

    if (filters.interval !== 'all') {
      result = result.filter((p) => p.interval === filters.interval);
    }

    return result;
  }, [pricingPlans, filters]);

  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      currency: 'all',
      interval: 'all',
    });
  }, []);

  const activeFilterCount = Object.values(filters).filter((v) => v !== 'all').length;

  return {
    filters,
    setFilters,
    filteredPlans: filteredPlans(),
    clearFilters,
    activeFilterCount,
  };
}

// ============================================
// MERCHANT PRICING ACTION AVAILABILITY HOOK
// ============================================

export function useMerchantPricingActionAvailability(plan: MerchantPricingPlan, userRole: MerchantRole) {
  const canActivate = plan.status === 'archived' || plan.status === 'draft';
  const canArchive = plan.status === 'active';
  const canEdit = plan.status !== 'archived';
  const canDelete = true;

  // Role-based permissions
  const ownerCanDelete = userRole === 'owner';
  const managerCanEdit = userRole === 'owner' || userRole === 'manager';
  const staffCanView = userRole === 'staff';

  return {
    canActivate: canActivate && managerCanEdit,
    canArchive: canArchive && managerCanEdit,
    canEdit: canEdit && managerCanEdit,
    canDelete: canDelete && ownerCanDelete,
    canView: staffCanView,
  };
}

// ============================================
// MERCHANT PRICING CREATE FORM HOOK
// ============================================

export function useMerchantPricingCreateForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: 0,
    currency: 'USD' as MerchantCurrency,
    interval: 'monthly' as string,
    trialDays: 0,
    features: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (formData.trialDays < 0) {
      newErrors.trialDays = 'Trial days cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      amount: 0,
      currency: 'USD',
      interval: 'monthly',
      trialDays: 0,
      features: [],
    });
    setErrors({});
  }, []);

  const addFeature = useCallback((feature: string) => {
    if (feature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, feature.trim()],
      }));
    }
  }, []);

  const removeFeature = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  }, []);

  return {
    formData,
    setFormData,
    errors,
    isSubmitting,
    setIsSubmitting,
    validateForm,
    resetForm,
    addFeature,
    removeFeature,
  };
}

// ============================================
// MERCHANT PRICING COPY TO CLIPBOARD HOOK
// ============================================

export function useMerchantCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, []);

  return {
    isCopied,
    copyToClipboard,
  };
}

// ============================================
// MERCHANT PRICING ANALYTICS HOOK
// ============================================

export function useMerchantPricingAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const getPeriodDays = useCallback(() => {
    switch (selectedPeriod) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      case '1y':
        return 365;
      default:
        return 30;
    }
  }, [selectedPeriod]);

  return {
    selectedPeriod,
    setSelectedPeriod,
    getPeriodDays,
  };
}
