// Internal Linking Network System
// Builds strong internal linking graph for ranking boost

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';
import { BLOG_POSTS } from '../blog-data';

export interface InternalLink {
  from: string;
  to: string;
  anchorText: string;
  type: 'category' | 'tag' | 'author' | 'product' | 'blog' | 'related';
  priority: number;
}

export interface LinkGraph {
  nodes: Map<string, { type: string; title: string }>;
  edges: InternalLink[];
}

const linkGraph: LinkGraph = {
  nodes: new Map(),
  edges: [],
};

// Initialize link graph with all pages
export function initializeLinkGraph(): void {
  linkGraph.nodes.clear();
  linkGraph.edges = [];

  // Add product nodes
  ITEMS.forEach((item) => {
    linkGraph.nodes.set(`/marketplace/item/${item.slug}`, {
      type: 'product',
      title: item.title,
    });
  });

  // Add category nodes
  CATEGORY_TREE.forEach((cat) => {
    linkGraph.nodes.set(`/marketplace/category?category=${cat.slug}`, {
      type: 'category',
      title: cat.title,
    });
  });

  // Add blog nodes
  BLOG_POSTS.forEach((post) => {
    linkGraph.nodes.set(`/marketplace/blog/${post.slug}`, {
      type: 'blog',
      title: post.title,
    });
  });
}

// Generate internal links for a product
export function generateProductLinks(productId: string): InternalLink[] {
  const product = ITEMS.find((item) => item.id === productId);
  if (!product) return [];

  const links: InternalLink[] = [];
  const productPath = `/marketplace/item/${product.slug}`;

  // Link to category
  links.push({
    from: productPath,
    to: `/marketplace/category?category=${product.category}`,
    anchorText: product.category,
    type: 'category',
    priority: 1.0,
  });

  // Link to tags
  product.tags.slice(0, 5).forEach((tag) => {
    links.push({
      from: productPath,
      to: `/marketplace/tag/${tag.toLowerCase()}`,
      anchorText: tag,
      type: 'tag',
      priority: 0.8,
    });
  });

  // Link to author
  if (product.author) {
    const authorSlug = product.author.toLowerCase().replace(/ /g, '-');
    links.push({
      from: productPath,
      to: `/marketplace/author/${authorSlug}`,
      anchorText: product.author,
      type: 'author',
      priority: 0.7,
    });
  }

  // Link to related products (same category)
  const relatedProducts = ITEMS.filter(
    (item) => item.category === product.category && item.id !== product.id
  ).slice(0, 3);

  relatedProducts.forEach((related) => {
    links.push({
      from: productPath,
      to: `/marketplace/item/${related.slug}`,
      anchorText: related.title,
      type: 'related',
      priority: 0.6,
    });
  });

  // Link to related blogs
  const relatedBlogs = BLOG_POSTS.filter(
    (post) =>
      post.category === product.category ||
      post.tags.some((tag) => product.tags.includes(tag))
  ).slice(0, 2);

  relatedBlogs.forEach((blog) => {
    links.push({
      from: productPath,
      to: `/marketplace/blog/${blog.slug}`,
      anchorText: blog.title,
      type: 'blog',
      priority: 0.5,
    });
  });

  return links;
}

// Generate internal links for a category
export function generateCategoryLinks(categorySlug: string): InternalLink[] {
  const category = CATEGORY_TREE.find((cat) => cat.slug === categorySlug);
  if (!category) return [];

  const links: InternalLink[] = [];
  const categoryPath = `/marketplace/category?category=${categorySlug}`;

  // Link to subcategories
  category.subs.slice(0, 5).forEach((sub) => {
    const subSlug = sub.toLowerCase().replace(/ /g, '-');
    links.push({
      from: categoryPath,
      to: `/marketplace/category?category=${categorySlug}&subcategory=${subSlug}`,
      anchorText: sub,
      type: 'category',
      priority: 0.9,
    });
  });

  // Link to top products in category
  const topProducts = ITEMS.filter((item) => item.category === category.slug)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  topProducts.forEach((product) => {
    links.push({
      from: categoryPath,
      to: `/marketplace/item/${product.slug}`,
      anchorText: product.title,
      type: 'product',
      priority: 0.8,
    });
  });

  // Link to related categories
  const relatedCategories = CATEGORY_TREE.filter(
    (cat) => cat.slug !== category.slug
  ).slice(0, 3);

  relatedCategories.forEach((cat) => {
    links.push({
      from: categoryPath,
      to: `/marketplace/category?category=${cat.slug}`,
      anchorText: cat.title,
      type: 'category',
      priority: 0.6,
    });
  });

  return links;
}

