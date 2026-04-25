// Auto Blog-Product Linking System
// Connects blog posts to products and vice versa for SEO boost

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';
import { BLOG_POSTS } from '../blog-data';

export interface BlogProductLink {
  blogId: string;
  productId: string;
  linkType: 'related' | 'featured' | 'mentioned';
  relevanceScore: number;
}

export interface LinkSuggestion {
  blogId: string;
  blogTitle: string;
  productId: string;
  productTitle: string;
  reason: string;
  score: number;
}

// Link cache
const blogProductLinks = new Map<string, BlogProductLink[]>();
const linkSuggestions = new Map<string, LinkSuggestion[]>();

// Calculate relevance between blog and product
export function calculateRelevance(blogId: string, productId: string): number {
  const blog = BLOG_POSTS.find((b) => b.id === blogId);
  const product = ITEMS.find((p) => p.id === productId);
  
  if (!blog || !product) return 0;

  let score = 0;

  // Category match
  if (blog.category === product.category) {
    score += 30;
  }

  // Tag match
  const matchingTags = blog.tags.filter((tag) => product.tags.includes(tag));
  score += matchingTags.length * 15;

  // Title keyword match
  const blogTitleLower = blog.title.toLowerCase();
  const productTitleLower = product.title.toLowerCase();
  
  if (blogTitleLower.includes(productTitleLower.split(' ')[0])) {
    score += 10;
  }

  // Related products match
  const relatedProductIds = blog.relatedProducts.map(String);
  if (relatedProductIds.includes(productId)) {
    score += 40;
  }

  // Content match (simplified)
  const blogContentLower = blog.excerpt.toLowerCase();
  const productKeywords = product.tags.concat([product.category, product.subcategory]);
  
  productKeywords.forEach((keyword) => {
    if (blogContentLower.includes(keyword.toLowerCase())) {
      score += 5;
    }
  });

  return Math.min(score, 100);
}

// Generate link suggestions
export function generateLinkSuggestions(): LinkSuggestion[] {
  const suggestions: LinkSuggestion[] = [];

  BLOG_POSTS.forEach((blog) => {
    ITEMS.forEach((product) => {
      const score = calculateRelevance(blog.id, product.id);
      
      if (score >= 30) {
        let reason = '';
        
        if (blog.category === product.category) {
          reason = 'Same category';
        } else if (blog.tags.some((t) => product.tags.includes(t))) {
          reason = 'Matching tags';
        } else if (blog.relatedProducts.includes(product.id)) {
          reason = 'Explicitly related';
        } else {
          reason = 'Content similarity';
        }

        suggestions.push({
          blogId: blog.id,
          blogTitle: blog.title,
          productId: product.id,
          productTitle: product.title,
          reason,
          score,
        });
      }
    });
  });

  return suggestions.sort((a, b) => b.score - a.score);
}

// Auto-link blog to products
export function autoLinkBlogToProducts(blogId: string, maxLinks: number = 3): BlogProductLink[] {
  const suggestions = generateLinkSuggestions()
    .filter((s) => s.blogId === blogId)
    .slice(0, maxLinks);

  const links: BlogProductLink[] = suggestions.map((s) => ({
    blogId: s.blogId,
    productId: s.productId,
    linkType: s.score >= 70 ? 'featured' : 'related',
    relevanceScore: s.score,
  }));

  blogProductLinks.set(blogId, links);
  return links;
}

// Auto-link products to blogs
export function autoLinkProductsToBlogs(productId: string, maxLinks: number = 2): BlogProductLink[] {
  const suggestions = generateLinkSuggestions()
    .filter((s) => s.productId === productId)
    .slice(0, maxLinks);

  const links: BlogProductLink[] = suggestions.map((s) => ({
    blogId: s.blogId,
    productId: s.productId,
    linkType: s.score >= 70 ? 'featured' : 'related',
    relevanceScore: s.score,
  }));

  return links;
}

