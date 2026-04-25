// Programmatic SEO Meta Engine
// Auto-generates SEO meta for every page type

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';
import { BLOG_POSTS } from '../blog-data';

export interface SEOMeta {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export interface PageContext {
  type: 'product' | 'category' | 'tag' | 'author' | 'blog' | 'landing';
  slug?: string;
  category?: string;
  subcategory?: string;
  tag?: string;
  author?: string;
  query?: string;
}

const BRAND = 'ERP Vala';
const BASE_URL = 'https://erpvala.com';

// Title templates
const TITLE_TEMPLATES = {
  product: '{keyword} – Buy {productType} Online | {brand}',
  category: '{category} – {count}+ {items} | {brand}',
  tag: 'Best {tag} Scripts & Plugins | {brand}',
  author: '{author} – Top {brand} Author | {brand}',
  blog: '{title} | {brand} Blog',
  landing: '{keyword} – Top Rated {category} | {brand}',
};

// Description templates
const DESCRIPTION_TEMPLATES = {
  product: 'Buy {keyword} with top-rated {category}. {sales}+ users trusted. Instant download from {brand}.',
  category: 'Discover {count}+ {category} including {topItems}. Download instantly from {brand}.',
  tag: 'Find top-rated {tag} scripts, plugins, and templates. {count} items available with instant download from {brand}.',
  author: 'Browse {count}+ products by {author}. {rating}★ average rating. Trusted by {sales}+ users.',
  blog: '{excerpt} Read more on {brand} blog.',
  landing: 'Discover the best {keyword} for {category}. Top-rated solutions with instant download from {brand}.',
};

// Generate product SEO meta
export function generateProductMeta(productId: string): SEOMeta {
  const product = ITEMS.find((item) => item.id === productId);
  if (!product) {
    return generateFallbackMeta();
  }

  const keyword = product.title;
  const productType = product.subcategory;
  const sales = product.reviews || 100;

  const title = TITLE_TEMPLATES.product
    .replace('{keyword}', keyword)
    .replace('{productType}', productType)
    .replace('{brand}', BRAND);

  const description = DESCRIPTION_TEMPLATES.product
    .replace('{keyword}', keyword)
    .replace('{category}', product.category)
    .replace('{sales}', sales.toString())
    .replace('{brand}', BRAND);

  const keywords = [
    product.category,
    product.subcategory,
    ...product.tags,
    `buy ${product.subcategory}`,
    `best ${product.category}`,
    product.title.toLowerCase(),
  ].join(', ');

  return {
    title,
    description,
    keywords,
    canonical: `${BASE_URL}/marketplace/item/${product.slug}`,
    ogTitle: title,
    ogDescription: description,
    ogImage: product.thumbnail,
    twitterCard: 'summary_large_image',
  };
}

// Generate category SEO meta
export function generateCategoryMeta(categorySlug: string, subcategorySlug?: string): SEOMeta {
  const category = CATEGORY_TREE.find((cat) => cat.slug === categorySlug);
  if (!category) {
    return generateFallbackMeta();
  }

  const count = category.count;
  const topItems = category.subs.slice(0, 3).join(', ');
  const categoryName = subcategorySlug 
    ? subcategorySlug.replace(/-/g, ' ')
    : category.title;

  const title = TITLE_TEMPLATES.category
    .replace('{category}', categoryName)
    .replace('{count}', count.toString())
    .replace('{items}', subcategorySlug ? 'items' : 'products')
    .replace('{brand}', BRAND);

  const description = DESCRIPTION_TEMPLATES.category
    .replace('{category}', categoryName)
    .replace('{count}', count.toString())
    .replace('{topItems}', topItems)
    .replace('{brand}', BRAND);

  const keywords = [
    categoryName,
    `buy ${categoryName}`,
    `best ${categoryName}`,
    category.title,
    ...category.subs.slice(0, 5),
  ].join(', ');

  const canonical = subcategorySlug
    ? `${BASE_URL}/marketplace/category?category=${categorySlug}&subcategory=${subcategorySlug}`
    : `${BASE_URL}/marketplace/category?category=${categorySlug}`;

  return {
    title,
    description,
    keywords,
    canonical,
    ogTitle: title,
    ogDescription: description,
  };
}

// Generate tag SEO meta
export function generateTagMeta(tag: string): SEOMeta {
  const tagItems = ITEMS.filter((item) =>
    item.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
  const count = tagItems.length;

  const title = TITLE_TEMPLATES.tag
    .replace('{tag}', tag)
    .replace('{brand}', BRAND);

  const description = DESCRIPTION_TEMPLATES.tag
    .replace('{tag}', tag)
    .replace('{count}', count.toString())
    .replace('{brand}', BRAND);

  const keywords = [
    tag,
    `${tag} scripts`,
    `${tag} plugins`,
    `best ${tag}`,
    `top ${tag}`,
  ].join(', ');

  return {
    title,
    description,
    keywords,
    canonical: `${BASE_URL}/marketplace/tag/${tag}`,
    ogTitle: title,
    ogDescription: description,
  };
}

// Generate author SEO meta
export function generateAuthorMeta(authorSlug: string): SEOMeta {
  const authorName = authorSlug.replace(/-/g, ' ');
  const authorItems = ITEMS.filter((item) =>
    item.author?.toLowerCase().replace(/ /g, '-') === authorSlug
  );
  const count = authorItems.length;
  const avgRating = authorItems.length > 0
    ? (authorItems.reduce((sum, item) => sum + item.rating, 0) / authorItems.length).toFixed(1)
    : '5.0';
  const totalSales = authorItems.reduce((sum, item) => sum + (item.reviews || 0), 0);

  const title = TITLE_TEMPLATES.author
    .replace('{author}', authorName)
    .replace('{brand}', BRAND);

  const description = DESCRIPTION_TEMPLATES.author
    .replace('{count}', count.toString())
    .replace('{author}', authorName)
    .replace('{rating}', avgRating)
    .replace('{sales}', totalSales.toString())
    .replace('{brand}', BRAND);

  const keywords = [
    authorName,
    `${authorName} plugins`,
    `${authorName} scripts`,
    `best author ${authorName}`,
    `top ${authorName}`,
  ].join(', ');

  return {
    title,
    description,
    keywords,
    canonical: `${BASE_URL}/marketplace/author/${authorSlug}`,
    ogTitle: title,
    ogDescription: description,
  };
}

// Generate blog SEO meta
export function generateBlogMeta(blogSlug: string): SEOMeta {
  const blog = BLOG_POSTS.find((post) => post.slug === blogSlug);
  if (!blog) {
    return generateFallbackMeta();
  }

  const title = TITLE_TEMPLATES.blog
    .replace('{title}', blog.title)
    .replace('{brand}', BRAND);

  const description = DESCRIPTION_TEMPLATES.blog
    .replace('{excerpt}', blog.excerpt)
    .replace('{brand}', BRAND);

  const keywords = [
    blog.category,
    ...blog.tags,
    blog.title.toLowerCase(),
    `${blog.category} tutorial`,
    `${blog.category} guide`,
  ].join(', ');

  return {
    title,
    description,
    keywords,
    canonical: `${BASE_URL}/marketplace/blog/${blog.slug}`,
    ogTitle: title,
    ogDescription: description,
    twitterCard: 'summary_large_image',
  };
}

// Generate landing page SEO meta
export function generateLandingMeta(keyword: string, category?: string): SEOMeta {
  const categoryName = category || 'products';
  const count = ITEMS.filter((item) =>
    item.title.toLowerCase().includes(keyword.toLowerCase()) ||
    item.tags.some((t) => t.toLowerCase().includes(keyword.toLowerCase()))
  ).length;

  const title = TITLE_TEMPLATES.landing
    .replace('{keyword}', keyword)
    .replace('{category}', categoryName)
    .replace('{brand}', BRAND);

  const description = DESCRIPTION_TEMPLATES.landing
    .replace('{keyword}', keyword)
    .replace('{category}', categoryName)
    .replace('{brand}', BRAND);

  const keywords = [
    keyword,
    `best ${keyword}`,
    `top ${keyword}`,
    `cheap ${keyword}`,
    categoryName,
  ].join(', ');

  return {
    title,
    description,
    keywords,
    canonical: `${BASE_URL}/${keyword.toLowerCase().replace(/ /g, '-')}`,
    ogTitle: title,
    ogDescription: description,
  };
}

// Generate meta based on page context
export function generateMetaFromContext(context: PageContext): SEOMeta {
  switch (context.type) {
    case 'product':
      if (!context.slug) return generateFallbackMeta();
      return generateProductMeta(context.slug);
    case 'category':
      return generateCategoryMeta(context.category || '', context.subcategory);
    case 'tag':
      if (!context.tag) return generateFallbackMeta();
      return generateTagMeta(context.tag);
    case 'author':
      if (!context.author) return generateFallbackMeta();
      return generateAuthorMeta(context.author);
    case 'blog':
      if (!context.slug) return generateFallbackMeta();
      return generateBlogMeta(context.slug);
    case 'landing':
      if (!context.query) return generateFallbackMeta();
      return generateLandingMeta(context.query, context.category);
    default:
      return generateFallbackMeta();
  }
}

// Generate fallback meta for errors
function generateFallbackMeta(): SEOMeta {
  return {
    title: `${BRAND} - Digital Products Marketplace`,
    description: `Discover 600,000+ digital assets including code, themes, plugins, and more on ${BRAND}. Instant download.`,
    keywords: 'marketplace, digital products, code, themes, plugins',
    canonical: BASE_URL,
    noindex: true,
  };
}

// Generate long tail keywords
export function generateLongTailKeywords(baseKeyword: string, category?: string): string[] {
  const modifiers = [
    'best',
    'top',
    'cheap',
    'affordable',
    'premium',
    'free',
    'open source',
    'professional',
    'enterprise',
  ];

  const suffixes = [
    'for business',
    'for startups',
    'for ecommerce',
    '2026',
    'online',
    'download',
    'script',
    'plugin',
    'template',
  ];

  const keywords: string[] = [];

  modifiers.forEach((mod) => {
    keywords.push(`${mod} ${baseKeyword}`);
  });

  suffixes.forEach((suffix) => {
    keywords.push(`${baseKeyword} ${suffix}`);
  });

  if (category) {
    keywords.push(`${baseKeyword} for ${category}`);
  }

  return keywords;
}

// Optimize title length (max 60 chars)
export function optimizeTitleLength(title: string, max: number = 60): string {
  if (title.length <= max) return title;
  return title.slice(0, max - 3).trim() + '...';
}

// Optimize description length (max 160 chars)
export function optimizeDescriptionLength(description: string, max: number = 160): string {
  if (description.length <= max) return description;
  return description.slice(0, max - 3).trim() + '...';
}

// Generate complete SEO meta with optimizations
export function generateCompleteMeta(context: PageContext): SEOMeta {
  const meta = generateMetaFromContext(context);
  
  return {
    ...meta,
    title: optimizeTitleLength(meta.title),
    description: optimizeDescriptionLength(meta.description),
  };
}

// Batch generate meta for multiple pages
export function batchGenerateMeta(contexts: PageContext[]): Map<string, SEOMeta> {
  const metaMap = new Map<string, SEOMeta>();
  
  contexts.forEach((context) => {
    const key = `${context.type}-${context.slug || context.category || context.tag || context.author || context.query || 'default'}`;
    metaMap.set(key, generateCompleteMeta(context));
  });
  
  return metaMap;
}

// Validate SEO meta
export function validateMeta(meta: SEOMeta): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!meta.title || meta.title.length === 0) {
    errors.push('Title is required');
  }

