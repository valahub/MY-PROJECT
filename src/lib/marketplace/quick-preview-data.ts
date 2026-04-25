// Quick Preview Data System
// Backend data structure for quick preview modal (UI implementation separate)

import { ITEMS } from '../marketplace-data';

export interface QuickPreviewData {
  productId: string;
  title: string;
  price: number;
  rating: number;
  reviews: number;
  shortDescription: string;
  thumbnail: string;
  category: string;
  author: string;
  tags: string[];
  version: string;
}

// Get quick preview data for a product
export function getQuickPreviewData(productId: string): QuickPreviewData | null {
  const product = ITEMS.find((item) => item.id === productId);
  
  if (!product) return null;

  // Generate short description (first 150 characters)
  const shortDescription = product.description.length > 150
    ? product.description.substring(0, 150) + '...'
    : product.description;

  return {
    productId: product.id,
    title: product.title,
    price: product.price,
    rating: product.rating,
    reviews: product.reviews || 0,
    shortDescription,
    thumbnail: product.thumbnail,
    category: product.category,
    author: product.author,
    tags: product.tags,
    version: product.version || '1.0.0',
  };
}

// Batch get quick preview data
export function batchGetQuickPreviewData(productIds: string[]): QuickPreviewData[] {
  return productIds
    .map((id) => getQuickPreviewData(id))
    .filter((data): data is QuickPreviewData => data !== null);
}

// Validate quick preview data
export function validateQuickPreviewData(data: QuickPreviewData): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!data.title) issues.push('Missing title');
  if (!data.price || data.price < 0) issues.push('Invalid price');
  if (!data.rating || data.rating < 0 || data.rating > 5) issues.push('Invalid rating');
  if (!data.shortDescription) issues.push('Missing description');
  if (!data.thumbnail) issues.push('Missing thumbnail');

  return {
    valid: issues.length === 0,
    issues,
  };
}
