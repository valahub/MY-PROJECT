// Merchant Pricing System - Central Exports
// MERCHANT DASHBOARD CONTEXT - Merchant-Scoped Pricing Control
// STRICT: merchant_id is MANDATORY for all operations

// ============================================
// CORE TYPES
// ============================================

export type {
  MerchantRole,
  MerchantCurrency,
  PricingInterval,
  PricingStatus,
  MerchantPricingPlan,
  CreateMerchantPricingRequest,
  UpdateMerchantPricingRequest,
  ArchiveMerchantPricingRequest,
  MerchantPricingAnalytics,
  MerchantBillingConfig,
  MerchantPricingEventType,
  MerchantPricingEvent,
  MerchantPricingSearchFilters,
  MerchantPricingSearchResult,
  MerchantPricingPermissionCheck,
  MerchantConfigValidationResult,
} from './merchant-pricing-types';

// ============================================
// CONTEXT LOCK
// ============================================

export { merchantPricingContextLock, useMerchantPricingContextLock } from './merchant-pricing-context-lock';

export type { ContextLockResult } from './merchant-pricing-context-lock';

// ============================================
// DASHBOARD SYNC
// ============================================

export { merchantPricingDashboardSync, useMerchantPricingDashboardSync } from './merchant-pricing-dashboard-sync';

export type { DashboardSyncResult } from './merchant-pricing-dashboard-sync';

// ============================================
// ANALYTICS
// ============================================

export { merchantPricingAnalyticsEngine, useMerchantPricingAnalytics } from './merchant-pricing-analytics';

// ============================================
// ROLE CONTROL
// ============================================

export { merchantPricingRoleControl, useMerchantPricingRoleControl } from './merchant-pricing-role-control';

export type { RolePermissions } from './merchant-pricing-role-control';

// ============================================
// BILLING LINK
// ============================================

export { merchantPricingBillingLink, useMerchantPricingBillingLink } from './merchant-pricing-billing-link';

export type { BillingSyncResult } from './merchant-pricing-billing-link';

// ============================================
// CURRENCY
// ============================================

export {
  merchantPricingCurrencyEngine,
  useMerchantPricingCurrency,
  CURRENCY_SYMBOLS,
  CURRENCY_NAMES,
  EXCHANGE_RATES,
  CURRENCY_LOCALES,
} from './merchant-pricing-currency';

export type { FormattedAmount } from './merchant-pricing-currency';

// ============================================
// EVENTS
// ============================================

export {
  merchantPricingEventBus,
  merchantPricingEventEmitter,
  useMerchantPricingEvents,
} from './merchant-pricing-events';

export type { MerchantPricingEventListener } from './merchant-pricing-events';

// ============================================
// SELF-HEAL
// ============================================

export { merchantPricingSelfHealingEngine, useMerchantPricingSelfHealing } from './merchant-pricing-self-heal';

export type { SelfHealResult } from './merchant-pricing-self-heal';

// ============================================
// SECURITY
// ============================================

export { merchantPricingSecurityManager, useMerchantPricingSecurity } from './merchant-pricing-security';

export type { JWTPayload, SecurityResult } from './merchant-pricing-security';

// ============================================
// UI HOOKS
// ============================================

export {
  useMerchantPricingStatusBadge,
  useMerchantPricingSelection,
  useMerchantPricingSort,
  useMerchantPricingFilter,
  useMerchantPricingActionAvailability,
  useMerchantPricingCreateForm,
  useMerchantCopyToClipboard,
  useMerchantPricingAnalytics as useMerchantPricingAnalyticsUI,
} from '../../components/merchant-pricing/merchant-pricing-hooks';
