// Event-Driven System for Dashboard Auto-Updates
// Triggers dashboard updates on payment success, refund, subscription cancel
// Auto-updates metrics, charts, and alerts in real-time

import { dashboardRealtime, DashboardRealtimeEvent } from './realtime-engine';
import { useDashboard } from './dashboard-store';
import { useInvalidateDashboard } from './cache-strategy';

// ============================================
// EVENT HANDLERS
// ============================================

export class DashboardEventSystem {
  private unsubscribeFunctions: Array<() => void> = [];

  // ============================================
  // START EVENT LISTENING
  // ============================================

  start(): void {
    console.log('[DashboardEventSystem] Starting event listeners...');

    // Listen to revenue updates
    this.unsubscribeFunctions.push(
      dashboardRealtime.onRevenueUpdate(this.handleRevenueUpdate.bind(this))
    );

    // Listen to subscription changes
    this.unsubscribeFunctions.push(
      dashboardRealtime.onSubscriptionChange(this.handleSubscriptionChange.bind(this))
    );

    // Listen to churn alerts
    this.unsubscribeFunctions.push(
      dashboardRealtime.onChurnAlert(this.handleChurnAlert.bind(this))
    );

    // Listen to payment success
    this.unsubscribeFunctions.push(
      dashboardRealtime.onPaymentSuccess(this.handlePaymentSuccess.bind(this))
    );

    // Listen to refunds
    this.unsubscribeFunctions.push(
      dashboardRealtime.onRefund(this.handleRefund.bind(this))
    );

    console.log('[DashboardEventSystem] Event listeners started');
  }

  // ============================================
  // STOP EVENT LISTENING
  // ============================================

