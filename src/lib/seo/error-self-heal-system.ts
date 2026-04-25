// Error/Broken Link Self-Heal System
// Detects and fixes 404 pages and broken links automatically

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';

export interface LinkCheck {
  url: string;
  status: 'valid' | 'broken' | 'redirect' | '404';
  statusCode?: number;
  lastChecked: string;
}

export interface RedirectRule {
  from: string;
  to: string;
  type: '301' | '302';
  createdAt: string;
}

export interface ErrorReport {
  url: string;
  errorType: '404' | '500' | 'timeout' | 'invalid';
  occurrences: number;
  lastSeen: string;
  suggestedFix?: string;
}

// Link check cache
const linkCheckCache = new Map<string, LinkCheck>();
const redirectRules = new Map<string, RedirectRule>();
const errorReports = new Map<string, ErrorReport>();

// Check if URL is valid
export async function checkUrl(url: string): Promise<LinkCheck> {
  const cached = linkCheckCache.get(url);
  const now = new Date();
  
  // Return cached if less than 24 hours old
  if (cached && (now.getTime() - new Date(cached.lastChecked).getTime()) < 86400000) {
    return cached;
  }

  try {
    const response = await fetch(url, { method: 'HEAD' });
    
    const check: LinkCheck = {
      url,
      status: response.ok ? 'valid' : response.status === 404 ? '404' : 'broken',
      statusCode: response.status,
      lastChecked: now.toISOString(),
    };

    linkCheckCache.set(url, check);
    return check;
  } catch (error) {
    const check: LinkCheck = {
      url,
      status: 'broken',
      lastChecked: now.toISOString(),
    };

    linkCheckCache.set(url, check);
    return check;
  }
}

// Check all internal links
export async function checkInternalLinks(): Promise<LinkCheck[]> {
  const urls: string[] = [];

  // Product URLs
  ITEMS.forEach((item) => {
    urls.push(`https://erpvala.com/marketplace/item/${item.slug}`);
  });

  // Category URLs
  CATEGORY_TREE.forEach((cat) => {
    urls.push(`https://erpvala.com/marketplace/category?category=${cat.slug}`);
  });

  // Check all URLs
  const checks = await Promise.all(urls.map((url) => checkUrl(url)));
  return checks;
}

// Find broken links
export function findBrokenLinks(): LinkCheck[] {
  return Array.from(linkCheckCache.values()).filter(
    (check) => check.status === 'broken' || check.status === '404'
  );
}

// Suggest fix for broken link
export function suggestFix(brokenUrl: string): string | null {
  const urlPath = new URL(brokenUrl).pathname;
  
  // Try to find similar product
  const slug = urlPath.split('/').pop();
  if (slug) {
    const similarProduct = ITEMS.find((item) =>
      item.slug.includes(slug) || slug.includes(item.slug)
    );
    if (similarProduct) {
      return `/marketplace/item/${similarProduct.slug}`;
    }
  }

  // Try to find similar category
  const categoryMatch = urlPath.match(/category=([^&]+)/);
  if (categoryMatch) {
    const similarCategory = CATEGORY_TREE.find((cat) =>
      cat.slug.includes(categoryMatch[1]) || categoryMatch[1].includes(cat.slug)
    );
    if (similarCategory) {
      return `/marketplace/category?category=${similarCategory.slug}`;
    }
  }

  // Default to marketplace
  return '/marketplace';
}

// Create redirect rule
export function createRedirectRule(
  from: string,
  to: string,
  type: '301' | '302' = '301'
): RedirectRule {
  const rule: RedirectRule = {
    from,
    to,
    type,
    createdAt: new Date().toISOString(),
  };

  redirectRules.set(from, rule);
  return rule;
}

// Apply redirect rule
export function applyRedirect(url: string): string | null {
  const rule = redirectRules.get(url);
  if (rule) {
    return rule.to;
  }

  // Check for pattern-based redirects
  for (const [from, rule] of redirectRules.entries()) {
    if (url.includes(from)) {
      return url.replace(from, rule.to);
    }
  }

  return null;
}

