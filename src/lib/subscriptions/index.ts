// Subscription Management System - Central Exports
// Core Revenue System - Subscription Data Models

// ============================================
// CORE TYPES
// ============================================

export type {
  SubscriptionStatus,
  BillingCycle,
  PaymentProvider,
  Subscription,
  SubscriptionTransition,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionAnalytics,
  SubscriptionSearchFilters,
  SubscriptionSearchResult,
  SubscriptionEventType,
  SubscriptionEvent,
  WebhookEvent,
} from './subscription-types';

// ============================================
// STATE MACHINE
// ============================================

export { subscriptionStateMachine, useSubscriptionStateMachine } from './subscription-state-machine';

// ============================================
// WEBHOOK SYNC
// ============================================

export { subscriptionWebhookSyncEngine, useWebhookSync } from './subscription-webhook-sync';

export type { WebhookSyncResult } from './subscription-webhook-sync';

// ============================================
// SELF-HEALING
// ============================================

export { subscriptionSelfHealingEngine, useSubscriptionSelfHealing } from './subscription-self-heal';

export type { SelfHealResult } from './subscription-self-heal';

// ============================================
// MRR CALCULATION
// ============================================

export { mrrCalculationEngine, useMRRCalculation } from './subscription-mrr';

// ============================================
// SEARCH
// ============================================

export { subscriptionSearchEngine, useSubscriptionSearch } from './subscription-search';

// ============================================
// ACTIONS
// ============================================

export { subscriptionActionsManager, useSubscriptionActions } from './subscription-actions';

export type { SubscriptionActionResult } from './subscription-actions';

// ============================================
// BILLING SCHEDULER
// ============================================

export { billingSchedulerManager, useBillingScheduler } from './subscription-billing-scheduler';

export type { BillingCronJobResult } from './subscription-billing-scheduler';

// ============================================
// DUNNING
// ============================================

export { dunningManager, useDunning } from './subscription-dunning';

export type { DunningResult, DunningConfig } from './subscription-dunning';

// ============================================
// ENTITLEMENT SYNC
// ============================================

export { entitlementSyncManager, useEntitlementSync } from './subscription-entitlement-sync';

export type { EntitlementSyncResult, Entitlement } from './subscription-entitlement-sync';

// ============================================
// AUDIT LOG
// ============================================

export { auditLogManager, useAuditLog } from './subscription-audit';

export type { AuditLogEntry } from './subscription-audit';

// ============================================
// TENANT ISOLATION
// ============================================

export { tenantIsolationManager, useTenantIsolation } from './subscription-tenant-isolation';

export type { TenantIsolationResult } from './subscription-tenant-isolation';

// ============================================
// EVENTS
// ============================================

export {
  subscriptionEventBus,
  subscriptionEventEmitter,
  useSubscriptionEvents,
} from './subscription-events';

export type { SubscriptionEventListener } from './subscription-events';

// ============================================
// ANALYTICS
// ============================================

export { subscriptionAnalyticsEngine, useSubscriptionAnalytics } from './subscription-analytics';

// ============================================
// SECURITY
// ============================================

export { subscriptionSecurityManager, useSubscriptionSecurity } from './subscription-security';

export type { SecurityResult } from './subscription-security';

// ============================================
// UI HOOKS
// ============================================

export {
  useSubscriptionStatusBadge,
  useSubscriptionSelection,
  useSubscriptionSort,
  useSubscriptionPagination,
  useSubscriptionDetails,
  useSubscriptionFilter,
  useSubscriptionBillingWarning,
  useSubscriptionActionAvailability,
} from '../../components/subscriptions/subscription-hooks';
