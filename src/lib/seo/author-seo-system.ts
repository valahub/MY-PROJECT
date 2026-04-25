// Author SEO System
// Optimizes author pages for ranking "best plugin author" queries

import { ITEMS } from '../marketplace-data';
import { generateCompleteMeta, PageContext } from './programmatic-seo-engine';

export interface AuthorPage {
  author: string;
  slug: string;
  productCount: number;
  totalSales: number;
  averageRating: number;
  totalRevenue: number;
  topProducts: string[];
  categories: string[];
  meta: any;
  content: string;
  createdAt: string;
}

export interface AuthorStats {
  totalAuthors: number;
  averageProductsPerAuthor: number;
  topAuthors: Array<{ author: string; score: number }>;
  activeAuthors: number;
}

// Get all unique authors
export function getAllAuthors(): string[] {
  const authorSet = new Set<string>();
  
  ITEMS.forEach((item) => {
    if (item.author) {
      authorSet.add(item.author);
    }
  });

  return Array.from(authorSet).sort();
}

// Get products by author
export function getProductsByAuthor(author: string) {
  return ITEMS.filter((item) => item.author === author);
}

// Generate author slug
export function generateAuthorSlug(author: string): string {
  return author.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// Calculate author statistics
export function calculateAuthorStats(author: string): {
  productCount: number;
  totalSales: number;
  averageRating: number;
  totalRevenue: number;
  categories: string[];
} {
  const products = getProductsByAuthor(author);
  const productCount = products.length;
  const totalSales = products.reduce((sum, p) => sum + (p.reviews || 0), 0);
  const averageRating = productCount > 0
    ? products.reduce((sum, p) => sum + p.rating, 0) / productCount
    : 0;
  const totalRevenue = products.reduce((sum, p) => sum + (p.price * (p.reviews || 0)), 0);
  const categories = Array.from(new Set(products.map((p) => p.category)));

  return {
    productCount,
    totalSales,
    averageRating,
    totalRevenue,
    categories,
  };
}

// Generate author page content
export function generateAuthorPageContent(author: string): AuthorPage {
  const slug = generateAuthorSlug(author);
  const stats = calculateAuthorStats(author);
  const products = getProductsByAuthor(author);
  const topProducts = products
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 12)
    .map((p) => p.id);

  // Generate SEO meta
  const meta = generateCompleteMeta({
    type: 'author',
    author: author,
  });

  // Generate content
  const content = generateAuthorContent(author, stats, products);

  return {
    author,
    slug,
    productCount: stats.productCount,
    totalSales: stats.totalSales,
    averageRating: stats.averageRating,
    totalRevenue: stats.totalRevenue,
    topProducts,
    categories: stats.categories,
    meta,
    content,
    createdAt: new Date().toISOString(),
  };
}

