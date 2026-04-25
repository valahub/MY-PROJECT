// Product Promotion Boost Logic
// Ranks products based on sales, rating, clicks for "Top selling" and "Trending"

import { ITEMS } from '../marketplace-data';

export interface ProductScore {
  productId: string;
  salesScore: number;
  ratingScore: number;
  clickScore: number;
  totalScore: number;
  rank: number;
  badge: 'top-selling' | 'trending' | 'popular' | 'new' | null;
}

export interface PromotionConfig {
  salesWeight: number;
  ratingWeight: number;
  clickWeight: number;
  trendingThreshold: number;
  topSellingThreshold: number;
}

// Score cache
const productScores = new Map<string, ProductScore>();

// Default configuration
const DEFAULT_CONFIG: PromotionConfig = {
  salesWeight: 0.4,
  ratingWeight: 0.3,
  clickWeight: 0.3,
  trendingThreshold: 70,
  topSellingThreshold: 80,
};

// Calculate sales score (0-100)
function calculateSalesScore(sales: number, maxSales: number): number {
  if (maxSales === 0) return 0;
  return (sales / maxSales) * 100;
}

// Calculate rating score (0-100)
function calculateRatingScore(rating: number): number {
  return rating * 20; // 5 stars = 100 points
}

// Calculate click score (0-100)
function calculateClickScore(clicks: number, maxClicks: number): number {
  if (maxClicks === 0) return 0;
  return (clicks / maxClicks) * 100;
}

// Calculate total product score
export function calculateProductScore(
  productId: string,
  config: PromotionConfig = DEFAULT_CONFIG
): ProductScore {
  const product = ITEMS.find((item) => item.id === productId);
  if (!product) {
    return {
      productId,
      salesScore: 0,
      ratingScore: 0,
      clickScore: 0,
      totalScore: 0,
      rank: 0,
      badge: null,
    };
  }

  const sales = product.reviews || 0;
  const rating = product.rating;
  const clicks = product.reviews || 0; // Using reviews as click proxy

  const maxSales = Math.max(...ITEMS.map((i) => i.reviews || 0));
  const maxClicks = maxSales;

  const salesScore = calculateSalesScore(sales, maxSales);
  const ratingScore = calculateRatingScore(rating);
  const clickScore = calculateClickScore(clicks, maxClicks);

  const totalScore =
    salesScore * config.salesWeight +
    ratingScore * config.ratingWeight +
    clickScore * config.clickWeight;

  // Determine badge
  let badge: ProductScore['badge'] = null;
  if (totalScore >= config.topSellingThreshold) {
    badge = 'top-selling';
  } else if (totalScore >= config.trendingThreshold) {
    badge = 'trending';
  } else if (totalScore >= 50) {
    badge = 'popular';
  }

  return {
    productId,
    salesScore,
    ratingScore,
    clickScore,
    totalScore,
    rank: 0, // Will be calculated after all scores
    badge,
  };
}

// Calculate scores for all products
export function calculateAllProductScores(config: PromotionConfig = DEFAULT_CONFIG): ProductScore[] {
  const scores = ITEMS.map((item) => calculateProductScore(item.id, config));

  // Sort by total score and assign ranks
  scores.sort((a, b) => b.totalScore - a.totalScore);
  scores.forEach((score, index) => {
    score.rank = index + 1;
  });

  return scores;
}

// Get top selling products
export function getTopSellingProducts(limit: number = 10): Array<{
  productId: string;
  title: string;
  score: number;
}> {
  const scores = calculateAllProductScores();
  const topSelling = scores.filter((s) => s.badge === 'top-selling').slice(0, limit);

  return topSelling.map((s) => {
    const product = ITEMS.find((i) => i.id === s.productId);
    return {
      productId: s.productId,
      title: product?.title || 'Unknown',
      score: s.totalScore,
    };
  });
}

// Get trending products
export function getTrendingProducts(limit: number = 10): Array<{
  productId: string;
  title: string;
  score: number;
}> {
  const scores = calculateAllProductScores();
  const trending = scores.filter((s) => s.badge === 'trending').slice(0, limit);

  return trending.map((s) => {
    const product = ITEMS.find((i) => i.id === s.productId);
    return {
      productId: s.productId,
      title: product?.title || 'Unknown',
      score: s.totalScore,
    };
  });
}

// Get popular products
export function getPopularProducts(limit: number = 10): Array<{
  productId: string;
  title: string;
  score: number;
}> {
  const scores = calculateAllProductScores();
  const popular = scores.filter((s) => s.badge === 'popular').slice(0, limit);

  return popular.map((s) => {
    const product = ITEMS.find((i) => i.id === s.productId);
    return {
      productId: s.productId,
      title: product?.title || 'Unknown',
      score: s.totalScore,
    };
  });
}

