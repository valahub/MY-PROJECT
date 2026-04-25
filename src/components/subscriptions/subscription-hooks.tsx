// Subscription UI Hooks
// React hooks for subscription UI components

import { useState, useCallback, useEffect } from 'react';
import type { Subscription, SubscriptionStatus } from '../../lib/subscriptions/subscription-types';

// ============================================
// SUBSCRIPTION STATUS BADGE HOOK
// ============================================

export function useSubscriptionStatusBadge(status: SubscriptionStatus) {
  const getStatusColor = useCallback(() => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, [status]);

  const getStatusLabel = useCallback(() => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'past_due':
        return 'Past Due';
      case 'canceled':
        return 'Canceled';
      case 'paused':
        return 'Paused';
      default:
        return 'Unknown';
    }
  }, [status]);

  const getStatusIcon = useCallback(() => {
    switch (status) {
      case 'active':
        return '●';
      case 'trialing':
        return '●';
      case 'past_due':
        return '●';
      case 'canceled':
        return '●';
      case 'paused':
        return '○';
      default:
        return '?';
    }
  }, [status]);

  return {
    color: getStatusColor(),
    label: getStatusLabel(),
    icon: getStatusIcon(),
  };
}

// ============================================
// SUBSCRIPTION SELECTION HOOK
// ============================================

export function useSubscriptionSelection(subscriptions: Subscription[]) {
  const [selectedSubscriptionIds, setSelectedSubscriptionIds] = useState<Set<string>>(new Set());

  const toggleSubscriptionSelection = useCallback((subscriptionId: string) => {
    setSelectedSubscriptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(subscriptionId)) {
        next.delete(subscriptionId);
      } else {
        next.add(subscriptionId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedSubscriptionIds(new Set(subscriptions.map((s) => s.id)));
  }, [subscriptions]);

  const clearSelection = useCallback(() => {
    setSelectedSubscriptionIds(new Set());
  }, []);

  const selectedSubscriptions = subscriptions.filter((s) => selectedSubscriptionIds.has(s.id));
  const isAllSelected = selectedSubscriptionIds.size === subscriptions.length && subscriptions.length > 0;
  const isSomeSelected = selectedSubscriptionIds.size > 0;

  return {
    selectedSubscriptionIds,
    selectedSubscriptions,
    isAllSelected,
    isSomeSelected,
    toggleSubscriptionSelection,
    selectAll,
    clearSelection,
  };
}

// ============================================
// SUBSCRIPTION SORT HOOK
// ============================================

export function useSubscriptionSort(subscriptions: Subscription[]) {
  const [sortBy, setSortBy] = useState<'createdAt' | 'mrr' | 'nextBillingAt' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortedSubscriptions, setSortedSubscriptions] = useState<Subscription[]>(subscriptions);

  const sortSubscriptions = useCallback(() => {
    const sorted = [...subscriptions];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'mrr':
          comparison = a.mrr - b.mrr;
          break;
        case 'nextBillingAt':
          comparison = new Date(a.nextBillingAt).getTime() - new Date(b.nextBillingAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setSortedSubscriptions(sorted);
  }, [subscriptions, sortBy, sortOrder]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder]);

  return {
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSortOrder,
    sortedSubscriptions,
  };
}

// ============================================
// SUBSCRIPTION PAGINATION HOOK
// ============================================

export function useSubscriptionPagination(subscriptions: Subscription[], pageSize: number = 20) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(subscriptions.length / pageSize);

  const paginatedSubscriptions = subscriptions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    resetPagination();
  }, [subscriptions.length, resetPagination]);

  return {
    currentPage,
    totalPages,
    paginatedSubscriptions,
    goToPage,
    nextPage,
    previousPage,
    resetPagination,
  };
}

// ============================================
// SUBSCRIPTION DETAILS HOOK
// ============================================

export function useSubscriptionDetails(subscriptionId: string, subscriptions: Subscription[]) {
  const subscription = subscriptions.find((s) => s.id === subscriptionId);

  const getDaysUntilBilling = useCallback(() => {
    if (!subscription) return null;
    const now = new Date();
    const nextBilling = new Date(subscription.nextBillingAt);
    const daysUntilBilling = Math.floor((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilBilling;
  }, [subscription]);

  const getDaysSinceCreated = useCallback(() => {
    if (!subscription) return null;
    const now = new Date();
    const created = new Date(subscription.createdAt);
    const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreated;
  }, [subscription]);

  return {
    subscription,
    getDaysUntilBilling,
    getDaysSinceCreated,
  };
}

// ============================================
// SUBSCRIPTION FILTER HOOK
// ============================================

export function useSubscriptionFilter(subscriptions: Subscription[]) {
  const [filters, setFilters] = useState({
    status: 'all' as SubscriptionStatus | 'all',
    provider: 'all' as 'stripe' | 'razorpay' | 'all',
    billingCycle: 'all' as 'monthly' | 'yearly' | 'all',
  });

  const filteredSubscriptions = useCallback(() => {
    let result = subscriptions;

    if (filters.status !== 'all') {
      result = result.filter((s) => s.status === filters.status);
    }

    if (filters.provider !== 'all') {
      result = result.filter((s) => s.provider === filters.provider);
    }

    if (filters.billingCycle !== 'all') {
      result = result.filter((s) => s.billingCycle === filters.billingCycle);
    }

    return result;
  }, [subscriptions, filters]);

  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      provider: 'all',
      billingCycle: 'all',
    });
  }, []);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== 'all'
  ).length;

  return {
    filters,
    setFilters,
    filteredSubscriptions: filteredSubscriptions(),
    clearFilters,
    activeFilterCount,
  };
}

// ============================================
// SUBSCRIPTION BILLING WARNING HOOK
// ============================================

export function useSubscriptionBillingWarning(subscription: Subscription) {
  const getBillingWarning = useCallback(() => {
    if (subscription.status !== 'active') return null;

    const now = new Date();
    const nextBilling = new Date(subscription.nextBillingAt);
    const daysUntilBilling = Math.floor((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilBilling < 0) {
      return { type: 'overdue', days: Math.abs(daysUntilBilling) };
    } else if (daysUntilBilling <= 3) {
      return { type: 'critical', days: daysUntilBilling };
    } else if (daysUntilBilling <= 7) {
      return { type: 'warning', days: daysUntilBilling };
    }

    return null;
  }, [subscription]);

  return {
    getBillingWarning,
  };
}

// ============================================
// SUBSCRIPTION ACTION AVAILABILITY HOOK
// ============================================

export function useSubscriptionActionAvailability(subscription: Subscription) {
  const canPause = subscription.status === 'active';
  const canResume = subscription.status === 'paused';
  const canCancel = ['trialing', 'active', 'past_due', 'paused'].includes(subscription.status);
  const canReactivate = subscription.status === 'past_due';
  const canChangePlan = subscription.status === 'active' || subscription.status === 'trialing';

  return {
    canPause,
    canResume,
    canCancel,
    canReactivate,
    canChangePlan,
  };
}
