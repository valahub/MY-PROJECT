// Auto Landing Page Creator
// Generates thousands of SEO landing pages dynamically

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';
import { generateCompleteMeta, PageContext } from './programmatic-seo-engine';

export interface LandingPage {
  path: string;
  title: string;
  description: string;
  heading: string;
  content: string;
  productIds: string[];
  meta: any;
  type: 'best' | 'top' | 'cheap' | 'guide' | 'tutorial' | 'comparison';
  createdAt: string;
}

export interface LandingPageConfig {
  keyword: string;
  category?: string;
  tags?: string[];
  type: LandingPage['type'];
  maxProducts?: number;
}

// Landing page templates
const PAGE_TEMPLATES = {
  best: {
    heading: 'Best {keyword} for {category}',
    intro: 'Discover the best {keyword} for {category}. Our curated selection features top-rated solutions trusted by thousands of users.',
  },
  top: {
    heading: 'Top {keyword} in {category}',
    intro: 'Explore the top {keyword} available for {category}. These premium solutions offer exceptional features and performance.',
  },
  cheap: {
    heading: 'Cheap {keyword} for {category}',
    intro: 'Find affordable {keyword} for {category} without compromising quality. Budget-friendly options starting from low prices.',
  },
  guide: {
    heading: 'Complete Guide to {keyword}',
    intro: 'Learn everything about {keyword}. This comprehensive guide covers features, benefits, and how to choose the right solution.',
  },
  tutorial: {
    heading: '{keyword} Tutorial',
    intro: 'Step-by-step tutorial for {keyword}. Master the essentials and advanced techniques with our expert guide.',
  },
  comparison: {
    heading: '{keyword} Comparison',
    intro: 'Compare the best {keyword} side by side. Make an informed decision with our detailed comparison.',
  },
};

// Generate landing page content
export function generateLandingPageContent(
  config: LandingPageConfig
): LandingPage {
  const { keyword, category, tags, type, maxProducts = 12 } = config;
  const categorySlug = category || 'all';
  const path = `/${type}/${keyword.toLowerCase().replace(/ /g, '-')}`;
  const template = PAGE_TEMPLATES[type];

  // Filter products based on keyword and category
  let filteredProducts = ITEMS.filter((item) => {
    const matchesKeyword =
      item.title.toLowerCase().includes(keyword.toLowerCase()) ||
      item.description.toLowerCase().includes(keyword.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(keyword.toLowerCase()));

    const matchesCategory = !category || item.category === category;
    const matchesTags = !tags || tags.some((tag) => item.tags.includes(tag));

    return matchesKeyword && matchesCategory && matchesTags;
  });

  // Sort by rating for "best" and "top" pages
  if (type === 'best' || type === 'top') {
    filteredProducts = filteredProducts.sort((a, b) => b.rating - a.rating);
  }

  // Sort by price for "cheap" pages
  if (type === 'cheap') {
    filteredProducts = filteredProducts.sort((a, b) => a.price - b.price);
  }

  // Limit products
  const productIds = filteredProducts.slice(0, maxProducts).map((p) => p.id);

  // Generate content
  const heading = template.heading
    .replace('{keyword}', keyword)
    .replace('{category}', categorySlug);

  const intro = template.intro
    .replace('{keyword}', keyword)
    .replace('{category}', categorySlug);

  const content = generateExtendedContent(keyword, categorySlug, type, filteredProducts);

  // Generate SEO meta
  const meta = generateCompleteMeta({
    type: 'landing',
    query: keyword,
    category: categorySlug,
  });

  return {
    path,
    title: meta.title,
    description: meta.description,
    heading,
    content,
    productIds,
    meta,
    type,
    createdAt: new Date().toISOString(),
  };
}