// Get related blogs for a product
export function getRelatedBlogsForProduct(productId: string): Array<{
  blogId: string;
  blogTitle: string;
  relevanceScore: number;
}> {
  const suggestions = generateLinkSuggestions()
    .filter((s) => s.productId === productId)
    .slice(0, 5);

  return suggestions.map((s) => ({
    blogId: s.blogId,
    blogTitle: s.blogTitle,
    relevanceScore: s.score,
  }));
}

// Get related products for a blog
export function getRelatedProductsForBlog(blogId: string): Array<{
  productId: string;
  productTitle: string;
  relevanceScore: number;
}> {
  const suggestions = generateLinkSuggestions()
    .filter((s) => s.blogId === blogId)
    .slice(0, 5);

  return suggestions.map((s) => ({
    productId: s.productId,
    productTitle: s.productTitle,
    relevanceScore: s.score,
  }));
}

// Generate "Related article" HTML for product page
export function generateRelatedArticleHTML(productId: string): string {
  const relatedBlogs = getRelatedBlogsForProduct(productId);
  
  if (relatedBlogs.length === 0) {
    return '';
  }

  const blogLinks = relatedBlogs.map((blog) => {
    const blogPost = BLOG_POSTS.find((b) => b.id === blog.blogId);
    if (!blogPost) return '';
    
    return `
      <div class="related-article">
        <a href="/marketplace/blog/${blogPost.slug}">
          <h4>${blogPost.title}</h4>
          <p>${blogPost.excerpt}</p>
        </a>
      </div>
    `;
  }).join('');

  return `
    <div class="related-articles-section">
      <h3>Related Articles</h3>
      <div class="related-articles-grid">
        ${blogLinks}
      </div>
    </div>
  `;
}

// Generate "Related products" HTML for blog page
export function generateRelatedProductsHTML(blogId: string): string {
  const relatedProducts = getRelatedProductsForBlog(blogId);
  
  if (relatedProducts.length === 0) {
    return '';
  }

  const productLinks = relatedProducts.map((product) => {
    const item = ITEMS.find((i) => i.id === product.productId);
    if (!item) return '';
    
    return `
      <div class="related-product">
        <a href="/marketplace/item/${item.slug}">
          <img src="${item.thumbnail}" alt="${item.title}" />
          <h4>${item.title}</h4>
          <p class="price">$${item.price}</p>
        </a>
      </div>
    `;
  }).join('');

  return `
    <div class="related-products-section">
      <h3>Related Products</h3>
      <div class="related-products-grid">
        ${productLinks}
      </div>
    </div>
  `;
}

// Auto-generate all blog-product links
export function autoGenerateAllLinks(): void {
  BLOG_POSTS.forEach((blog) => {
    autoLinkBlogToProducts(blog.id);
  });
}

// Get linking statistics
export function getLinkingStats(): {
  totalBlogs: number;
  totalProducts: number;
  totalLinks: number;
  averageLinksPerBlog: number;
  averageLinksPerProduct: number;
  blogsWithoutLinks: number;
  productsWithoutLinks: number;
} {
  const totalBlogs = BLOG_POSTS.length;
  const totalProducts = ITEMS.length;
  const totalLinks = Array.from(blogProductLinks.values()).reduce((sum, links) => sum + links.length, 0);
  const averageLinksPerBlog = totalBlogs > 0 ? totalLinks / totalBlogs : 0;
  const averageLinksPerProduct = totalProducts > 0 ? totalLinks / totalProducts : 0;
  
  const blogsWithoutLinks = BLOG_POSTS.filter((blog) => {
    const links = blogProductLinks.get(blog.id);
    return !links || links.length === 0;
  }).length;

  const productsWithoutLinks = ITEMS.filter((product) => {
    const hasLink = Array.from(blogProductLinks.values()).some((links) =>
      links.some((l) => l.productId === product.id)
    );
    return !hasLink;
  }).length;

  return {
    totalBlogs,
    totalProducts,
    totalLinks,
    averageLinksPerBlog,
    averageLinksPerProduct,
    blogsWithoutLinks,
    productsWithoutLinks,
  };
}

