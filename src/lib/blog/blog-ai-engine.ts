// Blog AI Engine
// AI-powered SEO, content optimization, and global targeting for blogs

import type { BlogPost } from '../marketplace-seo';
import { aiAPIIntegration } from '../ai/api-integration';
import { aiInfrastructure } from '../ai/ai-infrastructure';
import { promptManager } from '../ai/prompt-management';
import { aiVersionControl } from '../ai/version-control';

// ============================================
// SEO META ENGINE (AUTO)
// ============================================

export interface SEOMeta {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
}

export class BlogSEOMetaEngine {
  // Auto-generate SEO meta using AI
  async generateSEOMeta(blogPost: BlogPost): Promise<SEOMeta> {
    const prompt = this.buildSEOPrompt(blogPost);
    
    try {
      const result = await aiAPIIntegration.executeRequest({
        type: 'text',
        prompt,
        module: 'blog-seo',
      });

      if (result.success) {
        return this.parseSEOResponse(result.content);
      }
    } catch (error) {
      console.error('[BlogSEOMetaEngine] AI generation failed, using fallback');
    }

    // Fallback to rule-based generation
    return this.generateFallbackSEOMeta(blogPost);
  }

  private buildSEOPrompt(blogPost: BlogPost): string {
    return `Generate SEO meta for this blog post:
Title: ${blogPost.title}
Category: ${blogPost.category}
Excerpt: ${blogPost.excerpt}
Content summary: ${blogPost.content.substring(0, 500)}

Return in JSON format:
{
  "metaTitle": "SEO-optimized title (50-60 characters)",
  "metaDescription": "Compelling description (150-160 characters)",
  "metaKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;
  }

  private parseSEOResponse(content: string): SEOMeta {
    try {
      const parsed = JSON.parse(content);
      return {
        metaTitle: parsed.metaTitle || '',
        metaDescription: parsed.metaDescription || '',
        metaKeywords: Array.isArray(parsed.metaKeywords) ? parsed.metaKeywords : [],
      };
    } catch {
      throw new Error('Failed to parse AI response');
    }
  }

  private generateFallbackSEOMeta(blogPost: BlogPost): SEOMeta {
    const title = blogPost.title.length > 60 
      ? blogPost.title.substring(0, 57) + '...' 
      : blogPost.title;
    
    const description = blogPost.excerpt.length > 160
      ? blogPost.excerpt.substring(0, 157) + '...'
      : blogPost.excerpt;

    const keywords = [
      blogPost.category.toLowerCase(),
      ...blogPost.tags.slice(0, 4),
    ];

    return {
      metaTitle: title,
      metaDescription: description,
      metaKeywords: keywords,
    };
  }
}

// ============================================
// AI SLUG GENERATOR
// ============================================

export class AISlugGenerator {
  // Generate SEO-friendly slug using AI + fallback
  async generateSlug(title: string): Promise<string> {
    try {
      const result = await aiAPIIntegration.executeRequest({
        type: 'text',
        prompt: `Generate SEO-friendly URL slug for: "${title}". Return only the slug, lowercase, hyphen-separated, no special characters.`,
        module: 'blog-slug',
      });

      if (result.success) {
        const slug = result.content.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
        return slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
      }
    } catch (error) {
      console.error('[AISlugGenerator] AI generation failed, using fallback');
    }

    // Fallback to rule-based generation
    return this.generateFallbackSlug(title);
  }

  private generateFallbackSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }
}

// ============================================
// AI CONTENT OPTIMIZER
// ============================================

export interface ContentOptimization {
  originalContent: string;
  optimizedContent: string;
  readabilityScore: number;
  keywordDensity: Record<string, number>;
  headingStructure: string[];
  suggestions: string[];
}

export class AIContentOptimizer {
  // Optimize blog content for SEO and readability
  async optimizeContent(blogPost: BlogPost): Promise<ContentOptimization> {
    const prompt = this.buildOptimizationPrompt(blogPost);
    
    try {
      const result = await aiAPIIntegration.executeRequest({
        type: 'text',
        prompt,
        module: 'blog-optimization',
      });

      if (result.success) {
        const optimized = this.parseOptimizationResponse(result.content, blogPost.content);
        
        // Save version for rollback
        aiVersionControl.saveVersion(
          blogPost.id,
          blogPost.content,
          'ai-optimizer',
          prompt
        );

        return optimized;
      }
    } catch (error) {
      console.error('[AIContentOptimizer] AI optimization failed, using analysis only');
    }

    // Fallback to analysis only
    return this.analyzeContent(blogPost.content);
  }

  private buildOptimizationPrompt(blogPost: BlogPost): string {
    return `Optimize this blog content for SEO and readability:
Title: ${blogPost.title}
Category: ${blogPost.category}
Tags: ${blogPost.tags.join(', ')}

Content:
${blogPost.content.substring(0, 2000)}

Provide:
1. Improved content (maintain original meaning, improve readability and SEO)
2. Readability score (0-100)
3. Keyword density analysis
4. Heading structure suggestions
5. SEO improvement suggestions

Return in JSON format.`;
  }

  private parseOptimizationResponse(content: string, originalContent: string): ContentOptimization {
    try {
      const parsed = JSON.parse(content);
      return {
        originalContent,
        optimizedContent: parsed.optimizedContent || originalContent,
        readabilityScore: parsed.readabilityScore || 70,
        keywordDensity: parsed.keywordDensity || {},
        headingStructure: parsed.headingStructure || [],
        suggestions: parsed.suggestions || [],
      };
    } catch {
      return this.analyzeContent(originalContent);
    }
  }

  private analyzeContent(content: string): ContentOptimization {
    const words = content.toLowerCase().split(/\s+/);
    const wordCount = words.length;
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / Math.max(sentences, 1);
    
    // Simple readability score (Flesch-like)
    const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence * 1.5)));

    // Keyword density
    const keywordDensity: Record<string, number> = {};
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    words.forEach((word) => {
      if (word.length > 3 && !stopWords.includes(word)) {
        keywordDensity[word] = (keywordDensity[word] || 0) + 1;
      }
    });

    // Heading structure
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headingStructure: string[] = [];
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      headingStructure.push(`${match[1]} ${match[2]}`);
    }

    return {
      originalContent: content,
      optimizedContent: content,
      readabilityScore,
      keywordDensity,
      headingStructure,
      suggestions: this.generateSuggestions(readabilityScore, headingStructure.length),
    };
  }

  private generateSuggestions(readabilityScore: number, headingCount: number): string[] {
    const suggestions: string[] = [];
    
    if (readabilityScore < 60) {
      suggestions.push('Consider shortening sentences for better readability');
    }
    if (headingCount < 3) {
      suggestions.push('Add more headings to improve content structure');
    }
    if (headingCount > 15) {
      suggestions.push('Consider reducing the number of headings for better flow');
    }

    return suggestions;
  }
}

// ============================================
// MULTI-AI API SYSTEM (FALLBACK)
// ============================================

export class BlogMultiAISystem {
  private primaryAPI = 'openai-gpt';
  private fallbackAPIs = ['anthropic-claude', 'google-gemini', 'deepseek-api'];

  async executeWithFallback(prompt: string, module: string): Promise<string> {
    const apisToTry = [this.primaryAPI, ...this.fallbackAPIs];
    let lastError: string | undefined;

    for (const apiId of apisToTry) {
      try {
        const result = await aiAPIIntegration.executeRequest({
          type: 'text',
          prompt,
          module,
        });

        if (result.success) {
          return result.content;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[BlogMultiAISystem] ${apiId} failed, trying next`);
        continue;
      }
    }

    throw new Error(`All AI APIs failed: ${lastError}`);
  }

  setPrimaryAPI(apiId: string) {
    this.primaryAPI = apiId;
  }

  setFallbackAPIs(apiIds: string[]) {
    this.fallbackAPIs = apiIds;
  }
}

