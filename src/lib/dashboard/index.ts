// Dashboard System - Main Export File
// Production-grade Merchant Dashboard with real-time updates, self-healing, and security

// ============================================
// STATE MANAGEMENT
// ============================================
export { DashboardProvider, useDashboard } from './dashboard-store';
export type {
  DashboardMetrics,
  RevenueData,
  SubscriptionData,
  Alert,
  ChartData,
} from './dashboard-store';

// ============================================
// API LAYER
// ============================================
export { dashboardAPI } from './dashboard-api';
export type {
  ApiResponse,
  DashboardMetricsResponse,
  RevenueDataResponse,
  SubscriptionDataResponse,
  AlertsResponse,
} from './dashboard-api';

// ============================================
// REAL-TIME ENGINE
// ============================================
export { dashboardRealtime } from './realtime-engine';
export type {
  RevenueUpdateEvent,
  SubscriptionChangeEvent,
  ChurnAlertEvent,
  PaymentSuccessEvent,
  RefundEvent,
  DashboardRealtimeEvent,
} from './realtime-engine';

// ============================================
// CACHE STRATEGY
// ============================================
export {
  useDashboardMetrics,
  useRevenueData,
  useSubscriptions,
  useAlerts,
  useInvalidateDashboard,
  usePrefetchDashboard,
  useRealtimeInvalidation,
  queryKeys,
} from './cache-strategy';

// ============================================
// EVENT-DRIVEN SYSTEM
// ============================================
export { dashboardEventSystem, dashboardEventBus, useDashboardEventSystem, useDashboardCustomEvents } from './event-driven-system';

// ============================================
// SECURITY LAYER
// ============================================
export { securityManager, secureFetch } from './security-layer';
export type { JWTPayload } from './security-layer';
export { useSecurity } from './security-layer';

// ============================================
// ROLE-BASED ACCESS CONTROL
// ============================================
export { rbacManager, useRBAC, PermissionGate, RoleGate, useRouteGuard as useRBACRouteGuard } from './rbac';
export type { UserRole, RolePermissions, EndpointPermission } from './rbac';

// ============================================
// SELF-HEALING
// ============================================
export { selfHealingManager, fetchWithSelfHealing, useSelfHealing } from './self-healing';
export type { SelfHealingConfig, AnomalyReport } from './self-healing';

// ============================================
// LOGGING SYSTEM
// ============================================
export { logger, performanceMonitor, setupAPILogging, setupErrorTracking } from './logging-system';
export { useLogger, usePerformanceMonitor } from './logging-system';
export type { LogLevel, LogType, LogEntry } from './logging-system';

// ============================================
// ROUTING
// ============================================
export { routePrefetcher, navigationHistory, useRoutePrefetch, useRouteGuard, useRouteChangeTracking, useRouteTransition, generateBreadcrumbs, getRouteMetadata, LazyRouteWrapper, RouteLoadingFallback } from './routing';
export type { RouteConfig, BreadcrumbItem } from './routing';
export { MERCHANT_ROUTES } from './routing';