// Auto-fix broken links
export async function autoFixBrokenLinks(): Promise<{
  fixed: number;
  redirectsCreated: number;
  errors: string[];
}> {
  const brokenLinks = findBrokenLinks();
  let fixed = 0;
  let redirectsCreated = 0;
  const errors: string[] = [];

  for (const link of brokenLinks) {
    const suggestedFix = suggestFix(link.url);
    
    if (suggestedFix) {
      createRedirectRule(link.url, suggestedFix, '301');
      redirectsCreated++;
      fixed++;
    } else {
      errors.push(`No fix found for: ${link.url}`);
    }
  }

  return { fixed, redirectsCreated, errors };
}

// Log error
export function logError(url: string, errorType: ErrorReport['errorType']): void {
  const existing = errorReports.get(url);
  
  if (existing) {
    existing.occurrences++;
    existing.lastSeen = new Date().toISOString();
    errorReports.set(url, existing);
  } else {
    const report: ErrorReport = {
      url,
      errorType,
      occurrences: 1,
      lastSeen: new Date().toISOString(),
      suggestedFix: suggestFix(url),
    };

    errorReports.set(url, report);
  }
}

// Get error report
export function getErrorReport(url: string): ErrorReport | undefined {
  return errorReports.get(url);
}

// Get all error reports
export function getAllErrorReports(): ErrorReport[] {
  return Array.from(errorReports.values()).sort((a, b) => b.occurrences - a.occurrences);
}

// Get top errors
export function getTopErrors(limit: number = 10): ErrorReport[] {
  return getAllErrorReports().slice(0, limit);
}

// Clear old error reports (older than 30 days)
export function clearOldErrorReports(): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let cleared = 0;

  for (const [url, report] of errorReports.entries()) {
    if (new Date(report.lastSeen) < thirtyDaysAgo) {
      errorReports.delete(url);
      cleared++;
    }
  }

  return cleared;
}

// Validate redirect rules
export function validateRedirectRules(): Array<{
  rule: RedirectRule;
  valid: boolean;
  error?: string;
}> {
  const results: Array<{ rule: RedirectRule; valid: boolean; error?: string }> = [];

  redirectRules.forEach((rule) => {
    const valid = rule.to.startsWith('/') && rule.to.length > 0;
    results.push({
      rule,
      valid,
      error: valid ? undefined : 'Invalid redirect target',
    });
  });

  return results;
}

// Export redirect rules as nginx config
export function exportNginxRedirects(): string {
  const rules = Array.from(redirectRules.values());
  
  return rules.map((rule) => {
    const statusCode = rule.type === '301' ? 'permanent' : 'redirect';
    return `rewrite ^${rule.from}$ ${rule.to} ${statusCode};`;
  }).join('\n');
}

// Export redirect rules as Apache .htaccess
export function exportApacheRedirects(): string {
  const rules = Array.from(redirectRules.values());
  
  return rules.map((rule) => {
    const statusCode = rule.type === '301' ? '301' : '302';
    return `Redirect ${statusCode} ${rule.from} ${rule.to}`;
  }).join('\n');
}

// Import redirect rules
export function importRedirectRules(rules: RedirectRule[]): void {
  rules.forEach((rule) => {
    redirectRules.set(rule.from, rule);
  });
}

// Get redirect statistics
export function getRedirectStats(): {
  totalRules: number;
  byType: Record<string, number>;
  oldestRule: string;
  newestRule: string;
} {
  const rules = Array.from(redirectRules.values());
  const byType: Record<string, number> = { '301': 0, '302': 0 };

  rules.forEach((rule) => {
    byType[rule.type]++;
  });

  const sortedByDate = rules.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return {
    totalRules: rules.length,
    byType,
    oldestRule: sortedByDate[0]?.createdAt || '',
    newestRule: sortedByDate[sortedByDate.length - 1]?.createdAt || '',
  };
}

// Schedule periodic link checking
export function scheduleLinkCheck(intervalHours: number = 24): number {
  return setInterval(async () => {
    await checkInternalLinks();
    await autoFixBrokenLinks();
  }, intervalHours * 60 * 60 * 1000) as unknown as number;
}

