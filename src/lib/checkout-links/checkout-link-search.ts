// Checkout Link Search Engine
// Debounced search

import type { CheckoutLink, CheckoutLinkSearchFilters, CheckoutLinkSearchResult } from './checkout-link-types';

// ============================================
// CHECKOUT LINK SEARCH ENGINE
// ============================================

export class CheckoutLinkSearchEngine {
  // ============================================
  // SEARCH CHECKOUT LINKS
  // ============================================

  searchCheckoutLinks(checkoutLinks: CheckoutLink[], filters: CheckoutLinkSearchFilters): CheckoutLinkSearchResult {
    let filtered = [...checkoutLinks];

    // Text search (name, slug)
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter((link) =>
        link.name.toLowerCase().includes(query) ||
        link.slug.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((link) => link.status === filters.status);
    }

    // Product filter
    if (filters.productId) {
      filtered = filtered.filter((link) => link.productId === filters.productId);
    }

    // Pricing filter
    if (filters.pricingId) {
      filtered = filtered.filter((link) => link.pricingId === filters.pricingId);
    }

    // Sort
    if (filters.sortBy) {
      filtered = this.sortCheckoutLinks(filtered, filters.sortBy, filters.sortOrder || 'desc');
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      links: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ============================================
  // SORT CHECKOUT LINKS
  // ============================================

  private sortCheckoutLinks(checkoutLinks: CheckoutLink[], sortBy: string, sortOrder: 'asc' | 'desc'): CheckoutLink[] {
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

    return sorted;
  }

  // ============================================
  // SEARCH BY SLUG
  // ============================================

  searchBySlug(checkoutLinks: CheckoutLink[], slug: string): CheckoutLink[] {
    const query = slug.toLowerCase();
    return checkoutLinks.filter((link) => link.slug.toLowerCase().includes(query));
  }

  // ============================================
  // FUZZY SEARCH
  // ============================================

  fuzzySearch(checkoutLinks: CheckoutLink[], query: string): CheckoutLink[] {
    const terms = query.toLowerCase().split(' ');
    const scored: { link: CheckoutLink; score: number }[] = [];

    for (const link of checkoutLinks) {
      let score = 0;
      const searchableText = `${link.name} ${link.slug}`.toLowerCase();

      for (const term of terms) {
        if (link.name.toLowerCase().includes(term)) {
          score += 10;
        }
        if (link.slug.toLowerCase().includes(term)) {
          score += 8;
        }
        if (searchableText.includes(term)) {
          score += 3;
        }
      }

      if (score > 0) {
        scored.push({ link, score });
      }
    }

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    return scored.map((s) => s.link);
  }

  // ============================================
  // GET SEARCH SUGGESTIONS
  // ============================================

  getSearchSuggestions(checkoutLinks: CheckoutLink[], query: string, limit: number = 5): Array<{
    type: 'name' | 'slug';
    value: string;
    link: CheckoutLink;
  }> {
    const suggestions: Array<{
      type: 'name' | 'slug';
      value: string;
      link: CheckoutLink;
    }> = [];

    const lowerQuery = query.toLowerCase();

    for (const link of checkoutLinks) {
      // Name suggestions
      if (link.name.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'name',
          value: link.name,
          link,
        });
      }

      // Slug suggestions
      if (link.slug.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'slug',
          value: link.slug,
          link,
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

  getFilteredCounts(checkoutLinks: CheckoutLink[]): {
    total: number;
    active: number;
    inactive: number;
    expired: number;
  } {
    return {
      total: checkoutLinks.length,
      active: checkoutLinks.filter((l) => l.status === 'active').length,
      inactive: checkoutLinks.filter((l) => l.status === 'inactive').length,
      expired: checkoutLinks.filter((l) => l.status === 'expired').length,
    };
  }
}

// Export singleton instance
export const checkoutLinkSearchEngine = new CheckoutLinkSearchEngine();

// ============================================
// REACT HOOK FOR CHECKOUT LINK SEARCH WITH DEBOUNCE
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';

export function useCheckoutLinkSearch(checkoutLinks: CheckoutLink[]) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CheckoutLinkSearchResult | null>(null);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const searchCheckoutLinks = useCallback((filters: CheckoutLinkSearchFilters) => {
    setIsSearching(true);
    try {
      const result = checkoutLinkSearchEngine.searchCheckoutLinks(checkoutLinks, filters);
      setSearchResults(result);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, [checkoutLinks]);

  const debouncedSearch = useCallback((filters: CheckoutLinkSearchFilters) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchCheckoutLinks(filters);
    }, 300);
  }, [searchCheckoutLinks]);

  const searchBySlug = useCallback((slug: string) => {
    setIsSearching(true);
    try {
      const result = checkoutLinkSearchEngine.searchBySlug(checkoutLinks, slug);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, [checkoutLinks]);

  const fuzzySearch = useCallback((query: string) => {
    setIsSearching(true);
    try {
      const result = checkoutLinkSearchEngine.fuzzySearch(checkoutLinks, query);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, [checkoutLinks]);

  const getSearchSuggestions = useCallback((query: string, limit?: number) => {
    return checkoutLinkSearchEngine.getSearchSuggestions(checkoutLinks, query, limit);
  }, [checkoutLinks]);

  const getFilteredCounts = useCallback(() => {
    return checkoutLinkSearchEngine.getFilteredCounts(checkoutLinks);
  }, [checkoutLinks]);

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
    searchCheckoutLinks,
    debouncedSearch,
    searchBySlug,
    fuzzySearch,
    getSearchSuggestions,
    getFilteredCounts,
  };
}
