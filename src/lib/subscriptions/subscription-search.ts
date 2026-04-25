// Subscription Search Engine
// Debounce 300ms, search by customer name, email, subscription id

import type { Subscription, SubscriptionSearchFilters, SubscriptionSearchResult } from './subscription-types';

// ============================================
// SUBSCRIPTION SEARCH ENGINE
// ============================================

export class SubscriptionSearchEngine {
  // ============================================
  // SEARCH SUBSCRIPTIONS
  // ============================================

  searchSubscriptions(subscriptions: Subscription[], filters: SubscriptionSearchFilters): SubscriptionSearchResult {
    let filtered = [...subscriptions];

    // Text search (customer name, email, subscription id)
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter((subscription) =>
        subscription.id.toLowerCase().includes(query) ||
        subscription.customerId.toLowerCase().includes(query) ||
        subscription.pricingId.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((subscription) => subscription.status === filters.status);
    }

    // Customer filter
    if (filters.customerId) {
      filtered = filtered.filter((subscription) => subscription.customerId === filters.customerId);
    }

    // Provider filter
    if (filters.provider) {
      filtered = filtered.filter((subscription) => subscription.provider === filters.provider);
    }

    // Billing cycle filter
    if (filters.billingCycle) {
      filtered = filtered.filter((subscription) => subscription.billingCycle === filters.billingCycle);
    }

    // Sort
    if (filters.sortBy) {
      filtered = this.sortSubscriptions(filtered, filters.sortBy, filters.sortOrder || 'desc');
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      subscriptions: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ============================================
  // SORT SUBSCRIPTIONS
  // ============================================

  private sortSubscriptions(subscriptions: Subscription[], sortBy: string, sortOrder: 'asc' | 'desc'): Subscription[] {
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

    return sorted;
  }

  // ============================================
  // SEARCH BY CUSTOMER ID
  // ============================================

  searchByCustomerId(subscriptions: Subscription[], customerId: string): Subscription[] {
    return subscriptions.filter((subscription) => subscription.customerId === customerId);
  }

  // ============================================
  // SEARCH BY SUBSCRIPTION ID
  // ============================================

  searchBySubscriptionId(subscriptions: Subscription[], subscriptionId: string): Subscription[] {
    const query = subscriptionId.toLowerCase();
    return subscriptions.filter((subscription) => subscription.id.toLowerCase().includes(query));
  }

  // ============================================
  // FUZZY SEARCH
  // ============================================

  fuzzySearch(subscriptions: Subscription[], query: string): Subscription[] {
    const terms = query.toLowerCase().split(' ');
    const scored: { subscription: Subscription; score: number }[] = [];

    for (const subscription of subscriptions) {
      let score = 0;
      const searchableText = `${subscription.id} ${subscription.customerId} ${subscription.pricingId}`.toLowerCase();

      for (const term of terms) {
        if (subscription.id.toLowerCase().includes(term)) {
          score += 10;
        }
        if (subscription.customerId.toLowerCase().includes(term)) {
          score += 8;
        }
        if (subscription.pricingId.toLowerCase().includes(term)) {
          score += 6;
        }
        if (searchableText.includes(term)) {
          score += 3;
        }
      }

      if (score > 0) {
        scored.push({ subscription, score });
      }
    }

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    return scored.map((s) => s.subscription);
  }

  // ============================================
  // GET SEARCH SUGGESTIONS
  // ============================================

  getSearchSuggestions(subscriptions: Subscription[], query: string, limit: number = 5): Array<{
    type: 'subscriptionId' | 'customerId' | 'pricingId';
    value: string;
    subscription: Subscription;
  }> {
    const suggestions: Array<{
      type: 'subscriptionId' | 'customerId' | 'pricingId';
      value: string;
      subscription: Subscription;
    }> = [];

    const lowerQuery = query.toLowerCase();

    for (const subscription of subscriptions) {
      // Subscription ID suggestions
      if (subscription.id.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'subscriptionId',
          value: subscription.id,
          subscription,
        });
      }

      // Customer ID suggestions
      if (subscription.customerId.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'customerId',
          value: subscription.customerId,
          subscription,
        });
      }

