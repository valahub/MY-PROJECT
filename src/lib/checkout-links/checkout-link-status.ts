// Checkout Link Status Engine
// Active/inactive, expiry handling

import type { CheckoutLink, CheckoutLinkStatus } from './checkout-link-types';

// ============================================
// STATUS TRANSITION
// ============================================

export interface StatusTransition {
  from: CheckoutLinkStatus;
  to: CheckoutLinkStatus;
  allowed: boolean;
  reason?: string;
}

// ============================================
// CHECKOUT LINK STATUS ENGINE
// ============================================

export class CheckoutLinkStatusEngine {
  // ============================================
  // VALID TRANSITIONS
  // ============================================

  private readonly validTransitions: Map<CheckoutLinkStatus, CheckoutLinkStatus[]> = new Map([
    ['active', ['inactive', 'expired']],
    ['inactive', ['active']],
    ['expired', ['active']], // Can reactivate expired links
  ]);

  // ============================================
  // CAN TRANSITION
  // ============================================

  canTransition(from: CheckoutLinkStatus, to: CheckoutLinkStatus): StatusTransition {
    const allowedTransitions = this.validTransitions.get(from) || [];

    if (allowedTransitions.includes(to)) {
      return {
        from,
        to,
        allowed: true,
      };
    }

    return {
      from,
      to,
      allowed: false,
      reason: `Cannot transition from ${from} to ${to}. Valid transitions: ${allowedTransitions.join(', ') || 'none'}`,
    };
  }

  // ============================================
  // TRANSITION
  // ============================================

  transition(currentStatus: CheckoutLinkStatus, newStatus: CheckoutLinkStatus): CheckoutLinkStatus {
    const result = this.canTransition(currentStatus, newStatus);

    if (!result.allowed) {
      throw new Error(result.reason);
    }

    return newStatus;
  }

  // ============================================
  // GET VALID TRANSITIONS
  // ============================================

  getValidTransitions(currentStatus: CheckoutLinkStatus): CheckoutLinkStatus[] {
    return this.validTransitions.get(currentStatus) || [];
  }

  // ============================================
  // CHECK EXPIRY
  // ============================================

  checkExpiry(checkoutLink: CheckoutLink): CheckoutLinkStatus {
    if (!checkoutLink.expiresAt) {
      return checkoutLink.status;
    }

    const now = new Date();
    const expiryDate = new Date(checkoutLink.expiresAt);

    if (now > expiryDate && checkoutLink.status === 'active') {
      return 'expired';
    }

    return checkoutLink.status;
  }

  // ============================================
  // UPDATE STATUS BASED ON EXPIRY
  // ============================================

  updateStatusBasedOnExpiry(checkoutLink: CheckoutLink): CheckoutLink {
    const newStatus = this.checkExpiry(checkoutLink);

    if (newStatus !== checkoutLink.status) {
      checkoutLink.status = newStatus;
      checkoutLink.updatedAt = new Date().toISOString();
      console.log(`[CheckoutLinkStatusEngine] Checkout link ${checkoutLink.id} expired, status changed to ${newStatus}`);
    }

    return checkoutLink;
  }

  // ============================================
  // BATCH UPDATE EXPIRY STATUS
  // ============================================

  batchUpdateExpiryStatus(checkoutLinks: CheckoutLink[]): CheckoutLink[] {
    const updated: CheckoutLink[] = [];

    for (const checkoutLink of checkoutLinks) {
      const updatedLink = this.updateStatusBasedOnExpiry(checkoutLink);
      if (updatedLink.status !== checkoutLink.status) {
        updated.push(updatedLink);
      }
    }

    return updated;
  }

  // ============================================
  // GET STATUS COLOR
  // ============================================

