// Transaction Search Engine
// Debounce 300ms, search by txn id, customer name, email

import type { Transaction, TransactionSearchFilters, TransactionSearchResult } from './transaction-types';

// ============================================
// TRANSACTION SEARCH ENGINE
// ============================================

export class TransactionSearchEngine {
  // ============================================
  // SEARCH TRANSACTIONS
  // ============================================

  searchTransactions(transactions: Transaction[], filters: TransactionSearchFilters): TransactionSearchResult {
    let filtered = [...transactions];

    // Text search (txn id, customer name, email)
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter((transaction) =>
        transaction.id.toLowerCase().includes(query) ||
        transaction.customerId.toLowerCase().includes(query) ||
        transaction.providerTxnId.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter((transaction) => transaction.type === filters.type);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((transaction) => transaction.status === filters.status);
    }

    // Customer filter
    if (filters.customerId) {
      filtered = filtered.filter((transaction) => transaction.customerId === filters.customerId);
    }

    // Subscription filter
    if (filters.subscriptionId) {
      filtered = filtered.filter((transaction) => transaction.subscriptionId === filters.subscriptionId);
    }

    // Provider filter
    if (filters.provider) {
      filtered = filtered.filter((transaction) => transaction.provider === filters.provider);
    }

    // Currency filter
    if (filters.currency) {
      filtered = filtered.filter((transaction) => transaction.currency === filters.currency);
    }

    // Fraud risk filter
    if (filters.fraudRisk) {
      filtered = filtered.filter((transaction) => transaction.fraudRisk === filters.fraudRisk);
    }

    // Sort
    if (filters.sortBy) {
      filtered = this.sortTransactions(filtered, filters.sortBy, filters.sortOrder || 'desc');
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      transactions: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ============================================
  // SORT TRANSACTIONS
  // ============================================

  private sortTransactions(transactions: Transaction[], sortBy: string, sortOrder: 'asc' | 'desc'): Transaction[] {
    const sorted = [...transactions];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
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
  // SEARCH BY TRANSACTION ID
  // ============================================

  searchByTransactionId(transactions: Transaction[], transactionId: string): Transaction[] {
    const query = transactionId.toLowerCase();
    return transactions.filter((transaction) => transaction.id.toLowerCase().includes(query));
  }

  // ============================================
  // SEARCH BY CUSTOMER ID
  // ============================================

  searchByCustomerId(transactions: Transaction[], customerId: string): Transaction[] {
    return transactions.filter((transaction) => transaction.customerId === customerId);
  }

  // ============================================
  // FUZZY SEARCH
  // ============================================

  fuzzySearch(transactions: Transaction[], query: string): Transaction[] {
    const terms = query.toLowerCase().split(' ');
    const scored: { transaction: Transaction; score: number }[] = [];

    for (const transaction of transactions) {
      let score = 0;
      const searchableText = `${transaction.id} ${transaction.customerId} ${transaction.providerTxnId}`.toLowerCase();

      for (const term of terms) {
        if (transaction.id.toLowerCase().includes(term)) {
          score += 10;
        }
        if (transaction.customerId.toLowerCase().includes(term)) {
          score += 8;
        }
        if (transaction.providerTxnId.toLowerCase().includes(term)) {
          score += 6;
        }
        if (searchableText.includes(term)) {
          score += 3;
        }
      }

      if (score > 0) {
        scored.push({ transaction, score });
      }
    }

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    return scored.map((s) => s.transaction);
  }

  // ============================================
  // GET SEARCH SUGGESTIONS
  // ============================================

  getSearchSuggestions(transactions: Transaction[], query: string, limit: number = 5): Array<{
    type: 'transactionId' | 'customerId' | 'providerTxnId';
    value: string;
    transaction: Transaction;
  }> {
    const suggestions: Array<{
      type: 'transactionId' | 'customerId' | 'providerTxnId';
      value: string;
      transaction: Transaction;
    }> = [];

    const lowerQuery = query.toLowerCase();

    for (const transaction of transactions) {
      // Transaction ID suggestions
      if (transaction.id.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'transactionId',
          value: transaction.id,
          transaction,
        });
      }

      // Customer ID suggestions
      if (transaction.customerId.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'customerId',
          value: transaction.customerId,
          transaction,
        });
      }

      // Provider Txn ID suggestions
      if (transaction.providerTxnId.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'providerTxnId',
          value: transaction.providerTxnId,
          transaction,
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

  getFilteredCounts(transactions: Transaction[]): {
    total: number;
    payments: number;
    refunds: number;
    completed: number;
    failed: number;
    pending: number;
    refunded: number;
  } {
    return {
      total: transactions.length,
      payments: transactions.filter((t) => t.type === 'payment').length,
      refunds: transactions.filter((t) => t.type === 'refund').length,
      completed: transactions.filter((t) => t.status === 'completed').length,
      failed: transactions.filter((t) => t.status === 'failed').length,
      pending: transactions.filter((t) => t.status === 'pending').length,
      refunded: transactions.filter((t) => t.status === 'refunded').length,
    };
  }

  // ============================================
  // GET HIGH RISK TRANSACTIONS
  // ============================================

  getHighRiskTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.filter((transaction) => transaction.fraudRisk === 'high');
  }

  // ============================================
  // GET PENDING TRANSACTIONS
  // ============================================

  getPendingTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.filter((transaction) => transaction.status === 'pending');
  }
}

// Export singleton instance
export const transactionSearchEngine = new TransactionSearchEngine();

// ============================================
// REACT HOOK FOR TRANSACTION SEARCH WITH DEBOUNCE
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';

export function useTransactionSearch(transactions: Transaction[]) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TransactionSearchResult | null>(null);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const searchTransactions = useCallback((filters: TransactionSearchFilters) => {
    setIsSearching(true);
    try {
      const result = transactionSearchEngine.searchTransactions(transactions, filters);
      setSearchResults(result);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, [transactions]);

  const debouncedSearch = useCallback((filters: TransactionSearchFilters) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchTransactions(filters);
    }, 300);
  }, [searchTransactions]);

  const searchByTransactionId = useCallback((transactionId: string) => {
    setIsSearching(true);
    try {
      const result = transactionSearchEngine.searchByTransactionId(transactions, transactionId);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, [transactions]);

  const fuzzySearch = useCallback((query: string) => {
    setIsSearching(true);
    try {
      const result = transactionSearchEngine.fuzzySearch(transactions, query);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, [transactions]);

  const getSearchSuggestions = useCallback((query: string, limit?: number) => {
    return transactionSearchEngine.getSearchSuggestions(transactions, query, limit);
  }, [transactions]);

  const getFilteredCounts = useCallback(() => {
    return transactionSearchEngine.getFilteredCounts(transactions);
  }, [transactions]);

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
    searchTransactions,
    debouncedSearch,
    searchByTransactionId,
    fuzzySearch,
    getSearchSuggestions,
    getFilteredCounts,
  };
}
