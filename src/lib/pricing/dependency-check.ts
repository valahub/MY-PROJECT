// Dependency Check Engine
// Checks active subscriptions, invoices pending, trial users before pricing changes

import type { PricingPlan, DependencyCheckResult } from './pricing-types';

// ============================================
// DEPENDENCY DATA
// ============================================

export interface SubscriptionDependency {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'trial' | 'past_due' | 'cancelled';
  currentPeriodEnd: string;
  price: number;
}

export interface InvoiceDependency {
  id: string;
  planId: string;
  userId: string;
  status: 'pending' | 'processing' | 'failed';
  amount: number;
  dueDate: string;
}

export interface TrialUserDependency {
  id: string;
  userId: string;
  planId: string;
  trialStartDate: string;
  trialEndDate: string;
  converted: boolean;
}

// ============================================
// DEPENDENCY CHECK ENGINE
// ============================================

export class DependencyCheckEngine {
  private subscriptions: Map<string, SubscriptionDependency[]> = new Map();
  private invoices: Map<string, InvoiceDependency[]> = new Map();
  private trialUsers: Map<string, TrialUserDependency[]> = new Map();

  // ============================================
  // DATA MANAGEMENT
  // ============================================

  setSubscriptions(planId: string, subs: SubscriptionDependency[]): void {
    this.subscriptions.set(planId, subs);
  }

  setInvoices(planId: string, invoices: InvoiceDependency[]): void {
    this.invoices.set(planId, invoices);
  }

  setTrialUsers(planId: string, trials: TrialUserDependency[]): void {
    this.trialUsers.set(planId, trials);
  }

  // ============================================
  // CHECK DEPENDENCIES
  // ============================================

  checkDependencies(planId: string): DependencyCheckResult {
    const activeSubs = this.getActiveSubscriptions(planId);
    const pendingInvoices = this.getPendingInvoices(planId);
    const activeTrials = this.getActiveTrialUsers(planId);

    const hasActiveSubscriptions = activeSubs.length > 0;
    const hasPendingInvoices = pendingInvoices.length > 0;
    const hasTrialUsers = activeTrials.length > 0;

    const canDelete = !hasActiveSubscriptions && !hasPendingInvoices;
    const canEdit = true; // Editing is always allowed, but may need warnings

    const blockingReasons: string[] = [];
    if (hasActiveSubscriptions) {
      blockingReasons.push(`${activeSubs.length} active subscription(s) exist`);
    }
    if (hasPendingInvoices) {
      blockingReasons.push(`${pendingInvoices.length} pending invoice(s) exist`);
    }

    return {
      canDelete,
      canEdit,
      hasActiveSubscriptions,
      activeSubscriptionCount: activeSubs.length,
      hasPendingInvoices,
      pendingInvoiceCount: pendingInvoices.length,
      hasTrialUsers,
      trialUserCount: activeTrials.length,
      blockingReason: blockingReasons.length > 0 ? blockingReasons.join('; ') : undefined,
    };
  }

  // ============================================
  // GET ACTIVE SUBSCRIPTIONS
  // ============================================

  private getActiveSubscriptions(planId: string): SubscriptionDependency[] {
    const subs = this.subscriptions.get(planId) || [];
    return subs.filter(
      (sub) => sub.status === 'active' || sub.status === 'trial' || sub.status === 'past_due'
    );
  }

  // ============================================
  // GET PENDING INVOICES
  // ============================================

  private getPendingInvoices(planId: string): InvoiceDependency[] {
    const invoices = this.invoices.get(planId) || [];
    return invoices.filter(
      (inv) => inv.status === 'pending' || inv.status === 'processing' || inv.status === 'failed'
    );
  }

  // ============================================
  // GET ACTIVE TRIAL USERS
  // ============================================

