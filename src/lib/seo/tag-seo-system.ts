// Tag SEO System
// Every tag becomes an SEO-optimized page

import { ITEMS } from '../marketplace-data';
import { generateCompleteMeta, PageContext } from './programmatic-seo-engine';

export interface TagPage {
  tag: string;
  slug: string;
  productCount: number;
  relatedTags: string[];
  topProducts: string[];
  meta: any;
  content: string;
  createdAt: string;
}

export interface TagStats {
  totalTags: number;
  averageProductsPerTag: number;
  topTags: Array<{ tag: string; count: number }>;
  orphanTags: string[];
}

// Get all unique tags from products
export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  
  ITEMS.forEach((item) => {
    item.tags.forEach((tag) => {
      tagSet.add(tag.toLowerCase());
    });
  });

  return Array.from(tagSet).sort();
}

// Get products by tag
export function getProductsByTag(tag: string) {
  const normalizedTag = tag.toLowerCase();
  
  return ITEMS.filter((item) =>
    item.tags.some((t) => t.toLowerCase() === normalizedTag)
  );
}

// Get related tags (tags that appear together)
export function getRelatedTags(tag: string, limit: number = 10): string[] {
  const products = getProductsByTag(tag);
  const tagFrequency = new Map<string, number>();

  products.forEach((product) => {
    product.tags.forEach((t) => {
      if (t.toLowerCase() !== tag.toLowerCase()) {
        tagFrequency.set(t, (tagFrequency.get(t) || 0) + 1);
      }
    });
  });

  return Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

// Generate tag slug
export function generateTagSlug(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// Generate tag page content
export function generateTagPageContent(tag: string): TagPage {
  const slug = generateTagSlug(tag);
  const products = getProductsByTag(tag);
  const relatedTags = getRelatedTags(tag);
  const topProducts = products
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 12)
    .map((p) => p.id);

  // Generate SEO meta
  const meta = generateCompleteMeta({
    type: 'tag',
    tag: tag,
  });

  // Generate content
  const content = generateTagContent(tag, products, relatedTags);

  return {
    tag,
    slug,
    productCount: products.length,
    relatedTags,
    topProducts,
    meta,
    content,
    createdAt: new Date().toISOString(),
  };
}

// Generate tag page content
function generateTagContent(tag: string, products: any[], relatedTags: string[]): string {
  const sections: string[] = [];

  // Introduction
  sections.push(`# ${tag} Scripts & Plugins`);
  sections.push('');
  sections.push(`Discover the best ${tag} scripts, plugins, and templates. Browse ${products.length}+ ${tag} solutions with instant download and comprehensive support.`);
  sections.push('');

  // What is this tag
  sections.push(`## What is ${tag}?`);
  sections.push(`${tag} is a popular category of digital products that help businesses and developers build better solutions faster. Our collection includes top-rated ${tag} tools trusted by thousands of users worldwide.`);
  sections.push('');

  // Top products
  if (products.length > 0) {
    sections.push(`## Top ${tag} Products`);
    sections.push('');
    sections.push(`Based on user ratings and reviews, here are the top ${tag} products:`);
    sections.push('');

    products.slice(0, 6).forEach((product, index) => {
      sections.push(`### ${index + 1}. ${product.title}`);
      sections.push(`${product.description}`);
      sections.push(`**Rating**: ${product.rating}★ | **Price**: $${product.price} | **Sales**: ${product.reviews || 0}+`);
      sections.push('');
    });
  }

  // Benefits
  sections.push(`## Benefits of ${tag}`);
  sections.push(`Using ${tag} solutions provides numerous advantages:`);
  sections.push(`- **Time Saving**: Accelerate development with pre-built solutions`);
  sections.push(`- **Cost Effective**: Save money compared to custom development`);
  sections.push(`- **Quality**: Battle-tested and proven solutions`);
  sections.push(`- **Support**: Professional support and regular updates`);
  sections.push(`- **Community**: Large user base and active community`);
  sections.push('');

  // Related tags
  if (relatedTags.length > 0) {
    sections.push(`## Related Categories`);
    sections.push(`Explore related ${tag} categories:`);
    sections.push('');
    relatedTags.forEach((relatedTag) => {
      sections.push(`- [${relatedTag}](/marketplace/tag/${generateTagSlug(relatedTag)})`);
    });
    sections.push('');
  }

  // How to choose
  sections.push(`## How to Choose the Right ${tag}`);
  sections.push(`When selecting ${tag} solutions, consider these factors:`);
  sections.push(`1. **Requirements**: Identify your specific needs`);
  sections.push(`2. **Features**: Compare available features`);
  sections.push(`3. **Reviews**: Read user feedback and ratings`);
  sections.push(`4. **Support**: Check support availability and quality`);
  sections.push(`5. **Updates**: Ensure regular updates and maintenance`);
  sections.push('');

  // FAQ
  sections.push(`## Frequently Asked Questions`);
  sections.push(`### What makes a good ${tag} solution?`);
  sections.push(`A good ${tag} solution should be well-documented, regularly updated, have good support, and positive user reviews.`);
  sections.push('');
  sections.push(`### Are ${tag} products customizable?`);
  sections.push(`Most ${tag} products are customizable to some extent. Check the product documentation for customization options.`);
  sections.push('');
  sections.push(`### Do ${tag} products include support?`);
  sections.push(`Yes, most ${tag} products include support. Check the product page for support details and response times.`);
  sections.push('');

  return sections.join('\n');
}

// Generate all tag pages
export function generateAllTagPages(): TagPage[] {
  const tags = getAllTags();
  return tags.map((tag) => generateTagPageContent(tag));
}

// Get tag statistics
export function getTagStatistics(): TagStats {
  const tags = getAllTags();
  const tagCounts = new Map<string, number>();

  tags.forEach((tag) => {
    tagCounts.set(tag, getProductsByTag(tag).length);
  });

  const totalTags = tags.length;
  const averageProductsPerTag = totalTags > 0
    ? Array.from(tagCounts.values()).reduce((sum, count) => sum + count, 0) / totalTags
    : 0;

  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));

  const orphanTags = Array.from(tagCounts.entries())
    .filter(([_, count]) => count === 0)
    .map(([tag]) => tag);

  return {
    totalTags,
    averageProductsPerTag,
    topTags,
    orphanTags,
  };
}

