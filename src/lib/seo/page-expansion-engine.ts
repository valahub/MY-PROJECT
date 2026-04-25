// Page Expansion Engine
// Auto-adds content to thin pages to improve SEO

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';
import { generateCategoryIntro, generateProductDescription } from './auto-content-engine';
import { generateProductFAQs, generateCategoryFAQs } from './auto-faq-generator';
import { getRelatedTags } from './tag-seo-system';
import { generateRelatedSearchLinks, generatePeopleAlsoSearchLinks } from './internal-linking-network';

export interface PageAnalysis {
  url: string;
  type: 'product' | 'category' | 'tag' | 'author' | 'blog';
  contentLength: number;
  wordCount: number;
  hasDescription: boolean;
  hasFAQ: boolean;
  hasRelatedLinks: boolean;
  score: number; // 0-100
  needsExpansion: boolean;
}

export interface ExpansionAction {
  type: 'add-description' | 'add-faq' | 'add-related-links' | 'add-tags' | 'add-author-bio';
  priority: number;
  content?: string;
}

// Analyze page content quality
export function analyzePage(url: string, type: PageAnalysis['type'], content: string): PageAnalysis {
  const contentLength = content.length;
  const wordCount = content.split(/\s+/).length;
  const hasDescription = content.length > 100;
  const hasFAQ = content.includes('FAQ') || content.includes('Frequently Asked');
  const hasRelatedLinks = content.includes('Related') || content.includes('Similar');

  // Calculate quality score
  let score = 0;
  
  // Content length score (max 40 points)
  if (contentLength > 1000) score += 40;
  else if (contentLength > 500) score += 30;
  else if (contentLength > 200) score += 20;
  else if (contentLength > 100) score += 10;

  // Description score (max 20 points)
  if (hasDescription) score += 20;

  // FAQ score (max 20 points)
  if (hasFAQ) score += 20;

  // Related links score (max 20 points)
  if (hasRelatedLinks) score += 20;

  const needsExpansion = score < 60;

  return {
    url,
    type,
    contentLength,
    wordCount,
    hasDescription,
    hasFAQ,
    hasRelatedLinks,
    score,
    needsExpansion,
  };
}

// Get expansion actions for a page
export function getExpansionActions(analysis: PageAnalysis, id?: string): ExpansionAction[] {
  const actions: ExpansionAction[] = [];

  if (!analysis.hasDescription) {
    actions.push({
      type: 'add-description',
      priority: 1,
    });
  }

  if (!analysis.hasFAQ) {
    actions.push({
      type: 'add-faq',
      priority: 2,
    });
  }

  if (!analysis.hasRelatedLinks) {
    actions.push({
      type: 'add-related-links',
      priority: 3,
    });
  }

  if (analysis.type === 'product' && id) {
    actions.push({
      type: 'add-tags',
      priority: 4,
    });
  }

  if (analysis.type === 'author' && id) {
    actions.push({
      type: 'add-author-bio',
      priority: 2,
    });
  }

  return actions.sort((a, b) => a.priority - b.priority);
}

