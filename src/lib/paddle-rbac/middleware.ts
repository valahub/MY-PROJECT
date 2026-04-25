// Paddle RBAC Middleware
// Permission middleware for route protection and plan gate enforcement

import { paddleRBACManager } from './manager';
import type { Module, PermissionAction } from './types';

// ============================================
// PERMISSION CHECK RESULT
// ============================================

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  blockedByPlan?: boolean;
}

// ============================================
// PERMISSION MIDDLEWARE
// ============================================

export class PermissionMiddleware {
  /**
   * Check if user has specific permission
   */
  checkPermission(
    userId: string,
    permissionKey: string,
    action: PermissionAction = 'read'
  ): PermissionCheckResult {
    const hasPermission = paddleRBACManager.hasPermission(userId, permissionKey, action);

    if (!hasPermission) {
      return {
        allowed: false,
        reason: `Permission denied: ${permissionKey}.${action}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user has module access
   */
  checkModuleAccess(
    userId: string,
    module: Module,
    action: PermissionAction = 'read'
  ): PermissionCheckResult {
    const hasAccess = paddleRBACManager.hasModuleAccess(userId, module, action);

    if (!hasAccess) {
      return {
        allowed: false,
        reason: `Module access denied: ${module}.${action}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can perform action on resource
   */
  checkResourceAccess(
    userId: string,
    resource: string,
    action: PermissionAction = 'read'
  ): PermissionCheckResult {
    // Map resources to modules
    const resourceModuleMap: Record<string, Module> = {
      product: 'marketplace',
      subscription: 'paddle',
      license: 'paddle',
      invoice: 'paddle',
      domain: 'server',
      hosting: 'server',
      project: 'developer',
      task: 'developer',
      partner: 'partner',
      commission: 'partner',
      payout: 'partner',
      ticket: 'support',
      campaign: 'influencer',
      'ai-project': 'ai_builder',
    };

    const module = resourceModuleMap[resource];
    if (!module) {
      return {
        allowed: false,
        reason: `Unknown resource: ${resource}`,
      };
    }

    return this.checkModuleAccess(userId, module, action);
  }

  /**
   * Require permission - throws error if not allowed
   */
  requirePermission(
    userId: string,
    permissionKey: string,
    action: PermissionAction = 'read'
  ): void {
    const result = this.checkPermission(userId, permissionKey, action);
    if (!result.allowed) {
      throw new PermissionError(result.reason || 'Permission denied');
    }
  }

  /**
   * Require module access - throws error if not allowed
   */
  requireModuleAccess(
    userId: string,
    module: Module,
    action: PermissionAction = 'read'
  ): void {
    const result = this.checkModuleAccess(userId, module, action);
    if (!result.allowed) {
      throw new PermissionError(result.reason || 'Module access denied');
    }
  }

  /**
   * Require resource access - throws error if not allowed
   */
  requireResourceAccess(
    userId: string,
    resource: string,
    action: PermissionAction = 'read'
  ): void {
    const result = this.checkResourceAccess(userId, resource, action);
    if (!result.allowed) {
      throw new PermissionError(result.reason || 'Resource access denied');
    }
  }
}

// ============================================
// PLAN GATE MIDDLEWARE
// ============================================

export class PlanGateMiddleware {
  /**
   * Check if action is allowed based on plan status
   */
  checkPlanGate(
    userId: string,
    permissionKey: string
  ): PermissionCheckResult {
    const user = paddleRBACManager['users'].get(userId);
    if (!user) {
      return {
        allowed: false,
        reason: 'User not found',
      };
    }

    // If plan is active, allow
    if (user.planActive) {
      return { allowed: true };
    }

    // Check if permission is blocked when plan is inactive
    const blockedPermissions = [
      'marketplace.product.publish',
      'paddle.payment.process',
      'paddle.payout.manage',
      'paddle.refund.process',
    ];

    if (blockedPermissions.includes(permissionKey)) {
      return {
        allowed: false,
        reason: 'Action requires active plan',
        blockedByPlan: true,
      };
    }

    return { allowed: true };
  }

  /**
   * Require active plan for action
   */
  requireActivePlan(userId: string, permissionKey: string): void {
    const result = this.checkPlanGate(userId, permissionKey);
    if (!result.allowed) {
      throw new PlanGateError(result.reason || 'Plan gate denied');
    }
  }

  /**
   * Check if user can perform billing operations
   */
  canPerformBilling(userId: string): PermissionCheckResult {
    return this.checkPlanGate(userId, 'paddle.payment.process');
  }

  /**
   * Check if user can publish products
   */
  canPublishProducts(userId: string): PermissionCheckResult {
    return this.checkPlanGate(userId, 'marketplace.product.publish');
  }

  /**
   * Check if user can process payouts
   */
  canProcessPayouts(userId: string): PermissionCheckResult {
    return this.checkPlanGate(userId, 'paddle.payout.manage');
  }
}

// ============================================
// ROUTE GUARD MIDDLEWARE
// ============================================

export interface RouteGuardConfig {
  permissionKey?: string;
  module?: Module;
  resource?: string;
  action?: PermissionAction;
  requireActivePlan?: boolean;
}

export class RouteGuardMiddleware {
  private permissionMiddleware: PermissionMiddleware;
  private planGateMiddleware: PlanGateMiddleware;

  constructor() {
    this.permissionMiddleware = new PermissionMiddleware();
    this.planGateMiddleware = new PlanGateMiddleware();
  }

  /**
   * Check if user can access route
   */
  canAccessRoute(userId: string, config: RouteGuardConfig): PermissionCheckResult {
    // Check permission/module access
    if (config.permissionKey) {
      const permResult = this.permissionMiddleware.checkPermission(
        userId,
        config.permissionKey,
        config.action
      );
      if (!permResult.allowed) {
        return permResult;
      }
    }

    if (config.module) {
      const moduleResult = this.permissionMiddleware.checkModuleAccess(
        userId,
        config.module,
        config.action
      );
      if (!moduleResult.allowed) {
        return moduleResult;
      }
    }

    if (config.resource) {
      const resourceResult = this.permissionMiddleware.checkResourceAccess(
        userId,
        config.resource,
        config.action
      );
      if (!resourceResult.allowed) {
        return resourceResult;
      }
    }

    // Check plan gate if required
    if (config.requireActivePlan && config.permissionKey) {
      const planResult = this.planGateMiddleware.checkPlanGate(userId, config.permissionKey);
      if (!planResult.allowed) {
        return planResult;
      }
    }

    return { allowed: true };
  }

  /**
   * Require route access - throws error if not allowed
   */
  requireRouteAccess(userId: string, config: RouteGuardConfig): void {
    const result = this.canAccessRoute(userId, config);
    if (!result.allowed) {
      throw new RouteGuardError(result.reason || 'Route access denied');
    }
  }

  /**
   * Create a route guard function for React Router
   */
  createRouteGuard(config: RouteGuardConfig) {
    return (userId: string): boolean => {
      const result = this.canAccessRoute(userId, config);
      return result.allowed;
    };
  }
}

// ============================================
// CUSTOM ERRORS
// ============================================

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class PlanGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanGateError';
  }
}

export class RouteGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RouteGuardError';
  }
}

// ============================================
// EXPORT SINGLETONS
// ============================================

export const permissionMiddleware = new PermissionMiddleware();
export const planGateMiddleware = new PlanGateMiddleware();
export const routeGuardMiddleware = new RouteGuardMiddleware();
