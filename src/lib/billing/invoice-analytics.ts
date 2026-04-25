// Invoice Analytics
// Calculate total invoices, failed payments, recovered revenue, revenue lost

import type { Invoice, InvoiceAnalytics } from './invoice-types';

// ============================================
// INVOICE ANALYTICS ENGINE
// ============================================

export class InvoiceAnalyticsEngine {
  // ============================================
  // CALCULATE ANALYTICS FROM INVOICES
  // ============================================

  calculateAnalytics(invoices: Invoice[]): InvoiceAnalytics {
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length;
    const failedInvoices = invoices.filter((inv) => inv.status === 'failed').length;
    const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue').length;
    const pendingInvoices = invoices.filter((inv) => inv.status === 'pending').length;

    const totalRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const recoveredRevenue = invoices
      .filter((inv) => inv.status === 'paid' && inv.retryCount > 0)
      .reduce((sum, inv) => sum + inv.amount, 0);

    const lostRevenue = invoices
      .filter((inv) => inv.status === 'failed' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const totalFailedWithRetries = invoices.filter((inv) => inv.status === 'failed' && inv.retryCount > 0).length;
    const recoveryRate = totalFailedWithRetries > 0 ? (recoveredRevenue / (recoveredRevenue + lostRevenue)) * 100 : 0;

    const averagePaymentTime = this.calculateAveragePaymentTime(invoices);

    return {
      totalInvoices,
      paidInvoices,
      failedInvoices,
      overdueInvoices,
      pendingInvoices,
      totalRevenue,
      recoveredRevenue,
      lostRevenue,
      recoveryRate,
      averagePaymentTime,
    };
  }

  // ============================================
  // CALCULATE AVERAGE PAYMENT TIME
  // ============================================

  private calculateAveragePaymentTime(invoices: Invoice[]): number {
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid' && inv.paidAt && inv.issuedAt);

    if (paidInvoices.length === 0) return 0;

    const totalDays = paidInvoices.reduce((sum, inv) => {
      const issued = new Date(inv.issuedAt).getTime();
      const paid = new Date(inv.paidAt!).getTime();
      const days = (paid - issued) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return totalDays / paidInvoices.length;
  }

  // ============================================
  // GET INVOICE TREND
  // ============================================

  getInvoiceTrend(invoices: Invoice[], days: number = 30): {
    dailyRevenue: { date: string; revenue: number }[];
    dailyCount: { date: string; count: number }[];
  } {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const dailyRevenue: { date: string; revenue: number }[] = [];
    const dailyCount: { date: string; count: number }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const dayInvoices = invoices.filter((inv) => {
        const invDate = new Date(inv.issuedAt).toISOString().split('T')[0];
        return invDate === dateStr;
      });

      const revenue = dayInvoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0);

      dailyRevenue.push({ date: dateStr, revenue });
      dailyCount.push({ date: dateStr, count: dayInvoices.length });
    }

    return { dailyRevenue, dailyCount };
  }

  // ============================================
  // GET PAYMENT SUCCESS RATE
  // ============================================

  getPaymentSuccessRate(invoices: Invoice[]): number {
    const totalInvoices = invoices.length;
    if (totalInvoices === 0) return 0;

    const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length;
    return (paidInvoices / totalInvoices) * 100;
  }

  // ============================================
  // GET RECOVERY RATE BY ATTEMPT
  // ============================================

  getRecoveryRateByAttempt(invoices: Invoice[]): { [attempt: number]: { total: number; recovered: number; rate: number } } {
    const result: { [attempt: number]: { total: number; recovered: number; rate: number } } = {};

    for (const invoice of invoices) {
      const attempt = invoice.retryCount || 0;
      if (!result[attempt]) {
        result[attempt] = { total: 0, recovered: 0, rate: 0 };
      }

      result[attempt].total++;

      if (invoice.status === 'paid') {
        result[attempt].recovered++;
      }
    }

    // Calculate rates
    for (const key in result) {
      const attempt = parseInt(key);
      result[attempt].rate = result[attempt].total > 0 ? (result[attempt].recovered / result[attempt].total) * 100 : 0;
    }

    return result;
  }

  // ============================================
  // GET OVERDUE TREND
  // ============================================

  getOverdueTrend(invoices: Invoice[], days: number = 30): { date: string; count: number; amount: number }[] {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const trend: { date: string; count: number; amount: number }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const overdueInvoices = invoices.filter((inv) => {
        const dueDate = new Date(inv.dueDate).toISOString().split('T')[0];
        return dueDate === dateStr && (inv.status === 'overdue' || inv.status === 'failed');
      });

      const amount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

      trend.push({ date: dateStr, count: overdueInvoices.length, amount });
    }

    return trend;
  }

  // ============================================
  // GET CUSTOMER PAYMENT HISTORY
  // ============================================

  getCustomerPaymentHistory(invoices: Invoice[], customerId: string): {
    totalInvoices: number;
    paidInvoices: number;
    failedInvoices: number;
    totalAmount: number;
    paidAmount: number;
    averagePaymentTime: number;
  } {
    const customerInvoices = invoices.filter((inv) => inv.customerId === customerId);

    const totalInvoices = customerInvoices.length;
    const paidInvoices = customerInvoices.filter((inv) => inv.status === 'paid').length;
    const failedInvoices = customerInvoices.filter((inv) => inv.status === 'failed').length;

    const totalAmount = customerInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = customerInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const averagePaymentTime = this.calculateAveragePaymentTime(customerInvoices);

    return {
      totalInvoices,
      paidInvoices,
      failedInvoices,
      totalAmount,
      paidAmount,
      averagePaymentTime,
    };
  }

  // ============================================
  // PREDICT RECOVERY PROBABILITY
  // ============================================

  predictRecoveryProbability(invoice: Invoice, customerHistory: { totalInvoices: number; paidInvoices: number }): number {
    // Simple ML-like prediction based on factors
    let probability = 50; // Base probability

    // Factor 1: Customer payment history
    if (customerHistory.totalInvoices > 0) {
      const paymentRate = (customerHistory.paidInvoices / customerHistory.totalInvoices) * 100;
      probability += (paymentRate - 50) * 0.5;
    }

    // Factor 2: Invoice amount (smaller amounts have higher recovery rate)
    if (invoice.amount < 50) {
      probability += 20;
    } else if (invoice.amount < 100) {
      probability += 10;
    } else if (invoice.amount > 500) {
      probability -= 15;
    }

    // Factor 3: Retry count (higher retries = lower probability)
    probability -= (invoice.retryCount || 0) * 15;

    // Factor 4: Days overdue (older invoices = lower probability)
    const daysOverdue = (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOverdue > 30) {
      probability -= 30;
    } else if (daysOverdue > 14) {
      probability -= 15;
    } else if (daysOverdue > 7) {
      probability -= 5;
    }

    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, probability));
  }
}

// Export singleton instance
export const invoiceAnalyticsEngine = new InvoiceAnalyticsEngine();
