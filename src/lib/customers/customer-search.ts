// Customer Search Engine
// Search by name, email, country, payment status

import type { Customer, CustomerSearchFilters, CustomerSearchResult } from './customer-types';

// ============================================
// CUSTOMER SEARCH ENGINE
// ============================================

export class CustomerSearchEngine {
  // ============================================
  // SEARCH CUSTOMERS
  // ============================================

  searchCustomers(customers: Customer[], filters: CustomerSearchFilters): CustomerSearchResult {
    let filtered = [...customers];

    // Text search (name, email)
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter((customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((customer) => customer.status === filters.status as Customer['status']);
    }

    // Country filter
    if (filters.country) {
      filtered = filtered.filter((customer) => customer.country === filters.country);
    }

    // LTV range filter
    if (filters.minLTV !== undefined) {
      filtered = filtered.filter((customer) => customer.ltv >= filters.minLTV!);
    }
    if (filters.maxLTV !== undefined) {
      filtered = filtered.filter((customer) => customer.ltv <= filters.maxLTV!);
    }

    // Churn risk range filter
    if (filters.minChurnRisk !== undefined) {
      filtered = filtered.filter((customer) => customer.churnRiskScore >= filters.minChurnRisk!);
    }
    if (filters.maxChurnRisk !== undefined) {
      filtered = filtered.filter((customer) => customer.churnRiskScore <= filters.maxChurnRisk!);
    }

    // Fraud risk range filter
    if (filters.minFraudRisk !== undefined) {
      filtered = filtered.filter((customer) => customer.fraudRiskScore >= filters.minFraudRisk!);
    }
    if (filters.maxFraudRisk !== undefined) {
      filtered = filtered.filter((customer) => customer.fraudRiskScore <= filters.maxFraudRisk!);
    }

    // Sort
    if (filters.sortBy) {
      filtered = this.sortCustomers(filtered, filters.sortBy, filters.sortOrder || 'asc');
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      customers: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ============================================
  // SORT CUSTOMERS
  // ============================================

  private sortCustomers(customers: Customer[], sortBy: string, sortOrder: 'asc' | 'desc'): Customer[] {
    const sorted = [...customers];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'ltv':
          comparison = a.ltv - b.ltv;
          break;
        case 'churn_risk':
          comparison = a.churnRiskScore - b.churnRiskScore;
          break;
        case 'fraud_risk':
          comparison = a.fraudRiskScore - b.fraudRiskScore;
          break;
        case 'created_at':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'last_active':
          comparison = new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  // ============================================
  // SEARCH BY NAME
  // ============================================

  searchByName(customers: Customer[], name: string): Customer[] {
    const query = name.toLowerCase();
    return customers.filter((customer) => customer.name.toLowerCase().includes(query));
  }

  // ============================================
  // SEARCH BY EMAIL
  // ============================================

  searchByEmail(customers: Customer[], email: string): Customer[] {
    const query = email.toLowerCase();
    return customers.filter((customer) => customer.email.toLowerCase().includes(query));
  }

  // ============================================
  // SEARCH BY COUNTRY
  // ============================================

  searchByCountry(customers: Customer[], country: string): Customer[] {
    return customers.filter((customer) => customer.country === country);
  }

  // ============================================
  // SEARCH BY PAYMENT STATUS (via relations)
  // ============================================

  async searchByPaymentStatus(customers: Customer[], status: string): Promise<Customer[]> {
    // In production, this would query the transactions table
    // For now, return empty
    return [];
  }

  // ============================================
  // FUZZY SEARCH
  // ============================================

  fuzzySearch(customers: Customer[], query: string): Customer[] {
    const terms = query.toLowerCase().split(' ');
    const scored: { customer: Customer; score: number }[] = [];

    for (const customer of customers) {
      let score = 0;
      const searchableText = `${customer.name} ${customer.email} ${customer.country}`.toLowerCase();

      for (const term of terms) {
        if (customer.name.toLowerCase().includes(term)) {
          score += 10;
        }
        if (customer.email.toLowerCase().includes(term)) {
          score += 8;
        }
        if (customer.country.toLowerCase().includes(term)) {
          score += 5;
        }
        if (searchableText.includes(term)) {
          score += 3;
        }
      }

      if (score > 0) {
        scored.push({ customer, score });
      }
    }

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    return scored.map((s) => s.customer);
  }

  // ============================================
  // ADVANCED SEARCH
  // ============================================

  advancedSearch(customers: Customer[], filters: CustomerSearchFilters): CustomerSearchResult {
    // Use the main search method
    return this.searchCustomers(customers, filters);
  }

  // ============================================
  // GET UNIQUE COUNTRIES
  // ============================================

  getUniqueCountries(customers: Customer[]): string[] {
    const countries = new Set(customers.map((c) => c.country));
    return Array.from(countries).sort();
  }

  // ============================================
  // GET SEARCH SUGGESTIONS
  // ============================================

  getSearchSuggestions(customers: Customer[], query: string, limit: number = 5): Array<{
    type: 'name' | 'email' | 'country';
    value: string;
    customer: Customer;
  }> {
    const suggestions: Array<{
      type: 'name' | 'email' | 'country';
      value: string;
      customer: Customer;
    }> = [];

    const lowerQuery = query.toLowerCase();

    for (const customer of customers) {
      // Name suggestions
      if (customer.name.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'name',
          value: customer.name,
          customer,
        });
      }

      // Email suggestions
      if (customer.email.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'email',
          value: customer.email,
          customer,
        });
      }

      // Country suggestions
      if (customer.country.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'country',
          value: customer.country,
          customer,
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

  getFilteredCounts(customers: Customer[]): {
    total: number;
    active: number;
    inactive: number;
    blocked: number;
  } {
    return {
      total: customers.length,
      active: customers.filter((c) => c.status === 'active').length,
      inactive: customers.filter((c) => c.status === 'inactive').length,
      blocked: customers.filter((c) => c.status === 'blocked').length,
    };
  }
}

// Export singleton instance
export const customerSearchEngine = new CustomerSearchEngine();

// ============================================
// REACT HOOK FOR CUSTOMER SEARCH
// ============================================

import { useState, useCallback } from 'react';

export function useCustomerSearch() {
  const [isSearching, setIsSearching] = useState(false);

  const searchCustomers = useCallback((customers: Customer[], filters: CustomerSearchFilters) => {
    setIsSearching(true);
    try {
      const result = customerSearchEngine.searchCustomers(customers, filters);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchByName = useCallback((customers: Customer[], name: string) => {
    setIsSearching(true);
    try {
      const result = customerSearchEngine.searchByName(customers, name);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchByEmail = useCallback((customers: Customer[], email: string) => {
    setIsSearching(true);
    try {
      const result = customerSearchEngine.searchByEmail(customers, email);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const fuzzySearch = useCallback((customers: Customer[], query: string) => {
    setIsSearching(true);
    try {
      const result = customerSearchEngine.fuzzySearch(customers, query);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const getSearchSuggestions = useCallback((customers: Customer[], query: string, limit?: number) => {
    return customerSearchEngine.getSearchSuggestions(customers, query, limit);
  }, []);

  const getUniqueCountries = useCallback((customers: Customer[]) => {
    return customerSearchEngine.getUniqueCountries(customers);
  }, []);

  return {
    isSearching,
    searchCustomers,
    searchByName,
    searchByEmail,
    fuzzySearch,
    getSearchSuggestions,
    getUniqueCountries,
  };
}
