// License UI Hooks
// React hooks for license UI components

import { useState, useCallback, useEffect } from 'react';
import type { License, LicenseStatus } from '../../lib/licenses/license-types';
import { licenseKeyGenerator } from '../../lib/licenses/license-generator';
import { licenseActionsManager } from '../../lib/licenses/license-actions';

// ============================================
// LICENSE STATUS BADGE HOOK
// ============================================

export function useLicenseStatusBadge(status: LicenseStatus) {
  const getStatusColor = useCallback(() => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'disabled':
        return 'bg-gray-100 text-gray-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, [status]);

  const getStatusLabel = useCallback(() => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'expired':
        return 'Expired';
      case 'disabled':
        return 'Disabled';
      case 'revoked':
        return 'Revoked';
      default:
        return 'Unknown';
    }
  }, [status]);

  const getStatusIcon = useCallback(() => {
    switch (status) {
      case 'active':
        return '●';
      case 'expired':
        return '●';
      case 'disabled':
        return '○';
      case 'revoked':
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
// LICENSE KEY MASKING HOOK
// ============================================

export function useLicenseKeyMasking() {
  const maskLicenseKey = useCallback((licenseKey: string) => {
    return licenseKeyGenerator.maskLicenseKey(licenseKey);
  }, []);

  const copyToClipboard = useCallback(async (licenseKey: string) => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    maskLicenseKey,
    copyToClipboard,
  };
}

// ============================================
// LICENSE SELECTION HOOK
// ============================================

export function useLicenseSelection(licenses: License[]) {
  const [selectedLicenseIds, setSelectedLicenseIds] = useState<Set<string>>(new Set());

  const toggleLicenseSelection = useCallback((licenseId: string) => {
    setSelectedLicenseIds((prev) => {
      const next = new Set(prev);
      if (next.has(licenseId)) {
        next.delete(licenseId);
      } else {
        next.add(licenseId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedLicenseIds(new Set(licenses.map((l) => l.id)));
  }, [licenses]);

  const clearSelection = useCallback(() => {
    setSelectedLicenseIds(new Set());
  }, []);

  const selectedLicenses = licenses.filter((l) => selectedLicenseIds.has(l.id));
  const isAllSelected = selectedLicenseIds.size === licenses.length && licenses.length > 0;
  const isSomeSelected = selectedLicenseIds.size > 0;

  return {
    selectedLicenseIds,
    selectedLicenses,
    isAllSelected,
    isSomeSelected,
    toggleLicenseSelection,
    selectAll,
    clearSelection,
  };
}

// ============================================
// LICENSE SORT HOOK
// ============================================

export function useLicenseSort(licenses: License[]) {
  const [sortBy, setSortBy] = useState<'licenseKey' | 'expiresAt' | 'issuedAt' | 'activationCount' | 'lastCheckAt'>('issuedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortedLicenses, setSortedLicenses] = useState<License[]>(licenses);

  const sortLicenses = useCallback(() => {
    const sorted = [...licenses];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'licenseKey':
          comparison = a.licenseKey.localeCompare(b.licenseKey);
          break;
        case 'expiresAt':
          comparison = new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
          break;
        case 'issuedAt':
          comparison = new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
          break;
        case 'activationCount':
          comparison = a.activationCount - b.activationCount;
          break;
        case 'lastCheckAt':
          comparison = new Date(a.lastCheckAt).getTime() - new Date(b.lastCheckAt).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setSortedLicenses(sorted);
  }, [licenses, sortBy, sortOrder]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder]);

  return {
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSortOrder,
    sortedLicenses,
  };
}

// ============================================
// LICENSE PAGINATION HOOK
// ============================================

export function useLicensePagination(licenses: License[], pageSize: number = 20) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(licenses.length / pageSize);

  const paginatedLicenses = licenses.slice(
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
  }, [licenses.length, resetPagination]);

  return {
    currentPage,
    totalPages,
    paginatedLicenses,
    goToPage,
    nextPage,
    previousPage,
    resetPagination,
  };
}

// ============================================
// LICENSE DETAILS HOOK
// ============================================

export function useLicenseDetails(licenseId: string, licenses: License[]) {
  const license = licenses.find((l) => l.id === licenseId);

  const getActivationSummary = useCallback(() => {
    if (!license) return null;
    return licenseActionsManager.getActivationSummary(license);
  }, [license]);

  const getDevices = useCallback(() => {
    if (!license) return [];
    return licenseActionsManager.getLicenseDevices(license);
  }, [license]);

  return {
    license,
    getActivationSummary,
    getDevices,
  };
}

// ============================================
// LICENSE FILTER HOOK
// ============================================

export function useLicenseFilter(licenses: License[]) {
  const [filters, setFilters] = useState({
    status: 'all' as LicenseStatus | 'all',
    productId: '',
    customerId: '',
  });

  const filteredLicenses = useCallback(() => {
    let result = licenses;

    if (filters.status !== 'all') {
      result = result.filter((l) => l.status === filters.status);
    }

    if (filters.productId) {
      result = result.filter((l) => l.productId === filters.productId);
    }

    if (filters.customerId) {
      result = result.filter((l) => l.customerId === filters.customerId);
    }

    return result;
  }, [licenses, filters]);

  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      productId: '',
      customerId: '',
    });
  }, []);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== 'all' && v !== ''
  ).length;

  return {
    filters,
    setFilters,
    filteredLicenses: filteredLicenses(),
    clearFilters,
    activeFilterCount,
  };
}

// ============================================
// LICENSE EXPIRY WARNING HOOK
// ============================================

export function useLicenseExpiryWarning(license: License) {
  const getExpiryWarning = useCallback(() => {
    if (license.status !== 'active') return null;

    const now = new Date();
    const expiresAt = new Date(license.expiresAt);
    const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { type: 'expired', days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry <= 7) {
      return { type: 'critical', days: daysUntilExpiry };
    } else if (daysUntilExpiry <= 30) {
      return { type: 'warning', days: daysUntilExpiry };
    }

    return null;
  }, [license]);

  return {
    getExpiryWarning,
  };
}

// ============================================
// LICENSE ACTIVATION STATUS HOOK
// ============================================

export function useLicenseActivationStatus(license: License) {
  const getActivationStatus = useCallback(() => {
    const { activationCount, activationLimit } = license;
    const percentage = activationLimit > 0 ? (activationCount / activationLimit) * 100 : 0;

    if (activationCount >= activationLimit) {
      return { status: 'full', percentage, remaining: 0 };
    } else if (percentage >= 80) {
      return { status: 'near-limit', percentage, remaining: activationLimit - activationCount };
    } else if (percentage >= 50) {
      return { status: 'half', percentage, remaining: activationLimit - activationCount };
    }

    return { status: 'available', percentage, remaining: activationLimit - activationCount };
  }, [license]);

  return {
    getActivationStatus,
  };
}
