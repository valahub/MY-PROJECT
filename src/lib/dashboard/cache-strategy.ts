// Cache Strategy using TanStack Query
// Implements stale-while-revalidate, auto refetch 30s, background sync

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { dashboardAPI, DashboardMetrics, RevenueData, SubscriptionData, Alert } from './dashboard-api';
import { useDashboard } from './dashboard-store';

// ============================================
// CACHE CONFIGURATION
// ============================================

const CACHE_CONFIG = {
  // Metrics: stale after 30s, refetch every 30s
  metrics: {
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // 30 seconds
    refetchIntervalInBackground: true,
  },
  // Revenue: stale after 60s, refetch every 60s
  revenue: {
    staleTime: 60 * 1000, // 60 seconds
    refetchInterval: 60 * 1000, // 60 seconds
    refetchIntervalInBackground: true,
  },
  // Subscriptions: stale after 60s, refetch every 60s
  subscriptions: {
    staleTime: 60 * 1000, // 60 seconds
    refetchInterval: 60 * 1000, // 60 seconds
    refetchIntervalInBackground: true,
  },
  // Alerts: stale after 10s, refetch every 10s (high priority)
  alerts: {
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 10 * 1000, // 10 seconds
    refetchIntervalInBackground: true,
  },
};

// ============================================
// QUERY KEYS
// ============================================

export const queryKeys = {
  metrics: ['dashboard', 'metrics'] as const,
  revenue: (params?: { startDate?: string; endDate?: string }) => 
    ['dashboard', 'revenue', params] as const,
  subscriptions: (params?: { status?: string }) => 
    ['dashboard', 'subscriptions', params] as const,
  alerts: (params?: { type?: string; severity?: string }) => 
    ['dashboard', 'alerts', params] as const,
};

// ============================================
// METRICS QUERY HOOK
// ============================================

export function useDashboardMetrics(options?: Partial<UseQueryOptions<DashboardMetrics>>) {
  const { setMetrics, setMetricsLoading, setMetricsError, setUsingCachedData } = useDashboard();

  return useQuery({
    queryKey: queryKeys.metrics,
    queryFn: async () => {
      setMetricsLoading(true);
      try {
        // Try real API first
        const response = await dashboardAPI.getMetrics();
        
        if (response.success && response.data) {
          setMetrics(response.data);
          setUsingCachedData(false);
          return response.data;
        } else {
          throw new Error(response.error?.message || 'Failed to fetch metrics');
        }
      } catch (error) {
        // Fallback to mock data
        console.warn('[useDashboardMetrics] API failed, using mock data:', error);
        const mockResponse = await dashboardAPI.getMetricsMock();
        
        if (mockResponse.success && mockResponse.data) {
          setMetrics(mockResponse.data);
          setUsingCachedData(true);
          return mockResponse.data;
        } else {
          setMetricsError('Failed to load metrics');
          throw error;
        }
      } finally {
        setMetricsLoading(false);
      }
    },
    ...CACHE_CONFIG.metrics,
    ...options,
  });
}

// ============================================
// REVENUE QUERY HOOK
// ============================================

export function useRevenueData(
  params?: { startDate?: string; endDate?: string; granularity?: 'daily' | 'weekly' | 'monthly' },
  options?: Partial<UseQueryOptions<RevenueData[]>>
) {
  const { setRevenueData, setRevenueLoading, setRevenueError, setUsingCachedData } = useDashboard();

  return useQuery({
    queryKey: queryKeys.revenue(params),
    queryFn: async () => {
      setRevenueLoading(true);
      try {
        const response = await dashboardAPI.getRevenue(params);
        
        if (response.success && response.data) {
          setRevenueData(response.data);
          setUsingCachedData(false);
          return response.data;
        } else {
          throw new Error(response.error?.message || 'Failed to fetch revenue data');
        }
      } catch (error) {
        console.warn('[useRevenueData] API failed, using mock data:', error);
        const mockResponse = await dashboardAPI.getRevenueMock();
        
        if (mockResponse.success && mockResponse.data) {
          setRevenueData(mockResponse.data);
          setUsingCachedData(true);
          return mockResponse.data;
        } else {
          setRevenueError('Failed to load revenue data');
          throw error;
        }
      } finally {
        setRevenueLoading(false);
      }
    },
    ...CACHE_CONFIG.revenue,
    ...options,
  });
}

// ============================================
// SUBSCRIPTIONS QUERY HOOK
// ============================================