// Validate link quality
export function validateLinkQuality(blogId: string, productId: string): {
  valid: boolean;
  score: number;
  issues: string[];
} {
  const score = calculateRelevance(blogId, productId);
  const issues: string[] = [];

  if (score < 30) {
    issues.push('Low relevance score');
  }

  if (score < 50) {
    issues.push('Consider improving content alignment');
  }

  return {
    valid: score >= 30,
    score,
    issues,
  };
}

// Remove low-quality links
export function removeLowQualityLinks(threshold: number = 30): number {
  let removed = 0;

  blogProductLinks.forEach((links, blogId) => {
    const filtered = links.filter((link) => link.relevanceScore >= threshold);
    
    if (filtered.length < links.length) {
      removed += links.length - filtered.length;
      blogProductLinks.set(blogId, filtered);
    }
  });

  return removed;
}

// Export links as JSON
export function exportLinks(): string {
  return JSON.stringify(Array.from(blogProductLinks.entries()), null, 2);
}

// Import links from JSON
export function importLinks(json: string): void {
  const data = JSON.parse(json) as Array<[string, BlogProductLink[]]>;
  data.forEach(([blogId, links]) => {
    blogProductLinks.set(blogId, links);
  });
}

// Clear all links
export function clearAllLinks(): void {
  blogProductLinks.clear();
}

// Get link suggestions for a specific blog
export function getLinkSuggestionsForBlog(blogId: string): LinkSuggestion[] {
  return generateLinkSuggestions().filter((s) => s.blogId === blogId);
}

// Get link suggestions for a specific product
export function getLinkSuggestionsForProduct(productId: string): LinkSuggestion[] {
  return generateLinkSuggestions().filter((s) => s.productId === productId);
}

// Update links when content changes
export function updateLinksOnContentChange(type: 'blog' | 'product', id: string): void {
  if (type === 'blog') {
    autoLinkBlogToProducts(id);
  } else {
    autoLinkProductsToBlogs(id);
  }
}

// Generate internal linking report
export function generateLinkingReport(): {
  summary: string;
  stats: ReturnType<typeof getLinkingStats>;
  topLinkedBlogs: Array<{ blogId: string; title: string; linkCount: number }>;
  topLinkedProducts: Array<{ productId: string; title: string; linkCount: number }>;
} {
  const stats = getLinkingStats();
  
  const topLinkedBlogs = Array.from(blogProductLinks.entries())
    .map(([blogId, links]) => {
      const blog = BLOG_POSTS.find((b) => b.id === blogId);
      return {
        blogId,
        title: blog?.title || 'Unknown',
        linkCount: links.length,
      };
    })
    .sort((a, b) => b.linkCount - a.linkCount)
    .slice(0, 10);

  const productLinkCounts = new Map<string, number>();
  blogProductLinks.forEach((links) => {
    links.forEach((link) => {
      productLinkCounts.set(link.productId, (productLinkCounts.get(link.productId) || 0) + 1);
    });
  });

  const topLinkedProducts = Array.from(productLinkCounts.entries())
    .map(([productId, count]) => {
      const product = ITEMS.find((p) => p.id === productId);
      return {
        productId,
        title: product?.title || 'Unknown',
        linkCount: count,
      };
    })
    .sort((a, b) => b.linkCount - a.linkCount)
    .slice(0, 10);

  return {
    summary: `Generated ${stats.totalLinks} blog-product links across ${stats.totalBlogs} blogs and ${stats.totalProducts} products.`,
    stats,
    topLinkedBlogs,
    topLinkedProducts,
  };
}

// Schedule periodic link regeneration
export function scheduleLinkRegeneration(intervalDays: number = 7): number {
  return setInterval(() => {
    autoGenerateAllLinks();
  }, intervalDays * 24 * 60 * 60 * 1000) as unknown as number;
}
