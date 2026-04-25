// Canonical + Duplicate Control System
// Manages canonical URLs and prevents duplicate content issues

export interface CanonicalRule {
  pattern: string;
  canonical: string;
  priority: number;
}

export interface DuplicatePage {
  url: string;
  canonical: string;
  similarity: number;
  type: 'exact' | 'near' | 'potential';
}

export interface NoIndexRule {
  pattern: string;
  reason: string;
}

// Canonical URL rules
const CANONICAL_RULES: Array<{ pattern: RegExp; priority: number }> = [
  // Remove tracking parameters
  {
    pattern: /[\?&](ref|utm_source|utm_medium|utm_campaign|fbclid|gclid)=.+/g,
    priority: 1,
  },
  // Remove pagination from canonical
  {
    pattern: /[?&]page=\d+/g,
    priority: 2,
  },
  // Remove sort parameters
  {
    pattern: /[?&]sort=[^&]+/g,
    priority: 2,
  },
  // Force lowercase
  {
    pattern: /[A-Z]/g,
    priority: 3,
  },
  // Remove trailing slashes
  {
    pattern: /\/$/,
    priority: 4,
  },
];

// No-index rules (pages to exclude from indexing)
const NOINDEX_RULES: NoIndexRule[] = [
  {
    pattern: '/search',
    reason: 'Search results page',
  },
  {
    pattern: '/cart',
    reason: 'Cart page',
  },
  {
    pattern: '/checkout',
    reason: 'Checkout page',
  },
  {
    pattern: '/account',
    reason: 'User account page',
  },
  {
    pattern: '/admin',
    reason: 'Admin panel',
  },
  {
    pattern: '/api/',
    reason: 'API endpoints',
  },
  {
    pattern: '/preview/',
    reason: 'Preview pages',
  },
];

// Generate canonical URL
export function generateCanonicalUrl(url: string): string {
  let canonical = url;

  // Apply canonical rules
  CANONICAL_RULES.forEach((rule) => {
    if (rule.priority === 1) {
      // Remove tracking parameters
      canonical = canonical.replace(rule.pattern, '');
    } else if (rule.priority === 2) {
      // Remove pagination and sort
      canonical = canonical.replace(rule.pattern, '');
    } else if (rule.priority === 3) {
      // Force lowercase
      canonical = canonical.toLowerCase();
    } else if (rule.priority === 4) {
      // Remove trailing slash
      canonical = canonical.replace(rule.pattern, '');
    }
  });

  // Clean up multiple query parameters
  if (canonical.includes('?')) {
    const [path, query] = canonical.split('?');
    const params = new URLSearchParams(query);
    
    // Remove empty parameters
    for (const [key, value] of params.entries()) {
      if (!value) {
        params.delete(key);
      }
    }
    
    const queryString = params.toString();
    canonical = queryString ? `${path}?${queryString}` : path;
  }

  return canonical;
}

// Check if URL should be no-indexed
export function shouldNoIndex(url: string): boolean {
  return NOINDEX_RULES.some((rule) => url.includes(rule.pattern));
}

// Get no-index reason
export function getNoIndexReason(url: string): string | null {
  const rule = NOINDEX_RULES.find((rule) => url.includes(rule.pattern));
  return rule ? rule.reason : null;
}

// Calculate content similarity (simplified)
export function calculateSimilarity(content1: string, content2: string): number {
  const words1 = content1.toLowerCase().split(/\s+/);
  const words2 = content2.toLowerCase().split(/\s+/);
  
  const intersection = words1.filter((word) => words2.includes(word));
  const union = new Set([...words1, ...words2]);
  
  return intersection.length / union.size;
}

// Detect duplicate pages
export function detectDuplicatePages(
  pages: Array<{ url: string; content: string }>,
  threshold: number = 0.85
): DuplicatePage[] {
  const duplicates: DuplicatePage[] = [];

  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const similarity = calculateSimilarity(pages[i].content, pages[j].content);
      
      if (similarity >= threshold) {
        const canonical = generateCanonicalUrl(pages[i].url);
        
        duplicates.push({
          url: pages[j].url,
          canonical,
          similarity,
          type: similarity >= 0.95 ? 'exact' : similarity >= 0.85 ? 'near' : 'potential',
        });
      }
    }
  }

  return duplicates;
}

// Generate rel="canonical" tag
export function generateCanonicalTag(url: string): string {
  const canonical = generateCanonicalUrl(url);
  return `<link rel="canonical" href="https://erpvala.com${canonical}" />`;
}

// Generate robots meta tag
export function generateRobotsMeta(url: string): string {
  if (shouldNoIndex(url)) {
    return '<meta name="robots" content="noindex, nofollow" />';
  }
  return '<meta name="robots" content="index, follow" />';
}

// Check for duplicate content by URL pattern
export function checkUrlPatternDuplication(urls: string[]): Map<string, string[]> {
  const patternMap = new Map<string, string[]>();

  urls.forEach((url) => {
    // Remove dynamic parts for pattern matching
    const pattern = url
      .replace(/\d+/g, '{id}')
      .replace(/[a-f0-9]{24}/g, '{uuid}')
      .replace(/[a-f0-9]{8}/g, '{shortid}');

    if (!patternMap.has(pattern)) {
      patternMap.set(pattern, []);
    }
    patternMap.get(pattern)!.push(url);
  });

  return patternMap;
}