// Generate extended content for landing pages
function generateExtendedContent(
  keyword: string,
  category: string,
  type: LandingPage['type'],
  products: any[]
): string {
  const sections: string[] = [];

  // Introduction
  sections.push(`## Why Choose ${keyword}?`);
  sections.push(`${keyword} is essential for ${category}. Our selection includes the most trusted and reliable solutions available.`);
  sections.push('');

  // Features section
  sections.push(`## Key Features`);
  sections.push(`When selecting ${keyword} for ${category}, consider these important features:`);
  sections.push(`- **Performance**: Fast and efficient operation`);
  sections.push(`- **Reliability**: Proven track record with users`);
  sections.push(`- **Support**: Comprehensive documentation and assistance`);
  sections.push(`- **Integration**: Easy integration with existing systems`);
  sections.push(`- **Updates**: Regular updates and improvements`);
  sections.push('');

  // Benefits section
  sections.push(`## Benefits of ${keyword}`);
  sections.push(`Using ${keyword} provides numerous advantages for your ${category} projects:`);
  sections.push(`- Increased productivity and efficiency`);
  sections.push(`- Cost-effective solution for your needs`);
  sections.push(`- Scalable for growing requirements`);
  sections.push(`- Enhanced user experience`);
  sections.push(`- Competitive advantage in the market`);
  sections.push('');

  // Product highlights
  if (products.length > 0) {
    sections.push(`## Top ${keyword} Recommendations`);
    sections.push(`Based on user ratings and reviews, here are our top ${keyword} recommendations:`);
    sections.push('');

    products.slice(0, 5).forEach((product, index) => {
      sections.push(`### ${index + 1}. ${product.title}`);
      sections.push(`${product.description}`);
      sections.push(`**Rating**: ${product.rating}★ | **Price**: $${product.price}`);
      sections.push('');
    });
  }

  // How to choose section
  sections.push(`## How to Choose the Right ${keyword}`);
  sections.push(`Selecting the perfect ${keyword} for ${category} requires careful consideration:`);
  sections.push(`1. **Assess Your Needs**: Identify your specific requirements`);
  sections.push(`2. **Compare Features**: Evaluate different options`);
  sections.push(`3. **Check Reviews**: Read user feedback and ratings`);
  sections.push(`4. **Consider Budget**: Balance cost with features`);
  sections.push(`5. **Test Demo**: Try before you buy when possible`);
  sections.push('');

  // FAQ section
  sections.push(`## Frequently Asked Questions`);
  sections.push(`### What is ${keyword}?`);
  sections.push(`${keyword} is a specialized solution designed for ${category} projects.`);
  sections.push('');
  sections.push(`### How much does ${keyword} cost?`);
  sections.push(`Prices vary based on features and licensing. Our selection includes options from $${Math.min(...products.map(p => p.price))} to $${Math.max(...products.map(p => p.price))}.`);
  sections.push('');
  sections.push(`### Is ${keyword} easy to use?`);
  sections.push(`Most ${keyword} solutions are designed with user-friendly interfaces and comprehensive documentation.`);
  sections.push('');

  // Conclusion
  sections.push(`## Conclusion`);
  sections.push(`Choosing the right ${keyword} is crucial for your ${category} success. Our curated selection ensures you get the best value and performance.`);
  sections.push(`Browse our recommendations above and find the perfect ${keyword} for your needs.`);

  return sections.join('\n');
}

// Generate multiple landing pages in batch
export function batchGenerateLandingPages(
  configs: LandingPageConfig[]
): LandingPage[] {
  return configs.map((config) => generateLandingPageContent(config));
}

// Auto-generate landing pages for all categories
export function generateCategoryLandingPages(): LandingPageConfig[] {
  const configs: LandingPageConfig[] = [];

  CATEGORY_TREE.forEach((category) => {
    const types: LandingPage['type'][] = ['best', 'top', 'cheap'];

    types.forEach((type) => {
      configs.push({
        keyword: category.title,
        category: category.slug,
        type,
        maxProducts: 12,
      });
    });
  });

  return configs;
}