// Check for orphan pages (pages with no inbound links)
export function findOrphanPages(): string[] {
  const allUrls = new Set<string>();
  const linkedUrls = new Set<string>();

  // Collect all URLs
  ITEMS.forEach((item) => {
    allUrls.add(`/marketplace/item/${item.slug}`);
  });

  CATEGORY_TREE.forEach((cat) => {
    allUrls.add(`/marketplace/category?category=${cat.slug}`);
  });

  // In a real implementation, you'd crawl the site to find all linked URLs
  // For now, we'll simulate this by checking if pages are referenced

  // Return pages that might be orphans (simplified)
  return Array.from(allUrls).filter((url) => !linkedUrls.has(url));
}

// Generate 404 page content
export function generate404Content(requestedUrl: string): string {
  const suggestedFix = suggestFix(requestedUrl);
  
  return `
# Page Not Found

The page you requested could not be found.

**Requested URL:** ${requestedUrl}

${suggestedFix ? `**Suggested Page:** [${suggestedFix}](${suggestedFix})` : ''}

## What to do next:

- [Return to Homepage](/)
- [Browse Marketplace](/marketplace)
- [Search for Products](/marketplace/search)

## Popular Categories:

${CATEGORY_TREE.slice(0, 5).map(cat => `- [${cat.title}](/marketplace/category?category=${cat.slug})`).join('\n')}

## Popular Products:

${ITEMS.slice(0, 5).map(item => `- [${item.title}](/marketplace/item/${item.slug})`).join('\n')}
  `.trim();
}

// Monitor 404 rate (to detect attacks)
export function monitor404Rate(): {
  total404s: number;
  ratePerHour: number;
  suspicious: boolean;
} {
  const reports = getAllErrorReports().filter((r) => r.errorType === '404');
  const total404s = reports.reduce((sum, r) => sum + r.occurrences, 0);
  
  // Calculate rate (simplified - assumes reports are from last hour)
  const ratePerHour = total404s;
  const suspicious = ratePerHour > 100; // More than 100 404s per hour is suspicious

  return {
    total404s,
    ratePerHour,
    suspicious,
  };
}

// Block suspicious IPs (placeholder - would need real IP tracking)
export function blockSuspiciousIPs(): string[] {
  const suspiciousIPs: string[] = [];
  
  // In production, implement actual IP blocking logic
  // This would involve tracking IPs that generate many 404s
  
  return suspiciousIPs;
}

// Get system health report
export function getSystemHealthReport(): {
  totalLinksChecked: number;
  brokenLinks: number;
  redirectRules: number;
  errorReports: number;
  systemStatus: 'healthy' | 'warning' | 'critical';
} {
  const brokenLinks = findBrokenLinks().length;
  const errorReportsCount = errorReports.size;
  const totalLinksChecked = linkCheckCache.size;

  let systemStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  
  if (brokenLinks > 50 || errorReportsCount > 100) {
    systemStatus = 'critical';
  } else if (brokenLinks > 10 || errorReportsCount > 20) {
    systemStatus = 'warning';
  }

  return {
    totalLinksChecked,
    brokenLinks,
    redirectRules: redirectRules.size,
    errorReports: errorReportsCount,
    systemStatus,
  };
}

// Clear all caches
export function clearAllCaches(): void {
  linkCheckCache.clear();
  errorReports.clear();
}

// Export system state
export function exportSystemState(): string {
  return JSON.stringify({
    linkChecks: Array.from(linkCheckCache.entries()),
    redirectRules: Array.from(redirectRules.entries()),
    errorReports: Array.from(errorReports.entries()),
  }, null, 2);
}

// Import system state
export function importSystemState(json: string): void {
  const data = JSON.parse(json);
  
  if (data.linkChecks) {
    data.linkChecks.forEach(([url, check]: [string, LinkCheck]) => {
      linkCheckCache.set(url, check);
    });
  }

  if (data.redirectRules) {
    data.redirectRules.forEach(([from, rule]: [string, RedirectRule]) => {
      redirectRules.set(from, rule);
    });
  }

  if (data.errorReports) {
    data.errorReports.forEach(([url, report]: [string, ErrorReport]) => {
      errorReports.set(url, report);
    });
  }
}
