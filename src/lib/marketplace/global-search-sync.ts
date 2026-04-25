// Global Search Sync System
// Category-aware search with API integration and auto-suggest

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';

export interface SearchSuggestion {
  id: string;
  title: string;
  category: string;
  slug: string;
  type: 'product' | 'category' | 'tag';
}

export interface SearchRequest {
  query: string;
  category?: string;
  limit?: number;
}

export interface SearchResponse {
  results: SearchSuggestion[];
  total: number;
  took: number;
}

// Search cache
const searchCache = new Map<string, SearchResponse>();

// Search within category
export function searchWithinCategory(query: string, categorySlug?: string): SearchSuggestion[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) return [];

  let products = ITEMS;

  // Filter by category if specified
  if (categorySlug) {
    products = products.filter((item) => item.category === categorySlug);
  }

  // Search in title, description, tags
  const results = products.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(normalizedQuery);
    const descMatch = item.description.toLowerCase().includes(normalizedQuery);
    const tagMatch = item.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
    const authorMatch = item.author.toLowerCase().includes(normalizedQuery);
    
    return titleMatch || descMatch || tagMatch || authorMatch;
  });

  return results.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    slug: item.slug,
    type: 'product' as const,
  }));
}

// Generate search suggestions
export function generateSearchSuggestions(query: string, limit: number = 5): SearchSuggestion[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery || normalizedQuery.length < 2) return [];

  const suggestions: SearchSuggestion[] = [];

  // Product suggestions
  const productMatches = ITEMS.filter((item) =>
    item.title.toLowerCase().includes(normalizedQuery)
  ).slice(0, limit);

  productMatches.forEach((item) => {
    suggestions.push({
      id: item.id,
      title: item.title,
      category: item.category,
      slug: item.slug,
      type: 'product',
    });
  });

  // Category suggestions
  const categoryMatches = CATEGORY_TREE.filter((cat) =>
    cat.title.toLowerCase().includes(normalizedQuery) ||
    cat.slug.toLowerCase().includes(normalizedQuery)
  ).slice(0, 2);

  categoryMatches.forEach((cat) => {
    suggestions.push({
      id: cat.slug,
      title: cat.title,
      category: cat.slug,
      slug: cat.slug,
      type: 'category',
    });
  });

  return suggestions.slice(0, limit);
}

// Execute search with caching
export function executeSearch(request: SearchRequest): SearchResponse {
  const cacheKey = `${request.query}-${request.category || 'all'}-${request.limit || 20}`;
  
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const startTime = Date.now();
  const results = searchWithinCategory(request.query, request.category);
  const took = Date.now() - startTime;

  const response: SearchResponse = {
    results: results.slice(0, request.limit || 20),
    total: results.length,
    took,
  };

  searchCache.set(cacheKey, response);
  return response;
}

// Build search URL with query params
export function buildSearchUrl(query: string, category?: string): string {
  const params = new URLSearchParams();
  params.set('search', query);
  
  if (category) {
    params.set('category', category);
  }

  return `/marketplace?${params.toString()}`;
}

// Parse search query from URL
export function parseSearchQuery(url: string): {
  query: string;
  category?: string;
} {
  const urlObj = new URL(url, 'https://erpvala.com');
  const search = urlObj.searchParams.get('search') || '';
  const category = urlObj.searchParams.get('category') || undefined;

  return {
    query: search,
    category,
  };
}

// Get popular search terms
export function getPopularSearchTerms(limit: number = 10): string[] {
  // In production, this would come from analytics
  const popularTerms = [
    'react',
    'vue',
    'wordpress',
    'ecommerce',
    'dashboard',
    'admin',
    'plugin',
    'template',
    'api',
    'authentication',
  ];

  return popularTerms.slice(0, limit);
}

// Get recent searches (from localStorage)
export function getRecentSearches(limit: number = 5): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem('recent-searches');
    if (!stored) return [];

    const searches = JSON.parse(stored) as string[];
    return searches.slice(0, limit);
  } catch {
    return [];
  }
}

// Save search to recent searches
export function saveRecentSearch(query: string): void {
  if (typeof window === 'undefined') return;

  try {
    const recent = getRecentSearches(10);
    const filtered = recent.filter((s) => s.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, 10);
    
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

// Clear recent searches
export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('recent-searches');
  } catch {
    // Ignore storage errors
  }
}

// Clear search cache
export function clearSearchCache(): void {
  searchCache.clear();
}

// Get search statistics
export function getSearchStats(): {
  cacheSize: number;
  recentSearches: number;
  popularTerms: number;
} {
  return {
    cacheSize: searchCache.size,
    recentSearches: getRecentSearches().length,
    popularTerms: getPopularSearchTerms().length,
  };
}

// Validate search query
export function validateSearchQuery(query: string): {
  valid: boolean;
  sanitized: string;
  issues: string[];
} {
  const issues: string[] = [];
  let sanitized = query.trim();

  // Check for SQL injection patterns
  const sqlPatterns = ["'", '"', ';', '--', '/*', '*/', 'xp_', 'exec'];
  if (sqlPatterns.some((pattern) => sanitized.includes(pattern))) {
    issues.push('Potentially malicious characters detected');
    sanitized = sanitized.replace(/['";\-\-\/*\*\/xp_exec]/g, '');
  }

  // Check for XSS patterns
  const xssPatterns = ['<script', 'javascript:', 'onerror=', 'onload='];
  if (xssPatterns.some((pattern) => sanitized.toLowerCase().includes(pattern))) {
    issues.push('XSS patterns detected');
    sanitized = sanitized.replace(/<script|javascript:|onerror=|onload=/gi, '');
  }

  // Check length
  if (sanitized.length > 200) {
    issues.push('Query too long');
    sanitized = sanitized.substring(0, 200);
  }

  if (sanitized.length === 0) {
    issues.push('Empty query after sanitization');
  }

  return {
    valid: issues.length === 0,
    sanitized,
    issues,
  };
}

// Simulate API call for search
export async function searchAPI(request: SearchRequest): Promise<SearchResponse> {
  // Validate query
  const validation = validateSearchQuery(request.query);
  if (!validation.valid) {
    return {
      results: [],
      total: 0,
      took: 0,
    };
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return executeSearch({
    ...request,
    query: validation.sanitized,
  });
}

// Get search results by category
export function getSearchResultsByCategory(query: string): Record<string, SearchSuggestion[]> {
  const results: Record<string, SearchSuggestion[]> = {};

  CATEGORY_TREE.forEach((category) => {
    const categoryResults = searchWithinCategory(query, category.slug);
    if (categoryResults.length > 0) {
      results[category.slug] = categoryResults;
    }
  });

  return results;
}

// Export search cache
export function exportSearchCache(): string {
  return JSON.stringify(Array.from(searchCache.entries()), null, 2);
}

// Import search cache
export function importSearchCache(json: string): void {
  const data = JSON.parse(json) as Array<[string, SearchResponse]>;
  data.forEach(([key, value]) => {
    searchCache.set(key, value);
  });
}
