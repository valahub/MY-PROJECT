// Trending/Hot/New Flag Logic
// Dynamic tags based on sales, rating, and recency

import { ITEMS } from '../marketplace-data';

export type ProductFlag = 'trending' | 'hot' | 'new' | null;

export interface ProductFlagInfo {
  productId: string;
  flag: ProductFlag;
  reason: string;
  score: number;
}

// Flag cache
const productFlags = new Map<string, ProductFlagInfo>();

// Thresholds for flag determination
const THRESHOLDS = {
  trending: {
    minSales: 50,
    minRating: 4.0,
  },
  hot: {
    minSales: 100,
    minRating: 4.5,
  },
  new: {
    daysSinceCreation: 30,
  },
};

// Determine flag for a product
export function determineProductFlag(productId: string): ProductFlagInfo {
  const product = ITEMS.find((item) => item.id === productId);
  
  if (!product) {
    return {
      productId,
      flag: null,
      reason: 'Product not found',
      score: 0,
    };
  }

  const sales = product.reviews || 0;
  const rating = product.rating;
  let flag: ProductFlag = null;
  let reason = '';
  let score = 0;

  // Check for Hot (highest priority)
  if (sales >= THRESHOLDS.hot.minSales && rating >= THRESHOLDS.hot.minRating) {
    flag = 'hot';
    reason = `High sales (${sales}) and excellent rating (${rating})`;
    score = sales * rating;
  }
  // Check for Trending
  else if (sales >= THRESHOLDS.trending.minSales && rating >= THRESHOLDS.trending.minRating) {
    flag = 'trending';
    reason = `Good sales (${sales}) and solid rating (${rating})`;
    score = sales * rating;
  }
  // Check for New (using ID as proxy for recency - in production use creation date)
  else {
    const isNew = isNewProduct(productId);
    if (isNew) {
      flag = 'new';
      reason = 'Recently added product';
      score = 50;
    }
  }

  const flagInfo: ProductFlagInfo = {
    productId,
    flag,
    reason,
    score,
  };

  productFlags.set(productId, flagInfo);
  return flagInfo;
}

// Check if product is new (simplified - in production use actual creation date)
function isNewProduct(productId: string): boolean {
  // In production, compare creation date with threshold
  // For now, assume products with higher IDs are newer
  const maxId = Math.max(...ITEMS.map((item) => parseInt(item.id) || 0));
  const currentId = parseInt(productId) || 0;
  
  // Consider products in the top 20% of IDs as "new"
  return currentId > maxId * 0.8;
}

// Get flag for a product
export function getProductFlag(productId: string): ProductFlag {
  const flagInfo = productFlags.get(productId);
  if (!flagInfo) {
    const info = determineProductFlag(productId);
    return info.flag;
  }
  return flagInfo.flag;
}

// Get all products with a specific flag
export function getProductsWithFlag(flag: ProductFlag): Array<{
  product: typeof ITEMS[0];
  flagInfo: ProductFlagInfo;
}> {
  const results: Array<{
    product: typeof ITEMS[0];
    flagInfo: ProductFlagInfo;
  }> = [];

  ITEMS.forEach((product) => {
    const flagInfo = determineProductFlag(product.id);
    if (flagInfo.flag === flag) {
      results.push({
        product,
        flagInfo,
      });
    }
  });

  // Sort by score descending
  results.sort((a, b) => b.flagInfo.score - a.flagInfo.score);

  return results;
}

// Get trending products
export function getTrendingProducts(limit: number = 10): typeof ITEMS {
  const trending = getProductsWithFlag('trending');
  return trending.slice(0, limit).map((item) => item.product);
}

// Get hot products
export function getHotProducts(limit: number = 10): typeof ITEMS {
  const hot = getProductsWithFlag('hot');
  return hot.slice(0, limit).map((item) => item.product);
}

// Get new products
export function getNewProducts(limit: number = 10): typeof ITEMS {
  const newProducts = getProductsWithFlag('new');
  return newProducts.slice(0, limit).map((item) => item.product);
}

// Update flag thresholds
export function updateThresholds(newThresholds: Partial<typeof THRESHOLDS>): void {
  Object.assign(THRESHOLDS, newThresholds);
  
  // Recalculate all flags
  productFlags.clear();
  ITEMS.forEach((item) => {
    determineProductFlag(item.id);
  });
}

// Recalculate all flags
export function recalculateAllFlags(): Map<string, ProductFlagInfo> {
  productFlags.clear();
  
  ITEMS.forEach((item) => {
    determineProductFlag(item.id);
  });

  return productFlags;
}

// Get flag statistics
export function getFlagStatistics(): {
  totalProducts: number;
  trending: number;
  hot: number;
  new: number;
  unflagged: number;
} {
  const flags = Array.from(productFlags.values());
  
  return {
    totalProducts: ITEMS.length,
    trending: flags.filter((f) => f.flag === 'trending').length,
    hot: flags.filter((f) => f.flag === 'hot').length,
    new: flags.filter((f) => f.flag === 'new').length,
    unflagged: flags.filter((f) => f.flag === null).length,
  };
}

// Get flag HTML badge
export function getFlagBadgeHTML(productId: string): string {
  const flag = getProductFlag(productId);
  
  if (!flag) return '';

  const styles: Record<ProductFlag, string> = {
    trending: 'background: #4ecdc4; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;',
    hot: 'background: #ff6b6b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;',
    new: 'background: #45b7d1; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;',
  };

  return `<span style="${styles[flag]}">${flag.toUpperCase()}</span>`;
}

// Export flag data
export function exportFlagData(): string {
  return JSON.stringify(Array.from(productFlags.entries()), null, 2);
}

// Import flag data
export function importFlagData(json: string): void {
  const data = JSON.parse(json) as Array<[string, ProductFlagInfo]>;
  data.forEach(([productId, flagInfo]) => {
    productFlags.set(productId, flagInfo);
  });
}

// Clear all flags
export function clearAllFlags(): void {
  productFlags.clear();
}

// Schedule periodic flag recalculation
export function scheduleFlagRecalculation(intervalHours: number = 24): number {
  return setInterval(() => {
    recalculateAllFlags();
  }, intervalHours * 60 * 60 * 1000) as unknown as number;
}
