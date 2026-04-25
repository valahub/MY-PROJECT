// React Router Configuration for Merchant Dashboard
// Routes: /merchant/dashboard, /merchant/revenue, /merchant/customers
// With prefetch support for optimal performance

import { lazy, Suspense } from 'react';

// ============================================
// LAZY LOADED COMPONENTS
// ============================================

const DashboardPage = lazy(() => import('@/pages/merchant/DashboardPage'));
const RevenuePage = lazy(() => import('@/pages/merchant/RevenuePage'));
const CustomersPage = lazy(() => import('@/pages/merchant/CustomersPage'));
const SettingsPage = lazy(() => import('@/pages/merchant/SettingsPage'));

// ============================================
// ROUTE CONFIGURATION
// ============================================

export interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType>;
  title: string;
  prefetch?: boolean;
  protected?: boolean;
  requiredPermissions?: string[];
}

export const MERCHANT_ROUTES: RouteConfig[] = [
  {
    path: '/merchant/dashboard',
    component: DashboardPage,
    title: 'Dashboard',
    prefetch: true,
    protected: true,
    requiredPermissions: ['canViewDashboard'],
  },
  {
    path: '/merchant/revenue',
    component: RevenuePage,
    title: 'Revenue',
    prefetch: true,
    protected: true,
    requiredPermissions: ['canViewRevenue'],
  },
  {
    path: '/merchant/customers',
    component: CustomersPage,
    title: 'Customers',
    prefetch: true,
    protected: true,
    requiredPermissions: ['canViewCustomers'],
  },
  {
    path: '/merchant/settings',
    component: SettingsPage,
    title: 'Settings',
    prefetch: false,
    protected: true,
    requiredPermissions: ['canViewSettings'],
  },
];

// ============================================
// LOADING FALLBACK
// ============================================

export function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// ============================================
// WRAPPER FOR LAZY LOADED ROUTES
// ============================================

export function LazyRouteWrapper({ component: Component }: { component: React.LazyExoticComponent<React.ComponentType> }) {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Component />
    </Suspense>
  );
}

// ============================================
// ROUTE PREFETCHING
// ============================================

export class RoutePrefetcher {
  private prefetchedRoutes: Set<string> = new Set();
  private prefetchQueue: Set<string> = new Set();

  // Prefetch a route component
  async prefetchRoute(path: string): Promise<void> {
    if (this.prefetchedRoutes.has(path) || this.prefetchQueue.has(path)) {
      return;
    }

    this.prefetchQueue.add(path);

    const route = MERCHANT_ROUTES.find((r) => r.path === path);
    if (!route) {
      this.prefetchQueue.delete(path);
      return;
    }

    try {
      // Trigger lazy import
      await route.component.preload();
      this.prefetchedRoutes.add(path);
      console.log(`[RoutePrefetcher] Prefetched: ${path}`);
    } catch (error) {
      console.error(`[RoutePrefetcher] Failed to prefetch ${path}:`, error);
    } finally {
      this.prefetchQueue.delete(path);
    }
  }

  // Prefetch multiple routes
  async prefetchRoutes(paths: string[]): Promise<void> {
    await Promise.all(paths.map((path) => this.prefetchRoute(path)));
  }

  // Prefetch all routes marked for prefetch
  async prefetchAll(): Promise<void> {
    const pathsToPrefetch = MERCHANT_ROUTES
      .filter((route) => route.prefetch)
      .map((route) => route.path);
    await this.prefetchRoutes(pathsToPrefetch);
  }

  // Check if route is prefetched
  isPrefetched(path: string): boolean {
    return this.prefetchedRoutes.has(path);
  }

  // Clear prefetched routes
  clear(): void {
    this.prefetchedRoutes.clear();
    this.prefetchQueue.clear();
  }

  // Get prefetched routes
  getPrefetchedRoutes(): string[] {
    return Array.from(this.prefetchedRoutes);
  }
}

// Export singleton instance
export const routePrefetcher = new RoutePrefetcher();

// ============================================
// REACT HOOK FOR ROUTE PREFETCHING
// ============================================

import { useEffect, useCallback } from 'react';

