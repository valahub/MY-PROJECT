// License Search Engine
// Search by license key, customer, product

import type { License, LicenseSearchFilters, LicenseSearchResult } from './license-types';

// ============================================
// LICENSE SEARCH ENGINE
// ============================================

export class LicenseSearchEngine {
  // ============================================
  // SEARCH LICENSES
  // ============================================

  searchLicenses(licenses: License[], filters: LicenseSearchFilters): LicenseSearchResult {
    let filtered = [...licenses];

    // Text search (license key, product, customer)
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter((license) =>
        license.licenseKey.toLowerCase().includes(query) ||
        license.productId.toLowerCase().includes(query) ||
        license.customerId.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((license) => license.status === filters.status);
    }

    // Product filter
    if (filters.productId) {
      filtered = filtered.filter((license) => license.productId === filters.productId);
    }

    // Customer filter
    if (filters.customerId) {
      filtered = filtered.filter((license) => license.customerId === filters.customerId);
    }

    // Plan filter
    if (filters.planId) {
      filtered = filtered.filter((license) => license.planId === filters.planId);
    }

    // Sort
    if (filters.sortBy) {
      filtered = this.sortLicenses(filtered, filters.sortBy, filters.sortOrder || 'desc');
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      licenses: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ============================================
  // SORT LICENSES
  // ============================================

  private sortLicenses(licenses: License[], sortBy: string, sortOrder: 'asc' | 'desc'): License[] {
    const sorted = [...licenses];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'licenseKey':
          comparison = a.licenseKey.localeCompare(b.licenseKey);
          break;
        case 'expiresAt':
          comparison = new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
          break;
        case 'issuedAt':
          comparison = new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
          break;
        case 'activationCount':
          comparison = a.activationCount - b.activationCount;
          break;
        case 'lastCheckAt':
          comparison = new Date(a.lastCheckAt).getTime() - new Date(b.lastCheckAt).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  // ============================================
  // SEARCH BY LICENSE KEY
  // ============================================

  searchByLicenseKey(licenses: License[], licenseKey: string): License[] {
    const query = licenseKey.toLowerCase();
    return licenses.filter((license) => license.licenseKey.toLowerCase().includes(query));
  }

  // ============================================
  // SEARCH BY CUSTOMER
  // ============================================

  searchByCustomer(licenses: License[], customerId: string): License[] {
    return licenses.filter((license) => license.customerId === customerId);
  }

  // ============================================
  // SEARCH BY PRODUCT
  // ============================================

  searchByProduct(licenses: License[], productId: string): License[] {
    return licenses.filter((license) => license.productId === productId);
  }

  // ============================================
  // FUZZY SEARCH
  // ============================================

  fuzzySearch(licenses: License[], query: string): License[] {
    const terms = query.toLowerCase().split(' ');
    const scored: { license: License; score: number }[] = [];

    for (const license of licenses) {
      let score = 0;
      const searchableText = `${license.licenseKey} ${license.productId} ${license.customerId}`.toLowerCase();

      for (const term of terms) {
        if (license.licenseKey.toLowerCase().includes(term)) {
          score += 10;
        }
        if (license.productId.toLowerCase().includes(term)) {
          score += 8;
        }
        if (license.customerId.toLowerCase().includes(term)) {
          score += 6;
        }
        if (searchableText.includes(term)) {
          score += 3;
        }
      }

      if (score > 0) {
        scored.push({ license, score });
      }
    }

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    return scored.map((s) => s.license);
  }

  // ============================================
  // ADVANCED SEARCH
  // ============================================

  advancedSearch(licenses: License[], filters: LicenseSearchFilters): LicenseSearchResult {
    // Use the main search method
    return this.searchLicenses(licenses, filters);
  }

  // ============================================
  // GET UNIQUE PRODUCTS
  // ============================================

  getUniqueProducts(licenses: License[]): string[] {
    const products = new Set(licenses.map((l) => l.productId));
    return Array.from(products).sort();
  }

  // ============================================
  // GET UNIQUE CUSTOMERS
  // ============================================

  getUniqueCustomers(licenses: License[]): string[] {
    const customers = new Set(licenses.map((l) => l.customerId));
    return Array.from(customers).sort();
  }

  // ============================================
  // GET SEARCH SUGGESTIONS
  // ============================================

  getSearchSuggestions(licenses: License[], query: string, limit: number = 5): Array<{
    type: 'licenseKey' | 'productId' | 'customerId';
    value: string;
    license: License;
  }> {
    const suggestions: Array<{
      type: 'licenseKey' | 'productId' | 'customerId';
      value: string;
      license: License;
    }> = [];

    const lowerQuery = query.toLowerCase();

    for (const license of licenses) {
      // License key suggestions
      if (license.licenseKey.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'licenseKey',
          value: license.licenseKey,
          license,
        });
      }

      // Product suggestions
      if (license.productId.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'productId',
          value: license.productId,
          license,
        });
      }

      // Customer suggestions
      if (license.customerId.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'customerId',
          value: license.customerId,
          license,
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

  getFilteredCounts(licenses: License[]): {
    total: number;
    active: number;
    expired: number;
    disabled: number;
    revoked: number;
  } {
    return {
      total: licenses.length,
      active: licenses.filter((l) => l.status === 'active').length,
      expired: licenses.filter((l) => l.status === 'expired').length,
      disabled: licenses.filter((l) => l.status === 'disabled').length,
      revoked: licenses.filter((l) => l.status === 'revoked').length,
    };
  }

  // ============================================
  // GET EXPIRING SOON
  // ============================================

  getExpiringSoon(licenses: License[], days: number = 7): License[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return licenses.filter((license) => {
      const expiresAt = new Date(license.expiresAt);
      return license.status === 'active' && expiresAt <= cutoff && expiresAt > now;
    });
  }

  // ============================================
  // GET HIGH ACTIVATION LICENSES
  // ============================================

  getHighActivationLicenses(licenses: License[], threshold: number = 5): License[] {
    return licenses.filter((license) => license.activationCount >= threshold);
  }
}

// Export singleton instance
export const licenseSearchEngine = new LicenseSearchEngine();

// ============================================
// REACT HOOK FOR LICENSE SEARCH
// ============================================

import { useState, useCallback } from 'react';

export function useLicenseSearch() {
  const [isSearching, setIsSearching] = useState(false);

  const searchLicenses = useCallback((licenses: License[], filters: LicenseSearchFilters) => {
    setIsSearching(true);
    try {
      const result = licenseSearchEngine.searchLicenses(licenses, filters);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchByLicenseKey = useCallback((licenses: License[], licenseKey: string) => {
    setIsSearching(true);
    try {
      const result = licenseSearchEngine.searchByLicenseKey(licenses, licenseKey);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchByCustomer = useCallback((licenses: License[], customerId: string) => {
    setIsSearching(true);
    try {
      const result = licenseSearchEngine.searchByCustomer(licenses, customerId);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const fuzzySearch = useCallback((licenses: License[], query: string) => {
    setIsSearching(true);
    try {
      const result = licenseSearchEngine.fuzzySearch(licenses, query);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const getSearchSuggestions = useCallback((licenses: License[], query: string, limit?: number) => {
    return licenseSearchEngine.getSearchSuggestions(licenses, query, limit);
  }, []);

  const getUniqueProducts = useCallback((licenses: License[]) => {
    return licenseSearchEngine.getUniqueProducts(licenses);
  }, []);

  const getExpiringSoon = useCallback((licenses: License[], days?: number) => {
    return licenseSearchEngine.getExpiringSoon(licenses, days);
  }, []);

  return {
    isSearching,
    searchLicenses,
    searchByLicenseKey,
    searchByCustomer,
    fuzzySearch,
    getSearchSuggestions,
    getUniqueProducts,
    getExpiringSoon,
  };
}
