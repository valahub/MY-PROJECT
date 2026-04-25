// Analytics Tracking System
// Track product clicks, filter usage, conversion, search usage

export interface AnalyticsEvent {
  eventType: 'product_click' | 'filter_usage' | 'conversion' | 'search_usage' | 'page_view' | 'add_to_cart' | 'wishlist_toggle';
  userId?: string;
  productId?: string;
  category?: string;
  filter?: string;
  searchQuery?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsStats {
  totalEvents: number;
  productClicks: number;
  filterUsage: number;
  conversions: number;
  searchUsage: number;
  pageViews: number;
  addToCart: number;
  wishlistToggles: number;
}

// Event storage (in production, use analytics service)
const eventStore = new Map<string, AnalyticsEvent[]>();

// Track event
export function trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): void {
  const fullEvent: AnalyticsEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  const userId = event.userId || 'anonymous';
  const userEvents = eventStore.get(userId) || [];
  userEvents.push(fullEvent);
  eventStore.set(userId, userEvents);

  // In production, send to analytics service
  console.log('Analytics Event:', fullEvent);
}

// Track product click
export function trackProductClick(userId: string, productId: string, category: string): void {
  trackEvent({
    eventType: 'product_click',
    userId,
    productId,
    category,
  });
}

// Track filter usage
export function trackFilterUsage(userId: string, filter: string, value: string): void {
  trackEvent({
    eventType: 'filter_usage',
    userId,
    filter,
    metadata: { value },
  });
}

// Track conversion
export function trackConversion(userId: string, productId: string, value: number): void {
  trackEvent({
    eventType: 'conversion',
    userId,
    productId,
    metadata: { value },
  });
}

// Track search usage
export function trackSearchUsage(userId: string, searchQuery: string, resultsCount: number): void {
  trackEvent({
    eventType: 'search_usage',
    userId,
    searchQuery,
    metadata: { resultsCount },
  });
}

// Track page view
export function trackPageView(userId: string, page: string, category?: string): void {
  trackEvent({
    eventType: 'page_view',
    userId,
    category,
    metadata: { page },
  });
}

// Track add to cart
export function trackAddToCart(userId: string, productId: string, quantity: number): void {
  trackEvent({
    eventType: 'add_to_cart',
    userId,
    productId,
    metadata: { quantity },
  });
}

// Track wishlist toggle
export function trackWishlistToggle(userId: string, productId: string, action: 'add' | 'remove'): void {
  trackEvent({
    eventType: 'wishlist_toggle',
    userId,
    productId,
    metadata: { action },
  });
}

// Get user events
export function getUserEvents(userId: string): AnalyticsEvent[] {
  return eventStore.get(userId) || [];
}

// Get all events
export function getAllEvents(): AnalyticsEvent[] {
  const allEvents: AnalyticsEvent[] = [];
  eventStore.forEach((events) => {
    allEvents.push(...events);
  });
  return allEvents;
}

// Get analytics statistics
export function getAnalyticsStats(): AnalyticsStats {
  const allEvents = getAllEvents();

  return {
    totalEvents: allEvents.length,
    productClicks: allEvents.filter((e) => e.eventType === 'product_click').length,
    filterUsage: allEvents.filter((e) => e.eventType === 'filter_usage').length,
    conversions: allEvents.filter((e) => e.eventType === 'conversion').length,
    searchUsage: allEvents.filter((e) => e.eventType === 'search_usage').length,
    pageViews: allEvents.filter((e) => e.eventType === 'page_view').length,
    addToCart: allEvents.filter((e) => e.eventType === 'add_to_cart').length,
    wishlistToggles: allEvents.filter((e) => e.eventType === 'wishlist_toggle').length,
  };
}

// Get events by type
export function getEventsByType(eventType: AnalyticsEvent['eventType']): AnalyticsEvent[] {
  const allEvents = getAllEvents();
  return allEvents.filter((e) => e.eventType === eventType);
}

// Get events by product
export function getEventsByProduct(productId: string): AnalyticsEvent[] {
  const allEvents = getAllEvents();
  return allEvents.filter((e) => e.productId === productId);
}

// Get events by category
export function getEventsByCategory(category: string): AnalyticsEvent[] {
  const allEvents = getAllEvents();
  return allEvents.filter((e) => e.category === category);
}

// Get conversion rate
export function getConversionRate(): number {
  const stats = getAnalyticsStats();
  const totalInteractions = stats.productClicks + stats.addToCart + stats.searchUsage;
  
  if (totalInteractions === 0) return 0;
  return (stats.conversions / totalInteractions) * 100;
}

// Get top products by clicks
export function getTopProductsByClicks(limit: number = 10): Array<{
  productId: string;
  clicks: number;
}> {
  const productClicks = new Map<string, number>();

  getEventsByType('product_click').forEach((event) => {
    if (event.productId) {
      productClicks.set(
        event.productId,
        (productClicks.get(event.productId) || 0) + 1
      );
    }
  });

  return Array.from(productClicks.entries())
    .map(([productId, clicks]) => ({ productId, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}

// Get top search terms
export function getTopSearchTerms(limit: number = 10): Array<{
  term: string;
  count: number;
}> {
  const searchCounts = new Map<string, number>();

  getEventsByType('search_usage').forEach((event) => {
    if (event.searchQuery) {
      searchCounts.set(
        event.searchQuery,
        (searchCounts.get(event.searchQuery) || 0) + 1
      );
    }
  });

  return Array.from(searchCounts.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Get filter usage statistics
export function getFilterUsageStats(): Record<string, number> {
  const filterCounts: Record<string, number> = {};

  getEventsByType('filter_usage').forEach((event) => {
    if (event.filter) {
      filterCounts[event.filter] = (filterCounts[event.filter] || 0) + 1;
    }
  });

  return filterCounts;
}

// Clear events for user
export function clearUserEvents(userId: string): void {
  eventStore.delete(userId);
}

// Clear all events
export function clearAllEvents(): void {
  eventStore.clear();
}

// Export analytics data
export function exportAnalyticsData(): string {
  return JSON.stringify(Array.from(eventStore.entries()), null, 2);
}

// Import analytics data
export function importAnalyticsData(json: string): void {
  const data = JSON.parse(json) as Array<[string, AnalyticsEvent[]]>;
  data.forEach(([userId, events]) => {
    eventStore.set(userId, events);
  });
}

// Get daily statistics
export function getDailyStats(days: number = 7): Array<{
  date: string;
  events: number;
}> {
  const stats: Array<{ date: string; events: number }> = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const eventsOnDay = getAllEvents().filter((event) => {
      const eventDate = new Date(event.timestamp).toISOString().split('T')[0];
      return eventDate === dateStr;
    });

    stats.push({
      date: dateStr,
      events: eventsOnDay.length,
    });
  }

  return stats.reverse();
}
