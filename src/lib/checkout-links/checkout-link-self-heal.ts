// Checkout Link Self-Healing Rule Engine
// Product deleted, pricing invalid, slug conflict

import type { CheckoutLink } from './checkout-link-types';
import { checkoutLinkStatusEngine } from './checkout-link-status';
import { checkoutLinkGenerator } from './checkout-link-generator';

// ============================================
// SELF-HEAL RESULT
// ============================================

export interface SelfHealResult {
  success: boolean;
  checkoutLink: CheckoutLink;
  fixes: string[];
  issues: string[];
  timestamp: string;
}

// ============================================
// CHECKOUT LINK SELF-HEALING ENGINE
// ============================================

export class CheckoutLinkSelfHealingEngine {
  private checkoutLinks: Map<string, CheckoutLink> = new Map();
  private deletedProducts: Set<string> = new Set();
  private invalidPricings: Set<string> = new Set();

  // ============================================
  // HEAL CHECKOUT LINK
  // ============================================

  async healCheckoutLink(checkoutLink: CheckoutLink): Promise<SelfHealResult> {
    const fixes: string[] = [];
    const issues: string[] = [];
    const healedLink = { ...checkoutLink };

    // Rule 1: If product deleted → auto disable link
    if (this.deletedProducts.has(checkoutLink.productId)) {
      if (healedLink.status === 'active') {
        healedLink.status = checkoutLinkStatusEngine.transition(healedLink.status, 'inactive');
        healedLink.updatedAt = new Date().toISOString();
        fixes.push('Auto-disabled link due to deleted product');
      }
    }

    // Rule 2: If pricing invalid → rebind latest version
    if (this.invalidPricings.has(checkoutLink.pricingId)) {
      const latestPricingId = this.getLatestPricingForProduct(checkoutLink.productId);
      if (latestPricingId && latestPricingId !== checkoutLink.pricingId) {
        healedLink.pricingId = latestPricingId;
        healedLink.updatedAt = new Date().toISOString();
        fixes.push('Rebound to latest pricing version');
      } else {
        issues.push('No valid pricing available for product');
      }
    }

    // Rule 3: If slug conflict → regenerate automatically
    const slugConflict = this.checkSlugConflict(checkoutLink.slug, checkoutLink.id);
    if (slugConflict) {
      const result = checkoutLinkGenerator.regenerateSlug(checkoutLink.id);
      if (result.success && result.checkoutLink) {
        healedLink.slug = result.checkoutLink.slug;
        healedLink.updatedAt = new Date().toISOString();
        fixes.push('Regenerated slug due to conflict');
      } else {
        issues.push('Failed to regenerate slug');
      }
    }

    // Rule 4: Check expiry status
    const expiryStatus = checkoutLinkStatusEngine.checkExpiry(healedLink);
    if (expiryStatus !== healedLink.status) {
      healedLink.status = expiryStatus;
      healedLink.updatedAt = new Date().toISOString();
      fixes.push('Updated status based on expiry');
    }

    healedLink.updatedAt = new Date().toISOString();

    const success = fixes.length > 0 || issues.length === 0;

    console.log(`[CheckoutLinkSelfHeal] Healed checkout link ${checkoutLink.id}: ${fixes.join(', ')}`);

    return {
      success,
      checkoutLink: healedLink,
      fixes,
      issues,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // BATCH HEAL CHECKOUT LINKS
  // ============================================

  async batchHealCheckoutLinks(checkoutLinks: CheckoutLink[]): Promise<Map<string, SelfHealResult>> {
    const results = new Map<string, SelfHealResult>();

    for (const checkoutLink of checkoutLinks) {
      const result = await this.healCheckoutLink(checkoutLink);
      results.set(checkoutLink.id, result);
    }

    return results;
  }

  // ============================================
  // CHECK SLUG CONFLICT
  // ============================================

  private checkSlugConflict(slug: string, excludeId: string): boolean {
    for (const checkoutLink of this.checkoutLinks.values()) {
      if (checkoutLink.slug === slug && checkoutLink.id !== excludeId) {
        return true;
      }
    }
    return false;
  }

  // ============================================
  // GET LATEST PRICING FOR PRODUCT
  // ============================================

  private getLatestPricingForProduct(productId: string): string | null {
    // In production, fetch from pricing service
    // For now, return null
    return null;
  }

  // ============================================
  // MARK PRODUCT AS DELETED
  // ============================================

  markProductAsDeleted(productId: string): void {
    this.deletedProducts.add(productId);
    console.log(`[CheckoutLinkSelfHeal] Marked product ${productId} as deleted`);
  }

  // ============================================
  // MARK PRICING AS INVALID
  // ============================================

  markPricingAsInvalid(pricingId: string): void {
    this.invalidPricings.add(pricingId);
    console.log(`[CheckoutLinkSelfHeal] Marked pricing ${pricingId} as invalid`);
  }

  // ============================================
  // UNMARK PRODUCT AS DELETED
  // ============================================

  unmarkProductAsDeleted(productId: string): void {
    this.deletedProducts.delete(productId);
  }

  // ============================================
  // UNMARK PRICING AS INVALID
  // ============================================

  unmarkPricingAsInvalid(pricingId: string): void {
    this.invalidPricings.delete(pricingId);
  }

  // ============================================
  // DETECT INCONSISTENCIES
  // ============================================

  detectInconsistencies(checkoutLink: CheckoutLink): string[] {
    const issues: string[] = [];

    // Check if product is deleted
    if (this.deletedProducts.has(checkoutLink.productId)) {
      issues.push('Product is deleted but link is still active');
    }

    // Check if pricing is invalid
    if (this.invalidPricings.has(checkoutLink.pricingId)) {
      issues.push('Pricing is invalid');
    }

    // Check slug conflict
    if (this.checkSlugConflict(checkoutLink.slug, checkoutLink.id)) {
      issues.push('Slug conflict detected');
    }

    // Check expiry
    const expiryStatus = checkoutLinkStatusEngine.checkExpiry(checkoutLink);
    if (expiryStatus === 'expired' && checkoutLink.status === 'active') {
      issues.push('Link is expired but status is still active');
    }

    return issues;
  }

  // ============================================
  // GET HEALTH SUMMARY
  // ============================================

  getHealthSummary(checkoutLinks: CheckoutLink[]): {
    totalLinks: number;
    healthyLinks: number;
    linksWithIssues: number;
    issues: Map<string, string[]>;
  } {
    const issues = new Map<string, string[]>();
    let linksWithIssues = 0;

    for (const checkoutLink of checkoutLinks) {
      const linkIssues = this.detectInconsistencies(checkoutLink);
      if (linkIssues.length > 0) {
        issues.set(checkoutLink.id, linkIssues);
        linksWithIssues++;
      }
    }

    const healthyLinks = checkoutLinks.length - linksWithIssues;

    return {
      totalLinks: checkoutLinks.length,
      healthyLinks,
      linksWithIssues,
      issues,
    };
  }

  // ============================================
  // AUTO HEAL ALL
  // ============================================

  async autoHealAll(checkoutLinks: CheckoutLink[]): Promise<{
    linksHealed: number;
    linksWithRemainingIssues: number;
  }> {
    let linksHealed = 0;
    let linksWithRemainingIssues = 0;

    for (const checkoutLink of checkoutLinks) {
      const result = await this.healCheckoutLink(checkoutLink);
      if (result.success) {
        linksHealed++;
      }
      if (result.issues.length > 0) {
        linksWithRemainingIssues++;
      }
    }

    return {
      linksHealed,
      linksWithRemainingIssues,
    };
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
  // GET DELETED PRODUCTS
  // ============================================

  getDeletedProducts(): string[] {
    return Array.from(this.deletedProducts);
  }

  // ============================================
  // GET INVALID PRICINGS
  // ============================================

  getInvalidPricings(): string[] {
    return Array.from(this.invalidPricings);
  }
}

// Export singleton instance
export const checkoutLinkSelfHealingEngine = new CheckoutLinkSelfHealingEngine();

// ============================================
// REACT HOOK FOR SELF-HEALING
// ============================================

import { useState, useCallback } from 'react';

export function useCheckoutLinkSelfHealing() {
  const [isHealing, setIsHealing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const healCheckoutLink = useCallback(async (checkoutLink: CheckoutLink) => {
    setIsHealing(true);
    setError(null);

    try {
      const result = await checkoutLinkSelfHealingEngine.healCheckoutLink(checkoutLink);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to heal checkout link';
      setError(errorMessage);
      return {
        success: false,
        checkoutLink,
        fixes: [],
        issues: [errorMessage],
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsHealing(false);
    }
  }, []);

  const autoHealAll = useCallback(async (checkoutLinks: CheckoutLink[]) => {
    setIsHealing(true);
    setError(null);

    try {
      const result = await checkoutLinkSelfHealingEngine.autoHealAll(checkoutLinks);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to auto heal';
      setError(errorMessage);
      return {
        linksHealed: 0,
        linksWithRemainingIssues: 0,
      };
    } finally {
      setIsHealing(false);
    }
  }, []);

  const getHealthSummary = useCallback((checkoutLinks: CheckoutLink[]) => {
    return checkoutLinkSelfHealingEngine.getHealthSummary(checkoutLinks);
  }, []);

  const markProductAsDeleted = useCallback((productId: string) => {
    checkoutLinkSelfHealingEngine.markProductAsDeleted(productId);
  }, []);

  const markPricingAsInvalid = useCallback((pricingId: string) => {
    checkoutLinkSelfHealingEngine.markPricingAsInvalid(pricingId);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isHealing,
    error,
    healCheckoutLink,
    autoHealAll,
    getHealthSummary,
    markProductAsDeleted,
    markPricingAsInvalid,
    clearError,
  };
}