// Get ranked products by category
export function getRankedProductsByCategory(
  categorySlug: string,
  limit: number = 10
): Array<{
  productId: string;
  title: string;
  rank: number;
  score: number;
}> {
  const categoryProducts = ITEMS.filter((item) => item.category === categorySlug);
  const scores = categoryProducts.map((item) => calculateProductScore(item.id));

  scores.sort((a, b) => b.totalScore - a.totalScore);
  scores.forEach((s, index) => {
    s.rank = index + 1;
  });

  return scores.slice(0, limit).map((s) => {
    const product = ITEMS.find((i) => i.id === s.productId);
    return {
      productId: s.productId,
      title: product?.title || 'Unknown',
      rank: s.rank,
      score: s.totalScore,
    };
  });
}

// Update product click count (for tracking)
export function updateProductClick(productId: string): void {
  const product = ITEMS.find((item) => item.id === productId);
  if (product) {
    // In production, update in database
    // For now, this is a placeholder
  }
}

// Update product sales count
export function updateProductSale(productId: string): void {
  const product = ITEMS.find((item) => item.id === productId);
  if (product) {
    // In production, update in database
    // For now, this is a placeholder
  }
}

// Recalculate scores after data update
export function recalculateScores(config?: PromotionConfig): ProductScore[] {
  const scores = calculateAllProductScores(config);
  
  scores.forEach((score) => {
    productScores.set(score.productId, score);
  });

  return scores;
}

// Get product badge
export function getProductBadge(productId: string): ProductScore['badge'] {
  const score = productScores.get(productId);
  if (!score) {
    const calculated = calculateProductScore(productId);
    productScores.set(productId, calculated);
    return calculated.badge;
  }
  return score.badge;
}

// Get product rank
export function getProductRank(productId: string): number {
  const score = productScores.get(productId);
  if (!score) {
    const calculated = calculateProductScore(productId);
    productScores.set(productId, calculated);
    return calculated.rank;
  }
  return score.rank;
}

// Get promotion statistics
export function getPromotionStats(): {
  totalProducts: number;
  topSelling: number;
  trending: number;
  popular: number;
  averageScore: number;
} {
  const scores = calculateAllProductScores();
  const totalProducts = scores.length;
  const topSelling = scores.filter((s) => s.badge === 'top-selling').length;
  const trending = scores.filter((s) => s.badge === 'trending').length;
  const popular = scores.filter((s) => s.badge === 'popular').length;
  const averageScore = scores.reduce((sum, s) => sum + s.totalScore, 0) / totalProducts;

  return {
    totalProducts,
    topSelling,
    trending,
    popular,
    averageScore,
  };
}

// Generate badge HTML
export function generateBadgeHTML(productId: string): string {
  const badge = getProductBadge(productId);
  
  if (!badge) return '';

  const badgeStyles: Record<string, string> = {
    'top-selling': 'background: #ff6b6b; color: white;',
    'trending': 'background: #4ecdc4; color: white;',
    'popular': 'background: #45b7d1; color: white;',
    'new': 'background: #96ceb4; color: white;',
  };

  const style = badgeStyles[badge] || '';

  return `<span class="product-badge badge-${badge}" style="${style}">${badge.replace('-', ' ').toUpperCase()}</span>`;
}

// Customize promotion weights
export function customizePromotionWeights(config: Partial<PromotionConfig>): PromotionConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
  };
}

// Get score breakdown for a product
export function getProductScoreBreakdown(productId: string): {
  salesScore: number;
  ratingScore: number;
  clickScore: number;
  totalScore: number;
  badge: ProductScore['badge'];
  rank: number;
} | null {
  const score = productScores.get(productId);
  if (!score) {
    const calculated = calculateProductScore(productId);
    productScores.set(productId, calculated);
    return {
      salesScore: calculated.salesScore,
      ratingScore: calculated.ratingScore,
      clickScore: calculated.clickScore,
      totalScore: calculated.totalScore,
      badge: calculated.badge,
      rank: calculated.rank,
    };
  }
  return {
    salesScore: score.salesScore,
    ratingScore: score.ratingScore,
    clickScore: score.clickScore,
    totalScore: score.totalScore,
    badge: score.badge,
    rank: score.rank,
  };
}

// Export scores
export function exportScores(): string {
  return JSON.stringify(Array.from(productScores.values()), null, 2);
}

// Import scores
export function importScores(json: string): void {
  const scores = JSON.parse(json) as ProductScore[];
  scores.forEach((score) => {
    productScores.set(score.productId, score);
  });
}

// Clear scores cache
export function clearScoresCache(): void {
  productScores.clear();
}

// Schedule periodic score recalculation
export function scheduleScoreRecalculation(intervalHours: number = 24, config?: PromotionConfig): number {
  return setInterval(() => {
    recalculateScores(config);
  }, intervalHours * 60 * 60 * 1000) as unknown as number;
}
