// Blog Cache System
// Caching and speed optimization for blog pages

import { aiInfrastructure } from '../ai/ai-infrastructure';

export interface BlogCacheEntry {
  blogId: string;
  language: string;
  country: string;
  content: string;
  metadata: any;
  cachedAt: number;
  expiresAt: number;
  hits: number;
}

export class BlogCacheSystem {
  private cache: Map<string, BlogCacheEntry> = new Map();
  private defaultTTL: number = 3600000; // 1 hour

  // Generate cache key
  private generateCacheKey(blogId: string, language: string = 'en', country: string = 'US'): string {
    return `${blogId}-${language}-${country}`;
  }

  // Get cached blog
  get(blogId: string, language: string = 'en', country: string = 'US'): BlogCacheEntry | null {
    const key = this.generateCacheKey(blogId, language, country);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hits++;
    return entry;
  }

  // Set cached blog
  set(
    blogId: string,
    content: string,
    metadata: any,
    language: string = 'en',
    country: string = 'US',
    ttl: number = this.defaultTTL
  ): void {
    const key = this.generateCacheKey(blogId, language, country);
    const entry: BlogCacheEntry = {
      blogId,
      language,
      country,
      content,
      metadata,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttl,
      hits: 0,
    };

    this.cache.set(key, entry);
  }

  // Invalidate cache for a blog
  invalidate(blogId: string): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.blogId === blogId) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  // Invalidate all cache
  invalidateAll(): void {
    this.cache.clear();
  }

  // Clear expired entries
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  // Get cache statistics
  getStats(): {
    totalEntries: number;
    totalHits: number;
    expiredEntries: number;
    hitRate: number;
  } {
    const now = Date.now();
    let totalHits = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      if (now > entry.expiresAt) {
        expiredEntries++;
      }
    }

    const totalEntries = this.cache.size;
    const hitRate = totalEntries > 0 ? totalHits / totalEntries : 0;

    return {
      totalEntries,
      totalHits,
      expiredEntries,
      hitRate,
    };
  }

  // Pre-warm cache for popular blogs
  async preWarmCache(blogIds: string[], fetchFn: (id: string) => Promise<{ content: string; metadata: any }>) {
    for (const blogId of blogIds) {
      try {
        const data = await fetchFn(blogId);
        this.set(blogId, data.content, data.metadata);
      } catch (error) {
        console.error(`[BlogCacheSystem] Failed to pre-warm cache for ${blogId}`);
      }
    }
  }
}

// Export singleton instance
export const blogCacheSystem = new BlogCacheSystem();
