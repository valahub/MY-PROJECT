// Long Tail Keyword Generation System
// Generates SEO keywords using free APIs (Datamuse, DuckDuckGo, Wikipedia)

export interface KeywordSuggestion {
  keyword: string;
  volume?: number;
  difficulty?: number;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  source: 'datamuse' | 'duckduckgo' | 'wikipedia' | 'internal';
}

export interface KeywordCluster {
  primary: string;
  secondary: string[];
  longTail: string[];
  questions: string[];
}

// Datamuse API integration (free)
export async function fetchDatamuseKeywords(
  query: string,
  maxResults: number = 50
): Promise<KeywordSuggestion[]> {
  try {
    const response = await fetch(
      `https://api.datamuse.com/words?ml=${encodeURIComponent(query)}&max=${maxResults}`
    );
    
    if (!response.ok) {
      throw new Error('Datamuse API error');
    }

    const data = await response.json();
    
    return data.map((item: any) => ({
      keyword: item.word,
      score: item.score,
      intent: 'informational' as const,
      source: 'datamuse' as const,
    }));
  } catch (error) {
    console.error('Datamuse API error:', error);
    return [];
  }
}

// DuckDuckGo Instant Answer API (free)
export async function fetchDuckDuckGoSuggestions(
  query: string,
  maxResults: number = 10
): Promise<KeywordSuggestion[]> {
  try {
    const response = await fetch(
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`
    );
    
    if (!response.ok) {
      throw new Error('DuckDuckGo API error');
    }

    const data = await response.json();
    
    return (data.slice(0, maxResults) || []).map((item: string) => ({
      keyword: item,
      intent: 'navigational' as const,
      source: 'duckduckgo' as const,
    }));
  } catch (error) {
    console.error('DuckDuckGo API error:', error);
    return [];
  }
}

// Wikipedia API integration (free)
export async function fetchWikipediaKeywords(
  query: string,
  maxResults: number = 10
): Promise<KeywordSuggestion[]> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${maxResults}&format=json&origin=*`
    );
    
    if (!response.ok) {
      throw new Error('Wikipedia API error');
    }

    const data = await response.json();
    const titles = data[1] || [];
    
    return titles.map((title: string) => ({
      keyword: title,
      intent: 'informational' as const,
      source: 'wikipedia' as const,
    }));
  } catch (error) {
    console.error('Wikipedia API error:', error);
    return [];
  }
}

// Internal keyword generation from product data
export function generateInternalKeywords(
  baseKeyword: string,
  category?: string,
  tags: string[] = []
): KeywordSuggestion[] {
  const keywords: KeywordSuggestion[] = [];
  
  const modifiers = [
    'best',
    'top',
    'cheap',
    'affordable',
    'premium',
    'free',
    'open source',
    'professional',
    'enterprise',
    'latest',
    '2026',
  ];

  const suffixes = [
    'for business',
    'for startups',
    'for ecommerce',
    'for wordpress',
    'for react',
    'for laravel',
    'script',
    'plugin',
    'template',
    'theme',
    'online',
    'download',
    'tutorial',
    'guide',
  ];

  // Generate modifier + keyword combinations
  modifiers.forEach((mod) => {
    keywords.push({
      keyword: `${mod} ${baseKeyword}`,
      intent: 'commercial' as const,
      source: 'internal' as const,
    });
  });

  // Generate keyword + suffix combinations
  suffixes.forEach((suffix) => {
    keywords.push({
      keyword: `${baseKeyword} ${suffix}`,
      intent: 'informational' as const,
      source: 'internal' as const,
    });
  });

  // Generate category-specific keywords
  if (category) {
    keywords.push({
      keyword: `${baseKeyword} for ${category}`,
      intent: 'commercial' as const,
      source: 'internal' as const,
    });
  }

  // Generate tag-specific keywords
  tags.forEach((tag) => {
    keywords.push({
      keyword: `${baseKeyword} ${tag}`,
      intent: 'informational' as const,
      source: 'internal' as const,
    });
  });

  return keywords;
}

// Generate question-based keywords (voice search optimization)
export function generateQuestionKeywords(baseKeyword: string): string[] {
  const questionPrefixes = [
    'what is',
    'how to',
    'why use',
    'best',
    'top',
    'which',
    'where to buy',
    'how much',
    'does',
    'can',
  ];

  return questionPrefixes.map((prefix) => `${prefix} ${baseKeyword}`);
}

// Cluster keywords by intent and relevance
export function clusterKeywords(keywords: KeywordSuggestion[]): KeywordCluster {
  if (keywords.length === 0) {
    return {
      primary: '',
      secondary: [],
      longTail: [],
      questions: [],
    };
  }

  const primary = keywords[0].keyword;
  const secondary = keywords.slice(1, 6).map((k) => k.keyword);
  const longTail = keywords.slice(6).map((k) => k.keyword);
  const questions = generateQuestionKeywords(primary);

  return {
    primary,
    secondary,
    longTail,
    questions,
  };
}

