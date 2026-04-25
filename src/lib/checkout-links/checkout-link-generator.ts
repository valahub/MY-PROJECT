// Checkout Link Public Link Generation
// generateCheckoutLink, unique slug generation

import type { CheckoutLink, CreateCheckoutLinkRequest } from './checkout-link-types';

// ============================================
// LINK GENERATION RESULT
// ============================================

export interface LinkGenerationResult {
  success: boolean;
  checkoutLink: CheckoutLink | null;
  publicUrl: string | null;
  error?: string;
  timestamp: string;
}

// ============================================
// CHECKOUT LINK GENERATOR
// ============================================

export class CheckoutLinkGenerator {
  private checkoutLinks: Map<string, CheckoutLink> = new Map();
  private slugSet: Set<string> = new Set();
  private baseUrl: string = 'https://yourdomain.com/c';

  // ============================================
  // GENERATE UNIQUE SLUG
  // ============================================

  generateUniqueSlug(customSlug?: string): string {
    if (customSlug) {
      // Check if custom slug is available
      if (!this.slugSet.has(customSlug)) {
        return customSlug;
      }
      // If custom slug is taken, append random suffix
      return `${customSlug}-${this.generateRandomSuffix()}`;
    }

    // Generate random slug
    return this.generateRandomSlug();
  }

  // ============================================
  // GENERATE RANDOM SLUG
  // ============================================

  private generateRandomSlug(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let slug = '';
    for (let i = 0; i < 8; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return slug;
  }

  // ============================================
  // GENERATE RANDOM SUFFIX
  // ============================================

  private generateRandomSuffix(): string {
    return Math.random().toString(36).substring(2, 6);
  }

  // ============================================
  // GENERATE CHECKOUT LINK
  // ============================================

  generateCheckoutLink(request: CreateCheckoutLinkRequest): LinkGenerationResult {
    try {
      // Generate unique slug
      const slug = this.generateUniqueSlug(request.slug);

      // Create checkout link
      const checkoutLink: CheckoutLink = {
        id: `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: request.name,
        productId: request.productId,
        pricingId: request.pricingId,
        slug,
        status: 'active',
        viewCount: 0,
        conversionCount: 0,
        successUrl: request.successUrl,
        cancelUrl: request.cancelUrl,
        expiresAt: request.expiresAt || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId: request.tenantId,
        metadata: request.metadata || {},
      };

      // Register slug
      this.slugSet.add(slug);
      this.checkoutLinks.set(checkoutLink.id, checkoutLink);

      // Generate public URL
      const publicUrl = `${this.baseUrl}/${slug}`;

      console.log(`[CheckoutLinkGenerator] Generated checkout link: ${publicUrl}`);

      return {
        success: true,
        checkoutLink,
        publicUrl,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        checkoutLink: null,
        publicUrl: null,
        error: error instanceof Error ? error.message : 'Failed to generate checkout link',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // REGENERATE SLUG
  // ============================================

  regenerateSlug(checkoutLinkId: string): LinkGenerationResult {
    const checkoutLink = this.checkoutLinks.get(checkoutLinkId);

    if (!checkoutLink) {
      return {
        success: false,
        checkoutLink: null,
        publicUrl: null,
        error: 'Checkout link not found',
        timestamp: new Date().toISOString(),
      };
    }

    // Remove old slug
    this.slugSet.delete(checkoutLink.slug);

    // Generate new slug
    const newSlug = this.generateUniqueSlug();

    // Update checkout link
    checkoutLink.slug = newSlug;
    checkoutLink.updatedAt = new Date().toISOString();

    // Register new slug
    this.slugSet.add(newSlug);

    // Generate new public URL
    const publicUrl = `${this.baseUrl}/${newSlug}`;

    console.log(`[CheckoutLinkGenerator] Regenerated slug for checkout link ${checkoutLinkId}: ${newSlug}`);

    return {
      success: true,
      checkoutLink,
      publicUrl,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // GET PUBLIC URL
  // ============================================

  getPublicUrl(slug: string): string {
    return `${this.baseUrl}/${slug}`;
  }

  // ============================================
  // GET CHECKOUT LINK BY SLUG
  // ============================================

  getCheckoutLinkBySlug(slug: string): CheckoutLink | null {
    for (const checkoutLink of this.checkoutLinks.values()) {
      if (checkoutLink.slug === slug) {
        return checkoutLink;
      }
    }
    return null;
  }

  // ============================================
  // CHECK SLUG AVAILABILITY
  // ============================================

  isSlugAvailable(slug: string): boolean {
    return !this.slugSet.has(slug);
  }

  // ============================================
  // SET BASE URL
  // ============================================

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  // ============================================
  // GET BASE URL
  // ============================================

  getBaseUrl(): string {
    return this.baseUrl;
  }

  // ============================================
  // REGISTER CHECKOUT LINK
  // ============================================

  registerCheckoutLink(checkoutLink: CheckoutLink): void {
    this.checkoutLinks.set(checkoutLink.id, checkoutLink);
    this.slugSet.add(checkoutLink.slug);
  }

  // ============================================
  // UNREGISTER CHECKOUT LINK
  // ============================================

  unregisterCheckoutLink(checkoutLinkId: string): void {
    const checkoutLink = this.checkoutLinks.get(checkoutLinkId);
    if (checkoutLink) {
      this.slugSet.delete(checkoutLink.slug);
      this.checkoutLinks.delete(checkoutLinkId);
    }
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
export const checkoutLinkGenerator = new CheckoutLinkGenerator();

// ============================================
// REACT HOOK FOR CHECKOUT LINK GENERATION
// ============================================

import { useState, useCallback } from 'react';

export function useCheckoutLinkGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCheckoutLink = useCallback((request: CreateCheckoutLinkRequest) => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = checkoutLinkGenerator.generateCheckoutLink(request);
      if (!result.success) {
        setError(result.error || 'Failed to generate checkout link');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate checkout link';
      setError(errorMessage);
      return {
        success: false,
        checkoutLink: null,
        publicUrl: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const regenerateSlug = useCallback((checkoutLinkId: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = checkoutLinkGenerator.regenerateSlug(checkoutLinkId);
      if (!result.success) {
        setError(result.error || 'Failed to regenerate slug');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate slug';
      setError(errorMessage);
      return {
        success: false,
        checkoutLink: null,
        publicUrl: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const getPublicUrl = useCallback((slug: string) => {
    return checkoutLinkGenerator.getPublicUrl(slug);
  }, []);

  const isSlugAvailable = useCallback((slug: string) => {
    return checkoutLinkGenerator.isSlugAvailable(slug);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isGenerating,
    error,
    generateCheckoutLink,
    regenerateSlug,
    getPublicUrl,
    isSlugAvailable,
    clearError,
  };
}
