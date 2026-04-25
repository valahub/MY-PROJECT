// Transaction Pagination / Infinite Scroll
// Cursor pagination for efficient data loading

import type { Transaction } from './transaction-types';

// ============================================
// PAGINATION RESULT
// ============================================

export interface PaginationResult {
  transactions: Transaction[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

// ============================================
// TRANSACTION PAGINATION ENGINE
// ============================================

export class TransactionPaginationEngine {
  private transactions: Map<string, Transaction> = new Map();
  private pageSize: number = 20;

  // ============================================
  // GET PAGE (CURSOR-BASED)
  // ============================================

  getPage(cursor: string | null = null, limit: number = 20): PaginationResult {
    const allTransactions = Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let startIndex = 0;

    if (cursor) {
      // Find the index of the cursor transaction
      const cursorIndex = allTransactions.findIndex((t) => t.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const endIndex = startIndex + limit;
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);
    const hasMore = endIndex < allTransactions.length;

    // Next cursor is the ID of the last transaction in this page
    const nextCursor = hasMore ? paginatedTransactions[paginatedTransactions.length - 1].id : null;

    return {
      transactions: paginatedTransactions,
      nextCursor,
      hasMore,
      totalCount: allTransactions.length,
    };
  }

  // ============================================
  // GET PAGE BY DATE RANGE
  // ============================================

  getPageByDateRange(
    startDate: string,
    endDate: string,
    cursor: string | null = null,
    limit: number = 20
  ): PaginationResult {
    const allTransactions = Array.from(this.transactions.values())
      .filter((t) => {
        const txnDate = new Date(t.createdAt);
        return txnDate >= new Date(startDate) && txnDate <= new Date(endDate);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let startIndex = 0;

    if (cursor) {
      const cursorIndex = allTransactions.findIndex((t) => t.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const endIndex = startIndex + limit;
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);
    const hasMore = endIndex < allTransactions.length;

    const nextCursor = hasMore ? paginatedTransactions[paginatedTransactions.length - 1].id : null;

    return {
      transactions: paginatedTransactions,
      nextCursor,
      hasMore,
      totalCount: allTransactions.length,
    };
  }

  // ============================================
  // GET PAGE BY FILTERS
  // ============================================

  getPageByFilters(
    filters: {
      type?: 'payment' | 'refund';
      status?: string;
      customerId?: string;
      currency?: string;
    },
    cursor: string | null = null,
    limit: number = 20
  ): PaginationResult {
    let filtered = Array.from(this.transactions.values());

    if (filters.type) {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter((t) => t.status === filters.status);
    }

    if (filters.customerId) {
      filtered = filtered.filter((t) => t.customerId === filters.customerId);
    }

    if (filters.currency) {
      filtered = filtered.filter((t) => t.currency === filters.currency);
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let startIndex = 0;

    if (cursor) {
      const cursorIndex = filtered.findIndex((t) => t.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const endIndex = startIndex + limit;
    const paginatedTransactions = filtered.slice(startIndex, endIndex);
    const hasMore = endIndex < filtered.length;

    const nextCursor = hasMore ? paginatedTransactions[paginatedTransactions.length - 1].id : null;

    return {
      transactions: paginatedTransactions,
      nextCursor,
      hasMore,
      totalCount: filtered.length,
    };
  }

  // ============================================
  // GET PAGE BY OFFSET (TRADITIONAL)
  // ============================================

  getPageByOffset(page: number = 1, limit: number = 20): PaginationResult {
    const allTransactions = Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);
    const hasMore = endIndex < allTransactions.length;

    const nextCursor = hasMore ? paginatedTransactions[paginatedTransactions.length - 1].id : null;

    return {
      transactions: paginatedTransactions,
      nextCursor,
      hasMore,
      totalCount: allTransactions.length,
    };
  }

  // ============================================
  // GET TOTAL PAGES
  // ============================================

  getTotalPages(limit: number = 20): number {
    const total = this.transactions.size;
    return Math.ceil(total / limit);
  }

  // ============================================
  // SET PAGE SIZE
  // ============================================

  setPageSize(size: number): void {
    this.pageSize = size;
  }

  // ============================================
  // GET PAGE SIZE
  // ============================================

  getPageSize(): number {
    return this.pageSize;
  }

  // ============================================
  // REGISTER TRANSACTION
  // ============================================

  registerTransaction(transaction: Transaction): void {
    this.transactions.set(transaction.id, transaction);
  }

  // ============================================
  // UNREGISTER TRANSACTION
  // ============================================

  unregisterTransaction(transactionId: string): void {
    this.transactions.delete(transactionId);
  }

  // ============================================
  // GET TRANSACTION
  // ============================================

  getTransaction(transactionId: string): Transaction | null {
    return this.transactions.get(transactionId) || null;
  }

  // ============================================
  // GET ALL TRANSACTIONS
  // ============================================

  getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values());
  }

  // ============================================
  // RESET
  // ============================================

  reset(): void {
    this.transactions.clear();
  }
}

// Export singleton instance
export const transactionPaginationEngine = new TransactionPaginationEngine();

// ============================================
// REACT HOOK FOR TRANSACTION PAGINATION
// ============================================

import { useState, useCallback, useEffect } from 'react';

export function useTransactionPagination(initialPageSize: number = 20) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PaginationResult | null>(null);

  const loadNextPage = useCallback(() => {
    setIsLoading(true);
    try {
      const pageResult = transactionPaginationEngine.getPage(cursor, pageSize);
      setResult(pageResult);
      setCursor(pageResult.nextCursor);
      setPage(page + 1);
      return pageResult;
    } finally {
      setIsLoading(false);
    }
  }, [cursor, pageSize, page]);

  const loadPageByOffset = useCallback((pageNumber: number) => {
    setIsLoading(true);
    try {
      const pageResult = transactionPaginationEngine.getPageByOffset(pageNumber, pageSize);
      setResult(pageResult);
      setPage(pageNumber);
      return pageResult;
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  const loadPageByFilters = useCallback((
    filters: {
      type?: 'payment' | 'refund';
      status?: string;
      customerId?: string;
      currency?: string;
    },
    newCursor: string | null = null
  ) => {
    setIsLoading(true);
    try {
      const pageResult = transactionPaginationEngine.getPageByFilters(filters, newCursor, pageSize);
      setResult(pageResult);
      setCursor(pageResult.nextCursor);
      return pageResult;
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  const resetPagination = useCallback(() => {
    setCursor(null);
    setPage(1);
    setResult(null);
  }, []);

  const changePageSize = useCallback((newSize: number) => {
    setPageSize(newSize);
    transactionPaginationEngine.setPageSize(newSize);
    resetPagination();
  }, [resetPagination]);

  const getTotalPages = useCallback(() => {
    return transactionPaginationEngine.getTotalPages(pageSize);
  }, [pageSize]);

  return {
    cursor,
    page,
    pageSize,
    isLoading,
    result,
    loadNextPage,
    loadPageByOffset,
    loadPageByFilters,
    resetPagination,
    changePageSize,
    getTotalPages,
  };
}
