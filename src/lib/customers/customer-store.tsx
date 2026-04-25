// Customer Store with React Context
// State management for customers

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest, CustomerStatus, CustomerSearchFilters, CustomerSearchResult } from './customer-types';
import { customerAPI } from './customer-api';

// ============================================
// CUSTOMER STATE
// ============================================

interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  searchResult: CustomerSearchResult | null;
  isLoading: boolean;
  error: string | null;
  filter: CustomerStatus | 'all';
}

// ============================================
// CUSTOMER ACTIONS
// ============================================

interface CustomerActions {
  loadCustomers: (tenantId: string) => Promise<void>;
  loadCustomer: (customerId: string) => Promise<void>;
  createCustomer: (request: CreateCustomerRequest) => Promise<Customer | null>;
  updateCustomer: (customerId: string, request: UpdateCustomerRequest) => Promise<Customer | null>;
  deleteCustomer: (customerId: string) => Promise<Customer | null>;
  blockCustomer: (customerId: string) => Promise<Customer | null>;
  unblockCustomer: (customerId: string) => Promise<Customer | null>;
  searchCustomers: (filters: CustomerSearchFilters, tenantId: string) => Promise<void>;
  selectCustomer: (customer: Customer | null) => void;
  setFilter: (filter: CustomerStatus | 'all') => void;
  clearError: () => void;
  refreshCustomers: () => Promise<void>;
}

// ============================================
// CUSTOMER CONTEXT
// ============================================

interface CustomerContextValue extends CustomerState, CustomerActions {}

const CustomerContext = createContext<CustomerContextValue | undefined>(undefined);

// ============================================
// CUSTOMER PROVIDER
// ============================================

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CustomerState>({
    customers: [],
    selectedCustomer: null,
    searchResult: null,
    isLoading: false,
    error: null,
    filter: 'all',
  });

  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);

  // ============================================
  // LOAD CUSTOMERS
  // ============================================

  const loadCustomers = useCallback(async (tenantId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setCurrentTenantId(tenantId);

    try {
      const result = await customerAPI.getAllCustomers(tenantId);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          customers: result.data!,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to load customers',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load customers',
      }));
    }
  }, []);

  // ============================================
  // LOAD SINGLE CUSTOMER
  // ============================================

  const loadCustomer = useCallback(async (customerId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await customerAPI.getCustomer(customerId);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          selectedCustomer: result.data!,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to load customer',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load customer',
      }));
    }
  }, []);

  // ============================================
  // CREATE CUSTOMER
  // ============================================

  const createCustomer = useCallback(async (request: CreateCustomerRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await customerAPI.createCustomer(request);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          customers: [result.data!, ...prev.customers],
          isLoading: false,
        }));

        return result.data!;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to create customer',
        }));

        return null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create customer',
      }));

      return null;
    }
  }, []);

  // ============================================
  // UPDATE CUSTOMER
  // ============================================

  const updateCustomer = useCallback(async (customerId: string, request: UpdateCustomerRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await customerAPI.updateCustomer(customerId, request);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          customers: prev.customers.map((cust) => (cust.id === customerId ? result.data! : cust)),
          selectedCustomer: prev.selectedCustomer?.id === customerId ? result.data! : prev.selectedCustomer,
          isLoading: false,
        }));

        return result.data!;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to update customer',
        }));

        return null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update customer',
      }));

      return null;
    }
  }, []);

  // ============================================
  // DELETE CUSTOMER
  // ============================================

  const deleteCustomer = useCallback(async (customerId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await customerAPI.deleteCustomer(customerId);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          customers: prev.customers.filter((cust) => cust.id !== customerId),
          selectedCustomer: prev.selectedCustomer?.id === customerId ? null : prev.selectedCustomer,
          isLoading: false,
        }));

        return result.data!;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to delete customer',
        }));

        return null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete customer',
      }));

      return null;
    }
  }, []);

  // ============================================
  // BLOCK CUSTOMER
  // ============================================

  const blockCustomer = useCallback(async (customerId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await customerAPI.blockCustomer(customerId);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          customers: prev.customers.map((cust) => (cust.id === customerId ? result.data! : cust)),
          selectedCustomer: prev.selectedCustomer?.id === customerId ? result.data! : prev.selectedCustomer,
          isLoading: false,
        }));

        return result.data!;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to block customer',
        }));

        return null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to block customer',
      }));

      return null;
    }
  }, []);

  // ============================================
  // UNBLOCK CUSTOMER
  // ============================================

  const unblockCustomer = useCallback(async (customerId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await customerAPI.unblockCustomer(customerId);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          customers: prev.customers.map((cust) => (cust.id === customerId ? result.data! : cust)),
          selectedCustomer: prev.selectedCustomer?.id === customerId ? result.data! : prev.selectedCustomer,
          isLoading: false,
        }));

        return result.data!;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to unblock customer',
        }));

        return null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to unblock customer',
      }));

      return null;
    }
  }, []);

  // ============================================
  // SEARCH CUSTOMERS
  // ============================================

  const searchCustomers = useCallback(async (filters: CustomerSearchFilters, tenantId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await customerAPI.searchCustomers(filters, tenantId);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          searchResult: result.data!,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to search customers',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to search customers',
      }));
    }
  }, []);

  // ============================================
  // SELECT CUSTOMER
  // ============================================

  const selectCustomer = useCallback((customer: Customer | null) => {
    setState((prev) => ({ ...prev, selectedCustomer: customer }));
  }, []);

  // ============================================
  // SET FILTER
  // ============================================

  const setFilter = useCallback((filter: CustomerStatus | 'all') => {
    setState((prev) => ({ ...prev, filter }));
  }, []);

  // ============================================
  // CLEAR ERROR
  // ============================================

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ============================================
  // REFRESH CUSTOMERS
  // ============================================

  const refreshCustomers = useCallback(async () => {
    if (currentTenantId) {
      await loadCustomers(currentTenantId);
    }
  }, [currentTenantId, loadCustomers]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const contextValue: CustomerContextValue = {
    ...state,
    loadCustomers,
    loadCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    blockCustomer,
    unblockCustomer,
    searchCustomers,
    selectCustomer,
    setFilter,
    clearError,
    refreshCustomers,
  };

  return <CustomerContext.Provider value={contextValue}>{children}</CustomerContext.Provider>;
}

// ============================================
// USE CUSTOMER STORE HOOK
// ============================================

export function useCustomerStore(): CustomerContextValue {
  const context = useContext(CustomerContext);

  if (!context) {
    throw new Error('useCustomerStore must be used within a CustomerProvider');
  }

  return context;
}

// ============================================
// USE FILTERED CUSTOMERS HOOK
// ============================================

export function useFilteredCustomers(): Customer[] {
  const { customers, filter } = useCustomerStore();

  if (filter === 'all') {
    return customers;
  }

  return customers.filter((customer) => customer.status === filter);
}

// ============================================
// USE CUSTOMER BY ID HOOK
// ============================================

export function useCustomerById(customerId: string): Customer | null {
  const { customers } = useCustomerStore();

  return customers.find((customer) => customer.id === customerId) || null;
}