// ============================================
// GLOBAL COUNTRY TARGETING
// ============================================

export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  contentFocus: string;
  language: string;
}

export class BlogCountryTargeting {
  private countryConfigs: Map<string, CountryConfig> = new Map();

  constructor() {
    this.initializeCountryConfigs();
  }

  private initializeCountryConfigs() {
    const configs: CountryConfig[] = [
      { code: 'US', name: 'United States', currency: 'USD', contentFocus: 'SaaS', language: 'en' },
      { code: 'IN', name: 'India', currency: 'INR', contentFocus: 'budget-tools', language: 'en' },
      { code: 'GB', name: 'United Kingdom', currency: 'GBP', contentFocus: 'enterprise', language: 'en' },
      { code: 'DE', name: 'Germany', currency: 'EUR', contentFocus: 'quality', language: 'de' },
      { code: 'JP', name: 'Japan', currency: 'JPY', contentFocus: 'innovation', language: 'ja' },
      { code: 'BR', name: 'Brazil', currency: 'BRL', contentFocus: 'value', language: 'pt' },
      { code: 'AU', name: 'Australia', currency: 'AUD', contentFocus: 'SaaS', language: 'en' },
      { code: 'CA', name: 'Canada', currency: 'CAD', contentFocus: 'SaaS', language: 'en' },
    ];

    configs.forEach((config) => {
      this.countryConfigs.set(config.code, config);
    });
  }

