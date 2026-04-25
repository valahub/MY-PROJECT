// SEO Auto Engine
// Dynamic meta tags and schema based on filters

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';
import { generateCompleteMeta } from '../seo/programmatic-seo-engine';
import { generateCategoryItemListSchema } from '../seo/itemlist-schema';

export interface DynamicMetaConfig {
  type: 'category' | 'subcategory' | 'tag' | 'search' | 'product';
  category?: string;
  subcategory?: string;
  tag?: string;
  searchQuery?: string;
  productId?: string;
}

export interface DynamicSEOResult {
  meta: {
    title: string;
    description: string;
    keywords: string;
    canonical: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
  };
  schema: string;
  breadcrumbSchema: string;
}

// Generate dynamic meta tags based on filters
export function generateDynamicMeta(config: DynamicMetaConfig): DynamicSEOResult {
  const baseUrl = 'https://erpvala.com';
  let title = 'Plugins Marketplace - ERP ValaMarket';
  let description = 'Discover high-quality plugins, scripts, templates, and software solutions for your business.';
  let keywords = 'plugins, software, marketplace, templates, scripts';
  let canonical = baseUrl;
  let ogTitle = title;
  let ogDescription = description;
  let ogImage = `${baseUrl}/images/og-default.png`;

  // Customize based on type
  switch (config.type) {
    case 'category':
      if (config.category) {
        const category = CATEGORY_TREE.find((cat) => cat.slug === config.category);
        if (category) {
          title = `${category.title} Plugins - ERP ValaMarket`;
          description = `Browse our collection of ${category.title.toLowerCase()} plugins. Find the perfect ${category.title.toLowerCase()} solution for your needs.`;
          keywords = `${category.title}, ${category.title} plugins, ${category.title} software, marketplace`;
          canonical = `${baseUrl}/plugins/${category.slug}`;
          ogTitle = title;
          ogDescription = description;
        }
      }
      break;

    case 'subcategory':
      if (config.category && config.subcategory) {
        const category = CATEGORY_TREE.find((cat) => cat.slug === config.category);
        const subcategory = category?.subs.find((sub) => sub.toLowerCase() === config.subcategory);
        if (category && subcategory) {
          title = `${subcategory} ${category.title} Plugins - ERP ValaMarket`;
          description = `Explore ${subcategory} ${category.title.toLowerCase()} plugins. Top-rated ${subcategory} solutions for your projects.`;
          keywords = `${subcategory}, ${category.title}, ${subcategory} plugins, ${category.title} software`;
          canonical = `${baseUrl}/plugins/${category.slug}/${subcategory}`;
          ogTitle = title;
          ogDescription = description;
        }
      }
      break;

    case 'tag':
      if (config.tag) {
        title = `${config.tag} Plugins - ERP ValaMarket`;
        description = `Find plugins tagged with ${config.tag}. Discover the best ${config.tag} software solutions.`;
        keywords = `${config.tag}, ${config.tag} plugins, ${config.tag} software, marketplace`;
        canonical = `${baseUrl}/tag/${config.tag}`;
        ogTitle = title;
        ogDescription = description;
      }
      break;

    case 'search':
      if (config.searchQuery) {
        title = `Search: ${config.searchQuery} - ERP ValaMarket`;
        description = `Search results for "${config.searchQuery}". Find the best plugins and software solutions.`;
        keywords = `${config.searchQuery}, search, plugins, software`;
        canonical = `${baseUrl}/search?q=${encodeURIComponent(config.searchQuery)}`;
        ogTitle = title;
        ogDescription = description;
      }
      break;

    case 'product':
      if (config.productId) {
        const product = ITEMS.find((item) => item.id === config.productId);
        if (product) {
          title = `${product.title} - ERP ValaMarket`;
          description = product.description.substring(0, 160);
          keywords = `${product.title}, ${product.category}, ${product.tags.join(', ')}`;
          canonical = `${baseUrl}/marketplace/item/${product.slug}`;
          ogTitle = title;
          ogDescription = description;
          ogImage = product.thumbnail;
        }
      }
      break;
  }

  // Generate schema
  let schema = '';
  let breadcrumbSchema = '';

  if (config.type === 'category' && config.category) {
    const itemListSchema = generateCategoryItemListSchema(config.category);
    schema = `<script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>`;
    
    // Generate breadcrumb schema
    const breadcrumbData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: 'Plugins', item: `${baseUrl}/plugins` },
        { '@type': 'ListItem', position: 3, name: config.category, item: canonical },
      ],
    };
    breadcrumbSchema = `<script type="application/ld+json">${JSON.stringify(breadcrumbData)}</script>`;
  }

  if (config.type === 'product' && config.productId) {
    const product = ITEMS.find((item) => item.id === config.productId);
    if (product) {
      const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description,
        image: product.thumbnail,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviews || 0,
        },
      };
      schema = `<script type="application/ld+json">${JSON.stringify(productSchema)}</script>`;
      
      // Generate breadcrumb schema
      const breadcrumbData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'Plugins', item: `${baseUrl}/plugins` },
          { '@type': 'ListItem', position: 3, name: product.category, item: `${baseUrl}/plugins/${product.category}` },
          { '@type': 'ListItem', position: 4, name: product.title, item: canonical },
        ],
      };
      breadcrumbSchema = `<script type="application/ld+json">${JSON.stringify(breadcrumbData)}</script>`;
    }
  }

  return {
    meta: {
      title,
      description,
      keywords,
      canonical,
      ogTitle,
      ogDescription,
      ogImage,
    },
    schema,
    breadcrumbSchema,
  };
}

