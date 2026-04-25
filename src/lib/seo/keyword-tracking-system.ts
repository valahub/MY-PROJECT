// Keyword Tracking System
// Tracks which keywords bring traffic and adjusts meta/content accordingly

export interface KeywordData {
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  conversions: number;
  revenue: number;
  lastUpdated: string;
}

export interface KeywordPerformance {
  keyword: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  recommendation: string;
}

// Keyword tracking storage
const keywordStore = new Map<string, KeywordData>();
const keywordHistory = new Map<string, KeywordData[]>();

// Track keyword impression
export function trackImpression(keyword: string): void {
  const data = keywordStore.get(keyword) || {
    keyword,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    position: 0,
    conversions: 0,
    revenue: 0,
    lastUpdated: new Date().toISOString(),
  };

  data.impressions++;
  data.ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
  data.lastUpdated = new Date().toISOString();

  keywordStore.set(keyword, data);
  saveToHistory(keyword, data);
}

// Track keyword click
export function trackClick(keyword: string): void {
  const data = keywordStore.get(keyword) || {
    keyword,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    position: 0,
    conversions: 0,
    revenue: 0,
    lastUpdated: new Date().toISOString(),
  };

  data.clicks++;
  data.ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
  data.lastUpdated = new Date().toISOString();

  keywordStore.set(keyword, data);
  saveToHistory(keyword, data);
}

// Track keyword position
export function trackPosition(keyword: string, position: number): void {
  const data = keywordStore.get(keyword) || {
    keyword,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    position: 0,
    conversions: 0,
    revenue: 0,
    lastUpdated: new Date().toISOString(),
  };

  data.position = position;
  data.lastUpdated = new Date().toISOString();

  keywordStore.set(keyword, data);
  saveToHistory(keyword, data);
}

// Track conversion
export function trackConversion(keyword: string, revenue: number = 0): void {
  const data = keywordStore.get(keyword) || {
    keyword,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    position: 0,
    conversions: 0,
    revenue: 0,
    lastUpdated: new Date().toISOString(),
  };

  data.conversions++;
  data.revenue += revenue;
  data.lastUpdated = new Date().toISOString();

  keywordStore.set(keyword, data);
  saveToHistory(keyword, data);
}

// Save to history (keep last 30 days)
function saveToHistory(keyword: string, data: KeywordData): void {
  const history = keywordHistory.get(keyword) || [];
  history.push({ ...data });

  // Keep only last 30 data points
  if (history.length > 30) {
    history.shift();
  }

  keywordHistory.set(keyword, history);
}

// Get keyword data
export function getKeywordData(keyword: string): KeywordData | undefined {
  return keywordStore.get(keyword);
}

// Get all keyword data
export function getAllKeywordData(): KeywordData[] {
  return Array.from(keywordStore.values());
}

// Calculate keyword performance trend
export function calculateKeywordTrend(keyword: string): KeywordPerformance {
  const history = keywordHistory.get(keyword);
  if (!history || history.length < 2) {
    return {
      keyword,
      trend: 'stable',
      change: 0,
      recommendation: 'Need more data',
    };
  }

  const current = history[history.length - 1];
  const previous = history[history.length - 2];

  const ctrChange = current.ctr - previous.ctr;
  const positionChange = previous.position - current.position; // Positive = improved

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (ctrChange > 1 || positionChange > 2) {
    trend = 'up';
  } else if (ctrChange < -1 || positionChange < -2) {
    trend = 'down';
  }

  let recommendation = 'Continue current strategy';
  if (trend === 'down') {
    if (current.ctr < 1) {
      recommendation = 'Improve meta description and title';
    } else if (current.position > 10) {
      recommendation = 'Build more backlinks and improve content';
    } else {
      recommendation = 'Optimize content for this keyword';
    }
  } else if (trend === 'up') {
    recommendation = 'Scale successful strategy';
  }

  return {
    keyword,
    trend,
    change: ctrChange,
    recommendation,
  };
}

