// AI Analytics Dashboard (Backend)
// Show API usage, success rate, cost

export interface AIAnalytics {
  provider: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCost: number;
  avgLatency: number;
  avgTokensPerRequest: number;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export class AIAnalyticsDashboard {
  private analytics: Map<string, AIAnalytics[]> = new Map();
  private requestHistory: Array<{
    provider: string;
    success: boolean;
    cost: number;
    latency: number;
    tokens: number;
    timestamp: number;
  }> = [];

  recordRequest(provider: string, success: boolean, cost: number, latency: number, tokens: number) {
    this.requestHistory.push({
      provider,
      success,
      cost,
      latency,
      tokens,
      timestamp: Date.now(),
    });

    // Keep only last 10000 requests
    if (this.requestHistory.length > 10000) {
      this.requestHistory = this.requestHistory.slice(-10000);
    }
  }

  getAnalytics(provider: string, period: AIAnalytics['period'] = 'daily'): AIAnalytics {
    const now = Date.now();
    const periodMs = this.getPeriodMs(period);
    const cutoff = now - periodMs;

    const relevantRequests = this.requestHistory.filter(
      (r) => r.provider === provider && r.timestamp > cutoff
    );

    const totalRequests = relevantRequests.length;
    const successfulRequests = relevantRequests.filter((r) => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const totalCost = relevantRequests.reduce((sum, r) => sum + r.cost, 0);
    const avgLatency = totalRequests > 0
      ? relevantRequests.reduce((sum, r) => sum + r.latency, 0) / totalRequests
      : 0;
    const avgTokensPerRequest = totalRequests > 0
      ? relevantRequests.reduce((sum, r) => sum + r.tokens, 0) / totalRequests
      : 0;

    return {
      provider,
      totalRequests,
      successfulRequests,
      failedRequests,
      totalCost,
      avgLatency,
      avgTokensPerRequest,
      period,
    };
  }

  getAllAnalytics(period: AIAnalytics['period'] = 'daily'): AIAnalytics[] {
    const providers = [...new Set(this.requestHistory.map((r) => r.provider))];
    return providers.map((p) => this.getAnalytics(p, period));
  }

  getSuccessRate(provider: string, period: AIAnalytics['period'] = 'daily'): number {
    const analytics = this.getAnalytics(provider, period);
    return analytics.totalRequests > 0
      ? analytics.successfulRequests / analytics.totalRequests
      : 1;
  }

  getTotalCost(period: AIAnalytics['period'] = 'daily'): number {
    const allAnalytics = this.getAllAnalytics(period);
    return allAnalytics.reduce((sum, a) => sum + a.totalCost, 0);
  }

  getTopProviders(period: AIAnalytics['period'] = 'daily', limit: number = 5): Array<{
    provider: string;
    requests: number;
  }> {
    const allAnalytics = this.getAllAnalytics(period);
    return allAnalytics
      .map((a) => ({ provider: a.provider, requests: a.totalRequests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, limit);
  }

  private getPeriodMs(period: AIAnalytics['period']): number {
    switch (period) {
      case 'hourly':
        return 3600000; // 1 hour
      case 'daily':
        return 86400000; // 24 hours
      case 'weekly':
        return 604800000; // 7 days
      case 'monthly':
        return 2592000000; // 30 days
    }
  }
}

// Export singleton instance
export const aiAnalyticsDashboard = new AIAnalyticsDashboard();
