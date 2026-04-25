// License Store with React Context
// State management for licenses

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { License, GenerateLicenseRequest, ActivateLicenseRequest, LicenseStatus, LicenseSearchFilters, LicenseSearchResult } from './license-types';
import { licenseAPI } from './license-api';

// ============================================
// LICENSE STATE
// ============================================

interface LicenseState {
  licenses: License[];
  selectedLicense: License | null;
  searchResult: LicenseSearchResult | null;
  isLoading: boolean;
  error: string | null;
  filter: LicenseStatus | 'all';
}

// ============================================
// LICENSE ACTIONS
// ============================================

interface LicenseActions {
  loadLicenses: (tenantId: string) => Promise<void>;
  loadLicense: (licenseId: string) => Promise<void>;
  generateLicense: (request: GenerateLicenseRequest) => Promise<License | null>;
  activateLicense: (request: ActivateLicenseRequest) => Promise<void>;
  deactivateLicense: (licenseId: string, deviceId: string) => Promise<void>;
  deleteLicense: (licenseId: string) => Promise<License | null>;
  searchLicenses: (filters: LicenseSearchFilters, tenantId: string) => Promise<void>;
  selectLicense: (license: License | null) => void;
  setFilter: (filter: LicenseStatus | 'all') => void;
  clearError: () => void;
  refreshLicenses: () => Promise<void>;
}

// ============================================
// LICENSE CONTEXT
// ============================================

interface LicenseContextValue extends LicenseState, LicenseActions {}

const LicenseContext = createContext<LicenseContextValue | undefined>(undefined);

// ============================================
// LICENSE PROVIDER
// ============================================

export function LicenseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LicenseState>({
    licenses: [],
    selectedLicense: null,
    searchResult: null,
    isLoading: false,
    error: null,
    filter: 'all',
  });

  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);

  // ============================================
  // LOAD LICENSES
  // ============================================

  const loadLicenses = useCallback(async (tenantId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setCurrentTenantId(tenantId);

    try {
      const result = await licenseAPI.getAllLicenses(tenantId);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          licenses: result.data!,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to load licenses',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load licenses',
      }));
    }
  }, []);

  // ============================================
  // LOAD SINGLE LICENSE
  // ============================================

  const loadLicense = useCallback(async (licenseId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await licenseAPI.getLicense(licenseId);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          selectedLicense: result.data!,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to load license',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load license',
      }));
    }
  }, []);

  // ============================================
  // GENERATE LICENSE
  // ============================================

  const generateLicense = useCallback(async (request: GenerateLicenseRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await licenseAPI.generateLicense(request);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          licenses: [result.data!, ...prev.licenses],
          isLoading: false,
        }));

        return result.data!;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to generate license',
        }));

        return null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate license',
      }));

      return null;
    }
  }, []);

  // ============================================
  // ACTIVATE LICENSE
  // ============================================

  const activateLicense = useCallback(async (request: ActivateLicenseRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await licenseAPI.activateLicense(request);

      if (result.success && result.license) {
        setState((prev) => ({
          ...prev,
          licenses: prev.licenses.map((lic) => (lic.id === result.license!.id ? result.license! : lic)),
          selectedLicense: prev.selectedLicense?.id === result.license!.id ? result.license! : prev.selectedLicense,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to activate license',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to activate license',
      }));
    }
  }, []);

  // ============================================
  // DEACTIVATE LICENSE
  // ============================================

  const deactivateLicense = useCallback(async (licenseId: string, deviceId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await licenseAPI.deactivateLicense(licenseId, deviceId);

      if (result.success && result.license) {
        setState((prev) => ({
          ...prev,
          licenses: prev.licenses.map((lic) => (lic.id === result.license!.id ? result.license! : lic)),
          selectedLicense: prev.selectedLicense?.id === result.license!.id ? result.license! : prev.selectedLicense,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to deactivate license',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate license',
      }));
    }
  }, []);

  // ============================================
  // DELETE LICENSE
  // ============================================

  const deleteLicense = useCallback(async (licenseId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await licenseAPI.deleteLicense(licenseId);

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          licenses: prev.licenses.filter((lic) => lic.id !== licenseId),
          selectedLicense: prev.selectedLicense?.id === licenseId ? null : prev.selectedLicense,
          isLoading: false,
        }));

        return result.data!;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to delete license',
        }));

        return null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete license',
      }));

      return null;
    }
  }, []);

  // ============================================
  // SEARCH LICENSES
  // ============================================

  const searchLicenses = useCallback(async (filters: LicenseSearchFilters, tenantId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await licenseAPI.searchLicenses(filters, tenantId);

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
          error: result.error || 'Failed to search licenses',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to search licenses',
      }));
    }
  }, []);

  // ============================================
  // SELECT LICENSE
  // ============================================

  const selectLicense = useCallback((license: License | null) => {
    setState((prev) => ({ ...prev, selectedLicense: license }));
  }, []);

  // ============================================
  // SET FILTER
  // ============================================

  const setFilter = useCallback((filter: LicenseStatus | 'all') => {
    setState((prev) => ({ ...prev, filter }));
  }, []);

  // ============================================
  // CLEAR ERROR
  // ============================================

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ============================================
  // REFRESH LICENSES
  // ============================================

  const refreshLicenses = useCallback(async () => {
    if (currentTenantId) {
      await loadLicenses(currentTenantId);
    }
  }, [currentTenantId, loadLicenses]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const contextValue: LicenseContextValue = {
    ...state,
    loadLicenses,
    loadLicense,
    generateLicense,
    activateLicense,
    deactivateLicense,
    deleteLicense,
    searchLicenses,
    selectLicense,
    setFilter,
    clearError,
    refreshLicenses,
  };

  return <LicenseContext.Provider value={contextValue}>{children}</LicenseContext.Provider>;
}

// ============================================
// USE LICENSE STORE HOOK
// ============================================

export function useLicenseStore(): LicenseContextValue {
  const context = useContext(LicenseContext);

  if (!context) {
    throw new Error('useLicenseStore must be used within a LicenseProvider');
  }

  return context;
}

// ============================================
// USE FILTERED LICENSES HOOK
// ============================================

export function useFilteredLicenses(): License[] {
  const { licenses, filter } = useLicenseStore();

  if (filter === 'all') {
    return licenses;
  }

  return licenses.filter((license) => license.status === filter);
}

// ============================================
// USE LICENSE BY ID HOOK
// ============================================

export function useLicenseById(licenseId: string): License | null {
  const { licenses } = useLicenseStore();

  return licenses.find((license) => license.id === licenseId) || null;
}