// Generate internal links for a blog post
export function generateBlogLinks(blogSlug: string): InternalLink[] {
  const blog = BLOG_POSTS.find((post) => post.slug === blogSlug);
  if (!blog) return [];

  const links: InternalLink[] = [];
  const blogPath = `/marketplace/blog/${blog.slug}`;

  // Link to blog category
  links.push({
    from: blogPath,
    to: `/marketplace/blog?category=${blog.category}`,
    anchorText: blog.category,
    type: 'category',
    priority: 1.0,
  });

  // Link to tags
  blog.tags.slice(0, 5).forEach((tag) => {
    links.push({
      from: blogPath,
      to: `/marketplace/blog?tag=${tag}`,
      anchorText: tag,
      type: 'tag',
      priority: 0.8,
    });
  });

  // Link to related products
  blog.relatedProducts.slice(0, 3).forEach((productId) => {
    const product = ITEMS.find((item) => item.id === productId);
    if (product) {
      links.push({
        from: blogPath,
        to: `/marketplace/item/${product.slug}`,
        anchorText: product.title,
        type: 'product',
        priority: 0.9,
      });
    }
  });

  // Link to related blogs
  const relatedBlogs = BLOG_POSTS.filter(
    (post) =>
      post.category === blog.category &&
      post.id !== blog.id
  ).slice(0, 3);

  relatedBlogs.forEach((related) => {
    links.push({
      from: blogPath,
      to: `/marketplace/blog/${related.slug}`,
      anchorText: related.title,
      type: 'blog',
      priority: 0.7,
    });
  });

  return links;
}

// Generate "related searches" links
export function generateRelatedSearchLinks(keyword: string): InternalLink[] {
  const links: InternalLink[] = [];
  const modifiers = ['best', 'top', 'cheap', 'free', 'premium'];

  modifiers.forEach((mod) => {
    const searchPath = `/${mod}/${keyword.toLowerCase().replace(/ /g, '-')}`;
    links.push({
      from: '/search',
      to: searchPath,
      anchorText: `${mod} ${keyword}`,
      type: 'related',
      priority: 0.7,
    });
  });

  return links;
}

// Generate "people also search" links
export function generatePeopleAlsoSearchLinks(keyword: string): InternalLink[] {
  const links: InternalLink[] = [];
  const relatedKeywords = [
    `${keyword} tutorial`,
    `${keyword} guide`,
    `${keyword} alternatives`,
    `${keyword} reviews`,
  ];

  relatedKeywords.forEach((related) => {
    const searchPath = `/search?q=${encodeURIComponent(related)}`;
    links.push({
      from: '/search',
      to: searchPath,
      anchorText: related,
      type: 'related',
      priority: 0.6,
    });
  });

  return links;
}

// Build complete internal link graph
export function buildLinkGraph(): LinkGraph {
  initializeLinkGraph();

  // Add product links
  ITEMS.forEach((item) => {
    const links = generateProductLinks(item.id);
    linkGraph.edges.push(...links);
  });

  // Add category links
  CATEGORY_TREE.forEach((cat) => {
    const links = generateCategoryLinks(cat.slug);
    linkGraph.edges.push(...links);
  });

  // Add blog links
  BLOG_POSTS.forEach((post) => {
    const links = generateBlogLinks(post.slug);
    linkGraph.edges.push(...links);
  });

  return linkGraph;
}

// Get internal links for a specific page
export function getPageLinks(path: string): InternalLink[] {
  return linkGraph.edges.filter((link) => link.from === path);
}

// Get inbound links for a specific page
export function getInboundLinks(path: string): InternalLink[] {
  return linkGraph.edges.filter((link) => link.to === path);
}

// Calculate page authority based on inbound links
export function calculatePageAuthority(path: string): number {
  const inboundLinks = getInboundLinks(path);
  let authority = 0;

  inboundLinks.forEach((link) => {
    authority += link.priority;
  });

  return Math.min(authority, 10); // Cap at 10
}

// Get most linked pages (for sitemap priority)
export function getMostLinkedPages(limit: number = 100): Array<{
  path: string;
  inboundCount: number;
  authority: number;
}> {
  const allPaths = Array.from(linkGraph.nodes.keys());

  return allPaths
    .map((path) => ({
      path,
      inboundCount: getInboundLinks(path).length,
      authority: calculatePageAuthority(path),
    }))
    .sort((a, b) => b.authority - a.authority)
    .slice(0, limit);
}

