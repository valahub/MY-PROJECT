// Massive Page Generation Engine
// Generates SSR/ISR paths for 10,000+ product pages

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';
import { BLOG_POSTS, getAllTags, getBlogCategories } from '../blog-data';

export interface PagePath {
  path: string;
  type: 'product' | 'category' | 'tag' | 'author' | 'blog' | 'blog-category' | 'landing';
  priority: number;
  revalidate?: number; // ISR revalidate time in seconds
}

export interface StaticPathConfig {
  paths: string[];
  fallback: boolean | 'blocking';
}

// Generate all product paths
export function generateProductPaths(): PagePath[] {
  return ITEMS.map((item) => ({
    path: `/marketplace/item/${item.slug}`,
    type: 'product',
    priority: 1.0,
    revalidate: 3600, // 1 hour
  }));
}

// Generate all category paths
export function generateCategoryPaths(): PagePath[] {
  const paths: PagePath[] = [];
  
  // Main categories
  CATEGORY_TREE.forEach((cat) => {
    paths.push({
      path: `/marketplace/category?category=${cat.slug}`,
      type: 'category',
      priority: 0.9,
      revalidate: 1800, // 30 minutes
    });

    // Subcategories
    cat.subs.forEach((sub) => {
      const subSlug = sub.toLowerCase().replace(/ /g, '-');
      paths.push({
        path: `/marketplace/category?category=${cat.slug}&subcategory=${subSlug}`,
        type: 'category',
        priority: 0.8,
        revalidate: 1800,
      });
    });
  });

  return paths;
}

// Generate all tag paths
export function generateTagPaths(): PagePath[] {
  const allTags = new Set<string>();
  
  ITEMS.forEach((item) => {
    item.tags.forEach((tag) => allTags.add(tag.toLowerCase()));
  });

  return Array.from(allTags).map((tag) => ({
    path: `/marketplace/tag/${tag}`,
    type: 'tag',
    priority: 0.7,
    revalidate: 3600,
  }));
}

// Generate all author paths
export function generateAuthorPaths(): PagePath[] {
  const authors = new Set<string>();
  
  ITEMS.forEach((item) => {
    if (item.author) {
      authors.add(item.author.toLowerCase().replace(/ /g, '-'));
    }
  });

  return Array.from(authors).map((author) => ({
    path: `/marketplace/author/${author}`,
    type: 'author',
    priority: 0.6,
    revalidate: 7200, // 2 hours
  }));
}

// Generate all blog paths
export function generateBlogPaths(): PagePath[] {
  return BLOG_POSTS.map((post) => ({
    path: `/marketplace/blog/${post.slug}`,
    type: 'blog',
    priority: 0.8,
    revalidate: 86400, // 24 hours
  }));
}

// Generate blog category paths
export function generateBlogCategoryPaths(): PagePath[] {
  const categories = getBlogCategories();
  
  return categories.map((cat) => ({
    path: `/marketplace/blog?category=${cat}`,
    type: 'blog-category',
    priority: 0.7,
    revalidate: 3600,
  }));
}

// Generate long tail keyword landing pages
export function generateLandingPaths(): PagePath[] {
  const paths: PagePath[] = [];
  const categories = CATEGORY_TREE.map((c) => c.slug);
  const tags = Array.from(new Set(ITEMS.flatMap((i) => i.tags.map((t) => t.toLowerCase()))));

  // Generate "best [category]" pages
  categories.forEach((cat) => {
    paths.push({
      path: `/best/${cat}`,
      type: 'landing',
      priority: 0.9,
      revalidate: 1800,
    });
  });

  // Generate "top [tag]" pages
  tags.slice(0, 20).forEach((tag) => {
    paths.push({
      path: `/top/${tag}`,
      type: 'landing',
      priority: 0.8,
      revalidate: 1800,
    });
  });

  // Generate "cheap [category]" pages
  categories.forEach((cat) => {
    paths.push({
      path: `/cheap/${cat}`,
      type: 'landing',
      priority: 0.7,
      revalidate: 1800,
    });
  });

  return paths;
}

