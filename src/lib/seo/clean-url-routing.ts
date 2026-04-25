// Clean URL Routing System
// Maps clean URLs (/plugins/react) to query parameters

import { CATEGORY_TREE } from '../marketplace-data';

export interface URLMapping {
  cleanUrl: string;
  queryParams: Record<string, string>;
  type: 'category' | 'subcategory' | 'tag' | 'product';
}

export interface RewriteRule {
  from: string;
  to: string;
  type: 'category' | 'subcategory' | 'tag';
}

// URL mapping configuration
const URL_MAPPINGS: URLMapping[] = [];

// Generate category URL mappings
export function generateCategoryMappings(): URLMapping[] {
  const mappings: URLMapping[] = [];

  CATEGORY_TREE.forEach((category) => {
    // Main category: /plugins -> /marketplace/category?category=plugins
    mappings.push({
      cleanUrl: `/${category.slug}`,
      queryParams: { category: category.slug },
      type: 'category',
    });

    // Subcategories: /plugins/react -> /marketplace/category?category=plugins&subcategory=react
    category.subs.forEach((sub) => {
      const subSlug = sub.toLowerCase().replace(/ /g, '-');
      mappings.push({
        cleanUrl: `/${category.slug}/${subSlug}`,
        queryParams: { category: category.slug, subcategory: subSlug },
        type: 'subcategory',
      });
    });
  });

  return mappings;
}

// Generate tag URL mappings
export function generateTagMappings(tags: string[]): URLMapping[] {
  const mappings: URLMapping[] = [];

  tags.forEach((tag) => {
    const tagSlug = tag.toLowerCase().replace(/ /g, '-');
    mappings.push({
      cleanUrl: `/tag/${tagSlug}`,
      queryParams: { tag },
      type: 'tag',
    });
  });

  return mappings;
}

// Generate product URL mappings
export function generateProductMappings(products: Array<{ slug: string; id: string }>): URLMapping[] {
  const mappings: URLMapping[] = [];

  products.forEach((product) => {
    mappings.push({
      cleanUrl: `/product/${product.slug}`,
      queryParams: { id: product.id },
      type: 'product',
    });
  });

  return mappings;
}

// Initialize all URL mappings
export function initializeUrlMappings(products: Array<{ slug: string; id: string }>, tags: string[]): void {
  URL_MAPPINGS.length = 0;
  URL_MAPPINGS.push(...generateCategoryMappings());
  URL_MAPPINGS.push(...generateTagMappings(tags));
  URL_MAPPINGS.push(...generateProductMappings(products));
}

// Convert clean URL to query params
export function cleanUrlToQueryParams(cleanUrl: string): Record<string, string> | null {
  const mapping = URL_MAPPINGS.find((m) => m.cleanUrl === cleanUrl);
  return mapping ? mapping.queryParams : null;
}

// Convert query params to clean URL
export function queryParamsToCleanUrl(queryParams: Record<string, string>): string | null {
  const mapping = URL_MAPPINGS.find((m) => {
    return Object.keys(m.queryParams).every((key) => 
      m.queryParams[key] === queryParams[key]
    );
  });
  return mapping ? mapping.cleanUrl : null;
}

// Generate rewrite rules for server config
export function generateRewriteRules(): RewriteRule[] {
  const rules: RewriteRule[] = [];

  URL_MAPPINGS.forEach((mapping) => {
    if (mapping.type === 'category' || mapping.type === 'subcategory') {
      const to = `/marketplace/category?${new URLSearchParams(mapping.queryParams).toString()}`;
      rules.push({
        from: mapping.cleanUrl,
        to,
        type: mapping.type,
      });
    } else if (mapping.type === 'tag') {
      const to = `/marketplace/tag?${new URLSearchParams(mapping.queryParams).toString()}`;
      rules.push({
        from: mapping.cleanUrl,
        to,
        type: mapping.type,
      });
    }
  });

  return rules;
}

// Generate nginx rewrite rules
export function generateNginxRewrites(): string {
  const rules = generateRewriteRules();
  
  return rules.map((rule) => {
    return `rewrite ^${rule.from}$ ${rule.to} last;`;
  }).join('\n');
}

// Generate Apache .htaccess rewrite rules
export function generateApacheRewrites(): string {
  const rules = generateRewriteRules();
  
  return rules.map((rule) => {
    return `RewriteRule ^${rule.from}$ ${rule.to} [L]`;
  }).join('\n');
}