// Generate breadcrumb links
export function generateBreadcrumbLinks(path: string): Array<{
  path: string;
  title: string;
}> {
  const breadcrumbs: Array<{ path: string; title: string }> = [];

  // Home
  breadcrumbs.push({ path: '/', title: 'Home' });

  // Marketplace
  if (path.startsWith('/marketplace')) {
    breadcrumbs.push({ path: '/marketplace', title: 'Marketplace' });
  }

  // Category
  if (path.includes('/category')) {
    const categoryMatch = path.match(/category=([^&]+)/);
    if (categoryMatch) {
      const category = CATEGORY_TREE.find((cat) => cat.slug === categoryMatch[1]);
      if (category) {
        breadcrumbs.push({
          path: `/marketplace/category?category=${category.slug}`,
          title: category.title,
        });
      }
    }
  }

  // Blog
  if (path.includes('/blog')) {
    breadcrumbs.push({ path: '/marketplace/blog', title: 'Blog' });
  }

  // Current page
  const node = linkGraph.nodes.get(path);
  if (node) {
    breadcrumbs.push({ path, title: node.title });
  }

  return breadcrumbs;
}

// Generate HTML for internal links
export function generateLinkHtml(link: InternalLink): string {
  return `<a href="${link.to}" title="${link.anchorText}" data-link-type="${link.type}">${link.anchorText}</a>`;
}

// Generate related searches HTML
export function generateRelatedSearchesHtml(keyword: string): string {
  const links = generateRelatedSearchLinks(keyword);
  const html = links.map((link) => generateLinkHtml(link)).join(', ');
  return `<div class="related-searches">Related searches: ${html}</div>`;
}

// Generate people also search HTML
export function generatePeopleAlsoSearchHtml(keyword: string): string {
  const links = generatePeopleAlsoSearchLinks(keyword);
  const html = links.map((link) => generateLinkHtml(link)).join(', ');
  return `<div class="people-also-search">People also search: ${html}</div>`;
}

// Validate internal link
export function validateInternalLink(link: InternalLink): boolean {
  // Check if target exists
  if (!linkGraph.nodes.has(link.to)) {
    return false;
  }

  // Check if source exists
  if (!linkGraph.nodes.has(link.from)) {
    return false;
  }

  // Check anchor text
  if (!link.anchorText || link.anchorText.length === 0) {
    return false;
  }

  return true;
}

// Find broken internal links
export function findBrokenLinks(): InternalLink[] {
  return linkGraph.edges.filter((link) => !validateInternalLink(link));
}

// Auto-fix broken links
export function fixBrokenLinks(): number {
  const brokenLinks = findBrokenLinks();
  let fixedCount = 0;

  brokenLinks.forEach((link) => {
    // Try to find similar target
    const similarTargets = Array.from(linkGraph.nodes.keys()).filter((path) =>
      path.includes(link.to.split('/').slice(-1)[0])
    );

    if (similarTargets.length > 0) {
      link.to = similarTargets[0];
      fixedCount++;
    } else {
      // Remove broken link
      const index = linkGraph.edges.indexOf(link);
      if (index > -1) {
        linkGraph.edges.splice(index, 1);
      }
    }
  });

  return fixedCount;
}

// Get link graph statistics
export function getLinkGraphStats(): {
  totalNodes: number;
  totalEdges: number;
  averageLinksPerPage: number;
  mostLinkedPage: string;
  leastLinkedPage: string;
} {
  const totalNodes = linkGraph.nodes.size;
  const totalEdges = linkGraph.edges.length;
  const averageLinksPerPage = totalNodes > 0 ? totalEdges / totalNodes : 0;

  const pageLinks = Array.from(linkGraph.nodes.keys()).map((path) => ({
    path,
    inboundCount: getInboundLinks(path).length,
  }));

  const mostLinked = pageLinks.sort((a, b) => b.inboundCount - a.inboundCount)[0];
  const leastLinked = pageLinks.sort((a, b) => a.inboundCount - b.inboundCount)[0];

  return {
    totalNodes,
    totalEdges,
    averageLinksPerPage,
    mostLinkedPage: mostLinked?.path || '',
    leastLinkedPage: leastLinked?.path || '',
  };
}

// Export link graph as JSON
export function exportLinkGraph(): string {
  return JSON.stringify({
    nodes: Array.from(linkGraph.nodes.entries()),
    edges: linkGraph.edges,
  }, null, 2);
}

// Import link graph from JSON
export function importLinkGraph(json: string): void {
  const data = JSON.parse(json);
  linkGraph.nodes = new Map(data.nodes);
  linkGraph.edges = data.edges;
}
