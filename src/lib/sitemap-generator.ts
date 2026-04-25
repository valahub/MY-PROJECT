// Ultra Sitemap System
// Generates split sitemaps for 10,000+ products

import { ITEMS, CATEGORY_TREE } from './marketplace-data';
import { BLOG_POSTS } from './blog-data';
import { generateAllPaths } from './seo/page-generation-engine';

const BASE_URL = 'https://erpvala.com';
const MAX_URLS_PER_SITEMAP = 50000; // Google limit

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

interface SitemapIndexEntry {
  loc: string;
  lastmod: string;
}

function formatXmlDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Generate product sitemap (split if needed)
export function generateProductSitemaps(): Array<{ name: string; content: string }> {
  const sitemaps: Array<{ name: string; content: string }> = [];
  const productEntries: SitemapEntry[] = ITEMS.map((item) => ({
    url: `${BASE_URL}/marketplace/item/${item.slug}`,
    lastmod: formatXmlDate(new Date()),
    changefreq: 'weekly',
    priority: 0.8,
  }));

  // Split if exceeds limit
  const chunks = chunkArray(productEntries, MAX_URLS_PER_SITEMAP);

  chunks.forEach((chunk, index) => {
    const name = chunks.length > 1 ? `sitemap-products-${index + 1}.xml` : 'sitemap-products.xml';
    sitemaps.push({
      name,
      content: generateSitemapXml(chunk),
    });
  });

  return sitemaps;
}

// Generate category sitemap
export function generateCategorySitemap(): { name: string; content: string } {
  const entries: SitemapEntry[] = CATEGORY_TREE.map((cat) => ({
    url: `${BASE_URL}/marketplace/category?category=${cat.slug}`,
    lastmod: formatXmlDate(new Date()),
    changefreq: 'daily',
    priority: 0.9,
  }));

  // Add subcategory entries
  CATEGORY_TREE.forEach((cat) => {
    cat.subs.forEach((sub) => {
      const subSlug = sub.toLowerCase().replace(/ /g, '-');
      entries.push({
        url: `${BASE_URL}/marketplace/category?category=${cat.slug}&subcategory=${subSlug}`,
        lastmod: formatXmlDate(new Date()),
        changefreq: 'daily',
        priority: 0.8,
      });
    });
  });

  return {
    name: 'sitemap-categories.xml',
    content: generateSitemapXml(entries),
  };
}

// Generate tag sitemap (split if needed)
export function generateTagSitemaps(): Array<{ name: string; content: string }> {
  const sitemaps: Array<{ name: string; content: string }> = [];
  const tags = new Set<string>();
  
  ITEMS.forEach((item) => {
    item.tags.forEach((tag) => tags.add(tag));
  });

  const tagEntries: SitemapEntry[] = Array.from(tags).map((tag) => ({
    url: `${BASE_URL}/marketplace/tag/${tag.toLowerCase()}`,
    lastmod: formatXmlDate(new Date()),
    changefreq: 'weekly',
    priority: 0.7,
  }));

  const chunks = chunkArray(tagEntries, MAX_URLS_PER_SITEMAP);

  chunks.forEach((chunk, index) => {
    const name = chunks.length > 1 ? `sitemap-tags-${index + 1}.xml` : 'sitemap-tags.xml';
    sitemaps.push({
      name,
      content: generateSitemapXml(chunk),
    });
  });

  return sitemaps;
}

// Generate author sitemap
export function generateAuthorSitemap(): { name: string; content: string } {
  const authors = new Set<string>();
  
  ITEMS.forEach((item) => {
    if (item.author) {
      authors.add(item.author.toLowerCase().replace(/ /g, '-'));
    }
  });

  const entries: SitemapEntry[] = Array.from(authors).map((author) => ({
    url: `${BASE_URL}/marketplace/author/${author}`,
    lastmod: formatXmlDate(new Date()),
    changefreq: 'weekly',
    priority: 0.6,
  }));

  return {
    name: 'sitemap-authors.xml',
    content: generateSitemapXml(entries),
  };
}

