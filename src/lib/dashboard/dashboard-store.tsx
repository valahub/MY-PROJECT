// Dashboard Store - State Management for Merchant Dashboard
// Using React Context + TanStack Query pattern for production-grade state management
// NOTE: Using React Context instead of Zustand since Zustand is not installed

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types
export interface DashboardMetrics {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  churnRate: number;
  revenue: number;
  refunds: number;
  netRevenue: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  refunds: number;
  netRevenue: number;
}

export interface SubscriptionData {
  id: string;
  customerName: string;
  plan: string;
  status: 'active' | 'canceled' | 'past_due';
  amount: number;
  currency: string;
  startDate: string;
  nextBillingDate: string;
}

export interface Alert {
  id: string;
  type: 'revenue' | 'churn' | 'payment' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  actionRequired: boolean;
  actionUrl?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

interface DashboardState {
  // Metrics
  metrics: DashboardMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;
  metricsLastUpdated: number | null;

  // Revenue
  revenueData: RevenueData[];
  revenueLoading: boolean;
  revenueError: string | null;
  revenueLastUpdated: number | null;

  // Subscriptions
  subscriptions: SubscriptionData[];
  subscriptionsLoading: boolean;
  subscriptionsError: string | null;
  subscriptionsLastUpdated: number | null;

  // Alerts
  alerts: Alert[];
  alertsLoading: boolean;
  alertsError: string | null;
  alertsLastUpdated: number | null;

  // Charts
  chartData: ChartData | null;
  chartLoading: boolean;
  chartError: string | null;

  // Global loading/error
  isRefreshing: boolean;
  globalError: string | null;

  // Cache status
  isUsingCachedData: boolean;
  cacheWarningShown: boolean;
}

interface DashboardContextValue extends DashboardState {
  setMetrics: (metrics: DashboardMetrics) => void;
  setMetricsLoading: (loading: boolean) => void;
  setMetricsError: (error: string | null) => void;
  setRevenueData: (data: RevenueData[]) => void;
  setRevenueLoading: (loading: boolean) => void;
  setRevenueError: (error: string | null) => void;
  setSubscriptions: (subscriptions: SubscriptionData[]) => void;
  setSubscriptionsLoading: (loading: boolean) => void;
  setSubscriptionsError: (error: string | null) => void;
  setAlerts: (alerts: Alert[]) => void;
  setAlertsLoading: (loading: boolean) => void;
  setAlertsError: (error: string | null) => void;
  setChartData: (data: ChartData) => void;
  setChartLoading: (loading: boolean) => void;
  setChartError: (error: string | null) => void;
  setRefreshing: (refreshing: boolean) => void;
  setGlobalError: (error: string | null) => void;
  setUsingCachedData: (using: boolean) => void;
  setCacheWarningShown: (shown: boolean) => void;
  resetMetrics: () => void;
  resetRevenue: () => void;
  resetSubscriptions: () => void;
  resetAlerts: () => void;
  resetAll: () => void;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

// Provider component
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>({
    metrics: null,
    metricsLoading: false,
    metricsError: null,
    metricsLastUpdated: null,
    revenueData: [],
    revenueLoading: false,
    revenueError: null,
    revenueLastUpdated: null,
    subscriptions: [],
    subscriptionsLoading: false,
    subscriptionsError: null,
    subscriptionsLastUpdated: null,
    alerts: [],
    alertsLoading: false,
    alertsError: null,
    alertsLastUpdated: null,
    chartData: null,
    chartLoading: false,
    chartError: null,
    isRefreshing: false,
    globalError: null,
    isUsingCachedData: false,
    cacheWarningShown: false,
  });

  // Actions
  const setMetrics = useCallback((metrics: DashboardMetrics) => {
    setState((prev) => ({ ...prev, metrics, metricsLastUpdated: Date.now(), metricsError: null }));
  }, []);