// Expand product page
export async function expandProductPage(productId: string): Promise<{
  originalContent: string;
  expandedContent: string;
  actions: ExpansionAction[];
}> {
  const product = ITEMS.find((item) => item.id === productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const originalContent = product.description;
  let expandedContent = originalContent;
  const actions: ExpansionAction[] = [];

  // Add extended description if needed
  if (originalContent.length < 200) {
    const extendedDesc = await generateProductDescription(product.title, product.tags);
    expandedContent = `${extendedDesc}\n\n${originalContent}`;
    actions.push({ type: 'add-description', priority: 1, content: extendedDesc });
  }

  // Add FAQs
  const faqs = generateProductFAQs(productId);
  if (faqs.length > 0) {
    const faqSection = `\n\n## Frequently Asked Questions\n\n${faqs.map((f) => `**Q: ${f.question}**\n\nA: ${f.answer}`).join('\n\n')}`;
    expandedContent += faqSection;
    actions.push({ type: 'add-faq', priority: 2 });
  }

  // Add related links
  const relatedLinks = generateRelatedSearchLinks(product.title);
  if (relatedLinks.length > 0) {
    const linksSection = `\n\n## Related Searches\n\n${relatedLinks.map((l) => l.anchorText).join(', ')}`;
    expandedContent += linksSection;
    actions.push({ type: 'add-related-links', priority: 3 });
  }

  return {
    originalContent,
    expandedContent,
    actions,
  };
}

// Expand category page
export async function expandCategoryPage(categorySlug: string): Promise<{
  originalContent: string;
  expandedContent: string;
  actions: ExpansionAction[];
}> {
  const category = CATEGORY_TREE.find((cat) => cat.slug === categorySlug);
  if (!category) {
    throw new Error('Category not found');
  }

  const originalContent = category.title;
  let expandedContent = originalContent;
  const actions: ExpansionAction[] = [];

  // Add category intro
  const intro = await generateCategoryIntro(category.title, category.subs.slice(0, 3));
  expandedContent = `${intro}\n\n${expandedContent}`;
  actions.push({ type: 'add-description', priority: 1, content: intro });

  // Add FAQs
  const faqs = generateCategoryFAQs(categorySlug);
  if (faqs.length > 0) {
    const faqSection = `\n\n## Frequently Asked Questions\n\n${faqs.map((f) => `**Q: ${f.question}**\n\nA: ${f.answer}`).join('\n\n')}`;
    expandedContent += faqSection;
    actions.push({ type: 'add-faq', priority: 2 });
  }

  // Add related searches
  const relatedLinks = generateRelatedSearchLinks(category.title);
  if (relatedLinks.length > 0) {
    const linksSection = `\n\n## Related Searches\n\n${relatedLinks.map((l) => l.anchorText).join(', ')}`;
    expandedContent += linksSection;
    actions.push({ type: 'add-related-links', priority: 3 });
  }

  return {
    originalContent,
    expandedContent,
    actions,
  };
}

// Expand tag page
export function expandTagPage(tag: string): {
  originalContent: string;
  expandedContent: string;
  actions: ExpansionAction[];
} {
  const originalContent = tag;
  let expandedContent = originalContent;
  const actions: ExpansionAction[] = [];

  // Add tag description
  const description = `Explore the best ${tag} scripts, plugins, and templates. Browse our curated collection of ${tag} solutions with instant download.`;
  expandedContent = `${description}\n\n${expandedContent}`;
  actions.push({ type: 'add-description', priority: 1, content: description });

  // Add related tags
  const relatedTags = getRelatedTags(tag, 5);
  if (relatedTags.length > 0) {
    const tagsSection = `\n\n## Related Tags\n\n${relatedTags.map((t) => `[${t}](/marketplace/tag/${t.toLowerCase()})`).join(', ')}`;
    expandedContent += tagsSection;
    actions.push({ type: 'add-tags', priority: 2 });
  }

  // Add related searches
  const relatedLinks = generateRelatedSearchLinks(tag);
  if (relatedLinks.length > 0) {
    const linksSection = `\n\n## Related Searches\n\n${relatedLinks.map((l) => l.anchorText).join(', ')}`;
    expandedContent += linksSection;
    actions.push({ type: 'add-related-links', priority: 3 });
  }

  return {
    originalContent,
    expandedContent,
    actions,
  };
}

// Batch analyze all pages
export function batchAnalyzePages(): PageAnalysis[] {
  const analyses: PageAnalysis[] = [];

  // Analyze product pages
  ITEMS.forEach((item) => {
    const analysis = analyzePage(
      `/marketplace/item/${item.slug}`,
      'product',
      item.description
    );
    analyses.push(analysis);
  });

  // Analyze category pages
  CATEGORY_TREE.forEach((cat) => {
    const analysis = analyzePage(
      `/marketplace/category?category=${cat.slug}`,
      'category',
      cat.title
    );
    analyses.push(analysis);
  });

  return analyses;
}

// Get pages needing expansion
export function getPagesNeedingExpansion(threshold: number = 60): PageAnalysis[] {
  const analyses = batchAnalyzePages();
  return analyses.filter((a) => a.score < threshold);
}

// Auto-expand all thin pages
export async function autoExpandThinPages(): Promise<{
  expanded: number;
  skipped: number;
  details: Array<{ url: string; actions: number }>;
}> {
  const pagesNeedingExpansion = getPagesNeedingExpansion(60);
  let expanded = 0;
  let skipped = 0;
  const details: Array<{ url: string; actions: number }> = [];

  for (const page of pagesNeedingExpansion) {
    try {
      let result;

      if (page.type === 'product') {
        const productId = page.url.split('/').pop();
        if (productId) {
          result = await expandProductPage(productId);
        }
      } else if (page.type === 'category') {
        const categoryMatch = page.url.match(/category=([^&]+)/);
        if (categoryMatch) {
          result = await expandCategoryPage(categoryMatch[1]);
        }
      } else if (page.type === 'tag') {
        const tag = page.url.split('/').pop();
        if (tag) {
          result = expandTagPage(tag);
        }
      }

      if (result) {
        expanded++;
        details.push({ url: page.url, actions: result.actions.length });
      } else {
        skipped++;
      }
    } catch (error) {
      skipped++;
    }
  }

  return {
    expanded,
    skipped,
    details,
  };
}

// Validate expanded content
export function validateExpandedContent(content: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (content.length < 200) {
    issues.push('Content is too short (minimum 200 characters)');
  }

  if (content.split(/\s+/).length < 50) {
    issues.push('Content has too few words (minimum 50 words)');
  }

  if (!content.includes('##')) {
    issues.push('Content lacks proper headings');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// Get expansion statistics
export function getExpansionStats(): {
  totalPages: number;
  pagesNeedingExpansion: number;
  averageScore: number;
  byType: Record<string, { count: number; avgScore: number }>;
} {
  const analyses = batchAnalyzePages();
  const totalPages = analyses.length;
  const pagesNeedingExpansion = analyses.filter((a) => a.needsExpansion).length;
  const averageScore = analyses.reduce((sum, a) => sum + a.score, 0) / totalPages;
  const byType: Record<string, { count: number; avgScore: number }> = {};

  analyses.forEach((analysis) => {
    if (!byType[analysis.type]) {
      byType[analysis.type] = { count: 0, avgScore: 0 };
    }
    byType[analysis.type].count++;
    byType[analysis.type].avgScore += analysis.score;
  });

  Object.keys(byType).forEach((type) => {
    byType[type].avgScore /= byType[type].count;
  });

  return {
    totalPages,
    pagesNeedingExpansion,
    averageScore,
    byType,
  };
}

// Schedule periodic page expansion
export function schedulePageExpansion(intervalHours: number = 24): number {
  return setInterval(async () => {
    await autoExpandThinPages();
  }, intervalHours * 60 * 60 * 1000) as unknown as number;
}

// Content expansion cache
const expansionCache = new Map<string, { expandedContent: string; actions: ExpansionAction[] }>();

export function cacheExpansion(url: string, expandedContent: string, actions: ExpansionAction[]): void {
  expansionCache.set(url, { expandedContent, actions });
}

export function getCachedExpansion(url: string): { expandedContent: string; actions: ExpansionAction[] } | undefined {
  return expansionCache.get(url);
}

export function clearExpansionCache(): void {
  expansionCache.clear();
}

// Generate expansion report
export function generateExpansionReport(): {
  summary: string;
  pagesExpanded: number;
  actionsTaken: number;
  byActionType: Record<string, number>;
} {
  const cache = Array.from(expansionCache.values());
  const pagesExpanded = cache.length;
  const actionsTaken = cache.reduce((sum, item) => sum + item.actions.length, 0);
  const byActionType: Record<string, number> = {};

  cache.forEach((item) => {
    item.actions.forEach((action) => {
      byActionType[action.type] = (byActionType[action.type] || 0) + 1;
    });
  });

  return {
    summary: `Expanded ${pagesExpanded} pages with ${actionsTaken} total actions.`,
    pagesExpanded,
    actionsTaken,
    byActionType,
  };
}