export function useSubscriptions(
  params?: { status?: 'active' | 'canceled' | 'past_due'; limit?: number; offset?: number },
  options?: Partial<UseQueryOptions<SubscriptionData[]>>
) {
  const { setSubscriptions, setSubscriptionsLoading, setSubscriptionsError, setUsingCachedData } = useDashboard();

  return useQuery({
    queryKey: queryKeys.subscriptions(params),
    queryFn: async () => {
      setSubscriptionsLoading(true);
      try {
        const response = await dashboardAPI.getSubscriptions(params);
        
        if (response.success && response.data) {
          setSubscriptions(response.data);
          setUsingCachedData(false);
          return response.data;
        } else {
          throw new Error(response.error?.message || 'Failed to fetch subscriptions');
        }
      } catch (error) {
        console.warn('[useSubscriptions] API failed, using mock data:', error);
        const mockResponse = await dashboardAPI.getSubscriptionsMock();
        
        if (mockResponse.success && mockResponse.data) {
          setSubscriptions(mockResponse.data);
          setUsingCachedData(true);
          return mockResponse.data;
        } else {
          setSubscriptionsError('Failed to load subscriptions');
          throw error;
        }
      } finally {
        setSubscriptionsLoading(false);
      }
    },
    ...CACHE_CONFIG.subscriptions,
    ...options,
  });
}

// ============================================
// ALERTS QUERY HOOK
// ============================================

export function useAlerts(
  params?: { type?: 'revenue' | 'churn' | 'payment' | 'system'; severity?: 'low' | 'medium' | 'high' | 'critical'; limit?: number },
  options?: Partial<UseQueryOptions<Alert[]>>
) {
  const { setAlerts, setAlertsLoading, setAlertsError, setUsingCachedData } = useDashboard();

  return useQuery({
    queryKey: queryKeys.alerts(params),
    queryFn: async () => {
      setAlertsLoading(true);
      try {
        const response = await dashboardAPI.getAlerts(params);
        
        if (response.success && response.data) {
          setAlerts(response.data);
          setUsingCachedData(false);
          return response.data;
        } else {
          throw new Error(response.error?.message || 'Failed to fetch alerts');
        }
      } catch (error) {
        console.warn('[useAlerts] API failed, using mock data:', error);
        const mockResponse = await dashboardAPI.getAlertsMock();
        
        if (mockResponse.success && mockResponse.data) {
          setAlerts(mockResponse.data);
          setUsingCachedData(true);
          return mockResponse.data;
        } else {
          setAlertsError('Failed to load alerts');
          throw error;
        }
      } finally {
        setAlertsLoading(false);
      }
    },
    ...CACHE_CONFIG.alerts,
    ...options,
  });
}

// ============================================
// INVALIDATION HOOKS
// ============================================

export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return {
    invalidateMetrics: () => queryClient.invalidateQueries({ queryKey: queryKeys.metrics }),
    invalidateRevenue: () => queryClient.invalidateQueries({ queryKey: queryKeys.revenue() }),
    invalidateSubscriptions: () => queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions() }),
    invalidateAlerts: () => queryClient.invalidateQueries({ queryKey: queryKeys.alerts() }),
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  };
}

// ============================================
// PREFETCH HOOK
// ============================================

export function usePrefetchDashboard() {
  const queryClient = useQueryClient();

  return {
    prefetchMetrics: () => 
      queryClient.prefetchQuery({
        queryKey: queryKeys.metrics,
        queryFn: async () => {
          const response = await dashboardAPI.getMetricsMock();
          return response.success ? response.data : null;
        },
      }),
    prefetchRevenue: (params?: { startDate?: string; endDate?: string }) =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.revenue(params),
        queryFn: async () => {
          const response = await dashboardAPI.getRevenueMock();
          return response.success ? response.data : null;
        },
      }),
    prefetchSubscriptions: (params?: { status?: string }) =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.subscriptions(params),
        queryFn: async () => {
          const response = await dashboardAPI.getSubscriptionsMock();
          return response.success ? response.data : null;
        },
      }),
    prefetchAlerts: (params?: { type?: string; severity?: string }) =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.alerts(params),
        queryFn: async () => {
          const response = await dashboardAPI.getAlertsMock();
          return response.success ? response.data : null;
        },
      }),
  };
}

// ============================================
// REAL-TIME INVALIDATION
// ============================================

export function useRealtimeInvalidation() {
  const queryClient = useQueryClient();
  const { invalidateMetrics, invalidateRevenue, invalidateSubscriptions, invalidateAlerts } = useInvalidateDashboard();

  // Invalidate based on real-time events
  const handleRealtimeEvent = (eventType: string) => {
    switch (eventType) {
      case 'revenue.update':
      case 'payment.success':
      case 'refund':
        invalidateMetrics();
        invalidateRevenue();
        break;
      case 'subscription.change':
        invalidateMetrics();
        invalidateSubscriptions();
        break;
      case 'churn.alert':
        invalidateMetrics();
        invalidateAlerts();
        break;
      default:
        invalidateAll();
    }
  };

  return { handleRealtimeEvent };
}