// Find potential duplicate URL patterns
export function findDuplicatePatterns(urls: string[]): Array<{
  pattern: string;
  urls: string[];
  count: number;
}> {
  const patternMap = checkUrlPatternDuplication(urls);
  const duplicates: Array<{ pattern: string; urls: string[]; count: number }> = [];

  patternMap.forEach((urls, pattern) => {
    if (urls.length > 1) {
      duplicates.push({
        pattern,
        urls,
        count: urls.length,
      });
    }
  });

  return duplicates.sort((a, b) => b.count - a.count);
}

// Normalize URL for comparison
export function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/\/$/, '')
    .replace(/[\?&].*/, '')
    .replace(/https?:\/\/[^\/]+/, '');
}

// Check if two URLs are equivalent
export function areUrlsEquivalent(url1: string, url2: string): boolean {
  return normalizeUrl(url1) === normalizeUrl(url2);
}

// Generate hreflang tags
export function generateHreflangTags(
  url: string,
  locales: Array<{ lang: string; url: string }>
): string {
  const tagList = locales.map((locale) => 
    `<link rel="alternate" hreflang="${locale.lang}" href="${locale.url}" />`
  );
  
  // Add x-default
  const defaultLocale = locales[0];
  tagList.push(`<link rel="alternate" hreflang="x-default" href="${defaultLocale.url}" />`);
  
  return tagList.join('\n');
}

// Add duplicate content to blacklist
const duplicateBlacklist = new Set<string>();

export function addToBlacklist(url: string): void {
  duplicateBlacklist.add(url);
}

export function isBlacklisted(url: string): boolean {
  return duplicateBlacklist.has(url);
}

export function removeFromBlacklist(url: string): boolean {
  return duplicateBlacklist.delete(url);
}

// Generate redirect rules for duplicates
export function generateRedirectRules(duplicates: DuplicatePage[]): Array<{
  from: string;
  to: string;
  type: '301' | '302';
}> {
  return duplicates.map((dup) => ({
    from: dup.url,
    to: dup.canonical,
    type: '301' as const,
  }));
}

// Validate canonical URL
export function validateCanonicalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && urlObj.hostname === 'erpvala.com';
  } catch {
    return false;
  }
}

// Get canonical URL suggestions
export function getCanonicalSuggestions(url: string): string[] {
  const suggestions: string[] = [];
  const canonical = generateCanonicalUrl(url);

  suggestions.push(canonical);

  // Suggest variations
  if (url.includes('?')) {
    suggestions.push(url.split('?')[0]);
  }

  if (url.endsWith('/')) {
    suggestions.push(url.slice(0, -1));
  }

  return [...new Set(suggestions)];
}

// Check for canonical chain issues
export function checkCanonicalChain(urls: Array<{ url: string; canonical: string }>): Array<{
  url: string;
  issue: string;
}> {
  const issues: Array<{ url: string; issue: string }> = [];

  urls.forEach(({ url, canonical }) => {
    // Check if canonical points to itself
    if (url === canonical) {
      issues.push({ url, issue: 'Canonical points to itself' });
    }

    // Check if canonical is blacklisted
    if (isBlacklisted(canonical)) {
      issues.push({ url, issue: 'Canonical URL is blacklisted' });
    }

    // Check if canonical is valid
    if (!validateCanonicalUrl(canonical)) {
      issues.push({ url, issue: 'Invalid canonical URL' });
    }
  });

  return issues;
}

// Generate duplicate content report
export function generateDuplicateReport(
  pages: Array<{ url: string; content: string }>
): {
  totalDuplicates: number;
  exactDuplicates: number;
  nearDuplicates: number;
  potentialDuplicates: number;
  duplicates: DuplicatePage[];
  blacklistSize: number;
} {
  const duplicates = detectDuplicatePages(pages);
  const exactDuplicates = duplicates.filter((d) => d.type === 'exact').length;
  const nearDuplicates = duplicates.filter((d) => d.type === 'near').length;
  const potentialDuplicates = duplicates.filter((d) => d.type === 'potential').length;

  return {
    totalDuplicates: duplicates.length,
    exactDuplicates,
    nearDuplicates,
    potentialDuplicates,
    duplicates,
    blacklistSize: duplicateBlacklist.size,
  };
}

// Auto-fix duplicate content
export function autoFixDuplicates(duplicates: DuplicatePage[]): number {
  let fixed = 0;

  duplicates.forEach((dup) => {
    if (dup.type === 'exact') {
      addToBlacklist(dup.url);
      fixed++;
    }
  });

  return fixed;
}

// Get canonical statistics
export function getCanonicalStats(): {
  totalRules: number;
  noIndexRules: number;
  blacklistSize: number;
} {
  return {
    totalRules: CANONICAL_RULES.length,
    noIndexRules: NOINDEX_RULES.length,
    blacklistSize: duplicateBlacklist.size,
  };
}