      // Pricing ID suggestions
      if (subscription.pricingId.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'pricingId',
          value: subscription.pricingId,
          subscription,
        });
      }
    }

    // Remove duplicates and limit
    const unique = new Map<string, typeof suggestions[0]>();
    for (const suggestion of suggestions) {
      const key = `${suggestion.type}:${suggestion.value}`;
      if (!unique.has(key)) {
        unique.set(key, suggestion);
      }
    }

    return Array.from(unique.values()).slice(0, limit);
  }

  // ============================================
  // GET FILTERED COUNTS
  // ============================================

  getFilteredCounts(subscriptions: Subscription[]): {
    total: number;
    active: number;
    trialing: number;
    past_due: number;
    canceled: number;
    paused: number;
  } {
    return {
      total: subscriptions.length,
      active: subscriptions.filter((s) => s.status === 'active').length,
      trialing: subscriptions.filter((s) => s.status === 'trialing').length,
      past_due: subscriptions.filter((s) => s.status === 'past_due').length,
      canceled: subscriptions.filter((s) => s.status === 'canceled').length,
      paused: subscriptions.filter((s) => s.status === 'paused').length,
    };
  }

  // ============================================
  // GET BILLING DUE SOON
  // ============================================

  getBillingDueSoon(subscriptions: Subscription[], days: number = 7): Subscription[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return subscriptions.filter((subscription) => {
      const nextBilling = new Date(subscription.nextBillingAt);
      return subscription.status === 'active' && nextBilling <= cutoff && nextBilling > now;
    });
  }

  // ============================================
  // GET TRIAL ENDING SOON
  // ============================================

  getTrialEndingSoon(subscriptions: Subscription[], days: number = 3): Subscription[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return subscriptions.filter((subscription) => {
      if (!subscription.trialEnd || subscription.status !== 'trialing') return false;
      const trialEnd = new Date(subscription.trialEnd);
      return trialEnd <= cutoff && trialEnd > now;
    });
  }
}

// Export singleton instance
export const subscriptionSearchEngine = new SubscriptionSearchEngine();

// ============================================
// REACT HOOK FOR SUBSCRIPTION SEARCH WITH DEBOUNCE
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';

export function useSubscriptionSearch(subscriptions: Subscription[]) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SubscriptionSearchResult | null>(null);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const searchSubscriptions = useCallback((filters: SubscriptionSearchFilters) => {
    setIsSearching(true);
    try {
      const result = subscriptionSearchEngine.searchSubscriptions(subscriptions, filters);
      setSearchResults(result);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, [subscriptions]);

  const debouncedSearch = useCallback((filters: SubscriptionSearchFilters) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchSubscriptions(filters);
    }, 300);
  }, [searchSubscriptions]);

  const searchByCustomerId = useCallback((customerId: string) => {
    setIsSearching(true);
    try {
      const result = subscriptionSearchEngine.searchByCustomerId(subscriptions, customerId);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, [subscriptions]);

  const fuzzySearch = useCallback((query: string) => {
    setIsSearching(true);
    try {
      const result = subscriptionSearchEngine.fuzzySearch(subscriptions, query);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, [subscriptions]);

  const getSearchSuggestions = useCallback((query: string, limit?: number) => {
    return subscriptionSearchEngine.getSearchSuggestions(subscriptions, query, limit);
  }, [subscriptions]);

  const getBillingDueSoon = useCallback((days?: number) => {
    return subscriptionSearchEngine.getBillingDueSoon(subscriptions, days);
  }, [subscriptions]);

  const getTrialEndingSoon = useCallback((days?: number) => {
    return subscriptionSearchEngine.getTrialEndingSoon(subscriptions, days);
  }, [subscriptions]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    isSearching,
    searchResults,
    query,
    setQuery,
    searchSubscriptions,
    debouncedSearch,
    searchByCustomerId,
    fuzzySearch,
    getSearchSuggestions,
    getBillingDueSoon,
    getTrialEndingSoon,
  };
}