  stop(): void {
    console.log('[DashboardEventSystem] Stopping event listeners...');
    this.unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeFunctions = [];
    console.log('[DashboardEventSystem] Event listeners stopped');
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  private handleRevenueUpdate(event: DashboardRealtimeEvent): void {
    if (event.type !== 'revenue.update') return;

    console.log('[DashboardEventSystem] Revenue update:', event.payload);

    // Trigger cache invalidation for metrics and revenue
    this.invalidateMetricsAndRevenue();

    // Update local state if needed
    this.updateRevenueInState(event.payload);
  }

  private handleSubscriptionChange(event: DashboardRealtimeEvent): void {
    if (event.type !== 'subscription.change') return;

    console.log('[DashboardEventSystem] Subscription change:', event.payload);

    // Trigger cache invalidation for metrics and subscriptions
    this.invalidateMetricsAndSubscriptions();

    // Update local state if needed
    this.updateSubscriptionInState(event.payload);

    // If subscription was canceled, trigger churn alert
    if (event.payload.changeType === 'canceled') {
      this.triggerChurnAlert(event.payload);
    }
  }

  private handleChurnAlert(event: DashboardRealtimeEvent): void {
    if (event.type !== 'churn.alert') return;

    console.log('[DashboardEventSystem] Churn alert:', event.payload);

    // Trigger cache invalidation for metrics and alerts
    this.invalidateMetricsAndAlerts();

    // Add to alerts in state
    this.addAlertToState({
      id: `churn_${event.payload.customerId}_${Date.now()}`,
      type: 'churn',
      severity: event.payload.riskLevel,
      title: `Churn Risk: ${event.payload.customerName}`,
      message: event.payload.reason,
      timestamp: event.payload.timestamp,
      actionRequired: event.payload.riskLevel === 'high' || event.payload.riskLevel === 'critical',
      actionUrl: `/merchant/customers/${event.payload.customerId}`,
    });
  }

  private handlePaymentSuccess(event: DashboardRealtimeEvent): void {
    if (event.type !== 'payment.success') return;

    console.log('[DashboardEventSystem] Payment success:', event.payload);

    // Trigger cache invalidation for metrics and revenue
    this.invalidateMetricsAndRevenue();

    // Update local state
    this.updateRevenueInState({
      amount: event.payload.amount,
      currency: event.payload.currency,
      timestamp: event.payload.timestamp,
      source: 'payment',
      customerId: event.payload.customerId,
    });

    // Add success alert
    this.addAlertToState({
      id: `payment_${event.payload.paymentId}`,
      type: 'payment',
      severity: 'low',
      title: 'Payment Received',
      message: `$${event.payload.amount} ${event.payload.currency} from ${event.payload.customerId}`,
      timestamp: event.payload.timestamp,
      actionRequired: false,
    });
  }

  private handleRefund(event: DashboardRealtimeEvent): void {
    if (event.type !== 'refund') return;

    console.log('[DashboardEventSystem] Refund processed:', event.payload);

    // Trigger cache invalidation for metrics and revenue
    this.invalidateMetricsAndRevenue();

    // Update local state (negative revenue impact)
    this.updateRevenueInState({
      amount: -event.payload.amount,
      currency: event.payload.currency,
      timestamp: event.payload.timestamp,
      source: 'refund',
      customerId: event.payload.customerId,
    });

    // Add refund alert
    this.addAlertToState({
      id: `refund_${event.payload.refundId}`,
      type: 'payment',
      severity: 'medium',
      title: 'Refund Processed',
      message: `$${event.payload.amount} ${event.payload.currency} refunded - ${event.payload.reason}`,
      timestamp: event.payload.timestamp,
      actionRequired: false,
    });
  }

  // ============================================
  // CACHE INVALIDATION HELPERS
  // ============================================

  private invalidateMetricsAndRevenue(): void {
    // This would use the useInvalidateDashboard hook in a React component
    // For now, we'll dispatch a custom event that components can listen to
    window.dispatchEvent(new CustomEvent('dashboard:invalidate', {
      detail: { keys: ['metrics', 'revenue'] },
    }));
  }

  private invalidateMetricsAndSubscriptions(): void {
    window.dispatchEvent(new CustomEvent('dashboard:invalidate', {
      detail: { keys: ['metrics', 'subscriptions'] },
    }));
  }

  private invalidateMetricsAndAlerts(): void {
    window.dispatchEvent(new CustomEvent('dashboard:invalidate', {
      detail: { keys: ['metrics', 'alerts'] },
    }));
  }

  // ============================================
  // STATE UPDATE HELPERS
  // ============================================

  private updateRevenueInState(payload: {
    amount: number;
    currency: string;
    timestamp: string;
    source: string;
    customerId?: string;
  }): void {
    // Dispatch event for state update
    window.dispatchEvent(new CustomEvent('dashboard:revenue:update', {
      detail: payload,
    }));
  }

  private updateSubscriptionInState(payload: {
    subscriptionId: string;
    customerId: string;
    customerName: string;
    status: string;
    plan: string;
    amount: number;
    currency: string;
    changeType: string;
    timestamp: string;
  }): void {
    // Dispatch event for state update
    window.dispatchEvent(new CustomEvent('dashboard:subscription:update', {
      detail: payload,
    }));
  }

  private triggerChurnAlert(payload: {
    subscriptionId: string;
    customerId: string;
    customerName: string;
    status: string;
    plan: string;
    amount: number;
    currency: string;
    changeType: string;
    timestamp: string;
  }): void {
    // Dispatch event for churn alert
    window.dispatchEvent(new CustomEvent('dashboard:churn:alert', {
      detail: {
        customerId: payload.customerId,
        customerName: payload.customerName,
        riskLevel: 'high',
        reason: 'Subscription canceled',
        subscriptionValue: payload.amount,
        lastActivity: payload.timestamp,
        timestamp: payload.timestamp,
      },
    }));
  }

  private addAlertToState(alert: {
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    timestamp: string;
    actionRequired: boolean;
    actionUrl?: string;
  }): void {
    // Dispatch event for alert addition
    window.dispatchEvent(new CustomEvent('dashboard:alert:add', {
      detail: alert,
    }));
  }
}

// Export singleton instance
export const dashboardEventSystem = new DashboardEventSystem();

// ============================================
// REACT HOOK FOR EVENT SYSTEM
// ============================================

import { useEffect } from 'react';

export function useDashboardEventSystem() {
  useEffect(() => {
    // Start event system on mount
    dashboardEventSystem.start();

    // Stop event system on unmount
    return () => {
      dashboardEventSystem.stop();
    };
  }, []);
}

// ============================================
// REACT HOOK FOR LISTENING TO CUSTOM EVENTS
// ============================================

export function useDashboardCustomEvents() {
  const { setMetrics, setRevenueData, setSubscriptions, setAlerts } = useDashboard();

  useEffect(() => {
    // Listen for cache invalidation events
    const handleInvalidate = (e: CustomEvent) => {
      const { keys } = e.detail;
      console.log('[DashboardCustomEvents] Invalidating:', keys);
      // This would trigger TanStack Query invalidation
      // For now, just log it
    };

    // Listen for revenue updates
    const handleRevenueUpdate = (e: CustomEvent) => {
      console.log('[DashboardCustomEvents] Revenue update:', e.detail);
      // Update local state incrementally
    };

    // Listen for subscription updates
    const handleSubscriptionUpdate = (e: CustomEvent) => {
      console.log('[DashboardCustomEvents] Subscription update:', e.detail);
      // Update local state incrementally
    };

    // Listen for alert additions
    const handleAlertAdd = (e: CustomEvent) => {
      console.log('[DashboardCustomEvents] Alert add:', e.detail);
      // Add alert to state
      setAlerts((prev) => [e.detail, ...prev]);
    };

    // Register event listeners
    window.addEventListener('dashboard:invalidate', handleInvalidate as EventListener);
    window.addEventListener('dashboard:revenue:update', handleRevenueUpdate as EventListener);
    window.addEventListener('dashboard:subscription:update', handleSubscriptionUpdate as EventListener);
    window.addEventListener('dashboard:alert:add', handleAlertAdd as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('dashboard:invalidate', handleInvalidate as EventListener);
      window.removeEventListener('dashboard:revenue:update', handleRevenueUpdate as EventListener);
      window.removeEventListener('dashboard:subscription:update', handleSubscriptionUpdate as EventListener);
      window.removeEventListener('dashboard:alert:add', handleAlertAdd as EventListener);
    };
  }, [setAlerts]);
}

// ============================================
// EVENT BUS FOR CROSS-COMPONENT COMMUNICATION
// ============================================

type DashboardEventType =
  | 'metrics:updated'
  | 'revenue:updated'
  | 'subscriptions:updated'
  | 'alerts:updated'
  | 'chart:refresh'
  | 'data:refresh';

interface DashboardEventPayload {
  type: DashboardEventType;
  data?: unknown;
  timestamp: string;
}

class DashboardEventBus {
  private listeners: Map<DashboardEventType, Set<(payload: DashboardEventPayload) => void>> = new Map();

