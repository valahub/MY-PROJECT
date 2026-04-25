// Subscription Status State Machine
// Enforces valid status transitions: trialing → active → past_due → canceled/paused

import type { SubscriptionStatus, SubscriptionTransition } from './subscription-types';

// ============================================
// SUBSCRIPTION STATE MACHINE
// ============================================

export class SubscriptionStateMachine {
  // ============================================
  // VALID TRANSITIONS
  // ============================================

  private readonly validTransitions: Map<SubscriptionStatus, SubscriptionStatus[]> = new Map([
    ['trialing', ['active', 'canceled']],
    ['active', ['past_due', 'canceled', 'paused']],
    ['past_due', ['active', 'canceled']],
    ['canceled', []], // Terminal state
    ['paused', ['active', 'canceled']],
  ]);

  // ============================================
  // CAN TRANSITION
  // ============================================

  canTransition(from: SubscriptionStatus, to: SubscriptionStatus): SubscriptionTransition {
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

  transition(currentStatus: SubscriptionStatus, newStatus: SubscriptionStatus): SubscriptionStatus {
    const result = this.canTransition(currentStatus, newStatus);

    if (!result.allowed) {
      throw new Error(result.reason);
    }

    return newStatus;
  }

  // ============================================
  // GET VALID TRANSITIONS
  // ============================================

  getValidTransitions(currentStatus: SubscriptionStatus): SubscriptionStatus[] {
    return this.validTransitions.get(currentStatus) || [];
  }

  // ============================================
  // IS TERMINAL STATE
  // ============================================

  isTerminalState(status: SubscriptionStatus): boolean {
    return status === 'canceled';
  }

  // ============================================
  // CAN BE PAUSED
  // ============================================

  canBePaused(status: SubscriptionStatus): boolean {
    return status === 'active';
  }

  // ============================================
  // CAN BE RESUMED
  // ============================================

  canBeResumed(status: SubscriptionStatus): boolean {
    return status === 'paused';
  }

  // ============================================
  // CAN BE CANCELED
  // ============================================

  canBeCanceled(status: SubscriptionStatus): boolean {
    return ['trialing', 'active', 'past_due', 'paused'].includes(status);
  }

  // ============================================
  // CAN BE REACTIVATED
  // ============================================

  canBeReactivated(status: SubscriptionStatus): boolean {
    return status === 'past_due';
  }

  // ============================================
  // GET TRANSITION REASON
  // ============================================

  getTransitionReason(from: SubscriptionStatus, to: SubscriptionStatus): string {
    const reasons: Record<string, string> = {
      'trialing->active': 'Trial period ended',
      'trialing->canceled': 'Subscription canceled during trial',
      'active->past_due': 'Payment failed',
      'active->canceled': 'Subscription canceled',
      'active->paused': 'Subscription paused',
      'past_due->active': 'Payment succeeded',
      'past_due->canceled': 'Subscription canceled after failed payment',
      'paused->active': 'Subscription resumed',
      'paused->canceled': 'Subscription canceled while paused',
    };

    const key = `${from}->${to}`;
    return reasons[key] || `Status changed from ${from} to ${to}`;
  }
}

// Export singleton instance
export const subscriptionStateMachine = new SubscriptionStateMachine();

// ============================================
// REACT HOOK FOR STATE MACHINE
// ============================================

import { useCallback } from 'react';

export function useSubscriptionStateMachine() {
  const canTransition = useCallback((from: SubscriptionStatus, to: SubscriptionStatus) => {
    return subscriptionStateMachine.canTransition(from, to);
  }, []);

  const transition = useCallback((currentStatus: SubscriptionStatus, newStatus: SubscriptionStatus) => {
    return subscriptionStateMachine.transition(currentStatus, newStatus);
  }, []);

  const getValidTransitions = useCallback((currentStatus: SubscriptionStatus) => {
    return subscriptionStateMachine.getValidTransitions(currentStatus);
  }, []);

  const isTerminalState = useCallback((status: SubscriptionStatus) => {
    return subscriptionStateMachine.isTerminalState(status);
  }, []);

  const canBePaused = useCallback((status: SubscriptionStatus) => {
    return subscriptionStateMachine.canBePaused(status);
  }, []);

  const canBeResumed = useCallback((status: SubscriptionStatus) => {
    return subscriptionStateMachine.canBeResumed(status);
  }, []);

  const canBeCanceled = useCallback((status: SubscriptionStatus) => {
    return subscriptionStateMachine.canBeCanceled(status);
  }, []);

  const canBeReactivated = useCallback((status: SubscriptionStatus) => {
    return subscriptionStateMachine.canBeReactivated(status);
  }, []);

  const getTransitionReason = useCallback((from: SubscriptionStatus, to: SubscriptionStatus) => {
    return subscriptionStateMachine.getTransitionReason(from, to);
  }, []);

  return {
    canTransition,
    transition,
    getValidTransitions,
    isTerminalState,
    canBePaused,
    canBeResumed,
    canBeCanceled,
    canBeReactivated,
    getTransitionReason,
  };
}