// Generate author page content
function generateAuthorContent(author: string, stats: any, products: any[]): string {
  const sections: string[] = [];

  // Introduction
  sections.push(`# ${author} - Top ${stats.productCount} Products`);
  sections.push('');
  sections.push(`${author} is a trusted author on ERP Vala with ${stats.productCount}+ products and ${stats.totalSales}+ sales. With an average rating of ${stats.averageRating.toFixed(1)}★, ${author} delivers high-quality solutions trusted by users worldwide.`);
  sections.push('');

  // Author statistics
  sections.push(`## Author Statistics`);
  sections.push('');
  sections.push(`- **Total Products**: ${stats.productCount}`);
  sections.push(`- **Total Sales**: ${stats.totalSales}+`);
  sections.push(`- **Average Rating**: ${stats.averageRating.toFixed(1)}★`);
  sections.push(`- **Total Revenue**: $${stats.totalRevenue.toLocaleString()}`);
  sections.push(`- **Categories**: ${stats.categories.join(', ')}`);
  sections.push('');

  // Top products
  if (products.length > 0) {
    sections.push(`## Top Products by ${author}`);
    sections.push('');
    sections.push(`Here are the highest-rated products by ${author}:`);
    sections.push('');

    products.slice(0, 6).forEach((product, index) => {
      sections.push(`### ${index + 1}. ${product.title}`);
      sections.push(`${product.description}`);
      sections.push(`**Rating**: ${product.rating}★ | **Price**: $${product.price} | **Sales**: ${product.reviews || 0}+`);
      sections.push('');
    });
  }

  // Categories
  if (stats.categories.length > 0) {
    sections.push(`## Categories`);
    sections.push('');
    sections.push(`${author} specializes in the following categories:`);
    sections.push('');
    stats.categories.forEach((category: string) => {
      sections.push(`- [${category}](/marketplace/category?category=${category.toLowerCase()})`);
    });
    sections.push('');
  }

  // Why choose this author
  sections.push(`## Why Choose ${author}?`);
  sections.push('');
  sections.push(`${author} has established a reputation for excellence in the marketplace:`);
  sections.push(`- **Quality**: Consistently high-rated products`);
  sections.push(`- **Support**: Responsive and helpful customer support`);
  sections.push(`- **Updates**: Regular product updates and improvements`);
  sections.push(`- **Experience**: Proven track record with ${stats.totalSales}+ sales`);
  sections.push(`- **Variety**: Diverse product portfolio across ${stats.categories.length} categories`);
  sections.push('');

  // Customer reviews summary
  sections.push(`## Customer Reviews`);
  sections.push('');
  sections.push(`Customers consistently praise ${author} for:`);
  sections.push(`- Product quality and reliability`);
  sections.push(`- Fast and helpful support`);
  sections.push(`- Regular updates and bug fixes`);
  sections.push(`- Clear documentation`);
  sections.push(`- Value for money`);
  sections.push('');

  // FAQ
  sections.push(`## Frequently Asked Questions`);
  sections.push(`### How long has ${author} been selling on ERP Vala?`);
  sections.push(`${author} has been an active seller with ${stats.productCount}+ products and ${stats.totalSales}+ satisfied customers.`);
  sections.push('');
  sections.push(`### Does ${author} provide support?`);
  sections.push(`Yes, ${author} provides support for all products. Check individual product pages for support details.`);
  sections.push('');
  sections.push(`### Are ${author}'s products regularly updated?`);
  sections.push(`${author} maintains and updates products regularly to ensure compatibility and add new features.`);
  sections.push('');

  return sections.join('\n');
}

// Generate all author pages
export function generateAllAuthorPages(): AuthorPage[] {
  const authors = getAllAuthors();
  return authors.map((author) => generateAuthorPageContent(author));
}

// Get author statistics
export function getAuthorStatistics(): AuthorStats {
  const authors = getAllAuthors();
  const authorScores = new Map<string, number>();

  authors.forEach((author) => {
    const stats = calculateAuthorStats(author);
    const score = calculateAuthorScore(stats);
    authorScores.set(author, score);
  });

  const totalAuthors = authors.length;
  const averageProductsPerAuthor = totalAuthors > 0
    ? authors.reduce((sum, author) => sum + getProductsByAuthor(author).length, 0) / totalAuthors
    : 0;

  const topAuthors = Array.from(authorScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([author, score]) => ({ author, score }));

  const activeAuthors = authors.filter((author) => getProductsByAuthor(author).length > 0).length;

  return {
    totalAuthors,
    averageProductsPerAuthor,
    topAuthors,
    activeAuthors,
  };
}

// Calculate author score (for ranking)
function calculateAuthorScore(stats: any): number {
  const productScore = Math.min(stats.productCount * 5, 30); // Max 30 points
  const ratingScore = stats.averageRating * 10; // Max 50 points
  const salesScore = Math.min(stats.totalSales / 100, 20); // Max 20 points

  return productScore + ratingScore + salesScore;
}

// Author page cache
const authorPageCache = new Map<string, AuthorPage>();

export function cacheAuthorPage(author: string, page: AuthorPage): void {
  authorPageCache.set(author, page);
}

export function getCachedAuthorPage(author: string): AuthorPage | undefined {
  return authorPageCache.get(author);
}