// Get top performing keywords
export function getTopKeywords(limit: number = 10, sortBy: 'ctr' | 'conversions' | 'revenue' = 'ctr'): KeywordData[] {
  const keywords = getAllKeywordData();

  return keywords
    .sort((a, b) => b[sortBy] - a[sortBy])
    .slice(0, limit);
}

// Get underperforming keywords
export function getUnderperformingKeywords(threshold: number = 1): KeywordData[] {
  const keywords = getAllKeywordData();

  return keywords.filter((k) => k.ctr < threshold && k.impressions > 100);
}

// Get high-potential keywords (high impressions, low clicks)
export function getHighPotentialKeywords(): KeywordData[] {
  const keywords = getAllKeywordData();

  return keywords.filter((k) => k.impressions > 100 && k.ctr < 2 && k.position < 20);
}

// Get keyword opportunity score
export function getKeywordOpportunityScore(keyword: string): number {
  const data = getKeywordData(keyword);
  if (!data) return 0;

  let score = 0;

  // High impressions = opportunity
  if (data.impressions > 1000) score += 30;
  else if (data.impressions > 500) score += 20;
  else if (data.impressions > 100) score += 10;

  // Low CTR = opportunity to improve
  if (data.ctr < 1 && data.impressions > 100) score += 30;
  else if (data.ctr < 2 && data.impressions > 100) score += 20;

  // Good position = easier to improve
  if (data.position < 10) score += 20;
  else if (data.position < 20) score += 10;

  // Conversions = proven value
  if (data.conversions > 0) score += 20;

  return Math.min(score, 100);
}