// Fetch keywords from all sources
export async function fetchAllKeywords(
  query: string,
  category?: string,
  tags: string[] = []
): Promise<KeywordSuggestion[]> {
  const [datamuse, duckduckgo, wikipedia] = await Promise.all([
    fetchDatamuseKeywords(query),
    fetchDuckDuckGoSuggestions(query),
    fetchWikipediaKeywords(query),
  ]);

  const internal = generateInternalKeywords(query, category, tags);

  // Combine and deduplicate
  const allKeywords = [...datamuse, ...duckduckgo, ...wikipedia, ...internal];
  const seen = new Set<string>();
  
  return allKeywords.filter((k) => {
    const normalized = k.keyword.toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

// Generate long tail keyword pages
export function generateLongTailPages(
  baseKeyword: string,
  category?: string
): Array<{
  path: string;
  keyword: string;
  type: 'best' | 'top' | 'cheap' | 'guide' | 'tutorial';
}> {
  const pages: Array<{
    path: string;
    keyword: string;
    type: 'best' | 'top' | 'cheap' | 'guide' | 'tutorial';
  }> = [];

  const types: Array<{ type: 'best' | 'top' | 'cheap' | 'guide' | 'tutorial'; prefix: string }> = [
    { type: 'best', prefix: 'best' },
    { type: 'top', prefix: 'top' },
    { type: 'cheap', prefix: 'cheap' },
    { type: 'guide', prefix: 'guide' },
    { type: 'tutorial', prefix: 'tutorial' },
  ];

  types.forEach(({ type, prefix }) => {
    const keyword = `${prefix} ${baseKeyword}`;
    const slug = keyword.toLowerCase().replace(/ /g, '-');
    pages.push({
      path: `/${slug}`,
      keyword,
      type,
    });
  });

  return pages;
}

// Calculate keyword difficulty (simplified)
export function calculateKeywordDifficulty(keyword: string): number {
  // In production, use real SEO API data
  // For now, estimate based on keyword length and common words
  const commonWords = ['best', 'top', 'cheap', 'free', 'online', 'download'];
  const hasCommonWord = commonWords.some((word) => keyword.toLowerCase().includes(word));
  const length = keyword.split(' ').length;

  // Shorter keywords with common words = higher difficulty
  if (length <= 2 && hasCommonWord) return 80;
  if (length <= 3 && hasCommonWord) return 60;
  if (length <= 4) return 40;
  return 20;
}

// Prioritize keywords by value
export function prioritizeKeywords(keywords: KeywordSuggestion[]): KeywordSuggestion[] {
  return keywords
    .map((k) => ({
      ...k,
      difficulty: calculateKeywordDifficulty(k.keyword),
    }))
    .sort((a, b) => {
      // Prioritize commercial intent with lower difficulty
      if (a.intent === 'commercial' && b.intent !== 'commercial') return -1;
      if (b.intent === 'commercial' && a.intent !== 'commercial') return 1;
      
      // Then by difficulty (lower is better)
      return (a.difficulty || 50) - (b.difficulty || 50);
    });
}

// Generate keyword report
export function generateKeywordReport(
  query: string,
  category?: string,
  tags: string[] = []
): Promise<{
  query: string;
  cluster: KeywordCluster;
  pages: Array<{ path: string; keyword: string; type: string }>;
  totalKeywords: number;
  prioritized: KeywordSuggestion[];
}> {
  return fetchAllKeywords(query, category, tags).then((keywords) => {
    const cluster = clusterKeywords(keywords);
    const pages = generateLongTailPages(query, category);
    const prioritized = prioritizeKeywords(keywords);

    return {
      query,
      cluster,
      pages,
      totalKeywords: keywords.length,
      prioritized,
    };
  });
}

// Batch generate keywords for multiple queries
export async function batchGenerateKeywords(
  queries: string[],
  category?: string,
  tags: string[] = []
): Promise<Map<string, ReturnType<typeof generateKeywordReport>>> {
  const results = new Map<string, any>();

  for (const query of queries) {
    const report = await generateKeywordReport(query, category, tags);
    results.set(query, report);
  }

  return results;
}

// Store keywords for later use (in production, use database)
const keywordStore = new Map<string, KeywordSuggestion[]>();

export function cacheKeywords(query: string, keywords: KeywordSuggestion[]): void {
  keywordStore.set(query.toLowerCase(), keywords);
}

export function getCachedKeywords(query: string): KeywordSuggestion[] | undefined {
  return keywordStore.get(query.toLowerCase());
}

export function clearKeywordCache(): void {
  keywordStore.clear();
}

// Get trending keywords (mock - in production, use real trends API)
export function getTrendingKeywords(limit: number = 10): string[] {
  const trending = [
    'react plugins',
    'wordpress themes',
    'laravel scripts',
    'vue components',
    'ecommerce solutions',
    'ai tools',
    'saas templates',
    'admin dashboards',
    'ui kits',
    'payment gateways',
  ];

  return trending.slice(0, limit);
}

// Generate keyword variations for SEO testing
export function generateKeywordVariations(baseKeyword: string): string[] {
  const variations: string[] = [];
  const words = baseKeyword.split(' ');

  // Swap word order
  if (words.length === 2) {
    variations.push(`${words[1]} ${words[0]}`);
  }

  // Add synonyms (simplified)
  const synonyms: Record<string, string[]> = {
    'best': ['top', 'great', 'excellent', 'premium'],
    'cheap': ['affordable', 'low-cost', 'budget', 'inexpensive'],
    'plugin': ['extension', 'addon', 'module'],
    'script': ['code', 'software', 'program'],
  };

  words.forEach((word, index) => {
    if (synonyms[word]) {
      synonyms[word].forEach((synonym) => {
        const newWords = [...words];
        newWords[index] = synonym;
        variations.push(newWords.join(' '));
      });
    }
  });

  return [...new Set(variations)];
}
