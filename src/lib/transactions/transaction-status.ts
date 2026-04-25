// Transaction Payment Status Engine
// Status management: pending → completed/failed → refunded

import type { Transaction, TransactionStatus } from './transaction-types';

// ============================================
// STATUS TRANSITION
// ============================================

export interface StatusTransition {
  from: TransactionStatus;
  to: TransactionStatus;
  allowed: boolean;
  reason?: string;
}

// ============================================
// TRANSACTION STATUS ENGINE
// ============================================

export class TransactionStatusEngine {
  // ============================================
  // VALID TRANSITIONS
  // ============================================

  private readonly validTransitions: Map<TransactionStatus, TransactionStatus[]> = new Map([
    ['pending', ['completed', 'failed']],
    ['completed', ['refunded']],
    ['failed', []], // Terminal state
    ['refunded', []], // Terminal state
  ]);

  // ============================================
  // CAN TRANSITION
  // ============================================

  canTransition(from: TransactionStatus, to: TransactionStatus): StatusTransition {
    const allowedTransitions = this.validTransitions.get(from) || [];

    if (allowedTransitions.includes(to)) {
      return {
        from,
        to,
        allowed: true,
      };
    }

    return {
      from,
      to,
      allowed: false,
      reason: `Cannot transition from ${from} to ${to}. Valid transitions: ${allowedTransitions.join(', ') || 'none'}`,
    };
  }

  // ============================================
  // TRANSITION
  // ============================================

  transition(currentStatus: TransactionStatus, newStatus: TransactionStatus): TransactionStatus {
    const result = this.canTransition(currentStatus, newStatus);

    if (!result.allowed) {
      throw new Error(result.reason);
    }

    return newStatus;
  }

  // ============================================
  // GET VALID TRANSITIONS
  // ============================================

  getValidTransitions(currentStatus: TransactionStatus): TransactionStatus[] {
    return this.validTransitions.get(currentStatus) || [];
  }

  // ============================================
  // IS TERMINAL STATE
  // ============================================

  isTerminalState(status: TransactionStatus): boolean {
    return status === 'failed' || status === 'refunded';
  }

  // ============================================
  // CAN BE REFUNDED
  // ============================================

  canBeRefunded(status: TransactionStatus): boolean {
    return status === 'completed';
  }

  // ============================================
  // CAN BE RETRIED
  // ============================================

  canBeRetried(status: TransactionStatus): boolean {
    return status === 'failed';
  }

  // ============================================
  // GET STATUS COLOR
  // ============================================

  getStatusColor(status: TransactionStatus): string {
    switch (status) {
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'refunded':
        return 'red';
      case 'pending':
        return 'yellow';
      default:
        return 'gray';
    }
  }

  // ============================================
  // GET STATUS LABEL
  // ============================================

  getStatusLabel(status: TransactionStatus): string {
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
  }

  // ============================================
  // GET STATUS ICON
  // ============================================

  getStatusIcon(status: TransactionStatus): string {
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
  }

  // ============================================
  // GET STATUS BADGE CLASS
  // ============================================

  getStatusBadgeClass(status: TransactionStatus): string {
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
  }

  // ============================================
  // GET TRANSITION REASON
  // ============================================

  getTransitionReason(from: TransactionStatus, to: TransactionStatus): string {
    const reasons: Record<string, string> = {
      'pending->completed': 'Payment successful',
      'pending->failed': 'Payment failed',
      'completed->refunded': 'Refund processed',
    };

    const key = `${from}->${to}`;
    return reasons[key] || `Status changed from ${from} to ${to}`;
  }
}

// Export singleton instance
export const transactionStatusEngine = new TransactionStatusEngine();

// ============================================
// REACT HOOK FOR STATUS ENGINE
// ============================================

import { useCallback } from 'react';

export function useTransactionStatus() {
  const canTransition = useCallback((from: TransactionStatus, to: TransactionStatus) => {
    return transactionStatusEngine.canTransition(from, to);
  }, []);

  const transition = useCallback((currentStatus: TransactionStatus, newStatus: TransactionStatus) => {
    return transactionStatusEngine.transition(currentStatus, newStatus);
  }, []);

  const getValidTransitions = useCallback((currentStatus: TransactionStatus) => {
    return transactionStatusEngine.getValidTransitions(currentStatus);
  }, []);

  const isTerminalState = useCallback((status: TransactionStatus) => {
    return transactionStatusEngine.isTerminalState(status);
  }, []);

  const canBeRefunded = useCallback((status: TransactionStatus) => {
    return transactionStatusEngine.canBeRefunded(status);
  }, []);

  const canBeRetried = useCallback((status: TransactionStatus) => {
    return transactionStatusEngine.canBeRetried(status);
  }, []);

  const getStatusColor = useCallback((status: TransactionStatus) => {
    return transactionStatusEngine.getStatusColor(status);
  }, []);

  const getStatusLabel = useCallback((status: TransactionStatus) => {
    return transactionStatusEngine.getStatusLabel(status);
  }, []);

  const getStatusIcon = useCallback((status: TransactionStatus) => {
    return transactionStatusEngine.getStatusIcon(status);
  }, []);

  const getStatusBadgeClass = useCallback((status: TransactionStatus) => {
    return transactionStatusEngine.getStatusBadgeClass(status);
  }, []);

  return {
    canTransition,
    transition,
    getValidTransitions,
    isTerminalState,
    canBeRefunded,
    canBeRetried,
    getStatusColor,
    getStatusLabel,
    getStatusIcon,
    getStatusBadgeClass,
  };
}