// Generate Next.js middleware rewrite rules
export function generateNextMiddlewareRewrites(): string {
  const rules = generateRewriteRules();
  
  return rules.map((rule) => {
    return `{
      source: '${rule.from}',
      destination: '${rule.to}',
    }`;
  }).join(',\n');
}

// Validate clean URL
export function validateCleanUrl(url: string): boolean {
  return URL_MAPPINGS.some((m) => m.cleanUrl === url);
}

// Get all clean URLs by type
export function getCleanUrlsByType(type: URLMapping['type']): string[] {
  return URL_MAPPINGS
    .filter((m) => m.type === type)
    .map((m) => m.cleanUrl);
}

// Get URL mapping statistics
export function getUrlMappingStats(): {
  totalMappings: number;
  byType: Record<string, number>;
} {
  const byType: Record<string, number> = {
    category: 0,
    subcategory: 0,
    tag: 0,
    product: 0,
  };

  URL_MAPPINGS.forEach((mapping) => {
    byType[mapping.type]++;
  });

  return {
    totalMappings: URL_MAPPINGS.length,
    byType,
  };
}

// Generate sitemap entries for clean URLs
export function generateCleanUrlSitemapEntries(): Array<{
  url: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}> {
  const now = new Date().toISOString().split('T')[0];

  return URL_MAPPINGS.map((mapping) => ({
    url: `https://erpvala.com${mapping.cleanUrl}`,
    lastmod: now,
    changefreq: mapping.type === 'product' ? 'weekly' : 'daily',
    priority: mapping.type === 'category' ? 0.9 : mapping.type === 'subcategory' ? 0.8 : 0.7,
  }));
}

// Export URL mappings as JSON
export function exportUrlMappings(): string {
  return JSON.stringify(URL_MAPPINGS, null, 2);
}

// Import URL mappings from JSON
export function importUrlMappings(json: string): void {
  const mappings = JSON.parse(json) as URLMapping[];
  URL_MAPPINGS.length = 0;
  URL_MAPPINGS.push(...mappings);
}

// Generate canonical URL from clean URL
export function generateCanonicalFromCleanUrl(cleanUrl: string): string {
  return `https://erpvala.com${cleanUrl}`;
}

// Generate clean URL from product slug
export function generateProductCleanUrl(slug: string): string {
  return `/product/${slug}`;
}

// Generate clean URL from category
export function generateCategoryCleanUrl(categorySlug: string, subcategorySlug?: string): string {
  if (subcategorySlug) {
    return `/${categorySlug}/${subcategorySlug}`;
  }
  return `/${categorySlug}`;
}

// Generate clean URL from tag
export function generateTagCleanUrl(tag: string): string {
  const tagSlug = tag.toLowerCase().replace(/ /g, '-');
  return `/tag/${tagSlug}`;
}

// Parse clean URL path
export function parseCleanUrlPath(path: string): {
  type: 'category' | 'subcategory' | 'tag' | 'product' | 'unknown';
  params: Record<string, string>;
} | null {
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0) {
    return { type: 'unknown', params: {} };
  }

  // Check for product: /product/slug
  if (segments[0] === 'product' && segments.length === 2) {
    return { type: 'product', params: { slug: segments[1] } };
  }

  // Check for tag: /tag/slug
  if (segments[0] === 'tag' && segments.length === 2) {
    return { type: 'tag', params: { tag: segments[1] } };
  }

  // Check for category: /category or /category/subcategory
  const category = CATEGORY_TREE.find((cat) => cat.slug === segments[0]);
  if (category) {
    if (segments.length === 1) {
      return { type: 'category', params: { category: category.slug } };
    } else if (segments.length === 2) {
      return { type: 'subcategory', params: { category: category.slug, subcategory: segments[1] } };
    }
  }

  return { type: 'unknown', params: {} };
}

// Generate redirect for old URL format
export function generateRedirectForOldUrl(oldUrl: string): string | null {
  const urlObj = new URL(oldUrl, 'https://erpvala.com');
  const params = new URLSearchParams(urlObj.search);
  
  const queryParams: Record<string, string> = {};
  params.forEach((value, key) => {
    queryParams[key] = value;
  });

  return queryParamsToCleanUrl(queryParams);
}

// Batch generate clean URLs for all content
export function batchGenerateCleanUrls(): {
  categories: string[];
  subcategories: string[];
  tags: string[];
  products: string[];
} {
  const categories = getCleanUrlsByType('category');
  const subcategories = getCleanUrlsByType('subcategory');
  const tags = getCleanUrlsByType('tag');
  const products = getCleanUrlsByType('product');

  return {
    categories,
    subcategories,
    tags,
    products,
  };
}
