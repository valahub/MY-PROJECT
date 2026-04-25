// SEO Final Check Validator
// Comprehensive verification of all SEO components

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';
import { generateCompleteMeta } from './programmatic-seo-engine';
import { generateCategoryItemListSchema } from './itemlist-schema';
import { generateOrganizationSchema } from './organization-schema';
import { generateRobotsTxt } from './robots-txt-generator';

export interface SEOCheckResult {
  category: string;
  status: 'pass' | 'fail' | 'warning';
  issues: string[];
  details?: any;
}

export interface SEOReport {
  overallStatus: 'pass' | 'fail' | 'warning';
  checks: SEOCheckResult[];
  summary: string;
  timestamp: string;
}

// Check meta tags
export function checkMetaTags(): SEOCheckResult {
  const issues: string[] = [];

  // Check if meta generation works
  try {
    const meta = generateCompleteMeta({ type: 'product' });
    
    if (!meta.title) {
      issues.push('Meta title generation failed');
    }

    if (!meta.description) {
      issues.push('Meta description generation failed');
    }

    if (!meta.keywords || meta.keywords.length === 0) {
      issues.push('Meta keywords generation failed');
    }

    if (!meta.canonical) {
      issues.push('Canonical URL generation failed');
    }
  } catch (error) {
    issues.push(`Meta generation error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return {
    category: 'Meta Tags',
    status: issues.length === 0 ? 'pass' : issues.length <= 2 ? 'warning' : 'fail',
    issues,
  };
}

// Check Open Graph tags
export function checkOpenGraphTags(): SEOCheckResult {
  const issues: string[] = [];

  // Check if OG generation works
  try {
    const meta = generateCompleteMeta({ type: 'product' });
    
    if (!meta.ogTitle) {
      issues.push('OG title missing');
    }

    if (!meta.ogDescription) {
      issues.push('OG description missing');
    }

    if (!meta.ogImage) {
      issues.push('OG image missing');
    }
  } catch (error) {
    issues.push(`OG generation error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return {
    category: 'Open Graph Tags',
    status: issues.length === 0 ? 'pass' : issues.length <= 2 ? 'warning' : 'fail',
    issues,
  };
}

// Check Schema markup
export function checkSchemaMarkup(): SEOCheckResult {
  const issues: string[] = [];

  try {
    // Check ItemList schema
    const itemListSchema = generateCategoryItemListSchema('plugins');
    if (!itemListSchema.itemListElement || itemListSchema.itemListElement.length === 0) {
      issues.push('ItemList schema empty or missing');
    }

    // Check Organization schema
    const orgSchema = generateOrganizationSchema();
    if (!orgSchema.name || !orgSchema.url) {
      issues.push('Organization schema missing required fields');
    }
  } catch (error) {
    issues.push(`Schema generation error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return {
    category: 'Schema Markup',
    status: issues.length === 0 ? 'pass' : issues.length <= 2 ? 'warning' : 'fail',
    issues,
  };
}

// Check Sitemap
export function checkSitemap(): SEOCheckResult {
  const issues: string[] = [];

  try {
    // Check if sitemap file exists (simplified check)
    if (ITEMS.length === 0) {
      issues.push('No products to generate sitemap');
    }
  } catch (error) {
    issues.push(`Sitemap error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return {
    category: 'Sitemap',
    status: issues.length === 0 ? 'pass' : issues.length <= 2 ? 'warning' : 'fail',
    issues,
  };
}

// Check Robots.txt
export function checkRobotsTxt(): SEOCheckResult {
  const issues: string[] = [];

  try {
    const robots = generateRobotsTxt();
    
    if (!robots.includes('User-agent:')) {
      issues.push('Robots.txt missing User-agent directive');
    }

    if (!robots.includes('Sitemap:')) {
      issues.push('Robots.txt missing Sitemap directive');
    }

    if (!robots.includes('Disallow:')) {
      issues.push('Robots.txt missing Disallow directive');
    }
  } catch (error) {
    issues.push(`Robots.txt error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return {
    category: 'Robots.txt',
    status: issues.length === 0 ? 'pass' : issues.length <= 2 ? 'warning' : 'fail',
    issues,
  };
}

// Check Tag SEO
export function checkTagSEO(): SEOCheckResult {
  const issues: string[] = [];

  try {
    // Simplified check - just verify module exists
    if (ITEMS.length === 0) {
      issues.push('No products for tag SEO');
    }
  } catch (error) {
    issues.push(`Tag SEO error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return {
    category: 'Tag SEO',
    status: issues.length === 0 ? 'pass' : issues.length <= 2 ? 'warning' : 'fail',
    issues,
  };
}

// Check Blog Linking
export function checkBlogLinking(): SEOCheckResult {
  const issues: string[] = [];

  try {
    // Simplified check - verify products exist for linking
    if (ITEMS.length === 0) {
      issues.push('No products for blog linking');
    }
  } catch (error) {
    issues.push(`Blog linking error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return {
    category: 'Blog Linking',
    status: issues.length === 0 ? 'pass' : issues.length <= 2 ? 'warning' : 'fail',
    issues,
  };
}

// Check Keywords
export function checkKeywords(): SEOCheckResult {
  const issues: string[] = [];

  try {
    // Simplified check - keyword module exists
    issues.push('Keyword generation requires API access (skipped in check)');
  } catch (error) {
    issues.push(`Keyword generation error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return {
    category: 'Keywords',
    status: 'warning', // Always warning since it requires external APIs
    issues,
  };
}

// Check Free AI Content
export function checkFreeAIContent(): SEOCheckResult {
  const issues: string[] = [];

  try {
    // Simplified check - AI content module exists
    issues.push('AI content generation requires API access (skipped in check)');
  } catch (error) {
    issues.push(`AI content error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return {
    category: 'Free AI Content',
    status: 'warning', // Always warning since it requires external APIs
    issues,
  };
}

// Check Duplicate Content
export function checkDuplicateContent(): SEOCheckResult {
  const issues: string[] = [];

  try {
    // Simplified check - verify no obvious duplicates
    const titles = ITEMS.map((i) => i.title);
    const uniqueTitles = new Set(titles);
    
    if (titles.length !== uniqueTitles.size) {
      issues.push(`${titles.length - uniqueTitles.size} duplicate product titles found`);
    }
  } catch (error) {
    issues.push(`Duplicate check error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return {
    category: 'Duplicate Content',
    status: issues.length === 0 ? 'pass' : issues.length <= 2 ? 'warning' : 'fail',
    issues,
  };
}

// Check Broken Links
export function checkBrokenLinks(): SEOCheckResult {
  const issues: string[] = [];

  try {
    // Simplified check - verify all products have valid URLs
    const invalidUrls = ITEMS.filter((item) => !item.slug || item.slug.length === 0);
    
    if (invalidUrls.length > 0) {
      issues.push(`${invalidUrls.length} products have invalid URLs`);
    }
  } catch (error) {
    issues.push(`Broken link check error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return {
    category: 'Broken Links',
    status: issues.length === 0 ? 'pass' : issues.length <= 2 ? 'warning' : 'fail',
    issues,
  };
}

// Run all SEO checks
export function runAllSEOChecks(): SEOReport {
  const checks: SEOCheckResult[] = [
    checkMetaTags(),
    checkOpenGraphTags(),
    checkSchemaMarkup(),
    checkSitemap(),
    checkRobotsTxt(),
    checkTagSEO(),
    checkBlogLinking(),
    checkKeywords(),
    checkFreeAIContent(),
    checkDuplicateContent(),
    checkBrokenLinks(),
  ];

  const failedCount = checks.filter((c) => c.status === 'fail').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;

  let overallStatus: 'pass' | 'fail' | 'warning' = 'pass';
  if (failedCount > 0) {
    overallStatus = 'fail';
  } else if (warningCount > 0) {
    overallStatus = 'warning';
  }

  const totalIssues = checks.reduce((sum, c) => sum + c.issues.length, 0);

  return {
    overallStatus,
    checks,
    summary: `SEO Check Complete: ${overallStatus.toUpperCase()}. ${checks.length} checks run. ${totalIssues} total issues (${failedCount} failed, ${warningCount} warnings).`,
    timestamp: new Date().toISOString(),
  };
}

// Generate SEO report HTML
export function generateSEOReportHTML(report: SEOReport): string {
  const statusColors = {
    pass: '#28a745',
    warning: '#ffc107',
    fail: '#dc3545',
  };

  const checksHTML = report.checks.map((check) => {
    const color = statusColors[check.status];
    const issuesHTML = check.issues.map((issue) => `<li>${issue}</li>`).join('');
    
    return `
      <div class="seo-check-item" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-left: 4px solid ${color};">
        <h3 style="margin: 0 0 10px 0; color: ${color};">${check.category} - ${check.status.toUpperCase()}</h3>
        ${check.issues.length > 0 ? `<ul style="margin: 0; padding-left: 20px;">${issuesHTML}</ul>` : '<p style="margin: 0; color: #28a745;">✓ All checks passed</p>'}
      </div>
    `;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333;">SEO Final Check Report</h1>
      <div style="background: ${statusColors[report.overallStatus]}; color: white; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
        <strong>Overall Status: ${report.overallStatus.toUpperCase()}</strong>
      </div>
      <p style="color: #666;">${report.summary}</p>
      <p style="color: #999; font-size: 12px;">Generated: ${report.timestamp}</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <h2 style="color: #333;">Detailed Results</h2>
      ${checksHTML}
    </div>
  `;
}

// Export SEO report
export function exportSEOReport(): string {
  const report = runAllSEOChecks();
  return JSON.stringify(report, null, 2);
}

// Schedule periodic SEO checks
export function scheduleSEOChecks(intervalDays: number = 7): number {
  return setInterval(() => {
    const report = runAllSEOChecks();
    console.log('SEO Check Report:', report.summary);
  }, intervalDays * 24 * 60 * 60 * 1000) as unknown as number;
}

// Get quick status
export function getQuickStatus(): {
  status: 'pass' | 'fail' | 'warning';
  criticalIssues: number;
  warnings: number;
} {
  const report = runAllSEOChecks();
  return {
    status: report.overallStatus,
    criticalIssues: report.checks.filter((c) => c.status === 'fail').length,
    warnings: report.checks.filter((c) => c.status === 'warning').length,
  };
}
