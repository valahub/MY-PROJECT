// Customer UI Hooks
// React hooks for customer UI components

import { useState, useCallback, useEffect } from 'react';
import type { Customer, CustomerStatus, CustomerSegment } from '../../lib/customers/customer-types';
import { customerSearchEngine } from '../../lib/customers/customer-search';
import { customerSegmentationEngine } from '../../lib/customers/customer-segmentation';
import { customerAnalyticsEngine } from '../../lib/customers/customer-analytics';

// ============================================
// CUSTOMER STATUS BADGE HOOK
// ============================================

export function useCustomerStatusBadge(status: CustomerStatus) {
  const getStatusColor = useCallback(() => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, [status]);

  const getStatusLabel = useCallback(() => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'blocked':
        return 'Blocked';
      default:
        return 'Unknown';
    }
  }, [status]);

  const getStatusIcon = useCallback(() => {
    switch (status) {
      case 'active':
        return '●';
      case 'inactive':
        return '○';
      case 'blocked':
        return '●';
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
// CUSTOMER SEGMENT BADGE HOOK
// ============================================

export function useCustomerSegmentBadge(segment: CustomerSegment) {
  const getSegmentColor = useCallback(() => {
    switch (segment) {
      case 'high_ltv':
        return 'bg-purple-100 text-purple-800';
      case 'at_risk':
        return 'bg-orange-100 text-orange-800';
      case 'new_user':
        return 'bg-blue-100 text-blue-800';
      case 'churned':
        return 'bg-red-100 text-red-800';
      case 'vip':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, [segment]);

  const getSegmentLabel = useCallback(() => {
    switch (segment) {
      case 'high_ltv':
        return 'High LTV';
      case 'at_risk':
        return 'At Risk';
      case 'new_user':
        return 'New User';
      case 'churned':
        return 'Churned';
      case 'vip':
        return 'VIP';
      default:
        return 'Unknown';
    }
  }, [segment]);

  return {
    color: getSegmentColor(),
    label: getSegmentLabel(),
  };
}

// ============================================
// CUSTOMER SEARCH HOOK
// ============================================

export function useCustomerSearch(customers: Customer[]) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all');
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers);

  const filterCustomers = useCallback(() => {
    const filters = {
      query,
      status: statusFilter === 'all' ? undefined : statusFilter,
      country: countryFilter || undefined,
    };

    const result = customerSearchEngine.searchCustomers(customers, filters);
    setFilteredCustomers(result.customers);
  }, [customers, query, statusFilter, countryFilter]);

  useEffect(() => {
    filterCustomers();
  }, [filterCustomers]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setStatusFilter('all');
    setCountryFilter(null);
  }, []);

  return {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    countryFilter,
    setCountryFilter,
    filteredCustomers,
    clearFilters,
  };
}

// ============================================
// CUSTOMER SEGMENTATION HOOK
// ============================================

export function useCustomerSegmentation(customers: Customer[]) {
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | 'all'>('all');
  const [segmentedCustomers, setSegmentedCustomers] = useState<Customer[]>(customers);

  const segmentCustomers = useCallback(() => {
    if (selectedSegment === 'all') {
      setSegmentedCustomers(customers);
    } else {
      const filtered = customerSegmentationEngine.getCustomersBySegment(customers, selectedSegment);
      setSegmentedCustomers(filtered);
    }
  }, [customers, selectedSegment]);

  useEffect(() => {
    segmentCustomers();
  }, [segmentCustomers]);

  return {
    selectedSegment,
    setSelectedSegment,
    segmentedCustomers,
  };
}

// ============================================
// CUSTOMER ANALYTICS HOOK
// ============================================

export function useCustomerAnalytics(customers: Customer[]) {
  const [analytics, setAnalytics] = useState(customerAnalyticsEngine.calculateAnalytics(customers));

  const refreshAnalytics = useCallback(() => {
    setAnalytics(customerAnalyticsEngine.calculateAnalytics(customers));
  }, [customers]);

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  return {
    analytics,
    refreshAnalytics,
  };
}

// ============================================
// CUSTOMER SORT HOOK
// ============================================

export function useCustomerSort(customers: Customer[]) {
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'ltv' | 'churn_risk' | 'fraud_risk' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortedCustomers, setSortedCustomers] = useState<Customer[]>(customers);

  const sortCustomers = useCallback(() => {
    const filters = {
      sortBy,
      sortOrder,
    };

    const result = customerSearchEngine.searchCustomers(customers, filters);
    setSortedCustomers(result.customers);
  }, [customers, sortBy, sortOrder]);

  useEffect(() => {
    sortCustomers();
  }, [sortCustomers]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder]);

  return {
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSortOrder,
    sortedCustomers,
  };
}

// ============================================
// CUSTOMER PAGINATION HOOK
// ============================================

