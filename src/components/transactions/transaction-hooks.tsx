// Transaction UI Hooks
// React hooks for transaction UI components

import { useState, useCallback } from 'react';
import type { Transaction, TransactionStatus } from '../../lib/transactions/transaction-types';

// ============================================
// TRANSACTION STATUS BADGE HOOK
// ============================================

export function useTransactionStatusBadge(status: TransactionStatus) {
  const getStatusColor = useCallback(() => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, [status]);

  const getStatusLabel = useCallback(() => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  }, [status]);

  const getStatusIcon = useCallback(() => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'refunded':
        return '↩';
      case 'pending':
        return '⏳';
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
// TRANSACTION SELECTION HOOK
// ============================================

export function useTransactionSelection(transactions: Transaction[]) {
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());

  const toggleTransactionSelection = useCallback((transactionId: string) => {
    setSelectedTransactionIds((prev) => {
      const next = new Set(prev);
      if (next.has(transactionId)) {
        next.delete(transactionId);
      } else {
        next.add(transactionId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedTransactionIds(new Set(transactions.map((t) => t.id)));
  }, [transactions]);

  const clearSelection = useCallback(() => {
    setSelectedTransactionIds(new Set());
  }, []);

  const selectedTransactions = transactions.filter((t) => selectedTransactionIds.has(t.id));
  const isAllSelected = selectedTransactionIds.size === transactions.length && transactions.length > 0;
  const isSomeSelected = selectedTransactionIds.size > 0;

  return {
    selectedTransactionIds,
    selectedTransactions,
    isAllSelected,
    isSomeSelected,
    toggleTransactionSelection,
    selectAll,
    clearSelection,
  };
}

// ============================================
// TRANSACTION SORT HOOK
// ============================================

export function useTransactionSort(transactions: Transaction[]) {
  const [sortBy, setSortBy] = useState<'createdAt' | 'amount' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortedTransactions, setSortedTransactions] = useState<Transaction[]>(transactions);

  const sortTransactions = useCallback(() => {
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

    setSortedTransactions(sorted);
  }, [transactions, sortBy, sortOrder]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder]);

  return {
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSortOrder,
    sortedTransactions,
  };
}

// ============================================
// TRANSACTION DETAILS HOOK
// ============================================

export function useTransactionDetails(transactionId: string, transactions: Transaction[]) {
  const transaction = transactions.find((t) => t.id === transactionId);

  const getDaysSinceCreated = useCallback(() => {
    if (!transaction) return null;
    const now = new Date();
    const created = new Date(transaction.createdAt);
    const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreated;
  }, [transaction]);

  return {
    transaction,
    getDaysSinceCreated,
  };
}

// ============================================
// TRANSACTION FILTER HOOK
// ============================================

export function useTransactionFilter(transactions: Transaction[]) {
  const [filters, setFilters] = useState({
    type: 'all' as 'payment' | 'refund' | 'all',
    status: 'all' as TransactionStatus | 'all',
    currency: 'all' as string,
  });

  const filteredTransactions = useCallback(() => {
    let result = transactions;

    if (filters.type !== 'all') {
      result = result.filter((t) => t.type === filters.type);
    }

    if (filters.status !== 'all') {
      result = result.filter((t) => t.status === filters.status);
    }

    if (filters.currency !== 'all') {
      result = result.filter((t) => t.currency === filters.currency);
    }

    return result;
  }, [transactions, filters]);

  const clearFilters = useCallback(() => {
    setFilters({
      type: 'all',
      status: 'all',
      currency: 'all',
    });
  }, []);

  const activeFilterCount = Object.values(filters).filter((v) => v !== 'all').length;

  return {
    filters,
    setFilters,
    filteredTransactions: filteredTransactions(),
    clearFilters,
    activeFilterCount,
  };
}

// ============================================
// TRANSACTION ACTION AVAILABILITY HOOK
// ============================================

export function useTransactionActionAvailability(transaction: Transaction) {
  const canRefund = transaction.status === 'completed' && transaction.type === 'payment';
  const canRetry = transaction.status === 'failed';
  const canViewDetails = true;

  return {
    canRefund,
    canRetry,
    canViewDetails,
  };
}

// ============================================
// TRANSACTION FRAUD BADGE HOOK
// ============================================

export function useTransactionFraudBadge(fraudRisk: 'low' | 'medium' | 'high') {
  const getFraudBadge = useCallback(() => {
    if (fraudRisk === 'high') {
      return {
        show: true,
        color: 'bg-red-100 text-red-800',
        label: 'High Risk',
      };
    } else if (fraudRisk === 'medium') {
      return {
        show: true,
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Medium Risk',
      };
    }
    return {
      show: false,
      color: '',
      label: '',
    };
  }, [fraudRisk]);

  return {
    getFraudBadge,
  };
}