export function clearAuthorPageCache(): void {
  authorPageCache.clear();
}

// Validate author page
export function validateAuthorPage(page: AuthorPage): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!page.author || page.author.length === 0) {
    errors.push('Author name is required');
  }

  if (!page.slug || page.slug.length === 0) {
    errors.push('Slug is required');
  }

  if (page.productCount === 0) {
    errors.push('Author has no products');
  }

  if (!page.content || page.content.length < 200) {
    errors.push('Content must be at least 200 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Generate sitemap entries for author pages
export function generateAuthorSitemapEntries(): Array<{
  url: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}> {
  const authors = getAllAuthors();
  const now = new Date().toISOString().split('T')[0];

  return authors.map((author) => ({
    url: `https://erpvala.com/marketplace/author/${generateAuthorSlug(author)}`,
    lastmod: now,
    changefreq: 'weekly',
    priority: 0.6,
  }));
}

// Get top authors by revenue
export function getTopAuthorsByRevenue(limit: number = 10): Array<{
  author: string;
  revenue: number;
}> {
  const authors = getAllAuthors();

  return authors
    .map((author) => ({
      author,
      revenue: calculateAuthorStats(author).totalRevenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// Get top authors by rating
export function getTopAuthorsByRating(limit: number = 10): Array<{
  author: string;
  rating: number;
}> {
  const authors = getAllAuthors();

  return authors
    .map((author) => ({
      author,
      rating: calculateAuthorStats(author).averageRating,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

// Get top authors by sales
export function getTopAuthorsBySales(limit: number = 10): Array<{
  author: string;
  sales: number;
}> {
  const authors = getAllAuthors();

  return authors
    .map((author) => ({
      author,
      sales: calculateAuthorStats(author).totalSales,
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit);
}

// Auto-generate author pages for all authors
export function autoGenerateAuthorPages(): void {
  const authors = getAllAuthors();
  
  authors.forEach((author) => {
    const cached = getCachedAuthorPage(author);
    if (!cached) {
      const page = generateAuthorPageContent(author);
      cacheAuthorPage(author, page);
    }
  });
}

// Update author page when products change
export function updateAuthorPage(author: string): AuthorPage | null {
  const page = generateAuthorPageContent(author);
  cacheAuthorPage(author, page);
  return page;
}

// Get author page by slug
export function getAuthorPageBySlug(slug: string): AuthorPage | undefined {
  const authors = getAllAuthors();
  
  for (const author of authors) {
    if (generateAuthorSlug(author) === slug) {
      return getCachedAuthorPage(author) || generateAuthorPageContent(author);
    }
  }
  
  return undefined;
}

// Export author pages as JSON
export function exportAuthorPages(): string {
  const pages = Array.from(authorPageCache.values());
  return JSON.stringify(pages, null, 2);
}

// Import author pages from JSON
export function importAuthorPages(json: string): void {
  const pages = JSON.parse(json) as AuthorPage[];
  pages.forEach((page) => {
    cacheAuthorPage(page.author, page);
  });
}

// Generate author badge HTML
export function generateAuthorBadge(author: string): string {
  const stats = calculateAuthorStats(author);
  const score = calculateAuthorScore(stats);
  
  let badge = '';
  if (score >= 80) {
    badge = '<span class="author-badge elite">Elite Author</span>';
  } else if (score >= 60) {
    badge = '<span class="author-badge top">Top Author</span>';
  } else if (score >= 40) {
    badge = '<span class="author-badge rising">Rising Star</span>';
  }
  
  return badge;
}

// Get author verification status
export function getAuthorVerificationStatus(author: string): {
  verified: boolean;
  level: 'none' | 'basic' | 'verified' | 'premium';
} {
  const stats = calculateAuthorStats(author);
  const score = calculateAuthorScore(stats);

  if (score >= 80) {
    return { verified: true, level: 'premium' };
  } else if (score >= 60) {
    return { verified: true, level: 'verified' };
  } else if (score >= 40) {
    return { verified: true, level: 'basic' };
  }
  
  return { verified: false, level: 'none' };
}
