// Recommendation Engine
// Related products based on tags, category, author

import { ITEMS } from '../marketplace-data';

export interface RecommendationScore {
  productId: string;
  score: number;
  reason: string;
}

export interface RecommendationRequest {
  productId: string;
  limit?: number;
  excludeSelf?: boolean;
}

// Calculate relevance score between products
export function calculateRelevanceScore(
  sourceProductId: string,
  targetProductId: string
): RecommendationScore {
  const source = ITEMS.find((item) => item.id === sourceProductId);
  const target = ITEMS.find((item) => item.id === targetProductId);

  if (!source || !target || source.id === target.id) {
    return {
      productId: targetProductId,
      score: 0,
      reason: 'Invalid product',
    };
  }

  let score = 0;
  const reasons: string[] = [];

  // Same category (30 points)
  if (source.category === target.category) {
    score += 30;
    reasons.push('Same category');
  }

  // Same author (25 points)
  if (source.author === target.author) {
    score += 25;
    reasons.push('Same author');
  }

  // Matching tags (15 points per tag)
  const matchingTags = source.tags.filter((tag) =>
    target.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
  score += matchingTags.length * 15;
  if (matchingTags.length > 0) {
    reasons.push(`${matchingTags.length} matching tags`);
  }

  // Similar price range (10 points)
  const priceDiff = Math.abs(source.price - target.price);
  if (priceDiff < source.price * 0.5) {
    score += 10;
    reasons.push('Similar price range');
  }

  // Similar rating (10 points)
  const ratingDiff = Math.abs(source.rating - target.rating);
  if (ratingDiff < 1) {
    score += 10;
    reasons.push('Similar rating');
  }

  return {
    productId: targetProductId,
    score: Math.min(score, 100),
    reason: reasons.join(', ') || 'General recommendation',
  };
}

// Get related products
export function getRelatedProducts(request: RecommendationRequest): typeof ITEMS {
  const source = ITEMS.find((item) => item.id === request.productId);
  if (!source) return [];

  const scores: RecommendationScore[] = [];

  ITEMS.forEach((item) => {
    if (request.excludeSelf && item.id === request.productId) return;

    const score = calculateRelevanceScore(request.productId, item.id);
    if (score.score > 0) {
      scores.push(score);
    }
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Get top products
  const limit = request.limit || 10;
  const topScores = scores.slice(0, limit);

  return topScores
    .map((score) => ITEMS.find((item) => item.id === score.productId))
    .filter((item): item is typeof ITEMS[0] => item !== undefined);
}

// Get products by same category
export function getProductsByCategory(categorySlug: string, limit: number = 10): typeof ITEMS {
  return ITEMS.filter((item) => item.category === categorySlug).slice(0, limit);
}

// Get products by same author
export function getProductsByAuthor(authorName: string, limit: number = 10): typeof ITEMS {
  return ITEMS.filter((item) => item.author === authorName).slice(0, limit);
}

// Get products by tags
export function getProductsByTags(tags: string[], limit: number = 10): typeof ITEMS {
  const scores = ITEMS.map((item) => {
    const matchingTags = tags.filter((tag) =>
      item.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
    );
    return {
      item,
      score: matchingTags.length,
    };
  });

  scores.sort((a, b) => b.score - a.score);

  return scores
    .filter((s) => s.score > 0)
    .slice(0, limit)
    .map((s) => s.item);
}

// Get trending products (high sales)
export function getTrendingProducts(limit: number = 10): typeof ITEMS {
  return [...ITEMS]
    .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
    .slice(0, limit);
}

// Get highly rated products
export function getHighlyRatedProducts(limit: number = 10, minRating: number = 4.5): typeof ITEMS {
  return ITEMS.filter((item) => item.rating >= minRating)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

// Get new products (based on some criteria - using ID as proxy for recency)
export function getNewProducts(limit: number = 10): typeof ITEMS {
  return [...ITEMS].slice(-limit).reverse();
}

// Get personalized recommendations for user
export function getPersonalizedRecommendations(
  userId: string,
  limit: number = 10
): typeof ITEMS {
  // In production, this would use user's purchase history, wishlist, etc.
  // For now, return trending products
  return getTrendingProducts(limit);
}

// Get recommendation with scores
export function getRecommendationsWithScores(request: RecommendationRequest): Array<{
  product: typeof ITEMS[0];
  score: number;
  reason: string;
}> {
  const source = ITEMS.find((item) => item.id === request.productId);
  if (!source) return [];

  const scores: RecommendationScore[] = [];

  ITEMS.forEach((item) => {
    if (request.excludeSelf && item.id === request.productId) return;

    const score = calculateRelevanceScore(request.productId, item.id);
    if (score.score > 0) {
      scores.push(score);
    }
  });

  scores.sort((a, b) => b.score - a.score);

  const limit = request.limit || 10;
  const topScores = scores.slice(0, limit);

  return topScores
    .map((score) => ({
      product: ITEMS.find((item) => item.id === score.productId),
      score: score.score,
      reason: score.reason,
    }))
    .filter((item): item is { product: typeof ITEMS[0]; score: number; reason: string } => item.product !== undefined);
}

// Get cross-sell recommendations (products often bought together)
export function getCrossSellRecommendations(productId: string, limit: number = 5): typeof ITEMS {
  const source = ITEMS.find((item) => item.id === productId);
  if (!source) return [];

  // In production, this would use actual purchase data
  // For now, use category and tag matching
  const categoryProducts = getProductsByCategory(source.category, limit * 2);
  const tagProducts = getProductsByTags(source.tags, limit * 2);

  const combined = [...categoryProducts, ...tagProducts];
  const unique = Array.from(new Map(combined.map((p) => [p.id, p])).values());

  return unique.filter((p) => p.id !== productId).slice(0, limit);
}

// Get up-sell recommendations (higher-priced alternatives)
export function getUpSellRecommendations(productId: string, limit: number = 3): typeof ITEMS {
  const source = ITEMS.find((item) => item.id === productId);
  if (!source) return [];

  return ITEMS
    .filter((item) => 
      item.id !== productId &&
      item.category === source.category &&
      item.price > source.price
    )
    .sort((a, b) => a.price - b.price)
    .slice(0, limit);
}

// Get recommendation statistics
export function getRecommendationStats(productId: string): {
  totalRelated: number;
  byCategory: number;
  byAuthor: number;
  byTags: number;
  averageScore: number;
} {
  const source = ITEMS.find((item) => item.id === productId);
  if (!source) {
    return {
      totalRelated: 0,
      byCategory: 0,
      byAuthor: 0,
      byTags: 0,
      averageScore: 0,
    };
  }

  const byCategory = ITEMS.filter((item) => item.category === source.category && item.id !== productId).length;
  const byAuthor = ITEMS.filter((item) => item.author === source.author && item.id !== productId).length;
  const byTags = ITEMS.filter((item) =>
    item.id !== productId &&
    item.tags.some((tag) => source.tags.some((t) => t.toLowerCase() === tag.toLowerCase()))
  ).length;

  const scores = ITEMS
    .filter((item) => item.id !== productId)
    .map((item) => calculateRelevanceScore(productId, item.id).score);

  const averageScore = scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;

  return {
    totalRelated: ITEMS.length - 1,
    byCategory,
    byAuthor,
    byTags,
    averageScore,
  };
}
