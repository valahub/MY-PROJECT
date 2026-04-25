// Blog Schema Engine
// AI-powered SEO structured data (schema) generation

import type { BlogPost } from '../marketplace-seo';
import { aiAPIIntegration } from '../ai/api-integration';

// ============================================
// SCHEMA GENERATION
// ============================================

export interface BlogSchema {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

export class BlogSchemaEngine {
  // Generate Article schema with AI
  async generateArticleSchema(blogPost: BlogPost): Promise<BlogSchema> {
    const baseSchema = this.generateBaseArticleSchema(blogPost);
    
    try {
      const enhancedSchema = await this.enhanceSchemaWithAI(blogPost, baseSchema);
      return enhancedSchema;
    } catch (error) {
      console.error('[BlogSchemaEngine] AI enhancement failed, using base schema');
      return baseSchema;
    }
  }

  private generateBaseArticleSchema(blogPost: BlogPost): BlogSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: blogPost.title,
      description: blogPost.excerpt,
      author: {
        '@type': 'Person',
        name: blogPost.author,
      },
      datePublished: blogPost.publishedAt,
      dateModified: blogPost.updatedAt,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://erpvala.com/marketplace/blog/${blogPost.slug}`,
      },
    };
  }

  private async enhanceSchemaWithAI(blogPost: BlogPost, baseSchema: BlogSchema): Promise<BlogSchema> {
    const prompt = `Enhance this schema.org Article data with additional fields:
Title: ${blogPost.title}
Category: ${blogPost.category}
Tags: ${blogPost.tags.join(', ')}

Current schema:
${JSON.stringify(baseSchema, null, 2)}

Add these fields if applicable:
- about (topic)
- keywords
- articleSection
- image (suggest relevant image URL)
- publisher
- potentialAction

Return enhanced JSON schema.`;

    const result = await aiAPIIntegration.executeRequest({
      type: 'text',
      prompt,
      module: 'blog-schema',
    });

    if (result.success) {
      try {
        const enhanced = JSON.parse(result.content);
        return { ...baseSchema, ...enhanced };
      } catch {
        return baseSchema;
      }
    }

    return baseSchema;
  }

  // Generate Breadcrumb schema
  generateBreadcrumbSchema(blogPost: BlogPost): BlogSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://erpvala.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Marketplace',
          item: 'https://erpvala.com/marketplace',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Blog',
          item: 'https://erpvala.com/marketplace/blog',
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: blogPost.category,
          item: `https://erpvala.com/marketplace/blog?category=${blogPost.category}`,
        },
        {
          '@type': 'ListItem',
          position: 5,
          name: blogPost.title,
          item: `https://erpvala.com/marketplace/blog/${blogPost.slug}`,
        },
      ],
    };
  }

  // Generate FAQ schema
  generateFAQSchema(blogPost: BlogPost): BlogSchema | null {
    if (!blogPost.faqs || blogPost.faqs.length === 0) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: blogPost.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  // Generate Organization schema
  generateOrganizationSchema(): BlogSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ERP Vala',
      url: 'https://erpvala.com',
      logo: 'https://erpvala.com/logo.png',
      description: 'Premium marketplace for digital products, templates, and tools',
      sameAs: [
        'https://twitter.com/erpvala',
        'https://linkedin.com/company/erpvala',
        'https://github.com/erpvala',
      ],
    };
  }

  // Generate WebSite schema
  generateWebSiteSchema(): BlogSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'ERP Vala',
      url: 'https://erpvala.com',
      description: 'Premium marketplace for digital products',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://erpvala.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    };
  }

  // Generate complete schema set for a blog post
  async generateCompleteSchema(blogPost: BlogPost): Promise<BlogSchema[]> {
    const schemas: BlogSchema[] = [];

    // Article schema
    const articleSchema = await this.generateArticleSchema(blogPost);
    schemas.push(articleSchema);

    // Breadcrumb schema
    const breadcrumbSchema = this.generateBreadcrumbSchema(blogPost);
    schemas.push(breadcrumbSchema);

    // FAQ schema (if applicable)
    const faqSchema = this.generateFAQSchema(blogPost);
    if (faqSchema) {
      schemas.push(faqSchema);
    }

    // Organization schema
    const orgSchema = this.generateOrganizationSchema();
    schemas.push(orgSchema);

    // WebSite schema
    const webSiteSchema = this.generateWebSiteSchema();
    schemas.push(webSiteSchema);

    return schemas;
  }

  // Convert schema to JSON-LD string
  schemaToJsonLd(schema: BlogSchema): string {
    return JSON.stringify(schema, null, 2);
  }

  // Convert multiple schemas to JSON-LD array
  schemasToJsonLd(schemas: BlogSchema[]): string {
    return schemas.map((s) => this.schemaToJsonLd(s)).join('\n');
  }
}

// Export singleton instance
export const blogSchemaEngine = new BlogSchemaEngine();