  detectUserCountry(): string {
    // In production, use IP geolocation or browser language
    if (typeof window !== 'undefined') {
      const language = navigator.language;
      if (language.startsWith('en-US')) return 'US';
      if (language.startsWith('en-IN')) return 'IN';
      if (language.startsWith('en-GB')) return 'GB';
      if (language.startsWith('de')) return 'DE';
      if (language.startsWith('ja')) return 'JP';
      if (language.startsWith('pt')) return 'BR';
    }
    return 'US'; // Default
  }

  getCountryConfig(countryCode: string): CountryConfig | undefined {
    return this.countryConfigs.get(countryCode);
  }

  adaptContentForCountry(content: string, countryCode: string): string {
    const config = this.getCountryConfig(countryCode);
    if (!config) return content;

    // In production, use AI to adapt content based on country
    // For now, return original content
    return content;
  }
}

// ============================================
// MULTI-LANGUAGE AUTO TRANSLATION
// ============================================

export interface BlogTranslation {
  language: string;
  title: string;
  excerpt: string;
  content: string;
  translatedAt: number;
}

export class BlogMultiLanguage {
  private supportedLanguages = ['en', 'hi', 'es', 'ar', 'de', 'ja', 'pt', 'fr'];
  private translations: Map<string, Map<string, BlogTranslation>> = new Map();

  async translateBlog(blogPost: BlogPost, targetLanguage: string): Promise<BlogTranslation> {
    if (!this.supportedLanguages.includes(targetLanguage)) {
      throw new Error(`Unsupported language: ${targetLanguage}`);
    }

    // Check cache
    const cached = this.getTranslation(blogPost.id, targetLanguage);
    if (cached) {
      return cached;
    }

    try {
      const prompt = `Translate this blog content to ${targetLanguage}:
Title: ${blogPost.title}
Excerpt: ${blogPost.excerpt}
Content: ${blogPost.content.substring(0, 3000)}

Return in JSON format with title, excerpt, and content fields.`;

      const result = await aiAPIIntegration.executeRequest({
        type: 'translation',
        prompt,
        module: 'blog-translation',
      });

      if (result.success) {
        const parsed = JSON.parse(result.content);
        const translation: BlogTranslation = {
          language: targetLanguage,
          title: parsed.title || blogPost.title,
          excerpt: parsed.excerpt || blogPost.excerpt,
          content: parsed.content || blogPost.content,
          translatedAt: Date.now(),
        };

        this.cacheTranslation(blogPost.id, translation);
        return translation;
      }
    } catch (error) {
      console.error('[BlogMultiLanguage] Translation failed');
    }

    // Fallback to original
    return {
      language: targetLanguage,
      title: blogPost.title,
      excerpt: blogPost.excerpt,
      content: blogPost.content,
      translatedAt: Date.now(),
    };
  }

  private cacheTranslation(blogId: string, translation: BlogTranslation) {
    if (!this.translations.has(blogId)) {
      this.translations.set(blogId, new Map());
    }
    this.translations.get(blogId)!.set(translation.language, translation);
  }

  private getTranslation(blogId: string, language: string): BlogTranslation | undefined {
    return this.translations.get(blogId)?.get(language);
  }

  getSupportedLanguages(): string[] {
    return this.supportedLanguages;
  }
}

// ============================================
// AI TAG + CATEGORY SYSTEM
// ============================================

export class BlogAITagCategorySystem {
  async generateTags(blogPost: BlogPost): Promise<string[]> {
    try {
      const prompt = `Generate 5-8 relevant tags for this blog post:
Title: ${blogPost.title}
Category: ${blogPost.category}
Excerpt: ${blogPost.excerpt}

Return only the tags as a JSON array of strings, lowercase, hyphen-separated.`;

      const result = await aiAPIIntegration.executeRequest({
        type: 'text',
        prompt,
        module: 'blog-tags',
      });

      if (result.success) {
        const parsed = JSON.parse(result.content);
        return Array.isArray(parsed) ? parsed : blogPost.tags;
      }
    } catch (error) {
      console.error('[BlogAITagCategorySystem] AI generation failed');
    }

    return blogPost.tags;
  }