// Auto-generate landing pages for popular tags
export function generateTagLandingPages(): LandingPageConfig[] {
  const configs: LandingPageConfig[] = [];
  const tagCounts = new Map<string, number>();

  // Count tag frequency
  ITEMS.forEach((item) => {
    item.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  // Get top 20 tags
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag]) => tag);

  topTags.forEach((tag) => {
    const types: LandingPage['type'][] = ['best', 'top'];

    types.forEach((type) => {
      configs.push({
        keyword: tag,
        type,
        maxProducts: 8,
      });
    });
  });

  return configs;
}

// Generate comparison landing pages
export function generateComparisonPages(): LandingPageConfig[] {
  const configs: LandingPageConfig[] = [];
  const categories = CATEGORY_TREE.slice(0, 5); // Top 5 categories

  categories.forEach((category) => {
    configs.push({
      keyword: category.title,
      category: category.slug,
      type: 'comparison',
      maxProducts: 5,
    });
  });

  return configs;
}

// Generate all landing pages
export function generateAllLandingPages(): LandingPage[] {
  const configs = [
    ...generateCategoryLandingPages(),
    ...generateTagLandingPages(),
    ...generateComparisonPages(),
  ];

  return batchGenerateLandingPages(configs);
}

// Get landing page by path
const landingPageStore = new Map<string, LandingPage>();

export function cacheLandingPage(page: LandingPage): void {
  landingPageStore.set(page.path, page);
}

export function getCachedLandingPage(path: string): LandingPage | undefined {
  return landingPageStore.get(path);
}

export function clearLandingPageCache(): void {
  landingPageStore.clear();
}

// Validate landing page
export function validateLandingPage(page: LandingPage): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!page.path || page.path.length === 0) {
    errors.push('Path is required');
  }

  if (!page.title || page.title.length === 0) {
    errors.push('Title is required');
  }

  if (!page.heading || page.heading.length === 0) {
    errors.push('Heading is required');
  }

  if (!page.content || page.content.length < 200) {
    errors.push('Content must be at least 200 characters');
  }

  if (page.productIds.length === 0) {
    errors.push('At least one product is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get landing page stats
export function getLandingPageStats(): {
  total: number;
  byType: Record<LandingPage['type'], number>;
  totalProducts: number;
} {
  const pages = Array.from(landingPageStore.values());
  const byType: Record<LandingPage['type'], number> = {
    best: 0,
    top: 0,
    cheap: 0,
    guide: 0,
    tutorial: 0,
    comparison: 0,
  };

  pages.forEach((page) => {
    byType[page.type]++;
  });

  const totalProducts = pages.reduce((sum, page) => sum + page.productIds.length, 0);

  return {
    total: pages.length,
    byType,
    totalProducts,
  };
}

// Generate sitemap entries for landing pages
export function generateLandingPageSitemapEntries(): Array<{
  url: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}> {
  const pages = Array.from(landingPageStore.values());
  const now = new Date().toISOString().split('T')[0];

  return pages.map((page) => ({
    url: `https://erpvala.com${page.path}`,
    lastmod: now,
    changefreq: 'weekly',
    priority: page.type === 'best' ? 0.8 : 0.7,
  }));
}

// Update landing page products (refresh content)
export function updateLandingPageProducts(path: string): LandingPage | null {
  const page = getCachedLandingPage(path);
  if (!page) return null;

  // Re-filter products based on current data
  const keyword = page.heading.replace(/Best |Top |Cheap |Complete Guide to |Tutorial |Comparison /g, '').toLowerCase();
  const category = page.meta.keywords?.split(',')[0];

  const filteredProducts = ITEMS.filter((item) => {
    const matchesKeyword =
      item.title.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword) ||
      item.tags.some((t) => t.toLowerCase().includes(keyword));

    const matchesCategory = !category || item.category === category;
    return matchesKeyword && matchesCategory;
  });

  const productIds = filteredProducts.slice(0, 12).map((p) => p.id);

  const updatedPage: LandingPage = {
    ...page,
    productIds,
    content: generateExtendedContent(keyword, category || 'all', page.type, filteredProducts),
  };

  cacheLandingPage(updatedPage);
  return updatedPage;
}
