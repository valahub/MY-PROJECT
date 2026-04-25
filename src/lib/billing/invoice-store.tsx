// Invoice Store with React Context
// State management for invoices and dunning

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { Invoice, CreateInvoiceRequest, UpdateInvoiceRequest, InvoiceStatus, DunningTimeline } from './invoice-types';
import { invoiceAPI } from './invoice-api';

// ============================================
// INVOICE STATE
// ============================================

interface InvoiceState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  isLoading: boolean;
  error: string | null;
  filter: InvoiceStatus | 'all';
}

// ============================================
// INVOICE ACTIONS
// ============================================

interface InvoiceActions {
  loadInvoices: (tenantId: string) => Promise<void>;
  loadInvoice: (invoiceId: string) => Promise<void>;
  createInvoice: (request: CreateInvoiceRequest, tenantId: string) => Promise<Invoice | null>;
  updateInvoice: (invoiceId: string, request: UpdateInvoiceRequest) => Promise<Invoice | null>;
  markAsPaid: (invoiceId: string, paymentDate?: string) => Promise<Invoice | null>;
  retryPayment: (invoiceId: string) => Promise<Invoice | null>;
  selectInvoice: (invoice: Invoice | null) => void;
  setFilter: (filter: InvoiceStatus | 'all') => void;
  clearError: () => void;
  refreshInvoices: () => Promise<void>;
}

// ============================================
// INVOICE CONTEXT
// ============================================

interface InvoiceContextValue extends InvoiceState, InvoiceActions {}

const InvoiceContext = createContext<InvoiceContextValue | undefined>(undefined);

// ============================================
// INVOICE PROVIDER
// ============================================

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InvoiceState>({
    invoices: [],
    selectedInvoice: null,
    isLoading: false,
    error: null,
    filter: 'all',
  });

  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);

  // ============================================
  // LOAD INVOICES
  // ============================================

  const loadInvoices = useCallback(async (tenantId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setCurrentTenantId(tenantId);

    try {
      const result = await invoiceAPI.getAllInvoices(tenantId);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          invoices: result.data!,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to load invoices',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load invoices',
      }));
    }
  }, []);

  // ============================================
  // LOAD SINGLE INVOICE
  // ============================================

  const loadInvoice = useCallback(async (invoiceId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await invoiceAPI.getInvoice(invoiceId);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          selectedInvoice: result.data!,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to load invoice',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load invoice',
      }));
    }
  }, []);

  // ============================================
  // CREATE INVOICE
  // ============================================

  const createInvoice = useCallback(async (request: CreateInvoiceRequest, tenantId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await invoiceAPI.createInvoice(request, tenantId);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          invoices: [result.data!, ...prev.invoices],
          isLoading: false,
        }));

        return result.data!;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to create invoice',
        }));

        return null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create invoice',
      }));

      return null;
    }
  }, []);

  // ============================================
  // UPDATE INVOICE
  // ============================================

  const updateInvoice = useCallback(async (invoiceId: string, request: UpdateInvoiceRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await invoiceAPI.updateInvoice(invoiceId, request);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          invoices: prev.invoices.map((inv) => (inv.id === invoiceId ? result.data! : inv)),
          selectedInvoice: prev.selectedInvoice?.id === invoiceId ? result.data! : prev.selectedInvoice,
          isLoading: false,
        }));

        return result.data!;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to update invoice',
        }));

        return null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update invoice',
      }));

      return null;
    }
  }, []);

  // ============================================
  // MARK AS PAID
  // ============================================

  const markAsPaid = useCallback(async (invoiceId: string, paymentDate?: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await invoiceAPI.markInvoiceAsPaid(invoiceId, paymentDate);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          invoices: prev.invoices.map((inv) => (inv.id === invoiceId ? result.data! : inv)),
          selectedInvoice: prev.selectedInvoice?.id === invoiceId ? result.data! : prev.selectedInvoice,
          isLoading: false,
        }));

        return result.data!;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to mark invoice as paid',
        }));

        return null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to mark invoice as paid',
      }));

      return null;
    }
  }, []);

  // ============================================
  // RETRY PAYMENT
  // ============================================

  const retryPayment = useCallback(async (invoiceId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await invoiceAPI.retryPayment(invoiceId);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          invoices: prev.invoices.map((inv) => (inv.id === invoiceId ? result.data! : inv)),
          selectedInvoice: prev.selectedInvoice?.id === invoiceId ? result.data! : prev.selectedInvoice,
          isLoading: false,
        }));

        return result.data!;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to retry payment',
        }));

        return null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to retry payment',
      }));

      return null;
    }
  }, []);

  // ============================================
  // SELECT INVOICE
  // ============================================

  const selectInvoice = useCallback((invoice: Invoice | null) => {
    setState((prev) => ({ ...prev, selectedInvoice: invoice }));
  }, []);

  // ============================================
  // SET FILTER
  // ============================================

  const setFilter = useCallback((filter: InvoiceStatus | 'all') => {
    setState((prev) => ({ ...prev, filter }));
  }, []);

  // ============================================
  // CLEAR ERROR
  // ============================================

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ============================================
  // REFRESH INVOICES
  // ============================================

  const refreshInvoices = useCallback(async () => {
    if (currentTenantId) {
      await loadInvoices(currentTenantId);
    }
  }, [currentTenantId, loadInvoices]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const contextValue: InvoiceContextValue = {
    ...state,
    loadInvoices,
    loadInvoice,
    createInvoice,
    updateInvoice,
    markAsPaid,
    retryPayment,
    selectInvoice,
    setFilter,
    clearError,
    refreshInvoices,
  };

  return <InvoiceContext.Provider value={contextValue}>{children}</InvoiceContext.Provider>;
}

// ============================================
// USE INVOICE STORE HOOK
// ============================================

export function useInvoiceStore(): InvoiceContextValue {
  const context = useContext(InvoiceContext);

  if (!context) {
    throw new Error('useInvoiceStore must be used within an InvoiceProvider');
  }

  return context;
}

// ============================================
// USE FILTERED INVOICES HOOK
// ============================================

export function useFilteredInvoices(): Invoice[] {
  const { invoices, filter } = useInvoiceStore();

  if (filter === 'all') {
    return invoices;
  }

  return invoices.filter((invoice) => invoice.status === filter);
}

// ============================================
// USE INVOICE BY ID HOOK
// ============================================

export function useInvoiceById(invoiceId: string): Invoice | null {
  const { invoices } = useInvoiceStore();

  return invoices.find((invoice) => invoice.id === invoiceId) || null;
}