  if (meta.title && meta.title.length > 60) {
    errors.push('Title exceeds 60 characters');
  }

  if (!meta.description || meta.description.length === 0) {
    errors.push('Description is required');
  }

  if (meta.description && meta.description.length > 160) {
    errors.push('Description exceeds 160 characters');
  }

  if (!meta.canonical) {
    errors.push('Canonical URL is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Export meta as HTML head tags
export function metaToHtmlHead(meta: SEOMeta): string {
  const tags: string[] = [];

  tags.push(`<title>${meta.title}</title>`);
  tags.push(`<meta name="description" content="${meta.description}">`);
  tags.push(`<meta name="keywords" content="${meta.keywords}">`);
  tags.push(`<link rel="canonical" href="${meta.canonical}">`);

  if (meta.ogTitle) {
    tags.push(`<meta property="og:title" content="${meta.ogTitle}">`);
  }

  if (meta.ogDescription) {
    tags.push(`<meta property="og:description" content="${meta.ogDescription}">`);
  }

  if (meta.ogImage) {
    tags.push(`<meta property="og:image" content="${meta.ogImage}">`);
  }

  if (meta.twitterCard) {
    tags.push(`<meta name="twitter:card" content="${meta.twitterCard}">`);
  }

  if (meta.noindex) {
    tags.push(`<meta name="robots" content="noindex">`);
  }

  if (meta.nofollow) {
    tags.push(`<meta name="robots" content="nofollow">`);
  }

  return tags.join('\n');
}
