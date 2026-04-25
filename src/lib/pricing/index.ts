// Pricing System - Central Exports
// Self-Healing Software Factory for Enterprise Billing Control

// ============================================
// CORE TYPES
// ============================================
export type {
  PricingStatus,
  BillingCycle,
  PlanVersion,
  PricingPlan,
  PlanChangeRequest,
  DependencyCheckResult,
  PricingAuditLog,
  AuditAction,
  PricingAnalytics,
  PricingSuggestion,
  SuggestionType,
  ABTest,
  ABTestVariant,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  PricingEvent,
  PricingEventType,
  PricingStatusConfig,
} from './pricing-types';

export {
  PRICING_STATUS_CONFIG,
} from './pricing-types';

// ============================================
// API CLIENT
// ============================================
export {
  pricingAPI,
  PricingAPIClient,
} from './pricing-api';

export {
  ApiResponseSchema,
  PricingPlanSchema,
  PlanChangeRequestSchema,
  DependencyCheckResultSchema,
  PricingAuditLogSchema,
  PricingAnalyticsSchema,
  PricingSuggestionSchema,
  ABTestSchema,
  ValidationResultSchema,
} from './pricing-api';

export { generateMockPlans } from './pricing-api';

// ============================================
// STATE MANAGEMENT
// ============================================
export {
  PricingProvider,
  usePricingStore,
  useFilteredPlans,
} from './pricing-store';

// ============================================
// VALIDATION
// ============================================
export {
  pricingValidationEngine,
  usePricingValidation,
} from './pricing-validation';

// ============================================
// DEPENDENCY CHECK
// ============================================
export {
  dependencyCheckEngine,
  useDependencyCheck,
} from './dependency-check';

export type {
  SubscriptionDependency,
  InvoiceDependency,
  TrialUserDependency,
} from './dependency-check';

// ============================================
// SAFE DELETE / ARCHIVE
// ============================================
export {
  safeDeleteManager,
  useSafeDelete,
} from './pricing-safe-delete';

export type { ArchiveResult } from './pricing-safe-delete';

// ============================================
// STATUS ENGINE
// ============================================
export {
  pricingStatusEngine,
  usePricingStatus,
} from './pricing-status';

export type { StatusTransition } from './pricing-status';

// ============================================
// SELF-HEAL
// ============================================
export {
  pricingSelfHealEngine,
  usePricingSelfHeal,
} from './pricing-self-heal';

export type {
  SelfHealResult,
  SelfHealAction,
} from './pricing-self-heal';

// ============================================
// EVENTS
// ============================================
export {
  pricingEventBus,
  pricingEventEmitter,
  pricingSyncIntegration,
  usePricingEvents,
  useWindowPricingEvents,
} from './pricing-events';

export type { PricingEventListener } from './pricing-events';

// ============================================
// RBAC
// ============================================
export {
  pricingRBACManager,
  usePricingRBAC,
  PricingPermissionGate,
  PricingRoleGate,
} from './pricing-rbac';

export type {
  PricingPermission,
  PricingRolePermissions,
} from './pricing-rbac';

// ============================================
// AUDIT LOG
// ============================================
export {
  pricingAuditManager,
  usePricingAudit,
  withAuditLogging,
} from './pricing-audit';

// ============================================
// CACHE
// ============================================
export {
  pricingCacheManager,
  usePricingCache,
  useLazyPricing,
} from './pricing-cache';

export type { CacheConfig, CacheEntry } from './pricing-cache';

// ============================================
// ERROR HANDLING
// ============================================
export {
  pricingErrorHandler,
  usePricingErrorHandling,
  safeCreatePlan,
  safeUpdatePlan,
  safeArchivePlan,
} from './pricing-error-handling';

export type {
  ErrorResult,
  ErrorHandlingConfig,
  OptimisticUpdate,
} from './pricing-error-handling';

// ============================================
// MODAL COMPONENTS
// ============================================
export {
  usePricingModal,
  useArchiveConfirmationModal,
} from '../../components/pricing/pricing-modals';

export type {
  PricingFormState,
  FieldValidation,
} from '../../components/pricing/pricing-modals';

// ============================================
// DYNAMIC PRICING AI
// ============================================
export {
  dynamicPricingAI,
  useDynamicPricingAI,
} from './pricing-ai';

export type {
  PricingAIAnalysis,
} from './pricing-ai';

// ============================================
// A/B TESTING
// ============================================
export {
  abTestEngine,
  useABTesting,
} from './pricing-ab-testing';

export type {
  ABTestConfig,
} from './pricing-ab-testing';

// ============================================
// INTEGRATIONS
// ============================================
export {
  pricingIntegrationManager,
  usePricingIntegrations,
  buildCheckoutUrl,
} from './pricing-integrations';

export type {
  CheckoutLinkConfig,
  CheckoutLink,
  SubscriptionPricing,
  BillingIntegration,
} from './pricing-integrations';