// Generate meta tags HTML
export function generateMetaTagsHTML(meta: DynamicSEOResult['meta']): string {
  return `
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}">
    <meta name="keywords" content="${meta.keywords}">
    <link rel="canonical" href="${meta.canonical}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${meta.ogTitle}">
    <meta property="og:description" content="${meta.ogDescription}">
    <meta property="og:image" content="${meta.ogImage}">
    <meta property="og:url" content="${meta.canonical}">
    <meta property="og:type" content="website">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${meta.ogTitle}">
    <meta name="twitter:description" content="${meta.ogDescription}">
    <meta name="twitter:image" content="${meta.ogImage}">
  `;
}

// Generate complete SEO head
export function generateSEOHead(config: DynamicMetaConfig): string {
  const result = generateDynamicMeta(config);
  
  return `
    ${generateMetaTagsHTML(result.meta)}
    ${result.schema}
    ${result.breadcrumbSchema}
  `;
}

// Generate auto-indexable URL
export function generateAutoIndexableURL(config: DynamicMetaConfig): string {
  const baseUrl = 'https://erpvala.com';

  switch (config.type) {
    case 'category':
      return config.category ? `${baseUrl}/plugins/${config.category}` : baseUrl;
    case 'subcategory':
      return config.category && config.subcategory
        ? `${baseUrl}/plugins/${config.category}/${config.subcategory}`
        : baseUrl;
    case 'tag':
      return config.tag ? `${baseUrl}/tag/${config.tag}` : baseUrl;
    case 'search':
      return config.searchQuery
        ? `${baseUrl}/search?q=${encodeURIComponent(config.searchQuery)}`
        : baseUrl;
    case 'product':
      return config.productId
        ? `${baseUrl}/marketplace/item/${config.productId}`
        : baseUrl;
    default:
      return baseUrl;
  }
}

// Validate SEO configuration
export function validateSEOConfig(config: DynamicMetaConfig): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!config.type) {
    issues.push('Missing type');
  }

  if (config.type === 'category' && !config.category) {
    issues.push('Category type requires category parameter');
  }

  if (config.type === 'subcategory' && (!config.category || !config.subcategory)) {
    issues.push('Subcategory type requires category and subcategory parameters');
  }

  if (config.type === 'tag' && !config.tag) {
    issues.push('Tag type requires tag parameter');
  }

  if (config.type === 'search' && !config.searchQuery) {
    issues.push('Search type requires searchQuery parameter');
  }

  if (config.type === 'product' && !config.productId) {
    issues.push('Product type requires productId parameter');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// Get SEO statistics
export function getSEOStatistics(): {
  totalCategories: number;
  totalSubcategories: number;
  totalTags: number;
  totalProducts: number;
  indexableURLs: number;
} {
  const totalCategories = CATEGORY_TREE.length;
  const totalSubcategories = CATEGORY_TREE.reduce((sum, cat) => sum + cat.subs.length, 0);
  
  const allTags = new Set<string>();
  ITEMS.forEach((item) => {
    item.tags.forEach((tag) => allTags.add(tag));
  });
  const totalTags = allTags.size;
  const totalProducts = ITEMS.length;

  const indexableURLs = totalCategories + totalSubcategories + totalTags + totalProducts;

  return {
    totalCategories,
    totalSubcategories,
    totalTags,
    totalProducts,
    indexableURLs,
  };
}
