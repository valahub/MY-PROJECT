// Dunning UI Hooks
// React hooks for dunning timeline, recovery status, and actions

import { useState, useCallback, useEffect } from 'react';
import type { Invoice, DunningTimeline, PaymentRiskScore } from '../../lib/billing/invoice-types';
import { dunningEngine } from '../../lib/billing/dunning-engine';
import { invoiceActionsManager } from '../../lib/billing/invoice-actions';
import { dunningAIEngine } from '../../lib/billing/dunning-ai';
import { invoiceAnalyticsEngine } from '../../lib/billing/invoice-analytics';

// ============================================
// DUNNING TIMELINE HOOK
// ============================================

export function useDunningTimeline(invoiceId: string) {
  const [timeline, setTimeline] = useState<DunningTimeline | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await dunningEngine.getDunningTimeline(invoiceId);
      setTimeline(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  return {
    timeline,
    isLoading,
    error,
    refresh: loadTimeline,
  };
}

// ============================================
// DUNNING ACTIONS HOOK
// ============================================

export function useDunningActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retryPayment = useCallback(async (
    invoiceId: string,
    userId: string,
    userEmail: string,
    tenantId: string
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await invoiceActionsManager.retryPayment(invoiceId, userId, userEmail, tenantId);
      if (!result.success) {
        setError(result.error || 'Failed to retry payment');
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry payment';
      setError(errorMessage);
      return {
        success: false,
        invoice: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const sendReminderEmail = useCallback(async (
    invoiceId: string,
    userId: string,
    userEmail: string,
    tenantId: string,
    customerEmail: string,
    customerName: string
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await invoiceActionsManager.sendReminderEmail(
        invoiceId,
        userId,
        userEmail,
        tenantId,
        customerEmail,
        customerName
      );
      if (!result.success) {
        setError(result.error || 'Failed to send reminder email');
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reminder email';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    error,
    retryPayment,
    sendReminderEmail,
    clearError,
  };
}

// ============================================
// PAYMENT RISK SCORE HOOK
// ============================================

export function usePaymentRiskScore(invoice: Invoice, allInvoices: Invoice[]) {
  const [riskScore, setRiskScore] = useState<PaymentRiskScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRiskScore = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const customerInvoices = allInvoices.filter((inv) => inv.customerId === invoice.customerId);
      const customerHistory = invoiceAnalyticsEngine.getCustomerPaymentHistory(
        customerInvoices,
        invoice.customerId
      );

      const score = await dunningAIEngine.calculatePaymentRiskScore(invoice, customerHistory, allInvoices);
      setRiskScore(score);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate risk score');
    } finally {
      setIsLoading(false);
    }
  }, [invoice, allInvoices]);

  useEffect(() => {
    calculateRiskScore();
  }, [calculateRiskScore]);

  return {
    riskScore,
    isLoading,
    error,
    refresh: calculateRiskScore,
  };
}

// ============================================
// DUNNING DASHBOARD HOOK
// ============================================

export function useDunningDashboard(tenantId: string, invoices: Invoice[]) {
  const [highRiskInvoices, setHighRiskInvoices] = useState<{ invoice: Invoice; riskScore: PaymentRiskScore }[]>([]);
  const [riskSummary, setRiskSummary] = useState<{
    totalInvoices: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    averageRiskScore: number;
    averageRecoveryProbability: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [highRisk, summary] = await Promise.all([
        dunningAIEngine.getHighRiskInvoices(invoices, tenantId),
        dunningAIEngine.getRiskSummary(invoices, tenantId),
      ]);

      setHighRiskInvoices(highRisk);
      setRiskSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, invoices]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    highRiskInvoices,
    riskSummary,
    isLoading,
    error,
    refresh: loadDashboard,
  };
}

// ============================================
// INVOICE STATUS BADGE HOOK
// ============================================

export function useInvoiceStatusBadge(status: Invoice['status']) {
  const getStatusColor = useCallback(() => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'overdue':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, [status]);

  const getStatusLabel = useCallback(() => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'overdue':
        return 'Overdue';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }, [status]);

  const getStatusIcon = useCallback(() => {
    switch (status) {
      case 'paid':
        return '✓';
      case 'pending':
        return '⏳';
      case 'failed':
        return '✗';
      case 'overdue':
        return '⚠';
      case 'cancelled':
        return '○';
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
// DUNNING PROGRESS HOOK
// ============================================

export function useDunningProgress(invoice: Invoice) {
  const maxRetries = 4;
  const currentRetry = invoice.retryCount || 0;
  const progress = (currentRetry / maxRetries) * 100;
  const remaining = maxRetries - currentRetry;

  const getProgressColor = useCallback(() => {
    if (progress < 25) return 'bg-green-500';
    if (progress < 50) return 'bg-yellow-500';
    if (progress < 75) return 'bg-orange-500';
    return 'bg-red-500';
  }, [progress]);

  const getProgressStatus = useCallback(() => {
    if (currentRetry === 0) return 'No attempts yet';
    if (currentRetry < maxRetries) return `${currentRetry} of ${maxRetries} attempts`;
    return 'Max attempts reached';
  }, [currentRetry, maxRetries]);

  return {
    progress,
    currentRetry,
    maxRetries,
    remaining,
    color: getProgressColor(),
    status: getProgressStatus(),
  };
}

// ============================================
// RECOVERY PREDICTION HOOK
// ============================================

export function useRecoveryPrediction(riskScore: PaymentRiskScore | null) {
  const [prediction, setPrediction] = useState<{
    willRecover: boolean;
    confidence: number;
    estimatedDays: number;
    recommendedAction: string;
  } | null>(null);

  useEffect(() => {
    if (riskScore) {
      const pred = dunningAIEngine.predictRecoveryOutcome(riskScore);
      setPrediction(pred);
    }
  }, [riskScore]);

  return prediction;
}