  // Subscribe to an event
  on(eventType: DashboardEventType, callback: (payload: DashboardEventPayload) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  // Emit an event
  emit(eventType: DashboardEventType, data?: unknown): void {
    const payload: DashboardEventPayload = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[DashboardEventBus] Error in listener for ${eventType}:`, error);
        }
      });
    }
  }

  // Clear all listeners for an event type
  clear(eventType: DashboardEventType): void {
    this.listeners.delete(eventType);
  }

  // Clear all listeners
  clearAll(): void {
    this.listeners.clear();
  }
}

export const dashboardEventBus = new DashboardEventBus();

// ============================================
// INTEGRATION WITH EVENT SYSTEM
// ============================================

// Connect event system to event bus
dashboardEventSystem.start();

// Listen to event bus and dispatch to window events
dashboardEventBus.on('metrics:updated', (payload) => {
  window.dispatchEvent(new CustomEvent('dashboard:metrics:updated', { detail: payload.data }));
});

dashboardEventBus.on('revenue:updated', (payload) => {
  window.dispatchEvent(new CustomEvent('dashboard:revenue:updated', { detail: payload.data }));
});

dashboardEventBus.on('subscriptions:updated', (payload) => {
  window.dispatchEvent(new CustomEvent('dashboard:subscriptions:updated', { detail: payload.data }));
});

dashboardEventBus.on('alerts:updated', (payload) => {
  window.dispatchEvent(new CustomEvent('dashboard:alerts:updated', { detail: payload.data }));
});

dashboardEventBus.on('chart:refresh', (payload) => {
  window.dispatchEvent(new CustomEvent('dashboard:chart:refresh', { detail: payload.data }));
});

dashboardEventBus.on('data:refresh', (payload) => {
  window.dispatchEvent(new CustomEvent('dashboard:data:refresh', { detail: payload.data }));
});
