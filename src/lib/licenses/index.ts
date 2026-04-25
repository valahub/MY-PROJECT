// License Management System - Central Exports
// Offline + SaaS Hybrid Core - License Data Models

// ============================================
// CORE TYPES
// ============================================

export type {
  LicenseStatus,
  License,
  DeviceInfo,
  GenerateLicenseRequest,
  ActivateLicenseRequest,
  ActivationResult,
  ValidationResult,
  LicenseAnalytics,
  LicenseSearchFilters,
  LicenseSearchResult,
  LicenseEventType,
  LicenseEvent,
  LicenseActionResult,
} from './license-types';

// ============================================
// LICENSE KEY GENERATION
// ============================================

export { licenseKeyGenerator, useLicenseKeyGenerator } from './license-generator';

// ============================================
// LICENSE ACTIVATION
// ============================================

export { licenseActivationEngine, useLicenseActivation } from './license-activation';

// ============================================
// OFFLINE VALIDATION
// ============================================

export { offlineValidationEngine, useOfflineValidation } from './license-offline';

// ============================================
// SELF-HEALING
// ============================================

export { licenseSelfHealingEngine, useLicenseSelfHealing } from './license-self-heal';

export type { SelfHealResult } from './license-self-heal';

// ============================================
// LICENSE API
// ============================================

export { licenseAPI, generateMockLicenses } from './license-api';

// ============================================
// LICENSE STORE
// ============================================

export { LicenseProvider, useLicenseStore, useFilteredLicenses, useLicenseById } from './license-store';

// ============================================
// LICENSE VALIDATION
// ============================================

export { licenseValidationEngine, useLicenseValidation } from './license-validation';

// ============================================
// LICENSE SEARCH
// ============================================

export { licenseSearchEngine, useLicenseSearch } from './license-search';

// ============================================
// LICENSE EVENTS
// ============================================

export {
  licenseEventBus,
  licenseEventEmitter,
  useLicenseEvents,
} from './license-events';

export type { LicenseEventListener } from './license-events';

// ============================================
// LICENSE SECURITY
// ============================================

export { licenseSecurityManager, useLicenseSecurity } from './license-security';

export type { SecurityResult } from './license-security';

// ============================================
// LICENSE EXPIRY CRON
// ============================================

export { licenseExpiryCronJobManager, useLicenseExpiryCronJob } from './license-expiry-cron';

export type { ExpiryCronJobResult } from './license-expiry-cron';

// ============================================
// LICENSE ANALYTICS
// ============================================

export { licenseAnalyticsEngine, useLicenseAnalytics } from './license-analytics';

// ============================================
// LICENSE ACTIONS
// ============================================

export { licenseActionsManager, useLicenseActions } from './license-actions';

// ============================================
// LICENSE UI HOOKS
// ============================================

export {
  useLicenseStatusBadge,
  useLicenseKeyMasking,
  useLicenseSelection,
  useLicenseSort,
  useLicensePagination,
  useLicenseDetails,
  useLicenseFilter,
  useLicenseExpiryWarning,
  useLicenseActivationStatus,
} from '../../components/licenses/license-hooks';
