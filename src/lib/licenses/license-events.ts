// License Events System
// Event-driven license lifecycle management

import type { License, LicenseEvent, LicenseEventType } from './license-types';

// ============================================
// LICENSE EVENT LISTENER
// ============================================

export type LicenseEventListener = (event: LicenseEvent) => void | Promise<void>;

// ============================================
// LICENSE EVENT BUS
// ============================================

export class LicenseEventBus {
  private listeners: Map<LicenseEventType, Set<LicenseEventListener>> = new Map();
  private eventHistory: LicenseEvent[] = [];
  private maxHistorySize: number = 1000;

  // ============================================
  // SUBSCRIBE TO EVENT
  // ============================================

  on(eventType: LicenseEventType, listener: LicenseEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => this.off(eventType, listener);
  }

  // ============================================
  // UNSUBSCRIBE FROM EVENT
  // ============================================

  off(eventType: LicenseEventType, listener: LicenseEventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // ============================================
  // EMIT EVENT
  // ============================================

  async emit(event: LicenseEvent): Promise<void> {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify listeners
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      const promises = Array.from(listeners).map((listener) => {
        try {
          return listener(event);
        } catch (error) {
          console.error(`[LicenseEventBus] Error in listener for ${event.type}:`, error);
          return Promise.resolve();
        }
      });

      await Promise.all(promises);
    }

    // Log event
    console.log(`[LicenseEventBus] Event emitted: ${event.type}`, event);
  }

  // ============================================
  // GET EVENT HISTORY
  // ============================================

  getHistory(eventType?: LicenseEventType, limit?: number): LicenseEvent[] {
    let history = this.eventHistory;

    if (eventType) {
      history = history.filter((e) => e.type === eventType);
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  // ============================================
  // CLEAR HISTORY
  // ============================================

  clearHistory(): void {
    this.eventHistory = [];
  }

  // ============================================
  // CLEAR LISTENERS
  // ============================================

  clearListeners(eventType?: LicenseEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Export singleton instance
export const licenseEventBus = new LicenseEventBus();

// ============================================
// LICENSE EVENT EMITTER
// ============================================

export class LicenseEventEmitter {
  // ============================================
  // EMIT LICENSE CREATED EVENT
  // ============================================

  async emitLicenseCreated(license: License, userId?: string): Promise<void> {
    const event: LicenseEvent = {
      type: 'license.created',
      data: {
        licenseId: license.id,
        licenseKey: license.licenseKey,
        customerId: license.customerId,
        productId: license.productId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: license.tenantId,
    };

    await licenseEventBus.emit(event);
  }

  // ============================================
  // EMIT LICENSE GENERATED EVENT
  // ============================================

  async emitLicenseGenerated(license: License, userId?: string): Promise<void> {
    const event: LicenseEvent = {
      type: 'license.generated',
      data: {
        licenseId: license.id,
        licenseKey: license.licenseKey,
        customerId: license.customerId,
        productId: license.productId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: license.tenantId,
    };

    await licenseEventBus.emit(event);
  }

  // ============================================
  // EMIT LICENSE ACTIVATED EVENT
  // ============================================

  async emitLicenseActivated(license: License, deviceId: string, userId?: string): Promise<void> {
    const event: LicenseEvent = {
      type: 'license.activated',
      data: {
        licenseId: license.id,
        licenseKey: license.licenseKey,
        customerId: license.customerId,
        deviceId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: license.tenantId,
    };

    await licenseEventBus.emit(event);
  }

  // ============================================
  // EMIT LICENSE DEACTIVATED EVENT
  // ============================================

  async emitLicenseDeactivated(license: License, deviceId: string, userId?: string): Promise<void> {
    const event: LicenseEvent = {
      type: 'license.deactivated',
      data: {
        licenseId: license.id,
        licenseKey: license.licenseKey,
        customerId: license.customerId,
        deviceId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: license.tenantId,
    };

    await licenseEventBus.emit(event);
  }

  // ============================================
  // EMIT LICENSE REVOKED EVENT
  // ============================================

  async emitLicenseRevoked(license: License, userId?: string): Promise<void> {
    const event: LicenseEvent = {
      type: 'license.revoked',
      data: {
        licenseId: license.id,
        licenseKey: license.licenseKey,
        customerId: license.customerId,
        productId: license.productId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: license.tenantId,
    };

    await licenseEventBus.emit(event);
  }

  // ============================================
  // EMIT LICENSE DISABLED EVENT
  // ============================================

  async emitLicenseDisabled(license: License, userId?: string): Promise<void> {
    const event: LicenseEvent = {
      type: 'license.disabled',
      data: {
        licenseId: license.id,
        licenseKey: license.licenseKey,
        customerId: license.customerId,
        productId: license.productId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: license.tenantId,
    };

    await licenseEventBus.emit(event);
  }

  // ============================================
  // EMIT LICENSE ENABLED EVENT
  // ============================================

  async emitLicenseEnabled(license: License, userId?: string): Promise<void> {
    const event: LicenseEvent = {
      type: 'license.enabled',
      data: {
        licenseId: license.id,
        licenseKey: license.licenseKey,
        customerId: license.customerId,
        productId: license.productId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: license.tenantId,
    };

    await licenseEventBus.emit(event);
  }

  // ============================================
  // EMIT LICENSE EXPIRED EVENT
  // ============================================

  async emitLicenseExpired(license: License, userId?: string): Promise<void> {
    const event: LicenseEvent = {
      type: 'license.expired',
      data: {
        licenseId: license.id,
        licenseKey: license.licenseKey,
        customerId: license.customerId,
        productId: license.productId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: license.tenantId,
    };

    await licenseEventBus.emit(event);
  }

  // ============================================
  // EMIT LICENSE EXTENDED EVENT
  // ============================================

  async emitLicenseExtended(license: License, newExpiryDate: string, userId?: string): Promise<void> {
    const event: LicenseEvent = {
      type: 'license.extended',
      data: {
        licenseId: license.id,
        licenseKey: license.licenseKey,
        customerId: license.customerId,
        newExpiryDate,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: license.tenantId,
    };

    await licenseEventBus.emit(event);
  }

  // ============================================
  // EMIT LICENSE VALIDATED EVENT
  // ============================================

  async emitLicenseValidated(license: License, deviceId: string, valid: boolean, userId?: string): Promise<void> {
    const event: LicenseEvent = {
      type: 'license.validated',
      data: {
        licenseId: license.id,
        licenseKey: license.licenseKey,
        customerId: license.customerId,
        deviceId,
        valid,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: license.tenantId,
    };

    await licenseEventBus.emit(event);
  }
}

// Export singleton instance
export const licenseEventEmitter = new LicenseEventEmitter();

// ============================================
// REACT HOOK FOR LICENSE EVENTS
// ============================================

import { useEffect, useCallback } from 'react';

export function useLicenseEvents() {
  const subscribe = useCallback((eventType: LicenseEventType, listener: LicenseEventListener) => {
    return licenseEventBus.on(eventType, listener);
  }, []);

  const getHistory = useCallback((eventType?: LicenseEventType, limit?: number) => {
    return licenseEventBus.getHistory(eventType, limit);
  }, []);

  return {
    subscribe,
    getHistory,
  };
}
