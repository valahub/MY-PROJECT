// Robots.txt Generator
// Controls crawler access for SEO optimization

export interface RobotsRule {
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
}

export interface SitemapDirective {
  url: string;
}

// Default robots rules
const DEFAULT_RULES: RobotsRule[] = [
  {
    userAgent: '*',
    allow: [
      '/',
      '/marketplace',
      '/marketplace/category',
      '/marketplace/item',
      '/marketplace/tag',
      '/marketplace/blog',
      '/plugins',
      '/product',
      '/tag',
    ],
    disallow: [
      '/admin',
      '/api',
      '/cart',
      '/checkout',
      '/account',
      '/search',
      '/preview',
      '/api/',
      '/admin/',
      '/private',
      '/_next',
      '/static',
    ],
    crawlDelay: 1,
  },
  {
    userAgent: 'Googlebot',
    allow: ['/', '/marketplace', '/plugins', '/product', '/tag'],
    disallow: ['/admin', '/api', '/cart', '/checkout', '/account'],
  },
  {
    userAgent: 'Bingbot',
    allow: ['/', '/marketplace', '/plugins', '/product', '/tag'],
    disallow: ['/admin', '/api', '/cart', '/checkout', '/account'],
  },
];

// Sitemap URLs
const SITEMAP_URLS: SitemapDirective[] = [
  { url: 'https://erpvala.com/sitemap.xml' },
];

// Generate robots.txt content
export function generateRobotsTxt(): string {
  const lines: string[] = [];

  DEFAULT_RULES.forEach((rule) => {
    lines.push(`User-agent: ${rule.userAgent}`);
    
    rule.allow.forEach((path) => {
      lines.push(`Allow: ${path}`);
    });
    
    rule.disallow.forEach((path) => {
      lines.push(`Disallow: ${path}`);
    });
    
    if (rule.crawlDelay) {
      lines.push(`Crawl-delay: ${rule.crawlDelay}`);
    }
    
    lines.push(''); // Empty line between rules
  });

  // Add sitemap directives
  SITEMAP_URLS.forEach((sitemap) => {
    lines.push(`Sitemap: ${sitemap.url}`);
  });

  return lines.join('\n');
}

// Add custom rule
export function addCustomRule(rule: RobotsRule): void {
  DEFAULT_RULES.push(rule);
}

// Remove rule by user agent
export function removeRule(userAgent: string): boolean {
  const index = DEFAULT_RULES.findIndex((r) => r.userAgent === userAgent);
  if (index > -1) {
    DEFAULT_RULES.splice(index, 1);
    return true;
  }
  return false;
}

// Add sitemap URL
export function addSitemap(url: string): void {
  SITEMAP_URLS.push({ url });
}

// Remove sitemap URL
export function removeSitemap(url: string): boolean {
  const index = SITEMAP_URLS.findIndex((s) => s.url === url);
  if (index > -1) {
    SITEMAP_URLS.splice(index, 1);
    return true;
  }
  return false;
}

// Block spam filter URLs
export function blockSpamFilters(): void {
  const spamPatterns = [
    '?price=',
    '?rating=',
    '?sort=',
    '?page=',
    '?filter=',
  ];

  const rule = DEFAULT_RULES.find((r) => r.userAgent === '*');
  if (rule) {
    spamPatterns.forEach((pattern) => {
      rule.disallow.push(pattern);
    });
  }
}

// Allow specific filter patterns
export function allowFilterPatterns(patterns: string[]): void {
  const rule = DEFAULT_RULES.find((r) => r.userAgent === '*');
  if (rule) {
    patterns.forEach((pattern) => {
      rule.allow.push(pattern);
    });
  }
}

// Generate robots.txt for specific environment
export function generateEnvironmentRobotsTxt(environment: 'production' | 'staging' | 'development'): string {
  if (environment === 'development') {
    return `User-agent: *
Disallow: /
`;
  }

  if (environment === 'staging') {
    return `User-agent: *
Disallow: /
Allow: /marketplace
Sitemap: https://staging.erpvala.com/sitemap.xml
`;
  }

  return generateRobotsTxt();
}