// Generate blog sitemap
export function generateBlogSitemap(): { name: string; content: string } {
  const entries: SitemapEntry[] = BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/marketplace/blog/${post.slug}`,
    lastmod: formatXmlDate(new Date(post.updatedAt)),
    changefreq: 'weekly',
    priority:  0.8,
  }));

  return {
    name: 'sitemap-blogs.xml',
    content: generateSitemapXml(entries),
  };
}

// Generate landing page sitemap
export function generateLandingPageSitemap(): { name: string; content: string } {
  const paths = generateAllPaths().filter((p) => p.type === 'landing');
  
  const entries: SitemapEntry[] = paths.map((path) => ({
    url: `${BASE_URL}${path.path}`,
    lastmod: formatXmlDate(new Date()),
    changefreq: 'weekly',
    priority: 0.7,
  }));

  return {
    name: 'sitemap-landing.xml',
    content: generateSitemapXml(entries),
  };
}

// Generate complete sitemap index
export function generateSitemapIndex(): string {
  const sitemaps: SitemapIndexEntry[] = [];

  // Add product sitemaps
  const productSitemaps = generateProductSitemaps();
  productSitemaps.forEach((sitemap) => {
    sitemaps.push({
      loc: `${BASE_URL}/${sitemap.name}`,
      lastmod: formatXmlDate(new Date()),
    });
  });

  // Add other sitemaps
  sitemaps.push({ loc: `${BASE_URL}/sitemap-categories.xml`, lastmod: formatXmlDate(new Date()) });
  sitemaps.push({ loc: `${BASE_URL}/sitemap-authors.xml`, lastmod: formatXmlDate(new Date()) });
  sitemaps.push({ loc: `${BASE_URL}/sitemap-blogs.xml`, lastmod: formatXmlDate(new Date()) });
  sitemaps.push({ loc: `${BASE_URL}/sitemap-landing.xml`, lastmod: formatXmlDate(new Date()) });

  // Add tag sitemaps
  const tagSitemaps = generateTagSitemaps();
  tagSitemaps.forEach((sitemap) => {
    sitemaps.push({
      loc: `${BASE_URL}/${sitemap.name}`,
      lastmod: formatXmlDate(new Date()),
    });
  });

  const xmlSitemaps = sitemaps
    .map(
      (sitemap) => `  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlSitemaps}
</sitemapindex>`;
}

// Generate sitemap XML
function generateSitemapXml(entries: SitemapEntry[]): string {
  const xmlEntries = entries
    .map(
      (entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

// Chunk array into smaller arrays
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Generate all sitemaps
export function generateAllSitemaps(): Map<string, string> {
  const sitemapMap = new Map<string, string>();

  // Product sitemaps
  generateProductSitemaps().forEach((sitemap) => {
    sitemapMap.set(sitemap.name, sitemap.content);
  });

  // Category sitemap
  const categorySitemap = generateCategorySitemap();
  sitemapMap.set(categorySitemap.name, categorySitemap.content);

  // Tag sitemaps
  generateTagSitemaps().forEach((sitemap) => {
    sitemapMap.set(sitemap.name, sitemap.content);
  });

  // Author sitemap
  const authorSitemap = generateAuthorSitemap();
  sitemapMap.set(authorSitemap.name, authorSitemap.content);

  // Blog sitemap
  const blogSitemap = generateBlogSitemap();
  sitemapMap.set(blogSitemap.name, blogSitemap.content);

  // Landing page sitemap
  const landingSitemap = generateLandingPageSitemap();
  sitemapMap.set(landingSitemap.name, landingSitemap.content);

  // Sitemap index
  sitemapMap.set('sitemap.xml', generateSitemapIndex());

  return sitemapMap;
}

// Get sitemap statistics
export function getSitemapStats(): {
  totalSitemaps: number;
  totalUrls: number;
  byType: Record<string, number>;
} {
  const allSitemaps = generateAllSitemaps();
  const totalSitemaps = allSitemaps.size;
  let totalUrls = 0;
  const byType: Record<string, number> = {};

  allSitemaps.forEach((content, name) => {
    if (name === 'sitemap.xml') return; // Skip index
    
    const urlCount = (content.match(/<url>/g) || []).length;
    totalUrls += urlCount;

    const type = name.replace('sitemap-', '').replace('.xml', '').split('-')[0];
    byType[type] = (byType[type] || 0) + urlCount;
  });

  return {
    totalSitemaps,
    totalUrls,
    byType,
  };
}

// Validate sitemap XML
export function validateSitemap(xml: string): boolean {
  return xml.includes('<?xml version="1.0"') && 
         xml.includes('<urlset') && 
         xml.includes('</urlset>');
}

// Compress sitemap (for large sitemaps)
export function compressSitemap(xml: string): string {
  // Remove unnecessary whitespace
  return xml.replace(/>\s+</g, '><').trim();
}