export function useRoutePrefetch() {
  // Prefetch a specific route
  const prefetchRoute = useCallback((path: string) => {
    routePrefetcher.prefetchRoute(path);
  }, []);

  // Prefetch multiple routes
  const prefetchRoutes = useCallback((paths: string[]) => {
    routePrefetcher.prefetchRoutes(paths);
  }, []);

  // Prefetch all routes
  const prefetchAll = useCallback(() => {
    routePrefetcher.prefetchAll();
  }, []);

  // Check if route is prefetched
  const isPrefetched = useCallback((path: string) => {
    return routePrefetcher.isPrefetched(path);
  }, []);

  // Get all prefetched routes
  const getPrefetchedRoutes = useCallback(() => {
    return routePrefetcher.getPrefetchedRoutes();
  }, []);

  return {
    prefetchRoute,
    prefetchRoutes,
    prefetchAll,
    isPrefetched,
    getPrefetchedRoutes,
  };
}

// ============================================
// ROUTE GUARD HOOK
// ============================================

import { useLocation, useNavigate } from 'react-router-dom';

export function useRouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();

  const checkAccess = useCallback((path: string): boolean => {
    const route = MERCHANT_ROUTES.find((r) => r.path === path);
    if (!route) return true; // Allow unknown routes

    if (route.protected) {
      // Check if user is authenticated
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/login', { state: { from: path } });
        return false;
      }

      // Check permissions if required
      if (route.requiredPermissions && route.requiredPermissions.length > 0) {
        // This would integrate with the RBAC system
        // For now, just check if token exists
        return true;
      }
    }

    return true;
  }, [navigate]);

  // Auto-check current route on mount
  useEffect(() => {
    checkAccess(location.pathname);
  }, [location.pathname, checkAccess]);

  return {
    checkAccess,
    canAccess: checkAccess(location.pathname),
  };
}

// ============================================
// BREADCRUMB GENERATION
// ============================================

export interface BreadcrumbItem {
  label: string;
  path: string;
}

export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
  ];

  const pathSegments = pathname.split('/').filter(Boolean);

  let currentPath = '';
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    
    const route = MERCHANT_ROUTES.find((r) => r.path === currentPath);
    if (route) {
      breadcrumbs.push({
        label: route.title,
        path: currentPath,
      });
    }
  }

  return breadcrumbs;
}

// ============================================
// ROUTE TRANSITION HOOK
// ============================================

export function useRouteTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
  }, []);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return {
    isTransitioning,
    startTransition,
    endTransition,
  };
}

// ============================================
// NAVIGATION HISTORY
// ============================================

class NavigationHistory {
  private history: string[] = [];
  private maxHistory: number = 50;

  add(path: string): void {
    this.history.push(path);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  get(): string[] {
    return [...this.history];
  }

  back(): string | null {
    if (this.history.length < 2) return null;
    this.history.pop();
    return this.history[this.history.length - 1];
  }

  clear(): void {
    this.history = [];
  }
}

export const navigationHistory = new NavigationHistory();

// ============================================
// ROUTE CHANGE TRACKING
// ============================================

import { useState } from 'react';

export function useRouteChangeTracking() {
  const [previousRoute, setPreviousRoute] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string>(window.location.pathname);

  const trackRouteChange = useCallback((newRoute: string) => {
    setPreviousRoute(currentRoute);
    setCurrentRoute(newRoute);
    navigationHistory.add(newRoute);
  }, [currentRoute]);

  return {
    previousRoute,
    currentRoute,
    trackRouteChange,
  };
}

// ============================================
// ROUTE METADATA
// ============================================

export function getRouteMetadata(path: string) {
  const route = MERCHANT_ROUTES.find((r) => r.path === path);
  if (!route) return null;

  return {
    title: route.title,
    protected: route.protected,
    requiredPermissions: route.requiredPermissions,
  };
}

// ============================================
// INITIALIZATION
// ============================================

// Prefetch important routes on app load
if (typeof window !== 'undefined') {
  // Delay prefetching to not block initial render
  setTimeout(() => {
    routePrefetcher.prefetchAll();
  }, 1000);
}