// Validate robots.txt
export function validateRobotsTxt(content: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const lines = content.split('\n');

  let hasUserAgent = false;
  let hasSitemap = false;

  lines.forEach((line) => {
    if (line.startsWith('User-agent:')) {
      hasUserAgent = true;
    }
    if (line.startsWith('Sitemap:')) {
      hasSitemap = true;
    }
  });

  if (!hasUserAgent) {
    errors.push('Missing User-agent directive');
  }

  if (!hasSitemap) {
    errors.push('Missing Sitemap directive');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get robots.txt statistics
export function getRobotsStats(): {
  totalRules: number;
  totalSitemaps: number;
  allowedPaths: number;
  disallowedPaths: number;
} {
  const totalRules = DEFAULT_RULES.length;
  const totalSitemaps = SITEMAP_URLS.length;
  const allowedPaths = DEFAULT_RULES.reduce((sum, r) => sum + r.allow.length, 0);
  const disallowedPaths = DEFAULT_RULES.reduce((sum, r) => sum + r.disallow.length, 0);

  return {
    totalRules,
    totalSitemaps,
    allowedPaths,
    disallowedPaths,
  };
}

// Export robots configuration as JSON
export function exportRobotsConfig(): string {
  return JSON.stringify({
    rules: DEFAULT_RULES,
    sitemaps: SITEMAP_URLS,
  }, null, 2);
}

// Import robots configuration from JSON
export function importRobotsConfig(json: string): void {
  const data = JSON.parse(json);
  
  if (data.rules) {
    DEFAULT_RULES.length = 0;
    DEFAULT_RULES.push(...data.rules);
  }

  if (data.sitemaps) {
    SITEMAP_URLS.length = 0;
    SITEMAP_URLS.push(...data.sitemaps);
  }
}

// Test if URL is allowed by robots.txt
export function isUrlAllowed(url: string, userAgent: string = '*'): boolean {
  const rule = DEFAULT_RULES.find((r) => r.userAgent === userAgent || r.userAgent === '*');
  if (!rule) return true;

  const path = new URL(url, 'https://erpvala.com').pathname;

  // Check disallow patterns
  for (const disallow of rule.disallow) {
    if (path.startsWith(disallow) || path.includes(disallow)) {
      return false;
    }
  }

  // Check allow patterns
  for (const allow of rule.allow) {
    if (path.startsWith(allow) || path.includes(allow)) {
      return true;
    }
  }

  return true;
}

// Generate robots.txt with custom rules
export function generateCustomRobotsTxt(customRules: RobotsRule[]): string {
  const lines: string[] = [];

  customRules.forEach((rule) => {
    lines.push(`User-agent: ${rule.userAgent}`);
    
    rule.allow.forEach((path) => {
      lines.push(`Allow: ${path}`);
    });
    
    rule.disallow.forEach((path) => {
      lines.push(`Disallow: ${path}`);
    });
    
    if (rule.crawlDelay) {
      lines.push(`Crawl-delay: ${rule.crawlDelay}`);
    }
    
    lines.push('');
  });

  SITEMAP_URLS.forEach((sitemap) => {
    lines.push(`Sitemap: ${sitemap.url}`);
  });

  return lines.join('\n');
}

// Reset to default rules
export function resetToDefaults(): void {
  DEFAULT_RULES.length = 0;
  DEFAULT_RULES.push(
    {
      userAgent: '*',
      allow: ['/', '/marketplace', '/marketplace/category', '/marketplace/item', '/marketplace/tag', '/marketplace/blog'],
      disallow: ['/admin', '/api', '/cart', '/checkout', '/account', '/search', '/preview'],
      crawlDelay: 1,
    },
    {
      userAgent: 'Googlebot',
      allow: ['/', '/marketplace'],
      disallow: ['/admin', '/api', '/cart', '/checkout', '/account'],
    }
  );

  SITEMAP_URLS.length = 0;
  SITEMAP_URLS.push({ url: 'https://erpvala.com/sitemap.xml' });
}

// Get blocked paths
export function getBlockedPaths(): string[] {
  const blocked: string[] = [];
  DEFAULT_RULES.forEach((rule) => {
    blocked.push(...rule.disallow);
  });
  return [...new Set(blocked)];
}

// Get allowed paths
export function getAllowedPaths(): string[] {
  const allowed: string[] = [];
  DEFAULT_RULES.forEach((rule) => {
    allowed.push(...rule.allow);
  });
  return [...new Set(allowed)];
}