// Generate all paths for ISR
export function generateAllPaths(): PagePath[] {
  return [
    ...generateProductPaths(),
    ...generateCategoryPaths(),
    ...generateTagPaths(),
    ...generateAuthorPaths(),
    ...generateBlogPaths(),
    ...generateBlogCategoryPaths(),
    ...generateLandingPaths(),
  ];
}

// Get Next.js getStaticPaths config
export function getStaticPathsConfig(type: PagePath['type']): StaticPathConfig {
  const paths = generateAllPaths().filter((p) => p.type === type);
  
  return {
    paths: paths.map((p) => p.path),
    fallback: 'blocking',
  };
}

// Batch generate paths for large datasets
export function generatePathsBatch(
  type: PagePath['type'],
  offset: number = 0,
  limit: number = 1000
): PagePath[] {
  const allPaths = generateAllPaths().filter((p) => p.type === type);
  return allPaths.slice(offset, offset + limit);
}

// Get path count by type
export function getPathCountByType(): Record<PagePath['type'], number> {
  const allPaths = generateAllPaths();
  const counts = {
    product: 0,
    category: 0,
    tag: 0,
    author: 0,
    blog: 0,
    'blog-category': 0,
    landing: 0,
  };

  allPaths.forEach((path) => {
    counts[path.type]++;
  });

  return counts;
}

// Get high-priority paths (for immediate indexing)
export function getHighPriorityPaths(threshold: number = 0.8): PagePath[] {
  return generateAllPaths().filter((p) => p.priority >= threshold);
}

// Get paths needing revalidation
export function getPathsNeedingRevalidation(maxAge: number = 3600): PagePath[] {
  const now = Date.now();
  return generateAllPaths().filter((p) => {
    if (!p.revalidate) return false;
    // In production, check last build time
    return true;
  });
}

// Generate sitemap URLs from paths
export function generateSitemapUrls(): Array<{
  url: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}> {
  const now = new Date().toISOString().split('T')[0];
  
  return generateAllPaths().map((path) => ({
    url: `https://erpvala.com${path.path}`,
    lastmod: now,
    changefreq: path.revalidate && path.revalidate < 3600 ? 'hourly' : 'daily',
    priority: path.priority,
  }));
}

// Validate path structure
export function validatePath(path: string): boolean {
  // Basic validation - ensure path starts with / and contains valid characters
  return /^\/[a-z0-9\-_/?=&.]+$/.test(path);
}

// Deduplicate paths
export function deduplicatePaths(paths: PagePath[]): PagePath[] {
  const seen = new Set<string>();
  return paths.filter((path) => {
    if (seen.has(path.path)) return false;
    seen.add(path.path);
    return true;
  });
}

// Generate incremental paths (for new content only)
export function generateIncrementalPaths(since: Date): PagePath[] {
  // In production, query database for content created since date
  // For now, return all paths
  return generateAllPaths();
}

// Export for Next.js ISR
export const ISR_CONFIG = {
  // Product pages - revalidate every hour
  product: {
    revalidate: 3600,
    generatePaths: generateProductPaths,
  },
  // Category pages - revalidate every 30 minutes
  category: {
    revalidate: 1800,
    generatePaths: generateCategoryPaths,
  },
  // Tag pages - revalidate every hour
  tag: {
    revalidate: 3600,
    generatePaths: generateTagPaths,
  },
  // Author pages - revalidate every 2 hours
  author: {
    revalidate: 7200,
    generatePaths: generateAuthorPaths,
  },
  // Blog pages - revalidate daily
  blog: {
    revalidate: 86400,
    generatePaths: generateBlogPaths,
  },
  // Landing pages - revalidate every 30 minutes
  landing: {
    revalidate: 1800,
    generatePaths: generateLandingPaths,
  },
};

// Get total path count
export function getTotalPathCount(): number {
  return generateAllPaths().length;
}

// Get path generation stats
export function getPathGenerationStats(): {
  total: number;
  byType: Record<PagePath['type'], number>;
  highPriority: number;
  lowPriority: number;
} {
  const allPaths = generateAllPaths();
  const byType = getPathCountByType();
  const highPriority = allPaths.filter((p) => p.priority >= 0.8).length;
  const lowPriority = allPaths.filter((p) => p.priority < 0.5).length;

  return {
    total: allPaths.length,
    byType,
    highPriority,
    lowPriority,
  };
}
