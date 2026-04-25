// Paddle RBAC - Central Role & Permission System
// Single Source of Truth for all modules

// Types
export * from './types';

// Schema
export * from './schema';

// Manager (Central Control)
export { paddleRBACManager, PaddleRBACManager } from './manager';

// API Service
export { paddleRBACApiService, PaddleRBACApiService } from './api-service';

// Middleware
export {
  permissionMiddleware,
  planGateMiddleware,
  routeGuardMiddleware,
  PermissionMiddleware,
  PlanGateMiddleware,
  RouteGuardMiddleware,
  PermissionError,
  PlanGateError,
  RouteGuardError,
} from './middleware';

// Cache
export { rbacCache, RBACCache } from './cache';

// Rate Limiter
export {
  RateLimiter,
  sensitiveApiLimiter,
  standardApiLimiter,
  bulkApiLimiter,
} from './rate-limiter';

// Security
export { TokenValidator, SecurityUtils } from './security';
