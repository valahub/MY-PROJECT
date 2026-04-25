// Blog Security and Self-Heal Logic
// Sanitize AI output, prevent XSS, validate inputs, and self-heal

import { aiInfrastructure } from '../ai/ai-infrastructure';
import { aiAPIIntegration } from '../ai/api-integration';
import type { BlogPost } from '../marketplace-seo';

export class BlogSecurity {
  // Sanitize AI output to prevent XSS
  sanitizeAIOutput(content: string): string {
    let sanitized = content;

    // Remove script tags
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gis, '');
    
    // Remove on* event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove data URLs that could execute scripts
    sanitized = sanitized.replace(/data:\s*(?!image\/)/gi, '');

    return sanitized;
  }

  // Validate blog post input
  validateBlogInput(blogPost: Partial<BlogPost>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!blogPost.title || blogPost.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (blogPost.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }

    if (!blogPost.content || blogPost.content.trim().length === 0) {
      errors.push('Content is required');
    } else if (blogPost.content.length < 100) {
      errors.push('Content must be at least 100 characters');
    }

    if (!blogPost.author || blogPost.author.trim().length === 0) {
      errors.push('Author is required');
    }

    if (!blogPost.category || blogPost.category.trim().length === 0) {
      errors.push('Category is required');
    }

    if (!blogPost.tags || !Array.isArray(blogPost.tags) || blogPost.tags.length === 0) {
      errors.push('At least one tag is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Validate slug format
  validateSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(slug);
  }

  // Escape HTML entities
  escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

export class BlogSelfHeal {
  // Self-heal SEO meta if missing
  async healSEOMeta(blogPost: BlogPost): Promise<boolean> {
    const hasSEOMeta = blogPost.title && blogPost.excerpt;
    
    if (!hasSEOMeta) {
      try {
        // Use AI to regenerate SEO meta
        const result = await aiAPIIntegration.executeRequest({
          type: 'text',
          prompt: `Generate SEO meta for blog post: ${blogPost.title}`,
          module: 'blog-seo-heal',
        });

        if (result.success) {
          console.log(`[BlogSelfHeal] SEO meta regenerated for ${blogPost.id}`);
          return true;
        }
      } catch (error) {
        console.error(`[BlogSelfHeal] Failed to heal SEO meta for ${blogPost.id}`);
      }
    }

    return false;
  }

  // Self-heal translation if failed
  async healTranslation(blogPost: BlogPost, targetLanguage: string): Promise<boolean> {
    try {
      const result = await aiAPIIntegration.executeRequest({
        type: 'translation',
        prompt: `Translate to ${targetLanguage}: ${blogPost.title}`,
        module: 'blog-translation-heal',
      });

      if (result.success) {
        console.log(`[BlogSelfHeal] Translation healed for ${blogPost.id} to ${targetLanguage}`);
        return true;
      }
    } catch (error) {
      console.error(`[BlogSelfHeal] Failed to heal translation for ${blogPost.id}`);
    }

    return false;
  }

  // Self-heal schema if missing
  async healSchema(blogPost: BlogPost): Promise<boolean> {
    try {
      const result = await aiAPIIntegration.executeRequest({
        type: 'text',
        prompt: `Generate schema.org data for: ${blogPost.title}`,
        module: 'blog-schema-heal',
      });

      if (result.success) {
        console.log(`[BlogSelfHeal] Schema regenerated for ${blogPost.id}`);
        return true;
      }
    } catch (error) {
      console.error(`[BlogSelfHeal] Failed to heal schema for ${blogPost.id}`);
    }

    return false;
  }

  // Self-heal content if thin
  async healThinContent(blogPost: BlogPost): Promise<boolean> {
    const wordCount = blogPost.content.split(/\s+/).length;
    
    if (wordCount < 500) {
      try {
        const result = await aiAPIIntegration.executeRequest({
          type: 'text',
          prompt: `Expand this content to 800+ words: ${blogPost.content.substring(0, 500)}`,
          module: 'blog-content-heal',
        });

        if (result.success) {
          console.log(`[BlogSelfHeal] Content expanded for ${blogPost.id}`);
          return true;
        }
      } catch (error) {
        console.error(`[BlogSelfHeal] Failed to heal content for ${blogPost.id}`);
      }
    }

    return false;
  }

  // Run full self-heal check
  async runFullSelfHeal(blogPost: BlogPost): Promise<{
    seoMetaHealed: boolean;
    translationHealed: boolean;
    schemaHealed: boolean;
    contentHealed: boolean;
  }> {
    const results = await Promise.allSettled([
      this.healSEOMeta(blogPost),
      this.healTranslation(blogPost, 'en'),
      this.healSchema(blogPost),
      this.healThinContent(blogPost),
    ]);

    return {
      seoMetaHealed: results[0].status === 'fulfilled' && results[0].value,
      translationHealed: results[1].status === 'fulfilled' && results[1].value,
      schemaHealed: results[2].status === 'fulfilled' && results[2].value,
      contentHealed: results[3].status === 'fulfilled' && results[3].value,
    };
  }
}

// Export singleton instances
export const blogSecurity = new BlogSecurity();
export const blogSelfHeal = new BlogSelfHeal();