export function useCustomerPagination(customers: Customer[], pageSize: number = 20) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(customers.length / pageSize);

  const paginatedCustomers = customers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    resetPagination();
  }, [customers.length, resetPagination]);

  return {
    currentPage,
    totalPages,
    paginatedCustomers,
    goToPage,
    nextPage,
    previousPage,
    resetPagination,
  };
}

// ============================================
// CUSTOMER SELECTION HOOK
// ============================================

export function useCustomerSelection(customers: Customer[]) {
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());

  const toggleCustomerSelection = useCallback((customerId: string) => {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedCustomerIds(new Set(customers.map((c) => c.id)));
  }, [customers]);

  const clearSelection = useCallback(() => {
    setSelectedCustomerIds(new Set());
  }, []);

  const selectedCustomers = customers.filter((c) => selectedCustomerIds.has(c.id));
  const isAllSelected = selectedCustomerIds.size === customers.length && customers.length > 0;
  const isSomeSelected = selectedCustomerIds.size > 0;

  return {
    selectedCustomerIds,
    selectedCustomers,
    isAllSelected,
    isSomeSelected,
    toggleCustomerSelection,
    selectAll,
    clearSelection,
  };
}

// ============================================
// CUSTOMER DETAILS HOOK
// ============================================

export function useCustomerDetails(customerId: string, customers: Customer[]) {
  const customer = customers.find((c) => c.id === customerId);

  const getCustomerSegments = useCallback(() => {
    if (!customer) return [];
    return customerSegmentationEngine.getCustomerSegment(customer, customers);
  }, [customer, customers]);

  const getCustomerAnalytics = useCallback(() => {
    if (!customer) return null;
    return customerAnalyticsEngine.getCustomerHealthScore(customer);
  }, [customer]);

  return {
    customer,
    getCustomerSegments,
    getCustomerAnalytics,
  };
}

// ============================================
// CUSTOMER ACTIVITY HOOK
// ============================================

export function useCustomerActivity(customerId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  const loadActivity = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, fetch from API
      const logs: any[] = []; // Placeholder
      setActivityLogs(logs);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  return {
    isLoading,
    activityLogs,
    refresh: loadActivity,
  };
}

// ============================================
// CUSTOMER RISK SCORE HOOK
// ============================================

export function useCustomerRiskScores(customer: Customer) {
  const churnScore = customer.churnRiskScore;
  const fraudScore = customer.fraudRiskScore;

  const getChurnRiskColor = useCallback(() => {
    if (churnScore < 30) return 'text-green-600';
    if (churnScore < 50) return 'text-yellow-600';
    if (churnScore < 70) return 'text-orange-600';
    return 'text-red-600';
  }, [churnScore]);

  const getFraudRiskColor = useCallback(() => {
    if (fraudScore < 30) return 'text-green-600';
    if (fraudScore < 50) return 'text-yellow-600';
    if (fraudScore < 70) return 'text-orange-600';
    return 'text-red-600';
  }, [fraudScore]);

  const getOverallRisk = useCallback(() => {
    return Math.round((churnScore + fraudScore) / 2);
  }, [churnScore, fraudScore]);

  return {
    churnScore,
    fraudScore,
    overallRisk: getOverallRisk(),
    churnRiskColor: getChurnRiskColor(),
    fraudRiskColor: getFraudRiskColor(),
  };
}

// ============================================
// CUSTOMER FILTER HOOK
// ============================================

export function useCustomerFilters(customers: Customer[]) {
  const [filters, setFilters] = useState({
    status: 'all' as CustomerStatus | 'all',
    segment: 'all' as CustomerSegment | 'all',
    minLTV: undefined as number | undefined,
    maxLTV: undefined as number | undefined,
    minChurnRisk: undefined as number | undefined,
    maxChurnRisk: undefined as number | undefined,
  });

  const filteredCustomers = useCallback(() => {
    let result = customers;

    if (filters.status !== 'all') {
      result = result.filter((c) => c.status === filters.status);
    }

    if (filters.segment !== 'all') {
      result = customerSegmentationEngine.getCustomersBySegment(result, filters.segment);
    }

    if (filters.minLTV !== undefined) {
      result = result.filter((c) => c.ltv >= filters.minLTV!);
    }

    if (filters.maxLTV !== undefined) {
      result = result.filter((c) => c.ltv <= filters.maxLTV!);
    }

    if (filters.minChurnRisk !== undefined) {
      result = result.filter((c) => c.churnRiskScore >= filters.minChurnRisk!);
    }

    if (filters.maxChurnRisk !== undefined) {
      result = result.filter((c) => c.churnRiskScore <= filters.maxChurnRisk!);
    }

    return result;
  }, [customers, filters]);

  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      segment: 'all',
      minLTV: undefined,
      maxLTV: undefined,
      minChurnRisk: undefined,
      maxChurnRisk: undefined,
    });
  }, []);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== 'all' && v !== undefined
  ).length;

  return {
    filters,
    setFilters,
    filteredCustomers: filteredCustomers(),
    clearFilters,
    activeFilterCount,
  };
}