  private getActiveTrialUsers(planId: string): TrialUserDependency[] {
    const trials = this.trialUsers.get(planId) || [];
    const now = new Date();
    return trials.filter((trial) => {
      const endDate = new Date(trial.trialEndDate);
      return endDate > now && !trial.converted;
    });
  }

  // ============================================
  // GET DEPENDENCY SUMMARY
  // ============================================

  getDependencySummary(planId: string): {
    activeSubscriptions: SubscriptionDependency[];
    pendingInvoices: InvoiceDependency[];
    activeTrialUsers: TrialUserDependency[];
    totalAffectedUsers: number;
  } {
    const activeSubs = this.getActiveSubscriptions(planId);
    const pendingInvoices = this.getPendingInvoices(planId);
    const activeTrials = this.getActiveTrialUsers(planId);

    const allUserIds = new Set([
      ...activeSubs.map((s) => s.userId),
      ...pendingInvoices.map((i) => i.userId),
      ...activeTrials.map((t) => t.userId),
    ]);

    return {
      activeSubscriptions: activeSubs,
      pendingInvoices: pendingInvoices,
      activeTrialUsers: activeTrials,
      totalAffectedUsers: allUserIds.size,
    };
  }

  // ============================================
  // CHECK IMPACT OF PRICE CHANGE
  // ============================================

  checkPriceChangeImpact(
    planId: string,
    oldPrice: number,
    newPrice: number
  ): {
    affectedUsers: number;
    revenueImpact: number;
    priceIncrease: boolean;
    priceDifference: number;
    percentageChange: number;
  } {
    const activeSubs = this.getActiveSubscriptions(planId);
    const affectedUsers = activeSubs.length;
    const priceIncrease = newPrice > oldPrice;
    const priceDifference = newPrice - oldPrice;
    const percentageChange = ((newPrice - oldPrice) / oldPrice) * 100;
    const revenueImpact = priceDifference * affectedUsers;

    return {
      affectedUsers,
      revenueImpact,
      priceIncrease,
      priceDifference,
      percentageChange,
    };
  }

  // ============================================
  // CLEAR DEPENDENCIES
  // ============================================

  clearDependencies(planId: string): void {
    this.subscriptions.delete(planId);
    this.invoices.delete(planId);
    this.trialUsers.delete(planId);
  }

  clearAll(): void {
    this.subscriptions.clear();
    this.invoices.clear();
    this.trialUsers.clear();
  }
}

// Export singleton instance
export const dependencyCheckEngine = new DependencyCheckEngine();

// ============================================
// REACT HOOK FOR DEPENDENCY CHECK
// ============================================

import { useState, useCallback } from 'react';

export function useDependencyCheck() {
  const [checkResult, setCheckResult] = useState<DependencyCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkDependencies = useCallback(async (planId: string): Promise<DependencyCheckResult> => {
    setIsLoading(true);
    
    try {
      // In production, this would call the API
      // const result = await pricingAPI.checkDependencies(planId);
      
      // For now, use the engine directly
      const result = dependencyCheckEngine.checkDependencies(planId);
      setCheckResult(result);
      return result;
    } catch (error) {
      console.error('[useDependencyCheck] Error checking dependencies:', error);
      return {
        canDelete: false,
        canEdit: true,
        hasActiveSubscriptions: false,
        activeSubscriptionCount: 0,
        hasPendingInvoices: false,
        pendingInvoiceCount: 0,
        hasTrialUsers: false,
        trialUserCount: 0,
        blockingReason: 'Failed to check dependencies',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDependencySummary = useCallback((planId: string) => {
    return dependencyCheckEngine.getDependencySummary(planId);
  }, []);

  const checkPriceChangeImpact = useCallback((planId: string, oldPrice: number, newPrice: number) => {
    return dependencyCheckEngine.checkPriceChangeImpact(planId, oldPrice, newPrice);
  }, []);

  return {
    checkResult,
    isLoading,
    checkDependencies,
    getDependencySummary,
    checkPriceChangeImpact,
  };
}
