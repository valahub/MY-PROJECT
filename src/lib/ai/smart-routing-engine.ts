// Smart Routing Engine
// Route request based on cost, speed, accuracy

export interface RoutingCriteria {
  prioritizeCost?: boolean;
  prioritizeSpeed?: boolean;
  prioritizeAccuracy?: boolean;
  maxCost?: number;
  maxLatency?: number;
}

export interface ProviderMetrics {
  provider: string;
  avgLatency: number;
  avgCost: number;
  accuracy: number;
  successRate: number;
}

export class AISmartRoutingEngine {
  private metrics: Map<string, ProviderMetrics> = new Map();

  updateMetrics(provider: string, metrics: Partial<ProviderMetrics>) {
    const current = this.metrics.get(provider) || {
      provider,
      avgLatency: 0,
      avgCost: 0,
      accuracy: 0.9,
      successRate: 1,
    };

    const updated: ProviderMetrics = {
      ...current,
      ...metrics,
    };

    this.metrics.set(provider, updated);
  }

  selectProvider(providers: string[], criteria: RoutingCriteria): string | null {
    if (providers.length === 0) return null;

    const availableMetrics = providers
      .map((p) => this.metrics.get(p))
      .filter((m): m is ProviderMetrics => m !== undefined);

    if (availableMetrics.length === 0) {
      return providers[0]; // Default to first if no metrics
    }

    // Filter by constraints
    let filtered = availableMetrics;

    if (criteria.maxCost) {
      filtered = filtered.filter((m) => m.avgCost <= criteria.maxCost!);
    }

    if (criteria.maxLatency) {
      filtered = filtered.filter((m) => m.avgLatency <= criteria.maxLatency!);
    }

    if (filtered.length === 0) {
      // No provider meets constraints, return best effort
      return this.selectBestProvider(availableMetrics, criteria);
    }

    return this.selectBestProvider(filtered, criteria);
  }

  private selectBestProvider(metrics: ProviderMetrics[], criteria: RoutingCriteria): string {
    // Score each provider based on criteria
    const scored = metrics.map((m) => ({
      provider: m.provider,
      score: this.calculateScore(m, criteria),
    }));

    // Sort by score (higher is better)
    scored.sort((a, b) => b.score - a.score);

    return scored[0].provider;
  }

  private calculateScore(metrics: ProviderMetrics, criteria: RoutingCriteria): number {
    let score = 0;

    // Cost score (lower is better)
    if (criteria.prioritizeCost) {
      score += (1 - Math.min(metrics.avgCost / 0.1, 1)) * 0.4;
    } else {
      score += (1 - Math.min(metrics.avgCost / 0.1, 1)) * 0.2;
    }

    // Speed score (lower latency is better)
    if (criteria.prioritizeSpeed) {
      score += (1 - Math.min(metrics.avgLatency / 5000, 1)) * 0.4;
    } else {
      score += (1 - Math.min(metrics.avgLatency / 5000, 1)) * 0.2;
    }

    // Accuracy score (higher is better)
    if (criteria.prioritizeAccuracy) {
      score += metrics.accuracy * 0.4;
    } else {
      score += metrics.accuracy * 0.2;
    }

    // Success rate (higher is better)
    score += metrics.successRate * 0.2;

    return score;
  }

  getMetrics(provider: string): ProviderMetrics | undefined {
    return this.metrics.get(provider);
  }

  getAllMetrics(): ProviderMetrics[] {
    return Array.from(this.metrics.values());
  }
}

// Export singleton instance
export const aiSmartRoutingEngine = new AISmartRoutingEngine();
