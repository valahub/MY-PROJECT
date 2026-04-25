// Real-Time Engine for Merchant Dashboard
// Handles WebSocket/SSE connections for live dashboard updates
// Events: revenue.update, subscription.change, churn.alert

import { wsManager, WSMessage } from '../websocket-manager';

// ============================================
// REAL-TIME EVENT TYPES
// ============================================

export interface RevenueUpdateEvent {
  type: 'revenue.update';
  payload: {
    amount: number;
    currency: string;
    timestamp: string;
    source: 'payment' | 'refund' | 'adjustment';
    customerId?: string;
  };
}

export interface SubscriptionChangeEvent {
  type: 'subscription.change';
  payload: {
    subscriptionId: string;
    customerId: string;
    customerName: string;
    status: 'active' | 'canceled' | 'past_due' | 'trial';
    plan: string;
    amount: number;
    currency: string;
    changeType: 'created' | 'updated' | 'canceled' | 'renewed';
    timestamp: string;
  };
}

export interface ChurnAlertEvent {
  type: 'churn.alert';
  payload: {
    customerId: string;
    customerName: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    subscriptionValue: number;
    lastActivity: string;
    timestamp: string;
  };
}

export interface PaymentSuccessEvent {
  type: 'payment.success';
  payload: {
    paymentId: string;
    customerId: string;
    amount: number;
    currency: string;
    plan: string;
    timestamp: string;
  };
}

export interface RefundEvent {
  type: 'refund';
  payload: {
    refundId: string;
    paymentId: string;
    customerId: string;
    amount: number;
    currency: string;
    reason: string;
    timestamp: string;
  };
}

export type DashboardRealtimeEvent =
  | RevenueUpdateEvent
  | SubscriptionChangeEvent
  | ChurnAlertEvent
  | PaymentSuccessEvent
  | RefundEvent;

// ============================================
// EVENT LISTENER TYPES
// ============================================

export type RevenueUpdateListener = (event: RevenueUpdateEvent) => void;
export type SubscriptionChangeListener = (event: SubscriptionChangeEvent) => void;
export type ChurnAlertListener = (event: ChurnAlertEvent) => void;
export type PaymentSuccessListener = (event: PaymentSuccessEvent) => void;
export type RefundListener = (event: RefundEvent) => void;

// ============================================
// REAL-TIME ENGINE CLASS
// ============================================

class DashboardRealtimeEngine {
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private listeners: Map<string, Set<(event: DashboardRealtimeEvent) => void>> = new Map();

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  connect(url: string = 'ws://localhost:3001/ws'): void {
    wsManager.configure({
      url,
      reconnectMs: 1000,
      maxReconnectMs: 30000,
      pingIntervalMs: 25000,
    });

    wsManager.connect();

    // Listen for connection events
    wsManager.on('__connected__', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log('[DashboardRealtime] Connected to WebSocket');
    });

    wsManager.on('__disconnected__', () => {
      this.connected = false;
      console.log('[DashboardRealtime] Disconnected from WebSocket');
    });

