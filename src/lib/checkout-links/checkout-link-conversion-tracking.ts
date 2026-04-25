// Checkout Link Conversion Tracking
// view_count, conversion_count, conversion_rate

import type { CheckoutLink, CheckoutLinkAnalytics } from './checkout-link-types';

// ============================================
// CONVERSION EVENT
// ============================================

export interface ConversionEvent {
  type: 'view' | 'conversion';
  checkoutLinkId: string;
  slug: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// CONVERSION TRACKING ENGINE
// ============================================

export class ConversionTrackingEngine {
  private checkoutLinks: Map<string, CheckoutLink> = new Map();
  private conversionEvents: ConversionEvent[] = [];

  // ============================================
  // TRACK VIEW
  // ============================================

  trackView(checkoutLinkId: string, metadata?: Record<string, unknown>): CheckoutLink | null {
    const checkoutLink = this.checkoutLinks.get(checkoutLinkId);

    if (!checkoutLink) {
      console.log(`[ConversionTracking] Checkout link ${checkoutLinkId} not found`);
      return null;
    }

    // Increment view count
    checkoutLink.viewCount++;
    checkoutLink.updatedAt = new Date().toISOString();

    // Log conversion event
    const event: ConversionEvent = {
      type: 'view',
      checkoutLinkId,
      slug: checkoutLink.slug,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.conversionEvents.push(event);

    console.log(`[ConversionTracking] Tracked view for checkout link ${checkoutLinkId}`);

    return checkoutLink;
  }

  // ============================================
  // TRACK CONVERSION
  // ============================================

  trackConversion(checkoutLinkId: string, metadata?: Record<string, unknown>): CheckoutLink | null {
    const checkoutLink = this.checkoutLinks.get(checkoutLinkId);

    if (!checkoutLink) {
      console.log(`[ConversionTracking] Checkout link ${checkoutLinkId} not found`);
      return null;
    }

    // Increment conversion count
    checkoutLink.conversionCount++;
    checkoutLink.updatedAt = new Date().toISOString();

    // Log conversion event
    const event: ConversionEvent = {
      type: 'conversion',
      checkoutLinkId,
      slug: checkoutLink.slug,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.conversionEvents.push(event);

    console.log(`[ConversionTracking] Tracked conversion for checkout link ${checkoutLinkId}`);

    return checkoutLink;
  }

  // ============================================
  // GET CONVERSION RATE
  // ============================================

  getConversionRate(checkoutLinkId: string): number {
    const checkoutLink = this.checkoutLinks.get(checkoutLinkId);

    if (!checkoutLink || checkoutLink.viewCount === 0) {
      return 0;
    }

    return (checkoutLink.conversionCount / checkoutLink.viewCount) * 100;
  }

  // ============================================
  // GET CONVERSION EVENTS
  // ============================================

  getConversionEvents(checkoutLinkId: string, limit?: number): ConversionEvent[] {
    const events = this.conversionEvents
      .filter((event) => event.checkoutLinkId === checkoutLinkId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (limit) {
      return events.slice(0, limit);
    }

    return events;
  }

  // ============================================
  // GET VIEW EVENTS
  // ============================================

  getViewEvents(checkoutLinkId: string, limit?: number): ConversionEvent[] {
    const events = this.conversionEvents
      .filter((event) => event.checkoutLinkId === checkoutLinkId && event.type === 'view')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (limit) {
      return events.slice(0, limit);
    }

    return events;
  }

  // ============================================
  // CALCULATE ANALYTICS
  // ============================================

  calculateAnalytics(checkoutLinks: CheckoutLink[]): CheckoutLinkAnalytics {
    const totalLinks = checkoutLinks.length;
    const activeLinks = checkoutLinks.filter((l) => l.status === 'active').length;
    const inactiveLinks = checkoutLinks.filter((l) => l.status === 'inactive').length;
    const expiredLinks = checkoutLinks.filter((l) => l.status === 'expired').length;

    const totalViews = checkoutLinks.reduce((sum, l) => sum + l.viewCount, 0);
    const totalConversions = checkoutLinks.reduce((sum, l) => sum + l.conversionCount, 0);

    const averageConversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

    // Find best performing link
    let bestPerformingLink: CheckoutLink | null = null;
    let bestConversionRate = 0;

    for (const checkoutLink of checkoutLinks) {
      const conversionRate = this.getConversionRate(checkoutLink.id);
      if (conversionRate > bestConversionRate) {
        bestConversionRate = conversionRate;
        bestPerformingLink = checkoutLink;
      }
    }

    return {
      totalLinks,
      activeLinks,
      inactiveLinks,
      expiredLinks,
      totalViews,
      totalConversions,
      averageConversionRate,
      bestPerformingLink,
    };
  }

  // ============================================
  // GET TOP PERFORMING LINKS
  // ============================================

  getTopPerformingLinks(checkoutLinks: CheckoutLink[], limit: number = 5): CheckoutLink[] {
    return checkoutLinks
      .map((link) => ({
        link,
        conversionRate: this.getConversionRate(link.id),
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, limit)
      .map((item) => item.link);
  }

  // ============================================
  // GET CONVERSION TREND
  // ============================================

  getConversionTrend(checkoutLinkId: string, days: number = 30): {
    date: string;
    views: number;
    conversions: number;
  }[] {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const trend: { date: string; views: number; conversions: number }[] = [];

    // Initialize trend with zeros
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      trend.push({ date: dateStr, views: 0, conversions: 0 });
    }

    // Fill in actual data from events
    for (const event of this.conversionEvents) {
      if (event.checkoutLinkId === checkoutLinkId) {
        const eventDate = new Date(event.timestamp);
        const dateStr = eventDate.toISOString().split('T')[0];
        const trendEntry = trend.find((t) => t.date === dateStr);

        if (trendEntry) {
          if (event.type === 'view') {
            trendEntry.views++;
          } else if (event.type === 'conversion') {
            trendEntry.conversions++;
          }
        }
      }
    }

    return trend;
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

  // ============================================
  // CLEAR CONVERSION EVENTS
  // ============================================

  clearConversionEvents(checkoutLinkId?: string): void {
    if (checkoutLinkId) {
      this.conversionEvents = this.conversionEvents.filter((e) => e.checkoutLinkId !== checkoutLinkId);
    } else {
      this.conversionEvents = [];
    }
  }
}

// Export singleton instance
export const conversionTrackingEngine = new ConversionTrackingEngine();

// ============================================
// REACT HOOK FOR CONVERSION TRACKING
// ============================================

import { useCallback } from 'react';

export function useConversionTracking() {
  const trackView = useCallback((checkoutLinkId: string, metadata?: Record<string, unknown>) => {
    return conversionTrackingEngine.trackView(checkoutLinkId, metadata);
  }, []);

  const trackConversion = useCallback((checkoutLinkId: string, metadata?: Record<string, unknown>) => {
    return conversionTrackingEngine.trackConversion(checkoutLinkId, metadata);
  }, []);

  const getConversionRate = useCallback((checkoutLinkId: string) => {
    return conversionTrackingEngine.getConversionRate(checkoutLinkId);
  }, []);

  const getConversionEvents = useCallback((checkoutLinkId: string, limit?: number) => {
    return conversionTrackingEngine.getConversionEvents(checkoutLinkId, limit);
  }, []);

  const calculateAnalytics = useCallback((checkoutLinks: CheckoutLink[]) => {
    return conversionTrackingEngine.calculateAnalytics(checkoutLinks);
  }, []);

  const getTopPerformingLinks = useCallback((checkoutLinks: CheckoutLink[], limit?: number) => {
    return conversionTrackingEngine.getTopPerformingLinks(checkoutLinks, limit);
  }, []);

  const getConversionTrend = useCallback((checkoutLinkId: string, days?: number) => {
    return conversionTrackingEngine.getConversionTrend(checkoutLinkId, days);
  }, []);

  return {
    trackView,
    trackConversion,
    getConversionRate,
    getConversionEvents,
    calculateAnalytics,
    getTopPerformingLinks,
    getConversionTrend,
  };
}