// Find orphan tags (tags with no products)
export function findOrphanTags(): string[] {
  const tags = getAllTags();
  return tags.filter((tag) => getProductsByTag(tag).length === 0);
}

// Merge similar tags
export function mergeSimilarTags(threshold: number = 0.8): Array<{
  primary: string;
  merged: string[];
}> {
  const tags = getAllTags();
  const merges: Array<{ primary: string; merged: string[] }> = [];

  // Simple similarity check based on string containment
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const tag1 = tags[i].toLowerCase();
      const tag2 = tags[j].toLowerCase();

      if (tag1.includes(tag2) || tag2.includes(tag1)) {
        const primary = tag1.length > tag2.length ? tag1 : tag2;
        const merged = tag1.length > tag2.length ? tag2 : tag1;

        const existingMerge = merges.find((m) => m.primary === primary);
        if (existingMerge) {
          existingMerge.merged.push(merged);
        } else {
          merges.push({ primary, merged: [merged] });
        }
      }
    }
  }

  return merges;
}

// Tag page cache
const tagPageCache = new Map<string, TagPage>();

export function cacheTagPage(tag: string, page: TagPage): void {
  tagPageCache.set(tag.toLowerCase(), page);
}

export function getCachedTagPage(tag: string): TagPage | undefined {
  return tagPageCache.get(tag.toLowerCase());
}

export function clearTagPageCache(): void {
  tagPageCache.clear();
}

// Validate tag page
export function validateTagPage(page: TagPage): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!page.tag || page.tag.length === 0) {
    errors.push('Tag is required');
  }

  if (!page.slug || page.slug.length === 0) {
    errors.push('Slug is required');
  }

  if (page.productCount === 0) {
    errors.push('Tag has no products');
  }

  if (!page.content || page.content.length < 200) {
    errors.push('Content must be at least 200 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Generate sitemap entries for tag pages
export function generateTagSitemapEntries(): Array<{
  url: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}> {
  const tags = getAllTags();
  const now = new Date().toISOString().split('T')[0];

  return tags.map((tag) => ({
    url: `https://erpvala.com/marketplace/tag/${generateTagSlug(tag)}`,
    lastmod: now,
    changefreq: 'weekly',
    priority: 0.7,
  }));
}

// Get tag popularity score
export function getTagPopularityScore(tag: string): number {
  const products = getProductsByTag(tag);
  const productCount = products.length;
  const avgRating = products.length > 0
    ? products.reduce((sum, p) => sum + p.rating, 0) / products.length
    : 0;
  const totalSales = products.reduce((sum, p) => sum + (p.reviews || 0), 0);

  // Calculate score (0-100)
  const countScore = Math.min(productCount * 2, 40); // Max 40 points
  const ratingScore = avgRating * 10; // Max 50 points
  const salesScore = Math.min(totalSales / 10, 10); // Max 10 points

  return countScore + ratingScore + salesScore;
}

// Get trending tags (based on recent activity - simplified)
export function getTrendingTags(limit: number = 10): string[] {
  const tags = getAllTags();
  
  return tags
    .map((tag) => ({ tag, score: getTagPopularityScore(tag) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ tag }) => tag);
}

// Auto-generate tag pages for all tags
export function autoGenerateTagPages(): void {
  const tags = getAllTags();
  
  tags.forEach((tag) => {
    const cached = getCachedTagPage(tag);
    if (!cached) {
      const page = generateTagPageContent(tag);
      cacheTagPage(tag, page);
    }
  });
}

// Update tag page when products change
export function updateTagPage(tag: string): TagPage | null {
  const page = generateTagPageContent(tag);
  cacheTagPage(tag, page);
  return page;
}

// Get tag page by slug
export function getTagPageBySlug(slug: string): TagPage | undefined {
  const tags = getAllTags();
  
  for (const tag of tags) {
    if (generateTagSlug(tag) === slug) {
      return getCachedTagPage(tag) || generateTagPageContent(tag);
    }
  }
  
  return undefined;
}

// Export tag pages as JSON
export function exportTagPages(): string {
  const pages = Array.from(tagPageCache.values());
  return JSON.stringify(pages, null, 2);
}

// Import tag pages from JSON
export function importTagPages(json: string): void {
  const pages = JSON.parse(json) as TagPage[];
  pages.forEach((page) => {
    cacheTagPage(page.tag, page);
  });
}
