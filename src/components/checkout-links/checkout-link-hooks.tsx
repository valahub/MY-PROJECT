// Checkout Link UI Hooks
// React hooks for checkout link UI components

import { useState, useCallback } from 'react';
import type { CheckoutLink, CheckoutLinkStatus } from '../../lib/checkout-links/checkout-link-types';

// ============================================
// CHECKOUT LINK STATUS BADGE HOOK
// ============================================

export function useCheckoutLinkStatusBadge(status: CheckoutLinkStatus) {
  const getStatusColor = useCallback(() => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, [status]);

  const getStatusLabel = useCallback(() => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  }, [status]);

  const getStatusIcon = useCallback(() => {
    switch (status) {
      case 'active':
        return '●';
      case 'inactive':
        return '○';
      case 'expired':
        return '✗';
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
// CHECKOUT LINK SELECTION HOOK
// ============================================

export function useCheckoutLinkSelection(checkoutLinks: CheckoutLink[]) {
  const [selectedCheckoutLinkIds, setSelectedCheckoutLinkIds] = useState<Set<string>>(new Set());

  const toggleCheckoutLinkSelection = useCallback((checkoutLinkId: string) => {
    setSelectedCheckoutLinkIds((prev) => {
      const next = new Set(prev);
      if (next.has(checkoutLinkId)) {
        next.delete(checkoutLinkId);
      } else {
        next.add(checkoutLinkId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedCheckoutLinkIds(new Set(checkoutLinks.map((l) => l.id)));
  }, [checkoutLinks]);

  const clearSelection = useCallback(() => {
    setSelectedCheckoutLinkIds(new Set());
  }, []);

  const selectedCheckoutLinks = checkoutLinks.filter((l) => selectedCheckoutLinkIds.has(l.id));
  const isAllSelected = selectedCheckoutLinkIds.size === checkoutLinks.length && checkoutLinks.length > 0;
  const isSomeSelected = selectedCheckoutLinkIds.size > 0;

  return {
    selectedCheckoutLinkIds,
    selectedCheckoutLinks,
    isAllSelected,
    isSomeSelected,
    toggleCheckoutLinkSelection,
    selectAll,
    clearSelection,
  };
}

// ============================================
// CHECKOUT LINK SORT HOOK
// ============================================

export function useCheckoutLinkSort(checkoutLinks: CheckoutLink[]) {
  const [sortBy, setSortBy] = useState<'createdAt' | 'viewCount' | 'conversionCount' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortedCheckoutLinks, setSortedCheckoutLinks] = useState<CheckoutLink[]>(checkoutLinks);

  const sortCheckoutLinks = useCallback(() => {
    const sorted = [...checkoutLinks];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'viewCount':
          comparison = a.viewCount - b.viewCount;
          break;
        case 'conversionCount':
          comparison = a.conversionCount - b.conversionCount;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setSortedCheckoutLinks(sorted);
  }, [checkoutLinks, sortBy, sortOrder]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder]);

  return {
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSortOrder,
    sortedCheckoutLinks,
  };
}

// ============================================
// CHECKOUT LINK DETAILS HOOK
// ============================================

export function useCheckoutLinkDetails(checkoutLinkId: string, checkoutLinks: CheckoutLink[]) {
  const checkoutLink = checkoutLinks.find((l) => l.id === checkoutLinkId);

  const getDaysSinceCreated = useCallback(() => {
    if (!checkoutLink) return null;
    const now = new Date();
    const created = new Date(checkoutLink.createdAt);
    const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreated;
  }, [checkoutLink]);

  const getDaysUntilExpiry = useCallback(() => {
    if (!checkoutLink || !checkoutLink.expiresAt) return null;
    const now = new Date();
    const expiry = new Date(checkoutLink.expiresAt);
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry;
  }, [checkoutLink]);

  const getConversionRate = useCallback(() => {
    if (!checkoutLink || checkoutLink.viewCount === 0) return 0;
    return (checkoutLink.conversionCount / checkoutLink.viewCount) * 100;
  }, [checkoutLink]);

  return {
    checkoutLink,
    getDaysSinceCreated,
    getDaysUntilExpiry,
    getConversionRate,
  };
}

// ============================================
// CHECKOUT LINK FILTER HOOK
// ============================================

export function useCheckoutLinkFilter(checkoutLinks: CheckoutLink[]) {
  const [filters, setFilters] = useState({
    status: 'all' as CheckoutLinkStatus | 'all',
    productId: 'all' as string,
  });

  const filteredCheckoutLinks = useCallback(() => {
    let result = checkoutLinks;

    if (filters.status !== 'all') {
      result = result.filter((l) => l.status === filters.status);
    }

    if (filters.productId !== 'all') {
      result = result.filter((l) => l.productId === filters.productId);
    }

    return result;
  }, [checkoutLinks, filters]);

  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      productId: 'all',
    });
  }, []);

  const activeFilterCount = Object.values(filters).filter((v) => v !== 'all').length;

  return {
    filters,
    setFilters,
    filteredCheckoutLinks: filteredCheckoutLinks(),
    clearFilters,
    activeFilterCount,
  };
}

// ============================================
// CHECKOUT LINK ACTION AVAILABILITY HOOK
// ============================================

export function useCheckoutLinkActionAvailability(checkoutLink: CheckoutLink) {
  const canActivate = checkoutLink.status === 'inactive' || checkoutLink.status === 'expired';
  const canDeactivate = checkoutLink.status === 'active';
  const canDelete = true;
  const canEdit = true;
  const canCopy = true;

  return {
    canActivate,
    canDeactivate,
    canDelete,
    canEdit,
    canCopy,
  };
}

// ============================================
// CHECKOUT LINK COPY TO CLIPBOARD HOOK
// ============================================

export function useCopyToClipboard() {
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