  const setMetricsLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, metricsLoading: loading }));
  }, []);

  const setMetricsError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, metricsError: error, metricsLoading: false }));
  }, []);

  const setRevenueData = useCallback((data: RevenueData[]) => {
    setState((prev) => ({ ...prev, revenueData: data, revenueLastUpdated: Date.now(), revenueError: null }));
  }, []);

  const setRevenueLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, revenueLoading: loading }));
  }, []);

  const setRevenueError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, revenueError: error, revenueLoading: false }));
  }, []);

  const setSubscriptions = useCallback((subscriptions: SubscriptionData[]) => {
    setState((prev) => ({ ...prev, subscriptions, subscriptionsLastUpdated: Date.now(), subscriptionsError: null }));
  }, []);

  const setSubscriptionsLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, subscriptionsLoading: loading }));
  }, []);

  const setSubscriptionsError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, subscriptionsError: error, subscriptionsLoading: false }));
  }, []);

  const setAlerts = useCallback((alerts: Alert[]) => {
    setState((prev) => ({ ...prev, alerts, alertsLastUpdated: Date.now(), alertsError: null }));
  }, []);

  const setAlertsLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, alertsLoading: loading }));
  }, []);

  const setAlertsError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, alertsError: error, alertsLoading: false }));
  }, []);

  const setChartData = useCallback((data: ChartData) => {
    setState((prev) => ({ ...prev, chartData: data, chartError: null }));
  }, []);

  const setChartLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, chartLoading: loading }));
  }, []);

  const setChartError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, chartError: error, chartLoading: false }));
  }, []);

  const setRefreshing = useCallback((refreshing: boolean) => {
    setState((prev) => ({ ...prev, isRefreshing: refreshing }));
  }, []);

  const setGlobalError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, globalError: error }));
  }, []);

  const setUsingCachedData = useCallback((using: boolean) => {
    setState((prev) => ({ ...prev, isUsingCachedData: using }));
  }, []);

  const setCacheWarningShown = useCallback((shown: boolean) => {
    setState((prev) => ({ ...prev, cacheWarningShown: shown }));
  }, []);

  const resetMetrics = useCallback(() => {
    setState((prev) => ({ ...prev, metrics: null, metricsError: null, metricsLastUpdated: null }));
  }, []);

  const resetRevenue = useCallback(() => {
    setState((prev) => ({ ...prev, revenueData: [], revenueError: null, revenueLastUpdated: null }));
  }, []);

  const resetSubscriptions = useCallback(() => {
    setState((prev) => ({ ...prev, subscriptions: [], subscriptionsError: null, subscriptionsLastUpdated: null }));
  }, []);

  const resetAlerts = useCallback(() => {
    setState((prev) => ({ ...prev, alerts: [], alertsError: null, alertsLastUpdated: null }));
  }, []);

  const resetAll = useCallback(() => {
    setState({
      metrics: null,
      metricsLoading: false,
      metricsError: null,
      metricsLastUpdated: null,
      revenueData: [],
      revenueLoading: false,
      revenueError: null,
      revenueLastUpdated: null,
      subscriptions: [],
      subscriptionsLoading: false,
      subscriptionsError: null,
      subscriptionsLastUpdated: null,
      alerts: [],
      alertsLoading: false,
      alertsError: null,
      alertsLastUpdated: null,
      chartData: null,
      chartLoading: false,
      chartError: null,
      isRefreshing: false,
      globalError: null,
      isUsingCachedData: false,
      cacheWarningShown: false,
    });
  }, []);

  const value: DashboardContextValue = {
    ...state,
    setMetrics,
    setMetricsLoading,
    setMetricsError,
    setRevenueData,
    setRevenueLoading,
    setRevenueError,
    setSubscriptions,
    setSubscriptionsLoading,
    setSubscriptionsError,
    setAlerts,
    setAlertsLoading,
    setAlertsError,
    setChartData,
    setChartLoading,
    setChartError,
    setRefreshing,
    setGlobalError,
    setUsingCachedData,
    setCacheWarningShown,
    resetMetrics,
    resetRevenue,
    resetSubscriptions,
    resetAlerts,
    resetAll,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

// Hook to use the dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

// Selectors for optimized re-renders (can be used with useMemo in components)
export const selectMetrics = (state: DashboardState) => state.metrics;
export const selectMetricsLoading = (state: DashboardState) => state.metricsLoading;
export const selectRevenueData = (state: DashboardState) => state.revenueData;
export const selectSubscriptions = (state: DashboardState) => state.subscriptions;
export const selectAlerts = (state: DashboardState) => state.alerts;
export const selectIsRefreshing = (state: DashboardState) => state.isRefreshing;
export const selectGlobalError = (state: DashboardState) => state.globalError;
export const selectIsUsingCachedData = (state: DashboardState) => state.isUsingCachedData;
