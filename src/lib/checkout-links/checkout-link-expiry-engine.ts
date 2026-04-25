// Checkout Link Expiry Engine
// Cron job, auto mark inactive

import type { CheckoutLink } from './checkout-link-types';
import { checkoutLinkStatusEngine } from './checkout-link-status';

// ============================================
// EXPIRY ENGINE RESULT
// ============================================

export interface ExpiryEngineResult {
  success: boolean;
  expiredLinks: CheckoutLink[];
  timestamp: string;
}

// ============================================
// CHECKOUT LINK EXPIRY ENGINE
// ============================================

export class CheckoutLinkExpiryEngine {
  private checkoutLinks: Map<string, CheckoutLink> = new Map();

  // ============================================
  // RUN EXPIRY CHECK
  // ============================================

  runExpiryCheck(): ExpiryEngineResult {
    const expiredLinks: CheckoutLink[] = [];
    const now = new Date();

    for (const checkoutLink of this.checkoutLinks.values()) {
      if (!checkoutLink.expiresAt) {
        continue;
      }

      const expiryDate = new Date(checkoutLink.expiresAt);

      if (now > expiryDate && checkoutLink.status === 'active') {
        // Mark as expired
        checkoutLink.status = checkoutLinkStatusEngine.transition(checkoutLink.status, 'expired');
        checkoutLink.updatedAt = new Date().toISOString();
        expiredLinks.push(checkoutLink);

        console.log(`[ExpiryEngine] Checkout link ${checkoutLink.id} expired, status changed to expired`);
      }
    }

    return {
      success: true,
      expiredLinks,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // RUN EXPIRY CHECK FOR TENANT
  // ============================================

  runExpiryCheckForTenant(tenantId: string): ExpiryEngineResult {
    const expiredLinks: CheckoutLink[] = [];
    const now = new Date();

    for (const checkoutLink of this.checkoutLinks.values()) {
      if (checkoutLink.tenantId !== tenantId) {
        continue;
      }

      if (!checkoutLink.expiresAt) {
        continue;
      }

      const expiryDate = new Date(checkoutLink.expiresAt);

      if (now > expiryDate && checkoutLink.status === 'active') {
        checkoutLink.status = checkoutLinkStatusEngine.transition(checkoutLink.status, 'expired');
        checkoutLink.updatedAt = new Date().toISOString();
        expiredLinks.push(checkoutLink);

        console.log(`[ExpiryEngine] Checkout link ${checkoutLink.id} expired for tenant ${tenantId}`);
      }
    }

    return {
      success: true,
      expiredLinks,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // GET LINKS EXPIRING SOON
  // ============================================

  getLinksExpiringSoon(daysThreshold: number = 7): CheckoutLink[] {
    const expiringSoon: CheckoutLink[] = [];
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

    for (const checkoutLink of this.checkoutLinks.values()) {
      if (!checkoutLink.expiresAt || checkoutLink.status !== 'active') {
        continue;
      }

      const expiryDate = new Date(checkoutLink.expiresAt);

      if (expiryDate < thresholdDate && expiryDate > now) {
        expiringSoon.push(checkoutLink);
      }
    }

    return expiringSoon.sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime());
  }

  // ============================================
  // GET EXPIRED LINKS
  // ============================================

  getExpiredLinks(): CheckoutLink[] {
    const expired: CheckoutLink[] = [];

    for (const checkoutLink of this.checkoutLinks.values()) {
      if (checkoutLink.status === 'expired') {
        expired.push(checkoutLink);
      }
    }

    return expired.sort((a, b) => new Date(b.expiresAt!).getTime() - new Date(a.expiresAt!).getTime());
  }

  // ============================================
  // GET EXPIRY SUMMARY
  // ============================================

  getExpirySummary(): {
    totalLinks: number;
    activeLinks: number;
    expiredLinks: number;
    linksExpiringSoon: number;
  } {
    const totalLinks = this.checkoutLinks.size;
    const activeLinks = Array.from(this.checkoutLinks.values()).filter((l) => l.status === 'active').length;
    const expiredLinks = Array.from(this.checkoutLinks.values()).filter((l) => l.status === 'expired').length;
    const linksExpiringSoon = this.getLinksExpiringSoon().length;

    return {
      totalLinks,
      activeLinks,
      expiredLinks,
      linksExpiringSoon,
    };
  }

  // ============================================
  // MANUALLY EXPIRE LINK
  // ============================================

  manuallyExpireLink(checkoutLinkId: string): CheckoutLink | null {
    const checkoutLink = this.checkoutLinks.get(checkoutLinkId);

    if (!checkoutLink) {
      return null;
    }

    if (checkoutLink.status === 'active') {
      checkoutLink.status = checkoutLinkStatusEngine.transition(checkoutLink.status, 'expired');
      checkoutLink.expiresAt = new Date().toISOString();
      checkoutLink.updatedAt = new Date().toISOString();

      console.log(`[ExpiryEngine] Manually expired checkout link ${checkoutLinkId}`);
    }

    return checkoutLink;
  }

  // ============================================
  // REACTIVATE EXPIRED LINK
  // ============================================

  reactivateLink(checkoutLinkId: string, newExpiryDate?: string): CheckoutLink | null {
    const checkoutLink = this.checkoutLinks.get(checkoutLinkId);

    if (!checkoutLink) {
      return null;
    }

    if (checkoutLink.status === 'expired') {
      checkoutLink.status = checkoutLinkStatusEngine.transition(checkoutLink.status, 'active');
      checkoutLink.expiresAt = newExpiryDate || null;
      checkoutLink.updatedAt = new Date().toISOString();

      console.log(`[ExpiryEngine] Reactivated checkout link ${checkoutLinkId}`);
    }

    return checkoutLink;
  }

  // ============================================
  // EXTEND EXPIRY DATE
  // ============================================

  extendExpiryDate(checkoutLinkId: string, additionalDays: number): CheckoutLink | null {
    const checkoutLink = this.checkoutLinks.get(checkoutLinkId);

    if (!checkoutLink) {
      return null;
    }

    if (checkoutLink.expiresAt) {
      const currentExpiry = new Date(checkoutLink.expiresAt);
      const newExpiry = new Date(currentExpiry.getTime() + additionalDays * 24 * 60 * 60 * 1000);
      checkoutLink.expiresAt = newExpiry.toISOString();
      checkoutLink.updatedAt = new Date().toISOString();

      console.log(`[ExpiryEngine] Extended expiry for checkout link ${checkoutLinkId} by ${additionalDays} days`);
    }

    return checkoutLink;
  }

  // ============================================
  // REGISTER CHECKOUT LINK
  // ============================================

  registerCheckoutLink(checkoutLink: CheckoutLink): void {
    this.checkoutLinks.set(checkoutLink.id, checkoutLink);
  }

  // ============================================
  // UNREGISTER CHECKOUT LINK
  // ============================================

  unregisterCheckoutLink(checkoutLinkId: string): void {
    this.checkoutLinks.delete(checkoutLinkId);
  }

  // ============================================
  // GET CHECKOUT LINK
  // ============================================

  getCheckoutLink(checkoutLinkId: string): CheckoutLink | null {
    return this.checkoutLinks.get(checkoutLinkId) || null;
  }

  // ============================================
  // GET ALL CHECKOUT LINKS
  // ============================================

  getAllCheckoutLinks(): CheckoutLink[] {
    return Array.from(this.checkoutLinks.values());
  }
}

// Export singleton instance
export const checkoutLinkExpiryEngine = new CheckoutLinkExpiryEngine();

// ============================================
// REACT HOOK FOR EXPIRY ENGINE
// ============================================

import { useCallback } from 'react';

export function useCheckoutLinkExpiry() {
  const runExpiryCheck = useCallback(() => {
    return checkoutLinkExpiryEngine.runExpiryCheck();
  }, []);

  const runExpiryCheckForTenant = useCallback((tenantId: string) => {
    return checkoutLinkExpiryEngine.runExpiryCheckForTenant(tenantId);
  }, []);

  const getLinksExpiringSoon = useCallback((daysThreshold?: number) => {
    return checkoutLinkExpiryEngine.getLinksExpiringSoon(daysThreshold);
  }, []);

  const getExpiredLinks = useCallback(() => {
    return checkoutLinkExpiryEngine.getExpiredLinks();
  }, []);

  const getExpirySummary = useCallback(() => {
    return checkoutLinkExpiryEngine.getExpirySummary();
  }, []);

  const manuallyExpireLink = useCallback((checkoutLinkId: string) => {
    return checkoutLinkExpiryEngine.manuallyExpireLink(checkoutLinkId);
  }, []);

  const reactivateLink = useCallback((checkoutLinkId: string, newExpiryDate?: string) => {
    return checkoutLinkExpiryEngine.reactivateLink(checkoutLinkId, newExpiryDate);
  }, []);

  const extendExpiryDate = useCallback((checkoutLinkId: string, additionalDays: number) => {
    return checkoutLinkExpiryEngine.extendExpiryDate(checkoutLinkId, additionalDays);
  }, []);

  return {
    runExpiryCheck,
    runExpiryCheckForTenant,
    getLinksExpiringSoon,
    getExpiredLinks,
    getExpirySummary,
    manuallyExpireLink,
    reactivateLink,
    extendExpiryDate,
  };
}
