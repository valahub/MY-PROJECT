// Checkout Link Management System - Central Exports
// Revenue Link System - Checkout Link Data Models

// ============================================
// CORE TYPES
// ============================================

export type {
  CheckoutLinkStatus,
  CheckoutLink,
  CreateCheckoutLinkRequest,
  UpdateCheckoutLinkRequest,
  CheckoutLinkAnalytics,
  CheckoutLinkSearchFilters,
  CheckoutLinkSearchResult,
  CheckoutLinkEventType,
  CheckoutLinkEvent,
  BulkOperationType,
  BulkOperationResult,
} from './checkout-link-types';

// ============================================
// LINK GENERATOR
// ============================================

export { checkoutLinkGenerator, useCheckoutLinkGenerator } from './checkout-link-generator';

export type { LinkGenerationResult } from './checkout-link-generator';

// ============================================
// STATUS ENGINE
// ============================================

export { checkoutLinkStatusEngine, useCheckoutLinkStatus } from './checkout-link-status';

export type { StatusTransition } from './checkout-link-status';

// ============================================
// SELF-HEALING
// ============================================

export { checkoutLinkSelfHealingEngine, useCheckoutLinkSelfHealing } from './checkout-link-self-heal';

export type { SelfHealResult } from './checkout-link-self-heal';

// ============================================
// CONVERSION TRACKING
// ============================================

export { conversionTrackingEngine, useConversionTracking } from './checkout-link-conversion-tracking';

export type { ConversionEvent } from './checkout-link-conversion-tracking';

// ============================================
// SEARCH
// ============================================

export { checkoutLinkSearchEngine, useCheckoutLinkSearch } from './checkout-link-search';

// ============================================
// TENANT ISOLATION
// ============================================

export { checkoutLinkTenantIsolationManager, useCheckoutLinkTenantIsolation } from './checkout-link-tenant-isolation';

export type { TenantIsolationResult } from './checkout-link-tenant-isolation';

// ============================================
// RATE LIMIT
// ============================================

export { rateLimitManager, useRateLimit } from './checkout-link-rate-limit';

export type { RateLimitResult } from './checkout-link-rate-limit';

// ============================================
// PAYMENT INTEGRATION
// ============================================

export { paymentIntegrationEngine, usePaymentIntegration } from './checkout-link-payment';

export type { PaymentProvider, PaymentSession, PaymentResult } from './checkout-link-payment';

// ============================================
// WEBHOOK HANDLER
// ============================================

export { checkoutLinkWebhookHandler, useCheckoutLinkWebhookHandler } from './checkout-link-webhook-handler';

export type { WebhookHandlerResult } from './checkout-link-webhook-handler';

// ============================================
// EXPIRY ENGINE
// ============================================

export { checkoutLinkExpiryEngine, useCheckoutLinkExpiry } from './checkout-link-expiry-engine';

export type { ExpiryEngineResult } from './checkout-link-expiry-engine';

// ============================================
// EVENTS
// ============================================

export {
  checkoutLinkEventBus,
  checkoutLinkEventEmitter,
  useCheckoutLinkEvents,
} from './checkout-link-events';

export type { CheckoutLinkEventListener } from './checkout-link-events';

// ============================================
// BULK OPERATIONS
// ============================================

export { checkoutLinkBulkOperationsEngine, useCheckoutLinkBulkOperations } from './checkout-link-bulk-operations';

// ============================================
// SECURITY
// ============================================

export { checkoutLinkSecurityManager, useCheckoutLinkSecurity } from './checkout-link-security';

export type { SecurityResult } from './checkout-link-security';

// ============================================
// UI HOOKS
// ============================================

export {
  useCheckoutLinkStatusBadge,
  useCheckoutLinkSelection,
  useCheckoutLinkSort,
  useCheckoutLinkDetails,
  useCheckoutLinkFilter,
  useCheckoutLinkActionAvailability,
  useCopyToClipboard,
} from '../../components/checkout-links/checkout-link-hooks';