  getStatusColor(status: CheckoutLinkStatus): string {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'gray';
      case 'expired':
        return 'red';
      default:
        return 'gray';
    }
  }

  // ============================================
  // GET STATUS LABEL
  // ============================================

  getStatusLabel(status: CheckoutLinkStatus): string {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  }

  // ============================================
  // GET STATUS ICON
  // ============================================

  getStatusIcon(status: CheckoutLinkStatus): string {
    switch (status) {
      case 'active':
        return '●';
      case 'inactive':
        return '○';
      case 'expired':
        return '✗';
      default:
        return '?';
    }
  }

  // ============================================
  // GET STATUS BADGE CLASS
  // ============================================

  getStatusBadgeClass(status: CheckoutLinkStatus): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // ============================================
  // IS LINK ACCESSIBLE
  // ============================================

  isLinkAccessible(checkoutLink: CheckoutLink): boolean {
    return checkoutLink.status === 'active' && this.checkExpiry(checkoutLink) === 'active';
  }

  // ============================================
  // GET DAYS UNTIL EXPIRY
  // ============================================

  getDaysUntilExpiry(checkoutLink: CheckoutLink): number | null {
    if (!checkoutLink.expiresAt) {
      return null;
    }

    const now = new Date();
    const expiryDate = new Date(checkoutLink.expiresAt);
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  // ============================================
  // IS EXPIRING SOON
  // ============================================

  isExpiringSoon(checkoutLink: CheckoutLink, daysThreshold: number = 7): boolean {
    const daysUntilExpiry = this.getDaysUntilExpiry(checkoutLink);
    return daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= daysThreshold;
  }
}

// Export singleton instance
export const checkoutLinkStatusEngine = new CheckoutLinkStatusEngine();

// ============================================
// REACT HOOK FOR STATUS ENGINE
// ============================================

import { useCallback } from 'react';

export function useCheckoutLinkStatus() {
  const canTransition = useCallback((from: CheckoutLinkStatus, to: CheckoutLinkStatus) => {
    return checkoutLinkStatusEngine.canTransition(from, to);
  }, []);

  const transition = useCallback((currentStatus: CheckoutLinkStatus, newStatus: CheckoutLinkStatus) => {
    return checkoutLinkStatusEngine.transition(currentStatus, newStatus);
  }, []);

  const getValidTransitions = useCallback((currentStatus: CheckoutLinkStatus) => {
    return checkoutLinkStatusEngine.getValidTransitions(currentStatus);
  }, []);

  const checkExpiry = useCallback((checkoutLink: CheckoutLink) => {
    return checkoutLinkStatusEngine.checkExpiry(checkoutLink);
  }, []);

  const updateStatusBasedOnExpiry = useCallback((checkoutLink: CheckoutLink) => {
    return checkoutLinkStatusEngine.updateStatusBasedOnExpiry(checkoutLink);
  }, []);

  const batchUpdateExpiryStatus = useCallback((checkoutLinks: CheckoutLink[]) => {
    return checkoutLinkStatusEngine.batchUpdateExpiryStatus(checkoutLinks);
  }, []);

  const isLinkAccessible = useCallback((checkoutLink: CheckoutLink) => {
    return checkoutLinkStatusEngine.isLinkAccessible(checkoutLink);
  }, []);

  const getDaysUntilExpiry = useCallback((checkoutLink: CheckoutLink) => {
    return checkoutLinkStatusEngine.getDaysUntilExpiry(checkoutLink);
  }, []);

  const isExpiringSoon = useCallback((checkoutLink: CheckoutLink, daysThreshold?: number) => {
    return checkoutLinkStatusEngine.isExpiringSoon(checkoutLink, daysThreshold);
  }, []);

  const getStatusColor = useCallback((status: CheckoutLinkStatus) => {
    return checkoutLinkStatusEngine.getStatusColor(status);
  }, []);

  const getStatusLabel = useCallback((status: CheckoutLinkStatus) => {
    return checkoutLinkStatusEngine.getStatusLabel(status);
  }, []);

  const getStatusIcon = useCallback((status: CheckoutLinkStatus) => {
    return checkoutLinkStatusEngine.getStatusIcon(status);
  }, []);

  const getStatusBadgeClass = useCallback((status: CheckoutLinkStatus) => {
    return checkoutLinkStatusEngine.getStatusBadgeClass(status);
  }, []);

  return {
    canTransition,
    transition,
    getValidTransitions,
    checkExpiry,
    updateStatusBasedOnExpiry,
    batchUpdateExpiryStatus,
    isLinkAccessible,
    getDaysUntilExpiry,
    isExpiringSoon,
    getStatusColor,
    getStatusLabel,
    getStatusIcon,
    getStatusBadgeClass,
  };
}
