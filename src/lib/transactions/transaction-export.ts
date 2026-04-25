// Transaction Export Functionality
// CSV/Excel export

import type { Transaction } from './transaction-types';

// ============================================
// EXPORT FORMAT
// ============================================

export type ExportFormat = 'csv' | 'excel';

// ============================================
// EXPORT RESULT
// ============================================

export interface ExportResult {
  success: boolean;
  data: string | null;
  filename: string;
  mimeType: string;
  error?: string;
  timestamp: string;
}

// ============================================
// TRANSACTION EXPORT ENGINE
// ============================================

export class TransactionExportEngine {
  // ============================================
  // EXPORT TRANSACTIONS
  // ============================================

  exportTransactions(transactions: Transaction[], format: ExportFormat = 'csv'): ExportResult {
    try {
      let data: string;
      let filename: string;
      let mimeType: string;

      if (format === 'csv') {
        data = this.exportToCSV(transactions);
        filename = `transactions_${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else {
        data = this.exportToExcel(transactions);
        filename = `transactions_${Date.now()}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }

      return {
        success: true,
        data,
        filename,
        mimeType,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        filename: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Failed to export transactions',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // EXPORT TO CSV
  // ============================================

  private exportToCSV(transactions: Transaction[]): string {
    const headers = [
      'Transaction ID',
      'Customer ID',
      'Subscription ID',
      'Type',
      'Amount',
      'Currency',
      'Status',
      'Payment Method',
      'Provider',
      'Provider Txn ID',
      'Fraud Risk',
      'Created At',
      'Updated At',
    ];

    const rows = transactions.map((transaction) => [
      transaction.id,
      transaction.customerId,
      transaction.subscriptionId || '',
      transaction.type,
      transaction.amount.toString(),
      transaction.currency,
      transaction.status,
      transaction.paymentMethod,
      transaction.provider,
      transaction.providerTxnId,
      transaction.fraudRisk,
      transaction.createdAt,
      transaction.updatedAt,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => this.escapeCSVCell(cell)).join(',')),
    ].join('\n');

    return csvContent;
  }

  // ============================================
  // ESCAPE CSV CELL
  // ============================================

  private escapeCSVCell(cell: string): string {
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  }

  // ============================================
  // EXPORT TO EXCEL (SIMPLIFIED)
  // ============================================

  private exportToExcel(transactions: Transaction[]): string {
    // In production, use a library like xlsx or exceljs
    // For now, return CSV as placeholder
    return this.exportToCSV(transactions);
  }

  // ============================================
  // EXPORT FILTERED TRANSACTIONS
  // ============================================

  exportFilteredTransactions(
    transactions: Transaction[],
    filters: {
      type?: 'payment' | 'refund';
      status?: string;
      startDate?: string;
      endDate?: string;
    },
    format: ExportFormat = 'csv'
  ): ExportResult {
    let filtered = [...transactions];

    if (filters.type) {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter((t) => t.status === filters.status);
    }

    if (filters.startDate) {
      filtered = filtered.filter((t) => new Date(t.createdAt) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      filtered = filtered.filter((t) => new Date(t.createdAt) <= new Date(filters.endDate));
    }

    return this.exportTransactions(filtered, format);
  }

  // ============================================
  // GET EXPORT SUMMARY
  // ============================================

  getExportSummary(transactions: Transaction[]): {
    totalTransactions: number;
    totalAmount: number;
    currencyBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
    statusBreakdown: Record<string, number>;
  } {
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    const currencyBreakdown: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};

    for (const transaction of transactions) {
      currencyBreakdown[transaction.currency] = (currencyBreakdown[transaction.currency] || 0) + transaction.amount;
      typeBreakdown[transaction.type] = (typeBreakdown[transaction.type] || 0) + 1;
      statusBreakdown[transaction.status] = (statusBreakdown[transaction.status] || 0) + 1;
    }

    return {
      totalTransactions,
      totalAmount,
      currencyBreakdown,
      typeBreakdown,
      statusBreakdown,
    };
  }

  // ============================================
  // DOWNLOAD FILE
  // ============================================

  downloadFile(data: string, filename: string, mimeType: string): void {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const transactionExportEngine = new TransactionExportEngine();

// ============================================
// REACT HOOK FOR TRANSACTION EXPORT
// ============================================

import { useState, useCallback } from 'react';

export function useTransactionExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportTransactions = useCallback((transactions: Transaction[], format: ExportFormat = 'csv') => {
    setIsExporting(true);
    setError(null);

    try {
      const result = transactionExportEngine.exportTransactions(transactions, format);
      if (!result.success) {
        setError(result.error || 'Failed to export transactions');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export transactions';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        filename: '',
        mimeType: '',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportFilteredTransactions = useCallback((
    transactions: Transaction[],
    filters: {
      type?: 'payment' | 'refund';
      status?: string;
      startDate?: string;
      endDate?: string;
    },
    format: ExportFormat = 'csv'
  ) => {
    setIsExporting(true);
    setError(null);

    try {
      const result = transactionExportEngine.exportFilteredTransactions(transactions, filters, format);
      if (!result.success) {
        setError(result.error || 'Failed to export transactions');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export transactions';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        filename: '',
        mimeType: '',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsExporting(false);
    }
  }, []);

  const downloadFile = useCallback((data: string, filename: string, mimeType: string) => {
    transactionExportEngine.downloadFile(data, filename, mimeType);
  }, []);

  const getExportSummary = useCallback((transactions: Transaction[]) => {
    return transactionExportEngine.getExportSummary(transactions);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isExporting,
    error,
    exportTransactions,
    exportFilteredTransactions,
    downloadFile,
    getExportSummary,
    clearError,
  };
}
