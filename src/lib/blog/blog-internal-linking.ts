// Blog Internal Linking Engine
// Auto-suggest related blogs and products for smart linking

import type { BlogPost } from '../marketplace-seo';
import { BLOG_POSTS, getRelatedBlogs } from '../blog-data';
import { ITEMS } from '../marketplace-data';
import { aiAPIIntegration } from '../ai/api-integration';

export interface LinkSuggestion {
  type: 'blog' | 'product';
  id: string;
  title: string;
  url: string;
  relevanceScore: number;
  suggestedAnchorText: string;
}

export class BlogInternalLinkingEngine {
  // Suggest related blogs for internal linking
  async suggestRelatedBlogs(blogPost: BlogPost, limit: number = 5): Promise<LinkSuggestion[]> {
    const relatedBlogs = getRelatedBlogs(blogPost.id);
    
    // Calculate relevance scores
    const scored = relatedBlogs.map((blog) => ({
      type: 'blog' as const,
      id: blog.id,
      title: blog.title,
      url: `/marketplace/blog/${blog.slug}`,
      relevanceScore: this.calculateRelevanceScore(blogPost, blog),
      suggestedAnchorText: this.generateAnchorText(blogPost, blog),
    }));

    // Sort by relevance and limit
    return scored
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // Suggest related products for internal linking
  async suggestRelatedProducts(blogPost: BlogPost, limit: number = 3): Promise<LinkSuggestion[]> {
    const relatedProducts = ITEMS.filter((item) => 
      blogPost.relatedProducts.includes(item.id) ||
      blogPost.tags.some((tag) => item.tags.includes(tag)) ||
      item.category === blogPost.category
    );

    const scored = relatedProducts.map((product) => ({
      type: 'product' as const,
      id: product.id,
      title: product.title,
      url: `/marketplace/item/${product.slug}`,
      relevanceScore: this.calculateProductRelevance(blogPost, product),
      suggestedAnchorText: this.generateProductAnchorText(blogPost, product),
    }));

    return scored
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // Generate smart link suggestions using AI
  async generateSmartLinks(blogPost: BlogPost): Promise<{
    blogLinks: LinkSuggestion[];
    productLinks: LinkSuggestion[];
    insertionPoints: Array<{ position: number; suggestedLink: LinkSuggestion; context: string }>;
  }> {
    const blogLinks = await this.suggestRelatedBlogs(blogPost, 5);
    const productLinks = await this.suggestRelatedProducts(blogPost, 3);

    try {
      const prompt = `Analyze this blog content and suggest optimal insertion points for internal links:
Title: ${blogPost.title}
Content: ${blogPost.content.substring(0, 2000)}

Available blog links:
${blogLinks.map((l) => `- ${l.title} (${l.url})`).join('\n')}

Available product links:
${productLinks.map((l) => `- ${l.title} (${l.url})`).join('\n')}

Suggest 3-5 optimal insertion points with context.
Return in JSON format:
{
  "insertionPoints": [
    {
      "position": 0,
      "linkId": "blog-id",
      "linkType": "blog",
      "context": "context sentence where link should be inserted"
    }
  ]
}`;

      const result = await aiAPIIntegration.executeRequest({
        type: 'text',
        prompt,
        module: 'blog-linking',
      });

      if (result.success) {
        const parsed = JSON.parse(result.content);
        const insertionPoints = parsed.insertionPoints.map((ip: any) => {
          const link = ip.linkType === 'blog' 
            ? blogLinks.find((l) => l.id === ip.linkId)
            : productLinks.find((l) => l.id === ip.linkId);
          
          return {
            position: ip.position,
            suggestedLink: link || blogLinks[0],
            context: ip.context,
          };
        });

        return { blogLinks, productLinks, insertionPoints };
      }
    } catch (error) {
      console.error('[BlogInternalLinkingEngine] AI generation failed');
    }

    // Fallback: return suggestions without insertion points
    return {
      blogLinks,
      productLinks,
      insertionPoints: [],
    };
  }

  // Insert links into content
  insertLinksIntoContent(
    content: string,
    insertionPoints: Array<{ position: number; suggestedLink: LinkSuggestion; context: string }>
  ): string {
    if (insertionPoints.length === 0) return content;

    let modifiedContent = content;
    const sortedPoints = [...insertionPoints].sort((a, b) => b.position - a.position);

    for (const point of sortedPoints) {
      const linkHtml = `<a href="${point.suggestedLink.url}" class="text-primary hover:underline">${point.suggestedLink.suggestedAnchorText}</a>`;
      modifiedContent = this.insertAtPosition(modifiedContent, point.position, linkHtml);
    }

    return modifiedContent;
  }

  private calculateRelevanceScore(source: BlogPost, target: BlogPost): number {
    let score = 0;

    // Same category
    if (source.category === target.category) score += 0.4;

    // Shared tags
    const sharedTags = source.tags.filter((t) => target.tags.includes(t));
    score += sharedTags.length * 0.15;

    // Similar content (simple word overlap)
    const sourceWords = new Set(source.content.toLowerCase().split(/\s+/));
    const targetWords = new Set(target.content.toLowerCase().split(/\s+/));
    const intersection = [...sourceWords].filter((w) => targetWords.has(w));
    score += (intersection.length / sourceWords.size) * 0.2;

    return Math.min(score, 1);
  }

  private calculateProductRelevance(blogPost: BlogPost, product: any): number {
    let score = 0;

    // Direct relation
    if (blogPost.relatedProducts.includes(product.id)) score += 0.5;

    // Same category
    if (blogPost.category === product.category) score += 0.3;

    // Tag matches
    const tagMatches = blogPost.tags.filter((t) => product.tags.includes(t)).length;
    score += tagMatches * 0.1;

    return Math.min(score, 1);
  }

  private generateAnchorText(source: BlogPost, target: BlogPost): string {
    // Use target title or generate contextual anchor
    if (target.title.length <= 50) return target.title;
    return target.title.substring(0, 47) + '...';
  }

  private generateProductAnchorText(blogPost: BlogPost, product: any): string {
    if (product.title.length <= 50) return product.title;
    return product.title.substring(0, 47) + '...';
  }

  private insertAtPosition(content: string, position: number, insertion: string): string {
    const words = content.split(/\s+/);
    const insertIndex = Math.min(position, words.length);
    words.splice(insertIndex, 0, insertion);
    return words.join(' ');
  }
}

// Export singleton instance
export const blogInternalLinkingEngine = new BlogInternalLinkingEngine();