    // Listen for all dashboard events
    wsManager.on('*', (msg: WSMessage) => {
      if (this.isDashboardEvent(msg)) {
        this.dispatch(msg as DashboardRealtimeEvent);
      }
    });
  }

  disconnect(): void {
    wsManager.disconnect();
    this.connected = false;
  }

  getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
    return wsManager.state;
  }

  // ============================================
  // EVENT SUBSCRIPTION
  // ============================================

  onRevenueUpdate(listener: RevenueUpdateListener): () => void {
    return this.addEventListener('revenue.update', listener);
  }

  onSubscriptionChange(listener: SubscriptionChangeListener): () => void {
    return this.addEventListener('subscription.change', listener);
  }

  onChurnAlert(listener: ChurnAlertListener): () => void {
    return this.addEventListener('churn.alert', listener);
  }

  onPaymentSuccess(listener: PaymentSuccessListener): () => void {
    return this.addEventListener('payment.success', listener);
  }

  onRefund(listener: RefundListener): () => void {
    return this.addEventListener('refund', listener);
  }

  onAllEvents(listener: (event: DashboardRealtimeEvent) => void): () => void {
    return this.addEventListener('*', listener);
  }

  private addEventListener(
    eventType: string,
    listener: (event: DashboardRealtimeEvent) => void
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  // ============================================
  // EVENT DISPATCHING
  // ============================================

  private dispatch(event: DashboardRealtimeEvent): void {
    // Dispatch to specific event type listeners
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      typeListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`[DashboardRealtime] Error in listener for ${event.type}:`, error);
        }
      });
    }

    // Dispatch to wildcard listeners
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error('[DashboardRealtime] Error in wildcard listener:', error);
        }
      });
    }
  }

  // ============================================
  // EVENT VALIDATION
  // ============================================

  private isDashboardEvent(msg: WSMessage): boolean {
    const dashboardEventTypes = [
      'revenue.update',
      'subscription.change',
      'churn.alert',
      'payment.success',
      'refund',
    ];
    return dashboardEventTypes.includes(msg.type);
  }

  // ============================================
  // SIMULATED EVENTS (FOR DEVELOPMENT)
  // ============================================

  // Simulate a revenue update event
  simulateRevenueUpdate(params?: Partial<RevenueUpdateEvent['payload']>): void {
    const event: RevenueUpdateEvent = {
      type: 'revenue.update',
      payload: {
        amount: params?.amount || 100 + Math.random() * 900,
        currency: params?.currency || 'USD',
        timestamp: new Date().toISOString(),
        source: params?.source || 'payment',
        customerId: params?.customerId,
      },
    };
    this.dispatch(event);
  }

  // Simulate a subscription change event
  simulateSubscriptionChange(params?: Partial<SubscriptionChangeEvent['payload']>): void {
    const statuses: Array<'active' | 'canceled' | 'past_due' | 'trial'> = ['active', 'active', 'active', 'canceled', 'past_due'];
    const changeTypes: Array<'created' | 'updated' | 'canceled' | 'renewed'> = ['created', 'updated', 'canceled', 'renewed'];
    const plans = ['Basic', 'Pro', 'Enterprise'];

    const event: SubscriptionChangeEvent = {
      type: 'subscription.change',
      payload: {
        subscriptionId: params?.subscriptionId || `sub_${Date.now()}`,
        customerId: params?.customerId || `cust_${Date.now()}`,
        customerName: params?.customerName || `Customer ${Math.floor(Math.random() * 1000)}`,
        status: params?.status || statuses[Math.floor(Math.random() * statuses.length)],
        plan: params?.plan || plans[Math.floor(Math.random() * plans.length)],
        amount: params?.amount || (Math.random() > 0.5 ? 99 : 299),
        currency: params?.currency || 'USD',
        changeType: params?.changeType || changeTypes[Math.floor(Math.random() * changeTypes.length)],
        timestamp: new Date().toISOString(),
      },
    };
    this.dispatch(event);
  }

  // Simulate a churn alert event
  simulateChurnAlert(params?: Partial<ChurnAlertEvent['payload']>): void {
    const riskLevels: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    const reasons = [
      'Payment method expired',
      'Low engagement',
      'Competitor mentioned',
      'Support tickets increased',
      'Usage declined',
    ];

    const event: ChurnAlertEvent = {
      type: 'churn.alert',
      payload: {
        customerId: params?.customerId || `cust_${Date.now()}`,
        customerName: params?.customerName || `Customer ${Math.floor(Math.random() * 1000)}`,
        riskLevel: params?.riskLevel || riskLevels[Math.floor(Math.random() * riskLevels.length)],
        reason: params?.reason || reasons[Math.floor(Math.random() * reasons.length)],
        subscriptionValue: params?.subscriptionValue || 99 + Math.random() * 900,
        lastActivity: params?.lastActivity || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        timestamp: new Date().toISOString(),
      },
    };
    this.dispatch(event);
  }

  // Simulate a payment success event
  simulatePaymentSuccess(params?: Partial<PaymentSuccessEvent['payload']>): void {
    const plans = ['Basic', 'Pro', 'Enterprise'];

    const event: PaymentSuccessEvent = {
      type: 'payment.success',
      payload: {
        paymentId: params?.paymentId || `pay_${Date.now()}`,
        customerId: params?.customerId || `cust_${Date.now()}`,
        amount: params?.amount || (Math.random() > 0.5 ? 99 : 299),
        currency: params?.currency || 'USD',
        plan: params?.plan || plans[Math.floor(Math.random() * plans.length)],
        timestamp: new Date().toISOString(),
      },
    };
    this.dispatch(event);
  }

  // Simulate a refund event
  simulateRefund(params?: Partial<RefundEvent['payload']>): void {
    const reasons = ['Service not as described', 'Accidental purchase', 'Duplicate charge', 'Other'];

    const event: RefundEvent = {
      type: 'refund',
      payload: {
        refundId: params?.refundId || `ref_${Date.now()}`,
        paymentId: params?.paymentId || `pay_${Date.now() - 1000}`,
        customerId: params?.customerId || `cust_${Date.now()}`,
        amount: params?.amount || 99,
        currency: params?.currency || 'USD',
        reason: params?.reason || reasons[Math.floor(Math.random() * reasons.length)],
        timestamp: new Date().toISOString(),
      },
    };
    this.dispatch(event);
  }

  // Start simulation mode (for development/testing)
  startSimulation(intervalMs: number = 5000): () => void {
    const interval = setInterval(() => {
      const random = Math.random();
      if (random < 0.3) {
        this.simulateRevenueUpdate();
      } else if (random < 0.5) {
        this.simulatePaymentSuccess();
      } else if (random < 0.7) {
        this.simulateSubscriptionChange();
      } else if (random < 0.85) {
        this.simulateChurnAlert();
      } else {
        this.simulateRefund();
      }
    }, intervalMs);

    // Return stop function
    return () => clearInterval(interval);
  }
}

// Export singleton instance
export const dashboardRealtime = new DashboardRealtimeEngine();