  async suggestCategory(blogPost: BlogPost): Promise<string> {
    try {
      const prompt = `Suggest the best category for this blog post from these options: WordPress, React, Laravel, eCommerce, Comparisons, Guides
Title: ${blogPost.title}
Excerpt: ${blogPost.excerpt}

Return only the category name.`;

      const result = await aiAPIIntegration.executeRequest({
        type: 'text',
        prompt,
        module: 'blog-category',
      });

      if (result.success) {
        return result.content.trim();
      }
    } catch (error) {
      console.error('[BlogAITagCategorySystem] AI suggestion failed');
    }

    return blogPost.category;
  }
}

// ============================================
// BLOG PERFORMANCE TRACKING
// ============================================

export interface BlogPerformance {
  blogId: string;
  views: number;
  clicks: number;
  bounceRate: number;
  avgTimeOnPage: number;
  lastUpdated: number;
}

export class BlogPerformanceTracker {
  private performance: Map<string, BlogPerformance> = new Map();

  trackView(blogId: string) {
    const current = this.performance.get(blogId) || {
      blogId,
      views: 0,
      clicks: 0,
      bounceRate: 0,
      avgTimeOnPage: 0,
      lastUpdated: Date.now(),
    };
    current.views++;
    current.lastUpdated = Date.now();
    this.performance.set(blogId, current);
  }

  trackClick(blogId: string) {
    const current = this.performance.get(blogId);
    if (current) {
      current.clicks++;
      current.lastUpdated = Date.now();
    }
  }

  updateBounceRate(blogId: string, bounced: boolean) {
    const current = this.performance.get(blogId);
    if (current) {
      const totalViews = current.views;
      const currentBounces = Math.round(current.bounceRate * totalViews);
      const newBounces = bounced ? currentBounces + 1 : currentBounces;
      current.bounceRate = newBounces / totalViews;
      current.lastUpdated = Date.now();
    }
  }

  getPerformance(blogId: string): BlogPerformance | undefined {
    return this.performance.get(blogId);
  }

  getAllPerformance(): BlogPerformance[] {
    return Array.from(this.performance.values());
  }
}

// ============================================
// AUTO UPDATE ENGINE
// ============================================

export class BlogAutoUpdateEngine {
  async checkForUpdates(blogPost: BlogPost): Promise<boolean> {
    const daysSinceUpdate = this.getDaysSinceUpdate(blogPost);
    
    if (daysSinceUpdate > 90) {
      return true; // Suggest update
    }

    // Check if content is thin
    const wordCount = blogPost.content.split(/\s+/).length;
    if (wordCount < 500) {
      return true;
    }

    return false;
  }

  async generateUpdateSuggestions(blogPost: BlogPost): Promise<string[]> {
    try {
      const prompt = `Analyze this blog post and suggest updates:
Title: ${blogPost.title}
Published: ${blogPost.publishedAt}
Updated: ${blogPost.updatedAt}
Content: ${blogPost.content.substring(0, 1000)}

Suggest 3-5 specific updates to make the content more current and valuable.
Return as a JSON array of strings.`;

      const result = await aiAPIIntegration.executeRequest({
        type: 'text',
        prompt,
        module: 'blog-update',
      });

      if (result.success) {
        const parsed = JSON.parse(result.content);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('[BlogAutoUpdateEngine] AI suggestion failed');
    }

    return ['Add recent examples', 'Update statistics', 'Add new FAQs'];
  }

  private getDaysSinceUpdate(blogPost: BlogPost): number {
    const updated = new Date(blogPost.updatedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - updated.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}

// ============================================
// MAIN BLOG AI ENGINE
// ============================================

export class BlogAIEngine {
  public seoMetaEngine: BlogSEOMetaEngine;
  public slugGenerator: AISlugGenerator;
  public contentOptimizer: AIContentOptimizer;
  public multiAISystem: BlogMultiAISystem;
  public countryTargeting: BlogCountryTargeting;
  public multiLanguage: BlogMultiLanguage;
  public tagCategorySystem: BlogAITagCategorySystem;
  public performanceTracker: BlogPerformanceTracker;
  public autoUpdateEngine: BlogAutoUpdateEngine;

  constructor() {
    this.seoMetaEngine = new BlogSEOMetaEngine();
    this.slugGenerator = new AISlugGenerator();
    this.contentOptimizer = new AIContentOptimizer();
    this.multiAISystem = new BlogMultiAISystem();
    this.countryTargeting = new BlogCountryTargeting();
    this.multiLanguage = new BlogMultiLanguage();
    this.tagCategorySystem = new BlogAITagCategorySystem();
    this.performanceTracker = new BlogPerformanceTracker();
    this.autoUpdateEngine = new BlogAutoUpdateEngine();
  }
}

// Export singleton instance
export const blogAIEngine = new BlogAIEngine();
