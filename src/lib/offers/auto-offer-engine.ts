// Auto Offer Engine
// Automatically applies discounts based on sales performance and demand

export interface ProductOffer {
  productId: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  type: 'low_sales_boost' | 'high_demand_premium' | 'seasonal' | 'clearance';
  message: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface ProductMetrics {
  productId: string;
  sales: number;
  views: number;
  conversionRate: number;
  lastUpdated: string;
}

// In-memory storage (in production, use database)
const offersStore = new Map<string, ProductOffer>();
const metricsStore = new Map<string, ProductMetrics>();

// Thresholds for auto-offer logic
const LOW_SALES_THRESHOLD = 10; // Sales in last 30 days
const HIGH_DEMAND_THRESHOLD = 100; // Sales in last 30 days
const LOW_CONVERSION_RATE = 0.02; // 2%
const HIGH_CONVERSION_RATE = 0.15; // 15%

export function updateProductMetrics(
  productId: string,
  sales: number,
  views: number
): ProductMetrics {
  const conversionRate = views > 0 ? sales / views : 0;
  const metrics: ProductMetrics = {
    productId,
    sales,
    views,
    conversionRate,
    lastUpdated: new Date().toISOString(),
  };

  metricsStore.set(productId, metrics);
  return metrics;
}

export function getProductMetrics(productId: string): ProductMetrics | undefined {
  return metricsStore.get(productId);
}

export function shouldApplyLowSalesBoost(metrics: ProductMetrics): boolean {
  return (
    metrics.sales < LOW_SALES_THRESHOLD &&
    metrics.conversionRate < LOW_CONVERSION_RATE
  );
}

export function shouldApplyHighDemandPremium(metrics: ProductMetrics): boolean {
  return (
    metrics.sales > HIGH_DEMAND_THRESHOLD &&
    metrics.conversionRate > HIGH_CONVERSION_RATE
  );
}

export function calculateLowSalesDiscount(originalPrice: number): number {
  // Discount between 10-30% based on price
  if (originalPrice < 20) return 10;
  if (originalPrice < 50) return 15;
  if (originalPrice < 100) return 20;
  return 30;
}

export function calculateHighDemandPremium(originalPrice: number): number {
  // Remove discount or add small premium for high demand
  return 0; // No discount, full price
}

export function createAutoOffer(
  productId: string,
  originalPrice: number,
  type: ProductOffer['type']
): ProductOffer {
  let discount = 0;
  let message = '';

  switch (type) {
    case 'low_sales_boost':
      discount = calculateLowSalesDiscount(originalPrice);
      message = `Limited time: ${discount}% off!`;
      break;
    case 'high_demand_premium':
      discount = calculateHighDemandPremium(originalPrice);
      message = 'Best seller - Buy now!';
      break;
    case 'seasonal':
      discount = 15;
      message = 'Seasonal special offer!';
      break;
    case 'clearance':
      discount = 40;
      message = 'Clearance sale - Last chance!';
      break;
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7); // 7 days

  const offer: ProductOffer = {
    productId,
    originalPrice,
    discountedPrice: originalPrice * (1 - discount / 100),
    discount,
    type,
    message,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    active: true,
  };

  offersStore.set(`${productId}-${type}`, offer);
  return offer;
}

export function evaluateAndApplyAutoOffer(
  productId: string,
  originalPrice: number
): ProductOffer | null {
  const metrics = getProductMetrics(productId);
  if (!metrics) return null;

  // Remove existing offers
  removeOffersForProduct(productId);

  if (shouldApplyLowSalesBoost(metrics)) {
    return createAutoOffer(productId, originalPrice, 'low_sales_boost');
  }

  if (shouldApplyHighDemandPremium(metrics)) {
    return createAutoOffer(productId, originalPrice, 'high_demand_premium');
  }

  return null;
}

export function getActiveOffer(productId: string): ProductOffer | undefined {
  const now = new Date();
  const offers = Array.from(offersStore.values()).filter(
    (o) => o.productId === productId && o.active
  );

  for (const offer of offers) {
    const startDate = new Date(offer.startDate);
    const endDate = new Date(offer.endDate);

    if (now >= startDate && now <= endDate) {
      return offer;
    }

    // Deactivate expired offers
    if (now > endDate) {
      offer.active = false;
      offersStore.set(`${offer.productId}-${offer.type}`, offer);
    }
  }

  return undefined;
}

export function removeOffersForProduct(productId: string): void {
  const keys = Array.from(offersStore.keys()).filter((k) => k.startsWith(productId));
  keys.forEach((key) => offersStore.delete(key));
}

export function deactivateOffer(offerId: string): boolean {
  const offer = offersStore.get(offerId);
  if (!offer) return false;

  offer.active = false;
  offersStore.set(offerId, offer);
  return true;
}

export function applySeasonalOffer(
  productId: string,
  originalPrice: number,
  discount: number = 15,
  days: number = 7
): ProductOffer {
  removeOffersForProduct(productId);
  return createAutoOffer(productId, originalPrice, 'seasonal');
}

export function applyClearanceOffer(
  productId: string,
  originalPrice: number,
  discount: number = 40,
  days: number = 3
): ProductOffer {
  removeOffersForProduct(productId);
  return createAutoOffer(productId, originalPrice, 'clearance');
}

export function getAllActiveOffers(): ProductOffer[] {
  const now = new Date();
  return Array.from(offersStore.values()).filter((offer) => {
    if (!offer.active) return false;
    const startDate = new Date(offer.startDate);
    const endDate = new Date(offer.endDate);
    return now >= startDate && now <= endDate;
  });
}

export function getOffersByType(type: ProductOffer['type']): ProductOffer[] {
  return Array.from(offersStore.values()).filter((o) => o.type === type && o.active);
}

export function getOfferStats(): {
  totalOffers: number;
  activeOffers: number;
  lowSalesBoosts: number;
  highDemandPremiums: number;
  seasonalOffers: number;
  clearanceOffers: number;
} {
  const offers = Array.from(offersStore.values());
  const activeOffers = getAllActiveOffers();

  return {
    totalOffers: offers.length,
    activeOffers: activeOffers.length,
    lowSalesBoosts: getOffersByType('low_sales_boost').length,
    highDemandPremiums: getOffersByType('high_demand_premium').length,
    seasonalOffers: getOffersByType('seasonal').length,
    clearanceOffers: getOffersByType('clearance').length,
  };
}

// Batch evaluation for multiple products
export function batchEvaluateOffers(
  products: Array<{ id: string; price: number }>
): Array<{ productId: string; offer?: ProductOffer }> {
  return products.map((product) => ({
    productId: product.id,
    offer: evaluateAndApplyAutoOffer(product.id, product.price),
  }));
}

// Check if offer is still valid
export function isOfferValid(offer: ProductOffer): boolean {
  if (!offer.active) return false;

  const now = new Date();
  const startDate = new Date(offer.startDate);
  const endDate = new Date(offer.endDate);

  return now >= startDate && now <= endDate;
}

// Get time remaining for offer
export function getOfferTimeRemaining(offer: ProductOffer): {
  days: number;
  hours: number;
  expired: boolean;
} {
  const now = new Date();
  const endDate = new Date(offer.endDate);
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return { days, hours, expired: false };
}