// Get keyword recommendations
export function getKeywordRecommendations(limit: number = 10): Array<{
  keyword: string;
  score: number;
  recommendation: string;
}> {
  const keywords = getAllKeywordData();

  return keywords
    .map((k) => ({
      keyword: k.keyword,
      score: getKeywordOpportunityScore(k.keyword),
      recommendation: calculateKeywordTrend(k.keyword).recommendation,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Adjust meta based on performance
export function suggestMetaAdjustment(keyword: string): {
  currentTitle?: string;
  suggestedTitle?: string;
  currentDescription?: string;
  suggestedDescription?: string;
  reason: string;
} {
  const data = getKeywordData(keyword);
  if (!data) {
    return { reason: 'No data available for this keyword' };
  }

  const trend = calculateKeywordTrend(keyword);
  let reason = '';

  if (trend.trend === 'down') {
    reason = 'Keyword is underperforming - suggest optimization';
  } else if (trend.trend === 'up') {
    reason = 'Keyword is performing well - maintain current strategy';
  } else {
    reason = 'Keyword performance is stable';
  }

  // In a real implementation, you would return actual current and suggested meta
  // For now, return placeholder
  return {
    reason,
  };
}

// Get keyword statistics
export function getKeywordStats(): {
  totalKeywords: number;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  averagePosition: number;
  totalConversions: number;
  totalRevenue: number;
} {
  const keywords = getAllKeywordData();

  if (keywords.length === 0) {
    return {
      totalKeywords: 0,
      totalImpressions: 0,
      totalClicks: 0,
      averageCTR: 0,
      averagePosition: 0,
      totalConversions: 0,
      totalRevenue: 0,
    };
  }

  const totalImpressions = keywords.reduce((sum, k) => sum + k.impressions, 0);
  const totalClicks = keywords.reduce((sum, k) => sum + k.clicks, 0);
  const averageCTR = totalClicks / totalImpressions * 100;
  const averagePosition = keywords.reduce((sum, k) => sum + k.position, 0) / keywords.length;
  const totalConversions = keywords.reduce((sum, k) => sum + k.conversions, 0);
  const totalRevenue = keywords.reduce((sum, k) => sum + k.revenue, 0);

  return {
    totalKeywords: keywords.length,
    totalImpressions,
    totalClicks,
    averageCTR,
    averagePosition,
    totalConversions,
    totalRevenue,
  };
}

// Get keyword ranking distribution
export function getRankingDistribution(): Record<string, number> {
  const keywords = getAllKeywordData();
  const distribution: Record<string, number> = {
    '1-3': 0,
    '4-10': 0,
    '11-20': 0,
    '21-50': 0,
    '51+': 0,
  };

  keywords.forEach((k) => {
    if (k.position <= 3) distribution['1-3']++;
    else if (k.position <= 10) distribution['4-10']++;
    else if (k.position <= 20) distribution['11-20']++;
    else if (k.position <= 50) distribution['21-50']++;
    else distribution['51+']++;
  });

  return distribution;
}

// Export keyword data
export function exportKeywordData(): string {
  return JSON.stringify({
    current: Array.from(keywordStore.entries()),
    history: Array.from(keywordHistory.entries()),
  }, null, 2);
}

// Import keyword data
export function importKeywordData(json: string): void {
  const data = JSON.parse(json);

  if (data.current) {
    data.current.forEach(([keyword, keywordData]: [string, KeywordData]) => {
      keywordStore.set(keyword, keywordData);
    });
  }

  if (data.history) {
    data.history.forEach(([keyword, history]: [string, KeywordData[]]) => {
      keywordHistory.set(keyword, history);
    });
  }
}

// Clear old history (older than 30 days)
export function clearOldHistory(): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let cleared = 0;

  keywordHistory.forEach((history, keyword) => {
    const filtered = history.filter((h) => new Date(h.lastUpdated) >= thirtyDaysAgo);
    if (filtered.length < history.length) {
      keywordHistory.set(keyword, filtered);
      cleared++;
    }
  });

  return cleared;
}

// Reset keyword data
export function resetKeywordData(): void {
  keywordStore.clear();
  keywordHistory.clear();
}

// Get keyword performance report
export function generateKeywordReport(): {
  summary: string;
  topKeywords: KeywordData[];
  underperforming: KeywordData[];
  highPotential: KeywordData[];
  recommendations: Array<{ keyword: string; score: number; recommendation: string }>;
  stats: ReturnType<typeof getKeywordStats>;
  distribution: Record<string, number>;
} {
  const stats = getKeywordStats();
  const topKeywords = getTopKeywords(10, 'conversions');
  const underperforming = getUnderperformingKeywords(1);
  const highPotential = getHighPotentialKeywords();
  const recommendations = getKeywordRecommendations(10);
  const distribution = getRankingDistribution();

  return {
    summary: `Tracking ${stats.totalKeywords} keywords with ${stats.totalImpressions} impressions and ${stats.totalClicks} clicks. Average CTR: ${stats.averageCTR.toFixed(2)}%.`,
    topKeywords,
    underperforming,
    highPotential,
    recommendations,
    stats,
    distribution,
  };
}

// Schedule periodic keyword analysis
export function scheduleKeywordAnalysis(intervalHours: number = 24): number {
  return setInterval(() => {
    const report = generateKeywordReport();
    console.log('Keyword Analysis Report:', report.summary);
  }, intervalHours * 60 * 60 * 1000) as unknown as number;
}

// Track multiple keywords at once
export function batchTrackKeywords(keywords: string[], type: 'impression' | 'click'): void {
  keywords.forEach((keyword) => {
    if (type === 'impression') {
      trackImpression(keyword);
    } else {
      trackClick(keyword);
    }
  });
}

// Get keyword competitors (placeholder - would need real SEO API)
export function getKeywordCompetitors(keyword: string): string[] {
  // In production, use SEO API to get competitors
  // For now, return empty array
  return [];
}

// Get keyword difficulty (placeholder)
export function getKeywordDifficulty(keyword: string): number {
  // In production, use SEO API to get difficulty
  // For now, estimate based on length
  const length = keyword.split(' ').length;
  return Math.min(length * 10, 100);
}

// Get keyword search volume (placeholder)
export function getKeywordSearchVolume(keyword: string): number {
  const data = getKeywordData(keyword);
  return data?.impressions || 0;
}
